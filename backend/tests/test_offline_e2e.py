"""Real service-worker offline tests, including GitHub Pages subpaths and failed updates.

E2E=1 E2E_CHANNEL=chrome python -m pytest -q backend/tests/test_offline_e2e.py
The test HTTP server injects failures for SW requests (Playwright routing cannot do that).
"""
import functools
import json
import os
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

import pytest

pytestmark = pytest.mark.skipif(not os.environ.get('E2E'), reason='set E2E=1 to run browser tests')
if os.environ.get('E2E'):
    playwright = pytest.importorskip('playwright.sync_api')

ROOT = Path(__file__).resolve().parents[2]
H5 = ROOT / 'h5'


@pytest.fixture(scope='module')
def site():
    faults = {}

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ROOT), **kwargs)

        def translate_path(self, path):
            clean = urlsplit(path).path
            for prefix in ('/landing-check/h5/', '/app/'):
                if clean.startswith(prefix):
                    return str(H5 / clean[len(prefix):])
            return super().translate_path(path)

        def end_headers(self):
            self.send_header('Cache-Control', 'no-store')
            super().end_headers()

        def do_GET(self):
            fault = faults.get(urlsplit(self.path).path)
            if fault is not None:
                self.send_response(503 if fault == 'fail' else 200)
                self.send_header('Content-Type', 'text/css')
                self.end_headers()
                self.wfile.write(b'/* deliberately changed bytes */')
                return
            super().do_GET()

        def log_message(self, *args):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield 'http://127.0.0.1:%s' % server.server_port, faults
    server.shutdown()
    server.server_close()
    thread.join()


@pytest.fixture(scope='module')
def browser():
    with playwright.sync_playwright() as p:
        browser = p.chromium.launch(channel=os.environ.get('E2E_CHANNEL') or None)
        yield browser
        browser.close()


@pytest.fixture
def page(browser, site):
    site[1].clear()
    context = browser.new_context(viewport={'width': 393, 'height': 852}, is_mobile=True, has_touch=True)
    context.route('https://fonts.googleapis.com/**', lambda route: route.abort())
    context.route('https://fonts.gstatic.com/**', lambda route: route.abort())
    # Offline tests must not depend on an unrelated local demo backend on port 8000.
    context.route('http://127.0.0.1:8000/**', lambda route: route.abort())
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    yield page
    context.close()
    site[1].clear()
    assert not errors, errors


def open_pack(page, site, prefix='/landing-check/h5/', route='offline'):
    page.goto(site[0] + prefix + 'index.html#' + route)
    page.locator('.screen.on [data-op="help"], .screen.on [data-op="return-help"]').wait_for()
    page.wait_for_function('() => !!document.querySelector(".screen.on [data-op=download], .screen.on #op-hotel-form, .screen.on .op-step-progress, .screen.on #op-contact-form, .screen.on .op-tabs")')


def click(page, action, value=None):
    selector = '.screen.on [data-op="%s"]' % action
    if value is not None:
        selector += '[data-value="%s"]' % value
    page.locator(selector).first.click()


def download(page):
    click(page, 'download')
    page.get_by_test_id('pack-status').filter(has_text='Public guide saved').wait_for(timeout=30000)
    page.wait_for_function('() => !!navigator.serviceWorker.controller')


def save_hotel(page, phone=''):
    click(page, 'nav', 'offline-hotel')
    click(page, 'new-hotel')
    form = page.locator('#op-hotel-form')
    data = {'name_en': 'Private Test Hotel', 'name_zh': '私人测试酒店', 'address_en': 'Private test address, Shanghai', 'address_zh': '私人测试地址', 'phone': phone, 'notes': 'Personal note — not public'}
    for name, value in data.items():
        form.locator('[name="%s"]' % name).fill(value)
    form.locator('[name=confirmed]').check()
    form.get_by_role('button', name='Save hotel on this device').click()
    page.locator('.screen.on .op-hotel-name').wait_for()


def nav(page, route):
    page.evaluate('(route) => show(route)', route)


def next_step(page, key):
    click(page, 'guide-next', key)
    page.wait_for_function('(key) => window.LCOfflineDB.get("guide").then(g => g && g.step === key)', arg=key)


