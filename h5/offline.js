/* Landing Check · local-first travel pack. Uses the existing hash router and palette. */
(function () {
  'use strict';
  const BASE = new URL('./', location.href);
  const ROUTES = ['offline', 'offline-hotel', 'offline-cards', 'offline-guide', 'offline-help', 'offline-place'];
  const db = window.LCOfflineDB;
  const preflightScreen = document.querySelector('.screen[data-route="preflight"]');
  const staticCounts = preflightScreen?.querySelector('[data-pencil-name="Progress Label"]')?.textContent.match(/(\d+) of (\d+) ready.*?(\d+) optional/);
  const staticPackWasSaved = /Downloaded/i.test(preflightScreen?.querySelector('[data-pencil-name="Item Offline landing pack"] [data-pencil-name="Item Desc"]')?.textContent || '');
  const staticPreflight = staticCounts ? { ready: +staticCounts[1], required: +staticCounts[2], optional_open: +staticCounts[3], items: [{ id: 'pack', status: staticPackWasSaved ? 'done' : 'todo' }] } : null;
  const state = { ready: false, data: null, hotel: null, contacts: [], guide: { step: 'wifi', history: [] }, pack: null,
    busy: false, progress: null, notice: '', noticeGood: false, storageError: '', dataError: '', editHotel: false, draft: null,
    tab: 'Places', place: 'service', helpReturn: 'offline', entryReturn: 'home',
    hotelLookup: 'idle', hotelCandidate: null, hotelDirty: false, hotelManual: false, hotelEpoch: 0 };
  const H = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = name => {
    const paths = { back: 'M15 18l-6-6 6-6', arrow: 'M5 12h14m-6-6 6 6-6 6', hotel: 'M4 20V5h16v15M2 20h20M8 9h2m4 0h2M8 13h2m4 0h2M10 20v-3h4v3',
      cards: 'M5 4h14v16H5zM8 8h8M8 12h6M8 16h4', wifi: 'M3 8a14 14 0 0 1 18 0M6 12a9 9 0 0 1 12 0M9 16a4 4 0 0 1 6 0M12 20h.01',
      help: 'M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
      check: 'M5 12l4 4L19 6', phone: 'M7 3H3c0 10 8 18 18 18v-4l-5-2-2 2a15 15 0 0 1-7-7l2-2z', pin: 'M12 22s8-8 8-14a8 8 0 0 0-16 0c0 6 8 14 8 14M15 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
      chevron: 'M9 6l6 6-6 6', copy: 'M9 9h11v11H9zM5 15H4V4h11v1', expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5', sim: 'M7 3h7l5 5v13H7zM10 12h6v6h-6z', chat: 'M4 5h16v11H9l-5 4z' };
    return `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name] || paths.cards}"/></svg>`;
  };
  const button = (label, action, value = '', tone = '', disabled = false, data = {}) => `<button type="button" class="op-btn ${tone}" data-op="${H(action)}" data-value="${H(value)}" ${Object.entries(data).map(([key, val]) => `data-${H(key)}="${H(val)}"`).join(' ')} ${disabled ? 'disabled' : ''}>${label}</button>`;
  const note = text => `<div class="op-notice">${H(text)}</div>`;
  const telValue = phone => String(phone || '').replace(/[^+\d]/g, '');
  const hasPhone = phone => /\d{3}/.test(telValue(phone));
  const call = phone => hasPhone(phone) ? `<a class="op-btn secondary" href="tel:${H(telValue(phone))}">${icon('phone')} Call</a>` : button('No phone saved', '', '', 'secondary', true);
  const date = value => { const d = new Date(value); return Number.isNaN(+d) ? 'Not saved' : d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }); };
  const current = () => document.querySelector('.screen.on')?.dataset.route || 'home';
  const byId = id => state.data?.places.find(place => place.id === id);
  const phrase = id => state.data?.phrases.find(item => item.id === id);
  function guideSnapshot(saved) {
    const item = typeof saved === 'string' ? { step: saved } : saved;
    const step = state.data?.guide.steps[item?.step];
    if (!step) return null;
    return { step: item.step, request: phrase(item.request)?.id || step.phrase, request_place: byId(item.request_place)?.id || null };
  }
  function currentRequest() {
    const snapshot = guideSnapshot(state.guide);
    const request = phrase(snapshot?.request) || phrase('no-internet');
    const place = byId(snapshot?.request_place);
    return { ...request,
      zh: request.zh + (place ? '\n\n' + place.name_zh : ''),
      en: request.en + (place ? '\n\n' + place.name : '') };
  }
  function notify(message, good = false) { state.notice = message; state.noticeGood = good; render(); }
  function navigate(route) {
    if (!current().startsWith('offline')) state.entryReturn = current();
    show(route);
  }
  const screens = {};
  for (const route of ROUTES) {
    if (!order.includes(route)) order.push(route);
    const screen = document.createElement('section');
    screen.className = 'screen lc-offline'; screen.dataset.route = route; screen.lang = 'en'; screen.setAttribute('aria-label', 'Offline travel pack');
    document.getElementById('phone').append(screen); screens[route] = screen;
  }
  const live = document.createElement('div');
  live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
  live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)';
  document.body.append(live);

  function sources(ids) {
    const list = (ids || []).map(id => state.data.sources.find(source => source.id === id)).filter(Boolean);
    return `<details class="op-source"><summary>Sources & last checked · ${H(state.data.checked_at)}</summary>${list.map(source => `<p>${H(source.name)}${source.published_at ? ' · published ' + H(source.published_at) : ''}<br><a data-op-online href="${H(source.url)}" target="_blank" rel="noopener noreferrer">${H(source.url)}</a></p>`).join('')}<p>Checked against published web information. Not an on-site inspection. Links need internet.</p></details>`;
  }
  // 顶部与流程页一致：返回 · 居中标题 · 右上角 Help 小按钮；断网时标题下多一枚「Offline」标签
  function header(route, title) {
    const helpPill = route === 'offline-help' ? '<span></span>' : `<button type="button" class="op-help-pill" data-op="help"><img src="img/ai-bot.png" alt="">Help</button>`;
    return `<header class="op-header"><div class="op-topline"><button type="button" class="op-back" data-op="back" aria-label="Go back">${icon('back')}</button><h1 tabindex="-1">${H(title)}</h1>${helpPill}</div><span class="op-chip is-offline op-net" data-op-network ${navigator.onLine ? 'hidden' : ''}>${navigator.onLine ? 'Network detected' : 'Offline · saved content'}</span></header>`;
  }
  function footer(route) {
    return route === 'offline-help' ? `<footer class="op-footer">${button('Return to my task', 'return-help', '', 'secondary')}</footer>` : '';
  }
  const label = text => `<div class="op-label">${H(text)}</div>`;
  function home() {
    const p = state.pack, mb = p ? (p.bytes / 1048576).toFixed(1) : null;
    const status = state.busy ? `Saving ${state.progress?.done || 0} of ${state.progress?.total || '…'} files` : p ? `Public guide saved · ${mb} MB` : 'Not downloaded yet';
    const continuing = state.guide.step !== 'wifi';
    const d = state.data;
    // 首页四个入口平铺，不默认高亮任何一个；只有联网向导做到一半时，才在 Get online 上提示继续
    const next = continuing ? 'offline-guide' : '';
    const modules = [
      { icon: 'hotel', tone: 'hotel', title: 'Show my hotel', meta: state.hotel ? state.hotel.name_en : 'From your booking · 1 tap', route: 'offline-hotel' },
      { icon: 'chat', tone: 'phrases', title: 'Find local help', meta: `${d.places.length} desks · ${d.phrases.length} phrases`, route: 'offline-cards' },
      { icon: 'wifi', tone: 'internet', title: 'Get online', meta: continuing ? 'In progress · ' + (d.guide.steps[state.guide.step]?.label || '') : 'Wi-Fi, SIM or eSIM', route: 'offline-guide', badge: 'Continue' },
      { icon: 'phone', tone: 'support', title: 'Ask for help', meta: 'Airport hotline saved', route: 'offline-help' },
    ];
    const inside = [['hotel', 'Hotel card'], ['chat', d.phrases.length + ' phrases'], ['pin', d.places.length + ' airport desks'], ['wifi', 'Wi-Fi guide']];
    const disabled = state.busy || !navigator.onLine || !('serviceWorker' in navigator);
    return `<section class="op-hero ${p ? 'is-saved' : ''}" aria-label="Download status">
        <div class="op-hero-top"><span class="op-hero-status" data-testid="pack-status">${H(status)}</span><span class="op-hero-tag">PVG · T2</span></div>
        <h2>${p ? 'Ready, even with no signal' : 'Works with no signal at PVG'}</h2>
        <ul class="op-inside">${inside.map(([name, text]) => `<li>${icon(name)}${H(text)}</li>`).join('')}</ul>
        ${state.progress ? `<progress class="op-progress" max="${state.progress.total}" value="${state.progress.done}" aria-label="Download progress"></progress>` : ''}
        ${p ? `<div class="op-hero-saved"><span>Saved ${H(date(p.savedAt))} · ${mb} MB</span>${button(state.busy ? 'Saving…' : 'Update', 'download', '', 'op-hero-update', disabled)}</div>`
          : button(state.busy ? 'Saving…' : 'Save pack · before you fly', 'download', '', 'op-hero-save', disabled)}
      </section>
      ${label('In your pack')}
      <div class="op-grid">${modules.map(item => `<button class="op-tile op-tile--${item.tone} ${next === item.route ? 'is-next' : ''}" type="button" data-op="nav" data-value="${item.route}"><span class="op-icon">${icon(item.icon)}</span>${next === item.route ? `<span class="op-badge">${H(item.badge)}</span>` : ''}<strong>${H(item.title)}</strong><small>${H(item.meta)}</small></button>`).join('')}</div>
      ${label('At the airport')}
      ${tripCounterEntry()}
      <p class="op-foot">Stored only on this phone · Info checked ${H(d.checked_at)} · <button type="button" class="op-link" data-op="clear">Clear my data</button></p>`;
  }
  function field(label, name, value = '', extra = '') {
    return `<label class="op-field">${H(label)}<input name="${name}" value="${H(value)}" maxlength="${name === 'phone' ? 40 : 240}" ${extra}></label>`;
  }
  function itineraryHotel(trip) {
    const h = trip?.hotel;
    if (!h || typeof h !== 'object') return null;
    const text = (...values) => values.find(value => typeof value === 'string' && value.trim())?.trim() || '';
    const draft = { name_en: text(h.name_en, h.name), name_zh: text(h.name_zh),
      address_en: text(h.address_en, h.address), address_zh: text(h.address_zh), phone: text(h.phone),
      notes: text(h.notes, h.landmark_zh), demo: trip.demo !== false, source: 'itinerary' };
    return draft.name_en || draft.name_zh ? draft : null;
  }
  function refreshHotelForm() {
    if (current() !== 'offline-hotel') return;
    const active = document.activeElement;
    const name = active?.form?.id === 'op-hotel-form' ? active.name : null;
    const selection = name ? [active.selectionStart, active.selectionEnd] : null;
    const scrollTop = screens['offline-hotel'].querySelector('main')?.scrollTop || 0;
    render();
    if (name) {
      const field = screens['offline-hotel'].querySelector('form')?.elements.namedItem(name);
      field?.focus({ preventScroll: true });
      if (selection[0] != null) { try { field.setSelectionRange(...selection); } catch (_) {} }
      screens['offline-hotel'].querySelector('main').scrollTop = scrollTop;
    }
  }
  async function prepareHotel(force = false) {
    if (!state.ready || !state.data || state.storageError) return;
    if (!force && (state.hotel || state.hotelManual || state.hotelLookup !== 'idle')) return;
    const epoch = ++state.hotelEpoch;
    state.hotelLookup = 'loading';
    refreshHotelForm();
    let candidate;
    // The current adapter explicitly marks /mock/trip as demo. Real integrations must provide demo:false.
    if (navigator.onLine && window.lcOfflineTrip) {
      try { candidate = itineraryHotel(await window.lcOfflineTrip()); } catch (_) { /* Keep the local example available. */ }
    }
    candidate ||= state.data.demo_hotel ? { ...state.data.demo_hotel, demo: true, source: 'demo-itinerary' } : null;
    if (epoch !== state.hotelEpoch) return;
    state.hotelCandidate = candidate; state.hotelLookup = candidate ? 'found' : 'empty';
    // Late results must never erase an edit or a user's decision to start a blank card.
    if (candidate && (force || (!state.hotelDirty && !state.hotelManual && !state.hotel))) {
      state.draft = { ...candidate }; state.editHotel = true; state.hotelDirty = false;
    }
    refreshHotelForm();
  }
  function hotel() {
    const h = state.hotel;
    if (state.editHotel || !h) {
      const draft = state.draft || h || {};
      const fromItinerary = draft.source === 'itinerary' || draft.source === 'demo-itinerary';
      const looking = state.hotelLookup === 'loading';
      const source = looking ? 'Checking your itinerary…' : fromItinerary ? (draft.demo ? 'Filled from the demo itinerary' : 'Filled from your itinerary') : 'Enter a different hotel';
      // 上方是「司机会看到的样子」，随输入实时更新；下方是紧凑的核对表单
      return `<section class="op-hotel-source"><span class="op-icon">${icon('hotel')}</span><div><h2>${H(source)}</h2>${draft.demo ? '<span class="op-demo">DEMO ITINERARY · NOT A REAL BOOKING</span>' : ''}</div></section>
        <section class="op-driver-card" aria-label="What your driver will see"><div class="op-label">What your driver will see</div><div class="op-driver-zh" lang="zh-CN" data-preview="name_zh">${H(draft.name_zh) || '酒店中文名称'}</div><div class="op-driver-addr" lang="zh-CN" data-preview="address_zh">${H(draft.address_zh) || '酒店中文地址'}</div></section>
        <form id="op-hotel-form" class="op-form"><div class="op-form-group">${field('Hotel name · English', 'name_en', draft.name_en, 'required autocomplete="organization"')}${field('Chinese name · 中文名称', 'name_zh', draft.name_zh, 'required lang="zh-CN"')}${field('Address · English', 'address_en', draft.address_en, 'required')}${field('Chinese address · 中文地址', 'address_zh', draft.address_zh, 'required lang="zh-CN"')}${field('Phone · optional', 'phone', draft.phone, 'type="tel" autocomplete="tel"')}
        <label class="op-field">Notes · optional<textarea name="notes" maxlength="600">${H(draft.notes)}</textarea></label></div>
        <label class="op-check"><input type="checkbox" name="confirmed" required ${draft.confirmed ? 'checked' : ''}><span>I've checked the Chinese name and address</span></label>
        <button class="op-btn" type="submit" ${state.storageError ? 'disabled' : ''}>Save hotel on this device</button></form>
        <div class="op-link-row">${h ? button('Cancel', 'cancel-hotel', '', 'op-link') : ''}${button(fromItinerary ? 'Enter a different hotel' : 'Start with a blank card', 'new-hotel', '', 'op-link')}${button('Use itinerary details', 'import-hotel', '', 'op-link', looking)}</div>
        <p class="op-foot">${looking ? 'You can start typing — your changes will be kept.' : 'We never guess or translate a missing Chinese name or address.'}</p>`;
    }
    return `<section class="op-driver-card is-saved"><div class="op-label">Show your driver</div><div class="op-hotel-name" lang="zh-CN">${H(h.name_zh)}</div><p class="op-driver-addr" lang="zh-CN">${H(h.address_zh)}</p><p class="op-en" lang="en">${H(h.name_en)} · ${H(h.address_en)}</p>${h.demo ? '<span class="op-demo">DEMO HOTEL · FROM SIMULATED ITINERARY</span>' : ''}${h.notes ? `<p class="op-muted">${H(h.notes)}</p>` : ''}
      ${button(icon('expand') + 'Show address to driver / staff', 'hotel-card')}
      <div class="op-actions">${button(icon('copy') + 'Copy address', 'copy-hotel', '', 'secondary')}${call(h.phone)}</div></section>
      <p class="op-foot">Saved ${H(date(h.savedAt))} · Calls need a phone signal · <button type="button" class="op-link" data-op="edit-hotel">Edit</button></p>`;
  }
  function tripCounterEntry() {
    return `<section class="op-trip-entry"><button class="op-trip-link" type="button" data-op="place" data-value="exchange"><span class="op-trip-logo">Trip<b>.com</b></span><span class="op-trip-copy"><strong>Find the Trip.com counter</strong><span>Currency exchange · L3, near door 25</span></span>${icon('chevron')}</button></section>`;
  }
  const placeTone = { wifi: 'internet', sim: 'phrases', exchange: 'hotel', service: 'support' };
  function placePreview(p) {
    const g = p.guidance;
    return `<button type="button" class="op-place-choice op-tone--${placeTone[p.id] || 'hotel'}" data-op="place" data-value="${H(p.id)}"><span class="op-icon">${icon(g.icon)}</span><span class="op-place-choice-copy"><strong>${H(g.title)}</strong><span>${H(g.summary)}</span><small>${icon('pin')}${H(g.location_hint)}</small></span>${icon('chevron')}</button>`;
  }
  function cards() {
    const tabs = ['Places', 'All phrases', 'Hotel', 'Internet', 'Payment', 'Mobile data', 'Help'];
    const iconBtn = (name, action, id, text) => `<button type="button" class="op-icon-btn" data-op="${action}" data-value="${H(id)}" aria-label="${text}" title="${text}">${icon(name)}</button>`;
    return `<div class="op-tabs" aria-label="Card category">${tabs.map(tab => `<button type="button" data-op="tab" data-value="${H(tab)}" aria-pressed="${state.tab === tab}">${H(tab === 'Places' ? 'Find help' : tab)}</button>`).join('')}</div>` + (state.tab === 'Places'
      ? `<h2 class="op-page-title">What do you need help with?</h2><section class="op-list">${['wifi', 'sim', 'exchange', 'service'].map(id => placePreview(byId(id))).join('')}</section>`
      : `<section class="op-list">${state.data.phrases.filter(item => state.tab === 'All phrases' || item.category === state.tab).map(item => `<article class="op-phrase"><div><p class="op-zh" lang="zh-CN">${H(item.zh)}</p><p class="op-en" lang="en">${H(item.en)}</p></div>${iconBtn('copy', 'copy-phrase', item.id, 'Copy')}${iconBtn('expand', 'phrase', item.id, 'Show large')}</article>`).join('')}</section>`);
  }
  function placeRequest(p) {
    return { ...p.guidance.request, context: '目的地 / Destination\n' + p.name_zh + '\n' + p.name + '\n\n地点参考 / Location reference\n' + p.guidance.staff_location.zh + '\n' + p.guidance.staff_location.en };
  }
  function place() {
    const p = byId(state.place) || byId('service'), g = p.guidance, request = placeRequest(p);
    return `<section class="op-card op-place-hero"><img class="op-place-art" src="${H(p.image)}" alt="Illustration of a ${H(p.category)} sign, not a facility photo or map"><div class="op-kicker">${H(p.category)}</div><h2>${H(g.title)}</h2><p class="op-muted">${H(g.summary)}</p><div class="op-location">${icon('pin')}<div><strong>${H(p.name)}</strong><span lang="zh-CN">${H(p.name_zh)}</span><small>${H(g.location_hint)}</small></div></div></section>
      <section class="op-card"><div class="op-kicker">1 · ASK WHERE TO GO</div><div class="op-request-preview"><p lang="zh-CN">${H(request.zh)}</p><p class="op-en" lang="en">${H(request.en)}</p></div>${button(icon('expand') + 'Show request to staff', 'place-card', p.id)}<div class="op-link-row">${button(icon('copy') + 'Copy request', 'copy-place', p.id, 'op-link')}</div></section>
      <section class="op-card"><div class="op-kicker">2 · FIND THE SERVICE</div><ol class="op-find-steps">${g.steps.map(step => `<li>${H(step)}</li>`).join('')}</ol>${button("I'm at the counter · what to ask", 'place-service-card', p.id, 'secondary')}
        <div class="op-fallback"><h3>Can’t find it, or is it closed?</h3><p>${H(g.fallback)}</p>${g.fallback_place ? button('Find airport service center' + icon('chevron'), 'place', g.fallback_place, 'op-link') : button('View help & airport contact' + icon('chevron'), 'help', '', 'op-link')}</div></section>
      <details class="op-service-details"><summary>Hours, services & sources</summary><p>${H(p.location)}</p><p lang="zh-CN">${H(p.location_zh)}</p><p class="op-muted">${H(p.floor || 'Ask staff for the exact floor and desk marker.')}</p><p><strong>Services</strong><br>${H(p.services)}</p><p class="op-muted">${H(p.operator)}</p><p class="op-muted">${H(p.hours || 'Check opening hours with airport staff.')}</p>${note(p.note)}${sources(p.sources)}</details>`;
  }
  const stepIcon = { wifi: 'wifi', auth: 'wifi', assist: 'help', fallback: 'help', choose: 'sim', sim: 'sim', setup: 'sim', esim: 'sim', payment: 'cards', currency: 'cards', complete: 'check' };
  function guide() {
    const key = state.data.guide.steps[state.guide.step] ? state.guide.step : 'wifi';
    const step = state.data.guide.steps[key];
    const request = currentRequest();
    const placeLink = (text, id) => button(H(text) + icon('chevron'), 'place', id, 'op-link');
    return `<div class="op-step-progress"><i></i><b>Step ${state.guide.history.length + 1}</b> · ${H(step.label)}<span>Progress saved</span></div>
      <section class="op-card op-guide-card"><span class="op-step-icon ${key === 'complete' ? 'is-done' : ''}">${icon(stepIcon[key] || 'help')}</span><h2>${H(step.title)}</h2><p>${H(step.body)}</p><div class="op-request-preview"><div class="op-kicker">${H(request.label || request.category)}</div><p lang="zh-CN">${H(request.zh)}</p><p class="op-en" lang="en">${H(request.en)}</p></div>${button(icon('expand') + 'Show bilingual request', 'guide-request', '', 'secondary')}
      ${step.place || step.alternative_place ? `<div class="op-link-row">${step.place ? placeLink('View ' + byId(step.place).name, step.place) : ''}${step.alternative_place ? placeLink('Airport service center', step.alternative_place) : ''}</div>` : ''}${step.sources ? sources(step.sources) : ''}</section>
      ${label('What happened?')}
      <div class="op-guide-options" aria-label="Choose what happened">${step.options.map((option, index) => button(H(option.label) + icon('chevron'), 'guide-next', option.next, index ? 'outline' : '', false, { option: index })).join('')}</div>
      <div class="op-link-row">${state.guide.history.length ? button('Previous step', 'guide-prev', '', 'op-link') : ''}<button type="button" class="op-link" data-op="guide-reset">Restart connection guide</button></div>`;
  }
  function contactCard(contact, removable = false) {
    const ok = hasPhone(contact.phone);
    return `<article class="op-contact"><div class="op-contact-copy"><strong>${H(contact.name)}</strong>${contact.name_zh ? `<span lang="zh-CN">${H(contact.name_zh)}</span>` : ''}<span class="op-number">${H(contact.phone || 'Phone number not saved')}</span>${removable ? `<button type="button" class="op-link" data-op="remove-contact" data-value="${H(contact.id)}">Remove</button>` : ''}${contact.sources ? sources(contact.sources) : ''}</div>
      <button type="button" class="op-icon-btn" data-op="copy-number" data-value="${H(contact.phone || '')}" aria-label="Copy number" ${ok ? '' : 'disabled'}>${icon('copy')}</button>${ok ? `<a class="op-icon-btn is-call" href="tel:${H(telValue(contact.phone))}" aria-label="Call ${H(contact.name)}">${icon('phone')}</a>` : `<button type="button" class="op-icon-btn is-call" aria-label="Call unavailable" disabled>${icon('phone')}</button>`}</article>`;
  }
  function help() {
    const useGuideRequest = state.helpReturn === 'offline-guide';
    const usePlaceRequest = state.helpReturn === 'offline-place';
    return `<section class="op-card op-ask"><h2>Ask someone nearby</h2><p class="op-muted">${useGuideRequest ? 'Uses the situation from your connection guide.' : usePlaceRequest ? 'Keeps asking for the service you were looking for.' : 'Show a clear request to airport staff.'}</p>${button(icon('expand') + (useGuideRequest ? 'Show request for my situation' : usePlaceRequest ? 'Show request for this service' : 'Show “I cannot get online”'), useGuideRequest ? 'guide-request' : usePlaceRequest ? 'place-card' : 'phrase', useGuideRequest ? '' : usePlaceRequest ? state.place : 'no-internet')}
      <div class="op-actions">${button('Find service center', 'place', 'service', 'secondary')}${state.hotel ? button('Show my hotel', 'hotel-card', '', 'secondary') : button('Add hotel address', 'nav', 'offline-hotel', 'secondary')}</div></section>
      ${label('Your contacts')}
      <section class="op-list">${state.hotel ? contactCard({ name: state.hotel.name_en, name_zh: state.hotel.name_zh, phone: state.hotel.phone }) : ''}${state.data.contacts.map(c => contactCard(c)).join('')}${state.contacts.map(c => contactCard(c, true)).join('')}
        <form id="op-contact-form" class="op-contact-form"><div class="op-contact-inputs">${field('Name', 'name', '', 'required placeholder="Add a contact"')}${field('Phone', 'phone', '', 'required type="tel" placeholder="+44 …"')}</div><button class="op-btn secondary" type="submit" ${state.storageError ? 'disabled' : ''}>Save contact</button></form></section>
      <a class="op-online-row" data-op-online href="${H(state.data.online_support)}" target="_blank" rel="noopener noreferrer"><span class="op-icon">${icon('chat')}</span><span><strong>Trip.com online support</strong><small>Needs internet</small></span>${icon('chevron')}</a>
      <p class="op-foot">Calls need a phone signal. A saved card always works — show it to someone nearby.</p>`;
  }
  let renderedRoute;
  function render() {
    const route = current();
    renderedRoute = route;
    document.body.classList.toggle('offline-open', ROUTES.includes(route));
    if (!ROUTES.includes(route)) return;
    const titles = { offline: 'Offline travel pack', 'offline-hotel': 'My hotel', 'offline-cards': 'Places & phrases', 'offline-guide': 'Get connected', 'offline-help': 'Help & contacts', 'offline-place': 'Service point' };
    const views = { offline: home, 'offline-hotel': hotel, 'offline-cards': cards, 'offline-guide': guide, 'offline-help': help, 'offline-place': place };
    let body = !state.ready ? '<div class="op-empty">Opening your saved pack…</div>' : state.dataError ? `<div class="op-empty"><h2>Guide not available on this device</h2><p>${H(state.dataError)}</p>${button('Try loading again', 'retry', '', 'secondary')}</div>` : views[route]();
    const notice = state.notice ? `<div class="op-notice ${state.noticeGood ? 'success' : ''}" role="status">${H(state.notice)}</div>` : '';
    screens[route].innerHTML = header(route, titles[route]) + `<main class="scroll op-body">${state.storageError ? note(state.storageError) : ''}${notice}${body}</main>` + footer(route);
    if (statusBar) screens[route].querySelector('.op-header').prepend(statusBar.cloneNode(true));
    networkChanged();
  }
  // 设计稿里的 iOS 状态栏（和教程屏一样从 Wi-Fi 引导屏克隆）
  const statusBar = document.querySelector('.screen[data-route="wifi"] [data-pencil-name="Status Bar"]');
  let registrationPromise;
  async function worker() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) throw new Error('Use HTTPS or localhost in a browser that supports offline packs.');
    const controller = navigator.serviceWorker.controller;
    if (controller?.scriptURL === new URL('sw.js', BASE).href) return controller;
    if (!registrationPromise) registrationPromise = navigator.serviceWorker.register(new URL('sw.js', BASE), { scope: BASE.pathname }).catch(error => { registrationPromise = null; throw error; });
    const registration = await registrationPromise;
    if (registration.active) return registration.active;
    const installing = registration.installing || registration.waiting;
    if (!installing) throw new Error('Offline setup is not ready. Try again while connected.');
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Offline setup timed out. Please retry.')), 20000);
      installing.addEventListener('statechange', () => {
        if (installing.state === 'activated') { clearTimeout(timer); resolve(installing); }
        else if (installing.state === 'redundant') { clearTimeout(timer); reject(new Error('Offline setup failed.')); }
      });
      if (installing.state === 'activated') { clearTimeout(timer); resolve(installing); }
    });
  }
  async function message(type, onProgress) {
    const target = await worker();
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      let timer;
      const close = () => { clearTimeout(timer); channel.port1.close(); };
      const arm = () => { clearTimeout(timer); timer = setTimeout(() => { close(); reject(new Error('Offline operation timed out. Recheck the download status before retrying.')); }, 30000); };
      channel.port1.onmessage = event => {
        arm();
        if (event.data.type === 'progress') { if (onProgress) onProgress(event.data); }
        else { close(); if (event.data.type === 'error') reject(new Error(event.data.message)); else resolve(event.data); }
      };
      arm(); target.postMessage({ type }, [channel.port2]);
    });
  }
  async function refreshStatus() {
    try { const result = await message('STATUS'); state.pack = result.pack; state.busy = result.busy; }
    catch (_) { state.pack = null; }
    syncPreflight();
  }
  function syncPreflight(data = window.lcPreflightData || staticPreflight) {
    const row = document.querySelector('.screen[data-route="preflight"] [data-pencil-name="Item Offline landing pack"]');
    if (row) {
      const desc = row.querySelector('[data-pencil-name="Item Desc"]');
      if (desc) desc.textContent = state.busy && state.progress ? `Downloading… ${state.progress.done} of ${state.progress.total} files · PVG T2`
        : state.pack ? 'Saved on this device · PVG T2 · ' + date(state.pack.savedAt) : 'Not saved on this device · download before you fly';
      let b = row.querySelector('[data-pencil-name="Item Button"]');
      if (!b) { b = document.createElement('button'); b.setAttribute('data-pencil-name', 'Item Button'); b.className = 'op-btn secondary'; b.style.cssText = 'width:auto;max-width:88px;min-height:34px;padding:6px 10px;border-radius:8px;font-size:12px;flex-shrink:0'; (row.querySelector('[data-pencil-name="Row"]') || row).append(b); }
      row.style.height = 'auto'; row.style.minHeight = '60px';
      b.style.visibility = 'visible'; b.dataset.act = 'go:offline';
      const label = b.querySelector('[data-pencil-name="Item Button Label"]');
      if (label) label.textContent = state.pack ? 'Open' : 'Save'; else b.textContent = state.pack ? 'Open pack' : 'Save pack';
      const st = row.querySelector('[data-pencil-name="State"]');
      if (st) { st.innerHTML = icon(state.pack ? 'check' : 'download'); st.style.color = state.pack ? '#1b8758' : '#2c61fe'; st.style.background = state.pack ? '#e6f7f0' : '#eaf0ff'; }
    }
    if (!data) return;
    const mock = data.items.find(item => item.id === 'pack');
    const done = data.ready - (mock?.status === 'done' ? 1 : 0) + (state.pack ? 1 : 0);
    const pct = Math.round(done / data.required * 100);
    const find = name => document.querySelector(`.screen[data-route="preflight"] [data-pencil-name="${name}"]`);
    if (find('Progress Label')) find('Progress Label').textContent = `${done} of ${data.required} ready · ${data.required - done} to do · ${data.optional_open} optional`;
    if (find('Progress Pct')) find('Progress Pct').textContent = pct + '%';
    if (find('Fill')) find('Fill').style.width = pct + '%';
    if (window.lcPackChanged) window.lcPackChanged(!!state.pack, done, data.required);
  }
  window.lcOfflineReadiness = syncPreflight;
  // 行前检查：权限页关闭后自动下载公共指引；返回 true 表示这次保存成功
  window.lcOffline = {
    saved: () => !!state.pack,
    busy: () => state.busy,
    save: async () => { if (state.busy || state.pack || !navigator.onLine) return false; await act('download'); return !!state.pack; },
  };
  function networkChanged() {
    document.querySelectorAll('[data-op-network]').forEach(item => {
      item.textContent = navigator.onLine ? 'Network detected' : 'Offline · saved content';
      item.hidden = navigator.onLine;
    });
    document.querySelectorAll('[data-op="download"]').forEach(item => { item.disabled = state.busy || !navigator.onLine || !('serviceWorker' in navigator); });
    document.querySelectorAll('[data-op-online]').forEach(item => item.setAttribute('aria-disabled', String(!navigator.onLine)));
  }
  window.addEventListener('online', networkChanged);
  window.addEventListener('offline', networkChanged);
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'LC_PACK_CHANGED') refreshStatus().then(() => { if (current() === 'offline') render(); });
  });
  async function load() {
    state.ready = false; state.dataError = ''; render();
    const results = await Promise.allSettled([
      fetch(new URL('data/offline-pvg-t2.json', BASE)).then(response => { if (!response.ok) throw new Error('Connect once to load and save the guide.'); return response.json(); }),
      Promise.all(['hotel', 'contacts', 'guide'].map(key => db.get(key))),
      refreshStatus(),
    ]);
    if (results[0].status === 'fulfilled') state.data = results[0].value;
    else state.dataError = 'Connect once to load and save the guide. Your previous private details have not been removed.';
    if (results[1].status === 'fulfilled') {
      const [hotel, contacts, guide] = results[1].value;
      state.hotel = hotel || null; state.contacts = contacts || [];
      if (guide && guideSnapshot(guide)) state.guide = { ...guideSnapshot(guide), history: (Array.isArray(guide.history) ? guide.history : []).map(guideSnapshot).filter(Boolean).slice(-50) };
    } else state.storageError = 'This browser could not open local storage. Details and progress cannot be saved. Enable site storage and try again.';
    state.ready = true; syncPreflight(); render();
    if (current() === 'offline-hotel') prepareHotel();
  }
  const dialog = document.createElement('dialog');
  dialog.className = 'lc-card-dialog'; dialog.setAttribute('aria-labelledby', 'op-dialog-title'); document.body.append(dialog);
  let dialogCopy = '', dialogFocus;
  function openCard(title, zh, en, context = '', demo = false) {
    dialogCopy = [zh, en, context].filter(Boolean).join('\n\n'); dialogFocus = document.activeElement;
    dialog.innerHTML = `<div class="op-dialog-wrap"><div class="op-dialog-header"><span id="op-dialog-title">${H(title)}</span><button class="op-back" type="button" data-op="dialog-close" aria-label="Close card">×</button></div><div class="op-dialog-body">${demo ? '<span class="op-demo">DEMO HOTEL</span>' : ''}<div lang="zh-CN">${H(zh)}</div><div lang="en">${H(en)}</div>${context ? `<div class="op-context">${H(context).replace(/\n/g, '<br>')}</div>` : ''}</div><div class="op-actions">${button('Larger text', 'dialog-size', '', 'secondary')}${button('Copy card', 'dialog-copy')}</div><p class="op-muted" data-copy-status role="status">Show this screen to a driver or staff member.</p></div>`;
    // 电脑上演示时 H5 显示在一个手机框里：卡片只铺满手机框（非模态 + Esc 关闭）；真机上照常全屏模态
    const phone = !document.body.classList.contains('mobile') && document.getElementById('phone');
    dialog.classList.toggle('in-phone', !!phone);
    (phone || document.body).append(dialog);
    if (phone) dialog.show(); else dialog.showModal();
  }
  dialog.addEventListener('keydown', event => { if (event.key === 'Escape' && dialog.open) { event.preventDefault(); dialog.close(); } });
  dialog.addEventListener('close', () => { if (dialogFocus?.isConnected) dialogFocus.focus(); });
  async function copy(text) {
    if (!text) throw new Error('There is nothing to copy yet.');
    try { if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(text); }
    catch (_) {
      const input = document.createElement('textarea'); input.value = text; input.setAttribute('readonly', ''); input.style.cssText = 'position:fixed;left:0;top:0;opacity:0';
      const host = dialog.open ? dialog : document.body; host.append(input); input.select(); input.setSelectionRange(0, text.length);
      let copied = false; try { copied = document.execCommand('copy'); } finally { input.remove(); }
      if (!copied) throw new Error('Could not copy. Open the large card and show the screen instead.');
    }
    live.textContent = 'Copied';
    if (dialog.open) dialog.querySelector('[data-copy-status]').textContent = 'Copied'; else toast('Copied');
  }
  async function transition(next, previous = false) {
    const snapshot = guideSnapshot(next);
    if (!snapshot) throw new Error('That guide step is not available.');
    const nextGuide = { ...snapshot, history: previous ? state.guide.history.slice(0, -1) : [...state.guide.history, guideSnapshot(state.guide)].slice(-50) };
    await db.put('guide', nextGuide); state.guide = nextGuide; state.notice = ''; render();
  }
  async function act(action, value, optionIndex) {
    if (action === 'nav') { state.notice = ''; navigate(value); }
    else if (action === 'back') { state.notice = ''; if (current() === 'offline-help') navigate(state.helpReturn); else if (current() === 'offline') show(state.entryReturn); else back(); }
    else if (action === 'help') { state.helpReturn = current(); state.notice = ''; navigate('offline-help'); }
    else if (action === 'return-help') { state.notice = ''; navigate(state.helpReturn === 'offline-help' ? 'offline' : state.helpReturn); }
    else if (action === 'retry') await load();
    else if (action === 'download') {
      if (state.busy) return;
      state.busy = true; state.notice = ''; state.progress = { done: 0, total: 1 }; render();
      try {
        const result = await message('DOWNLOAD', progress => {
          state.progress = progress;
          const progressEl = document.querySelector('.screen.on .op-progress');
          if (progressEl) { progressEl.max = progress.total; progressEl.value = progress.done; }
          const label = document.querySelector('[data-testid="pack-status"]');
          if (label) label.textContent = `Saving ${progress.done} of ${progress.total} files`;
          syncPreflight();
        });
        state.pack = result.pack;
        state.notice = 'Saved and checked · opens offline in this browser.'; state.noticeGood = true;
      } catch (error) {
        state.notice = error.message + ' Your previous complete pack, if any, is unchanged.'; state.noticeGood = false;
        await refreshStatus();
      } finally { state.busy = false; state.progress = null; syncPreflight(); render(); }
    }
    else if (action === 'edit-hotel') { state.editHotel = true; state.draft = null; state.hotelDirty = false; render(); }
    else if (action === 'cancel-hotel') { state.editHotel = false; state.draft = null; if (!state.hotel) navigate('offline'); else render(); }
    else if (action === 'new-hotel') { ++state.hotelEpoch; state.hotelManual = true; state.hotelLookup = 'manual'; state.hotelDirty = false; state.editHotel = true; state.draft = {}; state.notice = ''; render(); }
    else if (action === 'import-hotel') {
      state.hotelManual = false; state.notice = '';
      if (state.hotelCandidate) { state.draft = { ...state.hotelCandidate }; state.editHotel = true; state.hotelDirty = false; render(); }
      else await prepareHotel(true);
    }
    else if (action === 'hotel-card') {
      if (!state.hotel) { navigate('offline-hotel'); return; }
      const h = state.hotel; openCard('Hotel address', h.name_zh + '\n' + h.address_zh, h.name_en + '\n' + h.address_en, [h.phone ? 'Phone · ' + h.phone : '', h.notes].filter(Boolean).join('\n'), h.demo);
    }
    else if (action === 'copy-hotel') await copy([state.hotel?.name_zh, state.hotel?.address_zh, state.hotel?.name_en, state.hotel?.address_en].filter(Boolean).join('\n'));
    else if (action === 'tab') { state.tab = value; render(); }
    else if (action === 'place') { state.place = value; state.notice = ''; navigate('offline-place'); }
    else if (action === 'place-card') { const request = placeRequest(byId(value)); openCard('Please help me find this service', request.zh, request.en, request.context); }
    else if (action === 'place-service-card') { const p = byId(value), request = p.guidance.at_counter; openCard('At the service counter', request.zh, request.en, placeRequest(p).context); }
    else if (action === 'copy-place') { const request = placeRequest(byId(value)); await copy([request.zh, request.en, request.context].join('\n\n')); }
    else if (action === 'phrase' || action === 'copy-phrase') {
      const p = phrase(value); if (!p) return;
      if (action === 'copy-phrase') await copy(p.zh + '\n' + p.en);
      else { const hotelContext = (value === 'hotel' || value === 'contact-hotel') && state.hotel ? state.hotel.name_zh + '\n' + state.hotel.address_zh + (state.hotel.phone ? '\n' + state.hotel.phone : '') : ''; openCard('Bilingual request', p.zh, p.en, hotelContext, Boolean(hotelContext && state.hotel.demo)); }
    }
    else if (action === 'guide-request') {
      const request = currentRequest();
      const hotelContext = request.id === 'hotel' && state.hotel ? state.hotel.name_zh + '\n' + state.hotel.address_zh + (state.hotel.phone ? '\n' + state.hotel.phone : '') : '';
      openCard(request.label || 'Bilingual request', request.zh, request.en, hotelContext, Boolean(hotelContext && state.hotel.demo));
    }
    else if (action === 'guide-next') {
      const choice = state.data.guide.steps[state.guide.step].options[Number(optionIndex)];
      if (!choice || choice.next !== value) throw new Error('This step has changed. Choose an option again.');
      await transition({ step: value, request: choice.request, request_place: choice.request_place });
    }
    else if (action === 'guide-prev' && state.guide.history.length) await transition(state.guide.history.at(-1), true);
    else if (action === 'guide-reset') { const guide = { step: 'wifi', history: [] }; await db.put('guide', guide); state.guide = guide; state.notice = ''; render(); }
    else if (action === 'copy-number') await copy(value);
    else if (action === 'remove-contact') { const contacts = state.contacts.filter(contact => contact.id !== value); await db.put('contacts', contacts); state.contacts = contacts; render(); }
    else if (action === 'clear') {
      if (!confirm('Remove your hotel, personal contacts, guide progress, city stamps, local posts and sharing drafts from this browser? Public guides and artwork will remain saved.')) return;
      ++state.hotelEpoch; state.hotelCandidate = null; state.hotelLookup = 'manual'; state.hotelManual = true; state.hotelDirty = false;
      await db.clear(); state.hotel = null; state.contacts = []; state.guide = { step: 'wifi', history: [] }; state.draft = null; state.editHotel = false;
      state.helpReturn = 'offline'; dialogCopy = ''; if (dialog.open) dialog.close(); dialog.replaceChildren();
      ROUTES.forEach(route => screens[route].replaceChildren());
      notify('Personal details and guide progress cleared. Your public guide is unchanged.', true);
    }
    else if (action === 'dialog-close') dialog.close();
    else if (action === 'dialog-size') { const large = dialog.querySelector('.op-dialog-body').classList.toggle('is-large'); dialog.querySelector('[data-op="dialog-size"]').textContent = large ? 'Standard text' : 'Larger text'; }
    else if (action === 'dialog-copy') await copy(dialogCopy);
  }
  document.addEventListener('click', event => {
    const onlineLink = event.target.closest('[data-op-online]');
    if (onlineLink && !navigator.onLine) { event.preventDefault(); toast('This link needs internet. Your saved cards still work.'); return; }
    // Existing AI entries become local help while disconnected, without invoking classification.
    if (!navigator.onLine && event.target.closest('[data-pencil-name="Stuck FAB"], [data-pencil-name="Stuck Card"], [data-pencil-name="AI Pill"]')) {
      event.preventDefault(); event.stopImmediatePropagation(); state.helpReturn = current(); navigate('offline-help'); return;
    }
    const target = event.target.closest('[data-op]');
    if (!target || target.disabled) return;
    event.preventDefault(); event.stopImmediatePropagation();
    act(target.dataset.op, target.dataset.value, target.dataset.option).catch(error => {
      if (dialog.open) dialog.querySelector('[data-copy-status]').textContent = error.message;
      else notify(error.message || 'Could not save. Your previous details are unchanged.');
    });
  }, true);
  document.addEventListener('input', event => {
    const form = event.target.closest('#op-hotel-form');
    if (!form) return;
    state.hotelDirty = true;
    state.draft = { ...(state.draft || state.hotel || {}), ...Object.fromEntries(new FormData(form)), confirmed: form.elements.confirmed.checked };
    const preview = form.closest('.screen').querySelector(`[data-preview="${event.target.name}"]`);
    if (preview) preview.textContent = event.target.value.trim() || (event.target.name === 'name_zh' ? '酒店中文名称' : '酒店中文地址');
  });
  document.addEventListener('submit', async event => {
    if (!['op-hotel-form', 'op-contact-form'].includes(event.target.id)) return;
    event.preventDefault();
    const form = event.target;
    if (!form.reportValidity()) return;
    const values = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, String(value).trim()]));
    const submit = form.querySelector('[type="submit"]'); submit.disabled = true;
    try {
      if (!hasPhone(values.phone) && (values.phone || form.id === 'op-contact-form')) throw new Error('Enter a phone number with at least three digits.');
      if (form.id === 'op-hotel-form') {
        if (!['name_en', 'name_zh', 'address_en', 'address_zh'].every(key => values[key])) throw new Error('Complete both hotel names and addresses.');
        const hotel = { name_en: values.name_en, name_zh: values.name_zh, address_en: values.address_en, address_zh: values.address_zh, phone: values.phone, notes: values.notes, demo: Boolean((state.draft || state.hotel)?.demo), source: (state.draft || state.hotel)?.source || 'manual', savedAt: new Date().toISOString() };
        await db.put('hotel', hotel); ++state.hotelEpoch; state.hotel = hotel; state.editHotel = false; state.draft = null; state.hotelDirty = false; if (state.hotelLookup === 'loading') state.hotelLookup = 'idle';
        notify('Hotel saved on this device.', true);
      } else {
        if (!values.name) throw new Error('Enter a contact name.');
        const contacts = [...state.contacts, { id: crypto.randomUUID(), name: values.name, phone: values.phone }];
        await db.put('contacts', contacts); state.contacts = contacts; notify('Contact saved on this device.', true);
      }
    } catch (error) {
      // Keep the form and its unsaved input intact on validation or storage failure.
      let errorBox = form.querySelector('[role="alert"]');
      if (!errorBox) { errorBox = document.createElement('p'); errorBox.className = 'op-notice'; errorBox.setAttribute('role', 'alert'); form.prepend(errorBox); }
      errorBox.textContent = error.message || 'Could not save on this device.';
    } finally { if (submit.isConnected) submit.disabled = false; }
  });
  // 流程页顶部不再插离线包横幅（页面改版：一屏一个重点）；离线包从首页「Offline Pack」和行前检查进入
  const menu = document.getElementById('list');
  if (menu) { const entry = document.createElement('button'); entry.textContent = 'Offline travel pack · 离线包'; entry.dataset.op = 'nav'; entry.dataset.value = 'offline'; menu.prepend(entry); }
  const originalOnShow = window.lcOnShow;
  window.lcOnShow = route => {
    if (!ROUTES.includes(route) && originalOnShow) originalOnShow(route);
    render(); syncPreflight();
    if (route === 'offline-hotel') prepareHotel();
  };
  window.addEventListener('hashchange', () => { if (current() !== renderedRoute) render(); });
  const refreshHome = () => refreshStatus().then(() => { if (current() === 'offline') render(); });
  window.addEventListener('pageshow', () => { if (state.ready && current() === 'offline') refreshHome(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && state.ready && current() === 'offline' && !state.busy) refreshHome(); });
  if (ROUTES.includes(location.hash.slice(1))) show(location.hash.slice(1), false);
  syncPreflight(); load();
})();
