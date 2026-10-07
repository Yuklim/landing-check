# -*- coding: utf-8 -*-
"""TenPayGo 接入：支付组规则、验证接口、知识库、识别兜底。对应 docs/tenpaygo/02-PRD.md 的验收标准。"""
import os, sys, json, copy, functools
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from datetime import date
import pytest
from fastapi.testclient import TestClient
import rules
import stuck
import mock
from app import app, kb, trip
from mock import MockTrip, PAY_ERRORS
from rules import PAY_METHODS

c = TestClient(app)
HERE = os.path.dirname(os.path.abspath(__file__))
TRIP = json.load(open(os.path.join(HERE, '..', 'mock', 'trip.json'), encoding='utf-8'))
H5 = os.path.normpath(os.path.join(HERE, '..', '..', 'h5'))
D = date(2026, 10, 10)
AT = {'alipay': '2026-10-10 08:31:00', 'tenpaygo': '2026-10-10 09:05:00'}


@pytest.fixture(autouse=True)
def _fast_pay(monkeypatch):
    """模拟支付固定等 1.5 秒，这里去掉等待。"""
    monkeypatch.setattr(trip, 'pay_test', functools.partial(MockTrip.pay_test, trip, delay=0))


def with_payments(verified, at=AT, **over):
    t = copy.deepcopy(TRIP)
    t['payments'] = {m: {'method': m, 'status': 'verified' if m in verified else 'not_verified',
                         'verified_at': at[m] if m in verified else None} for m in PAY_METHODS}
    t.update(over)
    return t


def by_id(r):
    return {i['id']: i for i in r['items']}


# ---------------- 规则：支付组 ----------------
def test_initial_state_keeps_summary_and_both_rows_todo():
    r = rules.preflight(copy.deepcopy(TRIP), today=D)
    b = by_id(r)
    ids = [i['id'] for i in r['items']]
    assert ids.index('tenpaygo') == ids.index('alipay') + 1                 # 紧跟支付宝一行
    assert b['alipay']['status'] == 'todo' and b['tenpaygo']['status'] == 'todo'
    assert r['summary'] == '4 of 6 ready · 2 to do · 2 optional'            # 与设计稿、exports 一致
    assert r['required'] == 6 and r['backup_open'] == 0
    assert r['payment'] == {'ready': False, 'primary': None, 'primary_name': None, 'verified': [], 'verified_at': None,
                            'methods': ['alipay', 'tenpaygo'], 'title': 'Payment in China', 'backup': None,
                            'desc': 'Alipay or TenPayGo · either one is enough · ¥1 test, refunded in 24 h'}
    assert b['alipay']['desc'] == 'Installed · not verified yet · ¥1 test, refunded in 24 h'
    assert b['tenpaygo']['desc'] == 'Not installed · either one is enough · email sign-up, no Chinese number'
    assert b['tenpaygo']['group'] == 'payment' and b['tenpaygo']['entry'] == 'tenpaygo_setup_before_flight'


@pytest.mark.parametrize('verified, primary', [(['alipay'], 'alipay'), (['tenpaygo'], 'tenpaygo'), (['alipay', 'tenpaygo'], 'alipay')])
def test_payment_group_matrix(verified, primary):
    r = rules.preflight(with_payments(verified), today=D)
    b = by_id(r)
    for m in PAY_METHODS:
        assert b[m]['status'] == ('done' if m in verified else 'optional')
        assert (b[m]['action'] is None) == (m in verified)
    assert r['ready'] == 5 and r['required'] == 6
    assert r['summary'] == '5 of 6 ready · 1 to do · 2 optional'            # 备用项不计入 optional
    assert r['backup_open'] == 2 - len(verified)
    assert r['payment']['ready'] is True and r['payment']['primary'] == primary
    assert r['payment']['primary_name'] == PAY_METHODS[primary] and r['payment']['verified'] == verified


