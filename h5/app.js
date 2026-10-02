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
        show('payment'); renderPreflight();
      } else { toast(`Payment test failed: ${r.error_code}. ${r.hint}`); S.entry = r.entry_id; }
    } catch (e) { toast('后端不可达'); show('payment'); }
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
    txt($$('step3', 'Subtitle'), (d.night ? 'Landed 23:40 · night mode · ' : 'Online since 14:41 · ') + 'payment verified · last step');
  }
  async function incar() { try { await post('/mock/event', { event: 'in_car' }); } catch (e) {} show('done'); }

  // ---------- 完成页 ----------
  async function renderDone() {
    let tl; try { tl = await get('/mock/timeline'); } catch (e) { return; }
    const at = ev => (tl.find(x => x.event === ev) || {}).at;
    const hhmm = s => s ? s.slice(11, 16) : null;
    const landed = at('landed'), online = at('online'), car = at('in_car');
    const evt = (name, v) => { const n = $$('done', name); if (n && v) txt(n.querySelector('[data-pencil-name="Event Time"]'), v); };
    evt('Event Landed at PVG T2', hhmm(landed)); evt('Event Online · PVG free Wi-Fi', hhmm(online)); evt('Event In the car · detected automatically', hhmm(car));
    if (landed && car) { const m = Math.max(1, Math.round((new Date(car.replace(' ', 'T')) - new Date(landed.replace(' ', 'T'))) / 60000)); txt($$('done', 'Big Number'), m + ' min'); txt($$('share', 'Big Number'), String(m)); txt($$('done', 'Share Title'), `Share your ${m}-minute card`); }
  }
  async function feedback(which) { toast({ wifi: 'Thanks, recorded: Wi-Fi was hardest', payment: 'Thanks, recorded: payment was hardest', transport: 'Thanks, recorded: transport was hardest' }[which]); }

  // ---------- 动作分发 ----------
  window.lcHandle = (act, el) => {
    if (act === 'pay') pay();
    else if (act === 'land') land();
    else if (act === 'stuck') stuckPick();
    else if (act === 'solved') solved();
    else if (act === 'incar') incar();
    else if (act === 'esim') post('/rules/preflight/done', { item: 'esim' }).then(() => toast('eSIM added · China mainland · US$4.9')).catch(() => toast('Demo：eSIM'));
    else if (act === 'transfer') post('/rules/preflight/done', { item: 'transfer' }).then(() => { toast('Transfer booked · driver will wait at arrivals'); setTimeout(() => show('preflight'), 800); }).catch(() => show('preflight'));
    else if (act.startsWith('fb:')) feedback(act.slice(3));
  };
  window.lcOnShow = route => {
    if (route === 'preflight') renderPreflight();
    if (route === 'step3') renderTransport();
    if (route === 'done') renderDone();
    if (route === 'online' || route === 'wifi') post('/mock/event', { event: 'online' }).catch(() => {});
  };

  // ---------- 演示控制：加进右上角菜单 ----------
  const list = document.getElementById('list');
  if (list) {
    const sep = document.createElement('div'); sep.style.cssText = 'border-top:1px solid #DADFE6;margin:4px 0';
    list.appendChild(sep);
    const mk = (label, fn) => { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; list.appendChild(b); return b; };
    mk('🔄 重置演示数据', async () => { try { await post('/mock/reset'); S.night = false; toast('已重置'); renderPreflight(); } catch (e) { toast('后端不可达'); } });
    const nb = mk('🌙 深夜落地模式：关', () => { S.night = !S.night; nb.textContent = '🌙 深夜落地模式：' + (S.night ? '开' : '关'); renderTransport(); toast(S.night ? '交通推荐按 23:40 落地计算' : '恢复 14:20 落地'); });
    mk('💳 模拟支付失败', async () => { try { const r = await post('/mock/pay-test?fail=1'); toast(`${r.error_code}: ${r.hint}`); } catch (e) { toast('后端不可达'); } });
  }
  renderPreflight();
})();
