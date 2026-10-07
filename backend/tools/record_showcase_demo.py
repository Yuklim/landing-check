"""Record the actual local H5 prototype for the project showcase.

This is an interface recording, not the separate film under demo/film/.
Use the H5 development version at e6f9b3d (feature/tenpay-go), which has
the payment chooser. The showcase can be published separately from that H5.
Requires a running local backend, Playwright, Chrome and ffmpeg.
    python backend/tools/record_showcase_demo.py
"""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import time

import httpx
from playwright.sync_api import sync_playwright


def timestamp(seconds):
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3600000)
    minutes, millis = divmod(millis, 60000)
    sec, millis = divmod(millis, 1000)
    return f'{hours:02}:{minutes:02}:{sec:02}.{millis:03}'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', default='http://127.0.0.1:8010')
    args = parser.parse_args()
    base = args.base.rstrip('/')
    if not base.startswith(('http://127.0.0.1:', 'http://localhost:')):
        raise ValueError('Record a local demo only; this script resets mock data.')
    assets = Path(__file__).resolve().parents[1] / 'showcase' / 'assets'
    work = Path(tempfile.mkdtemp(prefix='landing-check-recording-'))
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg:
        raise RuntimeError('ffmpeg is required')
    with httpx.Client(timeout=10, trust_env=False) as client:
        client.post(base + '/mock/reset').raise_for_status()
    errors, cues = [], []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720},
                                      record_video_dir=str(work),
                                      record_video_size={'width': 1280, 'height': 720})
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.route('https://fonts.googleapis.com/**', lambda route: route.abort())
        page.route('https://fonts.gstatic.com/**', lambda route: route.abort())
        started = time.monotonic()

        def hold(zh, en, seconds):
            start = time.monotonic() - started
            page.wait_for_timeout(seconds * 1000)
            cues.append((start, time.monotonic() - started, zh, en))

        def node(route, name):
            return page.locator(f'.screen[data-route="{route}"] [data-pencil-name="{name}"]').first

        def visible(route):
            page.locator(f'.screen.on[data-route="{route}"]').wait_for()

        page.goto(base + '/app/index.html#preflight', wait_until='networkidle')
        page.wait_for_function('document.querySelector("#lcdot").textContent.includes("后端已连接")')
        # The screen capture omits developer controls and the local API address.
        page.add_style_tag(content='#hint,#menu,#lcdot{display:none!important}')
        page.wait_for_timeout(300)
        page.screenshot(path=str(assets / 'demo-poster.png'))
        hold('行前检查：网络、支付和去酒店的准备。', 'Before the flight: check data, payment and the first ride.', 3)
        node('preflight', 'Item Alipay payment').locator('[data-guide="alipay_setup_before_flight"]').click()
        visible('tutorial')
        hold('图文教程：把设置过程拆成一步一图。', 'Visual tutorials: one actionable step at a time.', 3)
        page.locator('#tutNext').click()
        hold('遇到陌生界面，按照步骤继续。', 'Follow a concrete step through an unfamiliar interface.', 2)
        page.locator('.screen.on [data-act="back"]').first.click()
        visible('preflight')
        node('preflight', 'Item Alipay payment').locator('[data-pencil-name="Item Button"]').click()
        page.locator('[data-pencil-name="Pay Chooser"]').wait_for(state='visible')
        hold('选择支付方式：支付宝或 TenPayGo。', 'Choose a payment method: Alipay or TenPayGo.', 2)
        page.locator('[data-pencil-name="Pay Chooser"] [data-pay="alipay"]').click()
        visible('payment')
        hold('支付验证成功 / 失败分支。此处为模拟交易。', 'Payment verification flow. This transaction is simulated.', 4)
        node('payment', 'Done Button').click()
        visible('preflight')
        hold('一种支付方式已就绪，另一种可作为备用。', 'One payment method is ready; the other can be a backup.', 2)
        node('preflight', 'Run Check Button').click()
        page.locator('#notif.show.in').wait_for()
        hold('模拟航班落地，进入落地检查。', 'A simulated arrival opens the landing check.', 2)
        page.locator('#notif [data-n="1"]').click()
        visible('trips')
        node('trips', 'LC Button').click()
        visible('step1')
        hold('落地第一步：先确认联网。', 'First on arrival: get connected.', 3)
        node('step1', 'Primary Button').click()
        visible('wifi')
        hold('需要机场 Wi-Fi 时，找到适用的认证路径。', 'Find the airport Wi-Fi sign-in route that fits.', 3)
        node('wifi', 'Open Settings').click()
        visible('step3')
        hold('结合到达条件，查看交通推荐与备选。', 'Review transport choices for the arrival conditions.', 3)
        node('step3', 'Primary Button').click()
        visible('driver')
        hold('中文地址卡，直接展示给司机。', 'Show the Chinese hotel address to the driver.', 3)
        node('driver', 'Close').click()
        visible('step3')
        node('step3', 'In Car Button').click()
        visible('done')
        hold('完整原型演示：支付、航班和行程数据均为模拟。', 'Prototype walkthrough: payments, flights and trip data are simulated.', 3)
        path = page.video.path()
        context.close()
        browser.close()
    if errors:
        raise RuntimeError(errors)
    subprocess.run([ffmpeg, '-y', '-i', str(path), '-an', '-c:v', 'libx264',
                    '-preset', 'medium', '-crf', '22', '-pix_fmt', 'yuv420p',
                    '-movflags', '+faststart', str(assets / 'demo.mp4')], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    for lang, index in [('zh', 2), ('en', 3)]:
        lines = ['WEBVTT', '']
        for cue in cues:
            lines.extend([f'{timestamp(cue[0])} --> {timestamp(cue[1])}', cue[index], ''])
        (assets / f'demo-{lang}.vtt').write_text('\n'.join(lines), encoding='utf-8', newline='\n')
    print(json.dumps({'video': str(assets / 'demo.mp4'), 'duration_seconds': cues[-1][1],
                      'captions': len(cues), 'page_errors': errors}, ensure_ascii=False))


if __name__ == '__main__':
    main()
