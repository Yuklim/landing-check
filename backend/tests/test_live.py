# -*- coding: utf-8 -*-
"""真实数据层（live.py / tripmcp.py）：用 tests/fixtures/mcp 里存下的真实 MCP 响应，不联网。"""
import os, io, json, copy, threading, time
from datetime import date, datetime

import pytest

import live, tripmcp, rules
from mock import shift_weeks

HERE = os.path.dirname(os.path.abspath(__file__))
FIX = os.path.join(HERE, 'fixtures', 'mcp')
TRIP = json.load(open(os.path.join(HERE, '..', 'mock', 'trip.json'), encoding='utf-8'))


def raw(tool):
    return json.load(open(os.path.join(FIX, tool + '.json'), encoding='utf-8'))


def fake_caller(calls=None, fail=()):
    def call(tool, args):
        if calls is not None:
            calls.append(tool)
        if tool in fail:
            raise tripmcp.McpError('请求失败')
        return raw(tool)
    return call


def trip():
    return copy.deepcopy(TRIP)


@pytest.fixture
def store(tmp_path):
    return live.LiveStore(snapshot_path=str(tmp_path / 'snap.json'), ttl=3600, caller=fake_caller())


@pytest.fixture
def on(monkeypatch):
    monkeypatch.setenv('LC_LIVE', 'on')


# ---------------- 归一化 ----------------
def test_flight_finds_the_booked_flight_number():
    f = live.n_flight(trip(), raw('query_flight'))
    assert f['number'] == 'UA 857' and f['departure'].endswith('13:00') and f['arrival'].endswith('17:25')
    assert f['to_airport'] == 'PVG' and f['to_terminal'] == 'T2' and f['duration_min'] == 805


def test_flight_not_in_results_raises():
    t = trip(); t['flight']['number'] = 'UA 999'
    with pytest.raises(tripmcp.McpError):
        live.n_flight(t, raw('query_flight'))


def test_hotel_address_phone_and_distance():
    h = live.n_hotel(trip(), raw('query_hotel'))
    assert h['name_zh'] == '上海璞丽' and h['address_zh'] == '静安区常德路1号'
    assert h['phone'] == '021 3203 9999'                       # 携程给 8 位号码，按城市补区号
    assert h['landmark_zh'] == '靠近静安寺、南京西路'
    assert 30 <= h['distance_km'] <= 40                         # 浦东机场到静安直线约 35 km（原模拟数据写的 18）


def test_hotel_query_strips_city_prefix():
    tool, args = live.q_hotel(trip())
    assert tool == 'query_hotel' and args['cityName'] == '上海' and args['hotelName'] == '璞丽酒店'
    assert args['checkOutDate'] == TRIP['hotel']['checkout']


HOURS = raw('query_ticket')[0]['ticketExtendInfo']['openTimeInfo']['unFormatOpenTime']


@pytest.mark.parametrize('visit, open_, close, last, closed', [
    ('2026-10-14', '08:30', '17:00', '16:00', False),           # 周三，旺季
    ('2026-10-19', '08:30', '17:00', '16:00', True),            # 周一闭馆
    ('2026-12-02', '08:30', '16:30', '15:30', False),           # 淡季
    ('2027-02-10', '08:30', '16:30', '15:30', False),           # 淡季跨年（11 月 1 日 - 次年 3 月 31 日）
])
def test_palace_museum_hours(visit, open_, close, last, closed):
    h = live.parse_hours(HOURS, visit)
    assert (h['open'], h['close'], h['last_entry'], h['closed_on_visit']) == (open_, close, last, closed)
    assert h['closed_weekdays'] == ['Mon'] and h['note']


def test_weekday_ranges():
    assert live._weekdays('周二–周日') == {1, 2, 3, 4, 5, 6}
    assert live._weekdays('周一') == {0}
    assert live._weekdays('周六-周一') == {5, 6, 0}


@pytest.mark.parametrize('name, desc, id_only, foreigner', [
    ('故宫成人票', '凭「身份证」直接验证使用', True, False),
    ('故宫成人票', '凭「有效证件」直接验证使用', False, False),
    ('故宫成人票', '凭「联系人手机或身份证或携程订单号或预留姓名」直接验证使用', False, False),
    ('东方明珠二球观光成人票(非中国大陆籍)-不限场次', '凭「有效证件+电子凭证」直接验证使用', False, True),
])
def test_ticket_products_usable_with_a_passport(name, desc, id_only, foreigner):
    p = live.classify_product({'name': name, 'descDetail': desc, 'price': 60})
    assert p['id_card_only'] is id_only and p['for_foreigners'] is foreigner


