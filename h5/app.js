/* Landing Check H5 · 后端接入层
 * 接口地址：?api=https://xxx  >  localStorage.lc_api  >  非 github.io 时默认本机 8000  >  空 = 静态模式
 * 接口失败时页面保持设计稿里的静态内容，只弹一条提示。
 */
(function () {
  const qs = new URLSearchParams(location.search);
  let API = qs.get('api') || localStorage.getItem('lc_api') || (location.hostname.endsWith('github.io') ? '' : 'http://127.0.0.1:8000');
  if (qs.get('api')) localStorage.setItem('lc_api', qs.get('api'));
  API = API.replace(/\/$/, '');
  const S = { entry: null, lastShot: null, night: false, pending: null };
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
  if (!API) { status('静态模式'); return; }
  get('/health').then(() => status('后端已连接 · ' + API.replace(/^https?:\/\//, ''), 'rgba(27,166,114,.85)')).catch(() => status('后端不可达，静态模式', 'rgba(232,137,12,.9)'));

  // ---------- 行前检查 ----------
  const ICONS = {};
  function captureIcons() {
    const done = $$('preflight', 'Item Location & notifications'), todo = $$('preflight', 'Item Mobile data in China'), opt = $$('preflight', 'Item Ride from the airport');
    ICONS.done = done && done.querySelector('[data-pencil-name="State"]').outerHTML;
    ICONS.todo = todo && todo.querySelector('[data-pencil-name="State"]').outerHTML;
    ICONS.optional = opt && opt.querySelector('[data-pencil-name="State"]').outerHTML;
  }
  const ITEM_NODE = { permissions: 'Item Location & notifications', data: 'Item Mobile data in China', alipay: 'Item Alipay payment', transfer: 'Item Ride from the airport', car: 'Item Car rental', tickets: 'Item Palace Museum reservation', passport: 'Item Passport', pack: 'Item Offline landing pack' };
  async function renderPreflight() {
    let d; try { d = await get('/rules/preflight'); } catch (e) { return; }
    if (!ICONS.done) captureIcons();
    txt($$('preflight', 'Progress Label'), d.summary); txt($$('preflight', 'Progress Pct'), d.pct + '%');
    const fill = $$('preflight', 'Fill'); if (fill) fill.style.width = Math.round(337 * d.pct / 100) + 'px';
    d.items.forEach(it => {
      const node = $$('preflight', ITEM_NODE[it.id]); if (!node) return;
      txt(node.querySelector('[data-pencil-name="Item Desc"]'), it.desc);
      const st = node.querySelector('[data-pencil-name="State"]');
      if (st && ICONS[it.status]) { const t = document.createElement('div'); t.innerHTML = ICONS[it.status]; st.replaceWith(t.firstElementChild); }
      const btn = node.querySelector('[data-pencil-name="Item Button"]'); if (btn) btn.style.visibility = it.status === 'done' ? 'hidden' : 'visible';
    });
  }

  // ---------- 支付验证 ----------
  async function pay() {
    toast('Charging ¥1 via Alipay…');
    try {
      const r = await post('/mock/pay-test' + (S.night ? '' : ''));
      if (r.status === 'verified') {
        txt($$('payment', 'Result Sub'), `¥1.00 charged via Alipay at ${r.verified_at.slice(11, 16)} · ${r.card}\nRefund issued · back on your card in 1–3 days`);
        txt($$('payment', 'Chip Label'), 'VERIFIED · ' + r.verified_at.slice(5, 10).replace('-', '/'));
        renderPayOk(); show('payment'); renderPreflight();
        if (S.payReturn) { const to = S.payReturn; S.payReturn = null; const btn = $$('payment', 'Done Button'); if (btn) { btn.dataset.act = 'go:' + to; txt($$('payment', 'Done Label'), 'Continue to step 3 · Get to your hotel'); } }
      } else { renderPayFail(r); show('payment'); }
    } catch (e) { toast('后端不可达'); show('payment'); }
  }
  const PAY_OK = {};
  function snapPay() { if (PAY_OK.done) return; ['Result Title', 'Result Sub', 'Chip Label', 'How Title', 'Done Label'].forEach(n => { const el = $$('payment', n); PAY_OK[n] = el ? el.textContent : ''; }); const card = $$('payment', 'Result Card'); PAY_OK.stroke = card ? card.style.borderColor : ''; const ok = $$('payment', 'OK Circle'); PAY_OK.circle = ok ? ok.style.backgroundColor : ''; PAY_OK.done = true; }
  function renderPayOk() { snapPay(); setPayTone(false); txt($$('payment', 'Result Title'), PAY_OK['Result Title']); txt($$('payment', 'How Title'), PAY_OK['How Title']); txt($$('payment', 'Done Label'), PAY_OK['Done Label']); const btn = $$('payment', 'Done Button'); if (btn) btn.dataset.act = 'go:preflight'; }
  const X_SVG = '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#E8890C" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function setPayTone(fail) {
    const card = $$('payment', 'Result Card'); if (card) card.style.borderColor = fail ? '#E8890C' : PAY_OK.stroke;
    const ok = $$('payment', 'OK Circle'); if (ok) { ok.style.backgroundColor = fail ? '#FFF4E5' : PAY_OK.circle; const icon = ok.querySelector('[data-pencil-name="OK Icon"]'); if (icon) { if (!PAY_OK.iconHTML) PAY_OK.iconHTML = icon.outerHTML; const t = document.createElement('div'); t.innerHTML = fail ? X_SVG : PAY_OK.iconHTML; const n = t.firstElementChild; n.setAttribute('data-pencil-name', 'OK Icon'); icon.replaceWith(n); } }
    const chip = $$('payment', 'Verified Chip'); if (chip) chip.style.backgroundColor = fail ? '#FFF4E5' : '#E6F7F0';
    const ci = $$('payment', 'Chip Icon'); if (ci) ci.style.display = fail ? 'none' : '';
    const cl = $$('payment', 'Chip Label'); if (cl) cl.style.color = fail ? '#E8890C' : '#1BA672';
  }
  function renderPayFail(r) {
    snapPay(); S.entry = r.entry_id; setPayTone(true);
    txt($$('payment', 'Result Title'), 'Payment test failed');
    txt($$('payment', 'Result Sub'), `Alipay returned ${r.error_code}.\n${r.hint}`);
    txt($$('payment', 'Chip Label'), 'NOT VERIFIED · ' + r.error_code);
    txt($$('payment', 'How Title'), 'What this error means');
    const meaning = { CARD_NOT_SUPPORTED: ['Your card network is not accepted', 'Alipay accepts Visa, Mastercard, JCB, Discover, Diners Club and UnionPay. Amex and most prepaid or virtual cards fail.', 'Try another card', 'A credit card from a major bank on a different network fixes most cases.', 'Still failing', 'Open TourCard inside Alipay as a prepaid wallet, or pay cash from a Bank of China ATM.'],
                      RISK_REJECT: ['Your bank blocked the charge', 'Banks often block an unfamiliar Chinese merchant on the first attempt.', 'Retry in 10 minutes', 'Turn off any VPN-like network tool first; verification calls go to your bank and time out through them.', 'Call your bank', 'Ask them to allow international online transactions and confirm 3-D Secure is on.'],
                      LIMIT_EXCEEDED: ['You hit the unverified allowance', 'Alipay lets you spend a small total before it needs your passport.', 'Complete Identity Verification', 'Me > Settings > Account & Security > Identity Verification. Usually done within the hour.', 'Then retry', 'Run the ¥1 test again from the pre-flight check.'] }[r.error_code] || [];
    $all('payment', 'How Item Title').forEach((el, i) => txt(el, meaning[i * 2])); $all('payment', 'How Item Desc').forEach((el, i) => txt(el, meaning[i * 2 + 1]));
    txt($$('payment', 'Done Label'), 'Try again'); const btn = $$('payment', 'Done Button'); if (btn) btn.dataset.act = 'api:pay';
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
    try { renderStuck(await post('/stuck/classify', fd, true)); } catch (e) { toast('识别失败，显示离线条目'); }
  };
  function stepRows() { return $all('stuck', 'Step 1').concat($all('stuck', 'Step 2'), $all('stuck', 'Step 3')); }
  function renderStuckLoading() {
    txt($$('stuck', 'Rec Label'), 'ANALYSING…'); txt($$('stuck', 'Shot Title'), 'Reading your screenshot'); txt($$('stuck', 'Shot Why'), 'Usually takes 1–2 seconds.');
    const img = $$('stuck', 'Thumb'); if (img && S.lastShot) { img.style.backgroundImage = `url(${URL.createObjectURL(S.lastShot)})`; img.style.backgroundSize = 'cover'; [...img.children].forEach(c => c.style.visibility = 'hidden'); }
  }
  function fillEntry(e) {
    S.entry = e.id;
    txt($$('stuck', 'Rec Label'), 'RECOGNIZED · ' + (e.scenario || '').toUpperCase()); txt($$('stuck', 'Shot Title'), e.title); txt($$('stuck', 'Shot Why'), e.why);
    txt($$('stuck', 'Steps Title'), 'Do this now');
    stepRows().forEach((row, i) => { row.style.display = e.steps[i] ? '' : 'none'; txt(row.querySelector('[data-pencil-name="Step Title"]'), e.steps[i] ? e.steps[i].split(/[.:]/)[0] : ''); txt(row.querySelector('[data-pencil-name="Step Desc"]'), e.steps[i] || ''); row.onclick = null; });
    txt($$('stuck', 'Sup Title'), 'Still stuck? ' + e.fallback.slice(0, 60) + (e.fallback.length > 60 ? '…' : ''));
    txt($$('stuck', 'Src Text'), `Steps from ${e.sources[0].name.split('·')[0].trim()} · verified ${e.verified_at}`);
  }
  function renderStuck(d) {
    if (d.decision === 'answer') { fillEntry(d.entry); toast(`${d.mode === 'model' ? 'Model' : 'Rules'} · ${d.confidence} · ${d.latency_ms} ms`); return; }
    if (d.decision === 'ask') {
      S.entry = null;
      txt($$('stuck', 'Rec Label'), 'NOT SURE · ' + (d.scenario || '').toUpperCase()); txt($$('stuck', 'Shot Title'), 'Which of these is it?'); txt($$('stuck', 'Shot Why'), 'The screenshot could mean a few things. Tap the one that matches.');
      txt($$('stuck', 'Steps Title'), 'Tap one');
      stepRows().forEach((row, i) => { const c = d.candidates[i]; row.style.display = c ? '' : 'none'; if (!c) return; txt(row.querySelector('[data-pencil-name="Step Title"]'), c.title); txt(row.querySelector('[data-pencil-name="Step Desc"]'), `Confidence ${c.confidence}`); row.style.cursor = 'pointer'; row.onclick = async () => fillEntry(await get(`/kb/entry/${c.entry_id}?lang=en`)); });
      txt($$('stuck', 'Src Text'), `Confidence ${d.confidence} · ${d.mode}`); return;
    }
    S.entry = null;
    txt($$('stuck', 'Rec Label'), 'NOT COVERED YET'); txt($$('stuck', 'Shot Title'), "We don't have this one yet"); txt($$('stuck', 'Shot Why'), d.advice ? 'AI suggestion, not verified by us:' : 'Try the support chat below.');
    txt($$('stuck', 'Steps Title'), d.advice ? 'AI suggestion · unverified' : 'What you can do');
    const lines = d.advice ? d.advice.split(/(?<=[.!?])\s+/).slice(0, 3) : ['Show the screen to a staff member nearby.', 'Open the app\'s English support if it has one.', 'Chat with Trip.com support below.'];
    stepRows().forEach((row, i) => { row.style.display = lines[i] ? '' : 'none'; txt(row.querySelector('[data-pencil-name="Step Title"]'), lines[i] ? lines[i].split(/[.:]/)[0] : ''); txt(row.querySelector('[data-pencil-name="Step Desc"]'), lines[i] || ''); row.onclick = null; });
    txt($$('stuck', 'Src Text'), 'Not from the knowledge base · ' + d.mode);
  }
  async function solved() { if (S.entry) { try { await post('/kb/feedback', { entry_id: S.entry, solved: true }); } catch (e) {} } toast('Thanks, recorded'); back(); }

  // ---------- 第三步交通 ----------
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
    if (cur && !go) { go = document.createElement('div'); go.className = 'lc-goto'; go.style.cssText = 'width:100%;background:#EAF0FF;border-radius:10px;padding:14px 16px;box-sizing:border-box;font-family:Inter,system-ui,sans-serif'; cur.insertBefore(go, $$('step3', 'Primary Button')); }
    if (go) go.innerHTML = `<div style="font-size:11px;font-weight:700;letter-spacing:.06em;color:#2C61FE">WHERE TO GO</div><div style="font-size:18px;font-weight:700;color:#121826;margin:4px 0 6px">${g.title || r.title}</div><div style="font-size:14px;line-height:1.4;color:#121826">${g.where || r.where}</div>${g.verified === false ? '<div style="font-size:11px;color:#8592A6;margin-top:6px">Location to be verified on site</div>' : ''}`;
    const alt = $$('step3', 'Alt Options'); if (alt) alt.style.display = 'none';
    const sl = $$('step3', 'Step List');
    if (sl) {
      sl.innerHTML = '';
      const head = document.createElement('div'); head.style.cssText = 'padding:12px 14px 4px;font:700 13px Inter,system-ui,sans-serif;color:#6F7685'; head.textContent = 'Other ways'; sl.appendChild(head);
      d.alternatives.forEach((a, i) => {
        const row = document.createElement('div'); row.className = 'tap'; row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:12px 14px;border-top:1px solid #DADFE6;font-family:Inter,system-ui,sans-serif;cursor:pointer';
        row.dataset.act = a.action === 'transit' ? 'go:transit' : a.action === 'transfer' ? 'go:transfers' : 'toast:Demo：打开支付宝里的滴滴小程序';
        row.innerHTML = `<div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:700;color:#121826">${a.title}</div><div style="font-size:13px;color:#6F7685;margin-top:2px">${a.price} · ${a.min} min</div><div style="font-size:13px;color:#121826;margin-top:4px;line-height:1.35">${(a.go_to && a.go_to.where) || a.where}</div></div><div style="flex-shrink:0;border:1px solid #2C61FE;color:#2C61FE;border-radius:4px;padding:7px 12px;font-size:12px;font-weight:700">${a.action === 'transit' ? 'Route' : a.action === 'transfer' ? 'Book' : 'Open'}</div>`;
        sl.appendChild(row);
      });
    }
    txt($$('step3', 'Primary Label'), r.id === 'transfer' ? 'Show my booking to the driver' : r.id === 'metro' || r.id === 'maglev' ? 'Open the route' : 'Show address to driver');
    const pb = $$('step3', 'Primary Button'); if (pb) pb.dataset.act = r.id === 'metro' || r.id === 'maglev' ? 'go:transit' : 'go:driver';
    try { const pf = await get('/rules/preflight'); const pay = pf.items.find(i => i.id === 'alipay'); if (pay && pay.status !== 'done' && pb) { pb.dataset.act = 'api:pay2'; txt($$('step3', 'Primary Label'), 'Verify payment first · ¥1 test'); } } catch (e) {}
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
    try { const pf = await get('/rules/preflight'); const pay = pf.items.find(i => i.id === 'alipay'); const prow = $$('done', 'Event Payment verified before flight'); if (prow && pay) { txt(prow.querySelector('[data-pencil-name="Event Title"]'), pay.status === 'done' ? 'Payment verified before flight' : 'Payment not verified'); const payAt = at('payment'); const sameDay = payAt && landed && payAt.slice(0, 10) === landed.slice(0, 10); txt(prow.querySelector('[data-pencil-name="Event Title"]'), pay.status !== 'done' ? 'Payment not verified' : sameDay ? 'Payment verified · ¥1 test' : 'Payment verified before flight'); txt(prow.querySelector('[data-pencil-name="Event Time"]'), pay.status === 'done' ? (sameDay ? hhmm(payAt) : 'before flight') : '—'); const sp = $$('share', 'TL Paid'); if (sp) txt(sp.querySelector('[data-pencil-name="TL Time"]'), pay.status === 'done' ? (sameDay ? hhmm(payAt) : 'pre-flight') : '—'); } } catch (e) {}
    const tl2 = (name, v) => { const n = $$('share', name); if (n && v) txt(n.querySelector('[data-pencil-name="TL Time"]'), v); };
    tl2('TL Landed', hhmm(landed)); tl2('TL Online', hhmm(online)); tl2('TL In car', hhmm(car));
    if (landed) { const d = new Date(landed.replace(' ', 'T')); txt($$('share', 'Foot Date'), d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + ' · trip.com/landing'); }
    if (landed && car) { const m = Math.max(1, Math.round((new Date(car.replace(' ', 'T')) - new Date(landed.replace(' ', 'T'))) / 60000)); txt($$('done', 'Big Number'), m + ' min'); txt($$('share', 'Big Number'), String(m)); txt($$('done', 'Share Title'), `Share your ${m}-minute card`); txt($$('share', 'Share Title'), `Share your ${m}-minute card`); }
  }
  const FB = { wifi: 'FB Wi-Fi', payment: 'FB Payment', transport: 'FB Transport' };
  const FB_STYLE = {};
  async function feedback(which) {
    if (!FB_STYLE.on) { const on = $$('done', 'FB Wi-Fi'), off = $$('done', 'FB Payment'); if (on && off) { const pick = el => ({ bg: el.style.backgroundColor, border: el.style.borderColor, label: el.querySelector('[data-pencil-name="FB Label"]').style.color, icon: el.querySelector('svg') && el.querySelector('svg').style.color }); FB_STYLE.on = pick(on); FB_STYLE.off = pick(off); } }
    Object.entries(FB).forEach(([k, name]) => { const el = $$('done', name); if (!el) return; const st = k === which ? FB_STYLE.on : FB_STYLE.off; el.style.backgroundColor = st.bg; el.style.borderColor = st.border; const lb = el.querySelector('[data-pencil-name="FB Label"]'); if (lb) lb.style.color = st.label; const ic = el.querySelector('svg'); if (ic) ic.style.color = ic.style.fill = (k === which ? '#2C61FE' : '#6F7685'); });
    toast({ wifi: 'Thanks, recorded: Wi-Fi was hardest', payment: 'Thanks, recorded: payment was hardest', transport: 'Thanks, recorded: transport was hardest' }[which]);
    try { await post('/kb/feedback', { entry_id: 'alipay_setup_before_flight', solved: true, note: 'hardest:' + which }); } catch (e) {}
  }

  // ---------- 动作分发 ----------
  window.lcHandle = (act, el) => {
    if (act === 'pay') pay();
    else if (act === 'pay2') { S.payReturn = 'step3'; pay(); }
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
    return { pf, by, fl, landed: hh(fl.landed_at), online: hh(at('online')), car: hh(at('in_car')), paid: pf.items.find(i => i.id === 'alipay') };
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
    const payOk0 = S0.paid && S0.paid.status === 'done';
    if (route === 'wifi') { const ob = $$('wifi', 'Open Settings'); if (ob) { ob.dataset.act = payOk0 ? 'go:step3' : 'api:pay2'; txt($$('wifi', 'Open Label'), payOk0 ? "I'm online · continue to step 3" : "I'm online · verify payment next"); } return S0; }
    const rows = stepList(route); if (!rows) return;
    const onlineDone = route === 'step3' || route === 'online' || !!S0.online;
    const dataOk = route === 'online' || (S0.by.data && S0.by.data.status === 'done');
    applyStep(rows[0], onlineDone ? 'done' : 'now',
      onlineDone ? (dataOk ? 'Passed automatically · own data works' : `Done${S0.online ? ' ' + S0.online : ''} · PVG free Wi-Fi`) : 'Checking own data first · Wi-Fi only if needed', '1');
    const payOk = S0.paid && S0.paid.status === 'done';
    applyStep(rows[1], payOk ? 'done' : 'now', payOk ? 'Verified before you flew · ¥1 test refunded' : 'Not verified yet · run the ¥1 test in Before you fly', '2');
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
    const states = { 'Pill Wi-Fi': { ok: by.data && by.data.status === 'done', label: 'Wi-Fi' }, 'Pill Alipay': { ok: by.alipay && by.alipay.status === 'done', label: 'Alipay' }, 'Pill Hotel': { ok: true, label: 'Hotel' } };
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
    mk('🔄 重置演示数据', async () => { try { await post('/mock/reset'); S.night = false; toast('已重置'); renderPreflight(); } catch (e) { toast('后端不可达'); } });
    const nb = mk('🌙 深夜落地模式：关', () => { S.night = !S.night; nb.textContent = '🌙 深夜落地模式：' + (S.night ? '开' : '关'); renderTransport(); toast(S.night ? '交通推荐按 23:40 落地计算' : '恢复 14:20 落地'); });
    mk('💳 模拟支付失败', async () => { try { const r = await post('/mock/pay-test?fail=1'); renderPayFail(r); show('payment'); } catch (e) { toast('后端不可达'); } });
  }
  renderPreflight();
  const cur = document.querySelector('.screen.on'); if (cur) window.lcOnShow(cur.dataset.route);
})();
