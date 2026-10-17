/* Quantitative demand-research module rendered into #needs.
 * Starts from ALL demand discussion (demand ∪ problem = 22,354 posts), the stronger project story:
 * the top-5 most-discussed practical topics are exactly the five modules Landing Check covers (~80%).
 * The pain/lift view is kept as the complementary "what actually hurts" angle.
 * Bilingual: reads <html lang> (set by app.js) and re-renders on change. Scroll-reveal + count-up + bars. */
(function () {
  "use strict";
  var host = document.getElementById("demandResearch");
  if (!host) return;
  var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  var EN = function () { return (document.documentElement.lang || "zh").slice(0, 2) === "en"; };
  var t = function (zh, en) { return EN() ? en : zh; };

  // demand-heat P(category | demand), denominator = 22,354 posts that discuss practical matters
  // [zh, en, heat%, covered, isNew]
  var CATS = [
    ["门票与预约", "Tickets & booking", 38.4, 1, 1],
    ["市内交通与打车", "City transport & taxi", 38.1, 1, 0],
    ["支付", "Payment", 16.6, 1, 0],
    ["落地与机场", "Arrival & airport", 13.1, 1, 0],
    ["上网与通讯", "Connectivity", 7.5, 1, 0],
    ["换汇与花费", "Money & cost", 6.9, 0, 0],
    ["签证与入境政策", "Visa & entry", 6.2, 0, 0],
    ["城际交通", "Intercity transport", 5.7, 0, 0],
    ["语言与翻译", "Language", 4.6, 0, 0],
    ["安全与骗局", "Safety & scams", 3.4, 0, 0],
    ["App与实名/手机号", "Apps & verification", 2.8, 0, 0],
    ["健康与如厕", "Health & toilet", 2.7, 0, 0],
    ["住宿与入住登记", "Accommodation", 2.0, 0, 0]
  ];
  var CHIPS = [
    ["m-ticket", "门票预订", "Ticket booking", "38%", 1],
    ["m-transport", "市内交通", "City transport", "38%", 0],
    ["m-pay", "支付", "Payment", "17%", 0],
    ["m-arrival", "落地机场", "Arrival & airport", "13%", 0],
    ["m-net", "上网通讯", "Connectivity", "8%", 0]
  ];
  // complementary pain-concentration (lift = P(c|problem)/P(c|demand)), > 1 = usually a complaint
  var LIFT = [
    ["安全与骗局", "Safety & scams", "2.78", 0],
    ["上网通讯", "Connectivity", "1.75", 1],
    ["语言与翻译", "Language", "1.65", 0],
    ["落地与机场", "Arrival & airport", "1.21", 1]
  ];
  // research method (revealed on click) — [no, zh-title, en-title, zh-body, en-body]
  var METHOD = [
    ["01", "多语言规则词典", "Multilingual rule lexicon",
      "13 个实务类别、各含子话题，用英/中/俄/泰关键词匹配。全程无 LLM 打分，每次命中都能回溯到具体词与原句。",
      "13 practical categories with sub-topics, matched by EN/ZH/RU/TH keywords. No LLM scoring — every hit traces back to the exact word and sentence."],
    ["02", "问题信号识别", "Problem-signal detection",
      "逐句检测 problem / advice / question 信号，并先剔除“no problem”“don’t worry”“stress-free”等否定与宽慰，避免把安心话误判成问题。",
      "Per-sentence problem / advice / question signals, after stripping reassurances like “no problem / don’t worry / stress-free” so relief isn’t misread as a problem."],
    ["03", "双口径分母", "Two denominators",
      "需求∪问题＝22,354 看“热度”，问题＝3,907 看“痛点”（问题是需求的子集）。每类用多标签＋平均分摊两种占比。",
      "Demand∪problem = 22,354 for “heat”, problem = 3,907 for “pain” (problem ⊂ demand). Each category reported multi-label and fractional."],
    ["04", "自助法置信区间", "Bootstrap CI",
      "按作者聚类的 bootstrap（1000 次）给出 95%CI；英文语料无作者字段，降级为帖子级，并在局限中说明。",
      "Author-clustered bootstrap (×1000) for 95% CIs; this English corpus has no author field, so it degrades to post-level, disclosed in limitations."],
    ["05", "lift 与共现", "lift & co-occurrence",
      "lift = P(类别|问题) ÷ P(类别|需求)，衡量“一写到就在吐槽”的集中度；共现矩阵找常一起出现、应打包解决的痛点。",
      "lift = P(cat|problem) ÷ P(cat|demand) measures how concentrated a topic is in complaints; co-occurrence finds pains that cluster and should be solved together."],
    ["06", "NMF 主题聚类", "NMF topic clustering",
      "每类问题句做 TF-IDF（含二元词）→ NMF 主题分解，簇数由 UMass 一致性自动择优，人工命名并附代表原句，发现词典之外的新问题。",
      "Per category: TF-IDF (incl. bigrams) → NMF topic decomposition, with the number of topics chosen by UMass coherence, hand-named with sample sentences — surfacing problems beyond the lexicon."]
  ];
  var LIMITS = [
    ["仅英文、仅“涉华”子集；非英语人群与海外内容不在内。", "English only, China-related subset only; non-English audiences and overseas content are excluded."],
    ["无作者 / 地域 / 评论字段：CI 为帖子级，国际 vs 港澳台对比与评论区互证暂无法做。", "No author / region / comment fields: CIs are post-level; intl-vs-HK/TW comparison and comment cross-checks aren’t possible."],
    ["精度校正待人工抽检 260 句后补齐，当前为校正前口径；召回率按类别无法估计。", "Precision correction awaits a 260-sentence manual audit; figures are uncorrected; per-category recall can’t be estimated."]
  ];

  var FUNNEL = [
    [896434, "英文旅行笔记原帖", "English travel notes", "全量 · 一年窗口", "Full · 1-year window"],
    [96779, "与中国相关的帖子", "China-related posts", "占全量 10.8%", "10.8% of all"],
    [22354, "聊到实务的帖子（需求）", "Posts discussing practical matters", "提问 + 攻略 + 吐槽", "questions + guides + gripes"],
    [3907, "其中在描述问题（痛点）", "…of which describe a problem", "占需求 17.5%", "17.5% of demand"]
  ];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function render() {
    var maxv = 38.4;
    var funnel = FUNNEL.map(function (f, i) {
      return '<div class="dr-stat" data-rv data-d="' + (i + 1) + '">' +
        '<div class="num" data-count="' + f[0] + '">0</div>' +
        '<div class="lab">' + esc(t(f[1], f[2])) + '</div>' +
        '<div class="pct">' + esc(t(f[3], f[4])) + '</div></div>';
    }).join("");

    var chips = CHIPS.map(function (c) {
      var nf = c[4] ? '<span class="newflag">' + t("现已覆盖", "now live") + "</span>" : "";
      return '<span class="cov-chip ' + c[0] + '">' + esc(t(c[1], c[2])) + ' <small>' + c[3] + "</small>" + nf + "</span>";
    }).join("");

    var bars = CATS.map(function (c) {
      var nt = c[4] ? '<span class="tagnew">NEW</span>' : "";
      return '<div class="bar-row' + (c[3] ? " cov" : "") + '" data-rv>' +
        '<span class="bl">' + esc(t(c[0], c[1])) + nt + "</span>" +
        '<span class="bar-track"><span class="bar-fill" data-w="' + (c[2] / maxv * 100).toFixed(1) + '"></span></span>' +
        '<span class="bv">' + c[2].toFixed(1) + "%</span></div>";
    }).join("");

    var lift = LIFT.map(function (l) {
      var cov = l[3] ? ' <span class="lift-cov">' + t("· 覆盖", "· covered") + "</span>" : "";
      return '<span class="lift-pill"><b>' + l[2] + "×</b> " + esc(t(l[0], l[1])) + cov + "</span>";
    }).join("");

    var methodItems = METHOD.map(function (m) {
      return '<div class="dr-m-item"><span class="dr-m-no">' + m[0] + "</span>" +
        "<h4>" + esc(t(m[1], m[2])) + "</h4><p>" + esc(t(m[3], m[4])) + "</p></div>";
    }).join("");
    var limits = LIMITS.map(function (l) { return "<li>" + esc(t(l[0], l[1])) + "</li>"; }).join("");
    var methodBlock =
      '<div class="dr-method">' +
      '<button type="button" class="dr-method-toggle" aria-expanded="false">' +
      '<span class="dr-m-dot"></span><span class="dr-m-label">' + t("调研方法：聚类与统计", "Research method: clustering & statistics") + "</span>" +
      '<svg class="dr-m-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>' +
      '<div class="dr-method-wrap"><div class="dr-method-inner">' +
      '<p class="dr-m-intro">' + t("全程规则化、可复现、不依赖大模型打分，便于逐条核对。", "Fully rule-based, reproducible, no LLM scoring — auditable line by line.") + "</p>" +
      '<div class="dr-m-grid">' + methodItems + "</div>" +
      '<div class="dr-m-limit"><strong>' + t("⚠ 诚实的局限", "⚠ Honest limitations") + "</strong><ul>" + limits + "</ul></div>" +
      "</div></div></div>";

    host.innerHTML =
      // funnel
      '<div class="dr-block">' +
      '<span class="dr-eyebrow" data-rv>01 · ' + t("调研规模", "SCALE") + "</span>" +
      '<h3 class="dr-h" data-rv>' + t("89.6 万条真实原帖里，谁在聊来华的实务问题", "Who discusses practical China-travel matters, across 896k real posts") + "</h3>" +
      '<p class="dr-note" data-rv>' + t(
        "我们抓取公开旅行社区的英文旅行笔记（2025-10 至 2026-10），筛出涉华内容，逐句识别“在聊实务”的帖子（提问 / 攻略 / 吐槽），其中又分出“在描述问题”的。不把点赞当需求。",
        "We mined public English travel notes (Oct 2025–Oct 2026), kept China-related content, and tagged posts that discuss practical matters (questions / guides / gripes), then the subset describing a problem. Likes are not demand.") + "</p>" +
      '<div class="dr-funnel">' + funnel + "</div></div>" +
      // coverage headline (demand heat)
      '<div class="dr-block">' +
      '<span class="dr-eyebrow" data-rv>02 · ' + t("我们覆盖的，正是大家最关心的", "WE COVER WHAT MATTERS MOST") + "</span>" +
      '<h3 class="dr-h" data-rv>' + t("所有涉华实务讨论里，热度前五全是我们覆盖的五大模块", "The five most-discussed topics are exactly our five modules") + "</h3>" +
      '<div class="cov-grid">' +
      '<figure class="cov-figure" data-rv><img src="assets/research/coverage_wordcloud.png" loading="lazy" alt="' +
      esc(t("五大模块词云", "Word cloud across five modules")) + '">' +
      '<figcaption class="cap">' + esc(t(
        "按所属模块上色的高频词；基于问题句文本。五大模块＝市内交通 / 门票预订 / 落地机场 / 上网通讯 / 支付。",
        "High-frequency words colored by module (from problem-sentence text). Five modules = city transport / ticket booking / arrival / connectivity / payment.")) + "</figcaption></figure>" +
      '<div data-rv data-d="1"><div class="cov-kpi"><span class="big" data-count="80">0</span><span class="unit">%</span></div>' +
      '<div class="cov-ci">' + esc(t("五大模块合计占全部涉华实务讨论（n=22,354，平均分摊，校正前 79.7%）", "Five modules’ share of all practical China discussion (n=22,354, fractional, 79.7% uncorrected)")) + "</div>" +
      '<p class="cov-desc">' + esc(t(
        "热度前五名全部是 Landing Check 已覆盖的五大模块，与第六名（换汇 6.9%）断层领先。门票预订与市内交通并列第一（各约 38%）。",
        "The top five are all modules Landing Check covers, clearly ahead of #6 (money 6.9%). Ticket booking and city transport tie for first (~38% each).")) + "</p>" +
      '<div class="cov-chips">' + chips + "</div></div></div></div>" +
      // bars: demand heat
      '<div class="dr-block">' +
      '<span class="dr-eyebrow" data-rv>03 · P(' + t("类别 | 需求", "category | demand") + ")</span>" +
      '<h3 class="dr-h" data-rv>' + t("大家在聊什么：需求热度", "What people talk about: demand heat") + "</h3>" +
      '<p class="dr-note" data-rv>' + t(
        "22,354 条实务帖中各类话题的被提及比例（多标签，可叠加）。深蓝＝已覆盖的五大模块。",
        "Share of the 22,354 practical posts mentioning each topic (multi-label). Dark blue = the five covered modules.") + "</p>" +
      '<div class="bars">' + bars + "</div>" +
      '<div class="bars-legend" data-rv>' +
      '<span><i style="background:linear-gradient(90deg,var(--blue),#4f7bf5)"></i>' + t("已覆盖模块", "Covered") + "</span>" +
      '<span><i style="background:#c7cfdc"></i>' + t("暂未覆盖", "Not yet") + "</span>" +
      "<span>" + t("置信区间：按帖子自助法 1000 次", "CI: post-level bootstrap ×1000") + "</span></div>" +
      // complementary pain / lift
      '<div class="dr-lift" data-rv>' +
      '<span class="dr-lift-h">' + t("换个口径看“真痛”：", "The complementary “what hurts” view:") + "</span>" +
      '<span class="dr-lift-note">' + t("lift>1＝一写到就多半在吐槽。", "lift>1 = usually written as a complaint.") + "</span>" +
      '<div class="lift-pills">' + lift + "</div>" +
      '<p class="dr-lift-foot">' + t(
        "门票、市内交通是“高频话题”（大家都在写攻略），上网、落地才是“做了就有感知”的真痛——两者互补。",
        "Tickets and city transport are high-frequency topics (everyone writes guides); connectivity and arrival are the pains people actually feel — the two views complement each other.") + "</p></div>" +
      methodBlock +
      '<p class="dr-more" data-rv><a href="demand.html">' + t("查看完整需求调研：频次 vs 痛点、共现与分析方法 ↗", "Full demand research: frequency vs pain, co-occurrence & method ↗") + "</a></p>" +
      "</div>";

    wire();
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
  function wire() {
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

    // method toggle: silky height reveal via grid-template-rows 0fr -> 1fr
    var btn = host.querySelector(".dr-method-toggle");
    if (btn) {
      var wrap = btn.nextElementSibling;
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        wrap.classList.toggle("open", !open);
      });
    }
  }

  render();
  new MutationObserver(function (m) {
    for (var i = 0; i < m.length; i++) if (m[i].attributeName === "lang") { render(); break; }
  }).observe(document.documentElement, { attributes: true });
})();
