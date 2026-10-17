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
      check: 'M5 12l4 4L19 6', phone: 'M7 3H3c0 10 8 18 18 18v-4l-5-2-2 2a15 15 0 0 1-7-7l2-2z', pin: 'M12 22s8-8 8-14a8 8 0 0 0-16 0c0 6 8 14 8 14M15 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0' };
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
  function header(route, title) {
    return `<header class="op-header"><div class="op-topline"><button type="button" class="op-back" data-op="back" aria-label="Go back">${icon('back')}</button><h1 tabindex="-1">${H(title)}</h1></div><div class="op-meta"><span class="op-chip">PVG · Terminal 2</span><span class="op-chip ${navigator.onLine ? '' : 'is-offline'}" data-op-network>${navigator.onLine ? 'Network detected' : 'Offline · saved content'}</span></div></header>`;
  }
  function footer(route) {
    return `<footer class="op-footer">${route === 'offline-help' ? button('Return to my task', 'return-help', '', 'secondary') : `<button class="op-support" type="button" data-op="help"><span><img class="op-bot" src="img/ai-bot.png" alt="">I'm stuck</span><span>Works offline →</span></button>`}</footer>`;
  }
  function home() {
    const p = state.pack, mb = p ? (p.bytes / 1048576).toFixed(1) : null;
    const status = state.busy ? `Saving ${state.progress?.done || 0} of ${state.progress?.total || '…'} files` : p ? `Public guide saved · ${mb} MB` : 'Not downloaded yet';
    const continuing = state.guide.step !== 'wifi';
    const modules = [
      { icon: 'hotel', tone: 'hotel', category: 'Hotel address', title: 'Show my hotel', text: state.hotel ? state.hotel.name_en : 'A Chinese address for your driver.', action: state.hotel ? 'Open address' : 'Review my hotel', route: 'offline-hotel' },
      { icon: 'cards', tone: 'phrases', category: 'Places & phrases', title: 'Find local help', text: 'Where to go and what to say.', action: 'Find a service', route: 'offline-cards' },
      { icon: 'wifi', tone: 'internet', category: 'Connection guide', title: 'Get online', text: continuing ? 'Pick up where you left off.' : 'Wi-Fi stuck? Find your next step.', action: continuing ? 'Continue guide' : 'Start the guide', route: 'offline-guide' },
      { icon: 'help', tone: 'support', category: 'Help & contacts', title: 'Ask for help', text: 'Show a request or call a contact.', action: 'Open support', route: 'offline-help' },
    ];
    return `<section class="op-save-strip" aria-label="Download status"><div class="op-save-row"><span class="op-icon">${icon(p ? 'check' : 'download')}</span><div class="op-save-copy"><h3 data-testid="pack-status">${H(status)}</h3><p>${p ? 'Saved · ' + H(date(p.savedAt)) : 'Save before you fly to use this offline.'}</p></div>${button(state.busy ? 'Saving…' : p ? 'Update' : 'Save pack', 'download', '', 'op-save-action', state.busy || !navigator.onLine || !('serviceWorker' in navigator))}</div>
      ${state.progress ? `<progress class="op-progress" max="${state.progress.total}" value="${state.progress.done}" aria-label="Download progress"></progress>` : ''}</section>
      <div class="op-home-heading"><h2>What do you need right now?</h2><span>Choose your next step</span></div>
      <div class="op-grid">${modules.map(item => `<button class="op-tile op-tile--${item.tone}" type="button" data-op="nav" data-value="${item.route}"><span class="op-tile-top"><span class="op-icon">${icon(item.icon)}</span><span class="op-tile-category">${H(item.category)}</span></span><strong>${H(item.title)}</strong><small>${H(item.text)}</small><span class="op-tile-action">${H(item.action)}<span>${icon('arrow')}</span></span></button>`).join('')}</div>
      ${tripCounterEntry()}
      <p class="op-muted">${p ? (state.hotel ? 'Your hotel is saved separately on this device.' : 'Review your hotel to complete your personal pack.') : 'Keep this browser’s site data to retain your saved pack.'} Prepared for Shanghai Pudong T2. Service information checked ${H(state.data.checked_at)}.</p>
      <button type="button" class="op-text-btn" data-op="clear">Clear my personal data</button><p class="op-muted">Removes hotel, contacts, guide progress, city stamps and sharing drafts. Public guides and artwork stay saved.</p>`;
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
      return `<section class="op-card op-hotel-source"><div class="op-row"><span class="op-icon">${icon('hotel')}</span><div><div class="op-kicker">${looking ? 'FINDING YOUR HOTEL' : fromItinerary ? 'REVIEW, THEN SAVE' : 'YOUR HOTEL DETAILS'}</div><h2>${H(source)}</h2></div></div>
        <p class="op-muted">${looking ? 'You can start typing; your changes will be kept.' : fromItinerary ? 'We filled the available booking details below. Check them before saving for offline use.' : 'Use your booking confirmation. Missing Chinese details need to be checked with the hotel.'}</p>
        ${draft.demo ? '<div class="op-demo">DEMO ITINERARY · NOT A REAL BOOKING</div>' : ''}
        <div class="op-source-actions">${button(fromItinerary ? 'Enter a different hotel' : 'Start with a blank card', 'new-hotel', '', 'secondary')}${button('Use itinerary details', 'import-hotel', '', 'outline', looking)}</div>
        ${state.hotelCandidate && state.hotelDirty && !fromItinerary ? '<p class="op-muted">A hotel was found in the itinerary. Choose “Use itinerary details” to replace this draft.</p>' : ''}</section>
        <section class="op-card"><h2>${h ? 'Edit hotel' : 'Confirm your hotel'}</h2><p class="op-muted">Only details you confirm are saved. We do not guess or translate missing hotel names or addresses.</p>
        <form id="op-hotel-form">${field('Hotel name · English', 'name_en', draft.name_en, 'required autocomplete="organization"')}${field('酒店中文名称 · Chinese name', 'name_zh', draft.name_zh, 'required lang="zh-CN"')}${field('Address · English', 'address_en', draft.address_en, 'required')}${field('酒店中文地址 · Chinese address', 'address_zh', draft.address_zh, 'required lang="zh-CN"')}${field('Phone · optional', 'phone', draft.phone, 'type="tel" autocomplete="tel"')}
        <label class="op-field">Notes · optional<textarea name="notes" maxlength="600">${H(draft.notes)}</textarea></label>
        <label class="op-check"><input type="checkbox" name="confirmed" required ${draft.confirmed ? 'checked' : ''}><span>I have checked the Chinese name and address. Save these details on this device.</span></label>
        <button class="op-btn" type="submit" ${state.storageError ? 'disabled' : ''}>Save hotel on this device</button></form>
        ${button('Cancel', 'cancel-hotel', '', 'secondary')}</section>`;
    }
    return `<section class="op-card">${h.demo ? '<div class="op-demo">DEMO HOTEL · FROM SIMULATED ITINERARY</div>' : ''}<div class="op-kicker">YOUR DESTINATION</div><div class="op-hotel-name" lang="zh-CN">${H(h.name_zh)}</div><p class="op-zh" lang="zh-CN">${H(h.address_zh)}</p><p class="op-en" lang="en">${H(h.name_en)}<br>${H(h.address_en)}</p>${h.notes ? `<p class="op-muted">${H(h.notes)}</p>` : ''}
      ${button('Show address to driver / staff', 'hotel-card')}
      <div class="op-actions">${button('Copy address', 'copy-hotel', '', 'secondary')}${call(h.phone)}</div><button type="button" class="op-text-btn" data-op="edit-hotel">Edit saved hotel</button><p class="op-muted">Saved ${H(date(h.savedAt))}. Calls need a phone signal.</p></section>`;
  }
  function tripCounterEntry() {
    return `<section class="op-trip-entry"><button class="op-trip-link" type="button" data-op="place" data-value="exchange"><span class="op-trip-brand"><span>Trip.com <small>/ 携程</small></span><span class="op-trip-terminal">PVG T2</span></span><span class="op-trip-motif">${icon('pin')}</span><strong>Find the Trip.com counter</strong><span class="op-trip-description">Need cash? Find the currency-exchange counter and a request to show staff.</span><span class="op-trip-bottom"><span class="op-trip-cta">Show me where ${icon('arrow')}</span><span>Currency exchange</span></span></button><p class="op-trip-scope">For Wi-Fi or a SIM, choose airport services in Places & phrases.</p></section>`;
  }
  function placePreview(p) {
    const g = p.guidance;
    return `<button type="button" class="op-card op-place-choice" data-op="place" data-value="${H(p.id)}"><span class="op-icon">${icon(g.icon)}</span><span class="op-place-choice-copy"><strong>${H(g.title)}</strong><span>${H(g.summary)}</span><small>${H(g.location_hint)}</small></span>${icon('arrow')}</button>`;
  }
  function cards() {
    const tabs = ['Places', 'All phrases', 'Hotel', 'Internet', 'Payment', 'Mobile data', 'Help'];
    return `<div class="op-tabs" aria-label="Card category">${tabs.map(tab => `<button type="button" data-op="tab" data-value="${H(tab)}" aria-pressed="${state.tab === tab}">${H(tab === 'Places' ? 'Find help' : tab)}</button>`).join('')}</div>` + (state.tab === 'Places'
      ? `<div class="op-section-intro"><div class="op-kicker">WHERE TO GO · WHAT TO SAY</div><h2>What do you need help with?</h2><p class="op-muted">Choose a task. Find the right service, show a Chinese request, and keep a backup if it is unavailable.</p></div>${['wifi', 'sim', 'exchange', 'service'].map(id => placePreview(byId(id))).join('')}<p class="op-muted">Already with a staff member? Choose a phrase above, or open a task to show a request for that service.</p>`
      : `<section class="op-card">${state.data.phrases.filter(item => state.tab === 'All phrases' || item.category === state.tab).map(item => `<article class="op-phrase"><p class="op-zh" lang="zh-CN">${H(item.zh)}</p><p class="op-en" lang="en">${H(item.en)}</p><div class="op-actions">${button('Show large', 'phrase', item.id, 'secondary')}${button('Copy', 'copy-phrase', item.id, 'outline')}</div></article>`).join('')}</section>`);
  }
  function placeRequest(p) {
    return { ...p.guidance.request, context: '目的地 / Destination\n' + p.name_zh + '\n' + p.name + '\n\n地点参考 / Location reference\n' + p.guidance.staff_location.zh + '\n' + p.guidance.staff_location.en };
  }
  function place() {
    const p = byId(state.place) || byId('service'), g = p.guidance, request = placeRequest(p);
    return `<section class="op-card"><div class="op-row op-place-heading"><span class="op-icon">${icon(g.icon)}</span><div><div class="op-kicker">${H(p.category)}</div><h2>${H(g.title)}</h2></div></div><p>${H(g.summary)}</p><div class="op-location"><strong>${H(p.name)}</strong><p lang="zh-CN">${H(p.name_zh)}</p><p class="op-muted">${H(g.location_hint)}</p></div></section>
      <section class="op-card"><div class="op-kicker">1 · ASK WHERE TO GO</div><h3>Let staff point you to the right place</h3><p class="op-muted">Show the Chinese request below to an airport staff member.</p><div class="op-request-preview"><p lang="zh-CN">${H(request.zh)}</p><p class="op-en" lang="en">${H(request.en)}</p></div>${button('Show request to staff', 'place-card', p.id)}<div class="op-actions">${button('Copy request', 'copy-place', p.id, 'secondary')}</div></section>
      <section class="op-card"><div class="op-kicker">2 · FIND THE SERVICE</div><ol class="op-find-steps">${g.steps.map(step => `<li>${H(step)}</li>`).join('')}</ol>${button("I'm at the counter · what to ask", 'place-service-card', p.id, 'secondary')}
        <div class="op-fallback"><h3>Can’t find it, or is it closed?</h3><p>${H(g.fallback)}</p>${g.fallback_place ? button('Find airport service center', 'place', g.fallback_place, 'outline') : button('View help & airport contact', 'help', '', 'outline')}</div></section>
      <section class="op-card"><details class="op-service-details"><summary>Location, services & source details</summary><p>${H(p.location)}</p><p lang="zh-CN">${H(p.location_zh)}</p><p class="op-muted">${H(p.floor || 'Ask staff for the exact floor and desk marker.')}</p><p><strong>Services</strong><br>${H(p.services)}</p><p class="op-muted">${H(p.operator)}</p><p class="op-muted">${H(p.hours || 'Check opening hours with airport staff.')}</p>${note(p.note)}<img class="op-place-art" src="${H(p.image)}" alt="Illustration of a ${H(p.category)} sign, not a facility photo or map">${sources(p.sources)}</details></section>`;
  }
  function guide() {
    const step = state.data.guide.steps[state.guide.step] || state.data.guide.steps.wifi;
    const request = currentRequest();
    return `<div class="op-step-progress"><i></i> ${H(step.label)} · progress saved on this device</div><section class="op-card"><h2>${H(step.title)}</h2><p>${H(step.body)}</p><div class="op-request-preview"><div class="op-kicker">${H(request.label || request.category)}</div><p lang="zh-CN">${H(request.zh)}</p><p class="op-en" lang="en">${H(request.en)}</p></div>${button('Show bilingual request', 'guide-request', '', 'secondary')}
      ${step.place ? `<div style="margin-top:10px">${button('View ' + H(byId(step.place).name), 'place', step.place, 'outline')}</div>` : ''}
      ${step.alternative_place ? `<div style="margin-top:8px">${button('Airport service center alternative', 'place', step.alternative_place, 'outline')}</div>` : ''}${step.sources ? sources(step.sources) : ''}</section>
      <div class="op-guide-options" aria-label="Choose what happened">${step.options.map((option, index) => button(H(option.label) + icon('arrow'), 'guide-next', option.next, index ? 'outline' : '', false, { option: index })).join('')}</div>
      ${state.guide.history.length ? button('Previous step', 'guide-prev', '', 'secondary') : ''}<button type="button" class="op-text-btn" data-op="guide-reset">Restart connection guide</button>`;
  }
  function contactCard(contact, removable = false) {
    return `<article class="op-contact"><strong>${H(contact.name)}</strong>${contact.name_zh ? `<span lang="zh-CN">${H(contact.name_zh)}</span>` : ''}<div class="op-number">${H(contact.phone || 'Phone number not saved')}</div><div class="op-actions">${call(contact.phone)}${button('Copy number', 'copy-number', contact.phone || '', 'outline', !hasPhone(contact.phone))}</div>${removable ? `<button type="button" class="op-text-btn" data-op="remove-contact" data-value="${H(contact.id)}">Remove contact</button>` : ''}${contact.sources ? sources(contact.sources) : ''}</article>`;
  }
  function help() {
    const useGuideRequest = state.helpReturn === 'offline-guide';
    const usePlaceRequest = state.helpReturn === 'offline-place';
    return `${note('Calls need a phone signal. Online customer support needs internet. You can always show a saved card to someone nearby.')}
      <section class="op-card"><h2>Ask someone nearby</h2><p>${useGuideRequest ? 'Your request reflects the situation selected in your connection guide.' : usePlaceRequest ? 'Keep asking for the service you were looking for.' : 'Show a clear request to airport staff.'}</p>${button(useGuideRequest ? 'Show request for my situation' : usePlaceRequest ? 'Show request for this service' : 'Show “I cannot get online”', useGuideRequest ? 'guide-request' : usePlaceRequest ? 'place-card' : 'phrase', useGuideRequest ? '' : usePlaceRequest ? state.place : 'no-internet')}
      <div class="op-actions">${button('Find airport service center', 'place', 'service', 'secondary')}${state.hotel ? button('Show my hotel', 'hotel-card', '', 'secondary') : button('Add hotel address', 'nav', 'offline-hotel', 'secondary')}</div></section>
      ${tripCounterEntry()}
      <section class="op-card"><h2>Your contacts</h2>${state.hotel ? contactCard({ name: state.hotel.name_en, name_zh: state.hotel.name_zh, phone: state.hotel.phone }) : '<p class="op-muted">Add a hotel to keep its contact here.</p>'}${state.data.contacts.map(c => contactCard(c)).join('')}${state.contacts.map(c => contactCard(c, true)).join('')}</section>
      <section class="op-card"><h2>Add a personal contact</h2><form id="op-contact-form">${field('Name', 'name', '', 'required')}${field('Phone', 'phone', '', 'required type="tel"')}<p class="op-muted">Saved only in this browser.</p><button class="op-btn secondary" type="submit" ${state.storageError ? 'disabled' : ''}>Save contact</button></form></section>
      <section class="op-card"><h2>Trip.com online support</h2><p class="op-muted">Requires an internet connection.</p><a class="op-btn outline" data-op-online href="${H(state.data.online_support)}" target="_blank" rel="noopener noreferrer">Open online support</a></section>`;
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
      item.classList.toggle('is-offline', !navigator.onLine);
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
        state.notice = 'Saved and checked. Open this pack in this browser when you are offline.'; state.noticeGood = true;
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
  for (const route of ['wifi', 'step1', 'online', 'step3', 'driver']) {
    const host = document.querySelector(`.screen[data-route="${route}"] > .scroll`);
    if (!host) continue;
    const entry = document.createElement('button'); entry.className = 'op-entry'; entry.dataset.op = 'nav'; entry.dataset.value = 'offline';
    entry.innerHTML = `${icon('download')}<span>Offline travel pack<small>Your hotel, useful phrases & connection help</small></span>`;
    const body = [...host.children].find(node => ['Body', 'Content'].includes(node.dataset.pencilName));
    if (body) host.insertBefore(entry, body); else host.append(entry);
  }
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
