/* Animated demand word-cloud for the #needs / 携程数据 tab.
 * Ported from session 4e9871ad's demand_bubbles.html, adapted for embedding in the showcase:
 * a CONTAINED canvas (not full-viewport), light theme on the site's blue palette, bilingual
 * (follows <html lang>), lazy-initialised and paused whenever its tab/panel is hidden or
 * scrolled off-screen. Loads assets/research/demand-bubbles.json (produced from the same
 * Trip.com corpus as the demand-heat bars). Bubbles float, are coloured by category, and can be
 * filtered via the legend; hover shows the word's frequency. Degrades gracefully if data is absent. */
(function () {
  "use strict";
  var host = document.getElementById("demandBubbles");
  if (!host) return;
  var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  var EN = function () { return (document.documentElement.lang || "zh").slice(0, 2) === "en"; };
  var T = function (zh, en) { return EN() ? en : zh; };

  // category key -> English label (JSON only carries cat_zh); must match the bar-chart labels
  var CAT_EN = {
    payment: "Payment", connectivity: "Connectivity", arrival_airport: "Arrival & airport",
    local_transport: "City transport & taxi", tickets_booking: "Tickets & booking",
    money_cost: "Money & cost", visa_entry: "Visa & entry", intercity_transport: "Intercity transport",
    language: "Language", safety_scams: "Safety & scams", apps_accounts: "Apps & verification",
    health_toilet: "Health & toilet", accommodation: "Accommodation"
  };

  var DATA = null, bubbles = [], raw = [], legend = [];
  var W = 0, H = 0, DPR = 1, scale = 1;
  var running = false, built = false, userPaused = false, coveredOnly = false, rafId = 0;
  var active = Object.create(null); var activeCount = 0;   // empty => all shown

  // --- DOM scaffold (built once) ---
  var cv, ctx, tip, legendEl, subEl, coverBtn, pauseBtn, resetEl;
  function buildDOM() {
    host.innerHTML =
      '<div class="db-head">' +
        '<div class="db-titles">' +
          '<div class="db-title"></div>' +
          '<div class="db-sub"></div>' +
        '</div>' +
        '<div class="db-ctrls">' +
          '<button type="button" class="db-btn" data-act="cover" aria-pressed="false"></button>' +
          '<button type="button" class="db-btn" data-act="pause" aria-pressed="false"></button>' +
        '</div>' +
      '</div>' +
      '<div class="db-stage-wrap"><canvas class="db-stage"></canvas>' +
        '<div class="db-tip" role="status" aria-live="polite"></div></div>' +
      '<div class="db-legend" role="group"></div>';
    cv = host.querySelector(".db-stage");
    ctx = cv.getContext("2d");
    tip = host.querySelector(".db-tip");
    legendEl = host.querySelector(".db-legend");
    subEl = host.querySelector(".db-sub");
    coverBtn = host.querySelector('[data-act="cover"]');
    pauseBtn = host.querySelector('[data-act="pause"]');

    coverBtn.addEventListener("click", function () {
      coveredOnly = !coveredOnly;
      coverBtn.setAttribute("aria-pressed", String(coveredOnly));
      applyLang();
    });
    pauseBtn.addEventListener("click", function () {
      userPaused = !userPaused;
      pauseBtn.setAttribute("aria-pressed", String(userPaused));
      applyLang();
    });
    cv.addEventListener("mousemove", onMove);
    cv.addEventListener("mouseleave", function () { tip.style.opacity = 0; });
  }

  function buildLegend() {
    legendEl.innerHTML = "";
    legend.forEach(function (l) {
      var c = document.createElement("button");
      c.className = "db-chip"; c.type = "button"; c.dataset.cat = l.cat;
      c.setAttribute("aria-pressed", "false");
      c.innerHTML = '<span class="db-dot" style="background:' + l.color + '"></span>' +
        '<span class="db-chip-t"></span>' + (l.covered ? '<span class="db-ck">✓</span>' : "");
      c.addEventListener("click", function () {
        if (active[l.cat]) { delete active[l.cat]; activeCount--; }
        else { active[l.cat] = 1; activeCount++; }
        syncChips();
      });
      legendEl.appendChild(c);
    });
    resetEl = document.createElement("button");
    resetEl.className = "db-reset"; resetEl.type = "button";
    resetEl.addEventListener("click", function () { active = Object.create(null); activeCount = 0; syncChips(); });
    legendEl.appendChild(resetEl);
    syncChips();
  }

  function syncChips() {
    if (!legendEl) return;
    var chips = legendEl.querySelectorAll(".db-chip");
    chips.forEach(function (ch) {
      var on = activeCount === 0 || active[ch.dataset.cat];
      ch.classList.toggle("off", !on && activeCount > 0);
      ch.setAttribute("aria-pressed", active[ch.dataset.cat] ? "true" : "false");
    });
  }

  // --- bilingual text (no canvas rebuild) ---
  function applyLang() {
    if (!subEl) return;
    host.querySelector(".db-title").textContent = T("需求气泡云", "Demand word cloud");
    var n = (DATA && DATA.meta && DATA.meta.need_sentences) || 0;
    subEl.innerHTML = T(
      "同一语料里的高频实务词，气泡越大＝出现越多，按类别着色（取自 <b>" + n.toLocaleString("en-US") + "</b> 条需求语句）",
      "High-frequency practical words from the same corpus — bigger = more mentions, coloured by category (from <b>" + n.toLocaleString("en-US") + "</b> need-sentences)");
    coverBtn.textContent = T("只看已覆盖", "Covered only");
    pauseBtn.textContent = userPaused ? T("播放", "Play") : T("暂停", "Pause");
    if (resetEl) resetEl.textContent = T("全部类别", "All categories");
    legendEl && legendEl.querySelectorAll(".db-chip").forEach(function (ch) {
      var l = legend.find(function (x) { return x.cat === ch.dataset.cat; });
      if (l) ch.querySelector(".db-chip-t").textContent = EN() ? (CAT_EN[l.cat] || l.cat_zh) : l.cat_zh;
    });
  }

  // --- colour helpers ---
  function hexToRgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  function lum(h) { var c = hexToRgb(h); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }
  function mix(h, t) { var c = hexToRgb(h); return "rgb(" + Math.round(c[0] + (255 - c[0]) * t) + "," + Math.round(c[1] + (255 - c[1]) * t) + "," + Math.round(c[2] + (255 - c[2]) * t) + ")"; }
  function applyA(rgb, al) { return rgb.replace("rgb(", "rgba(").replace(")", "," + al + ")"); }
  function textColorFor(h) { return lum(h) > 0.62 ? "#15203a" : "#ffffff"; }

  function visible(b) { return !(coveredOnly && !b.covered); }
  function highlighted(b) { return activeCount === 0 || !!active[b.cat]; }

  // --- sizing / layout ---
  function resize() {
    var wrap = host.querySelector(".db-stage-wrap");
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = wrap.clientWidth || 600;
    H = wrap.clientHeight || 420;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    scale = Math.max(0.5, Math.min(1.05, Math.min(W, H) / 560));
  }

  function buildBubbles() {
    var counts = raw.map(function (b) { return b.count; });
    var mn = Math.sqrt(Math.min.apply(null, counts)), mx = Math.sqrt(Math.max.apply(null, counts));
    var rMin = 13 * scale, rMax = 50 * scale;
    bubbles = raw.map(function (b) {
      var t = mx > mn ? (Math.sqrt(b.count) - mn) / (mx - mn) : 0.5;
      var r = rMin + (rMax - rMin) * Math.pow(t, 0.85);
      return Object.assign({}, b, {
        r: r, label: b.term,
        x: r + Math.random() * Math.max(1, W - 2 * r),
        y: Math.random() * H,
        vy: (0.14 + Math.random() * 0.34) * scale,
        phase: Math.random() * Math.PI * 2,
        wob: (0.2 + Math.random() * 0.45) * scale,
        wsp: 0.6 + Math.random() * 0.7
      });
    });
  }

  // --- physics ---
  function step(dt) {
    var i, j;
    for (i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      b.y -= b.vy * dt;
      b.phase += 0.016 * b.wsp * dt;
      b.x += Math.cos(b.phase) * b.wob * dt * 0.6;
      if (b.y < -b.r - 4) { b.y = H + b.r + Math.random() * 36; b.x = b.r + Math.random() * Math.max(1, W - 2 * b.r); }
    }
    var act = bubbles.filter(visible);
    for (i = 0; i < act.length; i++) {
      for (j = i + 1; j < act.length; j++) {
        var a = act[i], c = act[j];
        var dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy), md = a.r + c.r + 2;
        if (d < md && d > 0.01) {
          var push = (md - d) * 0.5 * 0.14; dx /= d; dy /= d;
          a.x -= dx * push; a.y -= dy * push * 0.6; c.x += dx * push; c.y += dy * push * 0.6;
        }
      }
    }
    for (i = 0; i < bubbles.length; i++) {
      var bb = bubbles[i];
      if (bb.x < bb.r) bb.x += (bb.r - bb.x) * 0.2;
      if (bb.x > W - bb.r) bb.x -= (bb.x - (W - bb.r)) * 0.2;
    }
  }

  // --- draw ---
  function fitFont(b) {
    var fs = Math.max(9, b.r * 0.5);
    ctx.font = "600 " + fs + 'px Inter, system-ui, sans-serif';
    var w = ctx.measureText(b.label).width;
    if (w > b.r * 1.78) fs = fs * (b.r * 1.78) / w;
    return fs;
  }
  function drawBubble(b) {
    if (!visible(b)) return;
    var hot = highlighted(b), a = hot ? 1 : 0.13;
    ctx.save();
    var grd = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.1, b.x, b.y, b.r);
    grd.addColorStop(0, applyA(mix(b.color, 0.55), a));
    grd.addColorStop(0.55, applyA(mix(b.color, 0.12), a));
    grd.addColorStop(1, applyA("rgb(" + hexToRgb(b.color).join(",") + ")", a * 0.96));
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = applyA(mix(b.color, 0.25), a * 0.5); ctx.stroke();
    if (hot) {
      ctx.beginPath();
      ctx.ellipse(b.x - b.r * 0.34, b.y - b.r * 0.42, b.r * 0.26, b.r * 0.16, -0.5, 0, 7);
      ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.fill();
      var fs = fitFont(b);
      if (fs >= 8.5) {
        ctx.font = "600 " + fs + 'px Inter, system-ui, sans-serif';
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = textColorFor(b.color);
        ctx.shadowColor = lum(b.color) > 0.62 ? "rgba(255,255,255,.45)" : "rgba(0,0,0,.26)";
        ctx.shadowBlur = 2;
        ctx.fillText(b.label, b.x, b.y);
      }
    }
    ctx.restore();
  }

  function frame(ts) {
    rafId = requestAnimationFrame(frame);
    if (!running) { frame.last = ts; return; }
    if (!frame.last) frame.last = ts;
    var dt = (ts - frame.last) / 16.67; frame.last = ts;
    dt = Math.min(dt, 2.2);
    ctx.clearRect(0, 0, W, H);
    if (!userPaused && !reduce) step(dt);
    var i;
    for (i = 0; i < bubbles.length; i++) if (visible(bubbles[i]) && !highlighted(bubbles[i])) drawBubble(bubbles[i]);
    for (i = 0; i < bubbles.length; i++) if (visible(bubbles[i]) && highlighted(bubbles[i])) drawBubble(bubbles[i]);
  }

  // --- hover tooltip ---
  function pick(px, py) {
    for (var i = bubbles.length - 1; i >= 0; i--) {
      var b = bubbles[i];
      if (!visible(b) || !highlighted(b)) continue;
      if ((px - b.x) * (px - b.x) + (py - b.y) * (py - b.y) <= b.r * b.r) return b;
    }
    return null;
  }
  function onMove(e) {
    if (!bubbles.length) return;
    var rect = cv.getBoundingClientRect();
    var b = pick(e.clientX - rect.left, e.clientY - rect.top);
    if (b) {
      var catLabel = EN() ? (CAT_EN[b.cat] || b.cat_zh) : b.cat_zh;
      var times = EN() ? ("· " + b.count.toLocaleString("en-US") + "×") : ("· 出现 " + b.count.toLocaleString("en-US") + " 次");
      var cov = b.covered ? (EN() ? " · covered" : " · 已覆盖") : "";
      tip.innerHTML = "<b>" + b.label + "</b><br><span class='db-tip-cat'><span style='color:" + b.color + "'>●</span> " + catLabel + cov + " " + times + "</span>";
      tip.style.opacity = 1;
      var wrapRect = host.querySelector(".db-stage-wrap").getBoundingClientRect();
      var tx = e.clientX - wrapRect.left + 14, ty = e.clientY - wrapRect.top + 14;
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      if (tx + tw > W - 6) tx = e.clientX - wrapRect.left - tw - 14;
      if (ty + th > H - 6) ty = e.clientY - wrapRect.top - th - 14;
      tip.style.left = Math.max(4, tx) + "px"; tip.style.top = Math.max(4, ty) + "px";
      cv.style.cursor = "pointer";
    } else { tip.style.opacity = 0; cv.style.cursor = "default"; }
  }

  // --- visibility: lazy init + pause when the tab/panel is hidden or scrolled away ---
  function ensureBuilt() {
    if (built) return;
    resize();
    if (W < 40) return;        // still hidden; wait for a real size
    buildBubbles(); built = true;
  }
  function setRunning(on) {
    if (on) { ensureBuilt(); running = built; }
    else running = false;
  }

  function boot() {
    buildDOM(); buildLegend(); applyLang();
    if (!rafId) rafId = requestAnimationFrame(frame);

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { setRunning(e.isIntersecting && e.intersectionRatio > 0); });
    }, { threshold: [0, 0.08] });
    io.observe(host);

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        if (!built) { setRunning(running); return; }
        var old = bubbles.map(function (b) { return { x: b.x / (W || 1), y: b.y / (H || 1) }; });
        resize(); buildBubbles();
        bubbles.forEach(function (b, i) { if (old[i]) { b.x = old[i].x * W; b.y = old[i].y * H; } });
      });
      ro.observe(host.querySelector(".db-stage-wrap"));
    }

    new MutationObserver(function (m) {
      for (var i = 0; i < m.length; i++) if (m[i].attributeName === "lang") { applyLang(); break; }
    }).observe(document.documentElement, { attributes: true });
  }

  fetch("assets/research/demand-bubbles.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("no data"); return r.json(); })
    .then(function (d) {
      DATA = d;
      raw = ((d && d.bubbles) || []).slice(0, 120);
      if (!raw.length) throw new Error("empty");
      var present = Object.create(null);
      raw.forEach(function (b) { present[b.cat] = 1; });
      legend = ((d && d.legend) || []).filter(function (l) { return present[l.cat]; });
      boot();
    })
    .catch(function () { host.hidden = true; });    // no cloud rather than a broken box
})();