def test_saved_pack_survives_offline_close_and_reopen(page, site):
    open_pack(page, site)
    assert page.get_by_test_id('pack-status').inner_text() == 'Not downloaded yet'
    save_hotel(page, '+86 21 12345678')
    nav(page, 'offline-help')
    form = page.locator('#op-contact-form')
    form.locator('[name=name]').fill('Travel partner')
    form.locator('[name=phone]').fill('+44 123456789')
    form.get_by_role('button', name='Save contact').click()
    page.locator('.screen.on .op-contact', has_text='Travel partner').wait_for()
    nav(page, 'offline-guide')
    next_step(page, 'assist')
    nav(page, 'offline')
    download(page)
    context = page.context
    context.set_offline(True)
    page.close()
    reopened = context.new_page()
    reopened.goto(site[0] + '/landing-check/h5/index.html#offline-hotel')
    reopened.locator('.screen.on .op-hotel-name', has_text='私人测试酒店').wait_for()
    assert 'Private Test Hotel' in reopened.locator('.screen.on').inner_text()
    click(reopened, 'hotel-card')
    assert reopened.locator('dialog[open] [lang=zh-CN]').inner_text() == '私人测试酒店\n私人测试地址'
    reopened.locator('dialog [data-op=dialog-close]').click()
    nav(reopened, 'offline-guide')
    assert reopened.locator('.screen.on h2').inner_text() == 'Ask an airport staff member'
    nav(reopened, 'offline-help')
    assert 'Travel partner' in reopened.locator('.screen.on').inner_text()
    nav(reopened, 'offline-cards')
    click(reopened, 'place', 'service')
    reopened.wait_for_function('() => document.querySelector(".screen.on img").naturalWidth > 0')
    assert 'Offline' in reopened.locator('.screen.on [data-op-network]').inner_text()


@pytest.mark.parametrize('fault', ['fail', 'changed'])
def test_failed_first_download_never_claims_saved(page, site, fault):
    open_pack(page, site)
    site[1]['/landing-check/h5/offline.css'] = fault
    click(page, 'download')
    page.locator('.screen.on .op-notice', has_text='previous complete pack').wait_for(timeout=30000)
    assert page.get_by_test_id('pack-status').inner_text() == 'Not downloaded yet'
    assert page.evaluate('() => caches.keys().then(keys => keys.filter(k => k.includes("pack-")).length)') == 0
    site[1].clear()
    download(page)


def test_failed_update_keeps_old_pack_and_private_data(page, site):
    open_pack(page, site)
    save_hotel(page)
    nav(page, 'offline')
    download(page)
    before = page.evaluate('() => caches.keys().then(keys => keys.filter(k => k.includes("pack-")))')
    site[1]['/landing-check/h5/data/offline-pvg-t2.json'] = 'fail'
    click(page, 'download')
    page.locator('.screen.on .op-notice', has_text='previous complete pack').wait_for(timeout=30000)
    assert page.evaluate('() => caches.keys().then(keys => keys.filter(k => k.includes("pack-")))') == before
    page.context.set_offline(True)
    page.reload()
    page.get_by_test_id('pack-status').filter(has_text='Public guide saved').wait_for()
    nav(page, 'offline-hotel')
    assert '私人测试酒店' in page.locator('.screen.on').inner_text()


def test_connection_branches_preserve_progress_and_cash_is_optional(page, site):
    open_pack(page, site)
    click(page, 'nav', 'offline-guide')
    next_step(page, 'auth')
    next_step(page, 'assist')
    next_step(page, 'choose')
    next_step(page, 'sim')
    next_step(page, 'setup')  # Existing payment skips currency exchange entirely.
    assert 'Set up the SIM' in page.locator('.screen.on h2').inner_text()
    click(page, 'guide-prev')
    page.get_by_role('heading', name='Ask at the communication desk').wait_for()
    next_step(page, 'payment')
    next_step(page, 'currency')
    next_step(page, 'sim')
    click(page, 'help')
    click(page, 'return-help')
    assert 'Ask at the communication desk' in page.locator('.screen.on').inner_text()
    page.reload()
    page.get_by_role('heading', name='Ask at the communication desk').wait_for()
    next_step(page, 'fallback')
    click(page, 'guide-request')
    assert '我找不到这个手机 SIM 卡服务窗口' in page.locator('dialog[open]').inner_text()


