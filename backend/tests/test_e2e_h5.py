# -*- coding: utf-8 -*-
"""H5 端到端：TenPayGo 与支付宝并列（docs/tenpaygo/02-PRD.md FR-1 至 FR-10）。

默认跳过。需要 playwright 和 Chromium：
    pip install playwright && python -m playwright install chromium
    E2E=1 python -m pytest -q tests/test_e2e_h5.py
测试进程里用线程起 uvicorn（随机端口），H5 走 /app 挂载；静态模式把 github.io 的请求映射到本地 h5/ 目录。
"""
import os, sys, socket, threading, time, functools, mimetypes
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import pytest

pytestmark = pytest.mark.skipif(not os.environ.get('E2E'), reason='set E2E=1 to run browser tests')
if os.environ.get('E2E'):
    playwright_sync = pytest.importorskip('playwright.sync_api')

H5 = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'h5'))


def _free_port():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p


@pytest.fixture(scope='module')
def base():
    import uvicorn
    from app import app
    port = _free_port()
    server = uvicorn.Server(uvicorn.Config(app, host='127.0.0.1', port=port, log_level='warning'))
    th = threading.Thread(target=server.run, daemon=True); th.start()
    for _ in range(100):
        if server.started: break
        time.sleep(0.05)
    yield 'http://127.0.0.1:%d' % port
    server.should_exit = True; th.join(5)


@pytest.fixture(scope='module')
def browser():
    with playwright_sync.sync_playwright() as p:
        b = p.chromium.launch()
        yield b
        b.close()


@pytest.fixture(autouse=True)
def _fast_pay(monkeypatch):
    from app import trip
    from mock import MockTrip
    monkeypatch.setattr(trip, 'pay_test', functools.partial(MockTrip.pay_test, trip, delay=0))


@pytest.fixture
def page(browser):
    ctx = browser.new_context(viewport={'width': 393, 'height': 852})
    pg = ctx.new_page()
    pg.route('https://fonts.googleapis.com/**', lambda r: r.abort())
    pg.route('https://fonts.gstatic.com/**', lambda r: r.abort())
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    yield pg
    ctx.close()
    assert not errors, errors


def text(pg, route, name, i=0):
    return pg.evaluate('([r, n, i]) => { const e = document.querySelectorAll(`.screen[data-route="${r}"] [data-pencil-name="${n}"]`)[i]; return e ? e.textContent.trim() : null; }', [route, name, i])


def node(pg, route, name):
    return pg.locator('.screen[data-route="%s"] [data-pencil-name="%s"]' % (route, name)).first


def open_app(pg, base, route='home'):
    pg.goto(base + '/app/index.html#' + route)
    pg.wait_for_function('() => document.querySelector("#lcdot") && /后端已连接/.test(document.querySelector("#lcdot").textContent)')


def go(pg, route):
    pg.evaluate('r => show(r)', route)


def wait_text(pg, route, name, pattern, i=0):
    pg.wait_for_function('([r, n, i, p]) => { const e = document.querySelectorAll(`.screen[data-route="${r}"] [data-pencil-name="${n}"]`)[i]; return e && new RegExp(p).test(e.textContent); }',
                         arg=[route, name, i, pattern], timeout=8000)


# ---------------- FR-1 行前检查 ----------------
def test_preflight_has_tenpaygo_row_under_alipay(page, base):
    open_app(page, base, 'preflight'); go(page, 'preflight')
    wait_text(page, 'preflight', 'Progress Label', '4 of 6 ready · 2 to do · 2 optional')
    order = page.evaluate('() => [...document.querySelectorAll(\'.screen[data-route="preflight"] [data-pencil-name^="Item "][data-pencil-name$=" payment"]\')].map(e => e.getAttribute("data-pencil-name"))')
    assert order == ['Item Alipay payment', 'Item TenPayGo payment']
    row = node(page, 'preflight', 'Item TenPayGo payment')
    assert row.locator('[data-pencil-name="Item Title"]').text_content() == 'TenPayGo payment'
    assert row.locator('[data-pencil-name="Item Desc"]').text_content() == 'Not installed · either one is enough · email sign-up, no Chinese number'
    assert row.locator('[data-pencil-name="Item Button"]').get_attribute('data-act') == 'api:paytpg'
    assert row.get_attribute('data-pencil-id') is None
    assert 'setup guide' in row.locator('[data-pencil-name="Item Guide Link"]').text_content()