def test_ticket_summary_counts_passport_options():
    t = live.n_ticket(TRIP['tickets'][0], raw('query_ticket'))
    assert t['name_zh'] == '故宫博物院' and t['level'] == '5A'
    assert t['products'] == t['passport_ok'] + t['id_card_only'] and t['id_card_only'] > 0
    assert t['english_guided_from'] and t['hours_text_zh'] == HOURS


def test_content_notes_normalized_and_poi_tags_stripped():
    c = live.n_content(trip(), raw('query_content'))
    assert c['city_zh'] == '上海' and c['count'] == len(raw('query_content')) and len(c['notes']) == c['count']
    n = c['notes'][0]
    assert n['title'] and n['author'] and n['link'] and isinstance(n['likes'], int)
    assert '<poi' not in n['summary'] and len(n['summary']) <= 140          # 正文里的 <poi> 标签被剥掉，摘要有长度上限
    assert all('id' in p and p['name'] for p in n['pois'])


def test_content_empty_raises():
    with pytest.raises(tripmcp.McpError):
        live.n_content(trip(), [])


def test_car_groups_use_typical_price_and_flag_promos():
    c = live.n_car(trip(), raw('car_rental'))
    typ = [g['typical_price'] for g in c['groups']]
    assert typ == sorted(typ) and c['total'] == sum(g['count'] for g in c['groups'])
    assert all(g['name_en'] for g in c['groups'])
    for g in c['groups']:
        assert g['promo'] == (g['from_price'] < g['typical_price'] * 0.3)
    # car_rental 不接受机场参数，取车点固定给虹桥：落地浦东的用户要提示
    assert c['pickup_zh'] == '虹桥国际机场' and c['pickup_matches_airport'] is False
    assert c['pickup_time'] == '2026-10-12 09:00' and c['days'] == 3          # 07:40 落地 → 一小时后整点


def test_next_leg_only_when_ticket_city_differs_and_nothing_booked():
    leg = live.next_leg(trip())
    assert leg['from_zh'] == '上海' and leg['to_zh'] == '北京' and leg['date'] == TRIP['hotel']['checkout']
    t = trip(); t['intercity_booked'] = True
    assert live.next_leg(t) is None
    t = trip(); t['tickets'][0]['city_zh'] = '上海'
    assert live.next_leg(t) is None


def test_trains_pick_three_fastest_after_checkout():
    tr = live.n_train(trip(), raw('query_train'), now=datetime(2026, 10, 1))
    picked = tr['trains']
    assert len(picked) == 3 and all('09:00' <= x['dep'] <= '15:00' for x in picked)
    assert [x['duration_min'] for x in picked] == sorted(x['duration_min'] for x in picked)
    assert picked[0]['from_en'] == 'Shanghai Hongqiao' and picked[0]['to_en'] == 'Beijing South' and picked[0]['second_class']
    assert tr['on_sale_from'] is None                           # 10-13 的票 14 天前已开售


def test_trains_report_when_sale_opens():
    tr = live.n_train(trip(), raw('query_train'), now=datetime(2026, 9, 1))
    assert tr['on_sale_from'] == '2026-09-29 13:45'             # ControlDay 14 + SaleTime 13:45


# ---------------- 缓存与兜底 ----------------
def test_store_live_then_cached(store):
    calls = []
    store.call = fake_caller(calls)
    e = store.get('hotel', trip(), wait=True)
    assert e['source'] == 'live' and e['data']['name_zh'] == '上海璞丽'
    store.get('hotel', trip(), wait=True)
    assert calls == ['query_hotel']                             # TTL 内不再调


def test_store_falls_back_to_snapshot_then_nothing(tmp_path):
    s = live.LiveStore(snapshot_path=str(tmp_path / 'none.json'), caller=fake_caller(fail=('query_hotel',)))
    assert s.get('hotel', trip(), wait=True) is None and 'hotel' in s.errors
    assert s.status()['hotel']['source'] == 'mock'
    good = live.LiveStore(snapshot_path=str(tmp_path / 'snap.json'), caller=fake_caller())
    good.get('hotel', trip(), wait=True)
    good.save_snapshot()
    snap = json.load(open(tmp_path / 'snap.json', encoding='utf-8'))
    assert set(snap['hotel']) == {'fetched_at', 'query', 'data'}
    s2 = live.LiveStore(snapshot_path=str(tmp_path / 'snap.json'), caller=fake_caller(fail=('query_hotel',)))
    e = s2.get('hotel', trip(), wait=True)
    assert e['source'] == 'snapshot' and e['data']['phone'] == '021 3203 9999'