def test_esim_does_not_claim_offline_installation(page, site):
    open_pack(page, site, route='offline-guide')
    next_step(page, 'assist')
    next_step(page, 'choose')
    next_step(page, 'esim')
    assert 'may need internet' in page.locator('.screen.on').inner_text()
    next_step(page, 'assist')
    next_step(page, 'complete')
    assert 'You confirmed internet access' in page.locator('.screen.on').inner_text()


def test_clear_removes_private_data_but_keeps_public_pack(page, site):
    open_pack(page, site)
    save_hotel(page)
    nav(page, 'offline-help')
    form = page.locator('#op-contact-form')
    form.locator('[name=name]').fill('Private contact')
    form.locator('[name=phone]').fill('+44 1234567')
    form.get_by_role('button', name='Save contact').click()
    page.locator('.screen.on .op-contact', has_text='Private contact').wait_for()
    nav(page, 'offline-guide')
    next_step(page, 'assist')
    nav(page, 'offline')
    download(page)
    # Private text must never appear in a cached public HTTP response.
    assert page.evaluate('''async () => {
      for (const name of await caches.keys()) for (const req of await (await caches.open(name)).keys()) {
        const response = await (await caches.open(name)).match(req);
        if ((response.headers.get('content-type') || '').match(/text|json|javascript/)) {
          if ((await response.text()).includes('Private Test Hotel')) return false;
        }
      }
      return true;
    }''')
    page.on('dialog', lambda dialog: dialog.accept())
    click(page, 'clear')
    page.locator('.screen.on .op-notice', has_text='Personal details').wait_for()
    assert page.evaluate('() => Promise.all(["hotel","contacts","guide"].map(k => LCOfflineDB.get(k))).then(v => v.every(x => x === undefined))')
    assert 'Private Test Hotel' not in page.locator('body').text_content()
    page.context.set_offline(True)
    page.reload()
    page.get_by_test_id('pack-status').filter(has_text='Public guide saved').wait_for()
    nav(page, 'offline-hotel')
    assert page.locator('#op-hotel-form').is_visible()


def test_clipboard_failure_and_missing_phone_are_actionable(page, site):
    open_pack(page, site)
    save_hotel(page)
    assert page.get_by_role('button', name='No phone saved').is_disabled()
    page.evaluate('''() => {
      Object.defineProperty(navigator, 'clipboard', {value: {writeText: () => Promise.reject(new Error('denied'))}, configurable: true});
      document.execCommand = () => false;
    }''')
    click(page, 'copy-hotel')
    page.locator('.screen.on .op-notice', has_text='Could not copy').wait_for()
    click(page, 'hotel-card')
    page.locator('dialog [data-op=dialog-copy]').click()
    assert 'Could not copy' in page.locator('dialog [data-copy-status]').inner_text()


def test_network_changes_keep_unsaved_form_and_guide(page, site):
    open_pack(page, site)
    click(page, 'nav', 'offline-hotel')
    form = page.locator('#op-hotel-form')
    form.locator('[name=name_en]').fill('Unsaved draft')
    page.context.set_offline(True)
    page.wait_for_function('() => !navigator.onLine')
    assert form.locator('[name=name_en]').input_value() == 'Unsaved draft'
    page.context.set_offline(False)
    assert form.locator('[name=name_en]').input_value() == 'Unsaved draft'
    # Browser arrow keys must edit fields instead of changing the demo route.
    form.locator('[name=name_en]').press('ArrowLeft')
    assert page.url.endswith('#offline-hotel')