# ---------------- FR-2 TenPayGo 验证成功；FR-10 支付宝文案恢复 ----------------
def test_verify_tenpaygo_then_alipay_copy_does_not_leak(page, base):
    open_app(page, base, 'preflight'); go(page, 'preflight')
    node(page, 'preflight', 'Item TenPayGo payment').locator('[data-pencil-name="Item Button"]').click()
    wait_text(page, 'payment', 'Result Title', 'Your TenPayGo works in China')
    assert 'via TenPayGo at' in text(page, 'payment', 'Result Sub')
    assert text(page, 'payment', 'How Item Title', 1) == 'TenPayGo is linked to that card on this phone'
    assert 'TenPayGo pays' in text(page, 'payment', 'Source')
    assert 'VERIFIED' in text(page, 'payment', 'Chip Label')
    node(page, 'payment', 'Done Button').click()
    wait_text(page, 'preflight', 'Progress Label', '5 of 6 ready · 1 to do · 2 optional')
    assert node(page, 'preflight', 'Item TenPayGo payment').locator('[data-pencil-name="Item Desc"]').text_content().startswith('Verified · ¥1 test on')
    assert node(page, 'preflight', 'Item Alipay payment').locator('[data-pencil-name="Item Desc"]').text_content() == 'Backup · not verified · for shops that only take Alipay'
    node(page, 'preflight', 'Item Alipay payment').locator('[data-pencil-name="Item Button"]').click()
    wait_text(page, 'payment', 'Result Title', 'Your Alipay works in China')
    assert text(page, 'payment', 'How Item Title', 1) == 'Alipay is linked to that card on this phone'
    assert "Alipay checkout" in text(page, 'payment', 'Source')


# ---------------- FR-2/FR-3 失败与切换 ----------------
def test_tenpaygo_failure_explains_code_and_switches_to_alipay(page, base):
    open_app(page, base, 'preflight'); go(page, 'preflight')
    page.route('**/mock/pay-test?method=tenpaygo', lambda r: r.fulfill(json={'method': 'tenpaygo', 'status': 'failed', 'error_code': 'ISSUER_DECLINED', 'hint': 'The bank did not approve this transaction.', 'entry_id': 'tenpaygo_card_bind_failed'}))
    node(page, 'preflight', 'Item TenPayGo payment').locator('[data-pencil-name="Item Button"]').click()
    wait_text(page, 'payment', 'Result Title', 'Payment test failed')
    assert text(page, 'payment', 'Chip Label') == 'NOT VERIFIED · ISSUER_DECLINED'
    assert text(page, 'payment', 'How Item Title', 0) == 'Your bank refused the charge'
    assert text(page, 'payment', 'How Item Title', 1) == 'Allow international online payments'
    sw = node(page, 'payment', 'Pay Switch')
    assert sw.is_visible() and sw.text_content() == 'Use Alipay instead ›'
    assert node(page, 'payment', 'Done Button').get_attribute('data-act') == 'api:payretry:tenpaygo'
    sw.click()
    wait_text(page, 'payment', 'Result Title', 'Your Alipay works in China')
    assert not node(page, 'payment', 'Pay Switch').is_visible()
    go(page, 'preflight')
    wait_text(page, 'preflight', 'Progress Label', '5 of 6 ready')


