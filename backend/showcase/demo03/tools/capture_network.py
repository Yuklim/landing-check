# -*- coding: utf-8 -*-
"""03 Demo · 上网与通讯（network）：行前买 eSIM → 落地推送 → 先连浦东 Wi-Fi → 右上角离线包 / Help 兜底（没网时离线包直接进联网向导）。
运行：venv/bin/python tools/capture_network.py   （输出 modules/network/shots/*.png 和 modules/network/timeline.js）"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from capture import Cap, ROOT

KEY = 'network'
N = lambda name: f'[data-pencil-name="{name}"]'

HIDE_TIP = '''() => { const p = document.getElementById('phone');
  [...p.children].forEach(c => { if (/^Offline pack saved/.test(c.textContent.trim())) c.style.display = 'none'; }); }'''
NO_GUIDE = '#lc-guide{display:none !important}'


def pad(r, p=4):
    x, y, w, h = r
    return [x - p, y - p, w + p * 2, h + p * 2]


def clean(pg):
    pg.evaluate(HIDE_TIP)
    assert pg.evaluate('() => { const g = document.getElementById("lc-guide"); return !g || getComputedStyle(g).display === "none" || !g.offsetParent; }'), 'guide layer visible'


with Cap(KEY) as c:
    pg = c.page
    shots, xy = {}, {}
    c.open('home'); pg.add_style_tag(content=NO_GUIDE)
    c.go('preflight')                                   # 被拦到隐私授权页
    c.tap(N('Agree Button'), wait=1200)
    try:   # 授权后自动下载离线包，会弹 9 秒提示条；等它出现再藏掉
        pg.wait_for_function('() => [...document.getElementById("phone").children].some(c => /^Offline pack saved/.test(c.textContent.trim()) && c.style.display === "flex")', timeout=12000)
    except Exception:
        print('[warn] pack tip not seen')
    clean(pg); c.settle(300)

    # ① 行前检查
    assert c.route() == 'preflight', c.route()
    shots['preflight'] = c.shot('preflight')
    xy['data_card'] = pad(c.rect(N('Item Mobile data in China')), 2)
    xy['buy_esim'] = c.center('[data-act="go:esim"]')
    c.tap('[data-act="go:esim"]', wait=900); clean(pg)

    # eSIM 页
    assert c.route() == 'esim', c.route()
    shots['esim'] = c.shot('esim')
    xy['cn'] = pad(c.rect(N('Dest Chinese mainland')), 3)
    xy['cn_tap'] = c.center(N('Dest Chinese mainland'))
    c.tap(N('Dest Chinese mainland'), wait=250)
    shots['esim-toast'] = c.shot_plain('esim-toast')
    try:   # 等 eSIM toast 消失，免得带进下一屏
        pg.wait_for_function('() => ![...document.querySelectorAll("#phone *")].some(e => e.children.length === 0 && /eSIM added/.test(e.textContent) && e.getBoundingClientRect().height > 0 && getComputedStyle(e).opacity !== "0")', timeout=6000)
    except Exception:
        pg.evaluate('() => [...document.querySelectorAll("#phone *")].filter(e => e.children.length === 0 && /eSIM added/.test(e.textContent)).forEach(e => (e.parentElement || e).style.visibility = "hidden")')

    # ② 落地推送（锁屏）
    c.go('lock', wait=900); clean(pg)
    shots['lock'] = c.shot_plain('lock')
    xy['notif'] = pad(c.rect(N('Notification Landing')), 3)
    xy['notif_tap'] = c.center(N('Notification Landing'))

    # 落地第一步：联网检测
    c.go('step1', wait=900); clean(pg)
    shots['step1'] = c.shot('step1')
    xy['nodata'] = pad(c.rect_text('No mobile data yet'), 6)
    xy['pvg_btn'] = c.center(N('Primary Button'))
    c.tap(N('Primary Button'), wait=900); clean(pg)

    # 浦东 Wi-Fi 教程
    assert c.route() == 'wifi', c.route()
    shots['wifi'] = c.shot('wifi')
    card = pg.evaluate('''() => { const ph = document.getElementById('phone').getBoundingClientRect();
      let n = document.querySelector('.screen.on [data-pencil-name="No Password"]');
      while (n && n.getBoundingClientRect().width < 340) n = n.parentElement;
      const r = n.getBoundingClientRect(); return [r.left - ph.left, r.top - ph.top, r.width, r.height].map(Math.round); }''')
    xy['ssid'] = pad(card, 2)
    p, h = c.rect(N('Offline Pack Entry')), c.rect(N('Stuck FAB'))
    x0, y0 = min(p[0], h[0]), min(p[1], h[1])
    xy['entries'] = pad([x0, y0, max(p[0] + p[2], h[0] + h[2]) - x0, max(p[1] + p[3], h[1] + h[3]) - y0], 4)
    xy['pack_entry'] = c.center(N('Offline Pack Entry'))
    xy['help_entry'] = c.center(N('Stuck FAB'))
    print('wifi entries', p, h)

    # ③ 断网后点 Offline pack（最新版：没网直接进联网向导）
    c.ctx.set_offline(True)
    c.tap(N('Offline Pack Entry'), wait=1200); clean(pg)
    print('route after pack (offline):', c.route())
    shots['offline-guide'] = c.shot('offline-guide')
    try:
        xy['guide_next'] = pad(c.rect('[data-op="guide-next"]'), 3)
    except Exception:
        xy['guide_next'] = None
    try:
        xy['guide_help'] = c.center('[data-op="help"]')
    except Exception:
        xy['guide_help'] = None
    if xy['guide_help']:
        c.tap('[data-op="help"]', wait=1000); clean(pg)
        print('route after help:', c.route())
        shots['offline-help'] = c.shot('offline-help')
    c.ctx.set_offline(False)
    print(json.dumps(xy, ensure_ascii=False))
    c.dump(shots)

# ---------- 时间线 ----------
steps = [
    {'beat': '行前：买 eSIM'},
    {'show': 'preflight', 'hold': 0.6},
    {'hl': xy['data_card'], 'label': '待办：手机流量', 'hold': 0.8},
    {'tap': xy['buy_esim']},
    {'show': 'esim', 'via': 'push', 'hold': 0.4},
    {'hl': xy['cn'], 'label': '中国大陆套餐', 'hold': 0.5},
    {'tap': xy['cn_tap']},
    {'show': 'esim-toast', 'via': 'fade', 'dur': 0.25, 'hold': 0.8},
    {'beat': '已落地：先联网'},
    {'show': 'lock', 'via': 'fade', 'dur': 0.6, 'hold': 0.3},
    {'hl': xy['notif'], 'label': '已落地 · 浦东 T2', 'hold': 1.3},
    {'tap': xy['notif_tap']},
    {'show': 'step1', 'via': 'up', 'hold': 0.6},
    {'hl': xy['nodata'], 'label': '没检测到流量', 'hold': 0.9},
    {'tap': xy['pvg_btn']},
    {'beat': 'Wi-Fi 教程'},
    {'show': 'wifi', 'via': 'push', 'hold': 0.6},
    {'hl': xy['ssid'], 'label': '浦东免费 Wi-Fi', 'hold': 1.2},
    {'beat': '离线包 + AI 助手兜底'},
    {'clear': True},
    {'hl': xy['entries'], 'label': '离线包 + Help', 'hold': 1.0},
    {'tap': xy['pack_entry']},
    {'show': 'offline-guide', 'via': 'push', 'hold': 0.9},
]
if xy.get('guide_next'):
    steps.append({'hl': xy['guide_next'], 'label': '没网也能一步步联网', 'hold': 1.0})
if 'offline-help' in shots:
    steps += [{'tap': xy['guide_help']}, {'show': 'offline-help', 'via': 'push', 'hold': 1.6}]
steps.append({'wait': 0.4})

spec = {'title': '上网与通讯', 'shots': shots, 'steps': steps}
with open(os.path.join(ROOT, 'modules', KEY, 'timeline.js'), 'w', encoding='utf-8') as f:
    f.write('/* 由 tools/capture_network.py 生成，请勿手改 */\n')
    f.write(f"Demo03.register('{KEY}', {json.dumps(spec, ensure_ascii=False, indent=1)});\n")
print('ok', len(shots), 'shots')
