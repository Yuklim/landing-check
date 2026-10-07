(() => {
  'use strict';

  // Keep this static page independent of model calls and API cold starts.
  const content = window.LC_EVIDENCE || [];
  let language = 'zh';
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
    navResearch:'The need',navProduct:'The experience',navBuild:'How it works',tryDemo:'Try the prototype',
    heroCategory:'AI for inbound travel',heroTitle1:'Touch down in China.',heroTitle2:'Know your next step.',
    heroDescription:'From preflight preparation to getting online, paying and reaching your hotel. Help independent first-time visitors know what to do at every step.',
    seeProduct:'See the experience',factWindow:'The first hour in focus',factTasks:'Data · payment · hotel',factScenarios:'Knowledge scenarios',
    prototypeScreens:'Product prototype screens',prototypeTag:'Interactive prototype',visualNote:'Prepare before takeoff. Get help when it matters.',
    stripFor:'WHO IT’S FOR',stripAudience:'First visit · independent · prepared',stripForm:'PRODUCT FORM',stripShape:'A feature designed for Trip.com',stripStatus:'Now: H5 + API demo',
    contents:'THE PROJECT STORY',sectionNeeds:'Problem & need',sectionProduct:'The experience',sectionBuild:'How we built it',sectionChallenges:'Challenges',sectionHighlights:'Highlights',sectionLearned:'What we learned',sectionNext:'What’s next',sidebarNote:'Connect preparation to the next real-world action.',
    needsTitle:'Read the guides. Still not sure.',needsDescription:'After watching travel guides and installing apps, travelers still ask: when do I activate the eSIM? Is this account ready? How do I make my first payment? We focus on the gap between preparing and using the tools.',
    filterNeeds:'Filter by traveler need',clickEvidence:'Select a card for the original and its context',evidenceFoot:'Headlines paraphrase public posts and comments. Open a card for the situation, follow-up and source.',allEvidence:'Explore the sources',
    guideContextTitle:'Where preparation begins',guideContextBody:'Travel creators on Instagram explain which apps to prepare. Their guides provide context; the traveler questions above show what can still be unclear.',
    beforeFlight:'BEFORE TAKEOFF',onArrival:'ON ARRIVAL',whenStuck:'WHEN STUCK',need1Title:'Know what readiness means.',need1Body:'Explain when to activate, what to check and which conditions apply to the traveler.',need2Title:'Complete the task in front of you.',need2Body:'Connect data, payment and the first ride with relevant steps. Continue past tasks already completed.',need3Title:'Understand the prompt. Find a way forward.',need3Body:'Start with the current situation, then offer sourced steps, alternatives and official help.',
    methodTitle:'From these questions to the product',methodBody:'The clearest need is help moving from preparation to real use. Landing Check explores bringing that help into Trip.com, alongside the trip. “The first hour” keeps the design focused; it is not a 60-minute deadline.',methodSources:'Guides, community replies and airport staff already help visitors. Our prototype explores reducing the effort of finding an applicable next step. Whether the connected flow and screenshot help improve real tasks still needs user testing.',researchDoc:'Read the demand assessment (Chinese)',sourceRecords:'Source and follow-up records',
    productTitle:'One connected arrival journey.',productDescription:'Preparation starts before the flight. On arrival, guidance follows the task in front of you, with a way forward when something goes wrong.',productFlow:'Product journey',
    videoTitle:'Prototype walkthrough',videoDescription:'About 38 seconds · Chinese / English captions · Simulated payment and trip data',videoPending:'The demo film is coming. Explore the full interactive prototype in the meantime.',openFullDemo:'Open the interactive demo',prototypeBoundary:'The recording shows the development prototype with TenPayGo; the live demo link retains the currently deployed version. Payment verification, flights and trip data are simulated. Production app integration, real payments and automatic notifications are not connected. Screenshots retain the prototype’s English interface.',
    buildTitle:'AI identifies the problem. The knowledge base supplies the steps.',buildDescription:'Separate scenario recognition, sourced content and task rules so the guidance has a clear basis.',
    archInput:'Screenshot / short description',archModel:'DeepSeek classification',archHigh:'ENOUGH CONFIDENCE',archAnswer:'Validate the entry ID, return the steps',archAnswerNote:'Content from a knowledge base with sources and verification dates',archLow:'UNCERTAIN / MODEL UNAVAILABLE',archFallback:'Candidate selection, rules or an unknown result',archFallbackNote:'Generated advice for unknowns is marked as unverified',
    knowledgeTitle:'From research to actionable guidance',knowledge1:'Gather official information, Trip.com guides and detailed sources such as WildChina.',knowledge2:'Cross-check facts; record sources, conditions and verification dates.',knowledge3:'Structure the entries, validate them and export visual tutorials.',knowledge4:'Evaluate recognition on screenshot samples and extend failure paths.',
    aiProcessTitle:'People frame the problem. AI helps iterate.',aiProcessBody:'The project owner defines scope, presentation and key trade-offs. AI helps organize research, implement APIs and frontend behavior, and turn feedback into regression checks. DeepSeek classifies screenshots and text in the product; development assistance and product inference serve different roles.',aiProcessNote:'Repository commits include Claude collaboration markers. Codex assisted with this showcase page. WildChina is one knowledge source.',
    collaborationKicker:'ONE CONCRETE ITERATION',collaborationTitle:'Two payment methods. One preparation task.',collaborationBody:'Alipay and TenPayGo initially occupied separate rows. Feedback brought them into one Payment in China section: verifying either method marks the task ready, while the other remains a backup. AI helped synchronize the state summary, interface copy and tests; human feedback shaped the final product expression.',collaborationExperience:'AI can help coordinate changes across files; its output still needs review. Shared error messages, stale success copy after payment failure, and unnecessary repeat-verification prompts were corrected during review and covered by regression checks.',collaborationCommit:'View the iteration commit',collaborationReview:'View the review and fixes',
    challengesTitle:'The hard part starts when the happy path ends.',highlightsTitle:'Put help inside the step that needs it.',highlightsDescription:'Focus on arrival tasks, making existing tools easier to use when they matter.',
    validationNote:'Next: compare real task completion, time and requests for help against existing guides and support.',
    learnedTitle:'Design for uncertainty.',nextTitle:'From a working demo to real-world help.',nextDescription:'Improve reliability, then connect production capabilities. Give each step a clear validation goal.',ctaTitle:'Start with your first step after landing.',footerNote:'Trip Hackathon 2026 · An exploration in inbound travel',viewSource:'View source code',
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
  const icons = {
    plane:'<path d="m22 2-7 20-4-9-9-4 20-7ZM11 13 22 2"/>',
    wifi:'<path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8 16a6 6 0 0 1 8 0M12 20h.01"/>',
    card:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 10h20M6 15h4"/>',
    camera:'<path d="M14 4h-4L8 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-4l-2-3Z"/><circle cx="12" cy="13" r="4"/>',
    book:'<path d="M12 5v16M12 5C8 2 4 3 2 4v16c4-1 7-1 10 1 3-2 6-2 10-1V4c-2-1-6-2-10 1Z"/>',
    pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.pin}</svg>`;
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
    {label:pair('行前准备','Prepare'),title:pair('起飞前，知道还差什么。','Know what’s missing before takeoff.'),image:'preflight.png',alt:pair('行前检查原型界面','Preflight checklist prototype'),body:pair('把联网方案、支付准备和接机安排集中检查。准备好一种支付方式，也知道另一条备用路。','Review connectivity, payment preparation and transfer arrangements together. Prepare a payment method and keep an alternative in mind.'),bullets:[pair('行程相关的检查清单','A checklist connected to the journey'),pair('支付宝 / TenPayGo 的准备状态','Alipay / TenPayGo preparation states'),pair('配置教程与失败后的替代选项','Setup tutorials and alternatives')],state:pair('支付验证与行程状态为模拟','Payment verification and trip states are simulated')},
    {label:pair('落地联网','Get online'),title:pair('先联网，再继续。','Get connected. Then carry on.'),image:'landing.png',alt:pair('落地联网任务原型界面','Arrival connectivity prototype'),body:pair('围绕当前机场和联网情况给出第一步；需要 Wi-Fi 时，提供适用的登录路径。','Start with the airport and current connectivity. If Wi-Fi is needed, find the relevant sign-in route.'),bullets:[pair('已有网络可直接继续','Continue when already online'),pair('机场 Wi-Fi 与护照认证指引','Airport Wi-Fi and passport sign-in guidance'),pair('无法使用当前方式时寻找备用方案','Find an alternative when the current route fails')],state:pair('部分系统操作按钮为演示提示','Some system-action buttons are demo prompts')},
    {label:pair('截图求助','Get help'),title:pair('不会描述，就给一张截图。','A screenshot can start the conversation.'),image:'stuck.png',alt:pair('我卡住了知识库识别结果','I’m stuck: knowledge-base recognition result'),body:pair('上传截图或一句话描述，让模型匹配已覆盖的问题。结果提供可执行步骤和来源。','Upload a screenshot or a short description. Match a covered issue to actionable steps and their sources.'),bullets:[pair('截图 / 文字输入','Screenshot or text input'),pair('置信度分档与候选确认','Confidence thresholds and candidate selection'),pair('模型不可用时使用规则兜底','Rules when the model is unavailable')],state:pair('未知问题的生成建议标记为未核验','Generated advice for unknown issues is marked unverified')},
    {label:pair('前往酒店','Reach the hotel'),title:pair('选好这一程，给司机看地址。','Choose the ride. Show the address.'),image:'driver.png',alt:pair('给司机看的中文地址卡','Chinese hotel address card for the driver'),body:pair('结合落地时刻、人数、行李与已订接机，推荐前往酒店的方案，并提供中文地址卡。','Use arrival time, travelers, luggage and booked transfers to suggest a hotel journey, with a Chinese address card.'),bullets:[pair('交通选择附理由和备选','Transport choices with reasons and alternatives'),pair('酒店地址直接展示','A ready-to-show hotel address'),pair('把准备、联网与出行串起来','Connect preparation, data and the first ride')],state:pair('行程与交通数据为演示数据','Trip and transport data are for demonstration')}
  ];
  const features = [
    ['plane',pair('行前检查','Preflight check'),pair('检查准备状态，提前发现缺项。','Review preparation and spot missing steps.')],
    ['wifi',pair('联网指引','Connectivity guidance'),pair('按场景找到可用的上网路径。','Find a usable route for the current situation.')],
    ['card',pair('支付与备用方式','Payment & backups'),pair('一种准备好，另一种可作备用。','Prepare one method and keep another available.')],
    ['camera',pair('“我卡住了”','“I’m stuck”'),pair('截图或文字，匹配已覆盖问题。','Match a screenshot or text to a covered issue.')],
    ['book',pair('图文教程','Visual tutorials'),pair('一步一图，保留来源和核验日期。','One visual step at a time, with sources and dates.')],
    ['pin',pair('酒店交通与地址','Hotel journey & address'),pair('推荐交通，展示中文酒店地址。','Suggest transport and show the Chinese address.')]
  ];
  const challenges = [
    [pair('问题往往描述不完整','Incomplete problem descriptions'),pair('截图分类结合置信度分档；不确定时让用户确认候选，避免强行给出单一答案。','Classify screenshots with confidence thresholds; ask users to confirm candidates when the result is uncertain.')],
    [pair('资料会变，也会相互冲突','Sources change and conflict'),pair('保存来源、核验日期与适用范围。遇到冲突时继续核对，优先采用官方依据。','Keep sources, verification dates and scope. Investigate conflicts and prioritize official guidance.')],
    [pair('多个页面必须保持一致','State must stay consistent'),pair('支付方式切换后，行前清单、落地卡和完成页共同读取支付状态；用端到端测试覆盖流程。','Share payment state across the checklist, arrival card and completion screen; cover the flow with end-to-end checks.')],
    [pair('真实平台能力有接入门槛','Production integration has prerequisites'),pair('用模拟接口展示成功和失败分支；真实支付、订单及航班推送需要合作接口与授权。','Demonstrate success and failure with mock interfaces. Real payments, bookings and flight notifications require partner APIs and authorization.')]
  ];
  const highlights = [
    [pair('聚焦第一小时','A focused arrival window'),pair('把准备、上网、支付和首程交通组织成连续任务，控制范围，也减少现场判断负担。','Connect preparation, data, payment and the first ride into a focused task sequence.')],
    [pair('准备状态更具体','More concrete readiness'),pair('区分安装、配置与验证；把支付确认设计为明确步骤，当前用模拟交易演示。','Distinguish installation, setup and verification. Make payment checking explicit, currently with a simulated transaction.')],
    [pair('识别与答案各有依据','Recognition with sourced answers'),pair('模型从现有条目中选择，操作步骤来自知识库；未知情况单独标明。','The model selects from existing entries; steps come from the knowledge base. Unknown cases are identified separately.')],
    [pair('失败之后仍能继续','A path after failure'),pair('通过候选确认、备用支付、联网替代方式和交通备选，让异常分支也有下一步。','Candidate confirmation, payment backups, connectivity alternatives and transport options keep the journey moving.')]
  ];
  const learnings = [
    [pair('产品','PRODUCT'),pair('准备好了，是一个需要确认的状态。','Readiness is a state worth checking.'),pair('知道应用名称、完成绑卡和现场能完成任务之间仍有距离。清单需要说明完成条件，也要保留备用路径。','Knowing an app, linking a card and completing a real task are different things. Checklists need completion criteria and fallback routes.')],
    [pair('AI','AI'),pair('不确定时怎样回应，同样是能力。','Handling uncertainty is part of the product.'),pair('置信度、候选确认、来源和未知分支共同影响可信度。截图识别仍需用目标用户的真实任务验证。','Confidence, confirmation, sources and unknown handling all affect trust. Screenshot help still needs validation with target users and real tasks.')],
    [pair('工程','ENGINEERING'),pair('一条完整流程需要共同的状态。','A coherent journey needs shared state.'),pair('支付状态和用户选择会影响多个页面。清晰的数据结构、兼容处理与端到端检查让流程更可维护。','Payment state and choices affect multiple screens. Clear data structures, compatibility handling and end-to-end checks make the journey maintainable.')]
  ];
  const roadmap = [
    [pair('完善基础体验','IMPROVE THE BASE'),[
      [pair('离线落地卡与多语言教程','Offline arrival cards and multilingual guides'),pair('实现缓存与预翻译，让关键地址和操作在弱网时仍可阅读。','Add caching and reviewed translations so key addresses and steps remain readable with poor connectivity.')],
      [pair('目标用户任务测试','Target-user task testing'),pair('比较现有攻略与原型的完成率、耗时、错误判断和求助次数；目前尚无对照实验结果。','Compare guides and the prototype on completion, time, errors and requests for help. No controlled results are available yet.')]
    ]],
    [pair('需要平台接入','CONNECT PLATFORMS'),[
      [pair('真实支付与行程联动','Real payments and trip context'),pair('接入交易结果、航班和酒店信息；需要合作接口、用户授权，并确认境外验证的适用范围。','Connect transaction results, flights and hotels with partner APIs and user authorization; establish the scope of overseas verification.')],
      [pair('原生 App 能力','Native app capabilities'),pair('完善网络状态判断、通知和跨 App 引导，需要原生集成和相应系统权限。','Improve connectivity detection, notifications and cross-app guidance through native integration and system permissions.')]
    ]],
    [pair('逐步扩展','EXPAND CAREFULLY'),[
      [pair('更多机场与失败场景','More airports and failure cases'),pair('沿用条目和教程结构扩充覆盖，同时建立机场指引更新与事实复核流程。','Extend coverage with the entry and tutorial structure, supported by an update and fact-checking process.')]
    ]]
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
    document.getElementById('socialCloud').innerHTML = cards.map((item,i) => `<button type="button" class="social-card" data-evidence="${item.id}" style="--i:${i}" aria-label="${escape(pick(pair('查看来源：','View source: ')) + pick([item.zh,item.en]))}"><span class="social-card-head">${platformMark(item.platform)}<span class="social-card-origin"><span class="platform">${escape(item.platform)}</span><span class="context">${escape(pick(item.context))}</span></span><span class="social-category">${escape(labelFor(item.topic))}</span></span><blockquote>${escape(pick([item.zh,item.en]))}</blockquote>${item.quote ? `<span class="original-excerpt" lang="en">“${escape(item.quote)}”</span>`:''}<span class="social-card-bottom"><span>${escape(kindLabel(item))}</span><span>${pick(pair('查看原帖','View source'))} ↗</span></span></button>`).join('') + `<div class="cloud-summary"><strong>${pick(pair('准备之后，还需要下一步。','Prepared. What’s the next step?'))}</strong><span>${pick(pair('游客的追问与亲历','Traveler questions and experiences'))}</span></div>`;
  }
  function renderGuideContext() {
    document.getElementById('guideSources').innerHTML = content.filter(item => item.kind === 'guide').map(item => `<button type="button" class="guide-source" data-evidence="${item.id}">${platformMark(item.platform)}<span><span class="guide-source-label">Instagram · ${escape(kindLabel(item))}</span><strong>${escape(pick([item.zh,item.en]))}</strong><span class="guide-source-author">${escape(item.author)}</span></span><span class="guide-source-arrow" aria-hidden="true">↗</span></button>`).join('');
  }
  function renderProduct(restoreFocus=false) {
    const stage = stages[stageIndex];
    document.getElementById('productTabs').innerHTML = stages.map((item,i) => `<button id="stageTab${i}" type="button" role="tab" data-stage="${i}" aria-selected="${i === stageIndex}" aria-controls="productStage" tabindex="${i === stageIndex ? 0 : -1}"><span class="tab-number">0${i+1}</span>${escape(pick(item.label))}</button>`).join('');
    const panel=document.getElementById('productStage');
    panel.setAttribute('aria-labelledby',`stageTab${stageIndex}`);
    panel.innerHTML = `<div class="stage-image-wrap"><a class="stage-phone" href="assets/${stage.image}" target="_blank" rel="noopener" aria-label="${escape(pick(pair('打开原始截图：','Open the full-size screenshot: ')) + pick(stage.alt))}"><img src="assets/${stage.image}" width="786" height="1704" alt="${escape(pick(stage.alt))}" loading="lazy"></a></div><div class="stage-copy"><span class="stage-kicker">0${stageIndex+1} / ${escape(pick(stage.label))}</span><h3>${escape(pick(stage.title))}</h3><p>${escape(pick(stage.body))}</p><ul>${stage.bullets.map(item => `<li>${escape(pick(item))}</li>`).join('')}</ul><span class="stage-state">${escape(pick(stage.state))}</span><a class="screenshot-link" href="assets/${stage.image}" target="_blank" rel="noopener">${pick(pair('查看原始截图','View the full-size screenshot'))}</a></div>`;
    if(restoreFocus) document.getElementById(`stageTab${stageIndex}`).focus({preventScroll:true});
  }
  function renderSections() {
    document.getElementById('featureGrid').innerHTML=features.map(([name,title,body])=>`<article class="feature-item"><span class="feature-icon">${icon(name)}</span><div><h3>${escape(pick(title))}</h3><p>${escape(pick(body))}</p></div></article>`).join('');
    document.getElementById('challengeList').innerHTML=challenges.map(([title,body],i)=>`<article class="challenge-row"><span class="row-number">0${i+1}</span><h3>${escape(pick(title))}</h3><p>${escape(pick(body))}</p></article>`).join('');
    document.getElementById('highlightGrid').innerHTML=highlights.map(([title,body],i)=>`<article class="highlight-card"><span class="highlight-number">0${i+1}</span><h3>${escape(pick(title))}</h3><p>${escape(pick(body))}</p></article>`).join('');
    document.getElementById('learningList').innerHTML=learnings.map(([category,title,body])=>`<article class="learning-row"><span>${escape(pick(category))}</span><div><h3>${escape(pick(title))}</h3><p>${escape(pick(body))}</p></div></article>`).join('');
    document.getElementById('roadmap').innerHTML=roadmap.map(([category,items])=>`<div class="roadmap-group"><span class="roadmap-label">${escape(pick(category))}</span><div class="roadmap-items">${items.map(([title,body])=>`<article class="roadmap-item"><h3>${escape(pick(title))}</h3><p>${escape(pick(body))}</p></article>`).join('')}</div></div>`).join('');
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
    renderFilters();renderCloud();renderGuideContext();renderProduct();renderSections();
    updateCaptions();
    if(dialog.open){if(dialogState==='archive') renderArchive();else renderEvidence(content.find(item=>item.id===dialogState));}
  }
  document.getElementById('languageSwitch').addEventListener('click',()=>{language=language==='zh'?'en':'zh';applyLanguage();});
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
    anchors.forEach(link=>{const section=document.querySelector(link.getAttribute('href'));if(section.getBoundingClientRect().top<=185)current=link;});
    anchors.forEach(link=>{const active=link===current;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    scrollPending=false;
  }
  addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateScroll);}},{passive:true});
  addEventListener('resize',updateScroll);
  applyLanguage();updateScroll();
})();