@pytest.mark.parametrize('verified, backup, desc', [
    (['alipay'], 'tenpaygo', 'Alipay verified · ¥1 test on 2026-10-10, refunded · TenPayGo is an optional backup'),
    (['tenpaygo'], 'alipay', 'TenPayGo verified · ¥1 test on 2026-10-10, refunded · Alipay is an optional backup'),
    (['alipay', 'tenpaygo'], None, 'Alipay and TenPayGo verified · ¥1 tests refunded'),
])
def test_payment_block_summary_for_the_merged_h5_row(verified, backup, desc):
    p = rules.preflight(with_payments(verified), today=D)['payment']
    assert p['title'] == 'Payment in China' and p['backup'] == backup and p['desc'] == desc


def test_backup_rows_explain_which_shops_they_cover():
    b = by_id(rules.preflight(with_payments(['alipay']), today=D))
    assert b['tenpaygo']['desc'] == 'Backup · not verified · pays wherever WeChat Pay works'
    b = by_id(rules.preflight(with_payments(['tenpaygo']), today=D))
    assert b['alipay']['desc'] == 'Backup · not verified · for shops that only take Alipay'
    assert b['tenpaygo']['desc'] == 'Verified · ¥1 test on 2026-10-10, refunded'


def test_primary_is_the_first_method_verified():
    r = rules.preflight(with_payments(['alipay', 'tenpaygo'], at={'alipay': '2026-10-10 10:00:00', 'tenpaygo': '2026-10-10 08:00:00'}), today=D)
    assert r['payment']['primary'] == 'tenpaygo' and r['payment']['verified_at'] == '2026-10-10 08:00:00'


def test_ready_for_shanghai_with_tenpaygo_only():
    r = rules.preflight(with_payments(['tenpaygo'], esim={'bought': True}), today=D)
    assert r['pct'] == 100 and r['summary'] == "You're ready for Shanghai · 6 of 6 ready"


def test_legacy_caller_with_single_payment_field():
    t = copy.deepcopy(TRIP); t['payment'] = {'status': 'verified', 'verified_at': '2026-09-24 14:02:00'}
    r = rules.preflight(t, today=D)
    b = by_id(r)
    assert b['alipay']['status'] == 'done' and b['tenpaygo']['status'] == 'optional'
    assert r['payment']['primary'] == 'alipay'


def test_primary_prefers_a_real_test_over_a_done_mark():
    r = rules.preflight(with_payments(['tenpaygo'], at={'alipay': None, 'tenpaygo': '2026-10-10 08:00:00'}), done={'alipay'}, today=D)
    assert r['payment']['verified'] == ['alipay', 'tenpaygo']
    assert r['payment']['primary'] == 'tenpaygo' and r['payment']['verified_at'] == '2026-10-10 08:00:00'


def test_done_marks_count_as_verified():
    r = rules.preflight(copy.deepcopy(TRIP), done={'tenpaygo'}, today=D)
    assert by_id(r)['tenpaygo']['status'] == 'done' and r['payment']['primary'] == 'tenpaygo'


# ---------------- 交通：只验证了 TenPayGo 时提示需要支付宝的方式 ----------------
def test_transport_flags_alipay_only_routes_when_only_tenpaygo_verified():
    light = copy.deepcopy(TRIP); light['flight']['checked_bags'] = 0
    r = rules.transport(light, landed_at='14:00', paid=['tenpaygo'])
    assert r['recommended']['id'] == 'metro' and 'cash' in r['recommended']['pay_note'] and 'Alipay' in r['recommended']['pay_note']
    didi = [a for a in r['alternatives'] if a['id'] == 'didi'][0]
    assert didi['pay_note'].startswith('Needs Alipay')
    assert all('pay_note' not in a for a in r['alternatives'] if a['id'] == 'taxi')


@pytest.mark.parametrize('paid', [['alipay'], ['alipay', 'tenpaygo'], None])
def test_transport_no_note_with_alipay_or_old_callers(paid):
    light = copy.deepcopy(TRIP); light['flight']['checked_bags'] = 0
    r = rules.transport(light, landed_at='14:00', paid=paid)
    assert 'pay_note' not in r['recommended'] and all('pay_note' not in a for a in r['alternatives'])
    assert all('needs_alipay' not in a for a in r['alternatives'] + [r['recommended']])


