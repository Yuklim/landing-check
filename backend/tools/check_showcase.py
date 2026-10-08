"""Browser smoke check for the showcase. Requires Playwright + Chromium.

Run the API locally first, then:
    python backend/tools/check_showcase.py --url http://127.0.0.1:8010/showcase/
Screenshots are written to the system temporary directory, not production assets.
"""
import argparse
import json
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright, expect


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
        assert page.locator('.story-section').evaluate_all('(nodes) => nodes.map(n => n.id)') == ['needs', 'product', 'build', 'thoughts', 'next']
        assert page.locator('#sectionNav a').count() == 5
        assert page.locator('#build h2').inner_text() == '技术栈'
        assert page.locator('#thoughts h2').inner_text() == '我们的思考'
        assert 'FastAPI' in page.locator('#build').inner_text()
        assert 'Playwright' in page.locator('#build').inner_text()
        assert 'Claude' not in page.locator('main').inner_text()
        assert 'Codex' not in page.locator('main').inner_text()
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
        assert 57 < video.evaluate('(v) => v.duration') < 58
        assert video.evaluate('(v) => v.videoWidth') == 1920
        assert video.evaluate('(v) => v.currentSrc').endswith('/assets/landing-check-final.mp4')
        assert video.locator('track').count() == 0  # Final film has burned-in bilingual subtitles.
        video.evaluate('(v) => v.play()')
        page.wait_for_function('document.querySelector("#videoPanel video").currentTime > 0.2')
        video.evaluate('(v) => { v.pause(); v.currentTime = 0; }')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert page.locator('img').evaluate_all('(imgs) => imgs.every(img => img.complete && img.naturalWidth > 0)')
        page.screenshot(path=str(output / 'desktop-zh.png'), full_page=True)
        page.emulate_media(reduced_motion='reduce')
        for section_id in ['needs', 'product', 'build', 'thoughts', 'next']:
            link = page.locator(f'#sectionNav a[href="#{section_id}"]')
            link.click()
            expect(link).to_have_attribute('aria-current', 'location')
        page.locator('#sectionNav a[href="#build"]').click()
        page.screenshot(path=str(output / 'tech-stack-viewport.png'))
        page.locator('#sectionNav a[href="#thoughts"]').click()
        page.screenshot(path=str(output / 'reflections-viewport.png'))
        page.emulate_media(reduced_motion='no-preference')
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
        assert page.locator('#needs h2').inner_text() == 'Why we started Landing Check'
        assert page.locator('#build h2').inner_text() == 'Tech stack'
        assert page.locator('#thoughts h2').inner_text() == 'Our reflections'
        assert not page.locator('[data-i18n]').evaluate_all('(nodes) => nodes.some(n => /[\u4e00-\u9fff]/.test(n.textContent))')
        assert page.locator('.hero-actions .video-link').get_attribute('href') == '#demoVideo'
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

        # The public entry stays on the showcase and scrolls to its inline film.
        page.set_viewport_size({'width': 1440, 'height': 1050})
        showcase_path = page.evaluate('location.pathname')
        page.locator('.hero-actions .video-link').click()
        page.wait_for_url('**/#demoVideo')
        assert page.evaluate('location.pathname') == showcase_path
        assert 0 <= page.locator('#videoTitle').bounding_box()['y'] < 300
        player = page.locator('#videoPanel video')
        assert 57 < player.evaluate('(v) => v.duration') < 58
        assert player.evaluate('(v) => v.videoWidth') == 1920
        assert player.evaluate('(v) => v.controls && v.playsInline && !v.autoplay')
        player.evaluate('(v) => v.play()')
        page.wait_for_function('document.querySelector("#videoPanel video").currentTime > 0.2')
        player.evaluate('(v) => { v.pause(); v.currentTime = 8; }')
        page.wait_for_function('!document.querySelector("#videoPanel video").seeking')
        page.screenshot(path=str(output / 'inline-video-desktop.png'))
        for width in [320, 390, 768, 1280]:
            page.set_viewport_size({'width': width, 'height': 844})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Player overflow at {width}'
            assert player.bounding_box()['width'] <= width
            if width == 390:
                page.locator('.hero-actions .video-link').click()
                assert 0 <= page.locator('#videoTitle').bounding_box()['y'] < 300
                page.screenshot(path=str(output / 'inline-video-mobile.png'))
        page.locator('#languageSwitch').click()
        assert page.locator('html').get_attribute('lang') == 'en'
        assert page.locator('#videoTitle').inner_text() == 'Demo video'
        assert not page.locator('[data-i18n]').evaluate_all('(nodes) => nodes.some(n => /[\u4e00-\u9fff]/.test(n.textContent))')
        assert player.evaluate('(v) => v.currentTime') >= 8  # Language switching preserves playback position.
        page.reload(wait_until='networkidle')
        assert page.locator('html').get_attribute('lang') == 'en'
        page.locator('.hero-actions .video-link').click()
        assert page.evaluate('location.pathname') == showcase_path
        assert page.evaluate('location.hash') == '#demoVideo'
        page.locator('#languageSwitch').click()
        page.reload(wait_until='networkidle')
        assert page.locator('html').get_attribute('lang') == 'zh-CN'
        browser.close()
    assert not errors, errors
    assert not failures, failures
    print(json.dumps({'result': 'passed', 'checks': '5 sections; tech stack and reflections; 14 sources; Chinese/English dialogs; filters; keyboard tabs; final 57s film; project demo scrolls to inline video; playback and seeking; language preserves playback position; assets; 320/390/768/1280 layouts; reduced motion', 'screenshots': str(output), 'page_errors': errors, 'http_errors': failures}, ensure_ascii=False))


if __name__ == '__main__':
    main()