def test_concurrent_refresh_calls_mcp_once(store):
    calls = []

    def slow(tool, args):
        calls.append(tool); time.sleep(0.3); return raw(tool)
    store.call = slow
    ts = [threading.Thread(target=store.refresh, args=('hotel', trip())) for _ in range(3)]
    [t.start() for t in ts]; [t.join() for t in ts]
    assert calls == ['query_hotel'] and store.cache['hotel']['data']['name_zh'] == '上海璞丽'


# ---------------- 合并进行程和规则 ----------------
def test_enrich_keeps_trip_dates_and_uses_real_times(on, store):
    t = live.enrich(trip(), store, wait=True)
    # 夹具是 10-22 出发的查询结果，行程是 10-11：日期以行程为准，只取时刻和跨天
    assert t['flight']['scheduled_departure'] == '2026-10-11 13:00' and t['flight']['scheduled_arrival'] == '2026-10-12 17:25'
    assert t['hotel']['address_zh'] == '静安区常德路1号' and t['hotel']['distance_basis'] == 'straight line'
    assert t['tickets'][0]['rules']['hours']['last_entry'] == '16:00'
    assert t['car_offer']['pickup_time'] == '2026-10-12 19:00'            # 按真实落地时间 17:25 推
    assert t['next_leg']['trains'] and set(t['live']) == {'flight', 'hotel', 'tickets', 'car', 'train', 'content'}
    assert t['content']['city_zh'] == '上海' and t['content']['notes'][0]['title']


def test_enrich_is_a_noop_when_disabled(monkeypatch, store):
    monkeypatch.setenv('LC_LIVE', 'off')
    assert live.enrich(trip(), store, wait=True) == trip()


def test_preflight_with_live_data(on, store):
    r = rules.preflight(live.enrich(trip(), store, wait=True), today=date(2026, 10, 1))
    by = {i['id']: i for i in r['items']}
    assert by['car']['desc'].startswith('Economy about ¥') and 'cars in Shanghai on Trip.com' in by['car']['desc']
    assert by['tickets']['desc'] == 'Confirmed · Wed Oct 14 · 08:30–11:00 · passport · last entry 16:00, closed Mondays'
    assert by['nextleg']['status'] == 'optional' and by['nextleg']['title'] == 'Shanghai → Beijing · optional'
    assert 'high-speed trains on Tue Oct 13' in by['nextleg']['desc']
    assert r['summary'] == '4 of 6 ready · 2 to do · 3 optional'        # 下一程只提醒，不计入必做


def test_ticket_on_a_closed_day_becomes_a_todo(on, store):
    t = trip(); t['tickets'][0]['date'] = '2026-10-19'                   # 周一
    by = {i['id']: i for i in rules.preflight(live.enrich(t, store, wait=True), today=date(2026, 10, 1))['items']}
    assert by['tickets']['status'] == 'todo' and by['tickets']['action'] == 'change_ticket'
    assert by['tickets']['desc'].startswith('Closed on Mondays · your visit on Mon Oct 19')


def test_transport_uses_real_landing_time_and_distance(on, store):
    r = rules.transport(live.enrich(trip(), store, wait=True))
    assert r['landed_at'] == '17:25' and 'Hotel 35 km' in r['facts']


# ---------------- 接口 ----------------
@pytest.fixture
def client(on, monkeypatch, store):
    import app as A
    from fastapi.testclient import TestClient
    monkeypatch.setattr(A, 'live_store', store)
    monkeypatch.setenv('TRIP_MCP_TOKEN', 'secret-token-xyz')
    live.enrich(A.trip.get_trip(), store, wait=True)                     # 预热，后续请求走缓存
    return TestClient(A.app)