def test_private_storage_failure_keeps_form_and_reports_failure(page, site):
    open_pack(page, site)
    click(page, 'nav', 'offline-hotel')
    click(page, 'import-hotel')
    page.locator('.screen.on .op-demo', has_text='DEMO ITINERARY').wait_for()
    page.locator('#op-hotel-form [name=confirmed]').check()
    page.evaluate('() => LCOfflineDB.put = () => Promise.reject(new Error("Storage full"))')
    page.locator('#op-hotel-form [type=submit]').click()
    page.locator('#op-hotel-form [role=alert]', has_text='Storage full').wait_for()
    assert page.locator('#op-hotel-form [name=name_zh]').input_value() == '上海璞丽酒店'
    assert page.evaluate('() => LCOfflineDB.get("hotel")') is None


@pytest.mark.parametrize('prefix', ['/landing-check/h5/', '/app/'])
def test_subpath_scope_and_query_entry_offline(page, site, prefix):
    open_pack(page, site, prefix=prefix)
    download(page)
    assert page.evaluate('() => navigator.serviceWorker.getRegistrations().then(r => r.map(x => new URL(x.scope).pathname))') == [prefix]
    # Only explicitly listed public paths are cached.
    keys = page.evaluate('''async () => {
      const name = (await caches.keys()).find(k => k.includes('pack-'));
      return (await (await caches.open(name)).keys()).map(r => new URL(r.url).pathname);
    }''')
    assert all(key.startswith(prefix) for key in keys)
    assert not any('/mock/' in key or '/kb/' in key or '/showcase/' in key for key in keys)
    page.context.set_offline(True)
    page.goto(site[0] + prefix + '?api=https://landing-check.onrender.com#offline')
    page.get_by_test_id('pack-status').filter(has_text='Public guide saved').wait_for()
    assert page.evaluate('() => navigator.serviceWorker.controller !== null')
    nav(page, 'offline-guide')
    next_step(page, 'assist')
    click(page, 'place', 'service')
    page.wait_for_function('() => document.querySelector(".screen.on img").naturalWidth > 0')


def test_offline_core_makes_no_api_requests_and_old_help_uses_local_cards(page, site):
    open_pack(page, site)
    download(page)
    requests = []
    page.on('request', lambda request: requests.append(request.url))
    page.context.set_offline(True)
    page.reload()
    page.get_by_test_id('pack-status').filter(has_text='Public guide saved').wait_for()
    nav(page, 'preflight')
    page.locator('.screen.on [data-pencil-name="Stuck FAB"]').click()
    page.get_by_role('heading', name='Help & contacts', exact=True).wait_for()
    assert not [url for url in requests if any(path in url for path in ('/mock/', '/health', '/kb/', '/stuck/', '/rules/'))]


def test_small_mobile_layout_has_no_horizontal_overflow(page, site):
    page.set_viewport_size({'width': 320, 'height': 640})
    open_pack(page, site)
    for route in ('offline', 'offline-hotel', 'offline-cards', 'offline-guide', 'offline-help', 'offline-place'):
        nav(page, route)
        assert page.evaluate('''() => {
          const el = document.querySelector('.screen.on > .scroll');
          return el.scrollWidth <= el.clientWidth + 1;
        }'''), route


def test_static_preflight_counts_real_device_download_state(page, site):
    open_pack(page, site)
    nav(page, 'preflight')
    label = page.locator('.screen.on [data-pencil-name="Progress Label"]')
    assert label.inner_text() == '3 of 6 ready · 3 to do · 2 optional'
    row = page.locator('.screen.on [data-pencil-name="Item Offline landing pack"]')
    assert 'Not saved on this device' in row.inner_text()
    nav(page, 'offline')
    download(page)
    nav(page, 'preflight')
    assert label.inner_text() == '4 of 6 ready · 2 to do · 2 optional'
    assert 'Saved on this device' in row.inner_text()


def test_missing_hotel_fields_cannot_be_saved(page, site):
    open_pack(page, site, route='offline-hotel')
    click(page, 'new-hotel')
    form = page.locator('#op-hotel-form')
    form.locator('[name=name_en]').fill('Incomplete hotel')
    form.locator('[name=confirmed]').check()
    form.get_by_role('button', name='Save hotel on this device').click()
    assert page.evaluate('() => LCOfflineDB.get("hotel")') is None
    assert form.locator('[name=name_en]').input_value() == 'Incomplete hotel'
    assert page.locator('.screen.on .op-hotel-name').count() == 0


