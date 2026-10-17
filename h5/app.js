/* Landing Check H5 · 后端接入层
 * 接口地址：?api=https://xxx > /app 使用同源 > GitHub Pages 使用 LC_API（默认静态）> 本机 8000
 * 接口失败时页面保持设计稿里的静态内容，只弹一条提示。
 */
(function () {
  const qs = new URLSearchParams(location.search);
  const ALLOWED = /^https?:\/\/(127\.0\.0\.1|localhost|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|[\w-]+\.onrender\.com)(:\d+)?$/;
  const want = qs.get('api');
  let API = (want && ALLOWED.test(want)) ? want
          : location.pathname.startsWith('/app') ? location.origin
          : location.hostname.endsWith('github.io') ? (window.LC_API || '')
          : 'http://127.0.0.1:8000';
  API = API.replace(/\/$/, '');
  const S0 = () => ({ entry: null, lastShot: null, night: false, payReturn: null, paying: false });
  const S = S0();
  const el = (tag, style, text) => { const n = document.createElement(tag); if (style) n.style.cssText = style; if (text != null) n.textContent = text; return n; };
  const withTimeout = (p, ms) => { let timer; return Promise.race([p, new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('timeout')), ms); })]).finally(() => clearTimeout(timer)); };
  const $$ = (route, name) => document.querySelector(`.screen[data-route="${route}"] [data-pencil-name="${name}"]`);
  const $all = (route, name) => [...document.querySelectorAll(`.screen[data-route="${route}"] [data-pencil-name="${name}"]`)];
  const txt = (el, v) => { if (el && v != null) el.textContent = v; };
  const ok = r => { if (!r.ok) throw new Error(r.status); return r.json(); };
  const localOnly = () => !navigator.onLine || /^#(?:offline|share|community|city-passport)/.test(location.hash);
  // 访问者 ID：每台设备一份演示进度（后端按 X-LC-Visitor 隔离），评委扫码互不影响；存不了本机就只在本次打开有效
  const VISITOR = (() => {
    const make = () => 'v' + Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('');
    try { let id = localStorage.getItem('lc-visitor'); if (!/^[A-Za-z0-9_-]{8,64}$/.test(id || '')) { id = make(); localStorage.setItem('lc-visitor', id); } return id; } catch (e) { return make(); }
  })();
  const VH = { 'X-LC-Visitor': VISITOR };
  const get = (p, explicit = false) => (!navigator.onLine || (!explicit && localOnly())) ? Promise.reject(new Error('Offline guide uses local data')) : fetch(API + p, { headers: VH }).then(ok);
  const post = (p, body, isForm) => localOnly() ? Promise.reject(new Error('Offline guide uses local data')) : fetch(API + p, isForm ? { method: 'POST', headers: VH, body } : { method: 'POST', headers: { ...VH, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }).then(ok);
  // This endpoint is simulated; preserve that provenance when prefilling the offline hotel card.
  window.lcOfflineTrip = () => API ? withTimeout(get('/mock/trip', true), 4000).then(trip => ({ ...trip, demo: true })) : Promise.resolve(null);

  // ---------- 状态指示 ----------
  const dot = document.createElement('div');
  dot.id = 'lcdot'; dot.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:200;font:600 11px Inter,sans-serif;color:#fff;background:rgba(0,0,0,.45);padding:4px 8px;border-radius:10px;pointer-events:none;transition:opacity .6s';
  document.body.appendChild(dot);
  function status(t, color) { dot.textContent = t; dot.style.background = color || 'rgba(0,0,0,.45)'; dot.style.opacity = 1; clearTimeout(dot._t); dot._t = setTimeout(() => dot.style.opacity = 0, 4000); }
  const STATIC = { landing: 'go:step1', stuck: 'go:stuck', solved: 'back', incar: 'go:done', land: 'island', esim: 'then:eSIM added (demo)|go:preflight', transfer: 'then:Transfer booked (demo)|go:preflight' };
  function staticHandle(act) {
    if (window.lcPayStatic && window.lcPayStatic(act)) return;      // 支付宝 / TenPayGo 验证，见"支付方式"一节
    const a = STATIC[act.split(':')[0]] || (act.startsWith('fb:') ? 'toast:Thanks, recorded (demo)' : null);
    if (!a) { toast('Demo'); return; }
    if (a.startsWith('go:')) show(a.slice(3)); else if (a === 'back') back(); else if (a === 'island') island();
    else if (a.startsWith('then:')) { const [t, g] = a.slice(5).split('|'); toast(t); setTimeout(() => show(g.slice(3)), 800); }
    else if (a.startsWith('toast:')) toast(a.slice(6));
  }

  // ---------- 图文教程屏（运行时注入；数据来自 h5/tutorials.json，后端可达时用接口里的翻译文案） ----------
  const TUT = { all: null, e: null, i: 0 };
  const BLUE = '#2C61FE', GREEN = '#1BA672', INK = '#1A1F2E', MUTED = '#6F7685', LINE = '#DADFE6', BG = '#F0F2F5';
  const tut = document.createElement('div');
  tut.className = 'screen'; tut.dataset.route = 'tutorial'; tut.setAttribute('data-pencil-name', 'Tutorial');
  tut.style.cssText = `background:#fff;width:393px;height:852px;position:relative;margin:0 auto;box-sizing:border-box;font-family:Inter,-apple-system,"PingFang SC",sans-serif;color:${INK}`;
  tut.innerHTML = `
    <div style="padding:54px 20px 0;display:flex;align-items:center;gap:10px">
      <div data-act="back" style="width:36px;height:36px;border-radius:18px;background:${BG};display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></div>
      <div style="min-width:0"><div id="tutTitle" style="font:700 17px/1.25 Inter,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div><div id="tutSub" style="font:500 12px/1.3 Inter,sans-serif;color:${MUTED};margin-top:2px"></div></div>
    </div>
    <div id="tutBar" style="display:flex;gap:6px;padding:14px 20px 0"></div>
    <div class="scroll" style="padding:14px 20px 0">
      <div id="tutImgBox" style="width:353px;height:199px;border-radius:16px;overflow:hidden;background:${BG} center/cover no-repeat;border:1px solid ${LINE};position:relative;flex:none">
        <img id="tutImg" alt="" style="width:100%;height:100%;object-fit:cover;display:block">
        <video id="tutVid" muted loop playsinline autoplay preload="metadata" style="width:100%;height:100%;object-fit:contain;display:none"></video>
        <div id="tutAlt" style="position:absolute;left:0;right:0;bottom:0;padding:6px 10px;font:500 11px/1.3 Inter,sans-serif;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.55))"></div>
      </div>
      <div id="tutWhy" style="margin-top:14px;padding:12px 14px;border-radius:12px;background:#EEF3FF;font:400 13px/1.5 Inter,sans-serif;color:${INK}"></div>
      <div style="display:flex;gap:12px;margin-top:16px;align-items:flex-start">
        <div id="tutNum" style="width:28px;height:28px;border-radius:14px;background:${BLUE};color:#fff;font:700 14px/28px Inter,sans-serif;text-align:center;flex:none"></div>
        <div id="tutStep" style="font:500 16px/1.5 Inter,sans-serif;flex:1"></div>
      </div>
      <div id="tutFb" style="margin-top:16px;padding:12px 14px;border-radius:12px;background:#FFF4E5;border:1px solid #F5D9B0;font:400 13px/1.5 Inter,sans-serif"></div>
      <div id="tutSrc" style="margin:18px 0 20px;font:400 11px/1.4 Inter,sans-serif;color:${MUTED}"></div>
    </div>
    <div style="padding:10px 20px 28px;display:flex;gap:10px;border-top:1px solid ${LINE};background:#fff">
      <div id="tutPrev" style="flex:1;height:48px;border-radius:24px;background:${BG};color:${INK};font:600 15px/48px Inter,sans-serif;text-align:center;cursor:pointer">Previous</div>
      <div id="tutNext" style="flex:2;height:48px;border-radius:24px;background:${BLUE};color:#fff;font:600 15px/48px Inter,sans-serif;text-align:center;cursor:pointer">Next step</div>
    </div>`;
  // 顶部放设计稿同款 iOS 状态栏（浅色版，从 Wi-Fi 引导屏克隆），标题区不再留 54px 空白
  (() => { const sb = document.querySelector('.screen[data-route="wifi"] [data-pencil-name="Status Bar"]'); if (!sb) return; const c = sb.cloneNode(true); c.style.flexShrink = '0'; tut.insertBefore(c, tut.firstChild); c.nextElementSibling.style.padding = '0 20px 0'; })();
  const screens = document.querySelectorAll('#phone > .screen');
  if (screens.length) screens[screens.length - 1].after(tut);
  if (typeof order !== 'undefined' && !order.includes('tutorial')) order.push('tutorial');
  const T = id => tut.querySelector('#' + id);
  function tutRender() {
    const e = TUT.e; if (!e) return;
    const n = e.steps.length, i = TUT.i, last = i === n - 1;
    const m = (e.media || []).find(x => x.step === i + 1);
    txt(T('tutTitle'), e.title); txt(T('tutSub'), `Step ${i + 1} of ${n}` + (e.verified_at ? ` · verified ${e.verified_at}` : ''));
    T('tutBar').innerHTML = e.steps.map((_, k) => `<div style="flex:1;height:4px;border-radius:2px;background:${k <= i ? BLUE : LINE}"></div>`).join('');
    const box = T('tutImgBox'), img = T('tutImg'), vid = T('tutVid');
    const isVid = !!m && /\.(mp4|webm)$/i.test(m.file);
    // 视频配图（自制动画）：静音循环自动播放，poster 先占位；图片配图照旧
    if (isVid) { vid.pause(); vid.removeAttribute('src'); vid.load(); }
    if (m) {
      box.style.display = ''; box.style.backgroundImage = m.poster && !isVid ? `url(img/tutorial/${m.poster})` : ''; box.style.height = '199px'; txt(T('tutAlt'), m.alt || '');
      if (isVid) { img.style.display = 'none'; img.removeAttribute('src'); vid.style.display = 'block'; vid.poster = m.poster ? 'img/tutorial/' + m.poster : ''; vid.setAttribute('aria-label', m.alt || ''); vid.src = 'img/tutorial/' + m.file; const p = vid.play(); if (p && p.catch) p.catch(() => {}); }
      else { vid.pause(); vid.style.display = 'none'; vid.removeAttribute('src'); img.style.display = 'block'; img.style.objectFit = 'cover'; img.src = 'img/tutorial/' + m.file; img.alt = m.alt || ''; }
    }
    else { box.style.display = 'none'; img.removeAttribute('src'); vid.pause(); vid.removeAttribute('src'); }
    T('tutWhy').style.display = i === 0 ? '' : 'none'; txt(T('tutWhy'), e.why);
    txt(T('tutNum'), String(i + 1)); txt(T('tutStep'), e.steps[i]);
    T('tutFb').style.display = last ? '' : 'none'; txt(T('tutFb'), 'Still stuck? ' + e.fallback);
    const imgSrc = m && m.source ? ` · ${isVid ? 'Animation' : 'Image'}: ${m.source.name.split('·')[0].trim()}${m.placeholder ? ' (placeholder, demo only)' : ''}` : '';
    txt(T('tutSrc'), `Steps from ${e.sources && e.sources[0] ? e.sources[0].name.split('·')[0].trim() : 'Trip.com'}${imgSrc}`);
    T('tutPrev').style.visibility = i === 0 ? 'hidden' : 'visible';
    txt(T('tutNext'), last ? 'Done' : 'Next step'); T('tutNext').style.background = last ? GREEN : BLUE;
    const sc = tut.querySelector('.scroll'); if (sc) sc.scrollTop = 0;
  }
  // 竖屏截图：按原比例完整显示，限高 400
  T('tutImg').onload = function () { const portrait = this.naturalHeight > this.naturalWidth; const box = T('tutImgBox'); if (portrait) { this.style.objectFit = 'contain'; box.style.height = '400px'; box.style.backgroundImage = ''; } };
  T('tutVid').onloadedmetadata = function () { if (this.videoHeight > this.videoWidth) T('tutImgBox').style.height = '400px'; };
  // 离开教程屏时停掉动画，省电
  window.addEventListener('hashchange', () => { if (location.hash !== '#tutorial') T('tutVid').pause(); });
  T('tutPrev').onclick = () => { if (TUT.i > 0) { TUT.i--; tutRender(); } };
  T('tutNext').onclick = () => { if (TUT.i < TUT.e.steps.length - 1) { TUT.i++; tutRender(); } else back(); };
  (() => { let x0 = 0; const box = T('tutImgBox'); box.addEventListener('touchstart', ev => { x0 = ev.touches[0].clientX; }, { passive: true }); box.addEventListener('touchend', ev => { const dx = ev.changedTouches[0].clientX - x0; if (dx < -40) T('tutNext').onclick(); else if (dx > 40) T('tutPrev').onclick(); }); })();
  // tutorials.json 只取一次，教程屏、识别结果页、行前检查入口、菜单共用
  const loadTutorials = () => TUT.p || (TUT.p = fetch('tutorials.json').then(ok).then(d => d.tutorials).catch(() => []).then(list => (TUT.all = list)));
  async function openTutorial(id, lang, step) {
    let e = (await loadTutorials()).find(t => t.id === id);
    if (!e) { toast('No tutorial for this step yet'); return; }
    e = Object.assign({}, e);
    if (API) { try { const r = await withTimeout(get(`/kb/entry/${id}?lang=${lang || 'en'}`), 4000); ['title', 'why', 'steps', 'fallback'].forEach(k => { if (r[k]) e[k] = r[k]; }); } catch (err) {} }
    TUT.e = e; TUT.i = Math.min(Math.max((parseInt(step, 10) || 1) - 1, 0), e.steps.length - 1); tutRender(); show('tutorial');
  }
  window.lcTutorial = openTutorial;
  // 深链：?tutorial=<条目id> 直接打开图文教程（嵌入 App 时按条目跳转）
  const tutQ = qs.get('tutorial'); if (tutQ) setTimeout(() => openTutorial(tutQ, qs.get('lang'), qs.get('step')), 150);
  window.lcHasTutorial = async id => (await loadTutorials()).some(t => t.id === id);
  // ---------- 支付方式：支付宝 / TenPayGo 并列，任一个 ¥1 验证即就绪（运行时注入，静态模式也可用） ----------
  const PAY_NAME = { alipay: 'Alipay', tenpaygo: 'TenPayGo' };
  const OTHER = { alipay: 'tenpaygo', tenpaygo: 'alipay' };
  // 板块下方的教程入口：一行里两个链接，分别打开两篇设置教程
  function guideLinks(items) {
    const link = el('div', `display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding-left:38px;font:600 12px/1.3 Inter,system-ui,sans-serif;color:${BLUE}`);
    link.setAttribute('data-pencil-name', 'Item Guide Link');
    link.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="${BLUE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
    link.append(el('span', `color:${MUTED};font-weight:500`, 'Setup guide'));
    items.forEach(([name, id]) => {
      link.append(el('span', `color:${MUTED}`, '·'));
      const a = el('span', 'cursor:pointer', name + ' ›'); a.setAttribute('data-guide', id);
      a.onclick = ev => { ev.stopPropagation(); openTutorial(id); }; link.append(a);
    });
    return link;
  }
  // 行前检查 · 设计稿里的支付宝一行改成"Payment in China"一个板块（节点名保留 Item Alipay payment，绑定不用改）。
  // 按钮弹选择层任选其一；已验证一种后按钮变成 Add backup，直接验证另一种
  (() => {
    const row = $$('preflight', 'Item Alipay payment'); if (!row) return;
    txt(row.querySelector('[data-pencil-name="Item Title"]'), 'Payment in China');
    // 静态模式下的默认文案；接后端时 renderPreflight 用 /rules/preflight 的 payment.desc 覆盖
    txt(row.querySelector('[data-pencil-name="Item Desc"]'), 'Alipay or TenPayGo · either one is enough · ¥1 test, refunded in 24 h');
    const btn = row.querySelector('[data-pencil-name="Item Button"]'); if (btn) btn.dataset.act = 'api:paypick';
    row.appendChild(guideLinks([['Alipay', 'alipay_setup_before_flight'], ['TenPayGo', 'tenpaygo_setup_before_flight']]));
  })();

  // 验证结果页：设计稿是支付宝版本。先快照原文，再按方式和结果覆盖
  const PAY_BASE = { html: {}, how: [] };
  const PAY_NODES = ['Result Title', 'Result Sub', 'Chip Label', 'How Title', 'Fail Title', 'Fail Desc', 'Source', 'Done Label'];
  function snapPay() {
    if (PAY_BASE.done) return;
    PAY_NODES.forEach(n => { const e = $$('payment', n); PAY_BASE.html[n] = e ? e.innerHTML : ''; });
    PAY_BASE.how = $all('payment', 'How Item Title').concat($all('payment', 'How Item Desc')).map(e => e.innerHTML);
    const card = $$('payment', 'Result Card'); PAY_BASE.stroke = card ? card.style.outlineColor : '';   // 设计稿用 outline 画描边
    const ok = $$('payment', 'OK Circle'); PAY_BASE.circle = ok ? ok.style.backgroundColor : '';
    const icon = $$('payment', 'OK Icon'); PAY_BASE.iconHTML = icon ? icon.outerHTML : '';
    PAY_BASE.done = true;
  }
  snapPay();
  setPayTone(false);   // 设计稿里失败说明卡也在，默认按成功态收起
  const PAY_COPY = {
    tenpaygo: {
      'Result Title': 'Your TenPayGo works in China',
      'Result Sub': '¥1.00 charged via TenPayGo at 08:31 · Visa ••4471\nRefund issued · back on your card in 1–3 days',
      how2: ['TenPayGo is linked to that card on this phone', 'Installed is not enough. This proves the link is live.'],
      'Fail Title': "If the test fails, we read TenPayGo's error for you",
      'Fail Desc': "ISSUER_DECLINED → allow international online payments in your bank app\nAUTH_FAILED → approve your bank's 3-D Secure check\nREGION_UNAVAILABLE → retest after landing, or verify Alipay now",
      'Source': 'Tested through a Trip.com WeChat Pay code · no new permissions',
    },
  };
  // 失败原因：错误码 -> [标题, 原因, 第一步, 说明, 第二步, 说明]，填进"What we just tested"的三行
  const PAY_MEANING = {
    alipay: {
      CARD_NOT_SUPPORTED: ['Your card network is not accepted', 'Alipay accepts Visa, Mastercard, JCB, Discover, Diners Club and UnionPay. Amex and most prepaid or virtual cards fail.', 'Try another card', 'A credit card from a major bank on a different network fixes most cases.', 'Still failing', 'Open TourCard inside Alipay as a prepaid wallet, or pay cash from a Bank of China ATM.'],
      RISK_REJECT: ['Your bank blocked the charge', 'Banks often block an unfamiliar Chinese merchant on the first attempt.', 'Retry in 10 minutes', 'Turn off any VPN-like network tool first; verification calls go to your bank and time out through them.', 'Call your bank', 'Ask them to allow international online transactions and confirm 3-D Secure is on.'],
      LIMIT_EXCEEDED: ['You hit the unverified allowance', 'Alipay lets you spend a small total before it needs your passport.', 'Complete Identity Verification', 'Me > Settings > Account & Security > Identity Verification. Usually done within the hour.', 'Then retry', 'Run the ¥1 test again from the pre-flight check.'],
    },
    tenpaygo: {
      ISSUER_DECLINED: ['Your bank refused the charge', 'TenPayGo shows "The bank did not approve this transaction". The block is at your bank, not TenPayGo.', 'Allow international online payments', 'Turn it on in your bank app, or call the number on the card, then retry in a few minutes.', 'Or switch on Apple Pay', 'On iPhone, Apple Pay in TenPayGo is a separate option that uses the card already in your Wallet.'],
      AUTH_FAILED: ["Your bank's check was not completed", 'Your bank sent a 3-D Secure code or an in-app approval and it was not confirmed in time.', 'Keep your bank reachable', 'The code goes to the phone number or banking app your bank has on file.', 'Retry once, not five times', 'Repeated attempts in a short time can trigger a block.'],
      REGION_UNAVAILABLE: ['TenPayGo only charges inside mainland China', 'Its terms limit the service to the Chinese mainland, so a test from abroad can be refused even when the card is fine.', 'Keep the card linked', 'Run the ¥1 test again after you land.', 'Verify Alipay now', 'Alipay can be tested before you fly, so you leave with one method confirmed.'],
    },
  };
  const X_SVG = '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#E8890C" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function setPayTone(fail) {
    const card = $$('payment', 'Result Card'); if (card) card.style.outlineColor = fail ? '#E8890C' : PAY_BASE.stroke;
    const ok = $$('payment', 'OK Circle'); if (ok) { ok.style.backgroundColor = fail ? '#FFF4E5' : PAY_BASE.circle; const icon = ok.querySelector('[data-pencil-name="OK Icon"]'); if (icon && PAY_BASE.iconHTML) { const t = document.createElement('div'); t.innerHTML = fail ? X_SVG : PAY_BASE.iconHTML; const n = t.firstElementChild; n.setAttribute('data-pencil-name', 'OK Icon'); icon.replaceWith(n); } }
    const chip = $$('payment', 'Verified Chip'); if (chip) chip.style.backgroundColor = fail ? '#FFF4E5' : '#E6F7F0';
    const ci = $$('payment', 'Chip Icon'); if (ci) ci.style.display = fail ? 'none' : '';
    const cl = $$('payment', 'Chip Label'); if (cl) cl.style.color = fail ? '#E8890C' : '#1BA672';
    // 成功只给三个图标格；失败才展开「这个错误是什么意思」和错误码说明
    const shown = (n, on) => { const e = $$('payment', n); if (e) e.style.display = on ? 'flex' : 'none'; };
    shown('Checks Row', !fail); shown('Fail Explain Card', fail); shown('Fail Codes Card', fail);
  }
  // 失败时在结果卡片里给"改用另一种"的入口（结果页底栏是横排，放不下第二个按钮）
  const paySwitch = el('div', `display:none;margin-top:12px;font:600 13px/1.3 Inter,system-ui,sans-serif;color:${BLUE};cursor:pointer;text-align:center`);
  paySwitch.setAttribute('data-pencil-name', 'Pay Switch'); paySwitch.className = 'tap';
  (() => { const card = $$('payment', 'Result Card'); if (card) card.appendChild(paySwitch); })();
  const multiline = (n, v) => { const e = $$('payment', n); if (e) { e.textContent = v; e.style.whiteSpace = 'pre-line'; } };
  // 恢复设计稿原文（支付宝），method 为 tenpaygo 时覆盖成 TenPayGo 文案
  function applyPayCopy(method) {
    PAY_NODES.forEach(n => { const e = $$('payment', n); if (e) { e.innerHTML = PAY_BASE.html[n]; e.style.whiteSpace = ''; } });
    $all('payment', 'How Item Title').concat($all('payment', 'How Item Desc')).forEach((e, i) => { e.innerHTML = PAY_BASE.how[i]; });
    const c = PAY_COPY[method];
    if (c) {
      txt($$('payment', 'Result Title'), c['Result Title']); multiline('Result Sub', c['Result Sub']);
      txt($all('payment', 'How Item Title')[1], c.how2[0]); txt($all('payment', 'How Item Desc')[1], c.how2[1]);
      txt($$('payment', 'Fail Title'), c['Fail Title']); multiline('Fail Desc', c['Fail Desc']); txt($$('payment', 'Source'), c['Source']);
    }
    const btn = $$('payment', 'Done Button'); if (btn) btn.dataset.act = 'go:preflight';
    paySwitch.style.display = 'none';
    const checks = $all('payment', 'Check Label');
    txt(checks[1], `${PAY_NAME[method] || 'Alipay'} linked`); txt(checks[2], 'Refund works');
  }
  function renderPayOk(method, r) {
    applyPayCopy(method); setPayTone(false);
    const fate = r && r.donated ? 'Donated to China Youth Development Foundation (CYDF) · thank you' : 'Refund issued · back on your card in 1–3 days';
    if (r && r.verified_at) {
      multiline('Result Sub', `¥1.00 charged via ${PAY_NAME[method]} at ${r.verified_at.slice(11, 16)} · ${r.card}\n${fate}`);
      txt($$('payment', 'Chip Label'), 'VERIFIED · ' + r.verified_at.slice(5, 10).replace('-', '/'));
    } else if (r && r.donated) multiline('Result Sub', `¥1.00 charged via ${PAY_NAME[method]} · Visa ••4471\n${fate}`);
    // 捐赠时没有退款，"What we just tested"第三行不能再写退款路径
    if (r && r.donated) { txt($all('payment', 'Check Label')[2], 'Donated to CYDF'); txt($all('payment', 'How Item Title')[2], 'Your ¥1 went to CYDF'); txt($all('payment', 'How Item Desc')[2], 'Instead of a refund, the test payment supports young people in China.'); }
  }
  // otherVerified：另一种方式已经验证过时，不再引导去重复验证（会再扣一次 ¥1）
  function renderPayFail(method, r, otherVerified) {
    applyPayCopy(method); setPayTone(true); S.entry = r.entry_id || null;
    const other = PAY_NAME[OTHER[method]];
    txt($$('payment', 'Result Title'), 'Payment test failed');
    multiline('Result Sub', r.error_code === 'NO_CONNECTION' ? r.hint : `${PAY_NAME[method]} returned ${r.error_code}.\n${r.hint}`);
    txt($$('payment', 'Chip Label'), 'NOT VERIFIED · ' + r.error_code);
    txt($$('payment', 'How Title'), 'What this error means');
    // 客户端不认识的错误码也要换掉"What we just tested"的成功文案
    const meaning = (PAY_MEANING[method] || {})[r.error_code] || ['The test payment did not go through', r.hint || 'No money was taken.', 'Try again in a few minutes', 'Check your connection and that the card is still linked.',
      otherVerified ? `${other} is already verified` : `Or verify ${other} instead`, otherVerified ? 'You can already pay; this one is only a backup.' : 'Either one is enough to get you ready.'];
    $all('payment', 'How Item Title').forEach((e, i) => txt(e, meaning[i * 2])); $all('payment', 'How Item Desc').forEach((e, i) => txt(e, meaning[i * 2 + 1]));
    txt($$('payment', 'Done Label'), 'Try again'); const btn = $$('payment', 'Done Button'); if (btn) btn.dataset.act = 'api:payretry:' + method;
    if (otherVerified) { paySwitch.textContent = `${other} is already verified · you can pay ›`; paySwitch.dataset.act = 'go:preflight'; }
    else { paySwitch.textContent = `Use ${other} instead ›`; paySwitch.dataset.act = 'api:payretry:' + OTHER[method]; }
    paySwitch.style.display = '';
  }

  // ---------- 支付方式选择页（行前检查 Verify ¥1 / 第三步"先验证支付"进入）：选支付宝或 TenPayGo + ¥1 去向，默认捐给 CYDF ----------
  const SETUP = { method: 'alipay', donate: true, ret: null, style: null };
  // 设计稿里 Alipay 和 Donate 是选中态、另外两张是未选中态，先快照两种样式再互换
  function snapSetup() {
    if (SETUP.style) return;
    const on = $$('paysetup', 'Method Alipay'), off = $$('paysetup', 'Method TenPayGo'); if (!on || !off) return;
    const pick = e => ({ card: e.style.cssText, radio: e.querySelector('[data-pencil-name="Radio"]').outerHTML });
    SETUP.style = { on: pick(on), off: pick(off) };
  }
  function markSetup(names, chosen) {
    snapSetup(); if (!SETUP.style) return;
    names.forEach(n => {
      const e = $$('paysetup', n), r = e && e.querySelector('[data-pencil-name="Radio"]'); if (!r) return;
      const st = n === chosen ? SETUP.style.on : SETUP.style.off, t = document.createElement('div');
      e.style.cssText = st.card; t.innerHTML = st.radio; r.replaceWith(t.firstElementChild);
    });
  }
  function renderSetup() {
    markSetup(['Method Alipay', 'Method TenPayGo'], SETUP.method === 'tenpaygo' ? 'Method TenPayGo' : 'Method Alipay');
    markSetup(['Use Donate', 'Use Refund'], SETUP.donate ? 'Use Donate' : 'Use Refund');
    txt($$('paysetup', 'Confirm Label'), `Pay ¥1 with ${PAY_NAME[SETUP.method]}`);
    txt($$('paysetup', 'Foot Note'), `One-time ¥1.00 · no other charges · card details stay with ${PAY_NAME[SETUP.method]}`);
  }
  function openSetup(method, ret) { SETUP.method = PAY_NAME[method] ? method : 'alipay'; SETUP.ret = ret || null; renderSetup(); show('paysetup'); }
  // CYDF 说明：底部弹层
  const cydf = el('div', 'position:absolute;inset:0;z-index:70;display:none;flex-direction:column;justify-content:flex-end;background:rgba(18,24,38,.45)');
  cydf.setAttribute('data-pencil-name', 'CYDF Sheet');
  cydf.innerHTML = `<div style="background:#fff;border-radius:16px 16px 0 0;padding:22px 20px 30px;box-sizing:border-box;font-family:Inter,system-ui,sans-serif">
      <div style="display:flex;align-items:flex-start;gap:12px"><div style="flex:1;font:700 18px/1.3 Inter,system-ui,sans-serif;color:${INK}">China Youth Development Foundation (CYDF)</div><div data-close style="flex:none;font:400 22px/1 Inter,sans-serif;color:${MUTED};cursor:pointer;padding:2px 4px">×</div></div>
      <div style="font:400 14px/1.5 Inter,system-ui,sans-serif;color:${INK};margin-top:10px">Helping young people build capacity and improving the environment for their growth by providing aid services and giving a voice to their interests.</div>
      <div style="font:400 13px/1.5 Inter,system-ui,sans-serif;color:${MUTED};margin-top:10px">Based in Beijing, CYDF is a national public foundation registered in March 1989 and dedicated to youth development.</div>
      <div style="background:#FFF0F5;border-radius:12px;padding:12px 14px;margin-top:14px;color:#C2185B;font:400 13px/1.7 Inter,system-ui,sans-serif"><div style="font-weight:700">Our impact</div>• 500,000+ students reached<br>• 1,200 schools supported<br>• 300 community programs launched</div>
      <div style="font:400 12px/1.45 Inter,system-ui,sans-serif;color:${MUTED};margin-top:12px">Choose "Donate" and your ¥1 test goes to CYDF instead of back to your card. Trip.com passes on 100%.</div>
      <div data-close style="margin-top:14px;height:44px;border-radius:22px;background:${BLUE};color:#fff;display:flex;align-items:center;justify-content:center;font:700 15px Inter,system-ui,sans-serif;cursor:pointer">Got it</div>
    </div>`;
  (document.getElementById('phone') || document.body).appendChild(cydf);
  cydf.onclick = ev => { if (ev.target === cydf || ev.target.closest('[data-close]')) cydf.style.display = 'none'; };
  function setupAct(act) {
    if (act.startsWith('paysel:')) { SETUP.method = act.slice(7); renderSetup(); return true; }
    if (act.startsWith('payuse:')) { SETUP.donate = act.slice(7) === 'donate'; renderSetup(); return true; }
    if (act === 'cydf') { cydf.style.display = 'flex'; return true; }
    return false;
  }
  // ---------- 隐私授权页：逐项开关系统权限，同意后开始下载离线包 ----------
  const PRIV = { on: { location: true, notifications: true, camera: false, microphone: false }, sw: null, asked: false };
  const PERM_NODE = { location: 'Perm Location', notifications: 'Perm Notifications', camera: 'Perm Camera & photos', microphone: 'Perm Microphone' };
  function renderPriv() {
    if (!PRIV.sw) { const a = $$('privacy', 'Perm Location'), b = $$('privacy', 'Perm Camera & photos'); if (!a || !b) return; PRIV.sw = { on: a.querySelector('[data-pencil-name="Switch"]').outerHTML, off: b.querySelector('[data-pencil-name="Switch"]').outerHTML }; }
    Object.entries(PERM_NODE).forEach(([k, n]) => { const sw = $$('privacy', n) && $$('privacy', n).querySelector('[data-pencil-name="Switch"]'); if (!sw) return; const t = document.createElement('div'); t.innerHTML = PRIV.sw[PRIV.on[k] ? 'on' : 'off']; sw.replaceWith(t.firstElementChild); });
  }
  // 离线包（offline.js）：权限页关掉后——同意或 Not now 都算——自动下载公共指引，不需要任何权限；下载完提示去确认酒店地址
  let packTried = false;
  async function startPack() {
    const o = window.lcOffline; if (!o || packTried || o.saved() || o.busy()) return;
    packTried = true;
    try { if (await o.save()) packPrompt(); } catch (e) {}
  }
  const packTip = el('div', 'position:absolute;left:16px;right:16px;bottom:100px;z-index:60;display:none;align-items:center;gap:10px;padding:12px 14px;border-radius:14px;background:#121826;color:#fff;font:400 13px/1.35 Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer');
  packTip.innerHTML = '<div style="flex:1"><div style="font-weight:700">Offline pack saved</div><div style="opacity:.8;margin-top:2px">Confirm your hotel address so it shows offline</div></div><div style="font-weight:700;color:#8FB0FF;white-space:nowrap">Confirm ›</div>';
  (document.getElementById('phone') || document.body).appendChild(packTip);
  packTip.onclick = () => { packTip.style.display = 'none'; show('offline-hotel'); };
  function packPrompt() { packTip.style.display = 'flex'; clearTimeout(packTip._t); packTip._t = setTimeout(() => { packTip.style.display = 'none'; }, 9000); }
  function privacyAct(act) {
    if (act.startsWith('perm:')) { const k = act.slice(5); PRIV.on[k] = !PRIV.on[k]; renderPriv(); return true; }
    if (act === 'privacy') { renderPriv(); show('privacy'); return true; }
    if (act === 'consentlater') { PRIV.asked = true; show('preflight'); startPack(); return true; }
    if (act === 'consent' && !API) { PRIV.asked = true; show('preflight'); startPack(); return true; }
    return false;
  }
  // ---------- 真实地图：高德 JS API 2.0（英文标注）；路线由 backend/tools/amap_routes.py 预先从高德取好，放在 routes.json（GCJ-02） ----------
  // Web端(JS API) key 本来就会出现在前端；请在高德控制台给它设域名白名单（127.0.0.1、yuklim.github.io）
  const AMAP_JS = { key: 'de3704da02953bb4e6f7484b75f5749a', securityJsCode: '66c2eb31034482e3a0477b1f23af4224' };
  const MAPS = {};
  let ROUTES = null, AMAP = null;
  const loadRoutes = () => ROUTES || (ROUTES = fetch('routes.json').then(r => r.json()));
  const loadAMap = () => AMAP || (AMAP = new Promise((res, rej) => {
    if (window.AMap) return res(window.AMap);
    window._AMapSecurityConfig = { securityJsCode: AMAP_JS.securityJsCode };
    const sc = document.createElement('script'); sc.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_JS.key}`;
    sc.onload = () => window.AMap ? res(window.AMap) : rej(new Error('AMap')); sc.onerror = () => { AMAP = null; rej(new Error('AMap')); };
    document.head.appendChild(sc);
  }));
  // Trip.com 图床的原图是 1288×1920（约 300 KB），手机上用图床按宽度缩好的版本（800 宽约 150 KB）。
  // 图床只认部分宽度：480/540/600/640/800/960/1080
  const tripImg = (u, w = 800) => /^https:\/\/[\w-]+\.tripcdn\.com\/images\//.test(u || '') ? u.split('?')[0] + `?proc=resize/m_w,w_${w},h_10000` : u;
  window.lcTripImg = tripImg;
  // 预热：地图、图鉴照片、社区图原本点到那一屏才开始下载，演示时会卡一下。
  // 首页加载完、浏览器空闲时先把它们下好，之后进到那一屏直接显示。省流量模式和离线时不预热
  function warmUp() {
    if (!navigator.onLine || (navigator.connection && navigator.connection.saveData)) return;
    loadRoutes().catch(() => {});
    // 城市图鉴（stamp.js）复用这一个加载，不再插第二个高德脚本
    window.__lcAMapPromise = window.__lcAMapPromise || loadAMap();
    window.__lcAMapPromise.then(A => A.plugin('AMap.DistrictSearch', () => {})).catch(() => {});
    const queue = ['shanghai-dusk.jpg', 'beijing.jpg', 'chengdu.jpg', 'hangzhou.jpg', 'guangzhou.jpg', 'xian.jpg'].map(f => 'img/stamp/' + f);
    // 每条帖子：列表首图 + 详情首图 + 头像（详情后面几张图滑到时再下）
    const addPosts = () => (window.LCStamp ? window.LCStamp.samplePosts() : []).forEach(p => {
      const first = (p.images && p.images[0]) || p.image;
      if (first) queue.push(tripImg(first, 640), tripImg(first, 800));
      if (p.authorImage) queue.push(p.authorImage);
    });
    if (window.LCStamp && window.LCStamp.samplePosts().length) addPosts();
    else window.addEventListener('lc-posts-changed', function once() { window.removeEventListener('lc-posts-changed', once); addPosts(); pump(); });
    // 同时只下 3 张，不跟当前页面抢带宽
    let active = 0;
    function pump() {
      while (active < 3 && queue.length) {
        const img = new Image(); active++;
        img.referrerPolicy = 'no-referrer';
        img.onload = img.onerror = () => { active--; pump(); };
        img.src = queue.shift();
      }
    }
    pump();
  }
  window.addEventListener('load', () => (window.requestIdleCallback || setTimeout)(warmUp, { timeout: 2000 }));
  const dotHTML = (bg, ring, size = 14) => `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:3px solid ${ring};box-sizing:border-box;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`;
  const PIN = '<svg width="28" height="36" viewBox="0 0 28 36" style="display:block"><path d="M14 35s12-11.5 12-21A12 12 0 0 0 2 14c0 9.5 12 21 12 21z" fill="#2C61FE" stroke="#fff" stroke-width="2"/><circle cx="14" cy="14" r="4.5" fill="#fff"/></svg>';
  // 小工具：新建地图 / 画线 / 打点，返回覆盖物，最后 setFitView
  async function newMap(box, interactive) {
    const A = await loadAMap();
    const map = new A.Map(box, { lang: 'en', mapStyle: 'amap://styles/whitesmoke', zoom: 11, center: [121.62, 31.19], resizeEnable: true,
      dragEnable: interactive, zoomEnable: interactive, doubleClickZoom: interactive, touchZoom: interactive, scrollWheel: false, keyboardEnable: false, jogEnable: false });
    map.setLang && map.setLang('en');
    return map;
  }
  function mapLine(map, path, color, dash) {
    if (!path || path.length < 2) return null;
    const pl = new AMap.Polyline({ path, strokeColor: color, strokeWeight: dash ? 4 : 6, strokeOpacity: 1, isOutline: !dash, outlineColor: '#ffffff', borderWeight: 2,
      strokeStyle: dash ? 'dashed' : 'solid', strokeDasharray: [2, 8], lineJoin: 'round', lineCap: 'round' });
    map.add(pl); return pl;
  }
  function mapDot(map, c, html, text, dir = 'right', anchor = 'center') {
    const mk = new AMap.Marker({ position: c, content: html, anchor, zIndex: 120,
      label: text ? { content: `<div class="lc-maplabel">${text}</div>`, direction: dir, offset: new AMap.Pixel(dir === 'left' ? -6 : dir === 'right' ? 6 : 0, dir === 'bottom' ? 6 : 0) } : undefined });
    map.add(mk); return mk;
  }
  const fitMap = (map, items, pad) => map.setFitView(items.filter(Boolean), true, [pad, pad, pad, pad]);
  const mapFail = box => { box.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#EEF1F5;color:${MUTED};font:500 12px Inter,sans-serif">Map needs internet · route details below</div>`; };
  // kind: 'taxi' | 'metro'；mini：缩略图（不能拖动，点了进详情）
  async function drawMap(box, kind, mini) {
    const R = await loadRoutes(), map = await newMap(box, !mini), items = [];
    if (kind === 'metro') {
      const m = R.metro, stops = m.stops;
      items.push(mapLine(map, m.path, m.colour));
      stops.forEach((st, i) => items.push(mapDot(map, st.c, dotHTML('#fff', m.colour, 16), mini ? '' : i === 0 ? 'PVG T1&T2 station' : "Jing'an Temple", i === 0 ? 'left' : 'bottom')));
      items.push(mapLine(map, [stops[stops.length - 1].c, R.hotel.c], BLUE, true));
    } else {
      items.push(mapLine(map, R.taxi.line, BLUE));
      items.push(mapDot(map, R.taxi.queue.c, dotHTML('#1BA672', '#fff', 18), mini ? '' : 'Taxi pickup · P2', 'left'));
    }
    items.push(mapDot(map, R.hotel.c, PIN, mini ? '' : 'The PuLi', 'right', 'bottom-center'));
    fitMap(map, items, mini ? 18 : 40);
    return map;
  }
  async function mountMap(key, host, kind, mini) {
    if (!host) return;
    if (MAPS[key] && MAPS[key].kind === kind) return;
    if (MAPS[key]) { MAPS[key].map && MAPS[key].map.destroy(); MAPS[key].box.remove(); }
    const box = el('div', 'position:absolute;inset:0;z-index:0;background:#EEF1F5');
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.style.overflow = 'hidden'; host.prepend(box);
    MAPS[key] = { kind, box, map: null };
    try { MAPS[key].map = await drawMap(box, kind, mini); } catch (e) { mapFail(box); }
  }
  (() => { const css = document.createElement('style'); css.textContent = '.lc-maplabel{font:600 11px Inter,system-ui,sans-serif;color:#121826;background:#fff;border-radius:6px;padding:3px 7px;box-shadow:0 1px 4px rgba(0,0,0,.2);white-space:nowrap}.amap-marker-label{border:0 !important;background:transparent !important;padding:0 !important}.amap-logo,.amap-copyright{transform:scale(.8);transform-origin:left bottom}'; document.head.appendChild(css); })();
  // 地铁导航页：设计稿的示意地图换成真实地图（保留 Live Chip 浮在上面）
  function transitMap() {
    const host = $$('transit', 'Map'); if (!host) return;
    [...host.children].forEach(c => { const n = c.getAttribute && c.getAttribute('data-pencil-name'); if (n && n !== 'Live Chip') c.style.visibility = 'hidden'; else if (n === 'Live Chip') c.style.zIndex = 500; });
    mountMap('transit', host, 'metro', false);
  }
  // 第三步：推荐卡片里加一张路线缩略图，点了进详情
  function step3Map(kind) {
    // 地图放在推荐卡上方的 Map Box 里（设计稿留了位置和「57 min · 48 km」小标签）
    const box = $$('step3', 'Map Box'); if (!box) return;
    box.style.position = 'relative'; box.style.overflow = 'hidden';
    let wrap = box.querySelector('.lc-minimap');
    if (!wrap) { wrap = el('div', 'position:absolute;inset:0;cursor:pointer'); wrap.className = 'lc-minimap tap'; box.prepend(wrap); const chip = $$('step3', 'Map Chip'); if (chip) { chip.style.position = 'relative'; chip.style.zIndex = '2'; chip.style.pointerEvents = 'none'; } }
    wrap.dataset.act = kind === 'metro' ? 'go:transit' : 'api:route:taxi';
    mountMap('step3', wrap, kind, true);
  }
  // ---------- 所有交通方式 + 路线详情屏（数据：routes.json，由 backend/tools/amap_routes.py 从高德取） ----------
  const LINE_C = { 'Line 2': '#97D700', 'Line 7': '#ED6B00', 'Line 9': '#71C5E8', 'Line 14': '#827A04', 'Line 18': '#C09453', 'Airport Link': '#2B6CB0', Maglev: '#00A0B0' };
  const MODE_C = { walk: '#8592A6', metro: '#2C61FE', maglev: '#00A0B0', bus: '#F28C28', airport_bus: '#1F8A70', car: '#2C61FE' };
  const segC = s => LINE_C[s.name] || MODE_C[s.mode] || BLUE;
  const SVG = {
    walk: '<path d="M13 4a1.5 1.5 0 1 0 0-.01M10 21l2-6 2 2v4M9 12l1.5-4 3 1.5 2 3.5M8 21l2.5-7"/>',
    metro: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 21l-2-4M15 21l2-4M8.5 14h.01M15.5 14h.01"/>',
    maglev: '<path d="M4 15l2-8h10a4 4 0 0 1 4 4v4zM4 15h16M7 19h10M8 11h3"/>',
    bus: '<rect x="4" y="3" width="16" height="15" rx="2"/><path d="M4 11h16M8 21v-3M16 21v-3M8 15h.01M16 15h.01"/>',
    airport_bus: '<rect x="4" y="3" width="16" height="15" rx="2"/><path d="M4 11h16M8 21v-3M16 21v-3M8 15h.01M16 15h.01"/>',
    car: '<path d="M5 17h14v-4l-2-5H7l-2 5zM5 17v2M19 17v2M7.5 14h.01M16.5 14h.01"/>',
  };
  const ico = (m, c, s = 16) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none">${SVG[m] || SVG.car}</svg>`;
  const chip = s => `<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:5px;background:${segC(s)};color:#fff;font:700 11px/1.3 Inter,sans-serif;white-space:nowrap">${ico(s.mode, '#fff', 12)}${s.name.replace('Airport Bus Line 4', 'Airport Bus 4')}</span>`;
  const chain = p => p.segments.filter(s => s.mode !== 'walk').map(chip).join(`<span style="color:${MUTED};font-size:11px">›</span>`);
  const km = m => m >= 1000 ? (m / 1000).toFixed(1) + ' km' : m + ' m';

  // 路线详情屏
  const rs = document.createElement('div');
  rs.className = 'screen'; rs.dataset.route = 'route'; rs.setAttribute('data-pencil-name', 'Route Detail');
  rs.style.cssText = `background:#fff;width:393px;height:852px;position:relative;margin:0 auto;font-family:Inter,-apple-system,"PingFang SC",sans-serif;color:${INK}`;
  rs.innerHTML = `
    <div style="padding:0 16px;height:48px;display:flex;align-items:center;gap:10px;flex:none">
      <div data-act="back" style="width:32px;height:32px;border-radius:16px;background:${BG};display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></div>
      <div data-r="title" style="font:700 17px/1.2 Inter,sans-serif;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div>
    </div>
    <div class="scroll" style="padding:0 0 16px;background:${BG}">
      <div data-r="map" style="width:100%;height:260px;position:relative;flex:none"></div>
      <div style="padding:12px 16px 0;display:flex;flex-direction:column;gap:12px">
        <div data-r="stats" style="display:flex;gap:8px"></div>
        <div data-r="chain" style="display:flex;flex-wrap:wrap;align-items:center;gap:4px"></div>
        <div data-r="steps" style="background:#fff;border-radius:12px;overflow:hidden"></div>
        <div data-r="tips" style="display:flex;flex-direction:column;gap:8px"></div>
        <div data-r="src" style="font:400 11px/1.4 Inter,sans-serif;color:${MUTED};padding:0 2px"></div>
      </div>
    </div>
    <div class="pin" style="padding:10px 16px 26px;border-top:1px solid ${LINE};background:#fff"><div data-r="cta" class="tap" style="height:48px;border-radius:24px;background:${BLUE};color:#fff;font:700 16px/48px Inter,sans-serif;text-align:center;cursor:pointer"></div></div>`;
  (() => { const sb = document.querySelector('.screen[data-route="wifi"] [data-pencil-name="Status Bar"]'); if (sb) { const c = sb.cloneNode(true); c.style.flexShrink = '0'; rs.insertBefore(c, rs.firstChild); } })();
  { const all = document.querySelectorAll('#phone > .screen'); if (all.length) all[all.length - 1].after(rs); }
  if (typeof order !== 'undefined' && !order.includes('route')) order.push('route');
  const RS = k => rs.querySelector(`[data-r="${k}"]`);
  const stat = (v, l) => `<div style="flex:1;min-width:0;background:#fff;border-radius:10px;padding:10px 10px"><div style="font:700 16px/1.2 Inter,sans-serif;white-space:nowrap">${v}</div><div style="font:400 11px/1.3 Inter,sans-serif;color:${MUTED};margin-top:2px">${l}</div></div>`;
  const tipBox = (t, warn) => `<div style="display:flex;gap:8px;padding:12px;border-radius:10px;background:${warn ? '#FFF4E5' : '#EAF0FF'};color:${warn ? '#B4650A' : '#1136A6'};font:400 12px/1.45 Inter,sans-serif">${t}</div>`;
  // 时间线：每段一行，左侧彩色竖线
  const stepRow = (color, icon, title, desc, cn, last) => `<div style="display:flex;gap:12px;padding:12px 14px;${last ? '' : `border-bottom:1px solid ${LINE}`}">
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:none"><div style="width:28px;height:28px;border-radius:14px;background:${color}22;display:flex;align-items:center;justify-content:center">${ico(icon, color, 16)}</div></div>
      <div style="flex:1;min-width:0"><div style="font:600 14px/1.35 Inter,sans-serif">${title}</div>${desc ? `<div style="font:400 12px/1.45 Inter,sans-serif;color:${MUTED};margin-top:3px">${desc}</div>` : ''}${cn ? `<div style="display:inline-block;margin-top:6px;padding:3px 8px;border-radius:6px;background:${BG};font:500 12px/1.4 'Noto Sans SC',sans-serif;color:${INK}">路牌 · ${cn}</div>` : ''}</div></div>`;
  let routeMap = null;
  async function drawRoute(spec) {
    const R = await loadRoutes(), box = RS('map');
    if (routeMap) { routeMap.destroy(); routeMap = null; }
    box.innerHTML = '';
    const inner = el('div', 'position:absolute;inset:0;background:#EEF1F5'); box.appendChild(inner);
    let map; try { map = routeMap = await newMap(inner, true); } catch (e) { mapFail(box); return; }
    const items = [];
    if (spec.car) {
      items.push(mapLine(map, spec.car.line, BLUE));
      items.push(mapDot(map, spec.car.start.c, dotHTML('#1BA672', '#fff', 18), spec.car.startLabel, 'left'));
    } else {
      spec.plan.segments.forEach(s => items.push(mapLine(map, s.line, segC(s), s.mode === 'walk')));
      spec.plan.segments.filter(s => s.mode !== 'walk').forEach((s, i) => items.push(mapDot(map, s.from_c, dotHTML('#fff', segC(s), 14), i === 0 ? s.from : `Change · ${s.from}`, i === 0 ? 'left' : 'right')));
    }
    items.push(mapDot(map, R.hotel.c, PIN, 'The PuLi', 'right', 'bottom-center'));
    fitMap(map, items, 36);
  }
  async function openRoute(kind, idx) {
    const R = await loadRoutes();
    const steps = [], tips = [];
    let spec;
    if (kind === 'taxi' || kind === 'didi') {
      const c = R[kind], taxi = kind === 'taxi', fare = Math.round(c.taxi_cost * (taxi ? 1 : 0.9));
      txt(RS('title'), taxi ? 'Taxi to The PuLi' : 'DiDi to The PuLi');
      RS('stats').innerHTML = stat('≈ ¥' + fare, taxi ? 'meter, excl. tolls' : 'estimate in app') + stat(c.duration_min + ' min', 'AMap estimate') + stat(c.distance_km + ' km', 'by road');
      RS('chain').innerHTML = chip({ mode: 'car', name: taxi ? 'Taxi' : 'DiDi' });
      if (taxi) {
        steps.push(stepRow(BLUE, 'walk', 'Go to the official taxi queue', 'From T2 arrivals follow the 出租车 / Taxi signs to the taxi pickup by car park P2. Ignore anyone offering a ride inside the hall — they are unlicensed.', '出租车 · Taxi'));
        steps.push(stepRow(BLUE, 'car', 'Show the driver your address card', 'Most drivers do not read English. The card has the hotel name, address and phone in Chinese.', '璞丽酒店 · 常德路1号'));
        steps.push(stepRow(BLUE, 'car', `Ride ${c.distance_km} km · about ${c.duration_min} min`, 'Check the meter is running. Tolls are added at the end. No tip needed.'));
        steps.push(stepRow(GREEN, 'car', 'Pay and keep the receipt', 'Scan the QR code on the seat back with Alipay or TenPayGo, or pay cash. Ask for a 发票 receipt — it has the taxi number if you leave something behind.', null, true));
      } else {
        steps.push(stepRow(BLUE, 'walk', 'Walk to the ride-hailing pickup', 'Follow the 网约车 / Online car-hailing signs to the P2 pickup area.', R.didi.pickup.cn));
        steps.push(stepRow(BLUE, 'car', 'Order in Alipay › DiDi', 'Set the pickup to the numbered waiting point you are standing at. The destination is already filled in as 璞丽酒店.'));
        steps.push(stepRow(BLUE, 'car', 'Match the plate number', 'Check the plate shown in the app before you get in.'));
        steps.push(stepRow(GREEN, 'car', `Ride ${c.distance_km} km · about ${c.duration_min} min`, 'The fare is charged to Alipay automatically when you arrive.', null, true));
        tips.push(tipBox('DiDi opens inside Alipay. TenPayGo cannot book rides.', true));
      }
      RS('cta').textContent = 'Show address to driver'; RS('cta').dataset.act = 'go:driver';
      spec = { car: { line: c.line, start: taxi ? R.taxi.queue : R.didi.pickup, startLabel: taxi ? 'Taxi pickup · P2' : 'Ride-hailing pickup · P2' } };
    } else {
      const p = R.plans[idx], rides = p.segments.filter(s => s.mode !== 'walk');
      txt(RS('title'), p.label + (p.tag ? ' · ' + p.tag.toLowerCase() : ''));
      RS('stats').innerHTML = stat(p.duration_min + ' min', 'total') + stat('¥' + p.fare, 'per person') + stat(km(p.walk_m), 'walking') + stat(String(p.transfers), p.transfers === 1 ? 'change' : 'changes');
      RS('chain').innerHTML = chain(p);
      p.segments.forEach((s, i) => {
        const last = i === p.segments.length - 1;
        if (s.mode === 'walk') {
          const next = p.segments.slice(i + 1).find(x => x.mode !== 'walk');
          steps.push(stepRow(MODE_C.walk, 'walk', `Walk ${km(s.distance_m)} · ${s.duration_min} min`, next ? (i === 0 ? `From T2 arrivals to ${next.from}` : `Change to ${next.name} at ${next.from}`) : 'To The PuLi Hotel and Spa, 1 Changde Rd', null, last));
        } else {
          const what = s.mode === 'maglev' ? 'Maglev' : s.name;
          steps.push(stepRow(segC(s), s.mode, `${what} toward ${s.toward || s.to}`, `Board at ${s.from} · ${s.stops} stop${s.stops > 1 ? 's' : ''} · about ${s.duration_min} min · get off at <b>${s.to}</b>`, `${s.cn} · ${s.from_cn} → ${s.to_cn}`, last));
        }
      });
      const modes = new Set(rides.map(s => s.mode));
      if (modes.has('metro')) tips.push(tipBox('Metro: tap in with Alipay › Transport › Metro QR, or buy a single ticket at the machine (cash or Alipay).'));
      if (modes.has('bus') || modes.has('airport_bus')) tips.push(tipBox('Bus: scan the Shanghai transport QR code in Alipay at the door, or pay the exact fare in coins — drivers give no change.', true));
      if (modes.has('maglev')) tips.push(tipBox('Maglev: buy the ticket at the Maglev station counter or machine in the airport. Trains every 15–20 min.'));
      if (p.walk_m > 1500) tips.push(tipBox(`About ${km(p.walk_m)} of walking with your bags in total.`, true));
      RS('cta').textContent = 'Start in Maps'; RS('cta').dataset.act = 'toast:Demo：跳转地图 App 开始导航';
      spec = { plan: p };
    }
    RS('steps').innerHTML = steps.join(''); RS('tips').innerHTML = tips.join('');
    txt(RS('src'), R.source);
    show('route'); drawRoute(spec);
  }
  window.lcOpenRoute = openRoute;

  // 第三步：「All ways to your hotel」——车 + 全部公共交通方案，点任一行进路线详情
  async function renderWays() {
    const anchor = $$('step3', 'Pay Note') || $$('step3', 'Current Task'); if (!anchor) return;
    let R; try { R = await loadRoutes(); } catch (e) { return; }
    let box = anchor.parentElement.querySelector('.lc-otherways');
    if (!box) { box = document.createElement('details'); box.style.cssText = 'width:100%;background:#fff;border-radius:16px;overflow:hidden'; box.className = 'lc-otherways'; anchor.after(box); }
    const row = (act, icons, title, meta, tag) => `<div class="tap" data-act="${act}" style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-top:1px solid ${LINE};cursor:pointer">
        <div style="flex:1;min-width:0"><div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px">${icons}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px"><span style="font:700 15px Inter,sans-serif;color:${INK}">${title}</span>${tag ? `<span style="padding:1px 6px;border-radius:4px;background:#E6F7F0;color:#1BA672;font:700 10px/1.5 Inter,sans-serif">${tag}</span>` : ''}</div>
        <div style="font:400 12px/1.4 Inter,sans-serif;color:${MUTED};margin-top:2px">${meta}</div></div>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="${MUTED}" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>`;
    const head = t => `<div style="padding:12px 14px 6px;font:700 13px Inter,sans-serif;color:${MUTED};${t !== 'BY CAR' ? `border-top:1px solid ${LINE};margin-top:4px` : ''}">${t}</div>`;
    const t = R.taxi, d = R.didi;
    const total = R.plans.length + 2, cheapest = R.plans.slice().sort((a, b) => a.fare - b.fare)[0], maglev = R.plans.find(p => p.modes.includes('maglev'));
    const pill = (txt0, c) => `<span style="padding:3px 8px;border-radius:8px;background:${c}22;color:${c};font:700 12px Inter,sans-serif;white-space:nowrap">${txt0}</span>`;
    box.innerHTML = `<summary style="list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px;padding:14px">
        <div style="flex:1;min-width:0"><div style="font:700 15px Inter,sans-serif;color:${INK}">Other ways · ${total} options</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:7px">${cheapest ? pill(`Metro ¥${cheapest.fare}`, '#4B7A00') : ''}${pill(`DiDi ¥${Math.round(d.taxi_cost * 0.9)}`, '#B85F00')}${maglev ? pill(`Maglev ¥${maglev.fare}`, '#007986') : ''}</div></div>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="${MUTED}" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></summary>` +
      head('BY CAR') +
      row('api:route:taxi', chip({ mode: 'car', name: 'Taxi' }), `${t.duration_min} min · ≈ ¥${Math.round(t.taxi_cost)}`, `Door to door · ${t.distance_km} km · pickup at P2`, '') +
      row('api:route:didi', chip({ mode: 'car', name: 'DiDi' }), `${d.duration_min} min · ≈ ¥${Math.round(d.taxi_cost * 0.9)}`, 'Book in Alipay · pickup at P2', '') +
      head('PUBLIC TRANSPORT') +
      R.plans.map((p, i) => row('api:route:' + i, chain(p), `${p.duration_min} min · ¥${p.fare}`, `${p.label} · walk ${km(p.walk_m)}`, p.tag || '')).join('') +
      `<div style="padding:10px 14px 12px;font:400 11px/1.4 Inter,sans-serif;color:${MUTED};border-top:1px solid ${LINE}">Times for a weekday 08:00 departure · routes by AMap</div>`;
  }
  function routeAct(act) {
    if (!act.startsWith('route:')) return false;
    const k = act.slice(6); openRoute(k === 'taxi' || k === 'didi' ? k : 'plan', parseInt(k, 10)); return true;
  }
  // ---------- TripGenie 小助手（I'm stuck 和首页 Ask AI 共用）：截图或打字提问，答案来自知识库（/stuck/classify），在对话里直接给步骤 ----------
  const GENIE = {
    stuck: { hi: 'Stuck at the airport?', sub: 'Send a screenshot of the error, or tell me what went wrong. I answer from a checked guide for foreign visitors.',
      pool: [['wifi', 'Airport Wi-Fi asks for a Chinese phone number', 'connectivity_airport_wifi_sms'], ['card', "My card won't link to Alipay", 'alipay_card_bind_failed'],
        ['sim', 'eSIM installed but no internet after landing', 'connectivity_esim_not_working'], ['car', 'Where do I meet my DiDi at the airport?', 'didi_airport_pickup'],
        ['lock', "Google and WhatsApp won't load", 'connectivity_blocked_services'], ['sms', 'No SMS code from Alipay', 'alipay_sms_code_not_received'],
        ['card', 'Payment failed at the counter', 'alipay_payment_declined'], ['sim', 'Buy a SIM card at the airport', 'connectivity_buy_sim_at_airport']] },
    ask: { hi: 'Hi there!', sub: 'Ask me anything about arriving in China — payments, getting online, or getting to your hotel.',
      pool: [['route', "What's the best way from Pudong Airport to my hotel?", 'route'], ['card', 'How do I pay at a shop with Alipay?', 'alipay_how_to_pay'],
        ['sim', 'Get a China eSIM before you fly', 'connectivity_esim_before_flight'], ['card', 'Should I set up TenPayGo before I fly?', 'tenpaygo_setup_before_flight'],
        ['car', 'How do I call a DiDi from inside Alipay?', 'alipay_didi_miniprogram'], ['wifi', 'Get airport Wi-Fi with my passport', 'connectivity_airport_wifi_passport']] },
  };
  const GI = { wifi: ['#2C61FE', '<path d="M3 8a14 14 0 0 1 18 0M6 12a9 9 0 0 1 12 0M9 16a4 4 0 0 1 6 0M12 20h.01"/>'], card: ['#E8890C', '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>'],
    sim: ['#1BA672', '<path d="M7 3h7l4 4v14H7z"/><rect x="10" y="11" width="5" height="6" rx="1"/>'], car: ['#2C61FE', '<path d="M5 17h14v-4l-2-5H7l-2 5zM5 17v2M19 17v2M7.5 14h.01M16.5 14h.01"/>'],
    lock: ['#C2412D', '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'], sms: ['#E8890C', '<path d="M4 5h16v11H8l-4 4z"/>'],
    route: ['#1BA672', '<path d="M12 22s8-8 8-14a8 8 0 0 0-16 0c0 6 8 14 8 14z"/><circle cx="12" cy="8" r="3"/>'] };
  const gIco = (k, s = 20) => { const [c, p] = GI[k] || GI.wifi; return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none">${p}</svg>`; };
  const SEND = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round" style="flex:none"><path d="M21 3L3 10.5l7 2.5 2.5 7z"/><path d="M10 13l11-10"/></svg>`;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const gs = document.createElement('div');
  gs.className = 'screen'; gs.dataset.route = 'genie'; gs.setAttribute('data-pencil-name', 'TripGenie');
  gs.style.cssText = `background:#fff;width:393px;height:852px;position:relative;margin:0 auto;font-family:Inter,-apple-system,"PingFang SC",sans-serif;color:${INK}`;
  gs.innerHTML = `
    <div style="padding:0 16px;height:48px;display:flex;align-items:center;justify-content:space-between;flex:none">
      <div data-act="back" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></div>
      <div style="display:flex;align-items:center;gap:6px"><img src="img/ai-bot.png" alt="" style="width:28px;height:28px"><span style="font:800 18px Inter,sans-serif">TripGenie</span></div>
      <div style="width:32px;text-align:center;font:700 18px Inter;color:${INK};letter-spacing:1px">···</div>
    </div>
    <div class="scroll" data-g="log" style="padding:8px 16px 16px;gap:12px"></div>
    <div class="pin" style="padding:8px 0 22px;background:linear-gradient(#fff0,#F0F2F5 30%);border:0">
      <div data-g="chips" style="display:flex;gap:8px;overflow-x:auto;padding:0 16px 10px;scrollbar-width:none"></div>
      <div style="margin:0 16px;display:flex;align-items:center;gap:10px;background:#fff;border-radius:26px;padding:6px 8px 6px 14px;box-shadow:0 2px 12px rgba(18,24,38,.08)">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" style="flex:none"><circle cx="12" cy="12" r="9"/><path d="M10 9.5a3.5 3.5 0 0 1 0 5M13 7.5a6.5 6.5 0 0 1 0 9"/></svg>
        <input data-g="input" type="text" placeholder="Type or hold to speak" enterkeyhint="send" style="flex:1;min-width:0;border:0;outline:0;font:400 16px Inter,sans-serif;color:${INK};background:transparent;height:36px">
        <div data-g="send" style="width:36px;height:36px;border-radius:18px;display:flex;align-items:center;justify-content:center;cursor:pointer"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></div>
      </div>
    </div>`;
  (() => { const sb = document.querySelector('.screen[data-route="wifi"] [data-pencil-name="Status Bar"]'); if (sb) { const c = sb.cloneNode(true); c.style.flexShrink = '0'; gs.insertBefore(c, gs.firstChild); } })();
  { const all = document.querySelectorAll('#phone > .screen'); if (all.length) all[all.length - 1].after(gs); }
  if (typeof order !== 'undefined' && !order.includes('genie')) order.push('genie');
  const G = k => gs.querySelector(`[data-g="${k}"]`);
  const gpick = document.createElement('input'); gpick.type = 'file'; gpick.id = 'genie-photo'; gpick.accept = 'image/*'; gpick.hidden = true; document.body.appendChild(gpick);
  const GST = { ctx: 'stuck', page: 0, asked: new Set(), run: 0, entry: null };
  const chipBtn = (svg, label, act) => `<div class="tap" data-g-act="${act}" style="flex:none;display:flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid ${LINE};border-radius:12px;background:#fff;font:500 14px Inter,sans-serif;cursor:pointer;white-space:nowrap">${svg}${label}</div>`;
  const CAM = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>`;
  const CARD = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h10M7 14h6"/></svg>`;
  const HOTEL = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"><path d="M4 21V5h16v16M2 21h20M8 9h2m4 0h2M8 13h2m4 0h2"/></svg>`;
  G('chips').innerHTML = chipBtn(CAM, 'Recognize image', 'photo') + chipBtn(CARD, 'Show to staff', 'staff') + chipBtn(HOTEL, 'Hotel address', 'hotel') + chipBtn(GI.route ? gIco('route', 20) : '', 'Route to hotel', 'route');
  const scrollEnd = () => { const l = G('log'); requestAnimationFrame(() => { l.scrollTop = l.scrollHeight; }); };
  const add = html => { const d = document.createElement('div'); d.innerHTML = html; const n = d.firstElementChild; G('log').appendChild(n); scrollEnd(); return n; };
  const sugCard = ([ic, q, id]) => `<div class="tap" data-g-ask="${esc(id)}" data-g-q="${esc(q)}" style="display:flex;align-items:center;gap:12px;padding:14px;border:1px solid ${LINE};border-radius:12px;cursor:pointer">${gIco(ic)}<div style="flex:1;font:400 16px/1.35 Inter,sans-serif">${esc(q)}</div>${SEND}</div>`;
  function renderWelcome() {
    const c = GENIE[GST.ctx], pool = c.pool, n = 4, start = (GST.page * n) % pool.length;
    const pick = Array.from({ length: Math.min(n, pool.length) }, (_, i) => pool[(start + i) % pool.length]);
    G('log').innerHTML = `<div style="padding:8px 0 4px"><div style="font:800 28px/1.2 Inter,sans-serif">${esc(c.hi)}</div><div style="font:400 14px/1.5 Inter,sans-serif;color:${MUTED};margin-top:6px">${esc(c.sub)}</div></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px"><div style="font:800 19px Inter,sans-serif">Explore more</div><div class="tap" data-g-act="refresh" style="width:44px;height:30px;border-radius:15px;background:${BG};display:flex;align-items:center;justify-content:center;cursor:pointer"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/></svg></div></div>
      <div style="display:flex;flex-direction:column;gap:10px">${pick.map(sugCard).join('')}</div>`;
  }
  function openGenie(ctx) {
    const was = GST.ctx; GST.ctx = ctx === 'ask' ? 'ask' : 'stuck';
    if (was !== GST.ctx || !G('log').children.length || !G('log').querySelector('[data-g-msg]')) { GST.page = 0; renderWelcome(); }
    show('genie'); scrollEnd();
  }
  window.lcGenie = openGenie;
  // 对话气泡
  const userText = t => add(`<div data-g-msg style="align-self:flex-end;max-width:78%;background:#4A5160;color:#fff;border-radius:16px 16px 4px 16px;padding:10px 14px;font:400 16px/1.4 Inter,sans-serif">${esc(t)}</div>`);
  const userImg = url => add(`<div data-g-msg style="align-self:flex-end;width:140px;height:180px;border-radius:14px;background:${BG} center/cover no-repeat url('${url}');border:1px solid ${LINE}"></div>`);
  const thinking = t => add(`<div data-g-msg style="display:flex;align-items:center;gap:8px;color:${MUTED};font:400 14px Inter,sans-serif"><span class="lc-dots"><i></i><i></i><i></i></span>${esc(t)}</div>`);
  const meta = t => `<div style="font:400 12px/1.4 Inter,sans-serif;color:${MUTED};margin-top:10px">${t}</div>`;
  function followUps(list) {
    if (!list.length) return;
    add(`<div data-g-msg style="margin-top:6px"><div style="font:800 19px Inter,sans-serif;margin-bottom:10px">You may also ask</div><div style="display:flex;flex-direction:column;gap:10px">${list.map(([q, id]) => `<div class="tap" data-g-ask="${esc(id)}" data-g-q="${esc(q)}" style="display:flex;align-items:center;gap:12px;padding:14px;border:1px solid ${LINE};border-radius:12px;cursor:pointer"><div style="flex:1;font:400 16px/1.35 Inter,sans-serif">${esc(q)}</div>${SEND.replace(`stroke="${INK}"`, `stroke="${BLUE}"`)}</div>`).join('')}</div></div>`);
  }
  async function answerEntry(e, how) {
    GST.entry = e.id; GST.asked.add(e.id);
    const steps = (e.steps || []).map((s, i) => `<div style="display:flex;gap:10px;margin-top:10px"><div style="width:22px;height:22px;border-radius:11px;background:${BLUE};color:#fff;font:700 12px/22px Inter,sans-serif;text-align:center;flex:none">${i + 1}</div><div style="font:400 15px/1.45 Inter,sans-serif">${esc(s)}</div></div>`).join('');
    const n = add(`<div data-g-msg style="max-width:100%">
      <div style="font:700 11px Inter,sans-serif;letter-spacing:.06em;color:${BLUE}">${esc(how || 'FROM OUR GUIDE')} · ${esc((e.scenario || '').toUpperCase())}</div>
      <div style="font:700 18px/1.3 Inter,sans-serif;margin-top:4px">${esc(e.title)}</div>
      ${e.why ? `<div style="font:400 15px/1.5 Inter,sans-serif;color:${INK};margin-top:6px">${esc(e.why)}</div>` : ''}
      ${steps}
      ${e.fallback ? `<div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:#FFF4E5;color:#B4650A;font:400 13px/1.45 Inter,sans-serif">If that doesn't work: ${esc(e.fallback)}</div>` : ''}
      <div data-g-tut style="display:none;margin-top:12px"></div>
      <div style="display:flex;gap:8px;margin-top:12px"><div class="tap" data-g-act="solved" style="padding:9px 14px;border-radius:18px;background:#E6F7F0;color:#1BA672;font:600 13px Inter,sans-serif;cursor:pointer">✓ Solved</div><div class="tap" data-g-act="human" style="padding:9px 14px;border-radius:18px;background:${BG};color:${INK};font:600 13px Inter,sans-serif;cursor:pointer">Still stuck · chat with support</div></div>
      ${meta(`From the Landing Check guide${e.sources && e.sources[0] ? ' · ' + esc(e.sources[0].name.split('·')[0].trim()) : ''}${e.verified_at ? ' · verified ' + esc(e.verified_at) : ''}`)}
    </div>`);
    if (window.lcHasTutorial) window.lcHasTutorial(e.id).then(has => { if (!has) return; const t = n.querySelector('[data-g-tut]'); t.style.display = ''; t.innerHTML = `<div class="tap" data-g-tutorial="${esc(e.id)}" style="display:inline-flex;align-items:center;gap:6px;color:${BLUE};font:600 14px Inter,sans-serif;cursor:pointer">See it step by step with pictures ›</div>`; });
    try { const sib = (await get(`/kb/entries?scenario=${encodeURIComponent(e.scenario)}&lang=en`)).filter(x => x.id !== e.id && !GST.asked.has(x.id)).slice(0, 3); followUps(sib.map(x => [x.title, x.id])); } catch (err) {}
  }
  // 「怎么去酒店」：本地意图，用 routes.json（高德）的方案回答
  async function answerRoute() {
    let R; try { R = await loadRoutes(); } catch (e) { add(`<div data-g-msg>Route data needs internet. Open the offline pack for your hotel address card.</div>`); return; }
    const best = [['Taxi', `${R.taxi.duration_min} min · ≈ ¥${Math.round(R.taxi.taxi_cost)}`, 'api:route:taxi', 'Door to door, easiest with bags']].concat(
      R.plans.filter(p => p.tag).map(p => [p.label + ' · ' + p.tag.toLowerCase(), `${p.duration_min} min · ¥${p.fare}`, 'api:route:' + R.plans.indexOf(p), p.segments.filter(s => s.mode !== 'walk').map(s => s.name).join(' › ')]));
    add(`<div data-g-msg><div style="font:700 11px Inter,sans-serif;letter-spacing:.06em;color:${BLUE}">ROUTES · PVG T2 → THE PULI</div>
      <div style="font:400 15px/1.5 Inter,sans-serif;margin-top:6px">Here are your best options from Pudong Airport T2 to The PuLi (${R.taxi.distance_km} km). With 2 checked bags, a taxi is the easiest.</div>
      <div style="margin-top:10px;border:1px solid ${LINE};border-radius:12px;overflow:hidden">${best.map(([t, m, act, d], i) => `<div class="tap" data-act="${act}" style="display:flex;align-items:center;gap:10px;padding:12px 14px;${i ? `border-top:1px solid ${LINE};` : ''}cursor:pointer"><div style="flex:1"><div style="font:600 15px Inter,sans-serif">${esc(t)}</div><div style="font:400 12px/1.4 Inter,sans-serif;color:${MUTED};margin-top:2px">${esc(m)} · ${esc(d)}</div></div><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="${MUTED}" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>`).join('')}</div>
      <div class="tap" data-act="go:step3" style="margin-top:10px;color:${BLUE};font:600 14px Inter,sans-serif;cursor:pointer">See all ${R.plans.length + 2} ways to your hotel ›</div>
      ${meta('Routes from AMap for a weekday 08:00 departure')}</div>`);
  }
  const ROUTE_Q = /(get|go|way|route|travel)\b.*\b(hotel|city|downtown|jing.?an)|airport to|taxi|metro|subway|maglev|bus\b/i;
  async function ask(q, entryId) {
    const run = ++GST.run;
    userText(q);
    if (entryId === 'route' || (!entryId && ROUTE_Q.test(q))) { await answerRoute(); return; }
    const t = thinking('Looking it up…');
    try {
      if (entryId) { const e = await get(`/kb/entry/${entryId}?lang=en`); t.remove(); if (run === GST.run) answerEntry(e); return; }
      const fd = new FormData(); fd.append('text', q); fd.append('lang', 'en');
      const d = await withTimeout(post('/stuck/classify', fd, true), 15000); t.remove(); if (run === GST.run) answerClassify(d);
    } catch (e) { t.remove(); offlineReply(); }
  }
  function answerClassify(d) {
    if (d.decision === 'answer') return answerEntry(d.entry, d.ocr_text ? 'RECOGNIZED' : 'FROM OUR GUIDE');
    if (d.decision === 'ask' && d.candidates && d.candidates.length) {
      add(`<div data-g-msg><div style="font:400 15px/1.5 Inter,sans-serif">I think it's one of these. Tap the one that matches:</div><div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">${d.candidates.map(c => `<div class="tap" data-g-ask="${esc(c.entry_id)}" data-g-q="${esc(c.title)}" style="padding:12px 14px;border:1px solid ${LINE};border-radius:12px;font:500 15px Inter,sans-serif;cursor:pointer">${esc(c.title)}</div>`).join('')}</div></div>`);
      return;
    }
    add(`<div data-g-msg><div style="font:700 11px Inter,sans-serif;letter-spacing:.06em;color:#B4650A">NOT IN OUR GUIDE YET</div>
      <div style="font:400 15px/1.5 Inter,sans-serif;margin-top:6px">${d.advice ? esc(d.advice) : "I don't have a checked answer for this one. Show the screen to staff nearby, or chat with Trip.com support in English, 24/7."}</div>
      <div style="display:flex;gap:8px;margin-top:12px"><div class="tap" data-g-act="human" style="padding:9px 14px;border-radius:18px;background:${BLUE};color:#fff;font:600 13px Inter,sans-serif;cursor:pointer">Chat with support</div><div class="tap" data-g-act="staff" style="padding:9px 14px;border-radius:18px;background:${BG};color:${INK};font:600 13px Inter,sans-serif;cursor:pointer">Show a card to staff</div></div>
      ${meta(d.advice ? 'Generated by AI · not checked by us' : 'Landing Check guide')}</div>`);
  }
  function offlineReply() {
    add(`<div data-g-msg><div style="font:400 15px/1.5 Inter,sans-serif">I can't reach Trip.com right now. Your offline pack still works without internet:</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px"><div class="tap" data-act="go:offline-guide" style="padding:9px 14px;border-radius:18px;background:${BLUE};color:#fff;font:600 13px Inter,sans-serif;cursor:pointer">Get connected guide</div><div class="tap" data-act="go:offline-help" style="padding:9px 14px;border-radius:18px;background:${BG};color:${INK};font:600 13px Inter,sans-serif;cursor:pointer">Offline help & contacts</div></div></div>`);
  }
  gpick.onchange = async () => {
    const f = gpick.files[0]; if (!f) return;
    const run = ++GST.run;
    userImg(URL.createObjectURL(f));
    const t = thinking('Reading your screenshot…');
    try { const fd = new FormData(); fd.append('image', f); fd.append('lang', 'en'); const d = await withTimeout(post('/stuck/classify', fd, true), 20000); t.remove(); if (run === GST.run) answerClassify(d); }
    catch (e) { t.remove(); offlineReply(); }
  };
  function sendInput() { const i = G('input'), q = i.value.trim(); if (!q) { toast('Demo: hold to speak'); return; } i.value = ''; ask(q); }
  G('input').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendInput(); } });
  G('input').addEventListener('input', () => { G('send').innerHTML = G('input').value.trim() ? SEND.replace(`stroke="${INK}"`, `stroke="${BLUE}"`) : `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`; });
  G('send').onclick = sendInput;
  gs.addEventListener('click', async ev => {
    const a = ev.target.closest('[data-g-ask],[data-g-act],[data-g-tutorial]'); if (!a) return;
    ev.stopPropagation();
    if (a.dataset.gTutorial) { window.lcTutorial(a.dataset.gTutorial); return; }
    if (a.dataset.gAsk) { ask(a.dataset.gQ, a.dataset.gAsk); return; }
    const act = a.dataset.gAct;
    if (act === 'refresh') { GST.page++; renderWelcome(); }
    else if (act === 'photo') { gpick.value = ''; gpick.click(); }
    else if (act === 'staff') show('offline-cards');
    else if (act === 'hotel') show('offline-hotel');
    else if (act === 'route') ask("What's the best way from Pudong Airport to my hotel?", 'route');
    else if (act === 'solved') { a.textContent = '✓ Glad it worked'; if (GST.entry) { try { await post('/kb/feedback', { entry_id: GST.entry, solved: true }); } catch (e) {} } }
    else if (act === 'human') toast('Demo: opens Trip.com English support with this chat attached');
  });
  (() => { const css = document.createElement('style'); css.textContent = '[data-route="genie"] .scroll{display:flex;flex-direction:column}.lc-dots{display:inline-flex;gap:3px}.lc-dots i{width:6px;height:6px;border-radius:3px;background:#8592A6;animation:lcdot 1s infinite}.lc-dots i:nth-child(2){animation-delay:.15s}.lc-dots i:nth-child(3){animation-delay:.3s}@keyframes lcdot{0%,80%,100%{opacity:.3}40%{opacity:1}}[data-g="chips"]::-webkit-scrollbar{display:none}'; document.head.appendChild(css); })();
  function genieAct(act) {
    if (act === 'stuck' || act === 'genie:stuck') { openGenie('stuck'); return true; }
    if (act === 'genie:ask') { openGenie('ask'); return true; }
    return false;
  }
  // 静态模式：不调接口，直接显示对应方式的成功页
  function staticPay(m) { renderPayOk(m, { donated: SETUP.donate }); show('payment'); }
  window.lcPayStatic = act => {
    if (setupAct(act) || privacyAct(act) || routeAct(act) || genieAct(act)) return true;
    if (act === 'pay') { staticPay('alipay'); return true; }
    if (act === 'paypick') { openSetup('alipay'); return true; }
    if (act === 'payconfirm') { staticPay(SETUP.method); return true; }
    if (act.startsWith('payretry:')) { staticPay(act.slice(9)); return true; }
    if (act === 'pay2') { openSetup('alipay', 'step3'); return true; }
    return false;
  };
  const menuList = document.getElementById('list');
  // 重置演示数据：后端 mock 状态 + 本机 IndexedDB（集章、社区帖、离线酒店卡/联系人/引导进度）+ 已下载的离线包，然后回首页重载。
  // 静态模式也要有；不走 post()，否则在分享 / 社区 / 离线页会被 localOnly() 拦下
  async function resetDemo() {
    toast('正在重置…');
    const jobs = [];
    if (API) jobs.push(fetch(API + '/mock/reset', { method: 'POST', headers: VH }).then(ok));
    if (window.LCOfflineDB) jobs.push(window.LCOfflineDB.clear());
    if (window.caches) jobs.push(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('lc-offline-')).map(k => caches.delete(k)))));
    const failed = (await Promise.allSettled(jobs)).filter(r => r.status === 'rejected');
    Object.assign(S, S0());
    toast(failed.length ? (API && failed.length === 1 ? '本机已重置（后端不可达）' : '部分数据没清掉，请关闭其他标签页后重试') : '已重置');
    setTimeout(() => { history.replaceState(null, '', location.pathname + location.search); location.reload(); }, 500);
  }
  if (menuList) {
    const sep = document.createElement('div'); sep.style.cssText = 'border-top:1px solid #DADFE6;margin:4px 0'; menuList.appendChild(sep);
    const rb = document.createElement('button'); rb.textContent = '🔄 重置演示数据'; rb.onclick = resetDemo; menuList.appendChild(rb);
    loadTutorials().then(list => list.forEach(t => { const b = document.createElement('button'); b.textContent = '📖 ' + t.title; b.onclick = () => openTutorial(t.id); menuList.appendChild(b); }));
  }

  // ---------- Community · Explore（探索/社区）：英文 Trip.com Moments 帖（first-stamp.json，经 stamp.js 载入）；载入前骨架屏，绝不白屏 ----------
  (function () {
    const cs = document.createElement('div');
    cs.className = 'screen'; cs.dataset.route = 'explore'; cs.setAttribute('data-pencil-name', 'Explore');
    cs.style.cssText = `background:#fff;width:393px;height:852px;position:relative;margin:0 auto;display:flex;flex-direction:column;font-family:Inter,-apple-system,"PingFang SC",sans-serif;color:${INK}`;
    const SR = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>`;
    const GIFT = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4"/><path d="M5 12v9h14v-9M12 8v13M12 8S10.5 3 8 3a2 2 0 0 0 0 5zM12 8s1.5-5 4-5a2 2 0 0 1 0 5z"/></svg>`;
    cs.innerHTML = `
      <div style="padding:8px 16px 6px;display:flex;align-items:center;justify-content:space-between;flex:none">
        <div style="display:flex;align-items:center;gap:6px"><span style="font:800 26px Inter,sans-serif">Community</span><span style="font-size:20px">🐱</span><span style="width:8px;height:8px;border-radius:4px;background:#F5B400"></span></div>
        <div style="display:flex;align-items:center;gap:16px">${SR}${GIFT}</div>
      </div>
      <div style="display:flex;border-bottom:1px solid ${LINE};flex:none">
        <div data-c-tab="explore" style="flex:1;text-align:center;padding:8px 0 0;cursor:pointer"><div style="font:700 18px Inter,sans-serif;color:${INK}">Explore</div><div style="height:3px;width:64px;margin:9px auto 0;border-radius:2px;background:${INK}"></div></div>
        <div data-c-tab="circles" style="flex:1;text-align:center;padding:8px 0 0;cursor:pointer"><div style="font:500 18px Inter,sans-serif;color:${MUTED}">Circles</div><div style="height:3px;width:64px;margin:9px auto 0"></div></div>
      </div>
      <div class="scroll" data-c="feed" style="flex:1;overflow-y:auto;background:#fff"></div>`;
    (() => { const sb = document.querySelector('.screen[data-route="wifi"] [data-pencil-name="Status Bar"]'); if (sb) { const c = sb.cloneNode(true); c.style.flexShrink = '0'; cs.insertBefore(c, cs.firstChild); } })();
    (() => {
      const tb = document.querySelector('.screen .pin [data-pencil-name="Tab Bar"]') || document.querySelector('[data-pencil-name="Tab Bar"]');
      if (!tb) return;
      const pin = el('div', 'flex:none'); pin.className = 'pin'; const c = tb.cloneNode(true); pin.appendChild(c); cs.appendChild(pin);
      // 克隆来的 Tab Bar 原本是首页那份，Home 仍高亮；先把每个 tab 复位成未选中灰，再单独点亮 Community，避免 Home+Community 一起亮
      const INACT = '#8A8F99';
      // 设计稿导出的图标是填充形状：只改原本的填充 / 描边颜色，不给整个 svg 加描边（否则线条会变粗）
      const tint = (tab, c) => { tab.querySelectorAll('svg [fill]:not([fill="none"])').forEach(p => p.setAttribute('fill', c)); tab.querySelectorAll('svg [stroke]:not([stroke="none"])').forEach(p => p.setAttribute('stroke', c)); };
      ['Tab Home', 'Tab Messages', 'Tab Community', 'Tab My Trips', 'Tab Sign In'].forEach(nm => {
        const t = c.querySelector(`[data-pencil-name="${nm}"]`); if (!t) return;
        tint(t, INACT);
        const l = t.querySelector('[data-pencil-name="Tab Label"]'); if (l) l.style.color = INACT;
      });
      const cc = c.querySelector('[data-pencil-name="Tab Community"]');
      if (cc) { tint(cc, BLUE); const l = cc.querySelector('[data-pencil-name="Tab Label"]'); if (l) l.style.color = BLUE; }
      [['Tab Home', 'home'], ['Tab My Trips', 'trips']].forEach(([nm, rt]) => { const t = c.querySelector(`[data-pencil-name="${nm}"]`); if (t) { t.style.cursor = 'pointer'; t.onclick = () => show(rt); } });
    })();
    { const all = document.querySelectorAll('#phone > .screen'); if (all.length) all[all.length - 1].after(cs); else (document.getElementById('phone') || document.body).appendChild(cs); }
    if (typeof order !== 'undefined' && !order.includes('explore')) order.push('explore');

    const CF = cs.querySelector('[data-c="feed"]');
    // 上：我发的帖子（stamp.js 本地帖，带票根）；下：英文 Trip.com Moments 帖
    CF.innerHTML = '<div data-c="mine"></div><div data-c="list"></div>';
    const MINE = CF.querySelector('[data-c="mine"]'), LIST = CF.querySelector('[data-c="list"]');
    (() => { const st = document.createElement('style'); st.textContent = '.lc-swipe{scrollbar-width:none;-webkit-overflow-scrolling:touch}.lc-swipe::-webkit-scrollbar{display:none}.lc-posted{margin:12px 16px 0;padding:10px 14px;border-radius:12px;background:#E9F8F1;color:#11865A;font:600 13px Inter,sans-serif}.lc-hl{animation:lcHl 2.4s ease}@keyframes lcHl{0%{background:#EAF0FF}100%{background:#fff}}'; document.head.appendChild(st); })();
    const sk = () => Array.from({ length: 2 }).map(() => `<div style="padding:16px 0"><div style="display:flex;align-items:center;gap:10px;padding:0 16px"><div style="width:40px;height:40px;border-radius:20px;background:${BG}"></div><div style="width:120px;height:14px;border-radius:7px;background:${BG}"></div></div><div style="margin:12px 16px 0;height:260px;border-radius:12px;background:${BG}"></div><div style="margin:12px 16px 0;height:18px;border-radius:9px;background:${BG};width:80%"></div><div style="margin:8px 16px 0;height:14px;border-radius:7px;background:${BG};width:55%"></div></div>`).join('');
    const HEART = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="${MUTED}" stroke-width="2" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.6 8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/></svg>`;
    const CMT = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="${MUTED}" stroke-width="2" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
    function card(d) {
      const imgs = (d.images && d.images.length ? d.images : [d.cover]).filter(Boolean).slice(0, 3).map(u => tripImg(u, 640));
      const media = imgs.map(u => `<div style="flex:none;width:322px;height:300px;border-radius:12px;scroll-snap-align:start;background:#eee center/cover no-repeat url('${esc(u)}')"></div>`).join('');
      const av = d.avatar ? `background:#eee center/cover no-repeat url('${esc(d.avatar)}')` : 'background:#F5B400';
      return `<div style="padding:16px 0">
        <div style="display:flex;align-items:center;gap:10px;padding:0 16px"><div style="width:40px;height:40px;border-radius:20px;${av};background-size:cover"></div><div style="font:700 15px Inter,sans-serif">${esc(d.author || 'Traveler')}</div>${d.publishTime ? `<div style="font:400 14px Inter,sans-serif;color:${MUTED}">· ${esc(d.publishTime)}</div>` : ''}</div>
        <div class="lc-swipe" style="display:flex;gap:6px;padding:12px 16px 0;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-left:16px">${media}</div>
        <div style="padding:12px 16px 0;font:700 20px/1.3 Inter,sans-serif">${esc(d.title || '')}</div>
        <div style="display:flex;align-items:center;gap:18px;padding:10px 16px 0;color:${MUTED};font:400 14px Inter,sans-serif"><span style="display:inline-flex;align-items:center;gap:5px">${HEART}${esc(String(d.likes || 0))}</span><span style="display:inline-flex;align-items:center;gap:5px">${CMT}${esc(String(d.comments || 0))}</span></div>
      </div><div style="height:8px;background:${BG}"></div>`;
    }
    // 内容流 = stamp.js 载入的英文 Trip.com Moments 帖（first-stamp.json），点进去是帖子详情（多图轮播 + 评论）
    const fmtTime = ms => { const t = new Date(Number(ms)); return isNaN(t) ? '' : t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
    function renderList() {
      const api = window.LCStamp, items = api ? api.samplePosts() : [];
      if (!items.length) { LIST.innerHTML = sk(); return; }   // stamp.js 还在载入配置，载完会发 lc-posts-changed
      LIST.innerHTML = items.map(p => `<div data-post-id="${esc(p.id)}" style="cursor:pointer">${card({ author: p.author, publishTime: fmtTime(p.publishTime), title: p.title, likes: p.likeCount || p.likes, comments: p.commentCount || p.comments, images: p.images, cover: p.image, avatar: p.authorImage })}</div>`).join('');
      LIST.querySelectorAll('[data-post-id]').forEach(n => n.onclick = () => api.openPost(n.dataset.postId));
    }
    const loadCommunity = renderList;
    // 我发的帖子（share / 完成页 / 图鉴一键发出），置顶；刚发的那条高亮并给提示
    const YOU = `<div style="width:40px;height:40px;border-radius:20px;background:${BLUE};display:flex;align-items:center;justify-content:center;flex:none"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></div>`;
    const when = iso => { const t = new Date(iso); if (isNaN(t)) return ''; return Date.now() - t < 120000 ? 'Just now' : t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
    function renderMine() {
      const api = window.LCStamp, mine = api ? api.myPosts() : [], just = window.__lcJustPosted;
      if (!mine.length) { MINE.innerHTML = ''; return; }
      const banner = just && just.fresh ? '<div class="lc-posted">✓ Posted to Community · only visible on this device</div>' : '';
      // 正文开头就是标题时只显示剩下的部分，避免重复
      const rest = p => { const b = (p.body || '').trim(), t = (p.title || '').trim(); return t && b.startsWith(t) ? b.slice(t.length).replace(/^[.!?。！？\s]+/, '') : b; };
      MINE.innerHTML = banner + mine.map(p => `<div class="${just && just.id === p.id ? 'lc-hl' : ''}" data-mine="${esc(p.id)}" style="padding:16px 0;cursor:pointer">
          <div style="display:flex;align-items:center;gap:10px;padding:0 16px">${YOU}<div style="font:700 15px Inter,sans-serif">You</div><div style="font:400 14px Inter,sans-serif;color:${MUTED}">· ${esc(when(p.savedAt))}</div><span style="margin-left:auto;font:600 11px Inter,sans-serif;color:${BLUE};background:#EAF0FF;border-radius:10px;padding:3px 8px">On this device</span></div>
          <div style="padding:12px 16px 0"><canvas data-post="${esc(p.id)}" width="1080" height="1350" style="display:block;width:240px;height:300px;border-radius:12px;background:${BG}"></canvas></div>
          <div style="padding:12px 16px 0;font:700 20px/1.3 Inter,sans-serif">${esc(p.title || '')}</div>
          ${rest(p) ? `<div style="padding:6px 16px 0;font:400 14px/1.5 Inter,sans-serif;color:#4A5160;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(rest(p))}</div>` : ''}
          <div style="display:flex;align-items:center;gap:18px;padding:10px 16px 0;color:${MUTED};font:400 14px Inter,sans-serif"><span style="display:inline-flex;align-items:center;gap:5px">${HEART}0</span><span style="display:inline-flex;align-items:center;gap:5px">${CMT}0</span></div>
        </div><div style="height:8px;background:${BG}"></div>`).join('');
      MINE.querySelectorAll('canvas[data-post]').forEach(cv => api.drawPost(cv, cv.dataset.post).catch(() => {}));
      MINE.querySelectorAll('[data-mine]').forEach(n => n.onclick = () => api.openPost(n.dataset.mine));
      if (just) CF.scrollTop = 0;
    }
    window.lcExplore = () => { show('explore'); loadCommunity(); renderMine(); };
    cs.querySelectorAll('[data-c-tab]').forEach(t => t.onclick = () => { if (t.dataset.cTab === 'circles') toast('Demo: Circles'); });
    // 本屏经底部 Community tab（#explore）到达；离开时清掉「刚发帖」标记
    window.addEventListener('lc-posts-changed', () => { renderMine(); renderList(); });
    window.addEventListener('hashchange', () => { if ((location.hash.slice(1) || '') === 'explore') { loadCommunity(); renderMine(); } else window.__lcJustPosted = null; });
    if ((location.hash.slice(1) || '') === 'explore') loadCommunity();
  })();

  // ---------- 共用：新建一个自带屏（状态栏克隆 + 顶部条 + 可滚内容），返回 {screen, body} ----------
  function lcMakeScreen(route, name, topHTML) {
    const cs = document.createElement('div');
    cs.className = 'screen'; cs.dataset.route = route; cs.setAttribute('data-pencil-name', name);
    cs.style.cssText = `background:${BG};width:393px;height:852px;position:relative;margin:0 auto;display:flex;flex-direction:column;font-family:Inter,-apple-system,"PingFang SC",sans-serif;color:${INK}`;
    cs.innerHTML = `<div data-lc="top" style="background:#fff;flex:none">${topHTML}</div><div class="scroll" data-lc="body" style="flex:1;overflow-y:auto;background:${BG}"></div>`;
    const sb = document.querySelector('.screen[data-route="wifi"] [data-pencil-name="Status Bar"]');
    if (sb) { const c = sb.cloneNode(true); c.style.flexShrink = '0'; cs.insertBefore(c, cs.firstChild); }
    { const all = document.querySelectorAll('#phone > .screen'); if (all.length) all[all.length - 1].after(cs); else (document.getElementById('phone') || document.body).appendChild(cs); }
    if (typeof order !== 'undefined' && !order.includes(route)) order.push(route);
    return { screen: cs, body: cs.querySelector('[data-lc="body"]') };
  }
  const LC_BACK = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>`;
  const LC_SRCH = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>`;
  // 本地日期 yyyy-MM-dd（按本地时区，不走 toISOString 以免差一天）
  const lcDate = n => { const d = new Date(Date.now() + (n || 0) * 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  // 单选/可切换筛选 chip 组：items=[{t,...}]，isOn(o) 决定高亮，onPick(o) 处理点击；点击后重渲染高亮
  function lcChips(box, items, isOn, onPick) {
    const render = () => {
      box.innerHTML = items.map((o, i) => `<div class="lc-chip${isOn(o) ? ' on' : ''}" data-i="${i}">${o.t}</div>`).join('');
      box.querySelectorAll('.lc-chip').forEach(c => c.onclick = () => { onPick(items[+c.dataset.i]); render(); });
    };
    render();
    return render;
  }
  (() => {
    const css = document.createElement('style');
    css.textContent = `.lc-srch input{font:600 14px Inter,sans-serif;border:0;outline:0;background:transparent;color:${INK};min-width:0;width:100%}`
      + `.lc-srch input[type=date]{font:500 12px Inter,sans-serif;color:${INK};width:auto;max-width:118px}`
      + `.lc-chip{flex:none;padding:7px 12px;border-radius:16px;font:600 13px Inter,sans-serif;border:1px solid ${LINE};color:${INK};background:#fff;cursor:pointer;white-space:nowrap}`
      + `.lc-chip.on{border-color:${BLUE};color:${BLUE};background:rgba(44,97,254,.06)}`
      + `.lc-row{display:flex;gap:8px;padding:0 14px 10px;overflow-x:auto}.lc-row::-webkit-scrollbar{display:none}`;
    document.head.appendChild(css);
  })();

  // 共享查询状态：入口页写、结果页读（酒店 HQ / 租车 CQ）
  const HQ = { city: '上海', checkIn: lcDate(0), checkOut: lcDate(1), stars: '', sortType: '1' };
  const CQ = { city: '上海', pick: lcDate(1), ret: lcDate(3), group: '' };
  const LC_MON = { '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' };
  const lcMd = s => { const p = (s || '').split('-'); return p.length === 3 ? LC_MON[p[1]] + ' ' + (+p[2]) : (s || ''); };
  const lcRange = (a, b) => lcMd(a) + ' - ' + lcMd(b);

  // ---------- 酒店结果页（照 Trip.com 真机截图）：真实数据来自官方 query_hotel（后端 /content/hotels?lang=en，名称 / 区域 / 卖点译成英文）----------
  // 顶部：日期 + 「5 Stars, Shanghai」查询条、Map / More；下面 Sort / Filters / Location / Diamond rating，后两个就地展开选项
  const CITY_CN = { shanghai: '上海', beijing: '北京', chengdu: '成都', guangzhou: '广州', hangzhou: '杭州', "xi'an": '西安', xian: '西安', shenzhen: '深圳' };
  const CITY_EN = { 上海: 'Shanghai', 北京: 'Beijing', 成都: 'Chengdu', 广州: 'Guangzhou', 杭州: 'Hangzhou', 西安: "Xi'an", 深圳: 'Shenzhen' };
  const AREAS = [{ t: 'Any area', v: '' }, { t: 'The Bund', v: '外滩' }, { t: 'Lujiazui', v: '陆家嘴' }, { t: 'Hongqiao', v: '虹桥' }, { t: "Jing'an Temple", v: '静安寺' }];
  const lcWeek = s => { const d = new Date(s + 'T00:00:00'); return isNaN(d) ? s : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); };
  const lcNights = (a, b) => Math.max(1, Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5) || 1);
  HQ.landmark = '';
  (function () {
    const PIN = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.5"/></svg>`;
    const HEART = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.6 8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/></svg>`;
    const ICO = {
      sort: '<path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/>',
      filter: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
      loc: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
    };
    const ic = (k, c = INK) => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none">${ICO[k]}</svg>`;
    const css = document.createElement('style');
    css.textContent = `.lc-hchip{flex:none;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:8px;border:1px solid ${LINE};background:#fff;font:500 14px Inter,sans-serif;color:${INK};cursor:pointer;white-space:nowrap}
      .lc-hchip.on{border-color:${BLUE};color:${BLUE};background:#EEF3FF}
      .lc-hopt{flex:none;padding:6px 12px;border-radius:16px;border:1px solid ${LINE};font:500 13px Inter,sans-serif;color:${INK};background:#fff;cursor:pointer;white-space:nowrap}
      .lc-hopt.on{border-color:${BLUE};color:${BLUE};background:#EEF3FF}
      .lc-hcard{display:flex;gap:12px;padding:16px;background:#fff;border-bottom:8px solid ${BG};cursor:pointer}
      .lc-hdia{color:#F5B400;font-size:12px;letter-spacing:1px;white-space:nowrap}`;
    document.head.appendChild(css);
    const top = `
      <div style="padding:8px 12px 10px;display:flex;align-items:center;gap:10px">
        <div class="tap" data-lc-back style="flex:none">${LC_BACK}</div>
        <div class="tap" data-lc-pill style="flex:1;min-width:0;display:flex;align-items:center;gap:10px;border:1px solid ${LINE};border-radius:8px;padding:6px 10px;cursor:pointer">
          <div style="flex:none;font:500 12px/1.25 Inter,sans-serif;color:${INK}"><div data-lc-d1></div><div data-lc-d2></div></div>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="${INK}" stroke-width="2" style="flex:none"><path d="M6 9l6 6 6-6"/></svg>
          <span style="width:1px;height:24px;background:${LINE};flex:none"></span>
          <span data-lc-where style="font:500 15px Inter,sans-serif;color:${INK};white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></span>
        </div>
        <div class="tap" data-lc-map style="flex:none;text-align:center;font:500 11px Inter,sans-serif;color:${INK};cursor:pointer">${PIN}<div>Map</div></div>
        <div class="tap" data-lc-more style="flex:none;text-align:center;font:500 11px Inter,sans-serif;color:${INK};cursor:pointer"><div style="font:700 18px/18px Inter,sans-serif">···</div><div>More</div></div>
      </div>
      <div class="lc-row" data-lc-chips style="padding:0 12px 10px"></div>
      <div class="lc-row" data-lc-opts style="padding:0 12px 10px;display:none"></div>`;
    const { screen: cs, body: HB } = lcMakeScreen('hotels', 'Hotels', top);
    cs.style.background = '#fff';
    cs.querySelector('[data-lc-back]').onclick = () => back();
    cs.querySelector('[data-lc-pill]').onclick = () => show('hotels-search');
    cs.querySelector('[data-lc-map]').onclick = () => toast('Map view · demo');
    cs.querySelector('[data-lc-more]').onclick = () => toast('More · demo');
    const where = () => [HQ.stars ? HQ.stars + ' Stars' : '', (AREAS.find(a => a.v === HQ.landmark) || {}).v ? AREAS.find(a => a.v === HQ.landmark).t : '', CITY_EN[HQ.city] || HQ.city].filter(Boolean).join(', ');
    function syncTop() {
      cs.querySelector('[data-lc-d1]').textContent = lcMd(HQ.checkIn); cs.querySelector('[data-lc-d2]').textContent = lcMd(HQ.checkOut);
      cs.querySelector('[data-lc-where]').textContent = where();
    }
    let open = '';
    const chipsBox = cs.querySelector('[data-lc-chips]'), optsBox = cs.querySelector('[data-lc-opts]');
    function renderChips() {
      chipsBox.innerHTML = [
        ['sort', `${ic('sort', HQ.sortType === '2' ? BLUE : INK)}${HQ.sortType === '2' ? 'Lowest price' : 'Sort'}`, HQ.sortType === '2'],
        ['filters', `${ic('filter')}Filters`, false],
        ['loc', `${ic('loc', HQ.landmark ? BLUE : INK)}${HQ.landmark ? (AREAS.find(a => a.v === HQ.landmark) || {}).t : 'Location'}`, !!HQ.landmark || open === 'loc'],
        ['dia', HQ.stars ? `${HQ.stars} diamonds` : 'Diamond rating', !!HQ.stars || open === 'dia'],
      ].map(([k, h, on]) => `<div class="lc-hchip${on ? ' on' : ''}" data-k="${k}">${h}</div>`).join('');
      chipsBox.querySelectorAll('[data-k]').forEach(c => c.onclick = () => {
        const k = c.dataset.k;
        if (k === 'sort') { HQ.sortType = HQ.sortType === '2' ? '1' : '2'; open = ''; load(); }
        else if (k === 'filters') show('hotels-search');
        else { open = open === k ? '' : k; renderOpts(); }
        renderChips();
      });
    }
    function renderOpts() {
      const list = open === 'loc' ? AREAS.map(a => ({ t: a.t, on: HQ.landmark === a.v, set: () => { HQ.landmark = a.v; } }))
        : open === 'dia' ? [['', 'Any'], ['3', '3 diamonds'], ['4', '4 diamonds'], ['5', '5 diamonds']].map(([v, t]) => ({ t, on: HQ.stars === v, set: () => { HQ.stars = v; } })) : [];
      optsBox.style.display = list.length ? 'flex' : 'none';
      optsBox.innerHTML = list.map((o, i) => `<div class="lc-hopt${o.on ? ' on' : ''}" data-i="${i}">${esc(o.t)}</div>`).join('');
      optsBox.querySelectorAll('[data-i]').forEach(c => c.onclick = () => { list[+c.dataset.i].set(); open = ''; renderOpts(); renderChips(); load(); });
    }
    const k = n => Number(n || 0).toLocaleString('en-US');
    const rate = s10 => s10 >= 9.6 ? 'Excellent' : s10 >= 9 ? 'Outstanding' : s10 >= 8 ? 'Very Good' : 'Good';
    function card(d) {
      const img = d.cover ? `background:#E9EDF2 center/cover no-repeat url('${esc(d.cover)}')` : `background:${BG}`;
      const s10 = d.score != null ? Math.min(10, d.score * 2) : null;
      const name = d.name_en || d.name || '';
      const feats = (d.features_en && d.features_en.length ? d.features_en : (d.tags || [])).slice(0, 2)
        .map(t => `<div style="font:400 14px/1.35 Inter,sans-serif;color:#00848A;margin-top:4px">${esc(t)}</div>`).join('');
      const area = d.area_en || [d.district, d.zone].filter(Boolean).join(' · ');
      const price = d.price ? `<span style="font:700 13px Inter,sans-serif;color:${BLUE}">¥</span><span style="font:700 22px Inter,sans-serif;color:${BLUE}">${k(Math.round(d.price))}</span>` : `<span style="font:600 14px Inter,sans-serif;color:${BLUE}">Check rates</span>`;
      return `<div class="lc-hcard tap" data-lc-url="${esc(d.url || '')}">
        <div style="width:118px;align-self:stretch;min-height:200px;border-radius:8px;${img};flex:none;position:relative"><div style="position:absolute;top:8px;right:8px">${HEART}</div></div>
        <div style="flex:1;min-width:0">
          <div style="font:700 17px/1.3 Inter,sans-serif;color:${INK}">${esc(name)} <span class="lc-hdia">${'◆'.repeat(Math.min(+d.star || 0, 5))}</span></div>
          ${s10 != null ? `<div style="display:flex;align-items:center;gap:6px;margin-top:6px;flex-wrap:wrap"><span style="background:${BLUE};color:#fff;border-radius:6px;padding:1px 6px;font:700 14px Inter,sans-serif">${s10.toFixed(1)}<span style="font-weight:400;font-size:11px">/10</span></span><span style="font:600 15px Inter,sans-serif;color:${BLUE}">${rate(s10)}</span><span style="font:400 14px Inter,sans-serif;color:${INK}">${k(d.comments)} reviews</span></div>` : ''}
          ${area ? `<div style="font:400 14px/1.35 Inter,sans-serif;color:${INK};margin-top:6px">${esc(area)}</div>` : ''}
          ${feats}
          ${d.favorites ? `<div style="font:400 14px Inter,sans-serif;color:${INK};margin-top:4px">Saved by ${k(d.favorites)} people</div>` : ''}
          <div style="text-align:right;margin-top:10px">${price}</div>
          <div style="text-align:right;font:400 12px Inter,sans-serif;color:${MUTED};margin-top:2px">per night · taxes not included</div>
        </div>
      </div>`;
    }
    const sk = () => Array.from({ length: 3 }).map(() => `<div class="lc-hcard"><div style="width:118px;height:200px;border-radius:8px;background:${BG};flex:none"></div><div style="flex:1"><div style="height:18px;width:80%;background:${BG};border-radius:4px"></div><div style="height:14px;width:50%;background:${BG};border-radius:4px;margin-top:12px"></div><div style="height:14px;width:70%;background:${BG};border-radius:4px;margin-top:10px"></div></div></div>`).join('');
    const MOCK = [
      { name_en: 'Novotel Shanghai Hongqiao', star: 5, score: 4.7, comments: 6826, area_en: 'Minhang · Hongqiao Hub', features_en: ['Indoor pool'], favorites: 23445, price: 533 },
      { name_en: 'Holiday Inn Shanghai Hongqiao by IHG', star: 5, score: 4.8, comments: 7957, area_en: 'Minhang · Qibao', features_en: ['Indoor pool'], favorites: 18989, price: 463 },
    ];
    let seq = 0;
    async function load(retry) {
      const my = ++seq;
      syncTop();
      if (!retry) HB.innerHTML = sk();
      const p = new URLSearchParams({ city: HQ.city || '上海', sortType: HQ.sortType, size: '12', lang: 'en' });
      if (HQ.stars) p.set('stars', HQ.stars);
      if (HQ.landmark) p.set('landmark', HQ.landmark);
      if (HQ.checkIn) p.set('checkIn', HQ.checkIn);
      if (HQ.checkOut) p.set('checkOut', HQ.checkOut);
      let data = null;
      try { data = await withTimeout(get('/content/hotels?' + p.toString(), true), 25000); } catch (e) {}
      if (my !== seq) return;                                   // 用户已经换了筛选，丢掉旧结果
      const real = data && data.items && data.items.length;
      if (!real && retry) return;                               // 后台重试也没拿到：保留当前示例数据
      const items = real ? data.items : MOCK;
      HB.innerHTML = `<div style="padding:12px 16px 8px;font:500 14px Inter,sans-serif;color:${INK}">${items.length} properties found</div>` + items.map(card).join('');
      HB.querySelectorAll('[data-lc-url]').forEach(c => c.onclick = () => { const u = c.dataset.lcUrl; if (u) window.open(u, '_blank'); else toast('Demo'); });
      status(real ? `酒店·真实数据 ${items.length} 家` : '酒店·示例数据(接口兜底)', real ? 'rgba(27,166,114,.85)' : 'rgba(232,137,12,.9)');
      if (!real && !retry) setTimeout(() => { if (my === seq) load(true); }, 4000);   // 冷启动超时：过几秒后台再取一次，取到就换成真实数据
    }
    renderChips();
    let opened = false;
    window.lcHotels = force => { show('hotels'); open = ''; renderOpts(); renderChips(); if (force || !opened) { opened = true; load(); } };
    window.addEventListener('hashchange', () => { if ((location.hash.slice(1) || '') === 'hotels' && !opened) { opened = true; load(); } });
    if ((location.hash.slice(1) || '') === 'hotels') { opened = true; load(); }
  })();

  // ---------- 酒店入口页（照 Trip.com「Hotels & Homes」真机截图）：大图头 + 搜索卡（目的地 / 日期 / 房间 / 快捷筛选）+ 常用入口 + 推荐区域 ----------
  (function () {
    const ICON = {
      search: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>`,
      cal: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`,
      user: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
      moon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="#7B4CF0"><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/></svg>`,
    };
    const QUICK = [['Saved', '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.6 8.8-8.6a5.5 5.5 0 0 0 0-7.8z" fill="#2C61FE"/>'],
      ['Bookings', '<rect x="5" y="4" width="14" height="17" rx="2" fill="#2C61FE"/><path d="M9 10h6M9 14h6" stroke="#fff" stroke-width="2"/>'],
      ['My offers', '<path d="M3 12l9-9h8v8l-9 9z" fill="#2C61FE"/><circle cx="16" cy="8" r="1.8" fill="#fff"/>'],
      ['Price Alerts', '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" fill="#2C61FE"/><path d="M10 20a2 2 0 0 0 4 0" stroke="#2C61FE" stroke-width="2" fill="none"/>']];
    const IDEAS = [{ t: 'Stay near The Bund', img: 'img/a8ab4034b36b.jpg', v: '外滩' }, { t: 'Stay in Lujiazui', img: 'img/add897514b84.jpg', v: '陆家嘴' }];
    const top = `<div style="display:none"></div>`;
    const { screen: cs, body: B } = lcMakeScreen('hotels-search', 'Hotels Search', top);
    const sb = cs.querySelector('[data-pencil-name="Status Bar"]');
    B.style.background = '#fff';
    B.innerHTML = `
      <div style="position:relative;height:290px;background:#1d2a44 center/cover no-repeat url('img/ea229737645d.jpg')">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.05) 45%,rgba(0,0,0,.35))"></div>
        <div style="position:absolute;left:16px;right:16px;top:58px;display:flex;align-items:center;gap:10px">
          <div class="tap" data-lc-back style="width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,.35);display:grid;place-items:center;cursor:pointer"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg></div>
          <span style="flex:1"></span>
          <span style="width:30px;height:30px;border-radius:50%;background:#F5B400;color:#fff;display:grid;place-items:center;font:700 14px Inter,sans-serif">T</span>
          <div class="tap" data-lc-more style="width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,.35);display:grid;place-items:center;color:#fff;font:700 16px Inter,sans-serif;cursor:pointer">···</div>
        </div>
        <div style="position:absolute;left:16px;bottom:58px;font:800 30px Inter,sans-serif;color:#fff">Hotels &amp; Homes<span style="color:#F5B400">.</span></div>
      </div>
      <div style="margin:-44px 14px 0;position:relative;background:#fff;border-radius:12px;padding:2px 14px 14px;box-shadow:0 6px 24px rgba(0,0,0,.10)">
        <div style="display:flex;align-items:center;gap:12px;padding:16px 0;border-bottom:1px solid ${LINE}">${ICON.search}<input data-lc-dest value="Shanghai" placeholder="Enter a destination or property" style="flex:1;min-width:0;border:0;outline:0;font:500 18px Inter,sans-serif;color:${INK};background:transparent"></div>
        <div style="display:flex;align-items:flex-start;gap:12px;padding:16px 0;border-bottom:1px solid ${LINE};position:relative">${ICON.cal}
          <div style="flex:1"><div style="font:500 18px Inter,sans-serif;color:${INK}"><span class="tap" data-lc-pick="in" style="cursor:pointer" data-lc-din></span> - <span class="tap" data-lc-pick="out" style="cursor:pointer" data-lc-dout></span></div></div>
          <span style="display:flex;align-items:center;gap:4px;font:500 13px Inter,sans-serif;color:#7B4CF0;margin-top:3px">${ICON.moon}<span data-lc-nights></span></span>
          <input type="date" data-lc-in style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;left:40px;bottom:0">
          <input type="date" data-lc-out style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;left:200px;bottom:0">
        </div>
        <div style="display:flex;align-items:center;gap:12px;padding:16px 0;border-bottom:1px solid ${LINE};font:400 16px Inter,sans-serif;color:${INK}">${ICON.user}<span><b style="font-size:18px;font-weight:600">1</b> room&nbsp; <b style="font-size:18px;font-weight:600">2</b> adults&nbsp; <b style="font-size:18px;font-weight:600">0</b> children</span></div>
        <div class="lc-row" data-lc-qf style="padding:14px 0 0"></div>
        <div class="tap" data-lc-go style="margin-top:14px;background:${BLUE};color:#fff;border-radius:8px;padding:14px;text-align:center;font:600 18px Inter,sans-serif;cursor:pointer">Search</div>
      </div>
      <div style="display:flex;justify-content:space-around;padding:22px 8px 6px">${QUICK.map(([t, p]) => `<div class="tap" data-lc-quick style="text-align:center;cursor:pointer"><div style="width:56px;height:56px;border-radius:50%;background:#EEF3FF;display:grid;place-items:center;margin:0 auto"><svg viewBox="0 0 24 24" width="28" height="28">${p}</svg></div><div style="font:400 13px Inter,sans-serif;color:${INK};margin-top:6px">${t}</div></div>`).join('')}</div>
      <div style="padding:22px 16px 12px;font:700 22px Inter,sans-serif;color:${INK}" data-lc-think></div>
      <div style="display:flex;gap:12px;padding:0 16px 28px">${IDEAS.map((d, i) => `<div class="tap" data-lc-idea="${i}" style="flex:1;height:190px;border-radius:12px;background:#1d2a44 center/cover no-repeat url('${d.img}');position:relative;overflow:hidden;cursor:pointer"><div style="position:absolute;inset:auto 0 0 0;padding:28px 12px 12px;background:linear-gradient(transparent,rgba(0,0,0,.6));font:700 16px/1.25 Inter,sans-serif;color:#fff">${d.t}</div></div>`).join('')}</div>`;
    // 状态栏叠在大图上（沉浸式），按钮行放在它下面；状态栏不接点击，免得挡住返回键
    if (sb) { sb.style.position = 'absolute'; sb.style.zIndex = '2'; sb.style.width = '100%'; sb.style.pointerEvents = 'none'; sb.querySelectorAll('*').forEach(n => { if (n.style.color) n.style.color = '#fff'; }); }
    cs.querySelector('[data-lc="top"]').style.display = 'none';
    const $ = sel => cs.querySelector(sel);
    $('[data-lc-back]').onclick = () => back();
    $('[data-lc-more]').onclick = () => toast('More · demo');
    cs.querySelectorAll('[data-lc-quick]').forEach(n => n.onclick = () => toast('Demo'));
    const inEl = $('[data-lc-in]'), outEl = $('[data-lc-out]'), dest = $('[data-lc-dest]');
    inEl.value = HQ.checkIn; outEl.value = HQ.checkOut;
    function syncDates() {
      if (outEl.value <= inEl.value) { const d = new Date(inEl.value + 'T00:00:00'); d.setDate(d.getDate() + 1); outEl.value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
      $('[data-lc-din]').textContent = lcWeek(inEl.value); $('[data-lc-dout]').textContent = lcWeek(outEl.value);
      const n = lcNights(inEl.value, outEl.value); $('[data-lc-nights]').textContent = n + (n === 1 ? ' night' : ' nights');
    }
    [inEl, outEl].forEach(i => i.addEventListener('change', syncDates));
    cs.querySelectorAll('[data-lc-pick]').forEach(s => s.onclick = () => { const i = s.dataset.lcPick === 'in' ? inEl : outEl; try { i.showPicker(); } catch (e) { i.focus(); i.click(); } });
    // 快捷筛选：都是真实查询参数（星级 / 低价优先），不是摆设
    const qf = [{ t: '5 diamonds', on: () => HQ.stars === '5', set: () => { HQ.stars = HQ.stars === '5' ? '' : '5'; } },
      { t: '4 diamonds', on: () => HQ.stars === '4', set: () => { HQ.stars = HQ.stars === '4' ? '' : '4'; } },
      { t: 'Lowest price', on: () => HQ.sortType === '2', set: () => { HQ.sortType = HQ.sortType === '2' ? '1' : '2'; } }];
    const renderQf = () => { $('[data-lc-qf]').innerHTML = qf.map((o, i) => `<div class="lc-hopt${o.on() ? ' on' : ''}" data-i="${i}" style="border-radius:6px;background:${o.on() ? '#EEF3FF' : '#F5F6F8'};border-color:${o.on() ? BLUE : 'transparent'}">${o.t}</div>`).join(''); $('[data-lc-qf]').querySelectorAll('[data-i]').forEach(c => c.onclick = () => { qf[+c.dataset.i].set(); renderQf(); }); };
    const cityCn = () => { const v = (dest.value || '').trim(); return CITY_CN[v.toLowerCase()] || v || '上海'; };
    const syncThink = () => { $('[data-lc-think]').textContent = `Thinking about ${CITY_EN[cityCn()] || dest.value || 'Shanghai'}?`; };
    dest.addEventListener('input', syncThink);
    function go(landmark) {
      HQ.city = cityCn(); HQ.landmark = landmark || '';
      HQ.checkIn = inEl.value; HQ.checkOut = outEl.value;
      window.lcHotels(true);
    }
    dest.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    $('[data-lc-go]').onclick = () => go();
    cs.querySelectorAll('[data-lc-idea]').forEach(n => n.onclick = () => go(IDEAS[+n.dataset.lcIdea].v));
    syncDates(); renderQf(); syncThink();
    window.lcHotelsSearch = () => { renderQf(); show('hotels-search'); };
  })();

  // ---------- 景点门票页（照 Trip.com「Attractions & Tours」真机截图）：真实数据来自官方 query_ticket（后端 /content/tickets，英文名 / 推荐语 / 榜单）----------
  // 上：Explore Shanghai 大图头 + 搜索卡；中：按官方主题标签分类、Must-see 前三；下：排序 + 列表。点卡片进 Trip.com 预订页。
  const lcK = n => { n = Number(n || 0); return n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e4 ? Math.round(n / 1e3) + 'k' : n.toLocaleString('en-US'); };
  const lcOpen = u => { if (u) window.open(u, '_blank'); else toast('Demo'); };
  (function () {
    const CATS = [['必打卡', 'Top picks', '👍'], ['城市亲子', 'Family fun', '🎡'], ['特色体验', 'Experiences', '🎭'], ['园林', 'Gardens', '🏯'],
      ['玩水避暑', 'Water fun', '🌊'], ['城市赏秋', 'Autumn views', '🍁'], ['城市赏花踏青', 'Blossoms', '🌸'], ['城市温泉', 'Hot springs', '♨️']];
    const SORTS = [[1, 'Recommended'], [3, 'Lowest price'], [4, 'Top rated']];
    const AQ = { tag: '必打卡', sort: 1, q: '' };
    const { screen: cs, body: B } = lcMakeScreen('attractions', 'Attractions', '<div style="display:none"></div>');
    cs.style.background = '#E3F6EC';
    cs.querySelector('[data-lc="top"]').style.display = 'none';
    B.style.background = '#fff';
    B.innerHTML = `
      <div style="position:relative;height:200px;background:linear-gradient(180deg,#E3F6EC,#F4FBF7)">
        <div style="position:absolute;right:0;top:0;width:58%;height:170px;background:#cfd8e3 center/cover no-repeat url('img/a8ab4034b36b.jpg');border-bottom-left-radius:10px"></div>
        <div class="tap" data-lc-back style="position:absolute;left:12px;top:14px;width:38px;height:38px;border-radius:50%;background:rgba(20,26,40,.75);display:grid;place-items:center;cursor:pointer"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg></div>
        <div style="position:absolute;left:62px;top:16px;font:800 18px Inter,sans-serif;color:${BLUE}">Trip<span style="color:#F5B400">.</span>com</div>
        <div style="position:absolute;left:62px;top:42px;font:700 28px/1.12 Inter,sans-serif;color:${INK};text-shadow:0 1px 8px rgba(255,255,255,.7)">Explore<br>Shanghai</div>
      </div>
      <div style="margin:-50px 14px 0;position:relative;background:#fff;border-radius:16px;padding:12px 14px;box-shadow:0 6px 24px rgba(0,0,0,.08)">
        <div style="display:flex;align-items:center;gap:10px;padding-bottom:12px;border-bottom:1px solid ${LINE}">
          <input data-a-q placeholder="Discover places and things to do" style="flex:1;min-width:0;border:0;outline:0;font:400 16px Inter,sans-serif;color:${INK};background:transparent">
          <div class="tap" data-a-go style="flex:none;background:${BLUE};color:#fff;border-radius:20px;padding:9px 16px;font:600 15px Inter,sans-serif;cursor:pointer">Search</div>
        </div>
        <div data-a-loc style="display:flex;align-items:center;gap:8px;margin-top:12px;padding:12px;border-radius:10px;background:#F7F8FA;font:400 15px Inter,sans-serif;color:${INK}">Your current location is <b style="color:${BLUE};text-decoration:underline">Shanghai</b><span class="tap" data-a-x style="margin-left:auto;cursor:pointer;color:${MUTED}">✕</span></div>
      </div>
      <div data-a-cats style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px 4px;padding:20px 10px 6px"></div>
      <div style="margin:16px 14px 0;background:#EEF3FF;border-radius:16px;padding:14px 0 14px 14px">
        <div style="font:700 18px Inter,sans-serif;color:${INK};margin-bottom:10px">Must-see ›</div>
        <div data-a-must class="lc-swipe" style="display:flex;gap:10px;overflow-x:auto;padding-right:14px"></div>
      </div>
      <div data-a-sorts class="lc-row" style="padding:18px 14px 6px"></div>
      <div data-a-list></div>`;
    const $ = s => cs.querySelector(s);
    $('[data-lc-back]').onclick = () => back();
    $('[data-a-x]').onclick = () => { $('[data-a-loc]').style.display = 'none'; };
    $('[data-a-cats]').innerHTML = CATS.map(([v, t, e]) => `<div class="tap" data-a-cat="${v}" style="text-align:center;cursor:pointer"><div style="width:54px;height:54px;margin:0 auto;border-radius:16px;display:grid;place-items:center;font-size:30px">${e}</div><div style="font:400 13px/1.25 Inter,sans-serif;color:${INK};margin-top:4px">${t}</div></div>`).join('');
    const syncCats = () => cs.querySelectorAll('[data-a-cat]').forEach(c => { const on = c.dataset.aCat === AQ.tag; c.firstElementChild.style.background = on ? '#EEF3FF' : ''; c.firstElementChild.style.outline = on ? `2px solid ${BLUE}` : ''; });
    cs.querySelectorAll('[data-a-cat]').forEach(c => c.onclick = () => { AQ.tag = c.dataset.aCat; syncCats(); load(); });
    const renderSorts = () => { $('[data-a-sorts]').innerHTML = SORTS.map(([v, t]) => `<div class="lc-hopt${AQ.sort === v ? ' on' : ''}" data-v="${v}" style="border-radius:6px">${t}${AQ.sort === v ? ' ▾' : ''}</div>`).join(''); $('[data-a-sorts]').querySelectorAll('[data-v]').forEach(c => c.onclick = () => { AQ.sort = +c.dataset.v; renderSorts(); load(); }); };
    const filterQ = items => { const q = AQ.q.trim().toLowerCase(); return q ? items.filter(t => ((t.name_en || '') + ' ' + t.name + ' ' + (t.area_en || '')).toLowerCase().includes(q)) : items; };
    const price = t => t.price_from ? `<span style="font:400 13px Inter,sans-serif;color:${INK}">From </span><span style="font:700 13px Inter,sans-serif;color:${BLUE}">¥</span><span style="font:700 24px Inter,sans-serif;color:${BLUE}">${Math.round(t.price_from)}</span>` : (t.free ? `<span style="font:700 16px Inter,sans-serif;color:${GREEN}">Free entry</span>` : '');
    function row(t, i) {
      const hot = i === 0 ? 'Trending now' : i < 3 ? 'Selling fast' : '';
      const tags = (t.tags_en || []).map(x => `<span style="background:#F3F4F6;color:#3A3F4A;font:400 13px Inter,sans-serif;padding:2px 7px;border-radius:3px">${esc(x)}</span>`).join(' ');
      return `<div class="tap" data-url="${esc(t.url)}" style="display:flex;gap:12px;padding:16px 14px;border-bottom:1px solid ${LINE};cursor:pointer">
        <div style="width:122px;align-self:stretch;min-height:190px;border-radius:10px;background:#E9EDF2 center/cover no-repeat url('${esc(t.cover)}');flex:none;position:relative"><svg viewBox="0 0 24 24" width="22" height="22" fill="rgba(0,0,0,.25)" stroke="#fff" stroke-width="2" style="position:absolute;top:8px;right:8px"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.6 8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/></svg></div>
        <div style="flex:1;min-width:0">
          ${hot ? `<span style="display:inline-block;background:#D93025;color:#fff;font:500 12px Inter,sans-serif;padding:2px 6px;border-radius:2px">${hot}</span>` : ''}
          <div style="font:700 18px/1.25 Inter,sans-serif;color:${INK};margin-top:4px">${esc(t.name_en || t.name)}</div>
          <div style="margin-top:4px;font:400 14px Inter,sans-serif;color:${INK}"><b style="color:${BLUE};font-size:17px">${t.score || '–'}</b><span style="color:${BLUE}">/5</span> ${lcK(t.comments)} reviews</div>
          ${t.rank_en ? `<div style="margin-top:4px;font:600 13px/1.3 Inter,sans-serif;color:#8A5A00">🏅 ${esc(t.rank_en)}</div>` : ''}
          ${t.recommend_en ? `<div style="margin-top:4px;font:400 13px/1.35 Inter,sans-serif;color:${MUTED}">${esc(t.recommend_en)}</div>` : ''}
          ${tags ? `<div style="margin-top:6px;line-height:1.9">${tags}</div>` : ''}
          <div style="margin-top:4px;font:400 14px Inter,sans-serif;color:${INK}">Shanghai${t.area_en ? ' · ' + esc(t.area_en) : ''}</div>
          <div style="text-align:right;margin-top:8px">${price(t)}</div>
        </div></div>`;
    }
    const sk = () => Array.from({ length: 3 }).map(() => `<div style="display:flex;gap:12px;padding:16px 14px"><div class="lc-sk" style="width:122px;height:190px;border-radius:10px"></div><div style="flex:1"><div class="lc-sk" style="height:18px;border-radius:4px;width:80%"></div><div class="lc-sk" style="height:14px;border-radius:4px;width:50%;margin-top:12px"></div></div></div>`).join('');
    let items = [], seq = 0;
    function render() {
      const list = filterQ(items);
      $('[data-a-list]').innerHTML = list.length ? list.map(row).join('') : `<div style="padding:30px 16px;text-align:center;color:${MUTED};font:400 14px Inter,sans-serif">No matching attractions. Try another category.</div>`;
      $('[data-a-list]').querySelectorAll('[data-url]').forEach(n => n.onclick = () => lcOpen(n.dataset.url));
    }
    async function load(retry) {
      const my = ++seq;
      if (!retry) { $('[data-a-list]').innerHTML = sk(); $('[data-a-must]').innerHTML = '<div class="lc-sk" style="flex:none;width:150px;height:110px;border-radius:12px"></div>'.repeat(3); }
      let d = null;
      try { d = await withTimeout(get(`/content/tickets?tag=${encodeURIComponent(AQ.tag)}&sortType=${AQ.sort}&size=12`, true), 30000); } catch (e) {}
      if (my !== seq) return;
      if (!(d && d.items && d.items.length)) {
        if (!retry) { $('[data-a-list]').innerHTML = `<div style="padding:30px 16px;text-align:center;color:${MUTED};font:400 14px Inter,sans-serif">Live attraction prices are loading…</div>`; setTimeout(() => { if (my === seq) load(true); }, 4000); }
        status('景点·接口暂不可用', 'rgba(232,137,12,.9)'); return;
      }
      items = d.items.filter(t => t.cover);
      $('[data-a-must]').innerHTML = items.slice(0, 3).map((t, i) => `<div class="tap" data-url="${esc(t.url)}" style="flex:none;width:150px;height:110px;border-radius:12px;background:#ccd center/cover no-repeat url('${esc(t.cover)}');position:relative;overflow:hidden;cursor:pointer">
        <span style="position:absolute;left:8px;top:6px;background:#F5B400;color:#fff;font:800 13px Inter,sans-serif;border-radius:4px;padding:1px 6px">${i + 1}</span>
        <div style="position:absolute;inset:auto 0 0 0;padding:20px 8px 7px;background:linear-gradient(transparent,rgba(0,0,0,.65));color:#fff;font:600 14px/1.2 Inter,sans-serif">${esc(t.name_en || t.name)}</div></div>`).join('');
      $('[data-a-must]').querySelectorAll('[data-url]').forEach(n => n.onclick = () => lcOpen(n.dataset.url));
      render();
      status(`景点·真实数据 ${items.length} 个`, 'rgba(27,166,114,.85)');
    }
    const q = $('[data-a-q]');
    $('[data-a-go]').onclick = () => { AQ.q = q.value; render(); };
    q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); AQ.q = q.value; render(); } });
    q.addEventListener('input', () => { if (!q.value) { AQ.q = ''; render(); } });
    syncCats(); renderSorts();
    let opened = false;
    const open = () => { if (!opened) { opened = true; load(); } };
    window.lcAttractions = () => { show('attractions'); open(); };
    window.addEventListener('hashchange', () => { if (location.hash.slice(1) === 'attractions') open(); });
    if (location.hash.slice(1) === 'attractions') open();
  })();

  // ---------- 旅行指南页（照 Trip.com「Travel Guides」真机截图）：Must-sees（query_ticket）+ Dive into Shanghai / More Discoveries（query_content 旅游笔记，英文标题 / 摘要）----------
  // 笔记点开走社区详情页（LCStamp.openGuide：英文标题 / 摘要 + 中文原文）；景点点开 Trip.com 预订页
  (function () {
    const DIVE = [['First Look', { scenarios: '第一次去' }], ['Things to Do', { keyword: '必玩' }], ['Must Eat', { keyword: '美食' }], ['Getting Around', { keyword: '交通' }]];
    const MORE = [['All', { keyword: '攻略' }], ['Essential guide', { scenarios: '第一次去' }], ['Where to stay', { keyword: '住宿' }], ['What to do', { keyword: '必玩' }]];
    const { screen: cs, body: B } = lcMakeScreen('guides', 'Travel Guides', `
      <div style="padding:8px 12px 10px;display:flex;align-items:center;gap:10px">
        <div class="tap" data-lc-back style="flex:none;cursor:pointer">${LC_BACK}</div>
        <div style="flex:1;display:flex;align-items:center;gap:8px;border:1px solid ${LINE};border-radius:8px;padding:9px 12px;font:500 16px Inter,sans-serif;color:${INK}"><img src="img/ai-bot.png" alt="" style="width:22px;height:22px">Shanghai</div>
        <div class="tap" data-g-map style="flex:none;cursor:pointer"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"><path d="M12 21s6-5.4 6-11a6 6 0 0 0-12 0c0 5.6 6 11 6 11z"/><circle cx="12" cy="10" r="2.2"/><path d="M4 21h16"/></svg></div>
      </div>`);
    B.style.background = '#fff'; cs.style.background = '#fff';
    B.innerHTML = `
      <div style="padding:10px 16px 0;display:flex;align-items:baseline;gap:10px"><span style="font:800 30px Inter,sans-serif;color:${INK}">Shanghai</span><span style="font:400 17px Inter,sans-serif;color:${MUTED}">China</span></div>
      <div class="lc-row" style="padding:14px 16px 4px">${[['🏨 Hotels', 'go:hotels-search'], ['🎡 Attractions', 'go:attractions'], ['📶 SIM cards', 'go:esim'], ['👥 Community', 'go:explore']].map(([t, a]) => `<div class="lc-hchip tap" data-act="${a}">${t}</div>`).join('')}</div>
      <div style="padding:20px 16px 10px;font:700 22px Inter,sans-serif;color:${INK}">Must-sees</div>
      <div data-g-must class="lc-swipe" style="display:flex;gap:10px;overflow-x:auto;padding:0 16px"></div>
      <div style="padding:26px 16px 10px;font:700 22px Inter,sans-serif;color:${INK}">Dive into Shanghai</div>
      <div style="margin:0 16px;border-radius:12px;overflow:hidden;position:relative;height:250px;background:#1d2a44">
        <div data-g-dive-img style="position:absolute;inset:0;background:center/cover no-repeat"></div>
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.25),rgba(0,0,0,0) 40%,rgba(0,0,0,.7))"></div>
        <div data-g-dive-tabs class="lc-row" style="position:absolute;left:0;right:0;top:12px;padding:0 12px"></div>
        <div class="tap" data-g-dive-txt style="position:absolute;left:14px;right:14px;bottom:14px;color:#fff;cursor:pointer"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px 16px 0">${[['🧭 Local Guides', 'go:explore'], ['🗺️ Plan Your Trip', 'go:preflight'], ['📍 Nearby Places', 'go:attractions'], ['🏨 Where to Stay', 'go:hotels-search']].map(([t, a]) => `<div class="tap" data-act="${a}" style="background:#F5F6F8;border-radius:10px;padding:14px 12px;font:600 15px Inter,sans-serif;color:${INK};cursor:pointer">${t}</div>`).join('')}</div>
      <div style="padding:26px 16px 0;font:700 22px Inter,sans-serif;color:${INK}">More Discoveries</div>
      <div data-g-more-tabs style="display:flex;gap:22px;padding:12px 16px 0;border-bottom:1px solid ${LINE};overflow-x:auto"></div>
      <div data-g-more style="display:flex;gap:10px;padding:14px 16px 24px;background:#F7F8FA;align-items:flex-start"></div>`;
    const $ = s => cs.querySelector(s);
    $('[data-lc-back]').onclick = () => back();
    $('[data-g-map]').onclick = () => toast('Map view · demo');
    const qs = o => new URLSearchParams({ size: '8', ...o }).toString();
    const guides = o => withTimeout(get('/content/guides?' + qs(o), true), 40000).then(d => (d.items || []).filter(g => g.cover || (g.images || []).length));
    const openGuide = g => { if (window.LCStamp && LCStamp.openGuide) LCStamp.openGuide(g); };
    const cover = g => g.cover || (g.images || [])[0] || '';
    // Must-sees：门票榜单前 5
    withTimeout(get('/content/tickets?size=8', true), 30000).then(d => {
      const its = (d.items || []).filter(t => t.cover).slice(0, 5); if (!its.length) throw 0;
      $('[data-g-must]').innerHTML = its.map(t => `<div class="tap" data-url="${esc(t.url)}" style="flex:none;width:160px;height:130px;border-radius:10px;background:#ccd center/cover no-repeat url('${esc(t.cover)}');position:relative;overflow:hidden;cursor:pointer"><div style="position:absolute;inset:auto 0 0 0;padding:24px 10px 8px;background:linear-gradient(transparent,rgba(0,0,0,.7));color:#fff;font:600 15px/1.2 Inter,sans-serif">${esc(t.name_en || t.name)}</div></div>`).join('');
      $('[data-g-must]').querySelectorAll('[data-url]').forEach(n => n.onclick = () => lcOpen(n.dataset.url));
    }).catch(() => { $('[data-g-must]').innerHTML = `<div style="color:${MUTED};font:400 13px Inter,sans-serif">Must-sees are loading…</div>`; });
    // Dive into Shanghai：四个话题，各取第一篇笔记做大图
    let dive = 0;
    function renderDiveTabs() {
      $('[data-g-dive-tabs]').innerHTML = DIVE.map(([t], i) => `<div class="tap" data-i="${i}" style="flex:none;padding:8px 14px;border-radius:6px;font:500 15px Inter,sans-serif;cursor:pointer;color:#fff;background:${i === dive ? 'rgba(0,0,0,.75)' : 'rgba(255,255,255,.18)'};border:1px solid ${i === dive ? '#fff' : 'transparent'}">${t}</div>`).join('');
      $('[data-g-dive-tabs]').querySelectorAll('[data-i]').forEach(c => c.onclick = () => { dive = +c.dataset.i; renderDiveTabs(); loadDive(); });
    }
    async function loadDive(retry) {
      const my = dive; $('[data-g-dive-txt]').innerHTML = '<div style="font:500 14px Inter,sans-serif;opacity:.8">Loading…</div>';
      let list = []; try { list = await guides(DIVE[my][1]); } catch (e) {}
      if (my !== dive) return;
      const g = list[0]; if (!g) { if (!retry) setTimeout(() => { if (my === dive) loadDive(true); }, 6000); return; }   // 官方接口限频时稍后再取一次
      $('[data-g-dive-img]').style.backgroundImage = `url('${cover(g)}')`;
      $('[data-g-dive-txt]').innerHTML = `<div style="font:700 19px/1.25 Inter,sans-serif">${esc(g.title_en || g.title)}</div>${g.summary_en ? `<div style="font:400 13px/1.35 Inter,sans-serif;opacity:.9;margin-top:4px">${esc(g.summary_en)}</div>` : ''}`;
      $('[data-g-dive-txt]').onclick = () => openGuide(g);
    }
    // More Discoveries：两列瀑布流
    let more = 0;
    function renderMoreTabs() {
      $('[data-g-more-tabs]').innerHTML = MORE.map(([t], i) => `<div class="tap" data-i="${i}" style="flex:none;padding-bottom:10px;font:${i === more ? 700 : 400} 16px Inter,sans-serif;color:${INK};border-bottom:3px solid ${i === more ? INK : 'transparent'};cursor:pointer;white-space:nowrap">${t}</div>`).join('');
      $('[data-g-more-tabs]').querySelectorAll('[data-i]').forEach(c => c.onclick = () => { more = +c.dataset.i; renderMoreTabs(); loadMore(); });
    }
    async function loadMore(retry) {
      const my = more, box = $('[data-g-more]');
      if (!retry) box.innerHTML = [0, 1].map(() => `<div style="flex:1;display:flex;flex-direction:column;gap:10px"><div class="lc-sk" style="height:220px;border-radius:12px"></div><div class="lc-sk" style="height:160px;border-radius:12px"></div></div>`).join('');
      let list = []; try { list = await guides(MORE[my][1]); } catch (e) {}
      if (my !== more) return;
      if (!list.length) { box.innerHTML = `<div style="flex:1;text-align:center;color:${MUTED};font:400 14px Inter,sans-serif;padding:20px 0">Guides are loading…</div>`; if (!retry) setTimeout(() => { if (my === more) loadMore(true); }, 6000); return; }
      const card = (g, i) => `<div class="tap" data-g="${i}" style="background:#fff;border-radius:12px;overflow:hidden;cursor:pointer">
        <div style="height:${i % 3 === 0 ? 220 : 160}px;background:#E9EDF2 center/cover no-repeat url('${esc(cover(g))}')"></div>
        <div style="padding:10px 10px 12px"><div style="font:600 15px/1.3 Inter,sans-serif;color:${INK};display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(g.title_en || g.title)}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:8px;font:400 12px Inter,sans-serif;color:${MUTED}"><span style="width:18px;height:18px;border-radius:50%;flex:none;background:#ddd center/cover no-repeat url('${esc(g.avatar || '')}')"></span><span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(g.author)}</span>♡ ${lcK(g.likes)}</div></div></div>`;
      const cols = [[], []]; list.forEach((g, i) => cols[i % 2].push(card(g, i)));
      box.innerHTML = cols.map(c => `<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:10px">${c.join('')}</div>`).join('');
      box.querySelectorAll('[data-g]').forEach(n => n.onclick = () => openGuide(list[+n.dataset.g]));
    }
    renderDiveTabs(); renderMoreTabs();
    let opened = false;
    const open = () => { if (!opened) { opened = true; loadDive(); loadMore(); } };
    window.lcGuides = () => { show('guides'); open(); };
    window.addEventListener('hashchange', () => { if (location.hash.slice(1) === 'guides') open(); });
    if (location.hash.slice(1) === 'guides') open();
  })();

  // ---------- 租车结果页：真实数据来自官方 car_rental（后端 /content/cars）；查询条来自入口页（CQ），车型可就地 refine ----------
  (function () {
    const top = `
      <div style="padding:8px 12px 8px;display:flex;align-items:center;gap:8px">
        <div class="tap" data-lc-back style="flex:none">${LC_BACK}</div>
        <div class="tap lc-srch" data-lc-pill style="flex:1;display:flex;align-items:center;gap:8px;border:1px solid ${LINE};border-radius:10px;padding:9px 12px;cursor:pointer">${LC_SRCH}<span data-lc-pilltext style="font:600 13px Inter,sans-serif;color:${INK}">上海</span><span style="margin-left:auto;color:${MUTED}">✎</span></div>
      </div>
      <div class="lc-row" data-lc-chips></div>`;
    const { screen: cs, body: CB } = lcMakeScreen('cars', 'Cars', top);
    cs.querySelector('[data-lc-back]').onclick = () => back();
    cs.querySelector('[data-lc-pill]').onclick = () => show('car');
    const pillText = cs.querySelector('[data-lc-pilltext]');
    const syncPill = () => { pillText.textContent = CQ.city + ' · ' + lcRange(CQ.pick, CQ.ret); };
    lcChips(cs.querySelector('[data-lc-chips]'),
      [{ t: '全部', v: '' }, { t: '经济型', v: '2' }, { t: '舒适型', v: '3' }, { t: 'SUV', v: '6' }, { t: '商务车', v: '4' }, { t: '豪华型', v: '5' }],
      o => CQ.group === o.v,
      o => { CQ.group = o.v; load(true); });
    const sk = () => Array.from({ length: 3 }).map(() => `<div style="background:#fff;margin-bottom:8px;padding:16px"><div style="height:18px;width:60%;border-radius:9px;background:${BG}"></div><div style="display:flex;gap:12px;margin-top:14px"><div style="flex:1"><div style="height:14px;width:70%;border-radius:7px;background:${BG}"></div><div style="height:14px;width:50%;border-radius:7px;background:${BG};margin-top:10px"></div></div><div style="width:130px;height:84px;border-radius:8px;background:${BG};flex:none"></div></div></div>`).join('');
    const spec = (txt) => txt ? `<span style="font:400 14px Inter,sans-serif;color:${INK}">${esc(txt)}</span>` : '';
    function card(d) {
      const img = d.image ? `background:#fff center/contain no-repeat url('${esc(d.image)}')` : `background:${BG}`;
      const specs = [d.seat ? d.seat + ' seats' : '', d.trans, d.displacement].filter(Boolean);
      const brand = d.brandLogo ? `<div style="width:22px;height:22px;border-radius:4px;background:#fff center/contain no-repeat url('${esc(d.brandLogo)}')"></div>` : '';
      return `<div class="tap" data-lc-url="${esc(d.url || '')}" style="background:#fff;margin-bottom:8px;padding:16px;cursor:pointer">
        ${d.group ? `<div style="display:inline-block;font:600 12px Inter,sans-serif;color:${GREEN};background:rgba(27,166,114,.1);border-radius:5px;padding:2px 8px">${esc(d.group)}</div>` : ''}
        <div style="font:700 17px/1.3 Inter,sans-serif;margin-top:8px">${esc(d.name || '')} <span style="font:400 14px Inter,sans-serif;color:${MUTED}">or similar</span></div>
        <div style="display:flex;gap:12px;align-items:center;margin-top:10px">
          <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:7px">${specs.map(spec).join('')}${d.fuel ? spec(d.fuel + (d.doors ? ' · ' + d.doors + ' doors' : '')) : (d.doors ? spec(d.doors + ' doors') : '')}</div>
          <div style="width:130px;height:84px;border-radius:8px;${img};flex:none"></div>
        </div>
        <div style="border-top:1px solid ${LINE};margin-top:14px;padding-top:12px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:7px">${brand}<span style="font:500 13px Inter,sans-serif;color:${MUTED}">${esc(d.brand || '')}</span></div>
          <div><span style="font:700 20px Inter,sans-serif;color:${BLUE}">¥${esc(String(Math.round(d.price || 0)))}</span><span style="font:400 12px Inter,sans-serif;color:${MUTED}"> /day</span></div>
        </div>
      </div>`;
    }
    const MOCK = [
      { group: '经济型', name: '大众 Polo', brand: '大众', seat: '5', trans: '自动挡', displacement: '1.5L', fuel: '92号', doors: '4', price: 139, image: '' },
      { group: 'SUV', name: '本田 CR-V', brand: '本田', seat: '5', trans: '自动挡', displacement: '2.0L', fuel: '92号', doors: '5', price: 268, image: '' },
    ];
    let busy = false;
    async function load(force) {
      if (busy) return;
      busy = true; syncPill(); CB.innerHTML = sk();
      const p = new URLSearchParams({ pickUpCity: CQ.city || '上海', size: '12' });
      if (CQ.group) p.set('vehicleGroupIds', CQ.group);
      if (CQ.pick) p.set('pickUpTime', CQ.pick + ' 10:00:00');
      if (CQ.ret) p.set('returnTime', CQ.ret + ' 10:00:00');
      let data = null;
      try { data = await withTimeout(get('/content/cars?' + p.toString(), true), 12000); } catch (e) {}
      busy = false;
      const real = data && data.items && data.items.length;
      const items = real ? data.items : MOCK;
      CB.innerHTML = `<div style="padding:12px 16px 2px;font:700 15px Inter,sans-serif">${items.length} cars available${CQ.city ? ' · ' + esc(CQ.city) : ''}</div>` + items.map(card).join('');
      CB.querySelectorAll('[data-lc-url]').forEach(c => c.onclick = () => { const u = c.dataset.lcUrl; if (u) window.open(u, '_blank'); else toast('Demo'); });
      status(real ? `租车·真实数据 ${items.length} 辆` : '租车·示例数据(接口兜底)', real ? 'rgba(27,166,114,.85)' : 'rgba(232,137,12,.9)');
    }
    let opened = false;
    window.lcCars = force => { show('cars'); if (force || !opened) { opened = true; load(true); } };
    window.addEventListener('hashchange', () => { if ((location.hash.slice(1) || '') === 'cars' && !opened) { opened = true; load(true); } });
    if ((location.hash.slice(1) || '') === 'cars') { opened = true; load(true); }
  })();

  // ---------- 入口接线（运行时改绑，不改 index.html / build_h5.py）----------
  // 首页「Big Hotels」→ 酒店入口搜索页；「Small Car Rentals」→ 现有 Pen 租车入口页(car)。
  // 入口页改好条件 → 点 Search 才进结果页（仿 Trip.com：截图 1/3 入口 → 截图 2/4 结果）。
  (function () {
    const wire = (sel, act) => { const n = document.querySelector(sel); if (n) { n.dataset.act = act; n.classList.add('tap'); n.style.cursor = 'pointer'; } };
    wire('[data-pencil-name="Big Hotels"]', 'go:hotels-search');
    wire('[data-pencil-name="Small Car Rentals"]', 'go:car');
    wire('[data-pencil-name="Small Attractions"]', 'go:attractions');
    wire('[data-pencil-name="Feat Travel Guides"]', 'go:guides');

    // 把 Pen 租车入口页(car)的"地点/日期"接活，Search → 带参进 #cars 结果页
    const carScreen = document.querySelector('.screen[data-route="car"]');
    if (carScreen) {
      const istyle = 'border:0;outline:0;background:transparent;font:600 17px Inter,sans-serif;color:#121826;width:100%';
      const dstyle = 'border:0;outline:0;background:transparent;font:600 14px Inter,sans-serif;color:#121826;width:116px';
      const lcDays = (a, b) => { const d = Math.round((new Date(b) - new Date(a)) / 86400000); return d > 0 ? d : 1; };
      const locRow = carScreen.querySelector('[data-pencil-name="Form Shanghai Pudong Airport (PVG)"]');
      const locText = locRow && locRow.querySelector('[data-pencil-name="Form Text"]');
      if (locText) locText.innerHTML = `<input id="lc-car-city" value="${CQ.city}" placeholder="取车城市" style="${istyle}">`;
      // 取/还车同城（开关关着），右侧原设计残留的 "Shanghai" 隐掉，避免和左侧城市打架
      const locRight = locRow && locRow.querySelector('[data-pencil-name="Form Right"]');
      if (locRight) locRight.style.display = 'none';
      const dateRow = carScreen.querySelector('[data-pencil-name="Form 14:30, Sep 25 - 10:00, Sep 28"]');
      const dateText = dateRow && dateRow.querySelector('[data-pencil-name="Form Text"]');
      const dateRight = dateRow && dateRow.querySelector('[data-pencil-name="Form Right"]');
      const syncDays = () => { if (dateRight) dateRight.textContent = lcDays(CQ.pick, CQ.ret) + ' days'; };
      if (dateText) dateText.innerHTML = `<span style="display:flex;align-items:center;gap:4px"><input type="date" id="lc-car-pick" value="${CQ.pick}" style="${dstyle}"><span style="color:#6F7685">→</span><input type="date" id="lc-car-ret" value="${CQ.ret}" style="${dstyle}"></span>`;
      const pk0 = document.getElementById('lc-car-pick'), rt0 = document.getElementById('lc-car-ret');
      if (pk0) pk0.onchange = () => { CQ.pick = pk0.value || CQ.pick; syncDays(); };
      if (rt0) rt0.onchange = () => { CQ.ret = rt0.value || CQ.ret; syncDays(); };
      syncDays();
      const sb = carScreen.querySelector('[data-pencil-name="Search Button"]');
      if (sb) {
        sb.removeAttribute('data-act');
        sb.onclick = () => {
          const c = document.getElementById('lc-car-city'), pk = document.getElementById('lc-car-pick'), rt = document.getElementById('lc-car-ret');
          CQ.city = (c && c.value.trim()) || '上海';
          if (pk && pk.value) CQ.pick = pk.value;
          if (rt && rt.value) CQ.ret = rt.value;
          window.lcCars(true);
        };
      }
    }
  })();

  // Browser history and the visible screen must stay in sync in both modes.
  window.addEventListener('hashchange', () => {
    cydf.style.display = 'none';
    const route = location.hash.slice(1) || 'home';
    if (document.querySelector('.screen.on')?.dataset.route !== route) show(route, false);
  });
  // ---------- 行前检查分组（静态 / 后端模式共用） ----------
  const ITEM_NODE = { permissions: 'Item Location & notifications', data: 'Item Mobile data in China', alipay: 'Item Alipay payment', transfer: 'Item Ride from the airport', car: 'Item Car rental', tickets: 'Item Palace Museum reservation', passport: 'Item Passport', pack: 'Item Offline landing pack' };
  // 分组：待办 → Must List，可选 → Optional List，已完成 → 折叠的 Done List（点 Done Toggle 展开）
  const GROUP = { todo: 'Must List', optional: 'Optional List', done: 'Done List' };
  const SECTION = { 'Must List': 'Section MUST DO', 'Optional List': 'Section OPTIONAL' };
  (() => {
    const tg = $$('preflight', 'Done Toggle'), dl = $$('preflight', 'Done List'); if (!tg || !dl) return;
    dl.classList.add('lc-hide'); tg.classList.add('tap');
    const css = document.createElement('style'); css.textContent = '.lc-hide{display:none !important} [data-pencil-name="Must List"] > *{background:#fff;border-radius:12px;outline:1px solid #DADFE6;outline-offset:-1px}'; document.head.appendChild(css);
    tg.onclick = () => { const open = dl.classList.toggle('lc-hide') === false; const ch = tg.querySelector('[data-pencil-name="Done Chevron"]'); if (ch) ch.style.transform = open ? 'rotate(180deg)' : ''; };
  })();
  function regroup(statusOf) {
    Object.entries(ITEM_NODE).forEach(([id, name]) => {
      const node = $$('preflight', name), st = statusOf[id], list = st && $$('preflight', GROUP[st]);
      if (node && list && node.parentElement !== list) list.appendChild(node);
    });
    Object.entries(SECTION).forEach(([l, s]) => { const list = $$('preflight', l), sec = $$('preflight', s); if (list && sec) sec.classList.toggle('lc-hide', !list.children.length); });
    const dl = $$('preflight', 'Done List'), n = dl ? dl.children.length : 0;
    txt($$('preflight', 'Done Label'), n === 1 ? '1 item ready' : `${n} items ready`);
    const tg = $$('preflight', 'Done Toggle'); if (tg) tg.classList.toggle('lc-hide', !n);
    tidyPreflight();
  }
  // 行前检查一屏一个重点：待办里第一项是「Do this next」大卡，其余压成一行 + 右侧小按钮；可选项收成一行
  (() => { const st = document.createElement('style'); st.textContent = `
    .screen[data-route="preflight"] .lc-pf-next{outline:2px solid #2C61FE!important;outline-offset:-2px;border-radius:16px!important}
    .screen[data-route="preflight"] .lc-pf-next{flex-direction:column!important;align-items:stretch!important;gap:10px!important;padding:14px!important}
    .screen[data-route="preflight"] .lc-pf-next>[data-pencil-name="Row"]{width:100%}
    .screen[data-route="preflight"] .lc-pf-next [data-pencil-name="Item Button"]{width:100%!important;height:44px!important;padding:0!important;border-radius:22px!important;background:#2C61FE!important;align-self:stretch}
    .screen[data-route="preflight"] .lc-pf-next [data-pencil-name="Item Button Label"]{color:#fff!important;font-size:15px!important}
    .screen[data-route="preflight"] .lc-pf-compact{flex-direction:row!important;align-items:center!important;gap:10px!important;outline:0!important;border-radius:16px!important;padding:12px 14px!important}
    .screen[data-route="preflight"] .lc-pf-compact>[data-pencil-name="Row"]{flex:1;min-width:0}
    .screen[data-route="preflight"] .lc-pf-compact [data-pencil-name="Sub Row"],.screen[data-route="preflight"] .lc-pf-compact [data-pencil-name="Item Guide Link"]{display:none!important}
    .screen[data-route="preflight"] .lc-pf-compact [data-pencil-name="Item Desc"]{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .screen[data-route="preflight"] .lc-pf-compact [data-pencil-name="Item Button"]{width:auto!important;height:32px!important;padding:0 14px!important;border-radius:16px!important;background:#EAF0FF!important;outline:0!important;border:0!important;flex:none}
    .screen[data-route="preflight"] .lc-pf-compact [data-pencil-name="Item Button Label"]{color:#2C61FE!important;font-size:13px!important}
    .screen[data-route="preflight"] .lc-pf-still{border:0!important;outline:0!important;background:none!important;padding:0!important;width:100%;font:700 13px/1 Inter,system-ui,sans-serif;color:#6F7685;letter-spacing:.02em;margin:6px 0 -2px}
    .screen[data-route="preflight"] .lc-pf-opt-closed [data-pencil-name="Optional List"]{display:none!important}
    .screen[data-route="preflight"] .lc-opt-card{width:100%;box-sizing:border-box;background:#fff;border-radius:16px;padding:14px 14px 4px;display:flex;flex-direction:column}
    .screen[data-route="preflight"] .lc-opt-card.lc-pf-opt-closed{padding-bottom:14px}
    .screen[data-route="preflight"] .lc-opt-card [data-pencil-name="Section OPTIONAL"]{padding:0!important}
    .screen[data-route="preflight"] .lc-opt-card [data-pencil-name="Section Title"]{font:700 16px Inter,system-ui,sans-serif!important;color:#121826!important}
    .screen[data-route="preflight"] .lc-opt-card [data-pencil-name="Optional List"]{flex-direction:column!important;gap:0!important;margin-top:6px}
    .screen[data-route="preflight"] .lc-opt-card [data-pencil-name="Optional List"]>*{flex-direction:row!important;align-items:center!important;gap:12px!important;background:none!important;border-radius:0!important;outline:0!important;padding:12px 0!important;width:100%!important;border-top:1px solid #EEF0F3}
    .screen[data-route="preflight"] .lc-opt-card [data-pencil-name="Optional List"]>:first-child{border-top:0}
    .screen[data-route="preflight"] .lc-opt-card [data-pencil-name="Row"]{flex-direction:row!important;align-items:center!important;gap:12px!important;flex:1;min-width:0}
    .screen[data-route="preflight"] .lc-opt-card [data-pencil-name="State"]{width:40px!important;height:40px!important;border-radius:12px!important;background:#EEF3FF!important;flex:none;display:grid!important;place-items:center}
    .screen[data-route="preflight"] .lc-opt-card [data-pencil-name="State Icon"]{width:20px!important;height:20px!important}
    .screen[data-route="preflight"] .lc-opt-card [data-pencil-name="State Icon"] path{fill:#2C61FE}
    .screen[data-route="preflight"] .lc-opt-card [data-pencil-name="Item Texts"]{flex:1;min-width:0}
    .screen[data-route="preflight"] .lc-opt-card [data-pencil-name="Item Title"]{font-size:15px!important;font-weight:600!important}
    .screen[data-route="preflight"] .lc-opt-card [data-pencil-name="Item Desc"]{font-size:13px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .screen[data-route="preflight"] .lc-opt-card [data-pencil-name="Item Button"]{width:auto!important;height:32px!important;padding:0 14px!important;border-radius:16px!important;background:#EAF0FF!important;outline:0!important;border:0!important;flex:none;align-items:center!important;justify-content:center!important;display:flex!important}
    .screen[data-route="preflight"] .lc-opt-card [data-pencil-name="Item Button Label"]{color:#2C61FE!important;font-size:13px!important;font-weight:600!important}`; document.head.appendChild(st); })();
  function tidyPreflight() {
    const list = $$('preflight', 'Must List'); if (!list) return;
    list.querySelectorAll(':scope > .lc-pf-still').forEach(n => n.remove());
    document.querySelectorAll('.screen[data-route="preflight"] .lc-pf-next, .screen[data-route="preflight"] .lc-pf-compact').forEach(n => n.classList.remove('lc-pf-next', 'lc-pf-compact'));   // 移到「已完成」里的项不再带大卡样式
    const items = [...list.children].filter(n => !n.classList.contains('lc-hide') && n.style.display !== 'none');
    items.forEach((n, i) => { n.classList.toggle('lc-pf-next', i === 0); n.classList.toggle('lc-pf-compact', i > 0); });
    if (items.length > 1) { const still = el('div', '', 'STILL TO DO'); still.className = 'lc-pf-still'; items[1].before(still); }
    // 可选项：标题和列表装进一张卡片，默认展开（收起时只剩一行标题，用户以为没有可选项）；标题右侧 Hide / Show 可收起
    const sec = $$('preflight', 'Section OPTIONAL'), opt = $$('preflight', 'Optional List');
    if (sec && opt && !sec.dataset.lcToggle) {
      const card = el('div'); card.className = 'lc-opt-card';
      sec.before(card); card.append(sec, opt);
      sec.dataset.lcToggle = '1'; sec.classList.add('tap'); sec.style.cursor = 'pointer';
      sec.addEventListener('click', () => { card.classList.toggle('lc-pf-opt-closed'); syncOpt(); });
    }
    syncOpt();
  }
  tidyPreflight();   // 静态模式没有接口回调，先按设计稿顺序排一次
  // Wi-Fi 页：网络名一键复制；「收不到验证码」默认收成一行，点开再看两个备选
  (() => {
    const copy = $$('wifi', 'No Password'), ssid = $$('wifi', 'SSID');
    if (copy && ssid) { copy.classList.add('tap'); copy.style.cursor = 'pointer'; copy.addEventListener('click', e => { e.stopPropagation(); const name = ssid.textContent.trim(); (navigator.clipboard ? navigator.clipboard.writeText(name) : Promise.reject()).then(() => toast('Wi-Fi name copied'), () => toast(name)); }); }
    const card = $$('wifi', 'No SMS Card'); if (!card) return;
    const hide = ['Alt Desc', 'Backup Row', 'Timer Chip'].map(n => card.querySelector(`[data-pencil-name="${n}"]`)).filter(Boolean);
    const title = card.querySelector('[data-pencil-name="Alt Title"]'), row = card.querySelector('[data-pencil-name="Alt Title Row"]');
    const chev = el('span', `margin-left:auto;font:600 13px Inter,sans-serif;color:${MUTED}`, '2 backups ›');
    if (row) row.appendChild(chev);
    let open = false;
    const shown = hide.map(n => n.style.display || 'flex');   // 设计稿导出的节点都写了内联 display，收起后要原样恢复
    const sync = () => { hide.forEach((n, i) => { n.style.display = open ? shown[i] : 'none'; }); chev.textContent = open ? 'Hide ⌃' : '2 backups ›'; };
    if (row) { row.classList.add('tap'); row.style.cursor = 'pointer'; row.addEventListener('click', () => { open = !open; sync(); }); }
    if (title) title.textContent = 'No SMS code?';
    sync();
  })();
  // 行前检查「Optional」里加两项：景点门票（query_ticket）、旅行指南（query_content）——真实数据在各自的页面里
  (() => {
    const st = document.createElement('style'); st.textContent = `
      .lc-sk{background:linear-gradient(90deg,#EEF1F5,#F6F8FA,#EEF1F5);background-size:200% 100%;animation:lcsk 1.2s infinite}
      @keyframes lcsk{to{background-position:-200% 0}}`; document.head.appendChild(st);
    const proto = $$('preflight', 'Item Car rental'), list = $$('preflight', 'Optional List'); if (!proto || !list) return;
    const icon = d => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${BLUE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    // 景点、旅行指南排在接机 / 租车前面
    const added = [['Item Attractions', 'Attractions & tickets', 'Must-sees with live prices · The Bund, Disney, Yu Garden', 'Explore', 'go:attractions', icon('<path d="M3 9V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3a3 3 0 0 0 0 6v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a3 3 0 0 0 0-6z"/><path d="M14 5v14" stroke-dasharray="2 2.5"/>')],
     ['Item Travel guides', 'Travel guides', 'First-timer routes and tips from travelers', 'Read', 'go:guides', icon('<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>')]].map(([name, title, desc, label, act, svg]) => {
      const n = proto.cloneNode(true);
      n.setAttribute('data-pencil-name', name);
      n.querySelectorAll('[data-pencil-id]').forEach(e => e.removeAttribute('data-pencil-id')); n.removeAttribute('data-pencil-id');
      n.querySelectorAll('[data-act]').forEach(e => e.removeAttribute('data-act'));
      txt(n.querySelector('[data-pencil-name="Item Title"]'), title); txt(n.querySelector('[data-pencil-name="Item Desc"]'), desc);
      const ic = n.querySelector('[data-pencil-name="State Icon"]'); if (ic) ic.outerHTML = svg;
      const btn = n.querySelector('[data-pencil-name="Item Button"]'); if (btn) { btn.dataset.act = act; btn.classList.add('tap'); txt(btn.querySelector('[data-pencil-name="Item Button Label"]'), label); }
      n.dataset.act = act; n.classList.add('tap'); n.style.cursor = 'pointer';
      return n;
    });
    list.prepend(...added);
    syncOpt();
  })();
  function syncOpt() {
    const sec = $$('preflight', 'Section OPTIONAL'), opt = $$('preflight', 'Optional List'); if (!sec || !opt) return;
    const n = opt.children.length, closed = sec.parentElement.classList.contains('lc-pf-opt-closed');
    sec.parentElement.classList.toggle('lc-hide', !n);   // 可选项都做完了（移到 Done）就整张卡片收掉
    txt(sec.querySelector('[data-pencil-name="Section Title"]'), n ? `Optional · ${n}` : 'Optional');
    let tg = sec.querySelector('.lc-opt-tg');
    if (!tg) { tg = el('span', `font:600 13px Inter,sans-serif;color:${BLUE}`); tg.className = 'lc-opt-tg'; sec.appendChild(tg); }
    tg.textContent = closed ? 'Show ›' : 'Hide ⌃';
    // 后端 summary 只数接机 / 租车两项，景点、旅行指南是前端加的：「N optional」按实际项数改
    const pl = $$('preflight', 'Progress Label'); if (pl) pl.textContent = pl.textContent.replace(/\d+ optional/, `${n} optional`);
  }
  const PF = { status: {} };
  // offline.js 每次同步本机保存状态都会回调这里（含下载中）
  window.lcPackChanged = (saved, done, required) => {
    PF.status.pack = saved ? 'done' : 'todo'; regroup(PF.status);
    const left = required - done;
    txt($$('preflight', 'Hero Title'), left ? `${left} thing${left > 1 ? 's' : ''} left before you fly` : "You're ready for Shanghai");
  };
  if (!API) { status('静态模式'); window.lcHandle = (act) => staticHandle(act); window.lcOnShow = route => { if (route === 'preflight') { if (!PRIV.asked) { PRIV.asked = true; renderPriv(); show('privacy'); } else startPack(); } if (route === 'transit') transitMap(); if (route === 'step3') { step3Map('taxi'); renderWays(); } }; return; }
  get('/health').then(() => status('后端已连接 · ' + API.replace(/^https?:\/\//, ''), 'rgba(27,166,114,.85)')).catch(() => status('后端不可达，静态模式', 'rgba(232,137,12,.9)'));

  // ---------- 航班信息：把设计稿里写死的 CX 362 / HKG / 时间换成接口里的航班（6 个屏共用） ----------
  async function renderFlight() {
    let f; try { f = await get('/mock/flight'); } catch (e) { return; }
    if (!f || !f.number) return;
    const dep = (f.scheduled_departure || '').slice(11, 16), arr = (f.scheduled_arrival || '').slice(11, 16);
    const nextDay = f.scheduled_departure && f.scheduled_arrival && f.scheduled_departure.slice(0, 10) !== f.scheduled_arrival.slice(0, 10);
    const d = f.scheduled_arrival ? new Date(f.scheduled_arrival.replace(' ', 'T')) : null;
    const dateS = d ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '') : 'Fri Sep 25';
    const from = (f.from && f.from.code) || 'HKG', to = (f.to && f.to.code) || 'PVG';
    // 设计稿里的占位航班（当前 UA 857 / SFO 14:10 → PVG 07:40 Mon Oct 12，旧版 CX 362）都换成接口值
    const swap = t => t.replace(/CX 362|UA 857/g, f.number).replace(/HKG|SFO/g, from).replace(/11:05|14:10/g, dep || '14:10').replace(/14:20|07:40/g, arr || '07:40').replace(/Fri Sep 25|Mon Oct 12/g, dateS);
    [['home', 'Banner Sub'], ['preflight', 'Flight No'], ['preflight', 'Flight Time'], ['transfer', 'Time Title'], ['lock', 'Title'], ['lock', 'Body'], ['trips', 'Booking Title'], ['transfers', 'Flight Text']].forEach(([r, n]) => {
      document.querySelectorAll(`.screen[data-route="${r}"] [data-pencil-name="${n}"]`).forEach(el => { if (/CX 362|UA 857|HKG|SFO|Fri Sep 25|Mon Oct 12/.test(el.textContent)) txt(el, swap(el.textContent.trim().replace(/ \+1$/, '')) + (n === 'Flight Time' && nextDay ? ' +1' : '')); });
    });
  }
  renderFlight();

  // ---------- 行前检查 ----------
  const ICONS = {};
  function captureIcons() {
    const done = $$('preflight', 'Item Location & notifications'), todo = $$('preflight', 'Item Mobile data in China'), opt = $$('preflight', 'Item Ride from the airport');
    ICONS.done = done && done.querySelector('[data-pencil-name="State"]').outerHTML;
    ICONS.todo = todo && todo.querySelector('[data-pencil-name="State"]').outerHTML;
    ICONS.optional = opt && opt.querySelector('[data-pencil-name="State"]').outerHTML;
  }
  async function renderPreflight() {
    let d; try { d = await get('/rules/preflight'); } catch (e) { return; }
    window.lcPreflightData = d;
    if (!ICONS.done) captureIcons();
    const left = d.required - d.ready;
    txt($$('preflight', 'Hero Title'), left ? `${left} thing${left > 1 ? 's' : ''} left before you fly` : "You're ready for Shanghai");
    txt($$('preflight', 'Progress Label'), d.summary); txt($$('preflight', 'Progress Pct'), d.pct + '%');
    const fill = $$('preflight', 'Fill'); if (fill) fill.style.width = d.pct + '%';
    const statusOf = PF.status = {};
    d.items.forEach(it => { if (!(it.group && d.payment)) statusOf[it.id] = it.status; });
    if (d.payment) statusOf.alipay = d.payment.ready ? 'done' : 'todo';
    const setRow = (node, status, desc) => {
      txt(node.querySelector('[data-pencil-name="Item Desc"]'), desc);
      const st = node.querySelector('[data-pencil-name="State"]');
      if (st && ICONS[status]) { const t = document.createElement('div'); t.innerHTML = ICONS[status]; st.replaceWith(t.firstElementChild); }
    };
    d.items.forEach(it => {
      if (it.id === 'pack') return;                          // 真实本机保存状态由 offline.js 管理
      if (it.group && d.payment) return;                       // 支付宝 / TenPayGo 两项合在下面的板块里
      const node = $$('preflight', ITEM_NODE[it.id]); if (!node) return;
      setRow(node, it.status, it.desc);
      const btn = node.querySelector('[data-pencil-name="Item Button"]'); if (btn) btn.classList.toggle('lc-hide', it.status === 'done');
    });
    const p = d.payment, row = $$('preflight', 'Item Alipay payment');
    if (p && row) {
      setRow(row, p.ready ? 'done' : 'todo', p.desc);
      const btn = row.querySelector('[data-pencil-name="Item Button"]');
      if (btn) { btn.classList.toggle('lc-hide', p.ready && !p.backup); txt(btn.querySelector('[data-pencil-name="Item Button Label"]'), p.ready ? 'Add backup' : 'Verify ¥1'); }
    }
    regroup(statusOf);
    if (window.lcOfflineReadiness) window.lcOfflineReadiness(d);
  }

  // 同意授权：记到后端，回到行前检查，离线包开始自动下载
  async function consent() {
    PRIV.asked = true;
    try { await post('/mock/consent', PRIV.on); } catch (e) { toast('后端不可达'); }
    show('preflight'); startPack();
  }
  // 首次进入行前检查：还没做过授权选择就先去授权页（本次会话选过"Not now"就不再拦）
  async function privacyGate() {
    if (PRIV.asked) return false;
    try { if ((await get('/mock/consent')).consent) { PRIV.asked = true; return false; } } catch (e) { return false; }
    PRIV.asked = true; renderPriv(); show('privacy'); return true;
  }
  // 进行前检查前先判断要不要先去授权页：启动时就把授权状态取回来，show('preflight') 时直接改去 privacy，
  // 不再先闪一下 Before you fly 再跳（重置演示数据后最明显）。状态还没取回时按「没授权」处理。
  get('/mock/consent').then(r => { PRIV.consent = !!r.consent; }).catch(() => {});
  const showBeforeGate = window.show;
  window.show = (route, push) => {
    if (route === 'preflight' && !PRIV.asked && PRIV.consent !== true) { PRIV.asked = true; renderPriv(); route = 'privacy'; }
    return showBeforeGate(route, push);
  };

  // ---------- 支付验证（文案切换见前面"支付方式"一节） ----------
  async function pay(method) {
    if (S.paying) return;
    S.paying = true;
    method = PAY_NAME[method] ? method : 'alipay';
    toast(`Charging ¥1 via ${PAY_NAME[method]}…`);
    try {
      const r = await withTimeout(post(`/mock/pay-test?method=${method}&donate=${SETUP.donate}`), 15000);
      if (r.status === 'verified') {
        renderPayOk(method, r); show('payment'); renderPreflight();
        if (S.payReturn) { const to = S.payReturn; S.payReturn = null; const btn = $$('payment', 'Done Button'); if (btn) { btn.dataset.act = 'go:' + to; txt($$('payment', 'Done Label'), 'Continue to step 3 · Get to your hotel'); } }
      } else { renderPayFail(method, r, await otherVerified(method)); show('payment'); }
    } catch (e) {
      // 请求没发出去：显示本次方式的"连不上"，不能留着上一次（可能是另一种方式的成功页）
      toast('后端不可达');
      renderPayFail(method, { error_code: 'NO_CONNECTION', hint: 'We could not reach Trip.com. Check your connection and try again.' }, false); show('payment');
    } finally { S.paying = false; }
  }
  async function otherVerified(method) {
    try { const pf = await get('/rules/preflight'); return !!(pf.payment && pf.payment.verified.includes(OTHER[method])); } catch (e) { return false; }
  }
  // 行前检查的境内支付板块：还没验证 → 选择层；已验证一种 → 直接验证另一种作为备用
  async function payPick() {
    S.payReturn = null;
    let p = null; try { p = (await get('/rules/preflight')).payment; } catch (e) {}
    openSetup(p && p.ready && p.backup ? p.backup : 'alipay');
  }
  // 落地流程里支付未就绪：先选方式再验证，成功后回到第三步
  function payFirst() { openSetup('alipay', 'step3'); }
  // 支付组状态；旧后端没有 payment 字段时只看支付宝
  function payState(pf) {
    if (pf && pf.payment) return { ready: !!pf.payment.ready, method: pf.payment.primary, name: pf.payment.primary_name, at: pf.payment.verified_at, fate: (pf.payment.donated || []).includes(pf.payment.primary) ? 'donated to CYDF' : 'refunded' };
    const a = pf && pf.items.find(i => i.id === 'alipay'), okA = !!a && a.status === 'done';
    return { ready: okA, method: okA ? 'alipay' : null, name: okA ? 'Alipay' : null, at: null };
  }

  // ---------- 航班落地 ----------
  async function land() {
    try { await post('/mock/flight/land'); } catch (e) {}
    toast('检测通过 · 模拟时间来到落地那一刻');
    setTimeout(island, 900);
  }

  // ---------- 我卡住了 ----------
  const picker = document.createElement('input'); picker.type = 'file'; picker.accept = 'image/*'; picker.hidden = true; document.body.appendChild(picker);
  let recognitionRun = 0, shotUrl = null;
  function stuckPick() { picker.value = ''; picker.click(); }
  picker.onchange = async () => {
    const f = picker.files[0]; if (!f) return;
    const run = ++recognitionRun;
    S.lastShot = f; show('stuck'); renderStuckLoading();
    const fd = new FormData(); fd.append('image', f); fd.append('lang', 'en');
    try { const result = await withTimeout(post('/stuck/classify', fd, true), 15000); if (run === recognitionRun) renderStuck(result); }
    catch (e) { if (run !== recognitionRun) return; toast('Recognition unavailable, showing offline guidance'); renderStuck({ decision: 'unknown', mode: 'offline', scenario: 'unknown', advice: null, confidence: 0 }); }
  };
  // 一步文字拆成标题 + 正文：按句末的 . : ; 切（后面跟空格或结尾，避免切到 Trip.com、0.05）
  function splitStep(t) {
    const m = /[.:;](?=\s|$)/.exec(t || '');
    if (!m) return { title: t || '', desc: '' };
    return { title: t.slice(0, m.index).trim(), desc: t.slice(m.index + 1).trim() };
  }
  function setStepRow(row, text) {
    const { title, desc } = splitStep(text);
    txt(row.querySelector('[data-pencil-name="Step Title"]'), title);
    const d = row.querySelector('[data-pencil-name="Step Desc"]'); if (d) { d.textContent = desc; d.style.display = desc ? '' : 'none'; }
  }
  function stepRows() {
    let rows = $all('stuck', 'Step 1').concat($all('stuck', 'Step 2'), $all('stuck', 'Step 3'));
    if (rows.length === 3 && !$$('stuck', 'Step 4')) { const r4 = rows[2].cloneNode(true); r4.setAttribute('data-pencil-name', 'Step 4'); const n = r4.querySelector('[data-pencil-name="Num Text"]'); if (n) n.textContent = '4'; rows[2].after(r4); }
    const r4 = $$('stuck', 'Step 4'); if (r4) rows.push(r4);
    return rows;
  }
  function renderStuckLoading() {
    resetStuckHelp();
    txt($$('stuck', 'Rec Label'), 'ANALYSING…'); txt($$('stuck', 'Shot Title'), 'Reading your screenshot'); txt($$('stuck', 'Shot Why'), 'Usually takes 1–2 seconds.');
    txt($$('stuck', 'Steps Title'), 'Looking for guidance…'); txt($$('stuck', 'Src Text'), '');
    stepRows().forEach(row => { row.style.display = 'none'; row.onclick = null; row.style.cursor = ''; });
    const img = $$('stuck', 'Thumb'); if (img && S.lastShot) { if (shotUrl) URL.revokeObjectURL(shotUrl); shotUrl = URL.createObjectURL(S.lastShot); img.style.backgroundImage = `url(${shotUrl})`; img.style.backgroundSize = 'cover'; [...img.children].forEach(c => c.style.visibility = 'hidden'); }
  }
  // 转人工卡片：导出稿里两行都是 nowrap 且父容器没 min-width，长文字会溢出；运行时改成可换行
  const SUP = {};
  function supCard(fallback) {
    const t = $$('stuck', 'Sup Title'), sub = $$('stuck', 'Sup Sub'), box = $$('stuck', 'Sup Texts');
    if (!SUP.init) { SUP.init = true; SUP.title = t ? t.textContent : ''; SUP.sub = sub ? sub.textContent : ''; if (box) box.style.minWidth = '0'; [t, sub].forEach(n => { if (n) { n.style.whiteSpace = 'normal'; n.style.width = '100%'; } }); if (sub) sub.style.lineHeight = '16px'; }
    txt(t, SUP.title);
    txt(sub, fallback ? fallback + ' · Or chat with Trip.com support in English, 24/7, with this screenshot attached.' : SUP.sub);
  }
  function resetStuckHelp() {
    S.entry = null;
    const title = $$('stuck', 'Steps Title'); if (title) { title.onclick = null; title.style.cursor = ''; }
    supCard();
  }
  function fillEntry(e) {
    S.entry = e.id;
    txt($$('stuck', 'Rec Label'), 'RECOGNIZED · ' + (e.scenario || '').toUpperCase()); txt($$('stuck', 'Shot Title'), e.title); txt($$('stuck', 'Shot Why'), e.why);
    const stT = $$('stuck', 'Steps Title'); txt(stT, 'Do this now'); if (stT) { stT.style.cursor = ''; stT.onclick = null; window.lcHasTutorial(e.id).then(has => { if (!has || S.entry !== e.id) return; txt(stT, 'Do this now · See it step by step ›'); stT.style.cursor = 'pointer'; stT.onclick = () => window.lcTutorial(e.id); }); }
    stepRows().forEach((row, i) => { row.style.display = e.steps[i] ? '' : 'none'; if (e.steps[i]) setStepRow(row, e.steps[i]); row.onclick = null; row.style.cursor = ''; });
    supCard(e.fallback);
    txt($$('stuck', 'Src Text'), `Steps from ${e.sources[0].name.split('·')[0].trim()} · verified ${e.verified_at}`);
  }
  function renderStuck(d) {
    resetStuckHelp();
    if (d.decision === 'answer') { fillEntry(d.entry); toast(`${d.mode === 'model' ? 'Model' : 'Rules'} · ${d.confidence} · ${d.latency_ms} ms`); return; }
    if (d.decision === 'ask') {
      S.entry = null;
      txt($$('stuck', 'Rec Label'), 'NOT SURE · ' + (d.scenario || '').toUpperCase()); txt($$('stuck', 'Shot Title'), 'Which of these is it?'); txt($$('stuck', 'Shot Why'), 'The screenshot could mean a few things. Tap the one that matches.');
      txt($$('stuck', 'Steps Title'), 'Tap one');
      stepRows().forEach((row, i) => { const c = d.candidates[i]; row.style.display = c ? '' : 'none'; if (!c) return; txt(row.querySelector('[data-pencil-name="Step Title"]'), c.title); const cd = row.querySelector('[data-pencil-name="Step Desc"]'); if (cd) { cd.textContent = `Confidence ${c.confidence}`; cd.style.display = ''; } row.style.cursor = 'pointer'; row.onclick = async () => { const run = ++recognitionRun; try { const entry = await get(`/kb/entry/${c.entry_id}?lang=en`); if (run === recognitionRun) fillEntry(entry); } catch (e) { if (run === recognitionRun) toast('Could not load this guide. Check your connection and tap again.'); } }; });
      txt($$('stuck', 'Src Text'), `Confidence ${d.confidence} · ${d.mode}`); return;
    }
    S.entry = null;
    txt($$('stuck', 'Rec Label'), 'NOT COVERED YET'); txt($$('stuck', 'Shot Title'), "We don't have this one yet"); txt($$('stuck', 'Shot Why'), d.advice ? 'AI suggestion, not verified by us:' : 'Try the support chat below.');
    txt($$('stuck', 'Steps Title'), d.advice ? 'AI suggestion · unverified' : 'What you can do');
    const lines = d.advice ? d.advice.split(/(?<=[.!?])\s+/).slice(0, 3) : ['Show the screen to a staff member nearby.', 'Open the app\'s English support if it has one.', 'Chat with Trip.com support below.'];
    stepRows().forEach((row, i) => { row.style.display = lines[i] ? '' : 'none'; if (lines[i]) setStepRow(row, lines[i]); row.onclick = null; row.style.cursor = ''; });
    txt($$('stuck', 'Src Text'), 'Not from the knowledge base · ' + d.mode);
  }
  async function solved() { if (S.entry) { try { await post('/kb/feedback', { entry_id: S.entry, solved: true }); } catch (e) {} } S.entry = null; toast('Thanks, recorded'); back(); }

  // ---------- 第三步交通 ----------
  // 只验证了 TenPayGo 时，依赖支付宝的方式（支付宝里的滴滴、地铁售票机）带一行提示（后端 rules.transport 给 pay_note）
  const payNote = t => el('div', 'font-size:12px;line-height:1.35;color:#B25E00;margin-top:6px', t);
  // 第三步一屏只放「地图 + 推荐方式 + 一个按钮」：理由缩成一行小标签，找上车点的说明收进折叠，付款没验证单独一条提醒
  const MODE_NAME = { taxi: 'Taxi', metro: 'Metro', transfer: 'Your booked transfer', didi: 'DiDi', maglev: 'Maglev' };
  async function renderTransport() {
    let d; try { d = await get('/rules/transport' + (S.night ? '?landed_at=23:40' : '')); } catch (e) { return; }
    const r = d.recommended, facts = d.facts || [];
    txt($$('step3', 'Task Title'), MODE_NAME[r.id] || r.title);
    txt($$('step3', 'Task Sub'), r.where);
    txt($$('step3', 'Status Label'), r.price);
    const reason = facts.find(f => /bag|child|adult|night|late/i.test(f) && !/^1 adult$/i.test(f));
    txt($$('step3', 'Task Kicker'), 'BEST FOR YOU' + (reason ? ' · ' + reason.toUpperCase() : ''));
    const dist = (facts.find(f => /km/i.test(f)) || '').replace(/^Hotel\s*/i, '');
    txt($$('step3', 'Map Chip Label'), `${r.min} min${dist ? ' · ' + dist : ''}`);
    const g = r.go_to || {};
    const cur = $$('step3', 'Current Task');
    let go = cur && cur.querySelector('.lc-goto');
    if (cur && !go) { go = document.createElement('details'); go.className = 'lc-goto'; go.style.cssText = 'width:100%;font-family:Inter,system-ui,sans-serif;text-align:center'; cur.appendChild(go); }
    if (go) {
      const sum = el('summary', `list-style:none;cursor:pointer;font:600 13px/1.4 Inter,sans-serif;color:${BLUE};padding:2px 0`, `How to find ${(g.title || r.title || 'it').replace(/^(the|an?)\s/i, '').toLowerCase()} ›`);
      const body = el('div', `margin-top:8px;padding:12px 14px;border-radius:10px;background:#F0F2F5;text-align:left;font:400 13px/1.45 Inter,sans-serif;color:${INK}`, g.where || r.where);
      if (g.verified === false) body.appendChild(el('div', 'font-size:11px;color:#8592A6;margin-top:6px', 'Location to be verified on site'));
      if (r.pay_note) body.appendChild(payNote(r.pay_note));
      go.replaceChildren(sum, body);
    }
    renderWays();
    step3Map(r.id === 'metro' || r.id === 'maglev' ? 'metro' : 'taxi');
    const pb = $$('step3', 'Primary Button'); if (pb) pb.dataset.act = r.id === 'metro' || r.id === 'maglev' ? 'go:transit' : 'go:driver';
    txt($$('step3', 'Primary Label'), r.id === 'transfer' ? 'Show my booking to the driver' : r.id === 'metro' || r.id === 'maglev' ? 'Open the route' : 'Show address to driver');
    try { step3PayNote(payState(await get('/rules/preflight'))); } catch (e) {}
  }
  // 付款没验证：推荐卡下面一条琥珀色提醒，点了去验 ¥1；验过就收起
  function step3PayNote(ps) {
    const note = $$('step3', 'Pay Note'); if (!note) return;
    note.style.display = ps.ready ? 'none' : 'flex'; note.dataset.act = 'api:pay2'; note.classList.add('tap');
  }
  async function incar() { try { await post('/mock/event', { event: 'in_car' }); } catch (e) {} show('done'); }

  // ---------- 完成页 ----------
  async function renderDone() {
    let tl, fl; try { [tl, fl] = await Promise.all([get('/mock/timeline'), get('/mock/flight')]); } catch (e) { return; }
    const at = ev => (tl.find(x => x.event === ev) || {}).at;
    const hhmm = s => s ? s.slice(11, 16) : null;
    const landed = fl.landed_at || at('landed') || (tl[0] && tl[0].at), online = at('online'), car = at('in_car');
    const evt = (name, v) => { const n = $$('done', name); if (n && v) txt(n.querySelector('[data-pencil-name="Event Time"]'), v); };
    evt('Event Landed at PVG T2', hhmm(landed)); evt('Event Online · PVG free Wi-Fi', hhmm(online)); evt('Event In the car · detected automatically', hhmm(car));
    try {
      const ps = payState(await get('/rules/preflight')); const prow = $$('done', 'Event Payment verified before flight');
      if (prow) {
        const payAt = ps.at || (tl.find(x => x.event === 'payment' && (!x.method || x.method === ps.method)) || {}).at;
        const sameDay = payAt && landed && payAt.slice(0, 10) === landed.slice(0, 10);
        txt(prow.querySelector('[data-pencil-name="Event Title"]'), ps.ready ? 'Paid' : 'Not paid');   // 页头横向时间线：标签只放两三个词
        txt(prow.querySelector('[data-pencil-name="Event Time"]'), ps.ready ? (sameDay ? hhmm(payAt) : 'before flight') : '—');
        const sp = $$('share', 'TL Paid'); if (sp) txt(sp.querySelector('[data-pencil-name="TL Time"]'), ps.ready ? (sameDay ? hhmm(payAt) : 'pre-flight') : '—');
      }
    } catch (e) {}
    const tl2 = (name, v) => { const n = $$('share', name); if (n && v) txt(n.querySelector('[data-pencil-name="TL Time"]'), v); };
    tl2('TL Landed', hhmm(landed)); tl2('TL Online', hhmm(online)); tl2('TL In car', hhmm(car));
    if (landed) { const d = new Date(landed.replace(' ', 'T')); txt($$('share', 'Foot Date'), d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + ' · trip.com/landing'); }
    if (landed && car) { const m = Math.max(1, Math.round((new Date(car.replace(' ', 'T')) - new Date(landed.replace(' ', 'T'))) / 60000)); txt($$('done', 'Big Number'), m + ' min'); }
  }
  const FB = { wifi: 'FB Wi-Fi', payment: 'FB Payment', transport: 'FB Transport' };
  const FB_STYLE = {};
  async function feedback(which) {
    if (!FB_STYLE.on) { const on = $$('done', 'FB Wi-Fi'), off = $$('done', 'FB Payment'); if (on && off) { const pick = el => ({ bg: el.style.backgroundColor, border: el.style.outline, label: el.querySelector('[data-pencil-name="FB Label"]').style.color, icon: el.querySelector('svg') && el.querySelector('svg').style.color }); FB_STYLE.on = pick(on); FB_STYLE.off = pick(off); } }
    Object.entries(FB).forEach(([k, name]) => { const el = $$('done', name); if (!el) return; const st = k === which ? FB_STYLE.on : FB_STYLE.off; el.style.backgroundColor = st.bg; el.style.outline = st.border; const lb = el.querySelector('[data-pencil-name="FB Label"]'); if (lb) lb.style.color = st.label; const ic = el.querySelector('svg'); if (ic) ic.style.color = ic.style.fill = (k === which ? '#2C61FE' : '#6F7685'); });
    toast({ wifi: 'Thanks, recorded: Wi-Fi was hardest', payment: 'Thanks, recorded: payment was hardest', transport: 'Thanks, recorded: transport was hardest' }[which]);
    try { await post('/feedback/hardest', { step: which }); } catch (e) {}
  }

  // ---------- 动作分发 ----------
  window.lcHandle = (act, el) => {
    if (setupAct(act) || privacyAct(act) || routeAct(act) || genieAct(act)) return;
    if (act === 'consent') { consent(); return; }
    if (act === 'payconfirm') { S.payReturn = SETUP.ret; pay(SETUP.method); }
    else if (act === 'pay') { S.payReturn = null; pay('alipay'); }
    else if (act === 'paypick') payPick();                              // 行前检查"Payment in China"的按钮
    else if (act.startsWith('payretry:')) pay(act.slice(9));             // 失败页：重试或改用另一种，保留回到第三步
    else if (act === 'pay2') payFirst();
    else if (act === 'landing') landingEntry();
    else if (act === 'land') land();
    else if (act === 'stuck') stuckPick();
    else if (act === 'solved') solved();
    else if (act === 'incar') incar();
    else if (act === 'esim') post('/rules/preflight/done', { item: 'esim' }).then(() => toast('eSIM added · China mainland · US$4.9')).catch(() => toast('Demo：eSIM'));
    else if (act === 'transfer') post('/rules/preflight/done', { item: 'transfer' }).then(() => { toast('Transfer booked · driver will wait at arrivals'); setTimeout(() => show('preflight'), 800); }).catch(() => show('preflight'));
    else if (act.startsWith('fb:')) feedback(act.slice(3));
  };
  // 落地卡入口：有 eSIM 走已联网分支，否则走 Wi-Fi 分支
  async function landingEntry() {
    try { const d = await get('/rules/preflight'); const data = d.items.find(i => i.id === 'data'); show(data && data.status === 'done' ? 'online' : 'step1'); }
    catch (e) { show('step1'); }
  }
  // ---------- 三步进度列表 + 落地时间（step1 / online / step3 共用） ----------
  const hh = v => v ? v.slice(11, 16) : null;
  async function loadState() {
    const [pf, fl, tl] = await Promise.all([get('/rules/preflight'), get('/mock/flight'), get('/mock/timeline')]);
    const by = Object.fromEntries(pf.items.map(i => [i.id, i]));
    const at = ev => (tl.find(x => x.event === ev) || {}).at;
    return { pf, by, fl, landed: hh(fl.landed_at), online: hh(at('online')), car: hh(at('in_car')), paid: payState(pf), landedDay: (fl.landed_at || '').slice(0, 10) };
  }
  function stepList(route) {
    const rows = ['Step Get online', 'Step Pay like a local', 'Step Get to your hotel'].map(n => $$(route, n));
    return rows.every(Boolean) ? rows : null;
  }
  const STEP_STYLE = {};
  function snapStepStyles(route) {
    if (STEP_STYLE.done) return;
    const rows = stepList('step3'); if (!rows) return;               // step3 里三种状态齐全：done, done, now
    const s1 = stepList('step1'); if (!s1) return;                    // step1 里第三行是 next
    const pick = (row) => ({ num: row.querySelector('[data-pencil-name="Step Num"]').outerHTML, rowBg: row.style.backgroundColor, titleColor: row.querySelector('[data-pencil-name="Step Title"]').style.color, descColor: row.querySelector('[data-pencil-name="Step Desc"]').style.color, iconHTML: row.querySelector('[data-pencil-name="Step Icon"]').outerHTML });
    STEP_STYLE.done = pick(rows[0]); STEP_STYLE.now = pick(rows[2]); STEP_STYLE.next = pick(s1[2]);
  }
  function applyStep(row, state, desc, iconName) {
    const st = STEP_STYLE[state]; if (!st) return;
    row.style.backgroundColor = st.rowBg;
    const num = row.querySelector('[data-pencil-name="Step Num"]'); if (num) { const t = document.createElement('div'); t.innerHTML = st.num; const n = t.firstElementChild; const txtEl = n.querySelector('[data-pencil-name="Num Text"]'); if (txtEl) txtEl.textContent = iconName; num.replaceWith(n); }
    const ti = row.querySelector('[data-pencil-name="Step Title"]'); if (ti) ti.style.color = st.titleColor;
    const de = row.querySelector('[data-pencil-name="Step Desc"]'); if (de) { de.style.color = st.descColor; de.textContent = desc; }
    const ic = row.querySelector('[data-pencil-name="Step Icon"]'); if (ic) ic.style.color = ic.style.fill = (state === 'next' ? '#DADFE6' : state === 'done' ? '#1BA672' : '#2C61FE');
  }
  async function renderSteps(route) {
    let S0; try { S0 = await loadState(); } catch (e) { return; }
    snapStepStyles(route);
    const payOk0 = S0.paid.ready;
    if (route === 'wifi') { const ob = $$('wifi', 'Open Settings'); if (ob) { ob.dataset.act = payOk0 ? 'go:step3' : 'api:pay2'; txt($$('wifi', 'Open Label'), payOk0 ? "I'm online · continue to step 3" : "I'm online · verify payment next"); } return S0; }
    const rows = stepList(route) || [];
    const onlineDone = route === 'step3' || route === 'online' || !!S0.online;
    const dataOk = route === 'online' || (S0.by.data && S0.by.data.status === 'done');
    // 页头三段进度条代替原来的任务清单：完成=薄荷绿，付款没验证=琥珀，当前=白，未到=半透明
    const segs = $all(route, 'Seg 1').concat($all(route, 'Seg 2'), $all(route, 'Seg 3'));
    const segC = st => ({ done: '#7CE0B6', warn: '#FFC56B', now: '#FFFFFF', next: '#FFFFFF55' }[st]);
    if (segs.length === 3) {
      const st = route === 'step3' ? ['done', S0.paid.ready ? 'done' : 'warn', 'now'] : ['now', S0.paid.ready ? 'done' : 'next', 'next'];
      segs.forEach((g, i) => { g.style.backgroundColor = segC(st[i]); });
    }
    if (route === 'online') {
      txt($$('online', 'Up Next Title'), S0.paid.ready ? 'Get to your hotel' : 'Pay like a local');
      txt($$('online', 'Up Next Sub'), S0.paid.ready ? `${S0.paid.name} already verified · we'll pick your ride` : '¥1 test with Alipay or TenPayGo · 10 s');
    }
    if (route === 'step3') step3PayNote(S0.paid);
    if (rows.length) applyStep(rows[0], onlineDone ? 'done' : 'now',
      onlineDone ? (dataOk ? 'Passed automatically · own data works' : `Done${S0.online ? ' ' + S0.online : ''} · PVG free Wi-Fi`) : 'Checking own data first · Wi-Fi only if needed', '1');
    const payOk = S0.paid.ready, paidToday = payOk && S0.paid.at && S0.landedDay && S0.paid.at.slice(0, 10) === S0.landedDay;
    if (rows.length) applyStep(rows[1], payOk ? 'done' : 'now', payOk ? (paidToday ? `${S0.paid.name} verified at ${hh(S0.paid.at)} · ¥1 test ${S0.paid.fate || 'refunded'}` : `${S0.paid.name} verified before you flew · ¥1 test ${S0.paid.fate || 'refunded'}`) : 'Not verified yet · ¥1 test with Alipay or TenPayGo', '2');
    const carState = route === 'step3' ? 'now' : 'next';
    if (rows.length) applyStep(rows[2], carState, route === 'step3' ? 'In progress · tap “I\'m in the car” when moving' : 'Up next · we\'ll recommend a ride once you\'re online', '3');
    const landedTxt = S0.landed ? `Landed at PVG T2 · ${S0.landed} local` : 'Not landed yet · preview';
    if (route === 'step1') { txt($$('step1', 'Subtitle'), landedTxt + ' · one thing at a time'); txt($$('step1', 'Task Sub'), `Checked eSIM and roaming · no connection${S0.landed ? ' at ' + S0.landed : ''}`); }
    if (route === 'online') {
      txt($$('online', 'Subtitle'), landedTxt + (payOk ? ' · nothing to do here' : ' · one thing left before your ride'));
      const pb = $$('online', 'Primary Button'), pl = $$('online', 'Primary Label');
      if (pb && pl) { pb.dataset.act = payOk ? 'go:step3' : 'api:pay2'; txt(pl, payOk ? 'Next · Get to your hotel' : 'Next · Verify payment'); pb.style.backgroundColor = payOk ? '#1BA672' : '#2C61FE'; }
      txt($$('online', 'Task Desc'), payOk ? 'We checked: mobile data is on, pages load, and international services respond. You can skip airport Wi-Fi.' : 'We checked: mobile data is on and pages load. Next, run the ¥1 payment test so you can pay at the taxi queue.');
    }
    if (route === 'step3') { txt($$('step3', 'Subtitle'), `${S0.online ? 'Online since ' + S0.online : 'Online'} · ${payOk ? 'payment verified' : 'payment not verified'} · last step`); }
    return S0;
  }

  // ---------- My Trips 落地检查卡 ----------
  const PILL = {};
  async function renderTripsCard() {
    let d; try { d = await get('/rules/preflight'); } catch (e) { return; }
    if (!PILL.todo) { const w = $$('trips', 'Pill Wi-Fi'), a = $$('trips', 'Pill Alipay'); if (!w || !a) return; PILL.todo = w.outerHTML; PILL.done = a.outerHTML; }
    const by = Object.fromEntries(d.items.map(i => [i.id, i]));
    const ps = payState(d);
    const states = { 'Pill Wi-Fi': { ok: by.data && by.data.status === 'done', label: 'Wi-Fi' }, 'Pill Alipay': { ok: ps.ready, label: ps.ready ? ps.name : 'Payment' }, 'Pill Hotel': { ok: true, label: 'Hotel' } };
    let open = 0;
    Object.entries(states).forEach(([name, st]) => {
      const el = $$('trips', name); if (!el) return;
      const t = document.createElement('div'); t.innerHTML = st.ok ? PILL.done : PILL.todo; const n = t.firstElementChild;
      n.setAttribute('data-pencil-name', name); txt(n.querySelector('[data-pencil-name="Pill Label"]'), st.label); el.replaceWith(n);
      if (!st.ok) open++;
    });
    try { const fl = await get('/mock/flight'); if (fl.landed_at) { txt($$('trips', 'LC Where Text'), `Landed at PVG · Terminal 2 · ${hh(fl.landed_at)}`); const b = $$('trips', 'Booking CX 362 · HKG → PVG'); if (b) txt(b.querySelector('[data-pencil-name="Booking Sub"]'), `Landed ${hh(fl.landed_at)} · Baggage belt 12`); } } catch (e) {}
    txt($$('trips', 'LC Sub'), open === 0 ? 'Everything is ready. Tap to see your route to the hotel.' : `${open} of 3 things still to sort out before you leave the airport.`);
  }
  window.lcOnShow = route => {
    if (route === 'trips') renderTripsCard();
    if (route === 'step1' || route === 'online' || route === 'step3') renderSteps(route);
    if (route === 'preflight') privacyGate().then(gated => { if (!gated) { renderPreflight(); startPack(); } });
    if (route === 'step3') renderTransport();
    if (route === 'transit') transitMap();
    if (route === 'done') renderDone();
    if (route === 'online' || route === 'wifi' || route === 'step3') post('/mock/event', { event: 'online' }).then(() => { if (route === 'step3') renderSteps('step3'); if (route === 'wifi') renderSteps('wifi'); }).catch(() => {});
  };

  // ---------- 演示控制：加进右上角菜单 ----------
  const list = document.getElementById('list');
  if (list) {
    const sep = document.createElement('div'); sep.style.cssText = 'border-top:1px solid #DADFE6;margin:4px 0';
    list.appendChild(sep);
    const mk = (label, fn) => { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; list.appendChild(b); return b; };
    const nb = mk('🌙 深夜落地模式：关', () => { S.night = !S.night; nb.textContent = '🌙 深夜落地模式：' + (S.night ? '开' : '关'); renderTransport(); toast(S.night ? '交通推荐按 23:40 落地计算' : '恢复 14:20 落地'); });
    const failSim = m => async () => { try { const r = await post('/mock/pay-test?fail=1&method=' + m); renderPayFail(m, r, await otherVerified(m)); show('payment'); } catch (e) { toast('后端不可达'); } };
    mk('💳 模拟支付失败（支付宝）', failSim('alipay'));
    mk('💳 模拟支付失败（TenPayGo）', failSim('tenpaygo'));
  }
  const stuckQ = qs.get('stuck'); if (stuckQ) get(`/kb/entry/${stuckQ}?lang=en`).then(e => { fillEntry(e); show('stuck'); }).catch(() => toast('No such entry'));
  snapStepStyles('step3'); captureIcons(); snapPay();
  renderPreflight();
  const cur = document.querySelector('.screen.on'); if (cur) window.lcOnShow(cur.dataset.route);
})();
