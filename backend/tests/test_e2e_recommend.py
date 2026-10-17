# -*- coding: utf-8 -*-
"""H5 端到端：推荐面板（前链路 / 后链路）随地理切换、带归因链接。E2E=1 时运行。"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import pytest

pytestmark = pytest.mark.skipif(not os.environ.get('E2E'), reason='set E2E=1 to run browser tests')
if os.environ.get('E2E'):
    from test_e2e_h5 import base, browser, page, open_app  # noqa: F401  复用同一套服务和浏览器
    from test_e2e_live import _live  # noqa: F401  注入真实数据，使门票/下一程/租车推荐可触发


def reco(pg):
    s = pg.locator('[data-pencil-name="Reco Sheet"]')
    s.wait_for(state='visible')
    return s


def test_reco_panel_opens_with_tracked_cards(page, base):
    open_app(page, base, 'preflight')
    fab = page.locator('[data-pencil-name="Reco Fab"]')
    fab.wait_for(state='visible')
    fab.click()
    t = reco(page).text_content()
    assert '为你推荐' in t and '前链路' in t            # 境外默认 = 前链路
    assert '链接带归因参数' in t
    assert '路由到 trip.com 国际站' in t                 # 携程国内站链接标注需路由国际站


def test_reco_flips_to_backchain_in_china(page, base):
    open_app(page, base, 'preflight')
    page.locator('[data-pencil-name="Reco Fab"]').click()
    reco(page).get_by_text('境内·落地后', exact=True).click()
    # 切到境内：链路翻转为后链路，且未验证支付时「验证支付」升到卡片里
    page.wait_for_function(
        '() => { const s = document.querySelector(`[data-pencil-name="Reco Sheet"]`);'
        ' return s && /后链路/.test(s.textContent) && /验证支付/.test(s.textContent); }',
        timeout=8000)