@pytest.mark.parametrize('path, choice, expected', [
    (['auth'], 'Authentication failed', '我的机场 Wi-Fi 上网认证没有成功'),
    (['auth'], 'I cannot find the equipment', '我找不到 Wi-Fi 上网认证设备'),
    (['assist'], 'I cannot find the service center', '我找不到这个服务中心'),
    (['assist'], 'The service is closed / unavailable', '我暂时未能在这个服务中心获得帮助'),
    (['assist', 'choose', 'sim'], 'My payment failed', '我的支付没有成功'),
    (['assist', 'choose', 'sim'], 'I need RMB cash', '我需要人民币现金来办理手机 SIM 卡'),
    (['assist', 'choose', 'sim'], 'The SIM desk is closed / unavailable', '这个手机 SIM 卡服务窗口已关闭'),
    (['assist', 'choose', 'sim', 'setup'], 'I still cannot access the internet', '使用这张手机 SIM 卡后，我仍然无法上网'),
    (['assist', 'choose', 'esim'], 'I need internet to install it', '我需要联网才能购买或安装 eSIM'),
])
def test_bilingual_request_reflects_selected_situation(page, site, path, choice, expected):
    open_pack(page, site, route='offline-guide')
    for step in path:
        next_step(page, step)
    page.locator('.screen.on').get_by_role('button', name=choice, exact=True).click()
    page.locator('.screen.on .op-request-preview', has_text=expected).wait_for()
    click(page, 'guide-request')
    assert expected in page.locator('dialog[open] [lang=zh-CN]').inner_text()
    if 'SIM desk' in choice:
        assert '手机 SIM 卡／通信服务窗口' in page.locator('dialog[open] [lang=zh-CN]').inner_text()


def test_request_context_survives_back_help_and_offline_reopen(page, site):
    open_pack(page, site)
    download(page)
    nav(page, 'offline-guide')
    next_step(page, 'auth')
    page.locator('.screen.on').get_by_role('button', name='Authentication failed', exact=True).click()
    page.locator('.screen.on .op-request-preview', has_text='认证没有成功').wait_for()
    next_step(page, 'choose')
    click(page, 'guide-prev')
    page.locator('.screen.on .op-request-preview', has_text='认证没有成功').wait_for()
    click(page, 'help')
    click(page, 'guide-request')
    assert '认证没有成功' in page.locator('dialog[open]').inner_text()
    page.locator('dialog [data-op=dialog-close]').click()
    click(page, 'return-help')
    page.context.set_offline(True)
    page.reload()
    page.locator('.screen.on .op-request-preview', has_text='认证没有成功').wait_for()
    click(page, 'guide-request')
    assert '认证没有成功' in page.locator('dialog[open]').inner_text()
    page.locator('dialog [data-op=dialog-close]').click()
    click(page, 'guide-reset')
    page.locator('.screen.on .op-request-preview', has_text='可以帮我连接机场 Wi-Fi 吗').wait_for()


def test_existing_saved_guide_is_migrated_without_losing_progress(page, site):
    open_pack(page, site, route='offline-guide')
    page.evaluate('() => LCOfflineDB.put("guide", {step: "assist", history: ["wifi", "auth"]})')
    page.reload()
    page.get_by_role('heading', name='Ask an airport staff member').wait_for()
    click(page, 'guide-prev')
    page.get_by_role('heading', name='Get help with authentication').wait_for()
    click(page, 'guide-request')
    assert '上网验证码' in page.locator('dialog[open]').inner_text()



def itinerary(page, hotel):
    page.evaluate('(hotel) => { window.lcOfflineTrip = async () => ({hotel, demo:false}); }', hotel)


