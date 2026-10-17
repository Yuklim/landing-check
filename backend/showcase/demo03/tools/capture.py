# -*- coding: utf-8 -*-
"""03 Demo 截图工具：用 Playwright 打开本地 H5，按操作顺序截屏，产出 player.js 需要的 shots 规格。

用法（每个模块写一个 capture_<key>.py 调它）：
    from capture import Cap
    with Cap('tickets') as c:              # 输出到 modules/tickets/shots/
        c.open('home')                     # 打开 H5（新访客、关新手演示、隐藏调试角标）
        c.go('preflight')                  # 等同页面里的 show(route)
        s = c.shot('preflight')            # 截当前屏：底图 + 滚动区全长图 + 浮层，返回 shot 规格 dict
        xy = c.center('[data-pencil-name="Item Attractions"]')   # 点按坐标（手机屏 CSS 像素，按当前真实滚动位置）
        c.tap('[data-pencil-name="Item Attractions"]')            # 在真实页面里点它，推进到下一屏
        c.dump({'preflight': s, ...})      # 写 modules/tickets/shots.json，方便核对

环境：H5_BASE 默认 http://127.0.0.1:8765/app/index.html（后端已用 backend/.env 启动，带携程官方 MCP 真实数据）。
"""
import json, os, time
from PIL import Image
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BASE = os.environ.get('H5_BASE', 'http://127.0.0.1:8765/app/index.html')
DPR = 2
W, H = 393, 852
VIEWPORT = {'width': 900, 'height': 892}
FAB_SEL = ':scope > [data-pencil-name="Stuck FAB"], :scope > [data-pencil-name="AI Pill"]'
HIDE_CSS = '#lcdot,#menu,#hint{display:none !important}'


