# -*- coding: utf-8 -*-
"""行前检查「Plan your first days」：门票 / 旅游笔记的归一化与英文化（不连网，假数据替代 MCP 和模型）。"""
import json

import pytest
from fastapi.testclient import TestClient

import app as app_module
import ctrip_mcp
import stuck

TICKETS = [{
    'productID': 736,
    'basicInfo': {'name': '外滩', 'imageURL': 'https://img/bund.jpg', 'score': 4.8},
    'additionalInfo': {'commentsCount': 157136, 'pmRecommand': '欣赏万国建筑和浦江美景', 'rankTag': '必打卡'},
    'ticketExtendInfo': {'openTimeInfo': {'unFormatOpenTime': '全年 全天开放'}},
    'urlInfo': {'h5Url': 'https://m.ctrip.com/bund'},
    'resourceInfoList': [{'price': 120.0}, {'price': 50.0}, {'price': None}],
}, {
    'productID': 9,
    'basicInfo': {'name': '某新景点', 'imageURL': 'https://img/new.jpg', 'score': 4.5},
    'additionalInfo': {'commentsCount': 10, 'pmRecommand': '小众好去处'},
    'urlInfo': {'h5Url': 'https://m.ctrip.com/new'},
    'resourceInfoList': [],
}]
NOTES = [{
    'title': '', 'imageURL': 'https://img/a.jpg', 'imageList': ['https://img/a.jpg'],
    'authorName': '猫咪', 'likeCount': 1282, 'listUrl': 'https://list',
    'content': '上海📍两天一夜攻略\n路线：<poi poiid="1" h5url="x">陆家嘴</poi> → <poi poiid="2">外滩</poi>',
}, {
    'title': '没图的笔记', 'imageURL': '', 'imageList': [], 'authorName': 'b', 'content': '文字',
}]


@pytest.fixture
def mcp(monkeypatch):
    def fake(name, arguments, **_):
        return {'query_ticket': TICKETS, 'query_content': NOTES}[name]
    monkeypatch.setattr(ctrip_mcp, 'call_tool', fake)
    app_module._EN_CACHE.clear()


def test_ticket_normalized_with_lowest_price_and_known_english_name(mcp):
    items = ctrip_mcp.query_ticket()['items']
    bund = items[0]
    assert bund['name_en'] == 'The Bund' and bund['price_from'] == 50.0
    assert bund['comments'] == 157136 and bund['url'] == 'https://m.ctrip.com/bund'
    assert items[1]['price_from'] is None and items[1]['name_en'] == ''


def test_guide_text_strips_poi_tags_and_title_falls_back_to_first_line(mcp):
    note = ctrip_mcp.query_guides()['items'][0]
    assert '<poi' not in note['text'] and '陆家嘴 → 外滩' in note['text']
    assert note['title'] == '上海📍两天一夜攻略'


def test_routes_keep_chinese_when_model_unavailable(mcp, monkeypatch):
    monkeypatch.setattr(stuck, 'KEY', '')
    client = TestClient(app_module.app)
    tickets = client.get('/content/tickets').json()
    assert tickets['translated'] is False
    assert [t['name_en'] for t in tickets['items']] == ['The Bund', '']
    guides = client.get('/content/guides').json()
    assert len(guides['items']) == 1                       # 没图的笔记不进卡片
    assert guides['items'][0]['title_en'] == '' and guides['translated'] is False


def test_routes_add_english_title_and_summary_from_model(mcp, monkeypatch):
    monkeypatch.setattr(stuck, 'KEY', 'test')

    def fake_model(messages, **_):
        rows = json.loads(messages[-1]['content'])
        return json.dumps({'items': [{'id': r['id'], 'title': 'EN ' + r['id'], 'summary': 'One line.'} for r in rows]})
    monkeypatch.setattr(stuck, 'call_model', fake_model)
    client = TestClient(app_module.app)
    tickets = client.get('/content/tickets').json()
    assert tickets['translated'] is True
    assert tickets['items'][0]['name_en'] == 'The Bund'    # 固定译名优先
    assert tickets['items'][1]['name_en'] == 'EN 9' and tickets['items'][1]['recommend_en'] == 'One line.'
    guide = client.get('/content/guides').json()['items'][0]
    assert guide['title_en'].startswith('EN ') and guide['summary_en'] == 'One line.'


def test_mcp_failure_returns_empty_list_not_error(monkeypatch):
    def boom(*_, **__):
        raise ctrip_mcp.CtripMCPError('MCP 超时')
    monkeypatch.setattr(ctrip_mcp, 'call_tool', boom)
    client = TestClient(app_module.app)
    for path in ('/content/tickets', '/content/guides'):
        r = client.get(path)
        assert r.status_code == 200 and r.json()['items'] == []