def test_hotel_autofills_demo_without_saving_until_confirmed(page, site):
    open_pack(page, site, route='offline-hotel')
    page.locator('.screen.on .op-hotel-source h2', has_text='Filled from the demo itinerary').wait_for()
    form = page.locator('#op-hotel-form')
    assert form.locator('[name=name_zh]').input_value() == '上海璞丽酒店'
    assert form.locator('[name=address_zh]').input_value() == '上海市静安区常德路 1 号'
    assert 'NOT A REAL BOOKING' in page.locator('.screen.on').inner_text()
    assert not form.locator('[name=confirmed]').is_checked()
    assert page.evaluate('() => LCOfflineDB.get("hotel")') is None
    form.locator('[type=submit]').click()
    assert page.evaluate('() => LCOfflineDB.get("hotel")') is None
    form.locator('[name=confirmed]').check()
    form.locator('[type=submit]').click()
    page.locator('.screen.on .op-hotel-name').wait_for()
    assert page.evaluate('() => LCOfflineDB.get("hotel").then(h => h.demo)') is True
    nav(page, 'offline')
    download(page)
    page.context.set_offline(True)
    page.reload()
    page.get_by_test_id('pack-status').filter(has_text='Public guide saved').wait_for()
    nav(page, 'offline-hotel')
    assert '上海璞丽酒店' in page.locator('.screen.on .op-hotel-name').inner_text()


def test_itinerary_adapter_fills_booking_without_demo_or_guessed_translation(page, site):
    open_pack(page, site)
    itinerary(page, {'name':'Booked Hotel', 'name_zh':'已订酒店', 'address':'A confirmed address', 'address_zh':'已确认地址', 'phone':'+86 21 55556666'})
    nav(page, 'offline-hotel')
    page.locator('.screen.on .op-hotel-source h2', has_text='Filled from your itinerary').wait_for()
    form = page.locator('#op-hotel-form')
    assert form.locator('[name=name_en]').input_value() == 'Booked Hotel'
    assert form.locator('[name=address_zh]').input_value() == '已确认地址'
    assert page.locator('.screen.on .op-demo').count() == 0
    form.locator('[name=confirmed]').check()
    form.locator('[type=submit]').click()
    page.locator('.screen.on .op-hotel-name').wait_for()
    assert page.evaluate('() => LCOfflineDB.get("hotel").then(h => h.demo)') is False
    # A newly returned booking never silently replaces the saved hotel.
    itinerary(page, {'name':'Different hotel', 'name_zh':'另一个酒店'})
    nav(page, 'offline')
    nav(page, 'offline-hotel')
    assert page.locator('.screen.on .op-hotel-name').inner_text() == '已订酒店'


def test_incomplete_itinerary_does_not_fill_missing_chinese_from_demo(page, site):
    open_pack(page, site)
    itinerary(page, {'name':'Only English Hotel', 'address':'Only English address'})
    nav(page, 'offline-hotel')
    page.locator('.screen.on .op-hotel-source h2', has_text='Filled from your itinerary').wait_for()
    form = page.locator('#op-hotel-form')
    assert form.locator('[name=name_zh]').input_value() == ''
    assert form.locator('[name=address_zh]').input_value() == ''
    form.locator('[name=confirmed]').check()
    form.locator('[type=submit]').click()
    assert page.evaluate('() => LCOfflineDB.get("hotel")') is None


@pytest.mark.parametrize('blank_card', [False, True])
def test_late_itinerary_keeps_user_input_and_manual_choice(page, site, blank_card):
    open_pack(page, site)
    page.evaluate('() => { window.lcOfflineTrip = () => new Promise(resolve => { window.resolveHotel = resolve; }); }')
    nav(page, 'offline-hotel')
    page.locator('.screen.on .op-hotel-source h2', has_text='Checking your itinerary').wait_for()
    if blank_card:
        click(page, 'new-hotel')
    form = page.locator('#op-hotel-form')
    form.locator('[name=name_en]').fill('My unsaved hotel')
    form.locator('[name=notes]').fill('Keep my note')
    page.evaluate('''async () => {
      window.resolveHotel({hotel:{name:'Late booking',name_zh:'晚到的酒店'},demo:false});
      await new Promise(requestAnimationFrame);
    }''')
    assert form.locator('[name=name_en]').input_value() == 'My unsaved hotel'
    assert form.locator('[name=notes]').input_value() == 'Keep my note'
    assert form.locator('[name=notes]').evaluate('(el) => el === document.activeElement')
    assert form.locator('[name=name_zh]').input_value() == ''
    # Manual entry must stay manual, even after returning from another task.
    nav(page, 'offline-help')
    nav(page, 'offline-hotel')
    assert form.locator('[name=name_en]').input_value() == 'My unsaved hotel'


