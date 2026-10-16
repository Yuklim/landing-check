"""Real browser coverage for keepsakes, local Community, privacy and offline storage.

E2E=1 E2E_CHANNEL=chrome python -m pytest -q backend/tests/test_stamp_e2e.py
Uses the same real scoped HTTP server / Service Worker as the travel-pack tests.
"""
import json
import os
import struct

import pytest
from test_offline_e2e import site, browser, page, download, nav, open_pack

pytestmark = pytest.mark.skipif(not os.environ.get('E2E'), reason='set E2E=1 to run browser tests')


def open_stamp(page, site, route='share', prefix='/landing-check/h5/'):
    page.goto(site[0] + prefix + 'index.html#' + route)
    page.locator('.screen.on .fs-body').wait_for()
    page.wait_for_function('() => !document.querySelector(".screen.on .fs-empty")?.textContent.includes("Opening")')
    if route in ('share', 'community-compose'):
        page.locator('.screen.on canvas[data-fs-card]').wait_for()
        page.wait_for_function('() => document.querySelector(".screen.on .fs-preview-status").textContent === ""')


def click(page, action, value=None):
    selector = '.screen.on [data-fs="%s"]' % action
    if value is not None:
        selector += '[data-value="%s"]' % value
    page.locator(selector).first.click()


def personalize(page, name='Alex', visible=True, date_visible=False):
    page.locator('[data-fs-customize] summary').click()
    form = page.locator('#fs-customize')
    form.locator('[name=name]').fill(name)
    form.locator('[name=arrival]').fill('2026-10-12')
    form.locator('[name=showName]').set_checked(visible)
    form.locator('[name=showDate]').set_checked(date_visible)
    page.wait_for_function('() => LCOfflineDB.get("first-stamp").then(d => d && d.draft.name.length > 0)')


def unlock(page):
    details = page.locator('[data-fs-unlock]')
    if not details.get_attribute('open') == '':
        details.locator('summary').click()
    form = page.locator('#fs-unlock-form')
    for name in ('arrived', 'internet', 'payment', 'transport'):
        form.locator('[name=%s]' % name).check()
    form.locator('[type=submit]').click()
    page.locator('.fs-feedback', has_text='Shanghai unlocked').wait_for()


@pytest.mark.parametrize('route', ['share', 'community', 'community-compose', 'community-post', 'city-passport'])
def test_direct_routes_and_real_navigation(page, site, route):
    open_stamp(page, site, route)
    assert page.locator('.screen.on').get_attribute('data-route') == route
    click(page, 'nav', 'home')
    page.locator('.screen.on [data-pencil-name="Tab Community"]').click()
    page.locator('.screen.on h1', has_text='Shanghai Community').wait_for()
    click(page, 'open-post', 'sample-first-light')
    assert 'A little nervous' in page.locator('.screen.on h2').inner_text()
    click(page, 'back')
    assert page.locator('.screen.on').get_attribute('data-route') == 'community'


def test_real_png_export_and_public_allowlist(page, site, tmp_path):
    open_stamp(page, site)
    personalize(page, name='A very long traveler name 世界 🧳', visible=False)
    page.evaluate('() => LCOfflineDB.put("hotel", {name_zh:"私密酒店",address_zh:"秘密地址",phone:"PRIVATE-PHONE"})')
    with page.expect_download() as pending:
        click(page, 'save-image')
    path = tmp_path / 'stamp.png'
    pending.value.save_as(path)
    content = path.read_bytes()
    assert content[:8] == b'\x89PNG\r\n\x1a\n'
    assert struct.unpack('>II', content[16:24]) == (1080, 1350)
    assert len(content) > 100000
    projected = page.evaluate('''async () => {
      const c=await (await fetch('data/first-stamp.json')).json();
      const saved=await LCOfflineDB.get('first-stamp');
      return LCStampRenderer.publicCard(c,{...saved.draft,hotel:'LEAK',payment:'LEAK',location:'LEAK'},null);
    }''')
    assert projected['traveler'] == 'A traveler' and projected['arrival'] is None
    assert not {'hotel', 'payment', 'location', 'phone'} & projected.keys()
    assert '私密' not in json.dumps(projected, ensure_ascii=False)
    assert 'A traveler' in page.locator('canvas[data-fs-card]').get_attribute('aria-label')


def test_explicit_unlock_is_persistent_and_not_awarded_by_visiting(page, site):
    open_stamp(page, site)
    click(page, 'nav', 'city-passport')
    assert page.locator('.fs-count').inner_text() == '00'
    click(page, 'nav', 'share')
    unlock(page)
    click(page, 'nav', 'city-passport')
    assert page.locator('.fs-count').inner_text() == '01'
    page.reload()
    page.locator('.fs-count', has_text='01').wait_for()
    click(page, 'nav', 'share')
    assert page.locator('#fs-unlock-form').count() == 0
    assert page.evaluate('() => LCOfflineDB.get("first-stamp").then(d=>d.stamps.length)') == 1


