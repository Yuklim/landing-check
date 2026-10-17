/* 03 Demo 演示 · 手机操作动画播放器
 * 每个模块在 modules/<key>/timeline.js 里调用 Demo03.register(key, spec)，播放器把 spec 编成一条 GSAP 时间线，循环播放。
 * 坐标一律是手机屏幕的 CSS 像素（393 × 852，左上角为原点）；截图按 2 倍图导出，显示时缩回 393 宽。
 *
 * spec = {
 *   title: '门票与预约',
 *   shots: {                       // 一屏 = 底图 + 可选滚动层 + 可选浮层
 *     preflight: {
 *       src: 'shots/preflight.png',                                   // 393×852 整屏截图
 *       scroll: { src: 'shots/preflight-scroll.png', x: 0, y: 96, w: 393, h: 680, contentH: 1500 },  // 滚动区窗口 + 全长内容图
 *       overlays: [{ src: 'shots/preflight-fab.png', x: 300, y: 700, w: 80, h: 48 }]                // 盖在滚动层上的固定元素
 *     }
 *   },
 *   steps: [                       // 按顺序执行；未写 dur 用默认值（秒）
 *     { show: 'preflight' },                          // 第一步必须是 show，作为起始画面
 *     { tap: [196, 640] },                            // 手指移到该点并点按
 *     { scroll: 420, dur: 1.2 },                      // 把当前屏滚动层滚到内容偏移 420
 *     { show: 'attractions', via: 'push' },           // 转场：push（右进）/ pop（左进）/ up（底部弹起）/ down（下滑收起）/ fade / none
 *     { hl: [16, 200, 361, 120], label: '实时价格' },   // 高亮框（可带标签），切屏或 { clear: true } 时消失
 *     { zoom: [196, 400, 1.6] },  { zoom: null },      // 以某点为中心放大 / 复原
 *     { wait: 1.5 },  { finger: false },                // 停顿 / 收起手指（下次 tap 时重新出现）
 *     { beat: '上网 · 行前买 eSIM' }                    // 讲解节拍标记，不产生画面；后续右侧讲解按它同步
 *   ]
 * }
 */
