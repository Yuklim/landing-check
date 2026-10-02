#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 Pen 导出的 screens-css.html 组装成可点击的 H5：index.html

用法：先在 Pen 里 Export(ids, "html-css", "h5/screens-css.html")，再运行
    python3 build_h5.py
"""
import re, json, os
from bs4 import BeautifulSoup

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'screens-css.html')
OUT = os.path.join(HERE, 'index.html')

# 屏幕 id -> 路由名（也是 hash）
SCREENS = {
    'N6YJqb': 'home',      'BMjtO': 'preflight', 'XGzE4': 'payment',  'd4Fizk': 'transfer',
    'p6jXS': 'lock',       't7mCs': 'trips',     'E91Ggd': 'step1',   'cQhO3': 'online',
    'kKY1n': 'wifi',       'rK2om': 'stuck',     'Sxxn5': 'step3',    'SByuS': 'transit',
    'ZV1Kk': 'driver',     'tmk1G': 'done',      'Bn5F2': 'share',
}
TITLES = {
    'home': '首页入口', 'preflight': '行前检查', 'payment': '支付验证', 'transfer': '接机预订',
    'lock': '锁屏推送', 'trips': 'My Trips', 'step1': '落地卡·第一步', 'online': '已联网分支',
    'wifi': 'Wi-Fi 引导', 'stuck': '我卡住了', 'step3': '第三步交通', 'transit': '地铁导航',
    'driver': '司机地址', 'done': '完成页', 'share': '分享卡',
}

# 点击绑定：(路由, 选择器) -> 动作。选择器用 data-pencil-id 或 data-pencil-name（在该屏范围内）。
# 动作：'go:xxx' 跳转；'back' 返回；'toast:文字' 提示；'toggle-privacy' 分享页开关
BIND = [
    # 首页入口
    ('home', 'name:Feat Landing Check', 'go:preflight'),
    ('home', 'name:Landing Banner', 'go:preflight'),
    ('home', 'name:Tab My Trips', 'go:trips'),
    ('home', 'name:Search', 'toast:Demo：搜索'),
    # My Trips
    ('trips', 'name:Chip Landing Check', 'go:preflight'),
    ('trips', 'name:LC Button', 'go:step1'),
    ('trips', 'name:Landing Check Card', 'go:step1'),
    ('trips', 'name:Tab Home', 'go:home'),
    # 行前检查
    ('preflight', 'name:Back', 'back'),
    ('preflight', 'id:jVYml', 'go:payment'),
    ('preflight', 'id:R0m1Rg', 'go:transfer'),
    ('preflight', 'id:H7HhcV', 'toast:Demo：跳转 Trip.com eSIM 购买页'),
    ('preflight', 'name:Run Check Button', 'then:检测通过 · 模拟时间来到落地那一刻|go:lock'),
    ('preflight', 'name:Stuck FAB', 'go:stuck'),
    ('preflight', 'name:Tab Home', 'go:home'),
    ('preflight', 'name:Tab My Trips', 'go:trips'),
    # 支付验证
    ('payment', 'name:Back', 'go:preflight'),
    ('payment', 'name:Done Button', 'go:preflight'),
    ('payment', 'name:Stuck FAB', 'go:stuck'),
    # 接机预订
    ('transfer', 'name:Back', 'go:preflight'),
    ('transfer', 'name:Book Button', 'then:已预订接机，司机将在落地后举牌等候|go:preflight'),
    ('transfer', 'name:Vehicle Business', 'toast:Demo：选择 Business'),
    ('transfer', 'name:Vehicle Van', 'toast:Demo：选择 Van'),
    # 锁屏
    ('lock', 'name:Notification Landing', 'go:trips'),
    ('lock', 'name:Notification Departed', 'toast:Demo：航班起飞通知'),
    # 落地卡 第一步（没有数据）
    ('step1', 'name:Back', 'go:trips'),
    ('step1', 'name:Primary Button', 'go:wifi'),
    ('step1', 'name:Alt Left', 'go:online'),
    ('step1', 'name:Stuck Card', 'go:stuck'),
    ('step1', 'name:Tab Home', 'go:home'),
    # 已联网分支
    ('online', 'name:Back', 'go:trips'),
    ('online', 'name:Primary Button', 'go:step3'),
    ('online', 'name:Alt Left', 'go:step1'),
    ('online', 'name:Tab Home', 'go:home'),
    # Wi-Fi 引导
    ('wifi', 'name:Back', 'go:online'),
    ('wifi', 'name:Open Settings', 'toast:Demo：打开系统 Wi-Fi 设置'),
    ('wifi', 'name:Copy', 'toast:已复制 AIRPORT-FREE-WIFI'),
    ('wifi', 'name:eSIM Row', 'toast:Demo：跳转 Trip.com eSIM 购买页'),
    ('wifi', 'name:Backup Passport kiosk', 'toast:Demo：显示自助机位置'),
    ('wifi', 'name:Backup Service desk', 'toast:Demo：显示服务台位置'),
    ('wifi', 'name:Stuck FAB', 'go:stuck'),
    # 我卡住了
    ('stuck', 'name:Back', 'back'),
    ('stuck', 'name:Solved Button', 'back'),
    ('stuck', 'name:Retake Button', 'toast:Demo：打开相机'),
    ('stuck', 'name:Support Row', 'toast:Demo：转英文客服，附截图'),
    # 第三步 交通
    ('step3', 'name:Back', 'go:online'),
    ('step3', 'name:Primary Button', 'go:driver'),
    ('step3', 'id:kwA7p', 'go:transit'),
    ('step3', 'id:aFhcw', 'toast:Demo：打开支付宝里的滴滴小程序'),
    ('step3', 'name:In Car Button', 'go:done'),
    ('step3', 'name:Stuck FAB', 'go:stuck'),
    ('step3', 'name:Tab Home', 'go:home'),
    # 地铁导航
    ('transit', 'name:Back', 'go:step3'),
    ('transit', 'name:Start Button', 'toast:Demo：跳转地图 App 开始导航'),
    ('transit', 'name:Ticket Button', 'toast:Demo：购买地铁票'),
    ('transit', 'name:Stuck FAB', 'go:stuck'),
    # 司机地址
    ('driver', 'name:Close', 'go:step3'),
    ('driver', 'name:Didi Button', 'toast:Demo：打开支付宝里的滴滴小程序'),
    ('driver', 'name:Call Button', 'toast:Demo：拨打酒店电话'),
    ('driver', 'name:Stuck FAB', 'go:stuck'),
    # 完成页
    ('done', 'name:Close', 'go:trips'),
    ('done', 'name:Share Card', 'go:share'),
    ('done', 'name:FB Wi-Fi', 'toast:谢谢，已记录：Wi-Fi 最难'),
    ('done', 'name:FB Payment', 'toast:谢谢，已记录：支付最难'),
    ('done', 'name:FB Transport', 'toast:谢谢，已记录：交通最难'),
    # 分享卡
    ('share', 'name:Close', 'go:done'),
    ('share', 'name:Share Button', 'then:Demo：调起系统分享|go:home'),
    ('share', 'name:Privacy Toggle Row', 'toggle-privacy'),
    ('share', 'name:Share Save image', 'toast:Demo：已保存到相册'),
    ('share', 'name:Share Copy link', 'toast:已复制 trip.com/landing'),
]

soup = BeautifulSoup(open(SRC, encoding='utf-8').read(), 'lxml')
root = soup.body.find('div', recursive=False)
screens_html = []
for div in root.find_all('div', recursive=False):
    pid = div.get('data-pencil-id')
    if pid not in SCREENS:
        continue
    route = SCREENS[pid]
    st = div.get('style', '')
    st = re.sub(r'(position|left|top)\s*:[^;]+;?', '', st)
    div['style'] = st + '; position: relative; left: 0; top: 0; margin: 0 auto;'
    div['class'] = 'screen'
    div['data-route'] = route
    for el in div.find_all('div'):
        if el.find(True) is None:
            continue
        est = el.get('style', '')
        m = re.search(r'(?<![\w-])height:\s*([\d.]+)px', est)
        if m and float(m.group(1)) > 56:
            el['style'] = est.replace(m.group(0), 'min-height: %spx' % m.group(1))
    # 绑定
    for r, sel, act in BIND:
        if r != route:
            continue
        kind, val = sel.split(':', 1)
        attr = 'data-pencil-id' if kind == 'id' else 'data-pencil-name'
        for el in div.find_all(attrs={attr: val}):
            el['data-act'] = act
            el['class'] = (el.get('class') or []) + ['tap']
    screens_html.append(str(div))

screens_block = '\n'.join(screens_html)
nav_items = ''.join(f'<button data-go="{r}">{TITLES[r]}</button>' for r in SCREENS.values())

page = f'''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Landing Check">
<meta name="theme-color" content="#2C61FE">
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="icon-180.png">
<title>Trip.com Landing Check · H5 Demo</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  *,::before,::after{{box-sizing:border-box}}
  html,body{{margin:0;height:100%;background:#0F1A3A;font-family:Inter,-apple-system,"PingFang SC","Noto Sans SC",sans-serif;-webkit-tap-highlight-color:transparent}}
  #stage{{position:fixed;inset:0;display:flex;align-items:center;justify-content:center}}
  #phone{{width:393px;height:852px;position:relative;overflow:hidden;background:#fff;transform-origin:center center;border-radius:46px;box-shadow:0 30px 80px rgba(0,0,0,.5)}}
  .screen{{position:absolute !important;inset:0 !important;display:none !important;overflow-y:auto !important;overflow-x:hidden !important;-webkit-overflow-scrolling:touch}}
  .screen.on{{display:flex !important}}
  .screen, .screen *{{box-sizing:border-box !important}}
  .screen [style*="flex: 1 1 0"]{{min-width:0}}
  .screen [style*="width: 100%"]{{max-width:100%}}
  html,body{{overflow:hidden;overscroll-behavior:none}}
  .tap{{cursor:pointer;transition:transform .08s,filter .08s}}
  .tap:active{{transform:scale(.98);filter:brightness(.95)}}
  #toast{{position:absolute;left:50%;bottom:120px;transform:translateX(-50%);background:rgba(18,24,38,.92);color:#fff;font-size:13px;font-weight:600;padding:10px 16px;border-radius:10px;opacity:0;pointer-events:none;transition:opacity .2s;max-width:320px;text-align:center;z-index:50}}
  #toast.show{{opacity:1}}
  #menu{{position:fixed;top:12px;right:12px;z-index:100}}
  #menu>button{{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:8px;padding:8px 12px;font:600 12px Inter,sans-serif;cursor:pointer}}
  #list{{position:fixed;top:48px;right:12px;background:#fff;border-radius:12px;padding:8px;display:none;flex-direction:column;gap:4px;box-shadow:0 12px 40px rgba(0,0,0,.35);z-index:100;max-height:80vh;overflow:auto}}
  #list.open{{display:flex}}
  #list button{{text-align:left;background:#fff;border:0;border-radius:8px;padding:8px 12px;font:500 13px Inter,"PingFang SC",sans-serif;cursor:pointer;color:#121826}}
  #list button:hover{{background:#EAF0FF;color:#2C61FE}}
  #hint{{position:fixed;left:16px;bottom:12px;color:rgba(255,255,255,.55);font-size:12px}}
  @media (max-width:430px){{
    html,body{{background:#0F1A3A;overflow:auto;height:auto}}
    #stage{{position:static;display:block;height:auto}}
    #phone{{border-radius:0;box-shadow:none;transform-origin:top left;margin:0}}
    #hint,#menu>button{{display:none}}
    #list{{top:auto;bottom:16px;right:16px;left:16px;flex-direction:row;flex-wrap:wrap}}
  }}
  body.standalone [data-pencil-name="Status Bar"]{{height:env(safe-area-inset-top,44px) !important;min-height:env(safe-area-inset-top,44px) !important;padding:0 !important}}
  body.standalone [data-pencil-name="Status Bar"] > *{{visibility:hidden}}
</style>
</head>
<body>
<div id="stage"><div id="phone">
{screens_block}
<div id="toast"></div>
</div></div>
<div id="menu"><button id="menuBtn">页面 ≡</button><div id="list">{nav_items}</div></div>
<div id="hint">← → 上一页/下一页 · 点屏幕内的按钮跳转 · 右上角可直接跳到任意页</div>
<script>
const order = {json.dumps(list(SCREENS.values()))};
const hist = [];
const $ = s => document.querySelector(s);
function fit(){{
  const ph = $('#phone');
  const vv = window.visualViewport;
  const w = vv ? vv.width : window.innerWidth, h = vv ? vv.height : window.innerHeight;
  if (w <= 430) {{
    const s = w / 393;
    ph.style.transform = 'scale(' + s + ')';
    ph.style.height = Math.max(852, Math.round(h / s)) + 'px';
    document.body.style.height = Math.round(Math.max(852, h / s) * s) + 'px';
    return;
  }}
  ph.style.height = '852px';
  const s = Math.min((h-40)/852, (w-40)/393, 1.05);
  ph.style.transform = 'scale(' + s + ')';
}}
function show(route, push=true){{
  const cur = document.querySelector('.screen.on');
  if (cur && push && cur.dataset.route !== route) hist.push(cur.dataset.route);
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.dataset.route === route));
  location.hash = route;
  $('#list').classList.remove('open');
}}
function back(){{ const r = hist.pop(); show(r || 'home', false); }}
let tt;
function toast(msg){{ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(()=>t.classList.remove('show'), 1600); }}
function togglePrivacy(){{
  const share = document.querySelector('.screen[data-route="share"]');
  const sw = share.querySelector('[data-pencil-name="Switch"]');
  const knob = sw.querySelector('[data-pencil-name="Knob"]');
  const name = share.querySelector('[data-pencil-name="Foot Name"]');
  const on = sw.dataset.on === '1';
  sw.dataset.on = on ? '0' : '1';
  sw.style.backgroundColor = on ? '#DADFE6' : '#2C61FE';
  sw.style.justifyContent = on ? 'flex-start' : 'flex-end';
  name.textContent = on ? 'Alex · Shanghai PVG → The PuLi' : 'A traveler · PVG → Shanghai';
}}
document.addEventListener('click', e => {{
  const el = e.target.closest('[data-act]');
  if (!el) return;
  e.stopPropagation();
  const act = el.dataset.act;
  if (act.startsWith('go:')) show(act.slice(3));
  else if (act === 'back') back();
  else if (act === 'toggle-privacy') togglePrivacy();
  else if (act.startsWith('toast:')) toast(act.slice(6));
  else if (act.startsWith('then:')) {{ const [t, g] = act.slice(5).split('|'); toast(t); setTimeout(() => show(g.slice(3)), 900); }}
}});
$('#menuBtn').onclick = () => $('#list').classList.toggle('open');
let lp, tx0, ty0;
document.addEventListener('touchstart', e => {{ tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY; lp = setTimeout(() => $('#list').classList.toggle('open'), 700); }}, {{passive:true}});
document.addEventListener('touchend', e => {{
  clearTimeout(lp);
  const dx = e.changedTouches[0].clientX - tx0, dy = e.changedTouches[0].clientY - ty0;
  if (Math.abs(dx) > 90 && Math.abs(dy) < 50) {{
    const cur = document.querySelector('.screen.on').dataset.route, i = order.indexOf(cur);
    show(dx < 0 ? order[(i+1) % order.length] : order[(i-1+order.length) % order.length]);
  }}
}});
document.addEventListener('touchmove', () => clearTimeout(lp), {{passive:true}});
document.querySelectorAll('#list button').forEach(b => b.onclick = () => show(b.dataset.go));
document.addEventListener('keydown', e => {{
  const cur = document.querySelector('.screen.on').dataset.route;
  const i = order.indexOf(cur);
  if (e.key === 'ArrowRight') show(order[(i+1) % order.length]);
  if (e.key === 'ArrowLeft') show(order[(i-1+order.length) % order.length]);
  if (e.key === 'Escape') back();
}});
window.addEventListener('resize', fit);
if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
if (window.navigator.standalone || matchMedia('(display-mode: standalone)').matches) document.body.classList.add('standalone');
fit();
show((location.hash || '#home').slice(1), false);
</script>
</body>
</html>'''
open(OUT, 'w', encoding='utf-8').write(page)
print('built', OUT, round(os.path.getsize(OUT)/1e6, 2), 'MB,', len(screens_html), 'screens')
