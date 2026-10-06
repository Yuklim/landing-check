/* Landing Check H5 · 后端接入层
 * 接口地址：?api=https://xxx  >  localStorage.lc_api  >  非 github.io 时默认本机 8000  >  空 = 静态模式
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
  const S0 = () => ({ entry: null, lastShot: null, night: false, payReturn: null });
  const S = S0();
  const el = (tag, style, text) => { const n = document.createElement(tag); if (style) n.style.cssText = style; if (text != null) n.textContent = text; return n; };
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  const $$ = (route, name) => document.querySelector(`.screen[data-route="${route}"] [data-pencil-name="${name}"]`);
  const $all = (route, name) => [...document.querySelectorAll(`.screen[data-route="${route}"] [data-pencil-name="${name}"]`)];
  const txt = (el, v) => { if (el && v != null) el.textContent = v; };
  const ok = r => { if (!r.ok) throw new Error(r.status); return r.json(); };
  const get = p => fetch(API + p).then(ok);
  const post = (p, body, isForm) => fetch(API + p, isForm ? { method: 'POST', body } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }).then(ok);

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
  // 行前检查 · 支付项下挂图文教程入口；截图张数从 tutorials.json 读
  function guideLink(id) {
    const link = el('div', `display:flex;align-items:center;gap:6px;padding-left:38px;cursor:pointer;font:600 12px/1.3 Inter,system-ui,sans-serif;color:${BLUE}`);
    link.setAttribute('data-pencil-name', 'Item Guide Link');
    link.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="${BLUE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg><span></span>`;
    const label = link.lastChild; label.textContent = 'Step-by-step setup guide ›';
    loadTutorials().then(list => {
      const media = (list.find(t => t.id === id) || {}).media || [], v = media.filter(m => /\.(mp4|webm)$/i.test(m.file)).length, s = media.length - v;
      const parts = [v && `${v} animation${v > 1 ? 's' : ''}`, s && `${s} screenshot${s > 1 ? 's' : ''}`].filter(Boolean);
      if (parts.length) label.textContent = `Step-by-step setup guide · ${parts.join(' · ')} ›`;
    });
    link.onclick = ev => { ev.stopPropagation(); openTutorial(id); };
    return link;
  }
  (() => { const item = $$('preflight', 'Item Alipay payment'); if (item) item.appendChild(guideLink('alipay_setup_before_flight')); })();

  // ---------- 支付方式：支付宝 / TenPayGo 并列，任一个 ¥1 验证即就绪（运行时注入，静态模式也可用） ----------
  const PAY_NAME = { alipay: 'Alipay', tenpaygo: 'TenPayGo' };
  const OTHER = { alipay: 'tenpaygo', tenpaygo: 'alipay' };
  // 行前检查 · 克隆支付宝一行，放在它正下方。克隆前去掉设计稿 id，按钮改挂 TenPayGo 的动作
  (() => {
    const ali = $$('preflight', 'Item Alipay payment'); if (!ali || $$('preflight', 'Item TenPayGo payment')) return;
    const row = ali.cloneNode(true);
    row.setAttribute('data-pencil-name', 'Item TenPayGo payment');
    [row, ...row.querySelectorAll('[data-pencil-id]')].forEach(n => n.removeAttribute('data-pencil-id'));
    row.querySelectorAll('[data-pencil-name="Item Guide Link"]').forEach(n => n.remove());
    txt(row.querySelector('[data-pencil-name="Item Title"]'), 'TenPayGo payment');
    // 静态模式下的默认文案（同设计稿里其他行一样是演示值）；接后端时 renderPreflight 用 /rules/preflight 的 desc 覆盖
    txt(row.querySelector('[data-pencil-name="Item Desc"]'), 'Not installed · either one is enough · email sign-up, no Chinese number');
    const btn = row.querySelector('[data-pencil-name="Item Button"]'); if (btn) btn.dataset.act = 'api:paytpg';
    row.appendChild(guideLink('tenpaygo_setup_before_flight'));
    ali.after(row);
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
  const PAY_COPY = {
    tenpaygo: {
      'Result Title': 'Your TenPayGo works in China',
      'Result Sub': '¥1.00 charged via TenPayGo at 08:31 · Visa ••4471\nRefund issued · back on your card in 1–3 days',
      how2: ['TenPayGo is linked to that card on this phone', 'Installed is not enough. This proves the link is live.'],
      'Fail Title': "If the test fails, we read TenPayGo's error for you",
      'Fail Desc': "ISSUER_DECLINED → allow international online payments in your bank app\nAUTH_FAILED → approve your bank's 3-D Secure check\nREGION_UNAVAILABLE → retest after landing, or verify Alipay now",
      'Source': 'Test uses a Trip.com WeChat Pay code that TenPayGo pays · no new permissions',
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
  }
  function renderPayOk(method, r) {
    applyPayCopy(method); setPayTone(false);
    if (r && r.verified_at) {
      multiline('Result Sub', `¥1.00 charged via ${PAY_NAME[method]} at ${r.verified_at.slice(11, 16)} · ${r.card}\nRefund issued · back on your card in 1–3 days`);
      txt($$('payment', 'Chip Label'), 'VERIFIED · ' + r.verified_at.slice(5, 10).replace('-', '/'));
    }
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

  // 落地流程里"先验证支付"：底部选择层，选支付宝或 TenPayGo
  const chooser = el('div', 'position:absolute;inset:0;z-index:70;display:none;flex-direction:column;justify-content:flex-end;background:rgba(18,24,38,.45)');
  chooser.setAttribute('data-pencil-name', 'Pay Chooser');
  const opt = (m, title, sub) => `<div data-pay="${m}" class="tap" style="display:flex;align-items:center;gap:12px;padding:14px;border:1px solid ${LINE};border-radius:12px;margin-top:10px;cursor:pointer"><div style="flex:1;min-width:0"><div style="font:700 15px/1.3 Inter,system-ui,sans-serif;color:${INK}">${title}</div><div style="font:400 12px/1.4 Inter,system-ui,sans-serif;color:${MUTED};margin-top:2px">${sub}</div></div><div style="flex:none;border:1px solid ${BLUE};color:${BLUE};border-radius:4px;padding:6px 10px;font:700 12px Inter,system-ui,sans-serif">Verify ¥1</div></div>`;
  chooser.innerHTML = `<div style="background:#fff;border-radius:16px 16px 0 0;padding:20px 20px 30px;box-sizing:border-box">
      <div style="font:700 17px/1.3 Inter,system-ui,sans-serif;color:${INK}">Verify payment first</div>
      <div style="font:400 13px/1.45 Inter,system-ui,sans-serif;color:${MUTED};margin-top:4px">A ¥1 test, refunded. Either one is enough.</div>
      ${opt('alipay', 'Alipay', 'Also books DiDi rides and buys metro tickets')}
      ${opt('tenpaygo', 'TenPayGo', 'Email sign-up · pays wherever WeChat Pay works')}
      <div data-pay="" style="text-align:center;padding:16px 0 0;font:600 14px Inter,system-ui,sans-serif;color:${MUTED};cursor:pointer">Not now</div>
    </div>`;
  (document.getElementById('phone') || document.body).appendChild(chooser);
  function choosePay() {
    return new Promise(res => {
      chooser.style.display = 'flex';
      chooser.onclick = ev => { const b = ev.target.closest('[data-pay]'); if (!b && ev.target !== chooser) return; chooser.style.display = 'none'; res(b ? (b.dataset.pay || null) : null); };
    });
  }
  // 静态模式：不调接口，直接显示对应方式的成功页
  function staticPay(m) { renderPayOk(m); show('payment'); }
  window.lcPayStatic = act => {
    if (act === 'pay') { staticPay('alipay'); return true; }
    if (act === 'paytpg') { staticPay('tenpaygo'); return true; }
    if (act.startsWith('payretry:')) { staticPay(act.slice(9)); return true; }
    if (act === 'pay2') { choosePay().then(m => { if (m) staticPay(m); }); return true; }
    return false;
  };
  const menuList = document.getElementById('list');
  if (menuList) {
    const sep = document.createElement('div'); sep.style.cssText = 'border-top:1px solid #DADFE6;margin:4px 0'; menuList.appendChild(sep);
    loadTutorials().then(list => list.forEach(t => { const b = document.createElement('button'); b.textContent = '📖 ' + t.title; b.onclick = () => openTutorial(t.id); menuList.appendChild(b); }));
  }

  if (!API) { status('静态模式'); window.lcHandle = (act) => staticHandle(act); window.lcOnShow = () => {}; return; }
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
    // 支付组里的备用项：沿用"可选"的灰色底，图标换成银行卡（可选项原图标是车，放在支付行会误导）
    if (ICONS.optional) {
      const t = document.createElement('div'); t.innerHTML = ICONS.optional; const s = t.firstElementChild, svg = s.querySelector('svg');
      if (svg) { svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none'); svg.innerHTML = '<rect x="3" y="6" width="18" height="13" rx="2" stroke="#6F7685" stroke-width="2"/><path d="M3 10.5h18" stroke="#6F7685" stroke-width="2"/>'; }
      ICONS.backup = s.outerHTML;
    }
  }
  const ITEM_NODE = { permissions: 'Item Location & notifications', data: 'Item Mobile data in China', alipay: 'Item Alipay payment', tenpaygo: 'Item TenPayGo payment', transfer: 'Item Ride from the airport', car: 'Item Car rental', tickets: 'Item Palace Museum reservation', passport: 'Item Passport', pack: 'Item Offline landing pack' };
  async function renderPreflight() {
    let d; try { d = await get('/rules/preflight'); } catch (e) { return; }
    if (!ICONS.done) captureIcons();
    txt($$('preflight', 'Progress Label'), d.summary); txt($$('preflight', 'Progress Pct'), d.pct + '%');
    const fill = $$('preflight', 'Fill'); if (fill) fill.style.width = Math.round(337 * d.pct / 100) + 'px';
    d.items.forEach(it => {
      const node = $$('preflight', ITEM_NODE[it.id]); if (!node) return;
      txt(node.querySelector('[data-pencil-name="Item Desc"]'), it.desc);
      const st = node.querySelector('[data-pencil-name="State"]');
      const icon = it.group && it.status === 'optional' ? ICONS.backup : ICONS[it.status];
      if (st && icon) { const t = document.createElement('div'); t.innerHTML = icon; st.replaceWith(t.firstElementChild); }
      const btn = node.querySelector('[data-pencil-name="Item Button"]'); if (btn) btn.style.visibility = it.status === 'done' ? 'hidden' : 'visible';
    });
  }

  // ---------- 支付验证（文案切换见前面"支付方式"一节） ----------
  async function pay(method) {
    method = PAY_NAME[method] ? method : 'alipay';
    toast(`Charging ¥1 via ${PAY_NAME[method]}…`);
    try {
      const r = await post('/mock/pay-test?method=' + method);
      if (r.status === 'verified') {
        renderPayOk(method, r); show('payment'); renderPreflight();
        if (S.payReturn) { const to = S.payReturn; S.payReturn = null; const btn = $$('payment', 'Done Button'); if (btn) { btn.dataset.act = 'go:' + to; txt($$('payment', 'Done Label'), 'Continue to step 3 · Get to your hotel'); } }
      } else { renderPayFail(method, r, await otherVerified(method)); show('payment'); }
    } catch (e) {
      // 请求没发出去：显示本次方式的"连不上"，不能留着上一次（可能是另一种方式的成功页）
      toast('后端不可达');
      renderPayFail(method, { error_code: 'NO_CONNECTION', hint: 'We could not reach Trip.com. Check your connection and try again.' }, false); show('payment');
    }
  }
  async function otherVerified(method) {
    try { const pf = await get('/rules/preflight'); return !!(pf.payment && pf.payment.verified.includes(OTHER[method])); } catch (e) { return false; }
  }
  // 落地流程里支付未就绪：先选方式再验证，成功后回到第三步
  async function payFirst() { const m = await choosePay(); if (!m) return; S.payReturn = 'step3'; pay(m); }
  // 支付组状态；旧后端没有 payment 字段时只看支付宝
  function payState(pf) {
    if (pf && pf.payment) return { ready: !!pf.payment.ready, method: pf.payment.primary, name: pf.payment.primary_name, at: pf.payment.verified_at };
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
  function stuckPick() { picker.value = ''; picker.click(); }
  picker.onchange = async () => {
    const f = picker.files[0]; if (!f) return;
    S.lastShot = f; show('stuck'); renderStuckLoading();
    const fd = new FormData(); fd.append('image', f); fd.append('lang', 'en');
    try { renderStuck(await withTimeout(post('/stuck/classify', fd, true), 15000)); }
    catch (e) { toast('Recognition unavailable, showing offline guidance'); renderStuck({ decision: 'unknown', mode: 'offline', scenario: 'unknown', advice: null, confidence: 0 }); }
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
    txt($$('stuck', 'Rec Label'), 'ANALYSING…'); txt($$('stuck', 'Shot Title'), 'Reading your screenshot'); txt($$('stuck', 'Shot Why'), 'Usually takes 1–2 seconds.');
    const img = $$('stuck', 'Thumb'); if (img && S.lastShot) { img.style.backgroundImage = `url(${URL.createObjectURL(S.lastShot)})`; img.style.backgroundSize = 'cover'; [...img.children].forEach(c => c.style.visibility = 'hidden'); }
  }
  // 转人工卡片：导出稿里两行都是 nowrap 且父容器没 min-width，长文字会溢出；运行时改成可换行
  const SUP = {};
  function supCard(fallback) {
    const t = $$('stuck', 'Sup Title'), sub = $$('stuck', 'Sup Sub'), box = $$('stuck', 'Sup Texts');
    if (!SUP.init) { SUP.init = true; SUP.title = t ? t.textContent : ''; SUP.sub = sub ? sub.textContent : ''; if (box) box.style.minWidth = '0'; [t, sub].forEach(n => { if (n) { n.style.whiteSpace = 'normal'; n.style.width = '100%'; } }); if (sub) sub.style.lineHeight = '16px'; }
    txt(t, SUP.title);
    txt(sub, fallback ? fallback + ' · Or chat with Trip.com support in English, 24/7, with this screenshot attached.' : SUP.sub);
  }
  function fillEntry(e) {
    S.entry = e.id;
    txt($$('stuck', 'Rec Label'), 'RECOGNIZED · ' + (e.scenario || '').toUpperCase()); txt($$('stuck', 'Shot Title'), e.title); txt($$('stuck', 'Shot Why'), e.why);
    const stT = $$('stuck', 'Steps Title'); txt(stT, 'Do this now'); if (stT) { stT.style.cursor = ''; stT.onclick = null; window.lcHasTutorial(e.id).then(has => { if (!has || S.entry !== e.id) return; txt(stT, 'Do this now · See it step by step ›'); stT.style.cursor = 'pointer'; stT.onclick = () => window.lcTutorial(e.id); }); }
    stepRows().forEach((row, i) => { row.style.display = e.steps[i] ? '' : 'none'; if (e.steps[i]) setStepRow(row, e.steps[i]); row.onclick = null; });
    supCard(e.fallback);
    txt($$('stuck', 'Src Text'), `Steps from ${e.sources[0].name.split('·')[0].trim()} · verified ${e.verified_at}`);
  }
  function renderStuck(d) {
    if (d.decision === 'answer') { fillEntry(d.entry); toast(`${d.mode === 'model' ? 'Model' : 'Rules'} · ${d.confidence} · ${d.latency_ms} ms`); return; }
    if (d.decision === 'ask') {
      S.entry = null;
      txt($$('stuck', 'Rec Label'), 'NOT SURE · ' + (d.scenario || '').toUpperCase()); txt($$('stuck', 'Shot Title'), 'Which of these is it?'); txt($$('stuck', 'Shot Why'), 'The screenshot could mean a few things. Tap the one that matches.');
      txt($$('stuck', 'Steps Title'), 'Tap one');
      stepRows().forEach((row, i) => { const c = d.candidates[i]; row.style.display = c ? '' : 'none'; if (!c) return; txt(row.querySelector('[data-pencil-name="Step Title"]'), c.title); const cd = row.querySelector('[data-pencil-name="Step Desc"]'); if (cd) { cd.textContent = `Confidence ${c.confidence}`; cd.style.display = ''; } row.style.cursor = 'pointer'; row.onclick = async () => fillEntry(await get(`/kb/entry/${c.entry_id}?lang=en`)); });
      txt($$('stuck', 'Src Text'), `Confidence ${d.confidence} · ${d.mode}`); return;
    }
    S.entry = null;
    txt($$('stuck', 'Rec Label'), 'NOT COVERED YET'); txt($$('stuck', 'Shot Title'), "We don't have this one yet"); txt($$('stuck', 'Shot Why'), d.advice ? 'AI suggestion, not verified by us:' : 'Try the support chat below.');
    txt($$('stuck', 'Steps Title'), d.advice ? 'AI suggestion · unverified' : 'What you can do');
    const lines = d.advice ? d.advice.split(/(?<=[.!?])\s+/).slice(0, 3) : ['Show the screen to a staff member nearby.', 'Open the app\'s English support if it has one.', 'Chat with Trip.com support below.'];
    stepRows().forEach((row, i) => { row.style.display = lines[i] ? '' : 'none'; if (lines[i]) setStepRow(row, lines[i]); row.onclick = null; });
    txt($$('stuck', 'Src Text'), 'Not from the knowledge base · ' + d.mode);
  }
  async function solved() { if (S.entry) { try { await post('/kb/feedback', { entry_id: S.entry, solved: true }); } catch (e) {} } S.entry = null; toast('Thanks, recorded'); back(); }

  // ---------- 第三步交通 ----------
  // 只验证了 TenPayGo 时，依赖支付宝的方式（支付宝里的滴滴、地铁售票机）带一行提示（后端 rules.transport 给 pay_note）
  const payNote = t => el('div', 'font-size:12px;line-height:1.35;color:#B25E00;margin-top:6px', t);
  async function renderTransport() {
    let d; try { d = await get('/rules/transport' + (S.night ? '?landed_at=23:40' : '')); } catch (e) { return; }
    const r = d.recommended;
    txt($$('step3', 'Task Title'), 'We recommend ' + ({ taxi: 'a taxi', metro: 'the metro', transfer: 'your booked transfer', didi: 'a DiDi ride', maglev: 'the Maglev' }[r.id] || r.title));
    txt($$('step3', 'Task Sub'), `About ${r.price} · ${r.min} min · ${r.where}`); txt($$('step3', 'Task Desc'), 'Why: ' + r.why);
    $all('step3', 'Chip Label').forEach((c, i) => txt(c, d.facts[i]));
    const rows = [$$('step3', 'Option Metro Line 2'), $$('step3', 'Option Trip.com transfer')];
    rows.forEach((row, i) => { const a = d.alternatives[i]; if (!row) return; row.style.display = a ? '' : 'none'; if (!a) return; txt(row.querySelector('[data-pencil-name="Opt Title"]'), a.title); txt(row.querySelector('[data-pencil-name="Opt Meta"]'), `${a.price} · ${a.min} min · ${a.where}`); txt(row.querySelector('[data-pencil-name="Opt Button Label"]'), a.action === 'transit' ? 'Route' : a.action === 'transfer' ? 'Book' : 'Open'); row.querySelector('[data-pencil-name="Opt Button"]').dataset.act = a.action === 'transit' ? 'go:transit' : a.action === 'transfer' ? 'go:transfers' : 'toast:Demo：打开支付宝里的滴滴小程序'; });
    const g = r.go_to || {};
    txt($$('step3', 'Task Desc'), 'Why: ' + r.why);
    const cur = $$('step3', 'Current Task');
    let go = cur && cur.querySelector('.lc-goto');
    if (cur && !go) { go = el('div', 'width:100%;background:#EAF0FF;border-radius:10px;padding:14px 16px;box-sizing:border-box;font-family:Inter,system-ui,sans-serif'); go.className = 'lc-goto'; cur.insertBefore(go, $$('step3', 'Primary Button')); }
    if (go) { go.replaceChildren(el('div', 'font-size:11px;font-weight:700;letter-spacing:.06em;color:#2C61FE', 'WHERE TO GO'), el('div', 'font-size:18px;font-weight:700;color:#121826;margin:4px 0 6px', g.title || r.title), el('div', 'font-size:14px;line-height:1.4;color:#121826', g.where || r.where)); if (g.verified === false) go.appendChild(el('div', 'font-size:11px;color:#8592A6;margin-top:6px', 'Location to be verified on site')); if (r.pay_note) go.appendChild(payNote(r.pay_note)); }
    const alt = $$('step3', 'Alt Options'); if (alt) alt.style.display = 'none';
    const sl = $$('step3', 'Step List');
    if (sl) {
      let ow = sl.parentElement.querySelector('.lc-otherways');
      if (!ow) { ow = el('div', 'width:100%;background:#fff;border-radius:8px;overflow:hidden;margin-top:10px'); ow.className = 'lc-otherways'; sl.after(ow); }
      ow.replaceChildren(el('div', 'padding:12px 14px 4px;font:700 13px Inter,system-ui,sans-serif;color:#6F7685', 'Other ways'));
      d.alternatives.forEach(a => {
        const row = el('div', 'display:flex;align-items:center;gap:12px;padding:12px 14px;border-top:1px solid #DADFE6;font-family:Inter,system-ui,sans-serif;cursor:pointer'); row.className = 'tap';
        row.dataset.act = a.action === 'transit' ? 'go:transit' : a.action === 'transfer' ? 'go:transfers' : 'toast:Demo：打开支付宝里的滴滴小程序';
        const left = el('div', 'flex:1;min-width:0');
        left.append(el('div', 'font-size:15px;font-weight:700;color:#121826', a.title), el('div', 'font-size:13px;color:#6F7685;margin-top:2px', `${a.price} · ${a.min} min`), el('div', 'font-size:13px;color:#121826;margin-top:4px;line-height:1.35', (a.go_to && a.go_to.where) || a.where));
        if (a.pay_note) left.append(payNote(a.pay_note));
        row.append(left, el('div', 'flex-shrink:0;border:1px solid #2C61FE;color:#2C61FE;border-radius:4px;padding:7px 12px;font-size:12px;font-weight:700', a.action === 'transit' ? 'Route' : a.action === 'transfer' ? 'Book' : 'Open'));
        ow.appendChild(row);
      });
    }
    const pb = $$('step3', 'Primary Button'); if (pb) pb.dataset.act = r.id === 'metro' || r.id === 'maglev' ? 'go:transit' : 'go:driver';
    txt($$('step3', 'Primary Label'), r.id === 'transfer' ? 'Show my booking to the driver' : r.id === 'metro' || r.id === 'maglev' ? 'Open the route' : 'Show address to driver');
    try { const pf = await get('/rules/preflight'); if (!payState(pf).ready && pb) { pb.dataset.act = 'api:pay2'; txt($$('step3', 'Primary Label'), 'Verify payment first · ¥1 test'); } } catch (e) {}
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
        txt(prow.querySelector('[data-pencil-name="Event Title"]'), !ps.ready ? 'Payment not verified' : sameDay ? `${ps.name} verified · ¥1 test` : `${ps.name} verified before flight`);
        txt(prow.querySelector('[data-pencil-name="Event Time"]'), ps.ready ? (sameDay ? hhmm(payAt) : 'before flight') : '—');
        const sp = $$('share', 'TL Paid'); if (sp) txt(sp.querySelector('[data-pencil-name="TL Time"]'), ps.ready ? (sameDay ? hhmm(payAt) : 'pre-flight') : '—');
      }
    } catch (e) {}
    const tl2 = (name, v) => { const n = $$('share', name); if (n && v) txt(n.querySelector('[data-pencil-name="TL Time"]'), v); };
    tl2('TL Landed', hhmm(landed)); tl2('TL Online', hhmm(online)); tl2('TL In car', hhmm(car));
    if (landed) { const d = new Date(landed.replace(' ', 'T')); txt($$('share', 'Foot Date'), d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + ' · trip.com/landing'); }
    if (landed && car) { const m = Math.max(1, Math.round((new Date(car.replace(' ', 'T')) - new Date(landed.replace(' ', 'T'))) / 60000)); txt($$('done', 'Big Number'), m + ' min'); txt($$('share', 'Big Number'), String(m)); txt($$('done', 'Share Title'), `Share your ${m}-minute card`); txt($$('share', 'Share Title'), `Share your ${m}-minute card`); }
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
    if (act === 'pay') { S.payReturn = null; pay('alipay'); }              // 行前检查里的两个 Verify ¥1
    else if (act === 'paytpg') { S.payReturn = null; pay('tenpaygo'); }
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
    const rows = stepList(route); if (!rows) return;
    const onlineDone = route === 'step3' || route === 'online' || !!S0.online;
    const dataOk = route === 'online' || (S0.by.data && S0.by.data.status === 'done');
    applyStep(rows[0], onlineDone ? 'done' : 'now',
      onlineDone ? (dataOk ? 'Passed automatically · own data works' : `Done${S0.online ? ' ' + S0.online : ''} · PVG free Wi-Fi`) : 'Checking own data first · Wi-Fi only if needed', '1');
    const payOk = S0.paid.ready, paidToday = payOk && S0.paid.at && S0.landedDay && S0.paid.at.slice(0, 10) === S0.landedDay;
    applyStep(rows[1], payOk ? 'done' : 'now', payOk ? (paidToday ? `${S0.paid.name} verified at ${hh(S0.paid.at)} · ¥1 test refunded` : `${S0.paid.name} verified before you flew · ¥1 test refunded`) : 'Not verified yet · ¥1 test with Alipay or TenPayGo', '2');
    const carState = route === 'step3' ? 'now' : 'next';
    applyStep(rows[2], carState, route === 'step3' ? 'In progress · tap “I\'m in the car” when moving' : 'Up next · we\'ll recommend a ride once you\'re online', '3');
    const landedTxt = S0.landed ? `Landed at PVG T2 · ${S0.landed} local` : 'Not landed yet · preview';
    if (route === 'step1') { txt($$('step1', 'Subtitle'), landedTxt + ' · one thing at a time'); txt($$('step1', 'Task Sub'), `Checked eSIM and roaming · no connection${S0.landed ? ' at ' + S0.landed : ''}`); }
    if (route === 'online') {
      txt($$('online', 'Subtitle'), landedTxt + (payOk ? ' · nothing to do here' : ' · one thing left before your ride'));
      const pb = $$('online', 'Primary Button'), pl = $$('online', 'Primary Label');
      if (pb && pl) { pb.dataset.act = payOk ? 'go:step3' : 'api:pay2'; txt(pl, payOk ? 'Continue to step 3 · Get to your hotel' : 'Continue to step 2 · Verify payment'); pb.style.backgroundColor = payOk ? '#1BA672' : '#2C61FE'; }
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
    if (route === 'preflight') renderPreflight();
    if (route === 'step3') renderTransport();
    if (route === 'done' || route === 'share') renderDone();
    if (route === 'online' || route === 'wifi' || route === 'step3') post('/mock/event', { event: 'online' }).then(() => { if (route === 'step3') renderSteps('step3'); if (route === 'wifi') renderSteps('wifi'); }).catch(() => {});
  };

  // ---------- 演示控制：加进右上角菜单 ----------
  const list = document.getElementById('list');
  if (list) {
    const sep = document.createElement('div'); sep.style.cssText = 'border-top:1px solid #DADFE6;margin:4px 0';
    list.appendChild(sep);
    const mk = (label, fn) => { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; list.appendChild(b); return b; };
    mk('🔄 重置演示数据', async () => { try { await post('/mock/reset'); Object.assign(S, S0()); toast('已重置'); setTimeout(() => location.reload(), 400); } catch (e) { toast('后端不可达'); } });
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