def test_community_post_snapshot_bookmark_and_delete(page, site):
    open_stamp(page, site)
    personalize(page, name='Public Alex', visible=True)
    unlock(page)
    click(page, 'compose')
    form = page.locator('#fs-compose-form')
    form.locator('[name=caption]').fill('Hello from my first city. <script>no script execution</script>')
    form.locator('[name=reviewed]').check()
    form.locator('[type=submit]').click()
    page.locator('.fs-feedback', has_text='Not published to Trip.com').wait_for()
    assert 'Public Alex' in page.locator('.fs-story-author').inner_text()
    assert '<script>' in page.locator('.fs-story-body').inner_text()
    post = page.evaluate('() => LCOfflineDB.get("first-stamp").then(d=>d.posts[0])')
    assert post['card']['traveler'] == 'Public Alex' and post['card']['arrival'] is None
    assert not {'draft', 'hotel', 'phone', 'confirmations'} & post.keys()
    click(page, 'bookmark', post['id'])
    click(page, 'nav', 'city-passport')
    assert page.locator('.fs-post', has_text='Hello from my first city').count() == 1
    click(page, 'open-post', post['id'])
    page.once('dialog', lambda dialog: dialog.accept())
    click(page, 'delete-post', post['id'])
    assert page.evaluate('() => LCOfflineDB.get("first-stamp").then(d=>[d.posts.length,d.bookmarks.length])') == [0, 0]


def test_native_share_cancel_and_stale_privacy_preparation(page, site):
    page.add_init_script('''
      Object.defineProperty(navigator,'canShare',{value:()=>true});
      Object.defineProperty(navigator,'share',{value:async data=>{
        window.testShare={text:data.text,name:data.files[0].name,size:data.files[0].size};
        throw new DOMException('Canceled','AbortError');
      }});
    ''')
    open_stamp(page, site)
    personalize(page, name='SECRET-NICKNAME', visible=True)
    click(page, 'share-image')
    page.locator('[data-fs=native-share]').wait_for()
    # Changing a public field must invalidate an already-generated share payload.
    page.locator('#fs-customize [name=showName]').uncheck()
    click(page, 'native-share')
    page.locator('.fs-feedback', has_text='Generate your image again').wait_for()
    assert page.evaluate('typeof window.testShare') == 'undefined'
    click(page, 'share-image')
    page.locator('[data-fs=native-share]').wait_for()
    click(page, 'native-share')
    page.locator('.fs-feedback', has_text='Sharing canceled').wait_for()
    assert 'SECRET-NICKNAME' not in page.evaluate('window.testShare.text')
    assert page.locator('.screen.on').get_attribute('data-route') == 'share'


def test_offline_reopen_keeps_card_atlas_and_composer(page, site, tmp_path):
    open_stamp(page, site)
    personalize(page, name='Offline Alex', visible=True)
    unlock(page)
    click(page, 'compose')
    page.locator('[name=caption]').fill('An offline draft to finish later.')
    nav(page, 'offline')
    download(page)
    context = page.context
    context.set_offline(True)
    page.close()
    reopened = context.new_page()
    reopened.goto(site[0] + '/landing-check/h5/index.html#community-compose')
    reopened.locator('[name=caption]').wait_for()
    assert reopened.locator('[name=caption]').input_value() == 'An offline draft to finish later.'
    reopened.wait_for_function('() => document.querySelector(".screen.on .fs-preview-status").textContent === ""')
    nav(reopened, 'share')
    with reopened.expect_download() as pending:
        click(reopened, 'save-image')
    path = tmp_path / 'offline.png'; pending.value.save_as(path)
    assert struct.unpack('>II', path.read_bytes()[16:24]) == (1080, 1350)
    nav(reopened, 'city-passport')
    assert reopened.locator('.fs-count').inner_text() == '01'
    nav(reopened, 'community-compose')
    context.set_offline(False)
    assert reopened.locator('[name=caption]').input_value() == 'An offline draft to finish later.'
    nav(reopened, 'share'); click(reopened, 'compose')
    reopened.locator('.screen.on #fs-compose-form').wait_for()
    # Help returns to the exact task with the draft intact.
    reopened.locator('.screen.on [data-op=help]').click()
    reopened.locator('.screen.on [data-op=return-help]').click()
    assert reopened.locator('[name=caption]').input_value() == 'An offline draft to finish later.'


def test_clear_all_cancels_queued_drafts_and_hidden_canvas(page, site):
    open_stamp(page, site)
    personalize(page, name='ERASE-ME', visible=True)
    unlock(page)
    click(page, 'compose')
    page.locator('[name=caption]').fill('ERASE-THIS-DRAFT')
    nav(page, 'offline')
    page.once('dialog', lambda dialog: dialog.accept())
    page.locator('[data-op=clear]').click()
    page.locator('.op-notice', has_text='Personal details').wait_for()
    page.wait_for_timeout(300)  # exceed the deferred draft write window
    assert page.evaluate('() => LCOfflineDB.get("first-stamp")') is None
    assert page.locator('.lc-stamp canvas').count() == 0
    nav(page, 'city-passport')
    assert page.locator('.fs-count').inner_text() == '00'
    assert 'ERASE-ME' not in page.locator('.lc-stamp').all_text_contents()


