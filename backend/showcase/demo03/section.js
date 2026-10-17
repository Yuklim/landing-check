/* 03 落地体验：顶部五个功能 + 左侧手机动画 + 右侧讲解（要点随动画节拍点亮）。
 * 独立页 index.html 与答辩 deck 的 #demo 页共用：Demo03.section(root, { base }) 把整块内容画进 root（1440×810 的定位容器）。
 * 依赖 player.js、copy.js 和各模块 timeline.js 先加载。 */
(function () {
  'use strict';
  const ORDER = ['tickets', 'network', 'payment', 'transport', 'airport'];
  const MAX_PCT = 38.4;   // 需求热度最高的一项，热度条按它归一
  const pad = i => String(i + 1).padStart(2, '0');

  function section(root, opts) {
    opts = opts || {};
    const base = opts.base || '';   // demo03 目录相对页面的路径：独立页 ''，deck 'demo03/'
    const COPY = window.DEMO03_COPY;
    root.classList.add('d3s');
    root.insertAdjacentHTML('beforeend',
      `<div class="d3s-top"><div class="d3s-kicker">${opts.kicker || '03 / 落地体验'}</div><div class="d3s-tabs"></div></div>
       <div class="d3s-phone"></div><div class="d3s-copy"></div>`);
    const tabs = root.querySelector('.d3s-tabs'), area = root.querySelector('.d3s-phone'), copy = root.querySelector('.d3s-copy');
    let idx = 0, player = null;

    ORDER.forEach((k, i) => {
      const b = document.createElement('button'); b.className = 'd3s-tab';
      b.innerHTML = `<span class="n">${pad(i)}</span>${COPY[k].fn}<span class="bar"></span>`;
      b.addEventListener('click', e => { e.stopPropagation(); show(i); });
      tabs.appendChild(b);
    });

    function renderCopy(key, i) {
      const c = COPY[key];
      copy.innerHTML = `
        <div class="cp-head">
          <div class="cp-fn"><span class="n">${pad(i)}</span>${c.fn}</div>
          <div class="cp-need">回应需求 <b>${c.need}</b><span class="cp-meter"><i style="width:${(c.pct / MAX_PCT * 100).toFixed(1)}%"></i></span><span class="cp-pct">${c.pct}%</span></div>
        </div>
        <h2 class="cp-title">${c.title}</h2>
        <ol class="cp-list">${c.items.map((it, j) => `<li class="cp-item"><span class="cp-dot">${j + 1}</span><div><b>${it.t}</b><p>${it.d}</p></div></li>`).join('')}</ol>
        <div class="cp-note">${c.note}</div>`;
      gsap.from(copy.children, { y: 14, autoAlpha: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' });
      return [...copy.querySelectorAll('.cp-item')];
    }

    // 播放到哪一拍，就点亮对应要点；之前的打勾，之后的变淡
    function syncer(key, items, p) {
      const byLabel = {};
      COPY[key].items.forEach((it, j) => it.beats.forEach(l => { byLabel[l] = j; }));
      const beats = p.beats.filter(b => b.label in byLabel).sort((a, b) => a.t - b.t);
      let last = -2;
      return () => {
        const now = p.tl.time() + 0.05;
        let on = 0;
        beats.forEach(b => { if (b.t <= now) on = byLabel[b.label]; });
        if (on === last) return; last = on;
        items.forEach((li, j) => { li.classList.toggle('on', j === on); li.classList.toggle('done', j < on); });
      };
    }

    // 切到第 i 个功能；t 给定时定格在该秒（预览截图用）
    function show(i, t) {
      idx = (i + ORDER.length) % ORDER.length;
      [...tabs.children].forEach((b, j) => { b.setAttribute('aria-selected', j === idx); b.querySelector('.bar').style.width = '0'; });
      stop();
      const key = ORDER[idx];
      const items = renderCopy(key, idx);
      player = Demo03.build(area, key, { base: base + 'modules/' + key + '/' });
      const bar = tabs.children[idx].querySelector('.bar');
      const sync = syncer(key, items, player);
      const tick = () => { bar.style.width = (player.tl.progress() * 100) + '%'; sync(); };
      player.tl.eventCallback('onUpdate', tick);
      window.__d3 = player;
      if (t != null) { player.tl.seek(+t); player.tl.pause(); } else player.play();
      tick();
      return idx;
    }
    function stop() { if (player) { player.destroy(); player = null; } }

    // 把五段的截图都先拉下来，切功能时不用等加载
    function preload() {
      ORDER.forEach(k => {
        const s = Demo03.modules[k]; if (!s) return;
        Object.values(s.shots).forEach(sh => {
          [sh.src, sh.scroll && sh.scroll.src].concat((sh.overlays || []).map(o => o.src)).filter(Boolean)
            .forEach(src => { const im = new Image(); im.src = base + 'modules/' + k + '/' + src; });
        });
      });
    }

    return {
      count: ORDER.length,
      order: ORDER,
      get index() { return idx; },
      get player() { return player; },
      show, stop, preload,
      next() { if (idx < ORDER.length - 1) { show(idx + 1); return true; } return false; },
      prev() { if (idx > 0) { show(idx - 1); return true; } return false; },
      toggle() { if (player) player.tl.paused() ? player.tl.play() : player.tl.pause(); }
    };
  }

  window.Demo03.section = section;
})();
