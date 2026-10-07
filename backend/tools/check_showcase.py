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
        assert page.locator('.guide-source').count() == 2
        assert page.locator('.social-card .platform-youtube').count() == 4
        assert page.locator('.social-card .platform-x').count() == 1
        assert page.locator('.social-card .platform-reddit').count() == 1
        assert page.locator('.count-badge').count() == 0
        assert '票分' not in page.locator('#needs').inner_text()
        assert '点赞' not in page.locator('#needs').inner_text()
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
        page.locator('#needs').screenshot(path=str(output / 'needs-section-desktop.png'))
        page.locator('[data-evidence="Y11"]').click()
        assert page.locator('#evidenceDialog').is_visible()
        assert "we couldn't buy the water" in page.locator('#dialogContent blockquote').inner_text()
        assert '后来自行解决' in page.locator('.source-story').inner_text()
        assert page.locator('#dialogContent h3').count() == 0
        assert page.locator('.source-verification').count() == 0
        assert '视频发布' not in page.locator('#dialogContent').inner_text()
        assert '2026-10-07' not in page.locator('#dialogContent').inner_text()
        assert page.locator('.dialog-source').get_attribute('href').endswith('lc=Ugy8juSoi6ePoa6IJfx4AaABAg')
        page.screenshot(path=str(output / 'source-detail.png'), animations='disabled')
        page.keyboard.press('Escape')
        assert not page.locator('#evidenceDialog').is_visible()
        assert 'modal-open' not in (page.locator('html').get_attribute('class') or '')
        page.locator('[data-evidence="I01"]').click()
        assert '创作者攻略' in page.locator('.source-meta').inner_text()
        assert '旅行创作者' in page.locator('.source-story').inner_text()
        assert page.locator('.dialog-source').get_attribute('href') == 'https://www.instagram.com/p/DdJdnktiHrG/'
        page.keyboard.press('Escape')
        for topic in ['prep', 'payment', 'connectivity', 'transport', 'all']:
            page.locator(f'[data-topic="{topic}"]').click()
            assert page.locator('.social-card').count() > 0
            assert page.locator(f'[data-topic="{topic}"]').get_attribute('aria-pressed') == 'true'
        page.locator('#openArchive').click()
        assert page.locator('.archive-card').count() == 14
        page.locator('[data-archive-evidence="Y08"]').click()
        assert '创作者已回复' in page.locator('#dialogContent').inner_text()
        page.locator('#backToArchive').click()
        page.locator('[data-archive-evidence="N02"]').click()
        assert '商户付款后来正常' in page.locator('#dialogContent').inner_text()
        page.locator('#backToArchive').click()
        assert page.locator('.archive-card').count() == 14
        page.locator('[data-archive-evidence="X04"]').click()
        assert '正向反馈' in page.locator('.source-meta').inner_text()
        page.keyboard.press('Escape')
        page.locator('#languageSwitch').click()
        assert page.locator('html').get_attribute('lang') == 'en'
        assert page.locator('#needs h2').inner_text() == 'Read the guides. Still not sure.'
        assert not page.locator('[data-i18n]').evaluate_all('(nodes) => nodes.some(n => /[\u4e00-\u9fff]/.test(n.textContent))')
        assert video.evaluate('(v) => [...v.textTracks].some(t => t.language === "en" && t.mode === "showing")')
        page.locator('[data-evidence="Y01"]').click()
        assert page.locator('#dialogContent h3').count() == 0
        assert page.locator('.source-story').count() == 1
        assert not page.locator('#dialogContent').evaluate('(n) => /[\u4e00-\u9fff]/.test(n.textContent)')
        page.keyboard.press('Escape')
        page.locator('[data-evidence="I02"]').click()
        assert 'Creator guide' in page.locator('.source-meta').inner_text()
        assert 'Travel account' in page.locator('.source-story').inner_text()
        page.keyboard.press('Escape')
        page.locator('#openArchive').click()
        source_ids = page.locator('[data-archive-evidence]').evaluate_all('(nodes) => nodes.map(n => n.dataset.archiveEvidence)')
        for source_id in source_ids:
            page.locator(f'[data-archive-evidence="{source_id}"]').click()
            assert page.locator('.dialog-source').get_attribute('href').startswith('https://')
            assert not page.locator('#dialogContent').evaluate('(n) => /[\u4e00-\u9fff]/.test(n.textContent)')
            page.locator('#backToArchive').click()
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
                page.locator('#needs').screenshot(path=str(output / 'needs-section-mobile.png'))
                page.locator('[data-evidence="Y11"]').click()
                assert page.locator('#evidenceDialog').is_visible()
                assert page.evaluate('document.querySelector("#evidenceDialog").scrollWidth <= document.querySelector("#evidenceDialog").clientWidth')
                page.keyboard.press('Escape')
                page.locator('[data-evidence="I01"]').click()
                assert page.locator('#evidenceDialog').is_visible()
                page.keyboard.press('Escape')
        page.emulate_media(reduced_motion='reduce')
        assert page.locator('.social-card').first.evaluate('(n) => getComputedStyle(n).animationName') == 'none'
        browser.close()
    assert not errors, errors
    assert not failures, failures
    print(json.dumps({'result': 'passed', 'checks': '7 sections; 14 sources; distinct traveler/guide roles and follow-up; Chinese/English dialogs; filters; keyboard tabs; video playback and captions; assets; 320/390/768/1280 layouts; reduced motion', 'screenshots': str(output), 'page_errors': errors, 'http_errors': failures}, ensure_ascii=False))


if __name__ == '__main__':
    main()