def test_live_endpoints(client):
    st = client.get('/live/status').json()
    assert st['token'] is True and all(b['source'] == 'live' for b in st['blocks'].values())
    assert 'secret-token-xyz' not in json.dumps(st) and 'secret-token-xyz' not in client.get('/health').text
    assert client.get('/live/hotel').json()['data']['name_zh'] == '上海璞丽'
    assert client.get('/live/nope').status_code == 404
    f = client.get('/mock/flight').json()
    assert f['scheduled_arrival'].endswith('17:25') and f['live']['source'] == 'live' and f['status'] == 'scheduled'


def test_booking_the_train_clears_the_reminder(client):
    assert any(i['id'] == 'nextleg' for i in client.get('/rules/preflight').json()['items'])
    r = client.post('/rules/preflight/done', json={'item': 'train'}).json()
    assert not any(i['id'] == 'nextleg' for i in r['items'])


def test_live_endpoints_off(monkeypatch):
    import app as A
    from fastapi.testclient import TestClient
    monkeypatch.setenv('LC_LIVE', 'off')
    c = TestClient(A.app)
    assert c.get('/live/hotel').status_code == 409 and c.post('/live/refresh').status_code == 409
    assert 'live' not in c.get('/mock/trip').json()


# ---------------- MCP 客户端 ----------------
class _Resp(io.BytesIO):
    def __enter__(self): return self
    def __exit__(self, *a): return False


def test_tripmcp_parses_sse_and_server_errors(monkeypatch):
    monkeypatch.setenv('TRIP_MCP_TOKEN', 't')
    monkeypatch.setattr(tripmcp, 'MIN_INTERVAL', 0)
    sent = {}

    def urlopen(req, timeout):
        sent['auth'] = req.headers.get('Authorization'); sent['body'] = json.loads(req.data)
        text = sent.get('next', '[{"a": 1}]')
        msg = json.dumps({'result': {'content': [{'type': 'text', 'text': text}]}, 'jsonrpc': '2.0', 'id': 1}, ensure_ascii=False)
        return _Resp(('event: message\ndata: ' + msg + '\n\n').encode('utf-8'))
    monkeypatch.setattr(tripmcp.urllib.request, 'urlopen', urlopen)
    assert tripmcp.call('query_hotel', {'cityName': '上海'}) == [{'a': 1}]
    assert sent['auth'] == 'Bearer t' and sent['body']['method'] == 'tools/call' and sent['body']['params']['arguments'] == {'cityName': '上海'}
    sent['next'] = json.dumps([{'content': '一下船 就到海边'}], ensure_ascii=False)   # 笔记正文里原样出现的 U+2028
    assert tripmcp.call('query_content', {'city': '上海'}) == [{'content': '一下船 就到海边'}]
    sent['next'] = '请求失败'
    with pytest.raises(tripmcp.McpError, match='请求失败'):
        tripmcp.call('query_hotel', {})


def test_tripmcp_without_token(monkeypatch, tmp_path):
    monkeypatch.delenv('TRIP_MCP_TOKEN', raising=False)
    monkeypatch.setattr(tripmcp, 'HERE', str(tmp_path))
    with pytest.raises(tripmcp.McpError, match='no token'):
        tripmcp.call('query_hotel', {})
    (tmp_path / '.env').write_text('DEEPSEEK_API_KEY=x\nTRIP_MCP_TOKEN="abc"\n', encoding='utf-8')
    assert tripmcp.token() == 'abc'


# ---------------- 演示日期平移 ----------------
def test_shift_weeks_moves_trip_into_the_future_keeping_weekdays(monkeypatch):
    monkeypatch.setenv('LC_DEMO_SHIFT', 'auto')
    t = shift_weeks(trip(), today=date(2026, 10, 16))
    dep = date.fromisoformat(t['flight']['scheduled_departure'][:10])
    assert dep > date(2026, 10, 16) and t['demo_shift_days'] % 7 == 0
    for a, b in ((TRIP['flight']['scheduled_departure'], t['flight']['scheduled_departure']), (TRIP['tickets'][0]['date'], t['tickets'][0]['date']),
                 (TRIP['hotel']['checkout'], t['hotel']['checkout'])):
        assert date.fromisoformat(a[:10]).weekday() == date.fromisoformat(b[:10]).weekday() and a[10:] == b[10:]
    assert shift_weeks(trip(), today=date(2026, 10, 1)) == trip()        # 还没过期就不动
    monkeypatch.setenv('LC_DEMO_SHIFT', '0')
    assert shift_weeks(trip(), today=date(2026, 10, 16)) == trip()
