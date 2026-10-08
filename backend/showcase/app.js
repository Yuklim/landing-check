(() => {
  'use strict';

  // Keep this static page independent of model calls and API cold starts.
  const content = window.LC_EVIDENCE || [];
  let language = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'zh';
  let topic = 'all';
  let stageIndex = 0;
  let dialogState = null;
  let openedFromArchive = false;
  const dialog = document.getElementById('evidenceDialog');
  const dialogContent = document.getElementById('dialogContent');
  const pair = (zh, en) => [zh, en];
  const pick = value => Array.isArray(value) ? value[language === 'zh' ? 0 : 1] : value;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const english = {
    skip:'Skip to content',navigation:'Main navigation',sectionNavigation:'Project chapters',close:'Close',
    navResearch:'The need',navProduct:'The experience',navBuild:'Tech stack',tryDemo:'Try the prototype',
    heroCategory:'AI for inbound travel',heroTitle1:'First time in China? ',heroTitle2:'What happens after landing?',
    heroDescription:'Your flight and hotel are booked. You still need to check your internet connection, work out how to pay, and get from the airport to your hotel. Landing Check is a proposed feature for Trip.com that brings those preparations and instructions into the trip, with guidance when you need it.',
    seeProduct:'Watch the demo',factWindow:'The first hour in focus',factTasks:'Data · payment · hotel',factScenarios:'Knowledge scenarios',
    prototypeScreens:'Product prototype screens',prototypeTag:'Interactive prototype',visualNote:'Prepare before takeoff. Get help when it matters.',
    stripFor:'WHO IT’S FOR',stripAudience:'First visit · independent · prepared',stripForm:'PRODUCT FORM',stripShape:'A feature designed for Trip.com',stripStatus:'Now: H5 + API demo',
    contents:'ABOUT THE PROJECT',sectionNeeds:'Problem & need',sectionProduct:'The experience',sectionBuild:'Tech stack',sectionThoughts:'Our reflections',sectionNext:'What’s next',sidebarNote:'Designed for independent visitors making their first trip to China.',
    needsTitle:'Why we started Landing Check',needsDescription:'In public travel communities, we found travelers who had read guides, installed apps and even linked their cards, but were still worried about being able to pay in China. Others reached the airport before realizing they did not know how to buy a bottle of water. These questions led us to look at what happens between preparing the tools and actually using them.',
    filterNeeds:'Filter by traveler need',clickEvidence:'Select a card for the original and its context',evidenceFoot:'Headlines paraphrase public posts and comments. Open a card for the situation, follow-up and source.',allEvidence:'Explore the sources',
    guideContextTitle:'Travel guides already help people prepare',guideContextBody:'Creators on Instagram explain which apps to install and what to bring. These guides are a useful starting point. We read them alongside travelers’ questions to understand which information is already clear and which steps still cause hesitation in practice.',
    needsContext1:'We narrowed our audience to independent first-time visitors who can arrange their own flights and hotels. They are willing to prepare, but need to know which options work for their device and accounts, and what to do if an option fails. We started with the period before departure through leaving the airport, bringing connectivity, payment and the hotel journey into the same trip.',
    needsContext2:'There are limits to what this research tells us. Community questions show that these problems occur, but do not establish how often they occur or whether a guided sequence works better than a good travel guide. “The first hour” defines our product scope. Whether it reduces the work for travelers needs to be tested through real tasks.',
    methodTitle:'Research sources and how we checked them',methodBody:'We read public posts, comments and follow-up replies, keeping the situation and original link. Traveler questions, personal accounts and creator guides serve different purposes. When an issue was later resolved, the source record keeps that outcome too. These are deliberately selected cases; post popularity is not treated as a measure of how often a problem occurs.',researchDoc:'Read the demand assessment (Chinese)',sourceRecords:'Source and follow-up records',
    productTitle:'How the product works',productDescription:'Landing Check is designed as a feature within Trip.com. With access to the traveler’s flight and hotel details, it could prompt preparation before departure and offer relevant connectivity, payment and transport guidance on arrival. The H5 prototype below demonstrates this sequence. Select a stage to see its screen and how it works.',productFlow:'Product journey',
    paymentTaskTitle:'Treat payment preparation as one task',paymentTaskBody:'The preflight checklist places Alipay and TenPayGo in one Payment in China section. Completing a small test with either method marks the task complete; the other remains an optional backup. If a test fails, the page explains the error and offers a switch. The prototype uses simulated transactions. Production use still requires payment, refund and result-callback integration.',
    paymentTransportBody:'The transport page also checks what each option needs. DiDi inside Alipay cannot be booked through TenPayGo, so travelers who have only verified TenPayGo see a reminder to prepare Alipay or choose a transport option that accepts cash. We want those conditions to appear where the traveler is making the decision.',
    videoTitle:'Demo video',videoDescription:'About 57 seconds · English narration · Chinese and English subtitles',videoPending:'Follow a first-time visitor to China as Landing Check connects preparation with the steps after landing.',openFullDemo:'Open the interactive prototype',prototypeBoundary:'The current interactive prototype includes Alipay and TenPayGo. Payment verification, flights and trip data are simulated. The animation explains the product concept; refer to the live prototype for the current flow. Production app integration, real payments and automatic notifications are not connected. Screenshots retain the prototype’s English interface.',
    buildTitle:'Tech stack',buildDescription:'The demo consists of a browser-based H5 prototype and a Python API service. The frontend presents tasks and tutorials; the backend manages knowledge entries, classification requests and demo state. These are the technologies currently used and the parts they handle.',
    stackFrontendTitle:'Frontend and prototype: HTML, CSS, JavaScript',stackFrontendBody:'The interactive prototype uses plain HTML, CSS and JavaScript. Designs are stored in appearance.pen and exported through pen.dev, then a Python build script assembles the screens and click navigation. app.js calls the API, updates payment and trip state, and falls back to the static demo when the backend is unavailable. The showcase also uses plain frontend code; source dialogs, language switching and the product walkthrough do not depend on the backend.',
    stackBackendTitle:'APIs and rules: Python, FastAPI, Uvicorn',stackBackendBody:'FastAPI provides knowledge queries, screenshot classification, preflight checks and transport recommendations, with Uvicorn running the service. Pydantic validates requests and HTTPX calls the model. Explicit rules determine checklist status and transport options, including late arrivals, multiple bags and prebooked transfers. Flights, bookings and payment results currently come from mock APIs, with runtime state held in memory.',
    stackModelTitle:'Classification: DeepSeek and keyword rules',stackModelBody:'“I’m stuck” sends an uploaded screenshot or written description to DeepSeek; the code currently defaults to deepseek-flash. The model chooses from existing issues and returns an entry ID and confidence score. The backend validates the ID before reading the corresponding instructions. Uncertain results offer candidates for the traveler to confirm, while timeouts or model failures trigger keyword matching where possible. Generated advice for an issue outside the knowledge base is labeled unverified.',
    stackKnowledgeTitle:'Content: JSON entries and visual tutorials',stackKnowledgeBody:'The knowledge base is maintained as JSON files. It currently contains 41 entries across Alipay, WeChat Pay, DiDi, connectivity and TenPayGo. Each entry records its scope, steps, fallback, sources and verification date. Disputed figures are stored separately from traveler-facing instructions. A Python script validates structure and references, then exports illustrated entries as tutorial data for the H5, allowing new content without rebuilding the screens.',
    stackTestingTitle:'Testing and hosting: pytest, Playwright, GitHub Pages, Render',stackTestingBody:'pytest checks APIs, rules and payment state. Playwright exercises verification, failure recovery, screenshot help and navigation in the browser. The October 7 regression report records 82 backend tests and 19 H5 end-to-end tests passing. GitHub Pages hosts the showcase and H5, while Render hosts FastAPI; model keys are configured only on the server. Judges can open the prototype on a phone, and a static demo remains available without the backend.',
    thoughtsTitle:'Our reflections',thoughtsDescription:'During the project, we kept returning to a few practical questions: how a traveler knows they are ready, what help they need when an error appears, and how the result of one step affects the next choice. Those questions shaped the current prototype and what we still need to test.',
    thoughtFocusTitle:'Start with the task in front of the traveler',thoughtFocusBody:'A trip to China can involve translation, ordering food, attraction reservations and itinerary planning. The early proposal considered several of these. As we read specific questions, we became more interested in people who knew which apps they needed but were unsure what to do inside them. We narrowed this prototype to connectivity, payment and the hotel journey, moving preparation before departure where possible. That gave each screen a concrete task and a reason to appear at that point.',
    thoughtFocusLimit:'Choosing that scope does not validate the whole design. Some travelers complete their trips using guides and community replies, and airport staff also offer help. The value of Landing Check depends on whether it helps people find an applicable answer faster and avoid mistaken attempts. Bringing information together on a page is only part of that work.',
    thoughtPaymentTitle:'Two payment apps, one preparation task',thoughtPaymentBody:'When adding TenPayGo, we initially gave it a separate row beside Alipay. That added a choice but made preparing to pay look like two tasks. We later combined them into one Payment in China section: verifying either method completes the task, with the other as an optional backup. This change reminded us to organize the checklist around what the traveler needs to do. Adding another app should not automatically add another obligation.',
    thoughtPaymentLimit:'A small test also has limits. It can confirm a particular transaction, but cannot guarantee that the same method works with every merchant, ride or metro option. Overseas TenPayGo testing and Trip.com’s ability to support the relevant collection and refund flow still need confirmation. We kept the test concept while making transport-specific payment conditions and alternatives visible.',
    thoughtRecognitionTitle:'Similar errors can need different instructions',thoughtRecognitionBody:'TenPayGo and WeChat Pay can display the same bank-decline message. Reading that sentence alone can lead to the wrong app, so classification also uses layout, app names and keywords. When the screen is unclear, we offer candidates for confirmation. The model matches the issue; covered instructions come from the knowledge base so they can be checked and updated.',
    thoughtRecognitionEvidence:'Evaluation made the difference tangible. Scenario accuracy was about 94% on 64 labeled guide screenshots and about 84% on 75 Reddit user screenshots. Real submissions include failure dialogs, translation overlays and pages without much context, which are harder to classify than standard tutorial screens. These figures measure scenario classification. Whether travelers solve their problems by following the instructions needs a separate task test. There are also too few real TenPayGo failure screenshots for a dedicated evaluation.',
    thoughtFlowTitle:'The journey must handle failure and retries',thoughtFlowBody:'Integration checks exposed repeated verification clicks, requests that did not return, success copy left on failure screens, and old classification responses overwriting a newer screenshot. These issues were easier to see when using the whole flow than when reviewing individual screens. Fixes added duplicate-request handling, retryable timeouts and stale-response protection, followed by end-to-end checks of shared state across screens.',
    thoughtFlowLearning:'That changed how we judge completeness. Working buttons and a successful demonstration are a starting point. At an airport, people may repeat an action, switch away or lose connectivity. We need to consider what they see when they return, whether previous work is preserved, and where they can go after a failure. Existing tests cover known branches; real devices and tasks with target users still need to follow.',
    nextTitle:'What we plan to do next',nextDescription:'The prototype connects the main actions. Next we need to see whether it saves travelers effort and fill the gaps for use at the airport. We will test and improve the existing flow while confirming each required platform integration.',
    nextTestTitle:'Test the design through real tasks',nextTestBody:'Ask first-time visitors to prepare connectivity, interpret a payment error and choose an airport-to-hotel route using existing guides and then the prototype. Record completion, time, mistaken decisions and requests for help. Continue collecting public questions and volunteered cases, checking the actual resolution before adding entries. We also want to try photos of the surroundings and spoken descriptions for “I’m stuck,” first checking whether those inputs are more useful than screenshots and text.',
    nextOfflineTitle:'Add offline content and more languages',nextOfflineBody:'The current static demo is not a complete offline feature. We plan to download airport connectivity guidance, the hotel’s Chinese address and common tutorials before departure, using a Service Worker to cache them for poor connectivity. Guides will be pretranslated and reviewed, including menu paths and key steps, so opening a tutorial does not require waiting for an online translation.',
    nextIntegrationTitle:'Confirm Trip.com and payment integrations step by step',nextIntegrationBody:'Production use needs authorized read-only trip access, flight-status updates, in-app notifications and support handoff. With that information, guidance can use the actual arrival airport, time and hotel. When someone needs human help, we would also like to pass their current issue and attempted steps to support, with their confirmation, so they do not have to explain everything again.',
    nextPaymentBody:'Real verification requires partner support for test transactions, refunds and result callbacks. We need to confirm whether overseas tests work and what a test establishes before deciding how to display “verified.” If a method only supports transactions after arrival, the preflight check would cover installation and setup, with payment confirmed after landing. These integrations are still planned; flights, trips and payments in the demo remain simulated.',
    ctaTitle:'Try the prototype’s arrival journey',footerNote:'Trip Hackathon 2026 · An exploration in inbound travel',viewSource:'View source code',
    altPreflight:'Preflight preparation checklist screen',altLanding:'First arrival step: get online',altDriver:'Chinese hotel address card for a driver'
  };
  const originalText = new Map();
  document.querySelectorAll('[data-i18n]').forEach(node => originalText.set(node, node.textContent));
  const originalAttributes = new Map();
  document.querySelectorAll('[data-aria-key],[data-alt-key]').forEach(node => originalAttributes.set(node, {alt:node.getAttribute('alt'),aria:node.getAttribute('aria-label')}));
  const topics = [
    ['all',pair('全部','All')],['prep',pair('行前准备','Preparation')],['payment',pair('支付','Payment')],['connectivity',pair('联网','Connectivity')],['transport',pair('交通','Transport')]
  ];
  const labelFor = value => pick(topics.find(item => item[0] === value)?.[1] || pair('研究','Research'));
  const config = window.LC_SHOWCASE || {};
  if (config.demoUrl) {
    const demoUrl = new URL(config.demoUrl, location.href);
    if (['https:', 'http:'].includes(demoUrl.protocol)) {
      document.querySelectorAll('.demo-link').forEach(link => { link.href = demoUrl.href; });
    }
  }
  if (config.video?.src) {
    const mediaUrl = new URL(config.video.src, location.href);
    if (['https:', 'http:'].includes(mediaUrl.protocol)) {
      const video = document.createElement('video');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.setAttribute('aria-labelledby', 'videoTitle');
      video.src = mediaUrl.href;
      if (config.video.poster) video.poster = config.video.poster;
      for (const caption of config.video.captions || []) {
        const track = document.createElement('track');
        track.kind = 'captions';
        track.src = caption.src;
        track.srclang = caption.lang;
        track.label = caption.label;
        track.default = caption.lang === 'zh';
        video.appendChild(track);
      }
      document.getElementById('videoPanel').replaceChildren(video);
      video.addEventListener('loadedmetadata', updateCaptions);
    }
  }
  function updateCaptions() {
    const video = document.querySelector('#videoPanel video');
    if (!video) return;
    for (const track of video.textTracks) {
      track.mode = track.language === language ? 'showing' : 'disabled';
    }
  }
  const stages = [
    {label:pair('行前准备','Prepare'),title:pair('起飞前检查准备情况','Check preparation before departure'),image:'preflight.png',alt:pair('行前检查原型界面','Preflight checklist prototype'),body:pair('用户可以在起飞前查看联网方案、支付准备和接机安排。缺少流量时选择 eSIM 或其他联网方式，不熟悉支付应用时先看配置教程，再选择支付宝或 TenPayGo 做小额测试。','Before departure, travelers review connectivity, payment preparation and transfer arrangements. They can choose an eSIM or another connection option, read setup instructions, and select Alipay or TenPayGo for a small payment test.'),detail:pair('清单把需要完成的事情和可选服务分开，也保留备用支付方式。我们的目标是让用户看清还有哪些准备没有完成，尽量在出发前处理，而不是到了机场再重新查一遍攻略。','The checklist separates required preparation from optional services and keeps a backup payment method available. The aim is to show what is still missing while there is time to handle it before the flight.')},
    {label:pair('落地联网','Get online'),title:pair('落地后先确认网络能否使用','Check connectivity after landing'),image:'landing.png',alt:pair('落地联网任务原型界面','Arrival connectivity prototype'),body:pair('落地流程从确认网络开始：已有可用网络时继续下一步，需要机场 Wi-Fi 时查看对应的登录指引。手机号收不到验证码时，也能找到护照认证或服务台等备选入口。','The arrival flow starts with connectivity. Travelers who are already connected can continue; those who need airport Wi-Fi can read the relevant sign-in instructions. If a phone number cannot receive a code, the guide points to alternatives such as passport authentication or a service desk.'),detail:pair('这些指引按机场和适用条件维护，避免让游客只看到一个“连接失败”的结果。H5 展示了引导过程，系统设置跳转和完整设备检测仍需原生 App 支持。','Guidance records the airport and conditions where it applies, so a failed connection can lead to another option. The H5 demonstrates that guidance; system settings and full device checks still require native app support.')},
    {label:pair('截图求助','Get help'),title:pair('看不懂报错时上传截图','Upload a screenshot of an unclear error'),image:'stuck.png',alt:pair('我卡住了知识库识别结果','I’m stuck: knowledge-base recognition result'),body:pair('游客可以上传当前页面的截图，或者用一句话说明问题。模型从知识库已覆盖的场景中寻找匹配，结果页显示原因、具体操作步骤和备用办法，并保留来源与核验日期。','Travelers can upload the current screen or describe the issue in a sentence. The model looks for a match among covered scenarios. The result gives an explanation, actionable steps and a fallback, with sources and verification dates.'),detail:pair('如果截图不足以判断，就让用户从候选中确认；模型不可用时尝试规则匹配。知识库之外的问题会单独说明，避免把未经核验的建议和已经核对的步骤混在一起。','When the screenshot is ambiguous, travelers can confirm a candidate. Model failures fall back to rules where possible. Issues outside the knowledge base are identified separately so generated advice can be distinguished from checked instructions.')},
    {label:pair('前往酒店','Reach the hotel'),title:pair('选择交通，给司机看中文地址','Choose transport and show the Chinese address'),image:'driver.png',alt:pair('给司机看的中文地址卡','Chinese hotel address card for the driver'),body:pair('交通推荐结合落地时刻、人数、行李和已订接机，给出一种建议和其他可选方案。例如深夜抵达或行李较多时，优先考虑出租车；已经订好接机时，直接查看对应信息。','Transport recommendations use arrival time, travelers, luggage and booked transfers to suggest an option with alternatives. Late arrivals or extra luggage favor a taxi; travelers with a booked transfer can go straight to its details.'),detail:pair('确定方案后，用户可以打开中文酒店名称、地址和电话，直接展示给司机。页面也会说明不同交通方案的支付条件，帮助游客在出发前判断自己能否使用。','Travelers can then open the hotel name, address and phone number in Chinese and show them to the driver. Payment requirements appear with the transport options, helping them decide whether a route is usable before setting off.')}
  ];
  function renderFilters() {
    document.getElementById('evidenceFilters').innerHTML = topics.map(([id,label]) => `<button type="button" data-topic="${id}" aria-pressed="${topic === id}">${escape(pick(label))}</button>`).join('');
  }
  const sourceKinds = {
    question:pair('游客追问','Traveler question'),
    experience:pair('亲历自述','Personal account'),
    guide:pair('创作者攻略','Creator guide'),
    positive:pair('正向反馈','Positive account')
  };
  const kindLabel = item => pick(sourceKinds[item.kind] || sourceKinds.question);
  const platformMark = platform => {
    const marks = {
      YouTube:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 6 3-6 3Z"/></svg>',
      Instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8"/></svg>',
      X:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 3 12 18h4L8 3ZM20 3 4 21"/></svg>',
      Reddit:'<span aria-hidden="true">r</span>'
    };
    return `<span class="social-avatar platform-${platform.toLowerCase()}" aria-hidden="true">${marks[platform] || ''}</span>`;
  };
  function renderCloud() {
    let cards;
    if (topic === 'all') cards = content.filter(item => item.core);
    else cards = content.filter(item => item.topic === topic && !['guide','positive'].includes(item.kind));
    document.getElementById('socialCloud').innerHTML = cards.map((item,i) => `<button type="button" class="social-card" data-evidence="${item.id}" style="--i:${i}" aria-label="${escape(pick(pair('查看来源：','View source: ')) + pick([item.zh,item.en]))}"><span class="social-card-head">${platformMark(item.platform)}<span class="social-card-origin"><span class="platform">${escape(item.platform)}</span><span class="context">${escape(pick(item.context))}</span></span><span class="social-category">${escape(labelFor(item.topic))}</span></span><blockquote>${escape(pick([item.zh,item.en]))}</blockquote>${item.quote ? `<span class="original-excerpt" lang="en">“${escape(item.quote)}”</span>`:''}<span class="social-card-bottom"><span>${escape(kindLabel(item))}</span><span>${pick(pair('查看原帖','View source'))} ↗</span></span></button>`).join('');
  }
  function renderGuideContext() {
    document.getElementById('guideSources').innerHTML = content.filter(item => item.kind === 'guide').map(item => `<button type="button" class="guide-source" data-evidence="${item.id}">${platformMark(item.platform)}<span><span class="guide-source-label">Instagram · ${escape(kindLabel(item))}</span><strong>${escape(pick([item.zh,item.en]))}</strong><span class="guide-source-author">${escape(item.author)}</span></span><span class="guide-source-arrow" aria-hidden="true">↗</span></button>`).join('');
  }
  function renderProduct(restoreFocus=false) {
    const stage = stages[stageIndex];
    document.getElementById('productTabs').innerHTML = stages.map((item,i) => `<button id="stageTab${i}" type="button" role="tab" data-stage="${i}" aria-selected="${i === stageIndex}" aria-controls="productStage" tabindex="${i === stageIndex ? 0 : -1}"><span class="tab-number">0${i+1}</span>${escape(pick(item.label))}</button>`).join('');
    const panel=document.getElementById('productStage');
    panel.setAttribute('aria-labelledby',`stageTab${stageIndex}`);
    panel.innerHTML = `<div class="stage-image-wrap"><a class="stage-phone" href="assets/${stage.image}" target="_blank" rel="noopener" aria-label="${escape(pick(pair('打开原始截图：','Open the full-size screenshot: ')) + pick(stage.alt))}"><img src="assets/${stage.image}" width="786" height="1704" alt="${escape(pick(stage.alt))}" loading="lazy"></a></div><div class="stage-copy"><span class="stage-kicker">0${stageIndex+1} / ${escape(pick(stage.label))}</span><h3>${escape(pick(stage.title))}</h3><p>${escape(pick(stage.body))}</p><p>${escape(pick(stage.detail))}</p><a class="screenshot-link" href="assets/${stage.image}" target="_blank" rel="noopener">${pick(pair('查看原始截图','View the full-size screenshot'))}</a></div>`;
    if(restoreFocus) document.getElementById(`stageTab${stageIndex}`).focus({preventScroll:true});
  }
  function renderEvidence(item) {
    const fromArchive=openedFromArchive;
    dialogContent.innerHTML=`${fromArchive ? `<button class="archive-back" type="button" id="backToArchive">${pick(pair('‹ 返回来源索引','‹ Back to sources'))}</button>`:''}<h2 id="dialogTitle">${escape(pick([item.zh,item.en]))}</h2><div class="source-meta"><span>${escape(item.platform)} · ${escape(kindLabel(item))}</span>${item.author ? `<span>${escape(item.author)}</span>`:''}</div>${item.quote ? `<blockquote lang="en">“${escape(item.quote)}”</blockquote>`:''}<p class="source-story">${escape(pick(item.story))}</p><a class="dialog-source" href="${escape(item.url)}" target="_blank" rel="noopener">${pick(item.kind === 'guide' ? pair('阅读原攻略','Read the original guide'):pair('阅读原帖 / 评论','Read the original post / comment'))} ↗</a>`;
  }
  function openEvidence(id, fromArchive=false) {
    const item=content.find(entry=>entry.id===id);
    if(!item) return;
    openedFromArchive=fromArchive;
    dialogState=id;
    renderEvidence(item);
    if(!dialog.open) dialog.showModal();
    document.documentElement.classList.add('modal-open');
    document.getElementById('closeDialog').focus({preventScroll:true});
  }
  function renderArchive() {
    dialogContent.innerHTML=`<h2 id="dialogTitle">${pick(pair('需求研究 · 来源索引','Demand research · sources'))}</h2><p class="archive-intro">${pick(pair('游客追问、亲历反馈与旅行攻略。每条保留具体情境、已知后续和原始链接；攻略提供准备背景，正向体验也一并保留。','Traveler questions, personal accounts and travel guides. Each entry includes its situation, known follow-up and original link. Guides provide preparation context; positive experiences are included too.'))}</p><div class="archive-list">${content.map(item=>`<button class="archive-card" type="button" data-archive-evidence="${item.id}"><span class="archive-card-top"><span>${escape(item.platform)}</span><span>${escape(kindLabel(item))}</span></span><h3>${escape(pick([item.zh,item.en]))}</h3><p>${escape(item.author || pick(item.context))}${item.creator ? ` · ${escape(item.creator)}`:''}</p></button>`).join('')}</div>`;
  }
  function openArchive() {
    dialogState='archive';
    renderArchive();
    if(!dialog.open) dialog.showModal();
    document.documentElement.classList.add('modal-open');
    document.getElementById('closeDialog').focus({preventScroll:true});
  }
  function applyLanguage() {
    document.documentElement.lang=language==='zh'?'zh-CN':'en';
    document.title=pick(pair('Landing Check · 落地中国的第一小时','Landing Check · Your first hour in China'));
    document.querySelector('meta[name="description"]').content=pick(pair('Landing Check 为首次来华的自由行游客衔接行前准备、落地联网、支付和前往酒店。查看需求研究、产品原型与技术实现。','Landing Check connects preflight preparation, connectivity, payment and the first ride for independent visitors to China. Explore the research, prototype and implementation.'));
    originalText.forEach((value,node)=>{node.textContent=language==='zh'?value:(english[node.dataset.i18n] || value);});
    originalAttributes.forEach((value,node)=>{
      if(node.dataset.altKey) node.alt=language==='zh'?value.alt:(english[node.dataset.altKey] || value.alt);
      if(node.dataset.ariaKey) node.setAttribute('aria-label',language==='zh'?value.aria:(english[node.dataset.ariaKey] || value.aria));
    });
    const switcher=document.getElementById('languageSwitch');
    switcher.querySelector('.language-current').textContent=language==='zh'?'中':'EN';
    switcher.querySelector('.language-other').textContent=language==='zh'?'EN':'中';
    switcher.setAttribute('aria-label',language==='zh'?'Switch to English':'切换到中文');
    renderFilters();renderCloud();renderGuideContext();renderProduct();
    updateCaptions();
    if(dialog.open){if(dialogState==='archive') renderArchive();else renderEvidence(content.find(item=>item.id===dialogState));}
  }
  document.getElementById('languageSwitch').addEventListener('click',()=>{
    language=language==='zh'?'en':'zh';
    const url=new URL(location.href);
    if(language==='en')url.searchParams.set('lang','en');else url.searchParams.delete('lang');
    history.replaceState(null,'',url);
    applyLanguage();
  });
  document.getElementById('evidenceFilters').addEventListener('click',event=>{
    const button=event.target.closest('[data-topic]');if(!button)return;
    topic=button.dataset.topic;renderFilters();renderCloud();
    document.querySelector(`[data-topic="${topic}"]`).focus({preventScroll:true});
  });
  document.getElementById('needs').addEventListener('click',event=>{const card=event.target.closest('[data-evidence]');if(card)openEvidence(card.dataset.evidence);});
  document.getElementById('openArchive').addEventListener('click',openArchive);
  document.getElementById('closeDialog').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.documentElement.classList.remove('modal-open');dialogState=null;});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialogContent.addEventListener('click',event=>{
    const card=event.target.closest('[data-archive-evidence]');if(card)openEvidence(card.dataset.archiveEvidence,true);
    if(event.target.closest('#backToArchive')){openArchive();dialog.scrollTop=0;}
  });
  document.getElementById('productTabs').addEventListener('click',event=>{const tab=event.target.closest('[data-stage]');if(tab){stageIndex=Number(tab.dataset.stage);renderProduct(true);}});
  document.getElementById('productTabs').addEventListener('keydown',event=>{
    if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
    event.preventDefault();
    stageIndex=event.key==='Home'?0:event.key==='End'?stages.length-1:(stageIndex+(event.key==='ArrowRight'?1:-1)+stages.length)%stages.length;
    renderProduct(true);
  });
  const anchors=[...document.querySelectorAll('#sectionNav a')];
  let scrollPending=false;
  function updateScroll(){
    const height=document.documentElement.scrollHeight-innerHeight;
    document.querySelector('.reading-progress span').style.transform=`scaleX(${height>0?Math.max(0,Math.min(1,scrollY/height)):0})`;
    let current=anchors[0];
    const readingEdge=(parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)||100)+24;
    anchors.forEach(link=>{const section=document.querySelector(link.getAttribute('href'));if(section.getBoundingClientRect().top<=readingEdge)current=link;});
    anchors.forEach(link=>{const active=link===current;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    scrollPending=false;
  }
  addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateScroll);}},{passive:true});
  addEventListener('resize',updateScroll);
  applyLanguage();updateScroll();
})();