# ---------------- FR-4 落地流程先验证支付 ----------------
def test_step3_asks_which_method_and_returns_to_step3(page, base):
    open_app(page, base, 'step3'); go(page, 'step3')
    wait_text(page, 'step3', 'Primary Label', 'Verify payment first')
    node(page, 'step3', 'Primary Button').click()
    chooser = page.locator('[data-pencil-name="Pay Chooser"]')
    chooser.wait_for(state='visible')
    chooser.locator('[data-pay="tenpaygo"]').click()
    wait_text(page, 'payment', 'Result Title', 'Your TenPayGo works in China')
    wait_text(page, 'payment', 'Done Label', 'Continue to step 3')
    assert not chooser.is_visible()


def test_chooser_not_now_does_nothing(page, base):
    open_app(page, base, 'step3'); go(page, 'step3')
    wait_text(page, 'step3', 'Primary Label', 'Verify payment first')
    node(page, 'step3', 'Primary Button').click()
    page.locator('[data-pencil-name="Pay Chooser"] [data-pay=""]').click()
    assert page.evaluate('() => document.querySelector(".screen.on").dataset.route') == 'step3'


# ---------------- FR-5/6/7 落地后各页显示验证方式 ----------------
def test_after_tenpaygo_pages_name_the_method(page, base):
    from fastapi.testclient import TestClient
    from app import app
    c = TestClient(app)
    c.post('/mock/pay-test?method=tenpaygo'); c.post('/mock/flight/land'); c.post('/mock/event', json={'event': 'online'}); c.post('/mock/event', json={'event': 'in_car'})
    open_app(page, base, 'step3'); go(page, 'step3')
    page.wait_for_function('() => /TenPayGo verified/.test(document.querySelector(\'.screen[data-route="step3"] [data-pencil-name="Step Pay like a local"]\').textContent)')
    go(page, 'trips')
    wait_text(page, 'trips', 'Pill Alipay', 'TenPayGo')
    go(page, 'done')
    page.wait_for_function('() => /TenPayGo verified/.test(document.querySelector(\'.screen[data-route="done"] [data-pencil-name="Event Payment verified before flight"]\').textContent)')


# ---------------- FR-9 教程深链 ----------------
def test_tutorial_deep_link(page, base):
    page.goto(base + '/app/index.html?tutorial=tenpaygo_setup_before_flight&step=2')
    page.wait_for_function('() => document.querySelector(".screen.on") && document.querySelector(".screen.on").dataset.route === "tutorial"')
    assert page.locator('#tutTitle').text_content() == 'Set up TenPayGo before you fly'
    page.wait_for_function('() => document.querySelector("#tutImg").naturalWidth > 0')
    assert page.locator('#tutImg').get_attribute('src').endswith('tenpaygo/tenpaygo_setup_before_flight/step2.png')


# ---------------- FR-10 静态模式（github.io，无后端） ----------------
def test_static_mode_shows_both_methods(page):
    def local(route):
        path = route.request.url.split('/landing-check/h5/', 1)[-1].split('?')[0].split('#')[0] or 'index.html'
        f = os.path.join(H5, *path.split('/'))
        if not os.path.isfile(f):
            return route.fulfill(status=404, body='')
        route.fulfill(path=f, content_type=mimetypes.guess_type(f)[0] or 'application/octet-stream')
    page.route('https://yuklim.github.io/**', local)
    page.goto('https://yuklim.github.io/landing-check/h5/index.html#preflight')
    page.wait_for_function('() => /静态模式/.test(document.querySelector("#lcdot").textContent)')
    node(page, 'preflight', 'Item TenPayGo payment').locator('[data-pencil-name="Item Button"]').click()
    wait_text(page, 'payment', 'Result Title', 'Your TenPayGo works in China')
    go(page, 'preflight')
    node(page, 'preflight', 'Item Alipay payment').locator('[data-pencil-name="Item Button"]').click()
    wait_text(page, 'payment', 'Result Title', 'Your Alipay works in China')
    assert text(page, 'payment', 'How Item Title', 1) == 'Alipay is linked to that card on this phone'
