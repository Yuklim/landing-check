# -*- coding: utf-8 -*-
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from fastapi.testclient import TestClient
from app import app, kb, trip

c = TestClient(app)


def test_root_and_health():
    assert c.get('/health').json()['ok'] is True
    r = c.get('/').json()
    assert r['entries'] >= 8 and 'alipay' in r['scenarios']


def test_entry_lookup_and_localize_fallback():
    r = c.get('/kb/entry/alipay_card_bind_failed?lang=ja').json()
    assert r['id'] == 'alipay_card_bind_failed'
    assert r['lang'] == 'en' and r['translated'] is False   # 还没有日文翻译时回落到英文
    assert 1 <= len(r['steps']) <= 4
    assert c.get('/kb/entry/nope').status_code == 404


def test_query_by_scenario_and_stage():
    rows = c.get('/kb/entries?scenario=alipay&stage=preflight').json()
    ids = {e['id'] for e in rows}
    assert 'alipay_setup_before_flight' in ids
    assert all(e['stage'] in ('preflight', 'anytime') for e in rows)
    assert c.get('/kb/entries?scenario=nope').status_code == 404


def test_search_and_keyword_match():
    rows = c.get('/kb/search?q=card%20declined').json()
    assert rows and rows[0]['id'] in ('alipay_payment_declined', 'alipay_card_bind_failed')
    m = kb.match_keywords('银行卡 验证失败 Alipay')
    assert m and m[0]['scenario'] == 'alipay'


def test_feedback_stats():
    assert c.post('/kb/feedback', json={'entry_id': 'alipay_tourcard', 'solved': True}).status_code == 200
    c.post('/kb/feedback', json={'entry_id': 'alipay_tourcard', 'solved': False})
    s = c.get('/kb/stats').json()['alipay_tourcard']
    assert s['solved'] == 1 and s['unsolved'] == 1 and s['solve_rate'] == 0.5
    assert c.post('/kb/feedback', json={'entry_id': 'nope', 'solved': True}).status_code == 404


def test_flight_state_machine_and_timeline():
    c.post('/mock/reset')
    assert c.get('/mock/flight').json()['status'] == 'scheduled'
    c.post('/mock/flight/depart')
    assert c.get('/mock/flight').json()['status'] == 'departed'
    r = c.post('/mock/flight/land').json()
    assert r['status'] == 'landed' and r['landed_at']
    c.post('/mock/event', json={'event': 'online'})
    assert c.post('/mock/event', json={'event': 'bogus'}).status_code == 400
    tl = c.get('/mock/timeline').json()
    assert [e['event'] for e in tl] == ['landed', 'online']


def test_pay_test_success_and_failure():
    trip.reset()
    ok = c.post('/mock/pay-test').json()
    assert ok['status'] == 'verified' and ok['tx'].startswith('TRIP') and ok['refund'] == 'issued'
    assert c.get('/mock/trip').json()['payment']['status'] == 'verified'
    bad = c.post('/mock/pay-test?fail=1').json()
    assert bad['status'] == 'failed' and bad['entry_id'] == 'alipay_card_bind_failed'
    assert c.get('/kb/entry/%s' % bad['entry_id']).status_code == 200
