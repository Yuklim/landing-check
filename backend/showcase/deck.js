/* Landing Check · 答辩 deck controller (GSAP-driven).
 * Horizontal slide transitions with inertial easing, staggered content intros, SplitText title
 * reveals, per-slide fragment stepping (roadmap), count-ups, ecosystem link drawing, QR codes.
 * Reuses LC_SHOWCASE (video), LC_EVIDENCE (voices), LC_STAGES (product) and demand-bubbles.js.
 * Chinese-primary. Keyboard ←/→/Space/Home/End/F/A, on-screen arrows, touch swipe, dots + counter. */
(function () {
  "use strict";
  var gsap = window.gsap;
  if (!gsap) { document.documentElement.classList.add("reveal-all"); return; }  // no motion lib -> static

  var reg = [];
  if (window.SplitText) reg.push(window.SplitText);
  if (window.CustomEase) reg.push(window.CustomEase);
  if (reg.length) gsap.registerPlugin.apply(gsap, reg);
  var EASE = window.CustomEase ? window.CustomEase.create("lc", "0.22,1,0.36,1") : "power3.out";
  var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;

  var root = document.querySelector(".deck-root");
  var stage = document.querySelector(".deck-stage");
  var slides = [].slice.call(document.querySelectorAll(".slide"));
  var N = slides.length;
  var cur = 0, frag = 0, busy = false;

  // ---------- stage scaling (fit 1440x810 into viewport) ----------
  function fit() {
    var s = Math.min(window.innerWidth / 1440, window.innerHeight / 810);
    gsap.set(stage, { xPercent: -50, yPercent: -50, left: "50%", top: "50%", scale: s });
  }
  window.addEventListener("resize", fit); fit();

  gsap.set(slides, { autoAlpha: 0 });
  gsap.set(slides[0], { autoAlpha: 1, xPercent: 0, scale: 1 });

  // ---------- chrome ----------
  var dotsWrap = document.querySelector(".deck-dots");
  var counter = document.querySelector(".deck-counter");
  var progress = document.querySelector(".deck-progress");
  slides.forEach(function (sl, i) {
    var b = document.createElement("button");
    b.setAttribute("aria-label", "第 " + (i + 1) + " 页");
    if (sl.hasAttribute("data-chapter")) b.className = "chapter";
    b.addEventListener("click", function () { if (i !== cur) goto(i); });
    dotsWrap.appendChild(b);
  });
  var dots = [].slice.call(dotsWrap.children);
  function syncChrome() {
    dots.forEach(function (d, i) { d.classList.toggle("on", i === cur); });
    counter.textContent = (cur + 1) + " / " + N;
    gsap.to(progress, { width: (N > 1 ? cur / (N - 1) * 100 : 100) + "%", duration: .4, ease: "power2.out" });
    syncDock();
  }

  // ---------- docked QR: top-right on every slide after the cover, except slides with their own QR ----------
  var dock = document.querySelector(".qr-dock");
  var dockFrom = slides.indexOf(document.getElementById("cover"));
  function syncDock() {
    if (!dock) return;
    var on = dockFrom >= 0 && cur > dockFrom && !slides[cur].querySelector(".qr");
    dock.classList.toggle("on", on);
    dock.classList.remove("big");   // a zoomed QR never carries over to the next slide
  }
  function zoomDock(big) { if (dock && dock.classList.contains("on")) dock.classList.toggle("big", big); }
  if (dock) dock.addEventListener("click", function () {
    if (!document.documentElement.classList.contains("deck-editing")) zoomDock(!dock.classList.contains("big"));
    dock.blur();
  });

  // ---------- fragments ----------
  function frags(i) { return [].slice.call(slides[i].querySelectorAll(".frag")); }
  function resetFrags(i, showAll) {
    frags(i).forEach(function (el) { gsap.set(el, { autoAlpha: showAll ? 1 : 0, y: showAll ? 0 : 16 }); });
    frag = showAll ? frags(i).length : 0;
    onFrag(i);
  }
  function onFrag(i) {
    var sl = slides[i];
    var fill = sl.querySelector(".road-line .fill");
    if (fill) {
      var nodes = [].slice.call(sl.querySelectorAll(".road-node"));
      var shown = nodes.filter(function (n) { return gsap.getProperty(n, "opacity") > .5; }).length;
      gsap.to(fill, { width: (nodes.length ? shown / nodes.length * 100 : 0) + "%", duration: .55, ease: EASE });
    }
  }

  // ---------- intros ----------
  function visibleLang(c) {
    if (!c) return null;
    var a = c.querySelectorAll(".zh,.en");
    for (var k = 0; k < a.length; k++) if (a[k].offsetParent !== null) return a[k];
    return c;
  }
  function animateBars(sl) {
    var fills = [].slice.call(sl.querySelectorAll(".bar-fill[data-w]"));
    fills.forEach(function (f) { gsap.set(f, { width: 0 }); });
    if (reduce) { fills.forEach(function (f) { f.style.width = f.dataset.w + "%"; }); }
    else gsap.to(fills, { width: function (i, t) { return t.dataset.w + "%"; }, duration: 1, stagger: .045, ease: "power2.out", delay: .2 });
    sl.querySelectorAll("[data-count]").forEach(function (el) {
      var target = +el.getAttribute("data-count");
      if (reduce) { el.textContent = target.toLocaleString("en-US"); return; }
      var o = { v: 0 };
      gsap.to(o, { v: target, duration: 1.1, ease: "power1.out", delay: .2, onUpdate: function () { el.textContent = Math.round(o.v).toLocaleString("en-US"); } });
    });
  }
  function drawEco(sl) {
    var svg = sl.querySelector(".eco-links"); if (svg) {
      [].slice.call(svg.querySelectorAll("line")).forEach(function (ln) {
        ln.setAttribute("pathLength", "100");
        ln.style.strokeDasharray = "100"; ln.style.strokeDashoffset = "100";
        gsap.to(ln, { strokeDashoffset: 0, duration: .8, ease: "power2.out", delay: .35 });
      });
    }
    gsap.fromTo(sl.querySelector(".eco-center"), { autoAlpha: 0, scale: .7 }, { autoAlpha: 1, scale: 1, duration: .6, ease: "back.out(1.6)", delay: .1 });
    gsap.fromTo(sl.querySelectorAll(".eco-node"), { autoAlpha: 0, scale: .8 }, { autoAlpha: 1, scale: 1, duration: .5, stagger: .07, ease: "back.out(1.6)", delay: .55 });
  }
  var INTRO = {
    cover: function (sl) {
      makeQR(sl);
      var vis = visibleLang(sl.querySelector(".cover-title"));
      if (window.SplitText && vis && !reduce && !document.documentElement.classList.contains("deck-edit-session")) {
        try {
          var sp = new SplitText(vis, { type: "chars,words" });
          gsap.fromTo(sp.chars, { yPercent: 120, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: .7, stagger: .02, ease: EASE, delay: .12 });
        } catch (e) { }
      }
    },
    "needs-map": function (sl) { animateBars(sl); },
    team: function (sl) { makeQR(sl); },
    "iter-eco": function (sl) { if (!reduce) drawEco(sl); }
  };
  function playIntro(i) {
    var sl = slides[i];
    var items = [].slice.call(sl.querySelectorAll("[data-a]"));
    if (items.length && !reduce) {
      gsap.killTweensOf(items);
      gsap.fromTo(items, { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .62, stagger: .07, ease: EASE, delay: .06 });
    } else gsap.set(items, { autoAlpha: 1, y: 0 });
    var fn = INTRO[sl.id]; if (fn) fn(sl);
  }
  function playEnter(i, dir) { if (onStamp(i)) stampFx.reset(); resetFrags(i, dir < 0); playIntro(i); if (onDemo(i)) demo.show(dir < 0 ? demo.count - 1 : 0); }

  // ---------- 03 落地体验（demo03/section.js）：页内先切五个功能，走完再翻页 ----------
  var demo = null, demoSlide = document.getElementById("demo");
  if (demoSlide && window.Demo03 && Demo03.section) {
    demo = Demo03.section(demoSlide, { base: "demo03/", kicker: "03 / 落地体验" });
    [].forEach.call(demoSlide.querySelectorAll(".d3s-top,.d3s-phone,.d3s-copy"), function (el) { el.setAttribute("data-a", ""); });   // 和其他页一样的入场
    demo.show(0, 0);                         // 先定格在第一帧，进页时再从头播放
    setTimeout(demo.preload, 1500);
  }
  function onDemo(i) { return demo && slides[i] === demoSlide; }

  // ---------- 用户增长页「分享获客」：票根文字放大到正中 → 变成票根 → 纸飞机滑出到下一页 ----------
  // 起点是带 .sfx-src 的那行字，挪到别的页只需移动这个 class
  var stampFx = (function () {
    var src = stage.querySelector(".slide .sfx-src"), sl = src && src.closest(".slide"), layer = stage.querySelector(".stamp-fx");
    if (!sl || !layer || !src) return null;
    var veil = layer.querySelector(".sfx-veil"), word = layer.querySelector(".sfx-word"), card = layer.querySelector(".sfx-card");
    var step = 0, tl = null;   // 0 正常页 · 1 票根展示中 · 2 正在飞出
    var html = document.documentElement;
    function editing() { return html.classList.contains("deck-editing") || html.classList.contains("deck-edit-session"); }
    function reset() {
      if (tl) tl.kill(); tl = null; step = 0;
      gsap.set(layer, { autoAlpha: 0 });
      gsap.set(veil, { autoAlpha: 0 });
      gsap.set(word, { autoAlpha: 0, xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1, filter: "blur(0px)" });
      gsap.set(card, { autoAlpha: 0, x: 0, y: 0, scale: 1, rotation: 0, rotationY: 0, transformPerspective: 900 });
      gsap.set(src, { autoAlpha: 1 });
    }
    function origin() {   // 卡片里那行字的中心，换算成相对 stage 中心的偏移（stage 坐标，已除去缩放）
      var s = stage.getBoundingClientRect(), k = s.width / 1440, r = src.getBoundingClientRect();
      return {
        x: (r.left + r.width / 2 - s.left) / k - 720,
        y: (r.top + r.height / 2 - s.top) / k - 405,
        sc: parseFloat(getComputedStyle(src).fontSize) / parseFloat(getComputedStyle(word).fontSize)
      };
    }
    function show() {
      step = 1;
      if (tl) tl.kill();
      gsap.set(layer, { autoAlpha: 1 });
      if (reduce) { tl = gsap.timeline().set(src, { autoAlpha: 0 }).to(veil, { autoAlpha: 1, duration: .3 }, 0).to(card, { autoAlpha: 1, rotation: -2.5, duration: .4 }, 0); return; }
      var o = origin();
      tl = gsap.timeline()
        .set(src, { autoAlpha: 0 }, 0)
        .fromTo(veil, { autoAlpha: 0 }, { autoAlpha: 1, duration: .55, ease: "power1.out" }, 0)
        .fromTo(word, { autoAlpha: 1, x: o.x, y: o.y, scale: o.sc }, { x: 0, y: 0, scale: 1, duration: .85, ease: EASE }, 0)
        .to(word, { scale: 1.06, duration: .25, ease: "sine.out" }, ">-0.05")
        .to(word, { autoAlpha: 0, scale: .72, filter: "blur(8px)", duration: .4, ease: "power2.in" }, ">")
        .fromTo(card, { autoAlpha: 0, scale: .28, rotation: -9, y: 16 }, { autoAlpha: 1, scale: 1, rotation: -2.5, y: 0, duration: .8, ease: "back.out(1.3)" }, "<0.12");
    }
    function hide() {   // ← 收回到正常页面
      step = 0;
      if (tl) tl.kill();
      tl = gsap.timeline({ onComplete: reset })
        .to(word, { autoAlpha: 0, duration: .2 }, 0)
        .to(card, { autoAlpha: 0, scale: .55, rotation: -8, duration: .38, ease: "power2.in" }, 0)
        .to(veil, { autoAlpha: 0, duration: .4 }, .12)
        .fromTo(src, { autoAlpha: 0 }, { autoAlpha: 1, duration: .3 }, .25);
    }
    function fly() {    // 纸飞机：先往回一收，再向右上倾斜滑出；途中翻到下一页
      step = 2;
      if (tl) tl.kill();
      var nextIdx = slides.indexOf(sl) + 1;
      gsap.set(word, { autoAlpha: 0 });
      if (reduce) { reset(); goto(nextIdx, 1); return; }
      gsap.set(card, { autoAlpha: 1 });
      tl = gsap.timeline({ onComplete: reset })
        .to(card, { rotation: -7, x: -28, y: 14, scale: .97, duration: .24, ease: "power1.out" }, 0)
        .to(card, { x: 1180, y: -310, rotation: 16, rotationY: -30, scale: .42, duration: .9, ease: "power2.in" }, .22)
        .to(card, { autoAlpha: 0, duration: .25 }, .9)
        .to(veil, { autoAlpha: 0, duration: .45 }, .3)
        .add(function () { goto(nextIdx, 1); }, .42);
    }
    reset();
    return {
      slide: sl, reset: reset,
      flying: function () { return step === 2; },
      next: function () { if (editing() && step === 0) return false; if (step === 0) show(); else if (step === 1) fly(); return true; },
      prev: function () { if (step === 1) { hide(); return true; } return step === 2; }
    };
  })();
  function onStamp(i) { return stampFx && slides[i] === stampFx.slide; }

  // ---------- navigation ----------
  function goto(n, dir) {
    if (busy || n < 0 || n >= N || n === cur) return;
    dir = dir || (n > cur ? 1 : -1);
    busy = true;
    var from = slides[cur], to = slides[n];
    if (onDemo(cur)) demo.stop();
    if (onStamp(cur) && !stampFx.flying()) stampFx.reset();   // 圆点/Home/End 离开时收起票根
    gsap.set(to, { autoAlpha: 1, scale: 1, xPercent: 100 * dir });
    if (!reduce) gsap.set(to.querySelectorAll("[data-a]"), { autoAlpha: 0, y: 28 });  // 预隐入场内容，避免滑入途中先显示、到 0.3s 又被 playIntro 重置造成的闪烁
    var tl = gsap.timeline({ onComplete: function () { gsap.set(from, { autoAlpha: 0 }); busy = false; } });
    if (reduce) { tl.set(from, { autoAlpha: 0 }).set(to, { xPercent: 0, autoAlpha: 1 }); }
    else {
      tl.to(from, { xPercent: -55 * dir, scale: .97, autoAlpha: 0, duration: .5, ease: "power2.in" }, 0)
        .to(to, { xPercent: 0, duration: .62, ease: EASE }, 0.05);
    }
    cur = n; syncChrome();
    tl.add(function () { playEnter(n, dir); }, reduce ? 0 : 0.3);
    hideHint();
  }
  function next() {
    if (busy) return;
    if (onDemo(cur) && demo.next()) return;
    if (onStamp(cur) && stampFx.next()) return;
    var fs = frags(cur);
    if (frag < fs.length) { gsap.to(fs[frag], { autoAlpha: 1, y: 0, duration: .5, ease: EASE, onUpdate: function () { onFrag(cur); } }); frag++; }
    else goto(cur + 1, 1);
  }
  function prev() {
    if (busy) return;
    if (onDemo(cur) && demo.prev()) return;
    if (onStamp(cur) && stampFx.prev()) return;
    if (frag > 0) { frag--; gsap.to(frags(cur)[frag], { autoAlpha: 0, y: 16, duration: .35, ease: "power2.in", onUpdate: function () { onFrag(cur); } }); }
    else goto(cur - 1, -1);
  }
  function revealAll() { frags(cur).forEach(function (el) { gsap.set(el, { autoAlpha: 1, y: 0 }); }); frag = frags(cur).length; onFrag(cur); }

  // ---------- input ----------
  document.addEventListener("keydown", function (e) {
    if (e.target.isContentEditable) return;   // typing in deck-edit.js edit mode
    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
    else if (e.key === "Home") { e.preventDefault(); goto(0, -1); }
    else if (e.key === "End") { e.preventDefault(); goto(N - 1, 1); }
    else if (e.key === "f" || e.key === "F") { toggleFS(); }
    else if (e.key === "a" || e.key === "A") { revealAll(); }
    else if (e.key === "q" || e.key === "Q") { zoomDock(!(dock && dock.classList.contains("big"))); }
    else if (e.key === "Escape") { zoomDock(false); }
  });
  var pv = document.querySelector(".deck-arrows .prev"), nx = document.querySelector(".deck-arrows .next");
  if (pv) pv.addEventListener("click", prev); if (nx) nx.addEventListener("click", next);
  var tx = 0, ty = 0;
  root.addEventListener("touchstart", function (e) { tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY; }, { passive: true });
  root.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); }
  }, { passive: true });

  function toggleFS() { if (!document.fullscreenElement) { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); } else document.exitFullscreen(); }
  var fsBtn = document.querySelector(".deck-tools .fs"); if (fsBtn) fsBtn.addEventListener("click", toggleFS);

  var hint = document.querySelector(".deck-hint");
  function hideHint() { if (hint) hint.classList.add("hide"); }
  setTimeout(hideHint, 5500);

  // ---------- QR (qrcode-generator) ----------
  function makeQR(sl) {
    var box = sl.querySelector(".qr"); if (!box || box.dataset.done) return;
    var url = box.dataset.url || "https://yuklim.github.io/landing-check/h5/?api=https://landing-check.onrender.com&guide=1";
    if (window.qrcode) {
      try {
        var qr = qrcode(0, "M"); qr.addData(url); qr.make();
        box.innerHTML = qr.createImgTag(6, 0);
        var img = box.querySelector("img"); if (img) { img.style.width = "100%"; img.style.height = "100%"; img.alt = "原型二维码"; }
        box.dataset.done = "1";
      } catch (e) { }
    }
  }

  // ---------- reuse: video / demo links ----------
  (function () {
    var cfg = window.LC_SHOWCASE || {};
    var host = document.getElementById("deckVideo");
    if (host) {
      var v = document.createElement("video");
      v.src = "assets/landing-check-opener-v3.mp4";   // cinematic opener (片头)
      v.controls = true; v.playsInline = true; v.preload = "metadata";
      host.appendChild(v);
    }
    if (cfg.demoUrl) {
      document.querySelectorAll(".qr").forEach(function (q) { if (!q.dataset.url) q.dataset.url = cfg.demoUrl; });
      document.querySelectorAll(".demo-link").forEach(function (a) { a.href = cfg.demoUrl; });
    }
  })();

  // ---------- reuse: voices (LC_EVIDENCE) ----------
  (function () {
    var host = document.getElementById("deckVoices"); var data = window.LC_EVIDENCE || [];
    if (!host || !data.length) return;
    var catZH = { payment: "支付", connectivity: "联网", arrival_airport: "落地", local_transport: "交通", prep: "行前", tickets_booking: "门票" };
    var core = data.filter(function (d) { return d.core; });
    var chosen = [], seen = {};
    core.forEach(function (d) { if (!seen[d.topic] && chosen.length < 6) { chosen.push(d); seen[d.topic] = 1; } });
    while (chosen.length < 6 && core[chosen.length]) chosen.push(core[chosen.length]);
    host.innerHTML = chosen.map(function (d) {
      var av = (d.platform || "?")[0];
      return '<div class="voice-card"><div class="voice-top"><span class="voice-ava">' + av + '</span><span class="voice-plat">' + d.platform + '</span><span class="voice-cat">' + (catZH[d.topic] || "需求") + '</span></div><blockquote>' + d.zh + '</blockquote>' + (d.quote ? '<span class="orig">“' + d.quote + '”</span>' : '') + '</div>';
    }).join("");
  })();

  // ---------- boot ----------
  syncChrome();
  playEnter(0, 1);
})();
