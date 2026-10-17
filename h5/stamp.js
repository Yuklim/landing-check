/* The First Stamp: local keepsakes shown after the landing steps are done.
   底部 Community 是官方内容页（#explore）；本地演示社区（community / community-compose / community-post）已不在演示流程里，代码保留但没有入口。 */
(function () {
  'use strict';
  const ROUTES = ['share', 'community', 'community-compose', 'community-post', 'city-passport'];
  const BASE = new URL('./', location.href), db = window.LCOfflineDB, renderer = window.LCStampRenderer;
  const KEY = 'first-stamp';
  const H = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const current = () => document.querySelector('.screen.on')?.dataset.route;
  const today = () => new Intl.DateTimeFormat('en-CA', { year:'numeric', month:'2-digit', day:'2-digit', timeZone:'Asia/Shanghai' }).format(new Date());
  const fresh = () => ({ schema:1, draft:{name:'', arrival:today(), showName:false, showDate:false}, confirmations:{arrived:false, internet:false, payment:false, transport:false}, stamps:[], posts:[], bookmarks:[], composer:{caption:'', topic:'First Stamp'} });
  const state = { ready:false, config:null, personal:fresh(), error:'', storageError:'', notice:'', good:false, filter:'All stories', postId:null, busy:false, imageUrl:null, returnRoute:'done' };
  const screens = {};
  let rendered, renderToken = 0, epoch = 0, saveTimer, saveQueue = Promise.resolve();
  function icon(name) {
    const paths = {back:'M15 18l-6-6 6-6',arrow:'M5 12h14m-6-6 6 6-6 6',stamp:'M8 3h8v6l3 6H5l3-6zM4 19h16v3H4z',download:'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4',share:'M18 8a3 3 0 1 0-2.8-4M6 15a3 3 0 1 0 0-6m12 14a3 3 0 1 0-2.8-4M8 10l7-4M8 14l7 4',community:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',atlas:'M3 4l6-2 6 2 6-2v18l-6 2-6-2-6 2zM9 2v18M15 4v18',home:'M3 10l9-7 9 7v11H3zM9 21v-8h6v8',bookmark:'M6 3h12v19l-6-4-6 4z',help:'M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',check:'M5 12l4 4L19 6'};
    return `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name] || paths.stamp}"/></svg>`;
  }
  const btn = (text, action, value = '', tone = '', disabled = false) => `<button type="button" class="fs-btn ${tone}" data-fs="${H(action)}" data-value="${H(value)}" ${disabled ? 'disabled' : ''}>${text}</button>`;
  const stamp = () => state.personal.stamps.find(item => item.cityId === state.config?.city.id);
  const card = () => renderer.publicCard(state.config, state.personal.draft, stamp());
  function feedback(message, good = false) {
    state.notice = message; state.good = good;
    const el = screens[current()]?.querySelector('.fs-feedback');
    if (el) { el.textContent = message; el.classList.toggle('good', good); }
  }
  function releaseImage() {
    if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
    state.imageUrl = null; state.preparedShare = null;
    document.querySelectorAll('.fs-download-preview').forEach(el=>el.remove());
  }
  function persist() {
    const snapshot = structuredClone(state.personal), version = epoch;
    saveQueue = saveQueue.catch(() => {}).then(async () => {
      if (version !== epoch) throw new Error('Personal details were cleared.');
      await db.put(KEY, snapshot);
    });
    return saveQueue;
  }
  function autosave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => persist().catch(() => feedback('Could not save on this device. Keep this page open and enable site storage.')), 180);
  }
  async function flush() { clearTimeout(saveTimer); await persist(); }
  function go(route) { state.notice = ''; show(route); }
  for (const route of ROUTES) {
    if (!order.includes(route)) order.push(route);
    const screen = document.querySelector(`.screen[data-route="${route}"]`) || document.createElement('section');
    screen.className = 'screen lc-stamp' + (screen.classList.contains('on') ? ' on' : ''); screen.dataset.route = route; screen.lang = 'en'; screen.setAttribute('style', 'width:393px'); screen.setAttribute('aria-label', route === 'share' ? 'The First Stamp' : 'Travel community');
    if (!screen.isConnected) document.getElementById('phone').append(screen);
    else screen.replaceChildren();
    screens[route] = screen;
  }
  // 外框和其他页面一致：iOS 状态栏 + 居中标题；右上角进城市图鉴；底部是 App 的标签栏和「I'm stuck」小机器人
  const statusBar = document.querySelector('.screen[data-route="wifi"] [data-pencil-name="Status Bar"]');
  const appTabs = document.querySelector('.screen[data-route="home"] [data-pencil-name="Tab Bar"]');
  function header(title, route) {
    const atlas = route !== 'city-passport' ? `<button type="button" class="fs-back fs-atlas-btn" data-fs="nav" data-value="city-passport" aria-label="My city atlas">${icon('atlas')}</button>` : '<span class="fs-head-spacer"></span>';
    return `<header class="fs-head"><div class="fs-title-row"><button type="button" class="fs-back" data-fs="back" aria-label="Go back">${icon('back')}</button><h1 tabindex="-1">${H(title)}</h1>${atlas}</div></header>`;
  }
  function tabBar(route) {
    if (!appTabs) return '';
    const active = 'Tab My Trips';
    const bar = appTabs.cloneNode(true);
    bar.querySelectorAll('[data-pencil-name^="Tab "]').forEach(tab => {
      const name = tab.dataset.pencilName; if (name === 'Tab Icon' || name === 'Tab Label') return;
      const color = name === active ? '#2C61FE' : '#8A8F99';
      tab.querySelectorAll('[data-pencil-name="Tab Label"]').forEach(label => { label.style.color = color; label.style.fontWeight = name === active ? '600' : ''; });
      tab.querySelectorAll('[data-pencil-name="Tab Icon"] [stroke]:not([stroke="none"])').forEach(path => path.setAttribute('stroke', color));
      tab.querySelectorAll('[data-pencil-name="Tab Icon"] [fill]:not([fill="none"])').forEach(path => path.setAttribute('fill', color));
      if (name === 'Tab Community') { tab.dataset.act = 'go:explore'; tab.classList.add('tap'); }
    });
    return bar.outerHTML;
  }
  function footer(route) {
    if (route === 'share') return '';
    return `${help()}<div class="fs-tabs">${tabBar(route)}</div>`;
  }
  function help() { return `<button type="button" class="fs-stuck tap" data-act="api:stuck"><img src="img/ai-bot.png" alt="">I'm stuck</button>`; }
  function preview(publicCard = card()) {
    return `<figure class="fs-preview"><canvas data-fs-card role="img" aria-label="${H(`${publicCard.unlocked ? 'Unlocked' : 'Preview'} Shanghai souvenir. Traveler: ${publicCard.traveler}. Arrival: ${renderer.formatDate(publicCard.arrival)}.`)}" width="1080" height="1350"></canvas><figcaption>1080 × 1350 · Your digital city ticket</figcaption><div class="fs-preview-status" role="status">Preparing your keepsake…</div></figure>`;
  }
  function share() {
    const d = state.personal.draft, unlocked = stamp();
    return `<div class="fs-intro"><div><div class="fs-eyebrow">THE FIRST STAMP · SHANGHAI EDITION</div><p>${unlocked ? 'Your China story has begun.' : 'Every journey has a first page.'}</p></div><span class="fs-number">${unlocked ? '01' : '✦'}</span></div>
      ${preview()}<div class="fs-actions">${btn(icon('download')+' Save image','save-image')}${btn(icon('share')+' Share','share-image','','outline')}</div>
      <details class="fs-panel" data-fs-customize><summary>Make it yours · choose what to share</summary><form id="fs-customize"><label class="fs-field">Traveler nickname<input name="name" maxlength="40" value="${H(d.name)}" placeholder="Your name, if you choose" autocomplete="off"></label><label class="fs-check"><input name="showName" type="checkbox" ${d.showName?'checked':''}><span>Show my nickname on the card<small>Off by default. Otherwise your card says “A traveler”.</small></span></label><label class="fs-field">Arrival date · Shanghai local date<input name="arrival" type="date" value="${H(d.arrival)}" min="2000-01-01" max="2100-12-31" required></label><label class="fs-check"><input name="showDate" type="checkbox" ${d.showDate?'checked':''}><span>Show my arrival date<small>Off by default. The date stays private unless selected.</small></span></label></form><p class="fs-small">Only your selected nickname and date appear. Hotel details, live location, payment information and booking references are never included. Previously saved images and posts keep the information you chose at that time.</p></details>
      ${unlocked ? `<section class="fs-panel"><div class="fs-eyebrow">CITY NO. 001 · COLLECTED</div><h2>Shanghai is in your atlas.</h2><p class="fs-small">Collected when you finished your landing steps. No location tracking.</p>${btn('View my city atlas','nav','city-passport','secondary')}</section>` : ''}
      <section class="fs-panel"><div class="fs-eyebrow">THE NEXT CHAPTER</div><h2>Stories are better shared.</h2><p class="fs-small">See what other travelers are discovering in China right now.</p><div style="margin-top:12px">${btn(icon('community')+' See what other travelers share','nav','explore','secondary')}</div></section>${btn('Copy share caption','copy-caption','','outline')}`;
  }
  const posts = () => [...state.personal.posts, ...state.config.samplePosts];
  function cover(post) {
    if (post.card) return `<div class="fs-cover"><canvas data-fs-post-card="${H(post.id)}" width="1080" height="1350" role="img" aria-label="${H(post.card.city)} souvenir by ${H(post.card.traveler)}" style="width:100%;height:100%;object-fit:cover;object-position:center 32%"></canvas></div>`;
    if (post.image) return `<div class="fs-cover"><img src="${H(post.image)}" alt="${H(post.title)}" loading="lazy" referrerpolicy="no-referrer"></div>`;
    return post.cover === 'city' ? `<div class="fs-cover"><img src="${H(state.config.city.art)}" alt="${H(state.config.city.artAlt)}"></div>` : `<div class="fs-cover ${H(post.cover)}"><div class="fs-cover-quote">${post.cover==='tip'?'The right words.<br>A little less worry.':'Somewhere new.<br>Something yours.'}</div></div>`;
  }
  function postTile(post) {
    return `<article class="fs-post"><button class="fs-post-open" type="button" data-fs="open-post" data-value="${H(post.id)}">${cover(post)}<div class="fs-post-copy"><div class="fs-post-meta"><span>${H(post.topic)} · Shanghai</span><span class="fs-demo">${post.source?H(post.source):(post.demo?'Sample story':'Local demo post')}</span></div><h3>${H(post.title)}</h3><p>${H(post.body)}</p></div></button><div class="fs-post-bottom"><small>by ${H(post.author)}</small><button type="button" data-fs="bookmark" data-value="${H(post.id)}" aria-pressed="${state.personal.bookmarks.includes(post.id)}">${icon('bookmark')}${state.personal.bookmarks.includes(post.id)?'Saved':'Save story'}</button></div></article>`;
  }
  function community() {
    const visible = posts().filter(post => state.filter === 'All stories' || post.topic === state.filter);
    return `<section class="fs-community-hero"><img src="${H(state.config.city.art)}" alt="${H(state.config.city.artAlt)}"><div><div class="fs-eyebrow">SHANGHAI · CHINA</div><h2>A city of firsts.</h2><p>First steps. Small discoveries.<br>Your story belongs here, too.</p></div></section>
      <div class="fs-section-title"><h2>From one traveler to another.</h2></div><div class="fs-notice"><span class="fs-demo">Community demo</span><p style="margin-top:6px">The stories below are real, public posts from the Trip.com Moments community, shown as examples with a link to each original. Anything you write or save stays on this browser; it is not published to Trip.com.</p></div>
      ${btn(icon('stamp')+' Share my first stamp','compose')}<div class="fs-tags" aria-label="Story topics">${state.config.topics.map(topic=>`<button type="button" class="fs-tag" data-fs="filter" data-value="${H(topic)}" aria-pressed="${topic===state.filter}">${H(topic)}</button>`).join('')}</div>
      ${visible.length?visible.map(postTile).join(''):'<div class="fs-empty">Your next story starts here.</div>'}
      <section class="fs-panel"><h3>Keep exploring with Trip.com</h3><p class="fs-small">Browse the official Trip Moments community. This opens an external site and needs internet; posting there follows its own sign-in and publishing flow.</p><a class="fs-btn outline" style="margin-top:12px" data-fs-online href="https://www.trip.com/moments/" target="_blank" rel="noopener noreferrer">Open Trip Moments ↗</a></section>`;
  }
  function compose() {
    const draft = state.personal.composer;
    return `<div class="fs-demo">Local Community demo</div><div><h2>A first line for your story.</h2><p class="fs-small">Review your card and caption before saving a local post. No content is sent to Trip.com or another service.</p></div>${preview()}
      <form id="fs-compose-form" class="fs-panel"><label class="fs-field">Your story<textarea name="caption" maxlength="1000" required placeholder="What does the beginning feel like?">${H(draft.caption)}</textarea></label><label class="fs-field">Story topic<select name="topic">${state.config.topics.filter(t=>t!=='All stories').map(topic=>`<option ${draft.topic===topic?'selected':''}>${H(topic)}</option>`).join('')}</select></label><button type="button" class="fs-text-btn" data-fs="suggest-caption">Try a different opening line</button><p class="fs-small">Include only what you want others to read. Do not add hotel addresses, contact details or payment information.</p><label class="fs-check"><input type="checkbox" name="reviewed" required><span>I have reviewed the image and text for sharing.</span></label><button class="fs-btn" type="submit" ${!stamp()?'disabled':''}>Save post to this demo Community</button>${!stamp()?'<p class="fs-small" style="margin-top:10px">This card is a preview. Confirm your arrival essentials to unlock it before creating a post.</p>':''}</form>
      ${btn('Edit card & public fields','edit-card','','outline')}<p class="fs-small">Draft saved on this device. Official Trip.com publishing requires a separate integration.</p>`;
  }
  function story() {
    const post = posts().find(item=>item.id===state.postId) || posts()[0];
    if (!post) return '<div class="fs-empty">This post is no longer available.</div>';
    state.postId = post.id;
    return `<div class="fs-demo">${post.source?('From '+H(post.source)):(post.demo?'Illustrative sample story':'Local demo post · on this browser only')}</div><div><div class="fs-eyebrow">${H(post.topic)} · SHANGHAI</div><h2 style="font-size:38px;margin-top:9px">${H(post.title)}</h2><p class="fs-story-author">by ${H(post.author)}</p></div>${post.card?preview(post.card):cover(post)}<p class="fs-story-body">${H(post.body)}</p>${post.sourceUrl?`<p class="fs-small"><a href="${H(post.sourceUrl)}" target="_blank" rel="noopener noreferrer">View the original on Trip.com ↗</a></p>`:''}
      ${btn(icon('bookmark')+(state.personal.bookmarks.includes(post.id)?' Saved to my atlas':' Save this story'),'bookmark',post.id,'outline')}${post.topic==='Local Tips'?btn('Open my offline travel pack','nav','offline','secondary'):''}
      ${!post.demo?btn('Delete this local post','delete-post',post.id,'danger'):''}${btn('Back to Shanghai Community','nav','community','secondary')}`;
  }
  function atlas() {
    const collected = stamp();
    return `<section class="fs-atlas"><div class="fs-count">${collected?'01':'00'}</div><div class="fs-eyebrow">MY CITY ATLAS</div><h2>Places become<br>part of you.</h2><p class="fs-small">${collected?'One city collected. A thousand stories ahead.':'Your first China stamp is waiting.'}</p></section>
      <button class="fs-city-tile ${collected?'':'locked'}" type="button" ${collected?'data-fs="nav" data-value="share"':'disabled'}><span class="fs-seal">沪<small>${collected?'UNLOCKED':'WAITING'}</small></span><span><span class="fs-eyebrow">CITY NO. 001</span><strong>Shanghai</strong><p>${collected?'First arrival · '+H(renderer.formatDate(collected.arrival)):'Finish your landing steps to light up Shanghai.'}</p><p>${collected?'View & export my keepsake →':'Not collected yet'}</p></span></button><p class="fs-milestone">“Thousands of miles away from home,<br>and a new story has just begun.”</p>
      <section class="fs-panel"><h3>Your collection stays with you.</h3><p class="fs-small">Stored on this browser, without location tracking. Clearing site data or switching browsers removes this local collection. More city editions are planned; only Shanghai is available in this version.</p></section><div class="fs-clear-row"><button type="button" class="fs-text-btn" data-fs="clear-stamps">Clear my stamps, posts & sharing drafts</button><p class="fs-small">Your offline hotel and contacts will be kept. The offline pack’s “Clear my personal data” option clears everything together.</p></div>`;
  }
  function drawPreviews() {
    const token = ++renderToken, route = current(), host = screens[route];
    if (!state.config || !host) return;
    const selected = route==='community-post' ? posts().find(p=>p.id===state.postId)?.card || card() : card();
    for (const canvas of host.querySelectorAll('[data-fs-card], [data-fs-post-card]')) {
      const snapshot = canvas.dataset.fsPostCard ? posts().find(post=>post.id===canvas.dataset.fsPostCard)?.card : selected;
      if (!snapshot) continue;
      renderer.draw(canvas,snapshot,state.config).then(()=>{
        if (token!==renderToken || !canvas.isConnected) return;
        const status=canvas.closest('figure')?.querySelector('.fs-preview-status'); if(status) status.textContent='';
      }).catch(error=>{
        if (token!==renderToken || !canvas.isConnected) return;
        const status=canvas.closest('figure')?.querySelector('.fs-preview-status'); if(status) status.textContent=error.message;
        feedback(error.message);
      });
    }
  }
  // 分享页只从完成页进入，落地流程已经确认过落地 / 联网 / 支付 / 上车：直接收集印章，不再让用户勾一遍
  function collect() {
    if (!state.ready || state.error || !state.config || stamp()) return;
    state.personal.stamps.push({cityId:state.config.city.id,sequence:1,arrival:state.personal.draft.arrival,confirmedAt:new Date().toISOString(),source:'landing-flow'});
    if (!state.storageError) flush().catch(()=>{});
  }
  function render() {
    if(rendered && rendered!==current()){state.notice='';state.good=false;}
    rendered = current();
    document.body.classList.toggle('stamp-open',ROUTES.includes(rendered));
    if (!ROUTES.includes(rendered)) return;
    document.body.classList.remove('offline-open');
    const titles = {share:'Share your first stamp',community:'Shanghai Community','community-compose':'Share a little story','community-post':'A page from the journey','city-passport':'My city atlas'};
    const views = {share,community,'community-compose':compose,'community-post':story,'city-passport':atlas};
    if (rendered==='share') collect();
    const body = !state.ready?'<div class="fs-empty">Opening your collection…</div>':state.error?`<div class="fs-empty"><h2>Your keepsake is waiting.</h2><p>${H(state.error)}</p>${btn('Try again','retry','','outline')}</div>`:views[rendered]();
    screens[rendered].innerHTML=header(titles[rendered],rendered)+`<main class="scroll fs-body"><div class="fs-feedback fs-notice ${state.good?'good':''}" role="status">${H(state.notice)}</div>${state.storageError?`<div class="fs-notice">${H(state.storageError)}</div>`:''}<div class="fs-offline-label" data-fs-network ${navigator.onLine?'hidden':''}>Offline · saved artwork, cards & drafts still work</div>${body}</main>`+footer(rendered);
    if (statusBar) screens[rendered].querySelector('.fs-head').prepend(statusBar.cloneNode(true));
    if (state.ready && !state.error) drawPreviews();
  }
  function capture(form) {
    if (form.id==='fs-customize') {
      state.personal.draft={name:form.elements.name.value,arrival:form.elements.arrival.value,showName:form.elements.showName.checked,showDate:form.elements.showDate.checked};
      releaseImage(); drawPreviews();
    } else if(form.id==='fs-compose-form') state.personal.composer={caption:form.elements.caption.value,topic:form.elements.topic.value};
    autosave();
  }
  function caption() {
    const publicCard=card();
    return `${publicCard.traveler==='A traveler'?'':publicCard.traveler+' · '}Hello, ${publicCard.city}.${publicCard.arrival?' '+renderer.formatDate(publicCard.arrival)+'.':''}\n${state.config.storyPrompts[0]}\n#LandingCheck #TheFirstStamp #Shanghai\n${state.config.template.publicUrl}`;
  }
  async function copy(text) {
    try { if (!navigator.clipboard?.writeText) throw new Error(); await navigator.clipboard.writeText(text); }
    catch (_) { const input=document.createElement('textarea'); input.value=text; input.style.cssText='position:fixed;opacity:0'; document.body.append(input); input.select(); const copied=document.execCommand('copy'); input.remove(); if(!copied) throw new Error('Could not copy. Select and copy the caption manually in the story editor.'); }
  }
  async function output(shareImage) {
    if(state.busy) return;
    if(state.personal.draft.showDate && !renderer.validDate(state.personal.draft.arrival))throw new Error('Choose a valid arrival date, or turn off “Show my arrival date”.');
    state.busy=true; const version=epoch;
    const snapshot=card(), publicText=caption();
    feedback('Preparing a full-resolution image…');
    try {
      // Prepare first, then offer a separate gesture for native sharing (transient activation).
      const blob=await renderer.blob(snapshot,state.config);
      if(version!==epoch) return;
      if(JSON.stringify(snapshot)!==JSON.stringify(card()))throw new Error('Your public fields changed while the image was being prepared. Generate the image again.');
      releaseImage(); state.imageUrl=URL.createObjectURL(blob);
      if(shareImage) {
        const file=new File([blob], 'landing-check-shanghai.png', {type:'image/png'});
        state.preparedShare={file,text:publicText,epoch:version,card:JSON.stringify(snapshot)};
        const area=screens[current()].querySelector('.fs-feedback');
        area.replaceChildren(document.createTextNode('Your image is ready. '));
        const button=document.createElement('button'); button.type='button'; button.className='fs-btn'; button.style.marginTop='8px'; button.dataset.fs='native-share'; button.textContent='Open sharing options'; area.append(button);
      } else {
        const a=document.createElement('a'); a.href=state.imageUrl; a.download='landing-check-shanghai.png'; document.body.append(a); a.click(); a.remove();
        feedback('Image download requested. If your browser shows the image instead, use its Save Image option.',true);
      }
      showImageFallback();
    } finally { state.busy=false; }
  }
  function showImageFallback() {
    const host=screens[current()]?.querySelector('.fs-body'); if(!host || !state.imageUrl) return;
    host.querySelector('.fs-download-preview')?.remove();
    const details=document.createElement('details'); details.className='fs-panel fs-download-preview';
    const summary=document.createElement('summary'); summary.textContent='Open image to save manually';
    const img=document.createElement('img'); img.src=state.imageUrl; img.alt='Your exported public Shanghai souvenir';
    const p=document.createElement('p'); p.className='fs-small'; p.textContent='On mobile, open this image and use your browser’s Save Image or long-press menu.';
    details.append(summary,img,p); host.append(details);
  }
  async function nativeShare() {
    const prepared=state.preparedShare;
    if(!prepared || prepared.epoch!==epoch || prepared.card!==JSON.stringify(card())) throw new Error('Generate your image again before sharing.');
    if(!navigator.canShare?.({files:[prepared.file]}) || !navigator.share) { feedback('File sharing is unavailable here. Save the image and copy the caption to post in your preferred app.'); return; }
    try { await navigator.share({files:[prepared.file],title:'The First Stamp · Shanghai',text:prepared.text}); feedback('Your image was handed to the sharing interface. Complete posting in the app you choose.',true); }
    catch(error) { if(error.name==='AbortError') feedback('Sharing canceled. Your card is still here.'); else throw new Error('Could not open sharing. Save the image and share it from your preferred app.'); }
  }
  async function action(type,value) {
    if(type==='nav') go(value);
    else if(type==='back') { state.notice=''; back(); }
    else if(type==='retry') await load();
    else if(type==='save-image') await output(false);
    else if(type==='share-image') await output(true);
    else if(type==='native-share') await nativeShare();
    else if(type==='copy-caption') { await copy(caption()); feedback('Public caption copied. Only your chosen nickname and date are included.',true); }
    else if(type==='compose') {
      if(!state.personal.composer.caption) state.personal.composer.caption=state.config.storyPrompts[0];
      await flush(); go('community-compose');
    } else if(type==='edit-card') { go('share'); const section=screens.share.querySelector('[data-fs-customize]'); section.open=true; section.scrollIntoView({block:'center',behavior:'smooth'}); }
    else if(type==='filter') { state.filter=value; render(); }
    else if(type==='open-post') { state.postId=value; go('community-post'); }
    else if(type==='bookmark') {
      const previous=state.personal.bookmarks.slice();
      state.personal.bookmarks=previous.includes(value)?previous.filter(id=>id!==value):[...previous,value];
      try {await flush();} catch(error) {state.personal.bookmarks=previous;throw error;}
      render(); feedback(state.personal.bookmarks.includes(value)?'Story saved to your city atlas.':'Story removed from saved stories.',true);
    } else if(type==='suggest-caption') {
      const lines=state.config.storyPrompts, at=lines.indexOf(state.personal.composer.caption);
      state.personal.composer.caption=lines[(at+1)%lines.length];
      const input=screens[current()].querySelector('[name=caption]');input.value=state.personal.composer.caption;autosave();
    } else if(type==='delete-post') {
      if(!confirm('Delete this post from this browser’s demo Community?'))return;
      const previous=structuredClone(state.personal);
      state.personal.posts=state.personal.posts.filter(post=>post.id!==value);state.personal.bookmarks=state.personal.bookmarks.filter(id=>id!==value);
      try {await flush();} catch(error) {state.personal=previous;throw error;}
      go('community'); feedback('Local post deleted.',true);
    } else if(type==='clear-stamps') {
      if(!confirm('Clear your city stamps, local posts, saved stories and sharing drafts? Your offline hotel and contacts will remain.'))return;
      clearTimeout(saveTimer); await saveQueue.catch(()=>{}); epoch++; await db.put(KEY,fresh()); reset(); render(); feedback('Stamps, posts and sharing drafts cleared. Your hotel and contacts are kept.',true);
    }
  }
  async function submit(form) {
    capture(form); clearTimeout(saveTimer);
    if(form.id==='fs-compose-form') {
      if(!stamp()) throw new Error('Finish your landing steps to collect your stamp before creating a post.');
      const body=state.personal.composer.caption.trim();if(!body)throw new Error('Write a short story first.');
      const snapshot=card(), previous=structuredClone(state.personal), id=crypto.randomUUID();
      const post={id,topic:state.personal.composer.topic,title:Array.from(body.split(/[\n.!?]/)[0] || 'Hello, Shanghai.').slice(0,85).join(''),body,author:snapshot.traveler,card:snapshot,demo:false,savedAt:new Date().toISOString()};
      state.personal.posts.unshift(post);state.personal.composer={caption:'',topic:'First Stamp'};
      try {await flush();} catch(error) {state.personal=previous;throw error;}
      state.postId=id;go('community-post');feedback('Saved to this demo Community on this browser. Not published to Trip.com.',true);
    }
  }
  function reset() {
    epoch++;clearTimeout(saveTimer);releaseImage();state.preparedShare=null;state.personal=fresh();state.notice='';state.postId=null;state.filter='All stories';renderToken++;
    for(const screen of Object.values(screens))screen.replaceChildren();
  }
  async function load() {
    state.ready=false;state.error='';render();const version=epoch;
    const results=await Promise.allSettled([fetch(new URL('data/first-stamp.json',BASE)).then(r=>{if(!r.ok)throw new Error();return r.json();}),db.get(KEY)]);
    if(version!==epoch)return;
    if(results[0].status==='fulfilled' && results[0].value.schema===1)state.config=results[0].value;
    else state.error='Connect once and save the latest offline pack to load the Shanghai artwork and templates.';
    if(results[1].status==='fulfilled') {
      const saved=results[1].value;
      if(saved?.schema===1)state.personal={...fresh(),...saved,draft:{...fresh().draft,...saved.draft},confirmations:{...fresh().confirmations,...saved.confirmations},composer:{...fresh().composer,...saved.composer}};
    } else state.storageError='Local storage is unavailable. You can preview and export, but stamps and stories cannot be saved until site storage is enabled.';
    state.ready=true;render();
  }
  document.addEventListener('click',event=>{
    const external=event.target.closest('[data-fs-online]');
    if(external && !navigator.onLine){event.preventDefault();feedback('Trip Moments needs internet. Your local stories and drafts are still available.');return;}
    const target=event.target.closest('[data-fs]');if(!target || target.disabled)return;
    event.preventDefault();event.stopImmediatePropagation();
    action(target.dataset.fs,target.dataset.value).catch(error=>feedback(error.message||'Could not save on this device. Please retry.'));
  },true);
  document.addEventListener('input',event=>{const form=event.target.closest('form');if(['fs-customize','fs-compose-form'].includes(form?.id))capture(form);});
  document.addEventListener('change',event=>{const form=event.target.closest('form');if(['fs-customize','fs-compose-form'].includes(form?.id))capture(form);});
  document.addEventListener('submit',async event=>{
    if(!['fs-customize','fs-compose-form'].includes(event.target.id))return;event.preventDefault();
    const form=event.target;if(!form.reportValidity())return;
    const button=form.querySelector('[type=submit]');if(button)button.disabled=true;
    try{await submit(form);}catch(error){feedback(error.message||'Could not save. Your previous collection is unchanged.');}finally{if(button?.isConnected)button.disabled=false;}
  });
  // 底部「Community」是官方内容页（#explore），本地 Shanghai Community 只从分享流程里进入
  document.querySelectorAll('[data-pencil-name="Tab Community"]').forEach(tab=>{tab.dataset.act='go:explore';tab.classList.add('tap');tab.setAttribute('role','button');tab.tabIndex=0;tab.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();go('explore');}});});
  const done=document.querySelector('.screen[data-route="done"]');
  const title=done?.querySelector('[data-pencil-name="Share Title"]');if(title)title.textContent='Collect your first city stamp';
  const sub=done?.querySelector('[data-pencil-name="Share Sub"]');if(sub)sub.textContent='A Shanghai keepsake, made for your story.';
  // 分享页是落地全部完成后的独立页面：只从完成页的「Share Card」进入，首页 / My Trips 不再放入口
  const menu=document.getElementById('list');if(menu)for(const [text,route]of[['The First Stamp · 城市票根','share'],['My city atlas · 城市图鉴','city-passport']]){const button=document.createElement('button');button.textContent=text;button.dataset.fs='nav';button.dataset.value=route;menu.append(button);}
  const previousShow=window.lcOnShow;
  window.lcOnShow=route=>{if(!ROUTES.includes(route) && previousShow)previousShow(route);render();};
  window.addEventListener('hashchange',()=>{if(current()!==rendered)render();});
  window.addEventListener('online',()=>{document.querySelectorAll('[data-fs-network]').forEach(el=>el.hidden=true);});
  window.addEventListener('offline',()=>{document.querySelectorAll('[data-fs-network]').forEach(el=>el.hidden=false);});
  window.addEventListener('lc-private-clearing',()=>{epoch++;clearTimeout(saveTimer);state.preparedShare=null;releaseImage();});
  window.addEventListener('lc-private-cleared',()=>{reset();render();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden && state.ready && !state.storageError && !state.error){clearTimeout(saveTimer);persist().catch(()=>{});}});
  if(ROUTES.includes(location.hash.slice(1)))show(location.hash.slice(1),false);
  load();
})();
