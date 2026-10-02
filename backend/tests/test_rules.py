# -*- coding: utf-8 -*-
import os, sys, json, copy
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from datetime import date
import rules
from fastapi.testclient import TestClient
from app import app, trip

c = TestClient(app)
TRIP = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'mock', 'trip.json'), encoding='utf-8'))


def t(**over):
    d = copy.deepcopy(TRIP)
    for k, v in over.items():
        if isinstance(v, dict) and isinstance(d.get(k), dict):
            d[k].update(v)
        else:
            d[k] = v
    return d


# ---- 行前检查 ----
def test_preflight_initial_state():
    r = rules.preflight(t(), today=date(2026, 9, 24))
    by = {i['id']: i for i in r['items']}
    assert by['data']['status'] == 'todo' and by['alipay']['status'] == 'todo'
    assert by['permissions']['status'] == 'done' and by['passport']['status'] == 'done' and by['pack']['status'] == 'done'
    assert by['transfer']['status'] == 'optional' and by['car']['status'] == 'optional'
    assert r['ready'] == 4 and r['required'] == 6 and r['pct'] == 67
    assert r['summary'] == '4 of 6 ready · 2 to do · 2 optional'


def test_preflight_done_marks_and_payment():
    r = rules.preflight(t(payment={'status': 'verified', 'verified_at': '2026-09-24 14:02:00'}, esim={'bought': True}), today=date(2026, 9, 24))
    assert r['ready'] == 6 and r['pct'] == 100
    by = {i['id']: i for i in r['items']}
    assert 'Verified' in by['alipay']['desc'] and by['alipay']['action'] is None


def test_preflight_passport_expiring_soon():
    r = rules.preflight(t(passport={'valid_until': '2026-12-01'}), today=date(2026, 9, 24))
    by = {i['id']: i for i in r['items']}
    assert by['passport']['status'] == 'todo'


def test_preflight_booked_transfer_is_done():
    by = {i['id']: i for i in rules.preflight(t(transfer_booked=True))['items']}
    assert by['transfer']['status'] == 'done' and by['transfer']['action'] is None and 'wait' in by['transfer']['desc']


def test_preflight_passport_boundary_uses_days():
    by = {i['id']: i for i in rules.preflight(t(passport={'valid_until': '2027-04-01'}), today=date(2026, 10, 15))['items']}
    assert by['passport']['status'] == 'todo'          # 168 天，不足半年


def test_night_uses_metro_last_train():
    assert rules._is_night('22:10', {'last': '22:00', 'first': '06:00'}) is True
    assert rules._is_night('21:30', {'last': '22:00', 'first': '06:00'}) is False
    assert rules._is_night('05:30', {'last': '22:00', 'first': '06:00'}) is True


def test_http_done_marks_affect_desc_and_unknown_airport_falls_back():
    c.post('/rules/preflight/done', json={'item': 'transfer'})
    by = {i['id']: i for i in c.get('/rules/preflight').json()['items']}
    assert by['transfer']['status'] == 'done' and by['transfer']['action'] is None
    r = c.get('/rules/transport?airport=XXX&landed_at=14:20').json()
    assert r['airport'] == 'PVG'
    assert c.get('/rules/transport?landed_at=abc').status_code == 400


# ---- 交通推荐 ----
def test_transport_default_is_taxi_because_two_bags():
    r = rules.transport(t())
    assert r['recommended']['id'] == 'taxi' and r['night'] is False
    assert [a['id'] for a in r['alternatives']] == ['metro', 'didi']
    assert 'Landed 14:20' in r['facts'] and r['recommended']['price'] == '¥160–200'


def test_transport_night_landing_taxi_with_transfer_alt():
    r = rules.transport(t(), landed_at='23:40')
    assert r['night'] is True and r['recommended']['id'] == 'taxi'
    assert 'stopped for the night' in r['recommended']['why']
    assert r['alternatives'][0]['id'] == 'transfer'


def test_transport_light_luggage_recommends_metro():
    r = rules.transport(t(flight={'checked_bags': 1, 'adults': 1}))
    assert r['recommended']['id'] == 'metro' and r['recommended']['price'] == '¥7'
    assert 'Jing\'an Temple' in r['recommended']['why']


def test_transport_booked_transfer_wins():
    r = rules.transport(t(transfer_booked=True), landed_at='23:40')
    assert r['recommended']['id'] == 'transfer'


def test_transport_hotel_far_from_metro():
    r = rules.transport(t(flight={'checked_bags': 1, 'adults': 1}, hotel={'nearest_metro': {'name': 'X', 'line': '2', 'walk_m': 1500}}))
    assert r['recommended']['id'] == 'taxi' and '1500 m' in r['recommended']['why']


def test_transport_rain_light_luggage():
    r = rules.transport(t(flight={'checked_bags': 1, 'adults': 1}), weather='rain')
    assert r['recommended']['id'] == 'taxi' and 'raining' in r['recommended']['why']


# ---- HTTP ----
def test_http_preflight_and_done_flow():
    trip.reset()
    r = c.get('/rules/preflight').json()
    assert r['ready'] == 4
    assert c.post('/rules/preflight/done', json={'item': 'esim'}).status_code == 200
    assert c.get('/rules/preflight').json()['ready'] == 5
    assert c.post('/rules/preflight/done', json={'item': 'bogus'}).status_code == 400


def test_http_transport_override():
    r = c.get('/rules/transport?landed_at=23:40').json()
    assert r['recommended']['id'] == 'taxi' and r['night'] is True
    r2 = c.get('/rules/transport?bags=1&adults=1&landed_at=14:20').json()
    assert r2['recommended']['id'] == 'metro'


def test_transport_has_go_to_location():
    r = rules.transport(t(transfer_booked=True))
    assert r['recommended']['go_to']['title'] == 'Meet your driver' and 'Exit 8' in r['recommended']['go_to']['where']
    r2 = rules.transport(t())
    assert 'Exit 9' in r2['recommended']['go_to']['where']


def test_http_transport_honors_booked_transfer_mark():
    trip.reset()
    c.post('/rules/preflight/done', json={'item': 'transfer'})
    r = c.get('/rules/transport').json()
    assert r['recommended']['id'] == 'transfer' and r['recommended']['go_to']['title'] == 'Meet your driver'
