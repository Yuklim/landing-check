# -*- coding: utf-8 -*-
"""H5 端到端：真实数据（携程 MCP）注入后的行前检查、门票规则、下一程火车、司机地址卡、租车结果。

默认跳过，E2E=1 时运行。MCP 响应用 tests/fixtures/mcp 里存下的真实数据，不联网。
"""
import os, json, sys
sys.path.insert(0, os.path.dirname(__file__))
import pytest

pytestmark = pytest.mark.skipif(not os.environ.get('E2E'), reason='set E2E=1 to run browser tests')
if os.environ.get('E2E'):
    from test_e2e_h5 import base, browser, page, open_app, node, text, wait_text  # noqa: F401  复用同一套服务和浏览器夹具

FIX = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fixtures', 'mcp')


@pytest.fixture(autouse=True)
def _live(monkeypatch, tmp_path):
    import app as A, live
    monkeypatch.setenv('LC_LIVE', 'on')
    store = live.LiveStore(snapshot_path=str(tmp_path / 'snap.json'), ttl=3600,
                           caller=lambda tool, args: json.load(open(os.path.join(FIX, tool + '.json'), encoding='utf-8')))
    monkeypatch.setattr(A, 'live_store', store)
    live.enrich(A.trip.get_trip(), store, wait=True)


def sheet(pg):
    s = pg.locator('[data-pencil-name="Live Sheet"]')
    s.wait_for(state='visible')
    return s


def test_preflight_rows_use_live_data(page, base):
    open_app(page, base, 'preflight')
    page.wait_for_function('() => /Economy about ¥\\d+\\/day/.test(document.querySelector(`.screen[data-route="preflight"] [data-pencil-name="Item Car rental"]`).textContent)', timeout=8000)
    assert 'last entry 16:00, closed Mondays' in node(page, 'preflight', 'Item Palace Museum reservation').text_content()
    leg = node(page, 'preflight', 'Item Next leg')
    leg.wait_for(state='visible')
    assert 'Shanghai → Beijing' in leg.text_content() and 'high-speed trains' in leg.text_content()


def test_ticket_rules_sheet(page, base):
    open_app(page, base, 'preflight')
    node(page, 'preflight', 'Item Palace Museum reservation').click()
    s = sheet(page)
    t = s.text_content()
    assert 'Palace Museum · Beijing' in t and 'Open 08:30–17:00 · last entry 16:00' in t and 'Closed on Mondays' in t
    assert 'accept a Chinese ID card only' in t and 'View listing on Ctrip' in t


def test_train_sheet_and_mark_booked(page, base):
    open_app(page, base, 'preflight')
    leg = node(page, 'preflight', 'Item Next leg')
    leg.wait_for(state='visible')
    leg.locator('[data-pencil-name="Item Button"]').click()
    s = sheet(page)
    assert 'Shanghai → Beijing · Tue Oct 13' in s.text_content()
    assert s.locator('text=上海虹桥 → 北京南').count() == 3
    s.locator('text=I booked it').click()
    page.wait_for_function('() => document.querySelector(`.screen[data-route="preflight"] [data-pencil-name="Item Next leg"]`).style.display === "none"', timeout=8000)


def test_driver_card_and_car_results(page, base):
    open_app(page, base, 'driver')
    wait_text(page, 'driver', 'Hotel CN', '^上海璞丽$')
    assert text(page, 'driver', 'Addr CN') == '静安区常德路1号' and text(page, 'driver', 'Info Val') == '021 3203 9999'
    page.evaluate("r => show(r)", 'car')
    wait_text(page, 'car', 'Form Right', '3 days', 1)
    node(page, 'car', 'Search Button').click()
    t = sheet(page).text_content()
    assert 'cars in Shanghai' in t and 'Hongqiao Airport (SHA)' in t and 'about ¥' in t
