"""Browser smoke check for the showcase. Requires Playwright + Chromium.

Run the API locally first, then:
    python backend/tools/check_showcase.py --url http://127.0.0.1:8010/showcase/
Screenshots are written to the system temporary directory, not production assets.
"""
import argparse
import json
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='http://127.0.0.1:8010/showcase/')
    parser.add_argument('--channel', default='chrome', help='Installed browser channel; default: chrome')
    args = parser.parse_args()
    output = Path(tempfile.gettempdir()) / 'landing-check-review'
    output.mkdir(exist_ok=True)
    errors, failures = [], []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel=args.channel)
        page = browser.new_page(viewport={'width': 1440, 'height': 1050}, device_scale_factor=1)
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: failures.append(f'{response.status} {response.url}') if response.status >= 400 else None)
        page.goto(args.url, wait_until='networkidle')
        page.wait_for_timeout(1000)
        assert page.locator('html').get_attribute('lang') == 'zh-CN'
        assert page.locator('.story-section').count() == 7
        assert page.locator('.social-card').count() == 6
        assert page.locator('.count-badge').inner_text() == '17'
        video = page.locator('#videoPanel video')
        assert video.count() == 1
        page.wait_for_function('Number.isFinite(document.querySelector("#videoPanel video").duration)')
        assert 30 < video.evaluate('(v) => v.duration') < 45
        assert video.evaluate('(v) => v.videoWidth') == 1280
        assert video.evaluate('(v) => [...v.textTracks].some(t => t.language === "zh" && t.mode === "showing")')
        video.evaluate('(v) => v.play()')
        page.wait_for_function('document.querySelector("#videoPanel video").currentTime > 0.2')
        video.evaluate('(v) => { v.pause(); v.currentTime = 0; }')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert page.locator('img').evaluate_all('(imgs) => imgs.every(img => img.complete && img.naturalWidth > 0)')
        page.screenshot(path=str(output / 'desktop-zh.png'), full_page=True)
        page.locator('#needs').scroll_into_view_if_needed()
        page.screenshot(path=str(output / 'needs-desktop.png'))
        page.locator('[data-evidence="R06"]').click()
        assert page.locator('#evidenceDialog').is_visible()
        assert 'Passport verified' in page.locator('#dialogContent blockquote').inner_text()
        assert page.locator('.dialog-source').get_attribute('href').startswith('https://www.reddit.com/')
        page.screenshot(path=str(output / 'source-detail.png'))
        page.keyboard.press('Escape')
        assert not page.locator('#evidenceDialog').is_visible()
        assert 'modal-open' not in (page.locator('html').get_attribute('class') or '')
        for topic in ['prep', 'payment', 'connectivity', 'transport', 'all']:
            page.locator(f'[data-topic="{topic}"]').click()
            assert page.locator('.social-card').count() > 0
            assert page.locator(f'[data-topic="{topic}"]').get_attribute('aria-pressed') == 'true'
        page.locator('#openArchive').click()
        assert page.locator('.archive-card').count() == 17
        page.locator('[data-archive-evidence="N02"]').click()
        assert '商户付款后来正常' in page.locator('#dialogContent').inner_text()
        page.locator('#backToArchive').click()
        assert page.locator('.archive-card').count() == 17
        page.keyboard.press('Escape')
        page.locator('#languageSwitch').click()
        assert page.locator('html').get_attribute('lang') == 'en'
        assert page.locator('#needs h2').inner_text() == 'Read the guides. Still not sure.'
        assert not page.locator('[data-i18n]').evaluate_all('(nodes) => nodes.some(n => /[\u4e00-\u9fff]/.test(n.textContent))')
        assert video.evaluate('(v) => [...v.textTracks].some(t => t.language === "en" && t.mode === "showing")')
        page.locator('[data-evidence="R04"]').click()
        assert 'The need this supports' in page.locator('#dialogContent').inner_text()
        page.keyboard.press('Escape')
        page.locator('#stageTab0').click()
        page.keyboard.press('ArrowRight')
        assert page.locator('#stageTab1').get_attribute('aria-selected') == 'true'
        page.keyboard.press('End')
        assert page.locator('#stageTab3').get_attribute('aria-selected') == 'true'
        assert 'Chinese hotel address' in page.locator('#productStage img').get_attribute('alt')
        page.evaluate('scrollTo(0,0)')
        page.screenshot(path=str(output / 'desktop-en.png'), full_page=True)
        page.locator('#languageSwitch').click()
        for width in [320, 390, 768, 1280]:
            page.set_viewport_size({'width': width, 'height': 844})
            page.evaluate('scrollTo(0,0)')
            page.wait_for_timeout(150)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Horizontal overflow at {width}'
            if width == 390:
                page.screenshot(path=str(output / 'mobile-zh.png'), full_page=True)
                page.locator('#needs').scroll_into_view_if_needed()
                page.screenshot(path=str(output / 'needs-mobile.png'))
                page.locator('[data-evidence="R04"]').click()
                assert page.locator('#evidenceDialog').is_visible()
                page.keyboard.press('Escape')
        page.emulate_media(reduced_motion='reduce')
        assert page.locator('.social-card').first.evaluate('(n) => getComputedStyle(n).animationName') == 'none'
        browser.close()
    assert not errors, errors
    assert not failures, failures
    print(json.dumps({'result': 'passed', 'checks': '7 sections; 17 sources; Chinese/English; filters; dialogs; keyboard tabs; video playback and captions; assets; 320/390/768/1280 layouts; reduced motion', 'screenshots': str(output), 'page_errors': errors, 'http_errors': failures}, ensure_ascii=False))


if __name__ == '__main__':
    main()
