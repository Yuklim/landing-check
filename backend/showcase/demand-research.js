/* Research-first demand module for the #needs section.
 * Leads with the FINDINGS (what travelers most discuss / struggle with) — no self-serving coverage claims.
 * All the quantitative detail (denominators, coverage, lift, bootstrap, NMF, limits) is tucked into a
 * collapsible "research method" panel. Renders the 携程数据 (platform) demand-heat bar chart; the 社媒数据
 * tab holds the existing social-post cloud. Bilingual via <html lang>; re-renders on language switch.
 * The bar chart loads proportionally with a smooth animation on scroll. */
(function () {
  "use strict";
  var host = document.getElementById("demandResearch");
  var methodHost = document.getElementById("demandMethod");   // optional: lets the bubble cloud sit between bars and method
  var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  var EN = function () { return (document.documentElement.lang || "zh").slice(0, 2) === "en"; };
  var t = function (zh, en) { return EN() ? en : zh; };
  var methodOpen = false;   // preserved across language re-renders

  // demand-heat distribution (what gets discussed); neutral — no "covered" emphasis here
  // [zh, en, share%]
  var CATS = [
    ["门票与预约", "Tickets & booking", 38.4],
    ["市内交通与打车", "City transport & taxi", 38.1],
    ["支付", "Payment", 16.6],
    ["落地与机场", "Arrival & airport", 13.1],
    ["上网与通讯", "Connectivity", 7.5],
    ["换汇与花费", "Money & cost", 6.9],
    ["签证与入境政策", "Visa & entry", 6.2],
    ["城际交通", "Intercity transport", 5.7],
    ["语言与翻译", "Language", 4.6],
    ["安全与骗局", "Safety & scams", 3.4],
    ["App与实名/手机号", "Apps & verification", 2.8],
    ["健康与如厕", "Health & toilet", 2.7],
    ["住宿与入住登记", "Accommodation", 2.0]
  ];

  // everything quantitative lives inside the method panel
  var METHOD = [
    ["01", "数据与口径", "Data & scope",
      "公开旅行笔记 89.6 万条（2025-10～2026-10），筛出涉华内容 9.7 万条；其中“聊到实务”的 22,354 条为需求基数，“在描述问题”的 3,907 条为其子集。",
      "896k public travel notes (Oct 2025–Oct 2026), 97k China-related; 22,354 discuss practical matters (the demand base) and 3,907 describe a problem (a subset)."],
    ["02", "多语言规则词典", "Multilingual rule lexicon",
      "13 个实务类别、各含子话题，用英/中/俄/泰关键词匹配。全程无 LLM 打分，每次命中都能回溯到具体词与原句。",
      "13 practical categories with sub-topics, matched by EN/ZH/RU/TH keywords. No LLM scoring — every hit traces to the exact word and sentence."],
    ["03", "问题信号识别", "Problem-signal detection",
      "逐句检测 problem / advice / question，并先剔除“no problem”“don’t worry”等否定与宽慰，避免把安心话误判成问题。",
      "Per-sentence problem / advice / question signals, after stripping reassurances like “no problem / don’t worry” so relief isn’t misread as a problem."],
    ["04", "热度与痛点两种口径", "Two lenses: heat vs pain",
      "需求热度＝P(类别|需求)，看“大家在聊什么”；痛点＝P(类别|问题) 与 lift，看“真遇到问题”。如 lift 最高的是安全(2.78)、上网(1.75)。",
      "Demand heat = P(cat|demand) for “what’s discussed”; pain = P(cat|problem) and lift for “what actually goes wrong”. Highest lift: safety (2.78), connectivity (1.75)."],
    ["05", "自助法置信区间", "Bootstrap CI",
      "按作者聚类的 bootstrap（1000 次）给出 95%CI；英文语料无作者字段，降级为帖子级，并在局限中说明。",
      "Author-clustered bootstrap (×1000) for 95% CIs; this English corpus has no author field, so it degrades to post-level, disclosed below."],
    ["06", "NMF 主题聚类", "NMF topic clustering",
      "每类问题句做 TF-IDF（含二元词）→ NMF 主题分解，簇数由 UMass 一致性自动择优，人工命名，发现词典之外的新问题。",
      "Per category: TF-IDF (incl. bigrams) → NMF, number of topics chosen by UMass coherence, hand-named — surfacing problems beyond the lexicon."]
  ];
  var LIMITS = [
    ["仅英文、仅“涉华”子集；非英语人群与海外内容不在内。", "English only, China-related subset only; non-English audiences and overseas content excluded."],
    ["无作者 / 地域 / 评论字段：CI 为帖子级，国际 vs 港澳台对比与评论区互证暂无法做。", "No author / region / comment fields: CIs are post-level; intl-vs-HK/TW and comment cross-checks aren’t possible."],
    ["精度校正待人工抽检 260 句后补齐，当前为校正前口径；召回率按类别无法估计。", "Precision correction awaits a 260-sentence manual audit; figures are uncorrected; per-category recall can’t be estimated."]
  ];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function render() {
    if (!host) return;
    var maxv = 38.4;
    var bars = CATS.map(function (c) {
      return '<div class="bar-row" data-rv>' +
        '<span class="bl">' + esc(t(c[0], c[1])) + "</span>" +
        '<span class="bar-track"><span class="bar-fill" data-w="' + (c[2] / maxv * 100).toFixed(1) + '"></span></span>' +
        '<span class="bv">' + c[2].toFixed(1) + "%</span></div>";
    }).join("");

    var methodItems = METHOD.map(function (m) {
      return '<div class="dr-m-item"><span class="dr-m-no">' + m[0] + "</span>" +
        "<h4>" + esc(t(m[1], m[2])) + "</h4><p>" + esc(t(m[3], m[4])) + "</p></div>";
    }).join("");
    var limits = LIMITS.map(function (l) { return "<li>" + esc(t(l[0], l[1])) + "</li>"; }).join("");
    var methodBlock =
      '<div class="dr-method">' +
      '<button type="button" class="dr-method-toggle" aria-expanded="false">' +
      '<span class="dr-m-dot"></span><span class="dr-m-label">' + t("调研方法与口径", "Research method & definitions") + "</span>" +
      '<svg class="dr-m-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>' +
      '<div class="dr-method-wrap"><div class="dr-method-inner">' +
      '<p class="dr-m-intro">' + t("全程规则化、可复现、不依赖大模型打分，便于逐条核对。", "Fully rule-based, reproducible, no LLM scoring — auditable line by line.") + "</p>" +
      '<div class="dr-m-grid">' + methodItems + "</div>" +
      '<div class="dr-m-limit"><strong>' + t("⚠ 诚实的局限", "⚠ Honest limitations") + "</strong><ul>" + limits + "</ul></div>" +
      "</div></div></div>";

    host.innerHTML =
      '<p class="dr-lead" data-rv>' + t(
        "我们统计公开旅行笔记里，首次来华的自由行游客最常讨论和求助的实务话题——看他们真正会卡在哪里。",
        "We measured which practical topics first-time independent visitors to China most discuss and ask about — to see where they actually get stuck.") + "</p>" +
      '<div class="dr-barhead" data-rv>' + t("需求热度 · 最常被讨论的实务话题", "Demand heat · most-discussed practical topics") + "</div>" +
      '<div class="bars">' + bars + "</div>" +
      '<p class="dr-prov" data-rv>' + t(
        "基于 89.6 万条公开英文旅行笔记的涉华内容（n=22,354 条实务帖，2025-10～2026-10）。按被讨论比例渲染。",
        "From the China-related part of 896k public English travel notes (n=22,354 practical posts, Oct 2025–Oct 2026). Bars scaled by share discussed.") + "</p>" +
      (methodHost ? "" : methodBlock);
    if (methodHost) methodHost.innerHTML = methodBlock;

    wireModule();
  }

  function countUp(el) {
    var target = +el.getAttribute("data-count");
    if (reduce) { el.textContent = target.toLocaleString("en-US"); return; }
    var t0 = null, dur = 1150;
    requestAnimationFrame(function step(ts) {
      t0 = t0 || ts; var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(step);
    });
  }

  var io = null;
  function wireModule() {
    if (!host) return;
    if (io) io.disconnect();
    var seen = new WeakSet();
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || seen.has(e.target)) return;
        seen.add(e.target);
        e.target.classList.add("in");
        e.target.querySelectorAll("[data-count]").forEach(countUp);
        if (e.target.hasAttribute("data-count")) countUp(e.target);
        e.target.querySelectorAll(".bar-fill[data-w]").forEach(function (b) {
          requestAnimationFrame(function () { b.style.width = b.getAttribute("data-w") + "%"; });
        });
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    host.querySelectorAll("[data-rv]").forEach(function (el) { io.observe(el); });

    var btn = (methodHost || host).querySelector(".dr-method-toggle");
    if (btn) {
      var wrap = btn.nextElementSibling;
      if (methodOpen) { btn.setAttribute("aria-expanded", "true"); wrap.classList.add("open"); }
      btn.addEventListener("click", function () {
        methodOpen = btn.getAttribute("aria-expanded") !== "true";
        btn.setAttribute("aria-expanded", String(methodOpen));
        wrap.classList.toggle("open", methodOpen);
      });
    }
  }

  // --- tabs: 携程数据 / 社媒数据 (static in index.html; wired once) ---
  function wireTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".needs-tab"));
    if (!tabs.length) return;
    function activate(tab) {
      tabs.forEach(function (b) {
        var on = b === tab;
        b.setAttribute("aria-selected", String(on));
        b.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(b.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
    }
    tabs.forEach(function (b, i) {
      b.addEventListener("click", function () { activate(b); });
      b.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var next = tabs[(i + d + tabs.length) % tabs.length];
        activate(next); next.focus();
      });
    });
  }

  wireTabs();
  render();
  new MutationObserver(function (m) {
    for (var i = 0; i < m.length; i++) if (m[i].attributeName === "lang") { render(); break; }
  }).observe(document.documentElement, { attributes: true });
})();
