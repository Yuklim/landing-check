# -*- coding: utf-8 -*-
"""03 Demo · 落地与机场（总结）：落地三步快速带过 → 随时求助（I'm Stuck / TripGenie 截图识别）→ 上车完成 → 城市票根 → 发帖到 Community。
运行：<venv>/bin/python tools/capture_airport.py   （可重复运行，生成 modules/airport/shots/* 和 timeline.js）
"""
import json, os, sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from capture import Cap, ROOT, DPR, W, H

KEY = 'airport'
ERR_SHOT = os.path.abspath(os.path.join(ROOT, '..', '..', '..', 'exports', '20-支付宝绑卡失败-真实截图.png'))
N = lambda name: f'[data-pencil-name="{name}"]'
DEBUG = os.environ.get('D3_DEBUG')


def names(c, label):
    if not DEBUG:
        return
    r = c.page.evaluate('''() => { const s = document.querySelector('.screen.on'); const ph = document.querySelector('#phone').getBoundingClientRect();
      return [...s.querySelectorAll('[data-pencil-name]')].map(e => { const b = e.getBoundingClientRect();
        return [e.dataset.pencilName, Math.round(b.left-ph.left), Math.round(b.top-ph.top), Math.round(b.width), Math.round(b.height)]; })
        .filter(x => x[3] > 30 && x[4] > 12 && x[4] < 400 && x[2] < 852 && x[2] > -10); }''')
    print('==', label, c.route())
    for x in r:
        print('  ', x)


def crop_scroll(c, spec, name, y0):
    """把滚动层改成从内容偏移 y0 开始（让该屏一出现就处在真实页面当时的滚动位置）。"""
    sc = spec['scroll']
    p = os.path.join(c.out, name + '-scroll.png')
    im = Image.open(p)
    im.crop((0, round(y0 * DPR), im.width, im.height)).save(p)
    sc['contentH'] = sc['contentH'] - round(y0)
    return spec


def story_timeline(route):
    """脚本几秒内走完整个流程，模拟时间线里落地到上车只有 1 分钟；按演示剧本把联网、上车时间排到落地后 9 / 36 分钟。"""
    from datetime import datetime, timedelta
    resp = route.fetch()
    try:
        tl = resp.json()
        fmt = '%Y-%m-%d %H:%M:%S'
        landed = next((e['at'] for e in tl if e.get('event') == 'landed'), None)
        if landed:
            t0 = datetime.strptime(landed[:19], fmt)
            for e in tl:
                if e.get('event') in ('online', 'in_car', 'arrived'):
                    e['at'] = (t0 + timedelta(minutes={'online': 9, 'in_car': 36, 'arrived': 80}[e['event']])).strftime(fmt)
        route.fulfill(response=resp, json=tl)
    except Exception:
        route.fulfill(response=resp)


