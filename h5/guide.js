/* 新手演示：在页面上标出主线「下一步」（蓝色光圈 + 气泡）和可以点开看看的按钮（小蓝点）。
   只叠一层提示，不改页面逻辑；按钮照常点击，页面跳转后提示跟着当前页走。
   开启：链接带 ?guide=1，或右上角菜单「🎓 新手演示」；关闭：?guide=0、菜单或提示里的「退出演示」。
   主线：首页 → 行前检查（授权 / ¥1 支付）→ 模拟落地推送 → My Trips → 落地三步 → 完成页 → 城市票根 → 发到社区。
   真实数据页（酒店 / 景点 / 指南 / 租车）和离线包只标小蓝点，提示评委这些可以点。 */
(function () {
  'use strict';
  const phone = document.getElementById('phone');
  if (!phone) return;
  const KEY = 'lc-guide', SKEY = 'lc-guide-run';
  const store = {
    get(k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    set(k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} },
    del(k, s) { try { (s ? sessionStorage : localStorage).removeItem(k); } catch (e) {} },
  };
  // 链接参数每个会话只生效一次：退出演示后刷新不会又自动打开
  const q = new URLSearchParams(location.search).get('guide');
  if ((q === '1' || q === '0') && !store.get('lc-guide-q', true)) { store.set(KEY, q); store.set('lc-guide-q', '1', true); }
  // 本次会话的进度：welcomed 看过欢迎卡 / landed 点过模拟落地 / done 看过结束卡 / hide 收起气泡的页面
  let run = {}; try { run = JSON.parse(store.get(SKEY, true) || '{}'); } catch (e) {}
  const save = () => store.set(SKEY, JSON.stringify(run), true);
  let on = store.get(KEY) === '1';

  const CH = ['入口', '出发前', '落地推送', '落地三步', '票根与社区'];
  const MCP = '真实数据 · 携程官方 MCP';
  // 每页：ch 章节；side 支线说明（显示在顶部条）；main 主线候选（取第一个找得到的）；spots 小蓝点 [目标, 说明]
  // 目标写法：n:节点名  a:data-act  op:/fs:/g: 各模块的按钮  t:按钮文字（全等）  r:文字（正则）  css:选择器；前缀 ! 表示在整页找
  const PAGES = {
    home: { ch: 0,
      main: [['n:Feat Landing Check', '从这里开始', 'Landing Check 把行前准备和落地第一小时连成一条任务流，一次只给一个下一步。']],
      spots: [['n:Feat Offline Pack', '离线包：酒店双语地址、沟通卡、联网向导，没网也能用'], ['n:AI Pill', 'TripGenie：随时问支付、联网、怎么去酒店'],
        ['n:Big Hotels', `酒店搜索 · ${MCP}`], ['n:Small Attractions', `景点门票 · ${MCP}`], ['n:Small Car Rentals', `租车 · ${MCP}`], ['n:Feat Travel Guides', `旅行指南 · ${MCP}`],
        ['n:Tab Community', '社区：Trip.com Moments 真实帖子']] },
    privacy: { ch: 1,
      main: [['n:Agree Button', '先授权，再检查', '每项权限都写清用途、可单独开关。保存后会自动下载离线包。']],
      spots: [['n:Perm Location', '定位用来在落地时自动唤起检查'], ['n:Perm Camera & photos', '相机只在你点 Help 上传截图时使用']] },
    preflight: { ch: 1,
      main: [['a:api:paypick', '先做最关键的一件事', '验证境内支付：支付宝或 TenPayGo 任选一种，扣 ¥1 试一下就知道能不能用。', el => /Verify/.test(el.textContent)],
        ['n:Tab My Trips', '已经模拟落地', '去 My Trips 打开 Landing Check 卡片，开始落地三步。', () => run.landed],
        ['n:Run Check Button', '模拟飞机落地', '点这里，时间快进到落地那一刻，手机会收到 Trip.com 的推送。']],
      spots: [['a:go:esim', '没买 eSIM：落地后走 Wi-Fi 引导；买了：联网这一步自动通过'], ['n:Item Offline landing pack', '离线包：授权后已自动下载，可以点进去看'],
        ['n:Item Attractions', `景点门票 · ${MCP}`], ['n:Item Travel guides', `旅行指南 · ${MCP}`], ['a:go:transfers', '接机：选车型、下单（演示）'], ['a:go:car', `租车 · ${MCP}`],
        ['n:Stuck FAB', '卡住了随时点 Help，截图或打字求助'], ['!#menuBtn', '右上角菜单：模拟支付失败、深夜落地、重置演示数据']] },
    paysetup: { ch: 1,
      main: [['n:Confirm Button', '发起 ¥1 验证', '选好支付方式和 ¥1 的去向，点这里试扣。']],
      spots: [['n:Method TenPayGo', '支付宝和 TenPayGo 任选其一，验证一种就算就绪'], ['n:Use Donate', '¥1 可以捐给 CYDF，也可以原路退回']] },
    payment: { ch: 1,
      main: [['n:Done Button', '验证完成', '看完结果点这里继续。失败时这页会写清原因和两步解决办法。']],
      spots: [['n:Stuck FAB', '验证失败也可以点 Help 求助']] },
    lock: { ch: 2,
      main: [['n:Notification Landing', '落地推送', '飞机一落地，Trip.com 推送唤起落地检查，离线也能触发。点开它。']] },
    trips: { ch: 2,
      main: [['n:LC Button', '打开落地检查', 'Wi-Fi、支付、酒店三项状态一眼看清，点这里开始落地三步。']],
      spots: [['n:Stamps', 'City Atlas：集齐落地城市的票根'], ['n:AI Pill', 'TripGenie：随时提问']] },
    step1: { ch: 3,
      main: [['n:Primary Button', '第一步 · 联网', '没检测到可用流量，先连浦东机场免费 Wi-Fi。']],
      spots: [['n:Alt Left', '已有 eSIM 的分支：自动检测通过，直接下一步'], ['n:Offline Pack Entry', '离线包：酒店地址卡、沟通卡、联网向导，没网也能打开'], ['n:Stuck FAB', '离线求助：没网也能用，双语求助卡、服务点和机场热线']] },
    online: { ch: 3,
      main: [['n:Primary Button', '联网已自动通过', '有 eSIM，联网这一步自动打勾。继续下一步。']],
      spots: [['n:Alt Left', '其实没网？回到 Wi-Fi 分支重新检查'], ['n:Offline Pack Entry', '离线包：酒店地址卡、沟通卡、联网向导，没网也能打开'], ['n:Stuck FAB', '离线求助：没网也能用，双语求助卡、服务点和机场热线']] },
    wifi: { ch: 3,
      main: [['n:Open Settings', '连上 Wi-Fi 后点这里', '支付验证过就直接去第三步；没验证会先补 ¥1 验证。']],
      spots: [['n:No Password', '网络名一键复制'], ['n:Alt Title Row', '收不到验证码？展开看两个备选办法'], ['n:eSIM Row', '连上后可以顺手买 eSIM'], ['n:Offline Pack Entry', '离线包：酒店地址卡、沟通卡、联网向导，没网也能打开'], ['n:Stuck FAB', '离线求助：没网也能用，双语求助卡、服务点和机场热线']] },
    step3: { ch: 3,
      main: [['n:Primary Button', '第三步 · 去酒店', '推荐方式已按落地时间、行李和支付状态选好。点这里给司机看中文地址。']],
      spots: [['a:api:route:taxi', '真实高德路线，点地图看详情'], ['n:Pay Note', '支付还没验证会单独提醒'], ['a:api:route:0', '所有交通方式，点任一种看分段路线和中文路牌'],
        ['n:In Car Button', '已经上车也可以直接点这里']] },
    driver: { ch: 3,
      main: [['n:In Car Button', '上车了', '把大字中文地址给司机看，上车后点这里，完成落地第一小时。']],
      spots: [['n:Call Button', '一键拨打酒店电话']] },
    done: { ch: 3,
      main: [['n:Share Card', '第一小时完成', '这一小时的时间线都在这里。领取你的第一枚城市票根。']],
      spots: [['n:FB Wi-Fi', '每一步都可以反馈好不好用'], ['n:Post Button', '也可以直接把票根发到社区']] },
    share: { ch: 4,
      main: [['fs:compose', '城市票根', '上海落地纪念票根，可以存图、分享，或者发到社区。']],
      spots: [['fs:save-image', '导出动态 PNG'], ['fs:edit-card', '自定义：是否显示名字和日期'], ['t:My city atlas', 'City Atlas：点亮去过的城市']] },
    'community-compose': { ch: 4,
      main: [['t:Post to Community', '发帖', '先编辑再发，帖子只保存在本机。']],
      spots: [['fs:use-line', '一键套用推荐文案'], ['fs:edit-card', '修改票根上的名字和日期']] },
    explore: { ch: 4, side: 'Trip.com Moments 真实帖子',
      spots: [['r:^I specifically flew', '点进帖子看多图和评论']] },
    'community-post': { ch: 4, side: '帖子详情' },
    'city-passport': { ch: 4, side: 'City Atlas · 城市图鉴',
      spots: [['fs:compose', '把图鉴发到社区']] },
    genie: { ch: -1, side: '随时求助 · TripGenie',
      spots: [['css:[data-g-ask]', '点一个常见问题，答案来自核验过的知识库'], ['g:photo', '上传报错截图，自动识别是哪种问题'], ['g:staff', '生成给工作人员看的中文卡片'],
        ['g:route', '问怎么去酒店，用高德路线回答']] },
    stuck: { ch: -1, side: '求助结果', spots: [['n:Solved Button', '解决了就点这里，帮我们改进知识库']] },
    tutorial: { ch: 1, side: '图文教程' },
    esim: { ch: 1, side: 'eSIM（可选）', spots: [['n:Dest Chinese mainland', '选「中国大陆」即加购 eSIM（演示），落地后联网自动通过']] },
    transfers: { ch: 1, side: '接机（可选）', spots: [['n:Search Button', '查接机车型']] },
    transfer: { ch: 1, side: '接机（可选）', spots: [['n:Book Button', '下单后回到行前检查（演示）']] },
    car: { ch: 1, side: '租车（可选）', spots: [['n:Search Button', `按城市和日期查车 · ${MCP}`]] },
    cars: { ch: 1, side: MCP, spots: [['t:经济型', '按车型就地筛选'], ['r:/day$', '真实车型和日租价']] },
    'hotels-search': { ch: 1, side: MCP, spots: [['t:Search', '按目的地和日期搜真实酒店'], ['t:5 diamonds', '快捷筛选']] },
    hotels: { ch: 1, side: MCP, spots: [['t:Filters', '排序、筛选、位置、钻级就地展开'], ['r:per night', '真实酒店和价格']] },
    attractions: { ch: 1, side: MCP, spots: [['t:Top picks', '按官方主题标签分类'], ['r:^Must-see', 'Must-see 榜单，点卡片进预订页']] },
    guides: { ch: 1, side: MCP, spots: [['a:go:attractions', '跳到景点门票'], ['t:First Look', '旅游笔记，点开看英文摘要和中文原文']] },
    route: { ch: 3, side: '路线详情' },
    transit: { ch: 3, side: '地铁导航', spots: [['n:Start Button', '跳到地图 App 开始导航（演示）']] },
    offline: { ch: 1, side: '离线包 · 没网也能用', spots: [['op:nav', '一屏一个重点：先核对酒店地址'], ['op:download', '整包校验下载，更新时重新下'], ['op:help', '离线时 Help 会来到这里']] },
    'offline-hotel': { ch: 1, side: '离线包 · 酒店地址卡', spots: [['op:import-hotel', '从行程自动带入双语地址']] },
    'offline-cards': { ch: 1, side: '离线包 · 地点与沟通卡', spots: [['op:tab', '按场景切换沟通卡'], ['op:place', '点开一张，出示给工作人员看']] },
    'offline-guide': { ch: 1, side: '离线包 · 联网向导', spots: [['op:guide-next', '按实际情况一步步走'], ['op:guide-request', '中英双语求助卡']] },
    'offline-help': { ch: 1, side: '离线包 · 求助与联系人', spots: [['op:phrase', '出示「我上不了网」'], ['op:copy-number', '复制机场热线']] },
    'offline-place': { ch: 1, side: '离线包 · 服务点', spots: [['op:place-card', '出示给工作人员看的请求']] },
  };

  // 每页都加的小蓝点：离线包下好后弹出的 9 秒提示（挂在手机框上，不属于任何一屏）
  const GLOBAL_SPOTS = [['!t:Offline pack saved', '离线包已自动下好。点这里核对酒店双语地址（可选）']];

  // ---------- 找目标 ----------
  const shown = el => { if (!el || !el.isConnected) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  const clickable = el => { for (let n = el, i = 0; n && i < 8 && n !== phone; n = n.parentElement, i++) { if (n.onclick || n.dataset.act || /^(BUTTON|A)$/.test(n.tagName) || getComputedStyle(n).cursor === 'pointer') return n; } return el; };
  // 按文字找：只扫文本节点（整屏 textContent 太慢），命中后往上找能点的那层
  function byText(root, test) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { const t = n.data.trim(); if (t && test(t) && shown(n.parentElement)) return clickable(n.parentElement); }
    return null;
  }
  function find(scr, spec) {
    const root = spec[0] === '!' ? document : scr; if (spec[0] === '!') spec = spec.slice(1);
    const i = spec.indexOf(':'), k = spec.slice(0, i), v = spec.slice(i + 1);
    const pick = sel => [...root.querySelectorAll(sel)].find(shown) || null;
    if (k === 'n') return pick(`[data-pencil-name="${v}"]`);
    if (k === 'a') return pick(`[data-act="${v}"]`);
    if (k === 'op' || k === 'fs') return pick(`[data-${k}="${v}"]`);
    if (k === 'g') return pick(`[data-g-act="${v}"]`);
    if (k === 'css') return pick(v);
    if (k === 't') return byText(root, t => t === v);
    if (k === 'r') { const re = new RegExp(v); return byText(root, t => re.test(t)); }
    return null;
  }
  // 落地推送弹出时，主线是那条通知
  const notifCard = () => { const n = document.getElementById('notif'); return n && n.classList.contains('in') ? n.querySelector('.ncard[data-n="1"]') : null; };

  // ---------- 提示层 ----------
  const BLUE = '#2C61FE', INK = '#121826';
  const css = document.createElement('style');
  css.textContent = `
    #lc-guide{position:fixed;inset:0;pointer-events:none;z-index:2147483000;font-family:Inter,-apple-system,"PingFang SC","Noto Sans SC",sans-serif}
    #lc-guide .g-ring{position:fixed;border:3px solid ${BLUE};border-radius:14px;box-shadow:0 0 0 4px rgba(44,97,254,.18);animation:gpulse 1.6s ease-out infinite;display:none}
    @keyframes gpulse{0%{box-shadow:0 0 0 0 rgba(44,97,254,.45)}70%{box-shadow:0 0 0 12px rgba(44,97,254,0)}100%{box-shadow:0 0 0 0 rgba(44,97,254,0)}}
    #lc-guide .g-tip{position:fixed;width:232px;background:rgba(255,255,255,.96);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);color:${INK};border:1px solid #DADFE6;border-left:3px solid ${BLUE};border-radius:12px;padding:9px 12px 10px;box-shadow:0 6px 18px rgba(18,24,38,.12);pointer-events:auto;display:none;z-index:3;cursor:pointer}
    #lc-guide .g-tip .g-ch{display:flex;align-items:center;gap:6px;margin-bottom:3px;font:600 11px inherit;font-family:inherit;color:${BLUE};letter-spacing:.02em}
    #lc-guide .g-tip .g-x{margin-left:auto;width:20px;height:20px;line-height:18px;text-align:center;border-radius:10px;color:#8F98A8;font:400 16px inherit;font-family:inherit}
    #lc-guide .g-tip .g-x:hover{background:#F0F2F5;color:${INK}}
    #lc-guide .g-tip b{display:block;font:700 14px/1.3 inherit;font-family:inherit}
    #lc-guide .g-tip p{margin:3px 0 0;font:400 12.5px/1.5 inherit;font-family:inherit;color:#4A5160}
    #lc-guide .g-mini{position:fixed;display:none;align-items:center;gap:5px;max-width:240px;background:rgba(255,255,255,.96);color:${BLUE};border:1px solid rgba(44,97,254,.35);border-radius:12px;padding:3px 10px;font:600 12px/1.5 inherit;font-family:inherit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 3px 10px rgba(18,24,38,.12);pointer-events:auto;cursor:pointer;z-index:2}
    #lc-guide .g-arrow{position:absolute;width:10px;height:10px;background:#fff;border:1px solid #DADFE6;transform:rotate(45deg)}
    #lc-guide .g-arrow.up{border-right:0;border-bottom:0}
    #lc-guide .g-arrow.down{border-left:0;border-top:0}
    #lc-guide .g-dot{position:fixed;z-index:1;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:${BLUE};border:2px solid #fff;box-shadow:0 1px 4px rgba(18,24,38,.3);pointer-events:auto;cursor:pointer;display:none}
    #lc-guide .g-dot::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:2px solid rgba(44,97,254,.5);animation:gdot 1.8s ease-out infinite}
    @keyframes gdot{from{transform:scale(.6);opacity:1}to{transform:scale(1.3);opacity:0}}
    #lc-guide .g-pop{position:fixed;z-index:4;max-width:220px;background:#fff;color:${INK};border:1px solid #DADFE6;border-radius:10px;padding:8px 10px;font:500 12.5px/1.45 inherit;font-family:inherit;box-shadow:0 8px 24px rgba(18,24,38,.18);display:none}
    #lc-guide .g-bar{position:fixed;transform:translate(-50%,-100%);display:none;align-items:center;gap:8px;background:rgba(18,24,38,.88);color:#fff;border-radius:14px;padding:5px 10px 5px 12px;font:600 12px inherit;font-family:inherit;white-space:nowrap;pointer-events:auto;cursor:pointer}
    #lc-guide .g-tip .g-ch i{display:inline-block;width:5px;height:5px;border-radius:3px;background:#DADFE6;margin-left:3px}
    #lc-guide .g-tip .g-ch i.on{background:${BLUE};width:12px}
    #lc-guide .g-bar i{display:inline-block;width:6px;height:6px;border-radius:3px;background:rgba(255,255,255,.3);margin-left:3px}
    #lc-guide .g-bar i.on{background:#7CA2FF;width:14px}
    #lc-guide .g-more{position:fixed;transform:translateX(-50%);display:none;background:${BLUE};color:#fff;border-radius:18px;padding:8px 14px;font:600 13px inherit;font-family:inherit;box-shadow:0 6px 18px rgba(44,97,254,.35);pointer-events:auto;cursor:pointer}
    #lc-guide .g-modal{position:fixed;z-index:5;display:none;align-items:center;justify-content:center;background:rgba(18,24,38,.55);pointer-events:auto}
    #lc-guide .g-card{width:calc(100% - 48px);max-width:330px;background:#fff;color:${INK};border-radius:18px;padding:22px 20px 16px;box-shadow:0 20px 50px rgba(0,0,0,.3)}
    #lc-guide .g-card h3{margin:0;font:800 20px/1.3 inherit;font-family:inherit}
    #lc-guide .g-card p,#lc-guide .g-card li{font:400 14px/1.6 inherit;font-family:inherit;color:#4A5160}
    #lc-guide .g-card ul{margin:8px 0 0;padding-left:18px}
    #lc-guide .g-card .g-legend{display:flex;gap:14px;margin:12px 0 4px;font:500 13px inherit;font-family:inherit;color:#4A5160}
    #lc-guide .g-card .g-legend span{display:flex;align-items:center;gap:6px}
    #lc-guide .g-card .g-legend em{display:inline-block;width:16px;height:16px;border-radius:5px;border:3px solid ${BLUE}}
    #lc-guide .g-card .g-legend em.d{border-radius:50%;background:${BLUE};border:2px solid #fff;box-shadow:0 0 0 1px ${BLUE}}
    #lc-guide .g-btn{display:block;width:100%;height:44px;margin-top:10px;border:0;border-radius:12px;background:${BLUE};color:#fff;font:600 15px inherit;font-family:inherit;cursor:pointer}
    #lc-guide .g-btn.alt{background:#F0F2F5;color:${INK}}
    #lc-guide .g-btn.txt{background:none;color:#6F7685;height:32px;font-size:13px}
    @media (prefers-reduced-motion: reduce){#lc-guide .g-ring,#lc-guide .g-dot::after{animation:none}}`;
  document.head.appendChild(css);
  const layer = document.createElement('div'); layer.id = 'lc-guide'; layer.setAttribute('aria-live', 'polite');
  layer.innerHTML = `<div class="g-ring"></div><div class="g-bar"></div><div class="g-more"></div>
    <div class="g-tip" role="dialog" data-gd="fold"><div class="g-arrow"></div><div class="g-ch"></div><b></b><p></p></div><div class="g-mini" role="button" data-gd="unfold"></div>
    <div class="g-pop"></div><div class="g-modal"></div>`;
  document.body.appendChild(layer);
  const $ = s => layer.querySelector(s);
  const ring = $('.g-ring'), tip = $('.g-tip'), mini = $('.g-mini'), arrow = $('.g-arrow'), bar = $('.g-bar'), more = $('.g-more'), pop = $('.g-pop'), modal = $('.g-modal');
  const dots = [];

  // ---------- 每帧定位 ----------
  let cur = { route: null, main: null, spots: [], at: 0 }, popFor = null;
  // 气泡：换到新的一步时展开，5 秒后或页面一滑动就收成小胶囊；点胶囊再展开
  const FOLD_MS = 5000; let tipKey = '', tipOpenAt = 0, folded = false;
  function resolve() {
    const scr = document.querySelector('.screen.on'), route = scr ? scr.dataset.route : null, P = PAGES[route] || {};
    if (route !== cur.route) { popFor = null; pop.style.display = 'none'; }
    let main = null;
    const nc = notifCard();
    if (nc) main = { el: nc, title: '飞机落地了', body: '点这条推送，进入落地检查。' };
    else if (scr) for (const [spec, title, body, when] of (P.main || [])) {
      const el = find(scr, spec);
      if (el && (!when || when(el))) { main = { el, title, body }; break; }
    }
    const spots = scr ? (P.spots || []).concat(GLOBAL_SPOTS).map(([spec, text]) => ({ el: find(scr, spec), text })).filter(s => s.el && (!main || s.el !== main.el)) : [];
    cur = { route, scr, P, main, spots, at: performance.now() };
  }
  // 目标在滚动容器里被裁掉多少：返回可见区域（和手机框求交）
  function visibleBox(el) {
    const pr = phone.getBoundingClientRect();
    let top = pr.top, left = pr.left, right = pr.right, bottom = pr.bottom;
    for (let n = el.parentElement; n && n !== phone && n !== document.body; n = n.parentElement) {
      const o = getComputedStyle(n); if (o.overflowY === 'visible' && o.overflowX === 'visible') continue;
      const r = n.getBoundingClientRect(); top = Math.max(top, r.top); left = Math.max(left, r.left); right = Math.min(right, r.right); bottom = Math.min(bottom, r.bottom);
    }
    return { top, left, right, bottom };
  }
  function place() {
    if (!on) return;
    if (performance.now() - cur.at > 400 || !cur.route || (document.querySelector('.screen.on') || {}).dataset?.route !== cur.route) resolve();
    const pr = phone.getBoundingClientRect(), modalOpen = modal.style.display === 'flex';
    // 章节：主线页写在气泡里；支线页（没有主线下一步）在底部固定栏上方放一条说明，点了返回
    const P = cur.P || {}, nc = notifCard(), m = cur.main;
    const chHTML = P.ch >= 0 ? `<span>第 ${P.ch} 章 · ${CH[P.ch]}</span><span>${CH.map((_, i) => `<i class="${i === P.ch ? 'on' : ''}"></i>`).join('')}</span>` : '';
    if (cur.route && !nc && !modalOpen && !m && (P.side || P.ch >= 0)) {
      const html = `<span>🎓 ${P.side ? (P.ch >= 0 ? '支线 · ' : '') + P.side : `第 ${P.ch} 章 · ${CH[P.ch]}`}</span>${P.side ? '<span style="opacity:.7">‹ 返回</span>' : ''}`;
      if (bar.dataset.h !== html) { bar.innerHTML = html; bar.dataset.h = html; }
      let y = pr.bottom - 12;
      cur.scr.querySelectorAll(':scope > .pin, .op-footer, [data-pencil-name="Tab Bar"], [data-pencil-name="Tab Bar Wrap"]').forEach(f => { const t = f.getBoundingClientRect().top; if (f.offsetHeight && t > pr.top + pr.height * 0.6 && t - 10 < y) y = t - 10; });
      bar.style.display = 'flex'; bar.style.left = (pr.left + pr.width / 2) + 'px'; bar.style.top = y + 'px';
    } else bar.style.display = 'none';
    // 主线：光圈 + 气泡；在屏幕外就给「下滑」按钮
    ring.style.display = tip.style.display = mini.style.display = more.style.display = 'none';
    if (m && shown(m.el) && !modalOpen) {
      const r = m.el.getBoundingClientRect(), vb = nc ? pr : visibleBox(m.el);
      const inView = r.top >= vb.top - 2 && r.bottom <= vb.bottom + 2;
      const partly = r.bottom > vb.top + 8 && r.top < vb.bottom - 8;
      if (!inView && !partly) {
        more.textContent = r.top >= vb.bottom ? '向下滑动，找到下一步 ↓' : '向上滑动，找到下一步 ↑';
        more.style.display = 'block'; more.style.left = (pr.left + pr.width / 2) + 'px';
        more.style.top = (r.top >= vb.bottom ? vb.bottom - 56 : vb.top + 44) + 'px';
      } else {
        const pad = 4, br = parseFloat(getComputedStyle(m.el).borderTopLeftRadius) || 10;
        const t = Math.max(r.top, vb.top), b = Math.min(r.bottom, vb.bottom);
        Object.assign(ring.style, { display: 'block', left: (r.left - pad) + 'px', top: (t - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (b - t + pad * 2) + 'px', borderRadius: Math.min(br + pad, 30) + 'px' });
        const key = cur.route + '|' + m.title;
        if (key !== tipKey) { tipKey = key; tipOpenAt = performance.now(); folded = false; }
        if (!folded && performance.now() - tipOpenAt > FOLD_MS) folded = true;
        const cx = r.left + r.width / 2;
        if (folded) {
          const label = '下一步 · ' + m.title; if (mini.textContent !== label) mini.textContent = label;
          mini.style.display = 'flex';
          const mw = mini.offsetWidth, mh = mini.offsetHeight, below = b + 10 + mh <= pr.bottom - 8;
          mini.style.left = Math.max(pr.left + 8, Math.min(cx - mw / 2, pr.right - 8 - mw)) + 'px';
          mini.style.top = (below ? b + pad + 6 : t - pad - 6 - mh) + 'px';
        } else {
          const gc = tip.querySelector('.g-ch'), gh = chHTML + '<span class="g-x" title="收起">×</span>';
          if (gc.dataset.h !== gh) { gc.innerHTML = gh; gc.dataset.h = gh; }
          tip.querySelector('b').textContent = m.title; tip.querySelector('p').textContent = m.body;
          tip.style.display = 'block';
          const tw = Math.min(232, pr.width - 24); tip.style.width = tw + 'px'; const th = tip.offsetHeight;
          const below = b + 14 + th <= pr.bottom - 8 || t - 14 - th < pr.top + 40;
          const top = below ? b + pad + 10 : t - pad - 10 - th;
          const left = Math.max(pr.left + 12, Math.min(cx - tw / 2, pr.right - 12 - tw));
          tip.style.left = left + 'px'; tip.style.top = Math.max(pr.top + 8, Math.min(top, pr.bottom - th - 8)) + 'px';
          arrow.className = 'g-arrow ' + (below ? 'up' : 'down');
          arrow.style.left = Math.max(12, Math.min(cx - left - 5, tw - 24)) + 'px';
          arrow.style.top = below ? '-6px' : ''; arrow.style.bottom = below ? '' : '-6px';
        }
      }
    }
    // 小蓝点：贴在按钮右上角
    cur.spots.forEach((s, i) => {
      let d = dots[i]; if (!d) { d = document.createElement('div'); d.className = 'g-dot'; d.setAttribute('role', 'button'); d.setAttribute('aria-label', '这是什么'); layer.appendChild(d); dots[i] = d; }
      d._spot = s;
      const r = s.el.getBoundingClientRect(), vb = s.el.closest('#notif') ? pr : visibleBox(s.el);
      const x = Math.min(r.right - 6, pr.right - 10), y = Math.max(r.top + 6, pr.top + 10);
      const ok = !modalOpen && shown(s.el) && y >= vb.top && y <= vb.bottom && x >= vb.left - 8 && x <= vb.right + 8;
      d.style.display = ok ? 'block' : 'none'; d.style.left = x + 'px'; d.style.top = y + 'px';
    });
    for (let i = cur.spots.length; i < dots.length; i++) dots[i].style.display = 'none';
    if (popFor) {
      const d = dots.find(x => x._spot && x._spot.el === popFor && x.style.display !== 'none');
      if (!d || d.style.display === 'none') { pop.style.display = 'none'; popFor = null; }
      else { const x = parseFloat(d.style.left), y = parseFloat(d.style.top), w = pop.offsetWidth, h = pop.offsetHeight;
        pop.style.left = Math.max(pr.left + 8, Math.min(x - w + 12, pr.right - w - 8)) + 'px';
        pop.style.top = (y + 14 + h > pr.bottom - 8 ? y - 14 - h : y + 14) + 'px'; }
    }
    // 主线走完：从发帖页回到社区
    if (cur.route === 'explore' && run.posted && !run.done && !modalOpen) { run.done = 1; save(); finale(); }
    if (cur.route === 'community-compose') run.composing = 1;
    else if (run.composing) { if (cur.route === 'explore') run.posted = 1; run.composing = 0; save(); }
  }
  let raf = 0;
  const loop = () => { place(); raf = on ? requestAnimationFrame(loop) : 0; };

  // ---------- 交互 ----------
  layer.addEventListener('click', e => {
    const d = e.target.closest('.g-dot');
    if (d) { e.stopPropagation(); if (popFor === d._spot.el) { popFor = null; pop.style.display = 'none'; return; } popFor = d._spot.el; pop.textContent = d._spot.text; pop.style.display = 'block'; return; }
    const g = e.target.closest('[data-gd]'); if (!g) return;
    e.stopPropagation();
    const a = g.dataset.gd;
    if (a === 'fold') folded = true;
    else if (a === 'unfold') { folded = false; tipOpenAt = performance.now(); }
    else if (a === 'quit') setOn(false);
    else if (a === 'fresh') { closeModal(); run = { welcomed: 1 }; save(); resetDemo(); }
    else if (a === 'keep') { closeModal(); run.welcomed = 1; save(); }
    else if (a === 'home') { closeModal(); show('home'); }
  });
  // 用户开始滑动页面：说明已经看过，气泡收成胶囊，不挡内容
  const foldOnSwipe = e => { if (on && !folded && tipKey && !e.target.closest?.('#lc-guide')) folded = true; };
  document.addEventListener('wheel', foldOnSwipe, { passive: true, capture: true });
  document.addEventListener('touchmove', foldOnSwipe, { passive: true, capture: true });
  more.addEventListener('click', () => { const m = cur.main; if (m) m.el.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
  bar.addEventListener('click', () => { if (cur.P && cur.P.side) window.back(); });
  document.addEventListener('click', e => { if (popFor && !e.target.closest('#lc-guide')) { popFor = null; pop.style.display = 'none'; } }, true);
  // 点了「模拟落地」：之后行前检查的主线改成去 My Trips
  document.addEventListener('click', e => { if (on && e.target.closest('[data-act="api:land"]')) { run.landed = 1; save(); } }, true);
  function resetDemo() {
    const b = [...document.querySelectorAll('#list button')].find(x => /重置演示数据/.test(x.textContent));
    if (b) b.click(); else { show('home'); }
  }

  // ---------- 欢迎卡 / 结束卡 ----------
  function openModal(html) {
    const pr = phone.getBoundingClientRect();
    Object.assign(modal.style, { display: 'flex', left: pr.left + 'px', top: pr.top + 'px', width: pr.width + 'px', height: pr.height + 'px', borderRadius: getComputedStyle(phone).borderRadius });
    modal.innerHTML = `<div class="g-card">${html}</div>`;
  }
  function closeModal() { modal.style.display = 'none'; modal.innerHTML = ''; }
  function welcome() {
    openModal(`<h3>新手演示</h3>
      <p>跟着高亮走一遍「首次来华的第一小时」：行前准备 → 落地推送 → 落地三步 → 城市票根。大约 3 分钟。</p>
      <div class="g-legend"><span><em></em>主线下一步</span><span><em class="d"></em>可以点开看看</span></div>
      <p style="margin:6px 0 0;font-size:13px;color:#6F7685">按钮照常点击；随时可以从右上角菜单关闭演示。</p>
      <button class="g-btn" data-gd="fresh">从头开始（清空演示进度）</button>
      <button class="g-btn alt" data-gd="keep">接着当前进度</button>
      <button class="g-btn txt" data-gd="quit">不用了，自己逛</button>`);
  }
  function finale() {
    openModal(`<h3>🎉 主线走完了</h3>
      <p>你已经体验了从出发前到落地后分享的完整一小时。还可以看看：</p>
      <ul><li>离线包：首页 Offline Pack，没网也能用</li><li>酒店、景点、指南、租车：真实携程数据</li><li>City Atlas：My Trips 右上角 Stamps</li><li>TripGenie：任意页 Help，或首页 Ask AI</li><li>右上角菜单：模拟支付失败、深夜落地</li></ul>
      <button class="g-btn" data-gd="home">回首页继续逛（保留小蓝点）</button>
      <button class="g-btn txt" data-gd="quit">退出新手演示</button>`);
  }

  // ---------- 开关 ----------
  let menuBtn = null;
  function setOn(v) {
    on = v; store.set(KEY, v ? '1' : '0');
    if (menuBtn) menuBtn.textContent = '🎓 新手演示：' + (v ? '开' : '关');
    if (v) { layer.style.display = 'block'; resolve(); if (!run.welcomed) welcome(); if (!raf) loop(); }
    else { layer.style.display = 'none'; closeModal(); popFor = null; pop.style.display = 'none'; run = {}; save(); }
  }
  const list = document.getElementById('list');
  if (list) {
    menuBtn = document.createElement('button'); menuBtn.style.fontWeight = '700';
    menuBtn.onclick = () => { if (!on) { run = {}; save(); } setOn(!on); list.classList.remove('open'); };
    list.prepend(menuBtn);
  }
  window.lcGuide = setOn;
  setOn(on);
})();