def test_http_transport_uses_verified_methods():
    c.post('/mock/pay-test?method=tenpaygo')
    r = c.get('/rules/transport?landed_at=14:00').json()
    assert [a for a in r['alternatives'] if a['id'] == 'didi'][0]['pay_note'].startswith('Needs Alipay')
    c.post('/mock/pay-test?method=alipay')
    r = c.get('/rules/transport?landed_at=14:00').json()
    assert all('pay_note' not in a for a in r['alternatives'])


# ---------------- 接口 ----------------
def test_http_tenpaygo_verification_flow():
    r = c.post('/mock/pay-test?method=tenpaygo').json()
    assert r['method'] == 'tenpaygo' and r['status'] == 'verified' and r['tx'].startswith('TRIP') and r['refund'] == 'issued'
    p = c.get('/rules/preflight').json()
    assert p['payment']['primary'] == 'tenpaygo'
    assert by_id(p)['tenpaygo']['status'] == 'done' and by_id(p)['alipay']['status'] == 'optional'
    t = c.get('/mock/trip').json()
    assert t['payment']['method'] == 'tenpaygo'                                # 兼容字段指向已验证的方式
    assert t['payments']['alipay']['status'] == 'not_verified'
    tl = c.get('/mock/timeline').json()
    assert tl[-1] == {'event': 'payment', 'method': 'tenpaygo', 'at': r['verified_at']}


def test_http_default_method_is_still_alipay():
    r = c.post('/mock/pay-test').json()
    assert r['method'] == 'alipay' and r['status'] == 'verified'
    assert c.get('/rules/preflight').json()['payment']['primary'] == 'alipay'


@pytest.mark.parametrize('code', sorted(PAY_ERRORS['tenpaygo']))
def test_http_tenpaygo_failures_point_to_tenpaygo_entries(code, monkeypatch):
    monkeypatch.setattr(mock.random, 'choice', lambda seq: code)
    r = c.post('/mock/pay-test?method=tenpaygo&fail=1').json()
    assert r == {'method': 'tenpaygo', 'status': 'failed', 'error_code': code, 'hint': PAY_ERRORS['tenpaygo'][code][0],
                 'entry_id': PAY_ERRORS['tenpaygo'][code][1]}
    assert kb.get(r['entry_id'])['scenario'] == 'tenpaygo'
    assert c.get('/rules/preflight').json()['payment']['ready'] is False


def test_http_alipay_failure_unchanged():
    r = c.post('/mock/pay-test?fail=1').json()
    assert r['method'] == 'alipay' and r['error_code'] in PAY_ERRORS['alipay'] and r['entry_id'] == 'alipay_card_bind_failed'


def test_http_unknown_method_is_rejected():
    assert c.post('/mock/pay-test?method=paypal').status_code == 400


def test_http_preflight_done_accepts_tenpaygo():
    r = c.post('/rules/preflight/done', json={'item': 'tenpaygo'}).json()
    assert r['payment']['ready'] is True and r['payment']['primary'] == 'tenpaygo'


def test_http_both_methods_then_reset():
    c.post('/mock/pay-test?method=tenpaygo'); c.post('/mock/pay-test')
    assert [e['method'] for e in c.get('/mock/timeline').json() if e['event'] == 'payment'] == ['tenpaygo', 'alipay']
    c.post('/mock/reset')
    t = c.get('/mock/trip').json()
    assert all(p['status'] == 'not_verified' for p in t['payments'].values())
    assert c.get('/rules/preflight').json()['payment']['ready'] is False


# ---------------- 知识库 ----------------
def test_kb_tenpaygo_scenario_and_entries():
    assert 'tenpaygo' in {s['id'] for s in c.get('/kb/scenarios').json()}
    rows = c.get('/kb/entries?scenario=tenpaygo').json()
    assert len(rows) == 7
    assert kb.scenarios['tenpaygo']['detect']['sub_steps'] == [e['id'] for e in rows]
    for e in rows:
        assert 1 <= len(e['steps']) <= 4 and e['volatility'] == 'high' and e['sources']
        body = ' '.join([e['title'], e['why'], ' '.join(e['steps']), e['fallback']]).lower()
        assert 'vpn' not in body
        assert '3%' not in body and '¥200' not in body                       # 手续费数字只进 facts