def story_preflight(route):
    """脚本是落地前几秒才验的 ¥1，完成页会显示「Paid 21:24」；按剧本改成出发前一天验过，页面显示 before flight。"""
    from datetime import datetime, timedelta
    resp = route.fetch()
    try:
        pf = resp.json()
        at = (pf.get('payment') or {}).get('verified_at')
        if at:
            pf['payment']['verified_at'] = (datetime.strptime(at[:19], '%Y-%m-%d %H:%M:%S') - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')
        route.fulfill(response=resp, json=pf)
    except Exception:
        route.fulfill(response=resp)


HIDE = '#lc-guide,.g-ring,.g-tip,.g-mini,.g-dot,.g-bar,.g-pop,.g-modal{display:none !important}'


def clean(pg):
    """截图前清掉临时浮层：新手演示指引、落地推送横幅、「Offline pack saved」提示、toast。"""
    pg.evaluate("""() => { const n = document.querySelector('#notif'); if (n) n.classList.remove('show','in','expanded');
      document.querySelectorAll('#phone > div, body > div').forEach(d => { if (/^Offline pack saved/.test((d.textContent || '').trim()) && (d.textContent || '').length < 200 && !d.querySelector('.screen')) d.style.display = 'none'; });
      document.querySelectorAll('.toast,#toast').forEach(t => t.style.display = 'none'); }""")


def main():
    shots, steps = {}, []
    with Cap(KEY) as c:
        pg = c.page
        pg.route('**/mock/timeline', story_timeline)
        pg.route('**/rules/preflight*', story_preflight)
        c.open('home')
        pg.add_style_tag(content=HIDE)
        # —— 准备：授权 + 行前验证支付（只为让落地流程状态完整）——
        c.go('preflight', wait=900)
        if c.route() == 'privacy':
            c.tap(N('Agree Button'), wait=1200)
        c.tap('[data-act="api:paypick"]', wait=900)
        if c.route() == 'paysetup':
            c.tap(N('Confirm Button'), wait=2500)
            pg.wait_for_timeout(1500)
            if c.route() == 'payment':
                c.tap(N('Done Button'), wait=900)
        pg.wait_for_timeout(1500)
        clean(pg)
        # 行前页（随时求助蒙太奇用：行前也有 Help）
        c.scroll_to(0, wait=300)
        shots['preflight'] = c.shot_plain('preflight'); names(c, 'preflight')
        pf_fab = c.center(N('Stuck FAB'))
        c.tap(N('Run Check Button'), wait=1500)   # 模拟落地
        pg.wait_for_timeout(1200)
        clean(pg)

        # —— 1 落地卡 step1（无 eSIM → 走 eSIM 已就绪分支，快速过）——
        c.go('trips', wait=900)
        c.tap(N('LC Button'), wait=1800)
        clean(pg)
        shots['step1'] = c.shot_plain('step1'); names(c, 'step1')
        alt1 = c.center(N('Alt Left'))
        c.tap(N('Alt Left'), wait=1800)

        # —— 2 online ——
        clean(pg)
        shots['online'] = c.shot_plain('online'); names(c, 'online')
        on_btn = c.center(N('Primary Button'))
        on_fab = c.center(N('Stuck FAB'))
        c.tap(N('Primary Button'), wait=2500)

        # —— 3 step3 ——
        pg.wait_for_timeout(1200)
        clean(pg)
        shots['step3'] = c.shot_plain('step3'); names(c, 'step3')
        s3_fab = c.center(N('Stuck FAB'))
        s3_incar = c.center(N('In Car Button'))

        # —— 4 I'm Stuck → TripGenie ——
        c.tap(N('Stuck FAB'), wait=1200)
        clean(pg)
        shots['genie'] = c.shot_plain('genie'); names(c, 'genie')
        chip = c.center('[data-g-act="photo"]')
        # 当前后端图像识别可能走不通：先试真实接口；若不是 answer，就用知识库真实条目 alipay_card_bind_failed 拼成"识别成功"的响应。
        pending = []
        pg.route('**/stuck/classify', lambda route: pending.append(route))   # 先挂起，截完"识别中"再放行
        pg.set_input_files('#genie-photo', ERR_SHOT)
        pg.wait_for_timeout(900)
        clean(pg)
        shots['genie-load'] = c.shot_plain('genie-load')
        y_load = pg.evaluate('() => document.querySelector(".screen.on .scroll").scrollTop')
        for _ in range(20):
            if pending: break
            pg.wait_for_timeout(200)
        route = pending[0]
        try:
            real = route.fetch(); d = real.json()
        except Exception as e:
            real, d = None, {'err': str(e)}
        if d.get('decision') == 'answer':
            route.fulfill(response=real)
        else:
            entry = pg.evaluate('() => fetch("/kb/entry/alipay_card_bind_failed?lang=en").then(r => r.json())')
            print('[note] live classify →', d.get('decision'), d.get('mode'), d.get('err', ''), '→ using KB entry fallback')
            route.fulfill(json={'scenario': 'alipay', 'entry_id': entry['id'], 'confidence': 0.86, 'ocr_text': 'Bank card verification failed',
                                'mode': 'model', 'lang': 'en', 'airport': 'PVG', 'candidates': [], 'entry': entry, 'advice': None,
                                'unverified': False, 'latency_ms': 1800, 'decision': 'answer'})
        ok = True
        try:
            pg.wait_for_selector('.screen.on [data-g-act="solved"]', timeout=25000)
            pg.wait_for_timeout(2500)   # 等「You may also ask」补上
        except Exception:
            ok = False
            print('[warn] genie recognition did not return')
        clean(pg)
        spec = c.shot('genie-res')
        spec = crop_scroll(c, spec, 'genie-res', y_load)
        c.scroll_to(y_load, wait=400)
        clean(pg)
        c.shot_plain('genie-res')          # 底图 = 真实页面停在 y_load 的画面
        shots['genie-res'] = spec
        win_h, cmax = spec['scroll']['h'], spec['scroll']['contentH'] - spec['scroll']['h']
        win_y = spec['scroll']['y']
        A = pg.evaluate("""y0 => { const s = document.querySelector('.screen.on .scroll'); const ph = document.querySelector('#phone').getBoundingClientRect(); const sr = s.getBoundingClientRect();
          const r = e => { if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left-ph.left), Math.round(b.top-sr.top+s.scrollTop-y0), Math.round(b.width), Math.round(b.height)]; };
          const solved = s.querySelector('[data-g-act=solved]'); const card = solved.closest('[data-g-msg]'); const ch = [...card.children];
          return { kicker: r(ch[0]), solved: r(solved) }; }""", y_load)
        print('answer', A)
        clamp = lambda v: max(0, min(round(v), cmax))
        s1 = clamp(A['kicker'][1] - 12)
        s2 = clamp(A['solved'][1] + A['solved'][3] + 20 - win_h)
        solved_c = [A['solved'][0] + A['solved'][2] // 2, win_y + A['solved'][1] - s2 + A['solved'][3] // 2]
        if ok:
            c.scroll_to(y_load + s2, wait=500)
            c.tap('[data-g-act="solved"]', wait=700)
            clean(pg)
            shots['genie-ok'] = c.shot_plain('genie-ok')

        # —— 5 回到 step3 → 上车 → done ——
        c.go('step3', wait=1500)
        c.tap(N('In Car Button'), wait=2500)
        pg.wait_for_timeout(1000)
        clean(pg)
        c.scroll_to(0, wait=300)
        shots['done'] = c.shot('done'); names(c, 'done')
        share_r = c.rect(N('Share Card'))
        done_scroll = 0
        if share_r[1] + share_r[3] > 760:
            done_scroll = c.scroll_to(round(share_r[1] + 120 - 760 + 60))
            share_r = c.rect(N('Share Card'))
        share_c = [share_r[0] + share_r[2] // 2, share_r[1] + min(share_r[3] // 2, 120)]
        c.tap(N('Share Card'), wait=2500)
        pg.wait_for_timeout(1500)

        # —— 6 share 票根 → Post to Community ——
        clean(pg)
        c.scroll_to(0, wait=300)
        shots['share'] = c.shot('share'); names(c, 'share')
        post_sel = '[data-fs="compose"]'
        pr = c.rect(post_sel)
        sc = shots['share'].get('scroll')
        share_scroll = 0
        if sc and pr[1] + pr[3] > sc['y'] + sc['h'] - 20:
            share_scroll = c.scroll_to(round(pr[1] + pr[3] - (sc['y'] + sc['h']) + 40))
            pr = c.rect(post_sel)
        post_c = [pr[0] + pr[2] // 2, pr[1] + pr[3] // 2]
        c.tap(post_sel, wait=1500)
        pg.wait_for_timeout(1200)

        # —— 7 发帖页 ——
        clean(pg)
        print('route after compose tap', c.route())
        shots['compose'] = c.shot_plain('compose'); names(c, 'compose')
        sub_sel = '.fs-compose-submit'
        sub_r = c.rect(sub_sel)
        compose_shot_ok = sub_r[1] + sub_r[3] < 840
        if not compose_shot_ok:
            print('[warn] submit off-screen', sub_r)
        sub_c = [sub_r[0] + sub_r[2] // 2, sub_r[1] + sub_r[3] // 2]
        c.tap(sub_sel, wait=2000)
        pg.wait_for_timeout(1500)

        # —— 8 Community 里看到自己的帖子 ——
        clean(pg)
        print('route after post', c.route())
        shots['explore'] = c.shot_plain('explore'); names(c, 'explore')
        mine_c = c.center('[data-mine]')
        c.tap('[data-mine]', wait=1800)
        pg.wait_for_timeout(1000)
        clean(pg)
        print('route after open mine', c.route())
        shots['post'] = c.shot_plain('post')
        c.dump(shots)

    # ================= 时间线 =================
    S = steps.append
    S({'beat': '一步一个任务'})
    S({'show': 'step1', 'hold': 0.35})
    S({'tap': alt1, 'dur': 0.55, 'hold': 0.05})
    S({'show': 'online', 'via': 'push', 'dur': 0.4, 'hold': 0.3})
    S({'tap': on_btn, 'dur': 0.55, 'hold': 0.05})
    S({'show': 'step3', 'via': 'push', 'dur': 0.4, 'hold': 0.35})
    S({'beat': '随时可求助'})
    # 同一个右上角 Help 入口，换三页：行前 / 联网 / 去酒店
    S({'zoom': [pf_fab[0], pf_fab[1] + 40, 1.9], 'dur': 0.5, 'hold': 0.35})
    S({'show': 'preflight', 'via': 'fade', 'dur': 0.3, 'hold': 0.55})
    S({'show': 'online', 'via': 'fade', 'dur': 0.3, 'hold': 0.55})
    S({'show': 'step3', 'via': 'fade', 'dur': 0.3, 'hold': 0.3})
    S({'zoom': None, 'dur': 0.4, 'hold': 0.05})
    S({'tap': s3_fab, 'dur': 0.6})
    S({'show': 'genie', 'via': 'up', 'hold': 0.25})
    S({'tap': chip, 'dur': 0.6})
    S({'show': 'genie-load', 'via': 'fade', 'dur': 0.3, 'hold': 0.7})
    S({'beat': 'AI 识别 + 备用方案'})
    S({'show': 'genie-res', 'via': 'fade', 'dur': 0.35, 'hold': 0.1})
    S({'scroll': s1, 'dur': 0.9, 'hold': 1.1})
    S({'scroll': s2, 'dur': 0.9, 'hold': 1.0})
    if 'genie-ok' in shots:
        S({'tap': solved_c, 'dur': 0.6, 'hold': 0})
        S({'show': 'genie-ok', 'via': 'none', 'hold': 0.5})
    S({'beat': '落地完成'})
    S({'show': 'step3', 'via': 'down', 'dur': 0.45, 'hold': 0.1})
    S({'tap': s3_incar, 'dur': 0.6})
    S({'show': 'done', 'via': 'push', 'dur': 0.45, 'hold': 1.0})
    S({'beat': '分享票根'})
    if done_scroll:
        S({'scroll': done_scroll, 'dur': 0.6, 'hold': 0.05})
    S({'tap': share_c, 'dur': 0.6})
    S({'show': 'share', 'via': 'push', 'dur': 0.45, 'hold': 0.9})
    if share_scroll:
        S({'scroll': share_scroll, 'dur': 0.7, 'hold': 0.1})
    S({'tap': post_c, 'dur': 0.6})
    S({'beat': '发到社区'})
    S({'show': 'compose', 'via': 'push', 'dur': 0.45, 'hold': 0.8})
    S({'tap': sub_c, 'dur': 0.6})
    S({'show': 'explore', 'via': 'push', 'dur': 0.45, 'hold': 1.0})
    S({'tap': mine_c, 'dur': 0.6})
    S({'show': 'post', 'via': 'push', 'dur': 0.45, 'hold': 1.2})

    spec = {'title': '落地与机场（总结）', 'shots': shots, 'steps': steps}
    out = os.path.join(ROOT, 'modules', KEY, 'timeline.js')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('/* 由 tools/capture_airport.py 生成，勿手改 */\nDemo03.register(%s, %s);\n' % (json.dumps(KEY), json.dumps(spec, ensure_ascii=False, indent=1)))
    print('wrote', out, 'shots', len(shots), 'steps', len(steps))


if __name__ == '__main__':
    main()