def test_storage_failure_does_not_award_stamp(page, site):
    open_stamp(page, site)
    page.evaluate('() => LCOfflineDB.put=async()=>{throw new Error("Storage full. Free space and try again.")}')
    details=page.locator('[data-fs-unlock]');details.locator('summary').click()
    for name in ('arrived', 'internet', 'payment', 'transport'):
        page.locator('#fs-unlock-form [name=%s]' % name).check()
    page.locator('#fs-unlock-form [type=submit]').click()
    page.locator('.fs-feedback', has_text='Storage full').wait_for()
    click(page, 'nav', 'city-passport')
    assert page.locator('.fs-count').inner_text() == '00'


def test_privacy_change_during_image_generation_aborts_old_payload(page, site):
    open_stamp(page, site)
    personalize(page, name='SECRET-DURING-RENDER', visible=True)
    page.evaluate('''() => {
      const original=LCStampRenderer.blob;
      LCStampRenderer.blob=async (...args)=>{
        await new Promise(resolve=>window.finishImage=resolve);
        return original(...args);
      };
    }''')
    click(page, 'share-image')
    page.wait_for_function('() => !!window.finishImage')
    page.locator('#fs-customize [name=showName]').uncheck()
    page.evaluate('() => window.finishImage()')
    page.locator('.fs-feedback', has_text='public fields changed').wait_for()
    assert page.locator('[data-fs=native-share]').count() == 0
    assert page.locator('.fs-download-preview').count() == 0


def test_share_and_clipboard_failure_have_honest_fallbacks(page, site):
    page.add_init_script('''
      Object.defineProperty(navigator,'canShare',{value:undefined});
      Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('Denied')}}});
      document.execCommand=()=>false;
    ''')
    open_stamp(page, site)
    click(page, 'share-image')
    page.locator('[data-fs=native-share]').wait_for()
    click(page, 'native-share')
    page.locator('.fs-feedback', has_text='File sharing is unavailable').wait_for()
    assert page.locator('.fs-download-preview img').get_attribute('src').startswith('blob:')
    click(page, 'copy-caption')
    page.locator('.fs-feedback', has_text='Could not copy').wait_for()


def test_clear_only_atlas_keeps_offline_hotel(page, site):
    open_stamp(page, site)
    unlock(page)
    page.evaluate('() => LCOfflineDB.put("hotel",{name_zh:"KEEP-HOTEL"})')
    click(page, 'nav', 'city-passport')
    page.once('dialog', lambda dialog: dialog.accept())
    click(page, 'clear-stamps')
    page.locator('.fs-feedback', has_text='Stamps, posts and sharing drafts cleared').wait_for()
    assert page.locator('.fs-count').inner_text() == '00'
    assert page.evaluate('() => LCOfflineDB.get("hotel").then(d=>d.name_zh)') == 'KEEP-HOTEL'
    saved=page.evaluate('() => LCOfflineDB.get("first-stamp")')
    assert saved['stamps'] == [] and saved['draft']['name'] == ''


def test_future_arrival_does_not_unlock_and_topics_work(page, site):
    open_stamp(page, site)
    personalize(page, name='Preview', visible=False)
    page.locator('#fs-customize [name=arrival]').fill('2099-12-31')
    page.locator('[data-fs-unlock] summary').click()
    for name in ('arrived', 'internet', 'payment', 'transport'):
        page.locator('#fs-unlock-form [name=%s]' % name).check()
    page.locator('#fs-unlock-form [type=submit]').click()
    page.locator('.fs-feedback', has_text='on or before today').wait_for()
    click(page, 'nav', 'community')
    click(page, 'filter', 'Local Tips')
    assert page.locator('.fs-post').count() == 1
    click(page, 'bookmark', 'sample-right-words')
    click(page, 'nav', 'city-passport')
    assert page.locator('.screen.on .fs-post', has_text='Keep the right words close').count() == 1
    page.reload()
    page.locator('.screen.on .fs-post', has_text='Keep the right words close').wait_for()
    assert page.locator('.fs-count').inner_text() == '00'


@pytest.mark.parametrize('width', [320, 393])
def test_mobile_layout_and_app_mount(page, site, width):
    page.set_viewport_size({'width':width,'height':852})
    open_stamp(page, site, prefix='/app/')
    assert page.evaluate('() => document.querySelector(".screen.on .scroll").scrollWidth <= 393')
    assert page.locator('.fs-nav').is_visible()
    click(page, 'nav', 'community')
    assert page.locator('.fs-post').count() == 3
    assert page.locator('.screen.on [data-fs-online]').get_attribute('href') == 'https://www.trip.com/moments/'