def test_clear_cancels_pending_itinerary_result(page, site):
    open_pack(page, site)
    page.evaluate('() => { window.lcOfflineTrip = () => new Promise(resolve => { window.resolveHotel = resolve; }); }')
    nav(page, 'offline-hotel')
    page.locator('.screen.on .op-hotel-source h2', has_text='Checking your itinerary').wait_for()
    nav(page, 'offline')
    page.on('dialog', lambda dialog: dialog.accept())
    click(page, 'clear')
    page.locator('.screen.on .op-notice', has_text='Personal details').wait_for()
    page.evaluate('''async () => {
      window.resolveHotel({hotel:{name:'Private late booking',name_zh:'不应重新出现的酒店'},demo:false});
      await new Promise(requestAnimationFrame);
    }''')
    nav(page, 'offline-hotel')
    assert page.locator('#op-hotel-form [name=name_en]').input_value() == ''
    assert '不应重新出现的酒店' not in page.locator('body').inner_text()
    assert page.evaluate('() => LCOfflineDB.get("hotel")') is None


@pytest.mark.parametrize('place_id, expected_request', [
    ('wifi', '我需要连接机场 Wi-Fi'),
    ('sim', '我想办理一张可以在中国上网的手机 SIM 卡'),
    ('exchange', '请问携程换汇柜台在哪里'),
    ('service', '请问 T2 国际到达大厅的外籍人员一站式综合服务中心在哪里'),
])
def test_service_discovery_uses_staff_requests_and_offline_fallback(page, site, place_id, expected_request):
    open_pack(page, site)
    download(page)
    page.context.set_offline(True)
    nav(page, 'offline-cards')
    assert 'What do you need help with?' in page.locator('.screen.on').inner_text()
    click(page, 'place', place_id)
    assert 'ASK WHERE TO GO' in page.locator('.screen.on').inner_text()
    assert page.locator('.screen.on .op-find-steps li').count() == 3
    click(page, 'place-card', place_id)
    chinese = page.locator('dialog[open] .op-dialog-body [lang=zh-CN]').inner_text()
    assert expected_request in chinese
    assert '请向机场工作人员询问' not in page.locator('dialog .op-dialog-body').inner_text()
    assert 'Destination' in page.locator('dialog .op-context').inner_text()
    page.locator('dialog [data-op=dialog-close]').click()
    click(page, 'place-service-card', place_id)
    assert page.locator('dialog[open] .op-dialog-body [lang=zh-CN]').inner_text() != chinese
    assert page.locator('dialog[open] #op-dialog-title').inner_text() == 'At the service counter'
    page.locator('dialog [data-op=dialog-close]').click()
    click(page, 'help')
    click(page, 'place-card', place_id)
    assert expected_request in page.locator('dialog[open] .op-dialog-body [lang=zh-CN]').inner_text()
    page.locator('dialog [data-op=dialog-close]').click()
    click(page, 'return-help')
    if place_id != 'service':
        page.locator('.screen.on .op-fallback [data-op=place]').click()
        assert page.locator('.screen.on h2').first.inner_text() == 'Get help from airport staff'
    else:
        page.locator('.screen.on .op-fallback [data-op=help]').click()
        assert '96990' in page.locator('.screen.on').inner_text()


def test_trip_counter_entry_and_phrase_categories_remain_available(page, site):
    open_pack(page, site)
    page.locator('.screen.on .op-trip-entry [data-op=place]').click()
    assert 'G check-in island near door 25' in page.locator('.screen.on .op-find-steps').inner_text()
    assert 'not a confirmed communication desk' in page.locator('.screen.on .op-find-steps').inner_text()
    nav(page, 'offline-cards')
    click(page, 'tab', 'All phrases')
    click(page, 'phrase', 'hotel')
    assert '请带我去这家酒店' in page.locator('dialog[open] [lang=zh-CN]').inner_text()