(function () {
  'use strict';
  const W = 393, H = 852;
  const D = { show: 0.55, tap: 0.75, scroll: 1.1, hl: 0.45, zoom: 0.7, holdAfterShow: 0.5, endHold: 1.6 };
  const modules = {};
  const players = [];

  function el(tag, cls, parent) { const n = document.createElement(tag); if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; }
  function img(src, base, parent, style) { const i = el('img', 'd3-img', parent); i.src = base + src; i.alt = ''; i.draggable = false; Object.assign(i.style, style || {}); return i; }

  function buildShot(id, s, base, screen) {
    const root = el('div', 'd3-shot', screen); root.dataset.shot = id;
    img(s.src, base, root, { width: W + 'px', height: H + 'px' });
    let inner = null;
    if (s.scroll) {
      const win = el('div', 'd3-scroll', root);
      Object.assign(win.style, { left: s.scroll.x + 'px', top: s.scroll.y + 'px', width: s.scroll.w + 'px', height: s.scroll.h + 'px' });
      inner = img(s.scroll.src, base, win, { width: s.scroll.w + 'px', height: s.scroll.contentH + 'px' });
    }
    (s.overlays || []).forEach(o => img(o.src, base, root, { position: 'absolute', left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: o.h + 'px' }));
    return { root, inner, spec: s };
  }

  function build(mount, key, opts) {
    const spec = modules[key];
    if (!spec) { mount.textContent = 'missing module: ' + key; return null; }
    const base = (opts && opts.base) || ('modules/' + key + '/');
    // 高亮框开关：opts.annotate === false 或页面地址带 ?hl=0 时不画高亮框和标签，只保留手指操作
    const annotate = !(opts && opts.annotate === false) && !/[?&]hl=0\b/.test(location.search);
    mount.innerHTML = '';
    const fit = el('div', 'd3-fit', mount);
    const phone = el('div', 'd3-phone', fit);
    const screen = el('div', 'd3-screen', phone);
    const cam = el('div', 'd3-cam', screen);           // 放大镜头作用在这一层
    const shots = {};
    Object.keys(spec.shots).forEach(id => { shots[id] = buildShot(id, spec.shots[id], base, cam); });
    const fx = el('div', 'd3-fx', cam);                // 高亮框随镜头一起缩放
    const finger = el('div', 'd3-finger', cam);   // 手指也放在镜头层，放大时坐标不变

    const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.4, defaults: { ease: 'power2.inOut' } });
    const order = Object.keys(shots);
    // 起始状态（每次循环回到这里）
    tl.set(order.map(id => shots[id].root), { autoAlpha: 0, x: 0, y: 0, scale: 1, filter: 'brightness(1)' }, 0);
    order.forEach(id => { if (shots[id].inner) tl.set(shots[id].inner, { y: 0 }, 0); });
    tl.set(finger, { autoAlpha: 0, x: W * 0.62, y: H * 0.78, scale: 1 }, 0);
    tl.set(cam, { scale: 1, x: 0, y: 0, transformOrigin: '0 0' }, 0);

    let cur = null, t = 0, fingerShown = false, hls = [];
    const beats = [];
    const clearHl = at => { if (hls.length) { tl.to(hls, { autoAlpha: 0, duration: 0.25 }, at); hls = []; } };

    spec.steps.forEach((st, i) => {
      if (st.beat != null) { beats.push({ t, label: st.beat }); tl.addLabel('beat' + beats.length, t); return; }
      if (st.wait != null) { t += st.wait; return; }
      if (st.clear) { clearHl(t); t += 0.25; return; }
      if (st.finger === false) { if (fingerShown) tl.to(finger, { autoAlpha: 0, duration: 0.25 }, t); fingerShown = false; return; }   // 收起手指，下次 tap 再出现
      if (st.show) {
        const nx = shots[st.show]; if (!nx) { console.warn('[demo03]', key, 'unknown shot', st.show); return; }
        const d = st.dur != null ? st.dur : D.show; const via = cur ? (st.via || 'push') : 'none';
        if (hls.length) { clearHl(t); t += 0.22; }   // 先收起高亮再转场，免得高亮框悬在滑动的画面上
        if (via === 'none' || !cur) { tl.set(nx.root, { autoAlpha: 1, x: 0, y: 0, zIndex: 2 }, t); if (cur) tl.set(cur.root, { autoAlpha: 0, zIndex: 1 }, t); }
        else if (via === 'fade') { tl.set(nx.root, { zIndex: 2, x: 0, y: 0 }, t); tl.fromTo(nx.root, { autoAlpha: 0 }, { autoAlpha: 1, duration: d }, t); tl.set(cur.root, { autoAlpha: 0, zIndex: 1 }, t + d); }
        else if (via === 'push' || via === 'pop') {
          const dir = via === 'push' ? 1 : -1;
          tl.set(nx.root, { zIndex: 2, autoAlpha: 1, y: 0 }, t); tl.set(cur.root, { zIndex: 1 }, t);
          tl.fromTo(nx.root, { x: W * dir }, { x: 0, duration: d, ease: 'power3.out' }, t);
          tl.fromTo(cur.root, { x: 0, filter: 'brightness(1)' }, { x: -W * 0.28 * dir, filter: 'brightness(0.82)', duration: d, ease: 'power3.out' }, t);
          tl.set(cur.root, { autoAlpha: 0, x: 0, filter: 'brightness(1)' }, t + d);
        } else if (via === 'up') {
          tl.set(nx.root, { zIndex: 2, autoAlpha: 1, x: 0 }, t); tl.set(cur.root, { zIndex: 1 }, t);
          tl.fromTo(nx.root, { y: H }, { y: 0, duration: d, ease: 'power3.out' }, t);
          tl.set(cur.root, { autoAlpha: 0 }, t + d);
        } else if (via === 'down') {
          tl.set(nx.root, { zIndex: 1, autoAlpha: 1, x: 0, y: 0 }, t); tl.set(cur.root, { zIndex: 2 }, t);
          tl.fromTo(cur.root, { y: 0 }, { y: H, duration: d, ease: 'power3.in' }, t);
          tl.set(cur.root, { autoAlpha: 0, y: 0 }, t + d);
        }
        // 再次进入同一屏时滚动层从顶部开始，除非写了 keepScroll
        if (nx.inner && !st.keepScroll) tl.set(nx.inner, { y: 0 }, t);
        cur = nx; t += d + (st.hold != null ? st.hold : D.holdAfterShow); return;
      }
      if (st.tap) {
        const [x, y] = st.tap; const d = st.dur != null ? st.dur : D.tap;
        if (!fingerShown) { tl.set(finger, { x: x + 40, y: y + 90 }, t); tl.to(finger, { autoAlpha: 1, duration: 0.2 }, t); fingerShown = true; }
        tl.to(finger, { x, y, duration: d * 0.55, ease: 'power2.inOut' }, t);
        tl.to(finger, { scale: 0.78, duration: 0.1, ease: 'power1.in' }, t + d * 0.55);
        const rip = el('div', 'd3-ripple', fx);
        tl.set(rip, { x, y, autoAlpha: 0, scale: 0.2 }, 0);
        tl.fromTo(rip, { autoAlpha: 0.75, scale: 0.2 }, { autoAlpha: 0, scale: 1.6, duration: 0.55, ease: 'power2.out', immediateRender: false }, t + d * 0.6);
        tl.to(finger, { scale: 1, duration: 0.18, ease: 'power2.out' }, t + d * 0.68);
        t += d + (st.hold != null ? st.hold : 0.15); return;
      }
      if (st.scroll != null) {
        if (!cur || !cur.inner) { console.warn('[demo03]', key, 'step', i, 'scroll on shot without scroll layer'); return; }
        const d = st.dur != null ? st.dur : D.scroll;
        const max = Math.max(0, cur.spec.scroll.contentH - cur.spec.scroll.h);
        const to = Math.min(max, Math.max(0, st.scroll));
        // 手指做一次上滑手势
        const sx = cur.spec.scroll.x + cur.spec.scroll.w * 0.62, sy = cur.spec.scroll.y + cur.spec.scroll.h * 0.72;
        if (!fingerShown) { tl.set(finger, { x: sx, y: sy }, t); tl.to(finger, { autoAlpha: 1, duration: 0.2 }, t); fingerShown = true; }
        tl.to(finger, { x: sx, y: sy, duration: 0.3 }, t);
        tl.to(finger, { y: sy - 160, duration: d * 0.6, ease: 'power1.inOut' }, t + 0.3);
        tl.to(cur.inner, { y: -to, duration: d, ease: 'power2.inOut' }, t + 0.3);
        t += 0.3 + d + (st.hold != null ? st.hold : 0.3); return;
      }
      if (st.hl && !annotate) { t += 0.35; return; }
      if (st.hl) {
        const [x, y, w, h] = st.hl; const d = st.dur != null ? st.dur : D.hl;
        const box = el('div', 'd3-hl', fx);
        Object.assign(box.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
        if (st.label) { const lb = el('div', 'd3-hl-label', box); lb.textContent = st.label; if (y < 60) lb.classList.add('below'); if (x + Math.max(w, 150) > W - 8 && x > W / 2) lb.classList.add('right'); }   // 靠右的框标签右对齐，免得出屏
        tl.set(box, { autoAlpha: 0 }, 0);
        tl.fromTo(box, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: d, ease: 'back.out(2)', immediateRender: false }, t);
        hls.push(box);
        t += d + (st.hold != null ? st.hold : 1.0); return;
      }
      if ('zoom' in st) {
        const d = st.dur != null ? st.dur : D.zoom;
        if (st.zoom) { const [cx, cy, s] = st.zoom; const tx = Math.min(0, Math.max(W - W * s, W / 2 - cx * s)), ty = Math.min(0, Math.max(H - H * s, H / 2 - cy * s));
          tl.to(cam, { scale: s, x: tx, y: ty, duration: d, ease: 'power2.inOut' }, t); }
        else tl.to(cam, { scale: 1, x: 0, y: 0, duration: d, ease: 'power2.inOut' }, t);
        t += d + (st.hold != null ? st.hold : 0.2); return;
      }
      console.warn('[demo03]', key, 'unknown step', st);
    });
    // 收尾：手指淡出、停一会儿再循环
    tl.to(finger, { autoAlpha: 0, duration: 0.3 }, t);
    tl.to(cam, { scale: 1, x: 0, y: 0, duration: 0.01 }, t + D.endHold);
    tl.set({}, {}, t + D.endHold);

    function resize() {
      const r = mount.getBoundingClientRect();
      const s = Math.min(r.width / (W + 28), r.height / (H + 28));
      phone.style.transform = 'translate(-50%,-50%) scale(' + (s > 0 ? s : 1) + ')';
    }
    resize();
    const ro = window.ResizeObserver ? new ResizeObserver(resize) : null; if (ro) ro.observe(mount);
    const p = { key, tl, beats, duration: tl.duration(), play: () => tl.play(), pause: () => tl.pause(), restart: () => tl.restart(), destroy: () => { tl.kill(); if (ro) ro.disconnect(); mount.innerHTML = ''; } };
    players.push(p);
    return p;
  }

  window.Demo03 = {
    register(key, spec) { modules[key] = spec; },
    modules,
    build,
    players
  };
})();
