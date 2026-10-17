# -*- coding: utf-8 -*-
"""03 Demo · 支付模块：行前检查 → 选择支付方式 / ¥1 去向 → 真实发起 ¥1 验证 → 结果页 → 回到清单 → 图文教程一瞥。
运行：<venv>/bin/python capture_payment.py   产出 modules/payment/shots/*.png 和 modules/payment/timeline.js
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from capture import Cap, ROOT

KEY = 'payment'
N = lambda n: f'[data-pencil-name="{n}"]'
ROW = N('Item Alipay payment')
# 离线包下载完会弹「Offline pack saved」提示条，盖住底部，截图时藏掉
HIDE_TIP = '''() => { if (!document.getElementById('d3hide')) { const s = document.createElement('style'); s.id = 'd3hide';
  s.textContent = '[data-d3hide]{display:none!important}'; document.head.appendChild(s); }
  if (!document.getElementById('d3noguide')) { const g = document.createElement('style'); g.id = 'd3noguide';
    g.textContent = '#lc-guide,.g-ring,.g-tip,.g-dot,.g-bar,.g-pop,.g-arrow,.g-modal,.g-card,.g-mini{display:none!important}'; document.head.appendChild(g); }
  [...document.querySelectorAll('#phone > div')].filter(d => /^Offline pack saved/.test(d.textContent.trim())).forEach(d => d.setAttribute('data-d3hide', '')); }'''


def no_guide(pg):
    n = pg.evaluate('() => [...document.querySelectorAll("#lc-guide, #lc-guide *")].filter(e => e.offsetParent || getComputedStyle(e).display !== "none" && e.getClientRects().length).length')
    if n: print('[warn] guide visible', n)


def pad(r, p=4):
    return [r[0] - p, r[1] - p, r[2] + p * 2, r[3] + p * 2]


def union(a, b):
    x, y = min(a[0], b[0]), min(a[1], b[1])
    return [x, y, max(a[0] + a[2], b[0] + b[2]) - x, max(a[1] + a[3], b[1] + b[3]) - y]


def main():
    shots, P = {}, {}
    with Cap(KEY) as c:
        pg = c.page
        c.open('home'); pg.evaluate(HIDE_TIP); c.go('preflight')                     # 被拦到隐私授权页
        c.tap(N('Agree Button'), wait=2500)                   # 保存授权 → 行前检查（并开始下载离线包）
        pg.evaluate(HIDE_TIP); c.settle(300)
        shots['preflight'] = c.shot('preflight')
        P['row'] = c.rect(ROW); P['verify'] = c.center(ROW + ' ' + N('Item Button'))

        c.tap(ROW + ' ' + N('Item Button'), wait=1200)        # → paysetup
        pg.evaluate(HIDE_TIP)
        shots['paysetup'] = c.shot('paysetup')
        P['alipay'] = c.rect(N('Method Alipay')); P['tpg'] = c.rect(N('Method TenPayGo'))
        P['donate'] = c.rect(N('Use Donate')); P['refund'] = c.rect(N('Use Refund'))
        P['confirm'] = c.rect(N('Confirm Button'))
        lm = c.rect_text('learn more'); P['learn'] = [lm[0] + lm[2] // 2, lm[1] + lm[3] // 2]

        pg.locator('.screen.on').get_by_text('learn more').click(); c.settle(700)   # CYDF 说明弹层
        pg.evaluate(HIDE_TIP); shots['cydf'] = c.shot_plain('cydf')
        gb = pg.locator(N('CYDF Sheet') + ' [data-close]').nth(1).bounding_box(); ph = pg.locator('#phone').bounding_box()
        P['gotit'] = [round(gb['x'] - ph['x'] + gb['width'] / 2), round(gb['y'] - ph['y'] + gb['height'] / 2)]
        pg.locator(N('CYDF Sheet') + ' [data-close]').nth(1).click(); c.settle(400)

        # 真实发起 ¥1 验证：后端模拟交易，先截「Charging…」提示，再等结果页
        pg.locator('.screen.on ' + N('Confirm Button')).click()
        pg.wait_for_timeout(350)
        pg.evaluate(HIDE_TIP); shots['paying'] = c.shot_plain('paying')
        pg.wait_for_function('() => document.querySelector(".screen.on").dataset.route === "payment"', timeout=20000)
        c.settle(900); pg.evaluate(HIDE_TIP)
        shots['payment'] = c.shot('payment')
        P['card'] = c.rect(N('Result Card')); P['sub'] = c.rect(N('Result Sub')); P['chip'] = c.rect(N('Verified Chip'))
        P['checks'] = c.rect(N('Checks Row')); P['done'] = c.center(N('Done Button'))

        c.tap(N('Done Button'), wait=1500)                    # → 回到行前检查
        pg.evaluate(HIDE_TIP)
        shots['preflight_done'] = c.shot('preflight_done')
        P['scroll2'] = c.scroll_to(9999)                      # 已完成项收进底部「N items ready」，滚到底取坐标
        r = c.rect_text(re.compile(r'\d+ items ready'))
        P['ready'] = [16, r[1] - 18, 361, r[3] + 36]
        no_guide(pg)
        c.dump({'shots': shots, 'points': P})

    meth = union(P['alipay'], P['tpg']); use = union(P['donate'], P['refund'])
    cf = P['confirm']; cf_c = [cf[0] + cf[2] // 2, cf[1] + cf[3] // 2]
    sub = P['sub']; sub_c = [sub[0] + sub[2] // 2, sub[1] + sub[3] // 2]
    steps = [
        {'beat': '支付宝 + TenPayGo'},
        {'show': 'preflight', 'hold': 0.6},
        {'hl': pad(P['row']), 'label': '境内支付待办', 'hold': 0.8},
        {'tap': P['verify']},
        {'show': 'paysetup', 'via': 'push', 'hold': 0.5},
        {'hl': pad(meth), 'label': '二选一即可', 'hold': 0.9},
        {'beat': '退回或捐赠'},
        {'hl': pad(use), 'label': '退回或捐赠', 'hold': 0.8},
        {'tap': P['learn'], 'hold': 0},
        {'show': 'cydf', 'via': 'fade', 'dur': 0.35, 'hold': 1.1},
        {'tap': P['gotit'], 'hold': 0},
        {'show': 'paysetup', 'via': 'fade', 'dur': 0.3, 'hold': 0.3},
        {'beat': '¥1 真实验证'},
        {'tap': cf_c, 'hold': 0},
        {'show': 'paying', 'via': 'none', 'hold': 0.8},
        {'show': 'payment', 'via': 'push', 'hold': 0.5},
        {'beat': '链路已打通'},
        {'hl': pad(P['card'], 2), 'label': '¥1 验证成功', 'hold': 0.4},
        {'zoom': [sub_c[0], sub_c[1], 1.3], 'hold': 1.2},
        {'zoom': None},
        {'clear': True},
        {'hl': pad(P['checks']), 'label': '已捐给 CYDF', 'hold': 0.8},
        {'tap': P['done'], 'hold': 0},
        {'show': 'preflight_done', 'via': 'pop', 'hold': 0.4},
        {'scroll': P['scroll2'], 'dur': 0.8, 'hold': 0.2},
        {'hl': pad(P['ready'], 2), 'label': '支付已就绪', 'hold': 1.1},
    ]
    spec = {'title': '支付', 'shots': shots, 'steps': steps}
    with open(os.path.join(ROOT, 'modules', KEY, 'timeline.js'), 'w', encoding='utf-8') as f:
        f.write(f"Demo03.register('{KEY}', {json.dumps(spec, ensure_ascii=False, indent=1)});\n")
    print('ok', list(shots))


if __name__ == '__main__':
    main()
