# -*- coding: utf-8 -*-
"""03 Demo · 门票与预约（tickets）：首页依次点开 Trip.com 已有服务（酒店 / 景点门票 / 租车 / 旅行指南）各看一眼再返回
→ 进入行前检查，滚到 Optional 区：这些服务也接在行前清单里。
运行：<venv python> capture_tickets.py  → 生成 modules/tickets/shots/*.png、shots.json、timeline.js
"""
import json, os, sys, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from capture import Cap, ROOT

KEY = 'tickets'
OUT = os.path.join(ROOT, 'modules', KEY, 'shots')
for f in glob.glob(os.path.join(OUT, '*')):
    os.remove(f)

# 不截新手演示指引层、调试角标
HIDE_GUIDE = '#lc-guide,.g-ring,.g-bar,.g-tip,.g-mini,.g-dot,.g-pop,.g-modal,.g-more{display:none !important}'
HIDE_TIP = '''() => { for (const d of document.querySelectorAll('#phone > div')) if (/Offline pack saved/.test(d.textContent) && d.style.zIndex === '60') d.style.setProperty('display', 'none', 'important'); }'''
NO_GUIDE = '''() => [...document.querySelectorAll('#lc-guide, .g-ring, .g-dot, .g-tip, .g-bar')].filter(e => e.offsetParent).length'''

# 首页入口：(节点名, 目标路由, 截图名)
ENTRIES = [
    ('Big Hotels', 'hotels-search', 'hotels'),
    ('Small Attractions', 'attractions', 'attractions'),
    ('Small Car Rentals', 'car', 'car'),
    ('Feat Travel Guides', 'guides', 'guides'),
]
PF_ROWS = ['Item Attractions', 'Item Travel guides']


def clean():
    c.page.evaluate(HIDE_TIP)
    assert c.page.evaluate(NO_GUIDE) == 0, 'guide layer visible'


with Cap(KEY) as c:
    pg = c.page
    c.open('home')
    pg.add_style_tag(content=HIDE_GUIDE)
    # 先在真实页面过一遍隐私授权（授权页不进动画），离线包自动保存完再回首页
    c.go('preflight')
    if c.route() == 'privacy':
        c.tap('[data-act="api:consent"]', wait=1500)
    assert c.route() == 'preflight', c.route()
    pg.wait_for_timeout(2500)
    c.go('home', wait=900)
    assert c.route() == 'home', c.route()
    clean()

    shots, taps = {}, {}
    shots['home'] = c.shot('home', scroll=False)   # 动画里这些屏不滚动：整屏一张，避免滚动拼图把状态栏拼进内容
    for node, route, name in ENTRIES:
        c.go('home', wait=500)
        c.scroll_to(0, wait=200)
        taps[name] = c.center(f'[data-pencil-name="{node}"]')
        c.tap(f'[data-pencil-name="{node}"]', wait=1200)
        assert c.route() == route, (node, c.route())
        if route == 'attractions':
            pg.wait_for_function('() => document.querySelectorAll(".screen.on [data-a-list] [data-url]").length > 0', timeout=40000)
        if route == 'guides':
            try:
                pg.wait_for_function('() => document.querySelectorAll(".screen.on [data-g-must] [data-url]").length > 0', timeout=30000)
            except Exception:
                print('[warn] guides must-sees not loaded')
        c.settle(1500)
        clean()
        shots[name] = c.shot(name, scroll=False)

    # 首页 Landing Check → 行前检查
    c.go('home', wait=500)
    c.scroll_to(0, wait=200)
    taps['lc'] = c.center('[data-pencil-name="Feat Landing Check"]')
    c.tap('[data-pencil-name="Feat Landing Check"]', wait=1200)
    assert c.route() == 'preflight', c.route()
    clean()
    shots['preflight'] = c.shot('preflight')
    sc = shots['preflight']['scroll']
    pf_scroll = max(0, sc['contentH'] - sc['h'])      # 滚到底，Optional 区整块露出
    c.scroll_to(pf_scroll)
    opt = pg.evaluate('''() => { const s = document.querySelector('.screen.on'); const ph = document.querySelector('#phone').getBoundingClientRect();
      const a = s.querySelector('[data-pencil-name="Item Attractions"]'); const rows = [...a.parentElement.children];
      let t = 1e9, b = -1e9, l = 1e9, r = -1e9; rows.forEach(n => { const q = n.getBoundingClientRect(); if (!q.height) return; t = Math.min(t, q.top); b = Math.max(b, q.bottom); l = Math.min(l, q.left); r = Math.max(r, q.right); });
      return { box: [Math.round(l - ph.left), Math.round(t - ph.top), Math.round(r - l), Math.round(b - t)], rows: rows.map(n => n.textContent.trim().replace(/\\s+/g, ' ').slice(0, 40)) }; }''')
    c.dump(shots)

steps = [
    {'show': 'home', 'hold': 0.5},
    {'beat': 'Trip.com 已有服务'},
]
first = True
for node, route, name in ENTRIES:
    steps.append({'tap': taps[name], 'dur': 0.55, 'hold': 0.05})
    steps.append({'show': name, 'via': 'push', 'dur': 0.45, 'hold': 0.7})
    if first:
        steps.append({'beat': '一键直达'}); first = False
    steps.append({'show': 'home', 'via': 'pop', 'dur': 0.4, 'hold': 0.15})
steps += [
    {'tap': taps['lc'], 'dur': 0.6, 'hold': 0.05},
    {'show': 'preflight', 'via': 'push', 'dur': 0.45, 'hold': 0.35},
    {'beat': '行前清单也接入'},
    {'scroll': pf_scroll, 'dur': 0.9, 'hold': 0.2},
    {'hl': [opt['box'][0] - 2, opt['box'][1] - 2, opt['box'][2] + 4, opt['box'][3] + 4], 'label': 'Optional · 携程服务', 'hold': 1.0},
]

spec = {'title': '门票与预约', 'shots': shots, 'steps': steps}
out = os.path.join(ROOT, 'modules', KEY, 'timeline.js')
with open(out, 'w', encoding='utf-8') as f:
    f.write('// 由 tools/capture_tickets.py 生成，勿手改\n')
    f.write(f"Demo03.register('{KEY}', {json.dumps(spec, ensure_ascii=False, indent=1)});\n")
print('wrote', out)
print(json.dumps({'taps': taps, 'pf_scroll': pf_scroll, 'opt': opt}, ensure_ascii=False))