class Cap:
    def __init__(self, module, headless=True):
        self.module = module
        self.out = os.path.join(ROOT, 'modules', module, 'shots')
        os.makedirs(self.out, exist_ok=True)
        self.headless = headless

    # ---------- 生命周期 ----------
    def __enter__(self):
        self._pw = sync_playwright().start()
        self.browser = self._pw.chromium.launch(headless=self.headless)
        # 用桌面尺寸打开：H5 在 ≤430px 宽时进入 mobile 模式，会藏掉设计稿里的状态栏和灵动岛；892 高让 #phone 缩放正好为 1
        self.ctx = self.browser.new_context(viewport=VIEWPORT, device_scale_factor=DPR, locale='en-US')
        self.page = self.ctx.new_page()
        self.page.on('pageerror', lambda e: print('[pageerror]', e))
        return self

    def __exit__(self, *a):
        self.ctx.close(); self.browser.close(); self._pw.stop()

    # ---------- 导航 ----------
    def open(self, route='home', query='guide=0', wait_backend=True):
        pg = self.page
        pg.goto(f'{BASE}?{query}#{route}')
        pg.add_style_tag(content=HIDE_CSS)
        if wait_backend:
            try:
                pg.wait_for_function('() => document.querySelector("#lcdot") && /后端已连接/.test(document.querySelector("#lcdot").textContent)', timeout=8000)
            except Exception:
                print('[warn] backend status not confirmed; continuing')
        self.settle(800)

    def go(self, route, wait=700):
        self.page.evaluate('r => show(r)', route); self.settle(wait)

    def tap(self, selector, wait=900, nth=0):
        """在真实页面点击（用于推进流程）。selector 是 CSS，范围限定在当前屏 .screen.on 内；以 '!' 开头则在整页找。"""
        loc = self._loc(selector).nth(nth)
        loc.scroll_into_view_if_needed(); loc.click(); self.settle(wait)

    def settle(self, ms=600):
        self.page.wait_for_timeout(ms)
        try:
            self.page.wait_for_load_state('networkidle', timeout=4000)
        except Exception:
            pass
        self.wait_images()

    def wait_images(self, timeout=6000):
        try:
            self.page.wait_for_function('() => [...document.querySelectorAll(".screen.on img")].every(i => i.complete)', timeout=timeout)
        except Exception:
            print('[warn] some images still loading')

    def route(self):
        return self.page.evaluate('() => (document.querySelector(".screen.on")||{}).dataset?.route')

    # ---------- 坐标（手机屏 CSS 像素） ----------
    def _loc(self, selector):
        if selector.startswith('!'):
            return self.page.locator(selector[1:])
        return self.page.locator('.screen.on').locator(selector)

    def rect(self, selector, nth=0):
        """元素在手机屏上的 [x, y, w, h]，按当前真实滚动位置。"""
        b = self._loc(selector).nth(nth).bounding_box()
        ph = self.page.locator('#phone').bounding_box()
        if not b:
            raise RuntimeError('not visible: ' + selector)
        return [round(b['x'] - ph['x']), round(b['y'] - ph['y']), round(b['width']), round(b['height'])]

    def center(self, selector, nth=0):
        x, y, w, h = self.rect(selector, nth)
        return [round(x + w / 2), round(y + h / 2)]

    def rect_text(self, text, nth=0, exact=False):
        """按可见文字找元素（当前屏内）。"""
        loc = self.page.locator('.screen.on').get_by_text(text, exact=exact).nth(nth)
        b = loc.bounding_box(); ph = self.page.locator('#phone').bounding_box()
        return [round(b['x'] - ph['x']), round(b['y'] - ph['y']), round(b['width']), round(b['height'])]

    # ---------- 滚动 ----------
    def scroller(self):
        """当前屏的主滚动区：优先 :scope > .scroll，否则取可滚动距离最大的后代。返回 JS handle。"""
        return self.page.evaluate_handle('''() => {
          const s = document.querySelector('.screen.on'); if (!s) return null;
          const direct = s.querySelector(':scope > .scroll');
          if (direct && direct.scrollHeight > direct.clientHeight + 4) return direct;
          let best = null, gap = 4;
          for (const e of s.querySelectorAll('*')) { const c = getComputedStyle(e);
            if (/(auto|scroll)/.test(c.overflowY) && e.scrollHeight - e.clientHeight > gap) { best = e; gap = e.scrollHeight - e.clientHeight; } }
          return best; }''')

    def scroll_to(self, px, wait=500):
        """真实页面滚到 px（与动画里的 {scroll: px} 对应），返回实际 scrollTop。"""
        h = self.scroller()
        if h.evaluate('e => !e'):
            return 0
        v = h.evaluate('(e, px) => { e.scrollTop = px; return e.scrollTop; }', px)
        self.settle(wait); return v

    # ---------- 截图 ----------
    def _png(self, name):
        return os.path.join(self.out, name + '.png')

    def shot(self, name, scroll=True, overlays=True):
        """截当前屏，返回 shot 规格。滚动区会被拼成一张全长图；浮层（Stuck FAB / AI Pill）单独截成透明 PNG。"""
        pg = self.page
        ph = pg.locator('#phone').bounding_box()
        sc = self.scroller() if scroll else None
        has_scroll = bool(sc) and not sc.evaluate('e => !e')
        fabs = pg.evaluate_handle(f'() => [...(document.querySelector(".screen.on")||document).querySelectorAll(`{FAB_SEL}`)]')
        prev_top = sc.evaluate('e => e.scrollTop') if has_scroll else 0
        if has_scroll:
            sc.evaluate('e => e.scrollTop = 0'); self.settle(300)
        clip = {'x': ph['x'], 'y': ph['y'], 'width': W, 'height': H}
        pg.screenshot(path=self._png(name), clip=clip)
        spec = {'src': f'shots/{name}.png'}
        if has_scroll:
            info = sc.evaluate('e => { const r = e.getBoundingClientRect(); return {x:r.left, y:r.top, w:r.width, h:e.clientHeight, sh:e.scrollHeight}; }')
            x, y, w, h, sh = info['x'] - ph['x'], info['y'] - ph['y'], info['w'], info['h'], info['sh']
            # 截滚动区时先藏起浮层，免得浮层被拼进内容里
            fabs.evaluate('a => a.forEach(f => { f.dataset.d3vis = f.style.visibility; f.style.visibility = "hidden"; })')
            canvas = Image.new('RGB', (round(w * DPR), round(sh * DPR)), 'white')
            top, step = 0, max(100, int(h) - 40)
            while True:
                actual = sc.evaluate('(e, t) => { e.scrollTop = t; return e.scrollTop; }', top)
                self.settle(350)
                tmp = self._png(name + '.__part')
                pg.screenshot(path=tmp, clip={'x': ph['x'] + x, 'y': ph['y'] + y, 'width': w, 'height': h})
                canvas.paste(Image.open(tmp).convert('RGB'), (0, round(actual * DPR)))
                os.remove(tmp)
                if actual + h >= sh - 1:
                    break
                top = actual + step
            canvas.save(self._png(name + '-scroll'))
            fabs.evaluate('a => a.forEach(f => { f.style.visibility = f.dataset.d3vis || ""; })')
            spec['scroll'] = {'src': f'shots/{name}-scroll.png', 'x': round(x), 'y': round(y), 'w': round(w), 'h': round(h), 'contentH': round(sh)}
            sc.evaluate('(e, t) => e.scrollTop = t', 0)
        if overlays and has_scroll:
            ovs = []
            n = fabs.evaluate('a => a.filter(f => f.offsetParent && getComputedStyle(f).display !== "none").length')
            for i in range(n):
                ovs.append(self._overlay(f'{name}-fab{i}', i))
            if ovs:
                spec['overlays'] = ovs
        if has_scroll and prev_top:
            sc.evaluate('(e, t) => e.scrollTop = t', prev_top); self.settle(200)
        return spec

    def _overlay(self, name, i):
        """把第 i 个浮层截成透明 PNG：临时藏起屏上其他内容、去掉背景。"""
        pg = self.page
        ph = pg.locator('#phone').bounding_box()
        r = pg.evaluate(f'''i => {{ const s = document.querySelector('.screen.on');
          const fabs = [...s.querySelectorAll(`{FAB_SEL}`)].filter(f => f.offsetParent && getComputedStyle(f).display !== 'none');
          const f = fabs[i]; const b = f.getBoundingClientRect();
          s.dataset.d3bg = s.style.background; s.style.background = 'transparent';
          document.querySelector('#phone').dataset.d3bg = document.querySelector('#phone').style.background; document.querySelector('#phone').style.background = 'transparent';
          document.body.dataset.d3bg = document.body.style.background; document.body.style.background = 'transparent';
          [...s.children].forEach(c => {{ if (c !== f) {{ c.dataset.d3v = c.style.visibility; c.style.visibility = 'hidden'; }} }});
          return {{x:b.left, y:b.top, w:b.width, h:b.height}}; }}''', i)
        pad = 14   # 留出阴影
        clip = {'x': r['x'] - pad, 'y': r['y'] - pad, 'width': r['w'] + pad * 2, 'height': r['h'] + pad * 2}
        pg.screenshot(path=self._png(name), clip=clip, omit_background=True)
        pg.evaluate('''() => { const s = document.querySelector('.screen.on');
          [...s.children].forEach(c => { if ('d3v' in c.dataset) { c.style.visibility = c.dataset.d3v; delete c.dataset.d3v; } });
          s.style.background = s.dataset.d3bg || ''; const p = document.querySelector('#phone'); p.style.background = p.dataset.d3bg || ''; document.body.style.background = document.body.dataset.d3bg || ''; }''')
        return {'src': f'shots/{name}.png', 'x': round(r['x'] - ph['x'] - pad), 'y': round(r['y'] - ph['y'] - pad), 'w': round(r['w'] + pad * 2), 'h': round(r['h'] + pad * 2)}

    def shot_plain(self, name):
        """只截整屏一张（不拆滚动层）——用于弹层、推送、转场中间态等。"""
        ph = self.page.locator('#phone').bounding_box()
        self.page.screenshot(path=self._png(name), clip={'x': ph['x'], 'y': ph['y'], 'width': W, 'height': H})
        return {'src': f'shots/{name}.png'}

    def dump(self, shots):
        with open(os.path.join(ROOT, 'modules', self.module, 'shots.json'), 'w', encoding='utf-8') as f:
            json.dump(shots, f, ensure_ascii=False, indent=2)


def preview(module, times, out_dir=None, url=None):
    """把播放器定格在若干秒，截 1440×810 预览图，用来自查动画（不必反复审查，看一眼即可）。"""
    url = url or os.environ.get('D3_URL', 'http://127.0.0.1:8765/showcase/demo03/index.html')
    out_dir = out_dir or os.path.join(ROOT, 'modules', module, '_preview')
    os.makedirs(out_dir, exist_ok=True)
    paths = []
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1440, 'height': 810})
        pg.on('console', lambda m: m.type in ('warning', 'error') and print('[console]', m.text))
        for t in times:
            pg.goto(f'{url}?m={module}&t={t}'); pg.wait_for_timeout(900)
            path = os.path.join(out_dir, f't{t:05.1f}.png'); pg.screenshot(path=path); paths.append(path)
        dur = pg.evaluate('() => window.__d3 && window.__d3.duration')
        b.close()
    print('duration', dur)
    return paths, dur
