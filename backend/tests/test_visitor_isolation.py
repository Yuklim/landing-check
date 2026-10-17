# -*- coding: utf-8 -*-
"""按访问者隔离模拟行程：评委扫码 / 多台设备同时体验时互不影响。"""
from fastapi.testclient import TestClient

from app import app, trip, trips
from mock import MockTrip, TripStore

c = TestClient(app)
A = {'X-LC-Visitor': 'visitor-aaaa-1111'}
B = {'X-LC-Visitor': 'visitor-bbbb-2222'}


def test_progress_is_per_visitor():
    c.post('/mock/flight/land', headers=A)
    c.post('/rules/preflight/done', json={'item': 'esim'}, headers=A)
    c.post('/mock/consent', json={'location': True}, headers=A)
    assert c.get('/mock/flight', headers=A).json()['status'] == 'landed'
    assert c.get('/mock/flight', headers=B).json()['status'] == 'scheduled'
    assert c.get('/mock/consent', headers=B).json()['consent'] is None
    assert [e['event'] for e in c.get('/mock/timeline', headers=B).json()] == []
    # 没带 ID 的旧请求用共用的那份，也不受访问者影响
    assert c.get('/mock/flight').json()['status'] == 'scheduled'
    assert trip.flight_status == 'scheduled'


def test_reset_only_clears_own_visitor():
    for h in (A, B):
        c.post('/mock/flight/land', headers=h)
    c.post('/mock/reset', headers=A)
    assert c.get('/mock/flight', headers=A).json()['status'] == 'scheduled'
    assert c.get('/mock/flight', headers=B).json()['status'] == 'landed'


def test_rules_use_visitor_state():
    c.post('/rules/preflight/done', json={'item': 'transfer'}, headers=A)
    done_a = c.get('/rules/preflight', headers=A).json()
    done_b = c.get('/rules/preflight', headers=B).json()
    assert done_a != done_b
    c.post('/mock/flight/land', headers=A)
    assert c.get('/rules/transport', headers=A).status_code == 200


def test_invalid_visitor_id_falls_back_to_shared():
    for bad in ('short', 'has space in id', 'x' * 65, '../../etc'):
        assert trips.get(bad) is trip
    c.post('/mock/flight/land', headers={'X-LC-Visitor': 'bad id!'})
    assert trip.flight_status == 'landed'
    assert len(trips) == 0


def test_store_evicts_least_recently_used():
    store = TripStore(default=MockTrip(), max_visitors=2)
    a, b = store.get('visitor-a-0001'), store.get('visitor-b-0002')
    assert store.get('visitor-a-0001') is a          # 用过一次 a，b 变成最久没用
    store.get('visitor-c-0003')
    assert len(store) == 2
    assert store.get('visitor-a-0001') is a
    assert store.get('visitor-b-0002') is not b     # b 被淘汰，重新建了一份


def test_cors_allows_visitor_header():
    r = c.options('/mock/trip', headers={'Origin': 'https://yuklim.github.io', 'Access-Control-Request-Method': 'GET',
                                         'Access-Control-Request-Headers': 'x-lc-visitor'})
    assert r.status_code == 200
    assert 'x-lc-visitor' in r.headers.get('access-control-allow-headers', '').lower()