def test_kb_cross_links_resolve_both_ways():
    assert 'tenpaygo_card_bind_failed' in kb.get('alipay_card_bind_failed')['related']
    assert 'tenpaygo_card_bind_failed' in kb.get('wechat_card_unsupported')['related']
    for e in kb.query('tenpaygo'):
        assert all(r in kb.entries for r in e.get('related', []))


def test_tutorials_export_includes_tenpaygo_with_images():
    tuts = {t['id']: t for t in json.load(open(os.path.join(H5, 'tutorials.json'), encoding='utf-8'))['tutorials']}
    for eid in ('tenpaygo_setup_before_flight', 'tenpaygo_how_to_pay'):
        assert eid in tuts
        for m in tuts[eid]['media']:
            files = [m['file']] + ([m['poster']] if m.get('poster') else [])
            for f in files:
                assert os.path.isfile(os.path.join(H5, 'img', 'tutorial', f))
                assert os.path.getsize(os.path.join(H5, 'img', 'tutorial', f)) <= 200 * 1024
            if m['file'].endswith('.mp4'):
                assert m['placeholder'] is False and m.get('poster')     # 自制动画，不是占位图
            else:
                assert m['placeholder'] is True                           # App Store 截图裁出的占位图


def test_setup_tutorial_step1_is_our_own_animation():
    tut = [t for t in json.load(open(os.path.join(H5, 'tutorials.json'), encoding='utf-8'))['tutorials'] if t['id'] == 'tenpaygo_setup_before_flight'][0]
    m = [x for x in tut['media'] if x['step'] == 1][0]
    assert m['file'].endswith('step1.mp4') and m['poster'].endswith('step1.png') and 'own animation' in m['source']['name']


# ---------------- 识别 ----------------
def test_prompt_knows_tenpaygo():
    assert 'scenario "tenpaygo"' in stuck.scenarios_block(kb)
    assert 'TenPayGo' in stuck.PROMPT and 'Pay and Go tabs' in stuck.PROMPT


def test_rules_tenpaygo_card_error():
    r = stuck.classify_with_rules(kb, 'TenPayGo · Add card · The bank did not approve this transaction')
    assert r['scenario'] == 'tenpaygo' and r['entry_id'] == 'tenpaygo_card_bind_failed'


def test_rules_wechat_error_sentence_alone_stays_wechat():
    r = stuck.classify_with_rules(kb, 'The bank did not Approve this Transaction')
    assert r['scenario'] == 'wechat'


@pytest.mark.parametrize('text', ['财付通 微信支付 交易账单', '深圳通 乘车码', 'Tenpay transaction record'])
def test_rules_company_and_transit_words_do_not_mean_tenpaygo(text):
    assert stuck.classify_with_rules(kb, text)['scenario'] != 'tenpaygo'


def test_prompt_shared_error_sentence_prefers_wechat_like_rules():
    assert 'prefer the "wechat" entry' in stuck.PROMPT


def test_reader_links_are_checked_by_host_not_substring():
    from validate_entries import reader_ok
    assert reader_ok('https://apps.apple.com/us/app/tenpaygo/id6778755338')
    assert reader_ok('https://au.trip.com/guide/info/alipay-china.html')
    assert not reader_ok('https://apps.apple.com/us/app/some-other-app/id1')
    assert not reader_ok('https://evil.example/?apps.apple.com/')
    assert not reader_ok('https://evil.example/?trip.com')


def test_rules_tenpaygo_home_screen():
    r = stuck.classify_with_rules(kb, 'Bank Card  Apple Pay  E-Wallet  Supported Payment Methods  Pay  Go')
    assert r['scenario'] == 'tenpaygo' and r['entry_id'] == 'tenpaygo_setup_before_flight'


def test_http_classify_text_routes_to_tenpaygo():
    r = c.post('/stuck/classify', data={'text': 'TenPayGo scan to pay says this code is not supported'}).json()
    assert r['mode'] == 'rules' and r['scenario'] == 'tenpaygo' and r['decision'] == 'ask'
    assert r['candidates'][0]['entry_id'] == 'tenpaygo_qr_not_supported'
