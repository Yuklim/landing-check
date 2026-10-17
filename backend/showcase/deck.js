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
  }

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
      if (window.SplitText && vis && !reduce) {
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
  function playEnter(i, dir) { resetFrags(i, dir < 0); playIntro(i); }

  // ---------- navigation ----------
  function goto(n, dir) {
    if (busy || n < 0 || n >= N || n === cur) return;
    dir = dir || (n > cur ? 1 : -1);
    busy = true;
    var from = slides[cur], to = slides[n];
    gsap.set(to, { autoAlpha: 1, scale: 1, xPercent: 100 * dir });
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
    var fs = frags(cur);
    if (frag < fs.length) { gsap.to(fs[frag], { autoAlpha: 1, y: 0, duration: .5, ease: EASE, onUpdate: function () { onFrag(cur); } }); frag++; }
    else goto(cur + 1, 1);
  }
  function prev() {
    if (busy) return;
    if (frag > 0) { frag--; gsap.to(frags(cur)[frag], { autoAlpha: 0, y: 16, duration: .35, ease: "power2.in", onUpdate: function () { onFrag(cur); } }); }
    else goto(cur - 1, -1);
  }
  function revealAll() { frags(cur).forEach(function (el) { gsap.set(el, { autoAlpha: 1, y: 0 }); }); frag = frags(cur).length; onFrag(cur); }

  // ---------- input ----------
  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
    else if (e.key === "Home") { e.preventDefault(); goto(0, -1); }
    else if (e.key === "End") { e.preventDefault(); goto(N - 1, 1); }
    else if (e.key === "f" || e.key === "F") { toggleFS(); }
    else if (e.key === "a" || e.key === "A") { revealAll(); }
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

  // ---------- demo scene switcher (LC_SCENES) — GIF-ready: swap st.img for a .gif later ----------
  (function () {
    var sl = document.getElementById("demo"); if (!sl) return;
    var btns = [].slice.call(sl.querySelectorAll(".prod-nav button"));
    var phoneWrap = sl.querySelector(".demo-phone");
    var phone = sl.querySelector(".demo-phone img");
    var steps = sl.querySelector(".demo-steps");
    var S = window.LC_SCENES || [];
    function render(i) {
      var st = S[i]; if (!st) return;
      steps.querySelector(".demo-sc").textContent = "SCENE 0" + (i + 1) + " · " + st.label;
      steps.querySelector("h3").textContent = st.title;
      steps.querySelector(".demo-ol").innerHTML = st.steps.map(function (s) {
        return "<li><b>" + s.h + "</b><span>" + s.d + "</span></li>";
      }).join("");
      if (phone && st.img) { phone.src = "assets/" + st.img; phone.alt = st.title; }
    }
    function show(i, anim) {
      btns.forEach(function (b, k) { b.setAttribute("aria-selected", String(k === i)); });
      if (anim && !reduce) gsap.fromTo([phoneWrap, steps], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .45, ease: EASE, onStart: function () { render(i); } });
      else render(i);
    }
    btns.forEach(function (b, i) { b.addEventListener("click", function () { show(i, true); }); });
    show(0, false);
  })();

  // ---------- boot ----------
  syncChrome();
  playEnter(0, 1);
})();
