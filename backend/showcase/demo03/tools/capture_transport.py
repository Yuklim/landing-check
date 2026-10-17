# -*- coding: utf-8 -*-
"""03 Demo · 市内交通与打车（key=transport）：驱动 H5 截图、取坐标，生成 modules/transport/timeline.js。
运行：<venv>/bin/python capture_transport.py
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from capture import Cap, ROOT

KEY = 'transport'
MAP_WAIT = 4500   # 高德瓦片加载
NO_GUIDE = '#lc-guide,.g-dot,.g-ring,.g-tip,.g-bar,.g-mini,.g-pop{display:none !important}'


def pad(r, p=6):
    x, y, w, h = r
    return [x - p, y - p, w + p * 2, h + p * 2]


def main():
    shots, P = {}, {}
    with Cap(KEY) as c:
        pg = c.page
        c.open('home')
        pg.add_style_tag(content=NO_GUIDE)
        # 演示顺序里支付在交通之前，先在后台完成授权 + ¥1 验证，免得 step3 出现「Alipay not verified yet」提醒（不进动画）
        N = lambda name: f'[data-pencil-name="{name}"]'
        c.go('preflight', wait=900)
        if c.route() == 'privacy':
            c.tap(N('Agree Button'), wait=1200)
        c.tap('[data-act="api:paypick"]', wait=900)
        if c.route() == 'paysetup':
            c.tap(N('Confirm Button'), wait=2500)
            c.page.wait_for_timeout(1500)
            if c.route() == 'payment':
                c.tap(N('Done Button'), wait=900)
        # 大字卡用离线包里已保存的酒店卡：先在后台把行程酒店存好（不进动画）
        c.go('offline-hotel', wait=2500)
        if pg.locator('#op-hotel-form').count():
            pg.locator('#op-hotel-form input[name=confirmed]').check()
            pg.locator('#op-hotel-form button[type=submit]').click(); c.settle(1200)
        kill_tips = "() => document.querySelectorAll('.lc-tip, #lcTip, .lc-toast, #toast').forEach(n => n.remove())"
        pg.evaluate(kill_tips)
        # ---------- 第三步：推荐方式 + 高德缩略图 ----------
        c.go('step3', wait=MAP_WAIT)
        pg.evaluate(kill_tips)
        shots['step3'] = c.shot('step3')
        P['map'] = c.rect('[data-pencil-name="Map Box"]')
        P['kicker'] = c.rect('[data-pencil-name="Task Kicker"]')
        P['task'] = c.rect('[data-pencil-name="Task Top"]')
        P['primary'] = c.center('[data-pencil-name="Primary Button"]')
        P['ways'] = c.center('.lc-otherways > summary')
        # ---------- 展开所有交通方式 ----------
        c.tap('.lc-otherways > summary', wait=800)
        shots['ways'] = c.shot('ways')
        sc_y = shots['ways']['scroll']['y'] if 'scroll' in shots['ways'] else 0
        row0_top = c.rect('.lc-otherways [data-act="api:route:taxi"]')[1] - sc_y
        P['ways_scroll'] = c.scroll_to(max(0, row0_top - 150))
        ways = '.lc-otherways'
        P['car_rows'] = [c.rect(f'{ways} [data-act="api:route:taxi"]'), c.rect(f'{ways} [data-act="api:route:didi"]')]
        P['pt_row0'] = c.rect(f'{ways} [data-act="api:route:0"]')
        P['pt_row2'] = c.rect(f'{ways} [data-act="api:route:2"]')
        P['pt_tap'] = c.center(f'{ways} [data-act="api:route:0"]')
        # ---------- 公共交通路线详情（磁悬浮 + 地铁） ----------
        c.tap(f'{ways} [data-act="api:route:0"]', wait=MAP_WAIT)
        pg.wait_for_timeout(1500)
        shots['route'] = c.shot('route')
        P['r_map'] = c.rect('[data-r="map"]')
        P['r_chain'] = c.rect('[data-r="chain"]')
        P['back'] = c.center('[data-pencil-name="Back"], .lc-back, [data-act="back"]') if pg.locator('.screen.on').locator('[data-pencil-name="Back"], .lc-back, [data-act="back"]').count() else [36, 80]
        steps_top = pg.evaluate('''() => { const s = document.querySelector('.screen.on'); const sc = s.querySelector(':scope > .scroll'); const e = s.querySelector('[data-r="steps"]');
            return e.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop; }''')
        P['r_scroll'] = c.scroll_to(round(steps_top) - 120)
        P['r_sign0'] = c.rect_text('路牌 ·', nth=0)
        c.scroll_to(0)
        # ---------- 回到出租车方案 → 司机中文地址卡 → Max 大字卡 ----------
        c.go('step3', wait=MAP_WAIT)
        pg.evaluate(kill_tips)
        c.tap('[data-pencil-name="Primary Button"]', wait=1000)
        print('route after primary:', c.route())
        shots['driver'] = c.shot('driver')
        P['d_addr'] = c.rect('[data-pencil-name="Address Block"]')
        # 司机页本身就是给司机看的大字卡（右上角 ☀ Max 是屏幕亮度，不是另一张卡），结尾推近中文酒店名和地址
        c.dump(shots)
    print(json.dumps(P, ensure_ascii=False))

    d_cn = P['d_addr']
    steps = [
        {'beat': '高德真实地图'},
        {'show': 'step3', 'hold': 0.5},
        {'hl': pad(P['map'], 4), 'label': '高德真实路线', 'hold': 1.0},
        {'beat': '按情况推荐交通'},
        {'hl': pad(P['kicker'], 6), 'label': '按行李推荐', 'hold': 0.8},
        {'hl': pad(P['task'], 4), 'label': '出租车 · 官方排队点', 'hold': 0.9},
        {'clear': True},
        {'tap': P['ways']},
        {'show': 'ways', 'via': 'fade', 'dur': 0.3, 'hold': 0.3},
        {'scroll': P['ways_scroll'], 'dur': 1.0, 'hold': 0.3},
        {'hl': [P['car_rows'][0][0] + 4, P['car_rows'][0][1] + 2, P['car_rows'][0][2] - 8, P['car_rows'][1][1] + P['car_rows'][1][3] - P['car_rows'][0][1] - 4], 'label': '打车 / 网约车', 'hold': 0.8},
        {'hl': [P['pt_row0'][0] + 4, P['pt_row0'][1] + 2, P['pt_row0'][2] - 8, P['pt_row2'][1] + P['pt_row2'][3] - P['pt_row0'][1] - 4], 'label': '地铁 / 磁悬浮', 'hold': 1.0},
        {'clear': True},
        {'beat': '换乘 + 中文路牌'},
        {'tap': P['pt_tap']},
        {'show': 'route', 'via': 'push', 'hold': 0.6},
        {'hl': pad(P['r_map'], -2), 'label': '高德分段路线', 'hold': 0.9},
        {'hl': pad(P['r_chain'], 4), 'label': '磁悬浮 › 地铁', 'hold': 0.7},
        {'clear': True},
        {'scroll': P['r_scroll'], 'dur': 1.2, 'hold': 0.3},
        {'zoom': [P['r_sign0'][0] + P['r_sign0'][2] / 2, P['r_sign0'][1] + P['r_sign0'][3] / 2, 1.4], 'hold': 0.2},
        {'hl': pad(P['r_sign0'], 4), 'label': '中文路牌', 'hold': 1.2},
        {'zoom': None},
        {'clear': True},
        {'tap': P['back'], 'dur': 0.6},
        {'beat': '司机大字卡'},
        {'show': 'step3', 'via': 'pop', 'hold': 0.4},
        {'tap': P['primary']},
        {'show': 'driver', 'via': 'push', 'hold': 0.6},
        {'finger': False},
        {'hl': pad(d_cn, 2), 'label': '给司机看的大字卡', 'hold': 0.9},
        {'clear': True},
        {'zoom': [d_cn[0] + d_cn[2] / 2, d_cn[1] + d_cn[3] / 2, 1.1], 'hold': 2.2},   # 推近中文酒店名 + 地址（1.1 倍时地址块正好占满屏宽）
        {'zoom': None, 'hold': 0.3},
    ]
    spec = {'title': '市内交通与打车', 'shots': shots, 'steps': steps}
    out = os.path.join(ROOT, 'modules', KEY, 'timeline.js')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('/* 由 tools/capture_transport.py 生成，勿手改 */\nDemo03.register(%s, %s);\n' % (json.dumps(KEY), json.dumps(spec, ensure_ascii=False, indent=1)))
    print('wrote', out)


if __name__ == '__main__':
    main()
