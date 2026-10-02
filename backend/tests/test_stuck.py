# -*- coding: utf-8 -*-
import os, sys, io
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import pytest
from fastapi.testclient import TestClient
import stuck
from app import app, kb

c = TestClient(app)


def fake_model(conf, eid='alipay_card_bind_failed', cands=None, ocr='Bank card verification failed 验证失败'):
    def fn(kb_, image, text):
        return {'scenario': 'alipay' if eid else 'unknown', 'entry_id': eid, 'confidence': conf,
                'ocr_text': ocr, 'candidates': cands or ([{'entry_id': eid, 'confidence': conf}] if eid else [])}
    return fn


def test_high_confidence_answers_with_entry():
    r = stuck.classify(kb, b'img', '', model_fn=fake_model(0.92))
    assert r['decision'] == 'answer' and r['entry']['id'] == 'alipay_card_bind_failed' and r['mode'] == 'model'
    assert r['entry']['steps'] and r['unverified'] is False


def test_mid_confidence_asks_with_candidates():
    cands = [{'entry_id': 'alipay_card_bind_failed', 'confidence': 0.55}, {'entry_id': 'alipay_identity_verification', 'confidence': 0.35}]
    r = stuck.classify(kb, b'img', '', model_fn=fake_model(0.55, cands=cands))
    assert r['decision'] == 'ask' and r['entry'] is None
    assert [x['entry_id'] for x in r['candidates']] == ['alipay_card_bind_failed', 'alipay_identity_verification']
    assert all(x['title'] for x in r['candidates'])


def test_low_confidence_is_unknown_without_advice_call():
    r = stuck.classify(kb, b'img', '', advice=False, model_fn=fake_model(0.2, eid=None, cands=[], ocr='a photo of a car'))
    assert r['decision'] == 'unknown' and r['entry_id'] is None and r['advice'] is None


def test_model_unknown_but_readable_text_is_rescued_by_rules():
    r = stuck.classify(kb, b'img', '', advice=False, model_fn=fake_model(0.1, eid=None, cands=[], ocr='支付宝 银行卡 验证失败'))
    assert r['mode'] == 'rules' and r['scenario'] == 'alipay' and r['decision'] == 'ask'


def test_model_failure_falls_back_to_rules():
    def boom(kb_, image, text):
        raise RuntimeError('timeout')
    r = stuck.classify(kb, b'img', 'Alipay says verification failed when I add my bank card', model_fn=boom)
    assert r['mode'] == 'rules' and r['scenario'] == 'alipay'
    assert r['decision'] in ('ask', 'unknown')          # 规则永远不直接给高置信答案
    assert r['confidence'] < stuck.CONF_HIGH


def test_rules_unknown_when_nothing_matches():
    r = stuck.classify(kb, None, 'my shoe is broken', model_fn=lambda *a: (_ for _ in ()).throw(RuntimeError()))
    assert r['decision'] == 'unknown'


def test_model_invalid_id_is_discarded():
    out = stuck.clean_model_output(kb, {'scenario': 'alipay', 'entry_id': 'made_up_id', 'confidence': 0.95, 'ocr_text': 'x',
                                        'candidates': [{'entry_id': 'made_up_id', 'confidence': 0.95}, {'entry_id': 'alipay_how_to_pay', 'confidence': 0.8}]})
    assert out['entry_id'] == 'alipay_how_to_pay' and out['confidence'] == 0.8 and out['scenario'] == 'alipay'
    out2 = stuck.clean_model_output(kb, {'entry_id': 'nope', 'candidates': [], 'confidence': 0.9})
    assert out2['entry_id'] is None and out2['scenario'] == 'unknown'


def test_http_endpoint_multipart():
    files = {'image': ('shot.png', b'\x89PNG fake', 'image/png')}
    r = c.post('/stuck/classify', files=files, data={'text': 'bank card verification failed', 'lang': 'en', 'advice': 'false'})
    assert r.status_code == 200
    body = r.json()
    assert body['decision'] in ('answer', 'ask', 'unknown') and 'latency_ms' in body


def test_http_requires_image_or_text():
    assert c.post('/stuck/classify', data={'lang': 'en'}).status_code == 400


@pytest.mark.skipif(not os.environ.get('DEEPSEEK_API_KEY'), reason='no key')
def test_live_model_on_synthetic_alipay_error():
    from PIL import Image, ImageDraw
    im = Image.new('RGB', (600, 1200), 'white'); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 600, 140], fill=(22, 119, 255)); d.text((30, 60), 'Alipay  <  Add Bank Card', fill='white')
    d.text((40, 300), 'Card number  4471 **** **** 9921', fill='black')
    d.rectangle([40, 420, 560, 520], fill=(255, 235, 235)); d.text((60, 455), 'Verification failed. The bank declined this card.', fill=(200, 0, 0))
    d.text((60, 600), '银行卡验证失败，请更换银行卡重试', fill='black')
    buf = io.BytesIO(); im.save(buf, 'PNG')
    r = stuck.classify(kb, buf.getvalue(), '', advice=False)
    print(r['mode'], r['decision'], r['entry_id'], r['confidence'], r['ocr_text'][:80])
    assert r['mode'] == 'model' and r['scenario'] == 'alipay'
