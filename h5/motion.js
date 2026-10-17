/* 动效层：只加过渡，不改页面逻辑。最后加载，包住 show() / back()，再按页面补关键时刻的动效。
   系统开了「减弱动态效果」时：翻页改成短淡入，其余动效全部跳过，直接显示结果。 */
(function () {
  'use strict';
  const phone = document.getElementById('phone');
  if (!phone || typeof window.show !== 'function' || !Element.prototype.animate) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => RM.matches;
  const EASE = 'cubic-bezier(.2,.8,.2,1)', DUR = 340;
  const TABS = ['home', 'trips', 'explore'];                       // 底部标签之间切换：淡入，不滑动
  const css = document.createElement('style');
  css.textContent = `
    .screen.lc-leave{display:flex !important;pointer-events:none}
    .tap{transition:transform .14s ${EASE},filter .14s}
    .tap:active{transform:scale(.97)}
    #toast{transition:opacity .2s,transform .25s ${EASE};transform:translate(-50%,8px)}
    #toast.show{transform:translate(-50%,0)}
    .screen [data-pencil-name="Fill"]{transition:width .7s ${EASE}}
    @media (prefers-reduced-motion: reduce){.tap,.tap:active{transition:none;transform:none}#toast,#toast.show{transform:translateX(-50%)}.screen [data-pencil-name="Fill"]{transition:none}}`;
  document.head.appendChild(css);
  const $$ = (route, name) => document.querySelector(`.screen[data-route="${route}"] [data-pencil-name="${name}"]`);
  const run = (el, frames, opts) => el && !reduced() ? el.animate(frames, { duration: DUR, easing: EASE, fill: 'backwards', ...opts }) : null;

  // ---------- 翻页：前进从右滑入，返回向右滑出，标签切换淡入 ----------
  let depth = 0, backing = false, running = [];
  const settle = () => { running.forEach(a => a.finish()); running = []; };
  function transition(from, to, dir) {
    settle();
    if (!from || !to || from === to) return;
    from.classList.add('lc-leave');
    const done = () => { from.classList.remove('lc-leave'); from.style.zIndex = ''; to.style.zIndex = ''; };
    let anims;
    if (reduced() || dir === 'tab') {
      to.style.zIndex = 2;
      anims = [to.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced() ? 150 : 200, easing: 'ease-out' })];
    } else if (dir === 'back') {
      from.style.zIndex = 2;
      anims = [from.animate([{ transform: 'none', boxShadow: '-8px 0 24px rgba(0,0,0,.12)' }, { transform: 'translateX(100%)', boxShadow: '-8px 0 24px rgba(0,0,0,0)' }], { duration: DUR - 40, easing: EASE }),
               to.animate([{ transform: 'translateX(-28%)', filter: 'brightness(.94)' }, { transform: 'none', filter: 'none' }], { duration: DUR - 40, easing: EASE })];
    } else {
      to.style.zIndex = 2;
      anims = [to.animate([{ transform: 'translateX(100%)', boxShadow: '-8px 0 24px rgba(0,0,0,0)' }, { transform: 'none', boxShadow: '-8px 0 24px rgba(0,0,0,.12)' }], { duration: DUR, easing: EASE }),
               from.animate([{ transform: 'none', filter: 'none' }, { transform: 'translateX(-28%)', filter: 'brightness(.94)' }], { duration: DUR, easing: EASE })];
    }
    running = anims;
    Promise.all(anims.map(a => a.finished.catch(() => {}))).then(done);
    if (dir === 'forward' && !reduced()) stagger(to);
  }
  // 新页面里的卡片依次浮现
  function stagger(screen) {
    const sc = screen.querySelector(':scope > .scroll'); if (!sc) return;
    let i = 0;
    for (const c of sc.children) {
      if (i >= 8) break;
      if (c.offsetParent === null || c.offsetTop > sc.scrollTop + sc.clientHeight) continue;
      run(c, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: 90 + i * 45 }); i++;
    }
  }
  const origShow = window.show, origBack = window.back;
  window.show = function (route, push) {
    if (depth) return origShow.apply(this, arguments);              // 页面钩子里的连跳（如行前检查先进隐私页）只算一次过渡
    const from = document.querySelector('.screen.on'), dir = backing ? 'back' : TABS.includes(route) && TABS.includes(from && from.dataset.route) ? 'tab' : 'forward';
    depth++;
    try { origShow.apply(this, arguments); } finally { depth--; }
    const to = document.querySelector('.screen.on');
    if (from !== to) { transition(from, to, dir); moments(to && to.dataset.route, dir); }
  };
  window.back = function () { backing = true; try { return origBack.apply(this, arguments); } finally { backing = false; } };

  // ---------- 关键时刻 ----------
  // 数字从旧值滚到新值（行前检查百分比）
  function countTo(el, to, from = 0) {
    if (!el) return;
    el._lcLast = to; if (reduced()) return;
    const t0 = performance.now(), d = 700;
    const step = t => { const k = Math.min(1, (t - t0) / d), v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); el.textContent = v + '%'; el._lcSet = true; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  const pop = el => run(el, [{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1.12)', opacity: 1, offset: .6 }, { transform: 'scale(1)' }], { duration: 520, easing: 'cubic-bezier(.3,1.4,.5,1)' });
  function moments(route, dir) {
    if (route === 'preflight') {
      const fill = $$('preflight', 'Fill'), pct = $$('preflight', 'Progress Pct');
      if (fill && !reduced()) { const w = fill.style.width || getComputedStyle(fill).width; fill.style.transition = 'none'; fill.style.width = '0%'; void fill.offsetWidth; fill.style.transition = ''; requestAnimationFrame(() => { fill.style.width = w; }); }
      const n = pct && parseInt(pct.textContent, 10); if (n >= 0) countTo(pct, n);
    }
    if (route === 'payment' && dir !== 'back') {
      const fail = /fail/i.test(($$('payment', 'Result Title') || {}).textContent || '');
      if (!fail) { pop($$('payment', 'OK Circle')); run($$('payment', 'Verified Chip'), [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { delay: 380 }); }
      else run($$('payment', 'OK Circle'), [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }], { duration: 400, delay: 200 });
    }
    if (route === 'share' || route === 'city-passport') setTimeout(stampPress, 60);  // stamp.js 在 lcOnShow 里重画完再动
  }
  // 分享页：卡片落下 + 印章盖章；城市图鉴：印章盖下
  function stampPress() {
    const s = document.querySelector('.screen.on');
    run(s && s.querySelector('.fs-preview canvas'), [{ transform: 'scale(1.08) rotate(-1.5deg)', opacity: 0 }, { transform: 'scale(.985)', opacity: 1, offset: .7 }, { transform: 'none' }], { duration: 620, delay: 120 });
    run(s && s.querySelector('.fs-number'), [{ transform: 'scale(2.2)', opacity: 0 }, { transform: 'scale(.9)', opacity: 1, offset: .65 }, { transform: 'none' }], { duration: 520, delay: 520, easing: 'cubic-bezier(.3,1.3,.5,1)' });
    run(s && s.querySelector('.fs-city-tile:not(.locked) .fs-seal'), [{ transform: 'scale(1.9) rotate(-12deg)', opacity: 0 }, { transform: 'scale(.92) rotate(0)', opacity: 1, offset: .6 }, { transform: 'none' }], { duration: 560, delay: 260, easing: 'cubic-bezier(.3,1.3,.5,1)' });
    run(s && s.querySelector('.fs-count'), [{ transform: 'translateY(10px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, delay: 200 });
  }

  // ---------- 状态变化：观察 DOM，不改原有代码 ----------
  const ob = new MutationObserver(list => {
    if (reduced()) return;
    for (const m of list) {
      // 隐私页开关、支付页单选：原代码整块替换节点，这里让新节点滑 / 弹到位
      const old = m.removedNodes[0], same = old && old.nodeType === 1 && m.addedNodes[0] && old.outerHTML === m.addedNodes[0].outerHTML;
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        const name = n.dataset && n.dataset.pencilName;
        if (name === 'Switch' && old && !same && m.target.closest('[data-route="privacy"]')) {
          const knob = n.querySelector('[data-pencil-name="Knob"]'); if (!knob) continue;
          const cs = getComputedStyle(n), dx = Math.max(0, n.clientWidth - knob.offsetWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)), on = cs.justifyContent === 'flex-end';
          knob.animate([{ transform: `translateX(${on ? -dx : dx}px)` }, { transform: 'none' }], { duration: 220, easing: EASE });
          n.animate([{ filter: 'saturate(.3)' }, { filter: 'none' }], { duration: 220 });
        }
        if (name === 'Radio' && old && !same && m.target.dataset.lcPicked === '1' && m.target.closest('[data-route="paysetup"]'))
          n.animate([{ transform: 'scale(.5)' }, { transform: 'scale(1.15)', offset: .6 }, { transform: 'none' }], { duration: 300, easing: EASE });
        // TripGenie：新消息浮现
        if (n.parentElement === m.target && m.target.closest('[data-route="genie"]') && (n.hasAttribute('data-g-msg') || m.target.querySelector(':scope > [data-g-msg]')))
          n.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: EASE });
      }
      // 行前检查百分比被异步更新：从旧值滚到新值
      if (m.type === 'characterData' || m.type === 'childList') {
        const pct = m.target.nodeType === 1 ? m.target : m.target.parentElement;
        if (pct && pct.dataset && pct.dataset.pencilName === 'Progress Pct') {
          if (pct._lcSet) { pct._lcSet = false; continue; }
          const to = parseInt(pct.textContent, 10), from = pct._lcLast || 0; pct._lcLast = to;
          if (to !== from && to >= 0) countTo(pct, to, from);
        }
      }
    }
  });
  ob.observe(phone, { childList: true, subtree: true, characterData: true });
  // 单选：只给刚点中的那一项弹一下
  const OPTS = '[data-route="paysetup"] [data-pencil-name^="Method "], [data-route="paysetup"] [data-pencil-name^="Use "]';
  document.addEventListener('click', e => {
    const opt = e.target.closest(OPTS); if (!opt) return;
    document.querySelectorAll(OPTS).forEach(o => { o.dataset.lcPicked = o === opt ? '1' : '0'; });
  }, true);
  // 选中框边框 / 底色渐变
  css.textContent += `.screen[data-route="paysetup"] [data-pencil-name^="Method "],.screen[data-route="paysetup"] [data-pencil-name^="Use "]{transition:border-color .2s,background-color .2s,box-shadow .2s}`;

  // ---------- 弹层：底部面板上滑，提示条浮起 ----------
  const overlays = new WeakMap();
  const watchOverlay = el => {
    if (overlays.has(el)) return; overlays.set(el, getComputedStyle(el).display);
    new MutationObserver(() => {
      const was = overlays.get(el), now = getComputedStyle(el).display; overlays.set(el, now);
      if (was !== 'none' || now === 'none' || reduced()) return;
      const sheet = el.firstElementChild, isSheet = getComputedStyle(el).justifyContent === 'flex-end' && el.offsetHeight > 300;
      if (isSheet) { el.animate([{ backgroundColor: 'rgba(18,24,38,0)' }, { backgroundColor: getComputedStyle(el).backgroundColor }], { duration: 260, easing: 'ease-out' }); sheet && sheet.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 360, easing: EASE }); }
      else el.animate([{ opacity: 0, transform: 'translateY(16px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: EASE });
    }).observe(el, { attributes: true, attributeFilter: ['style'] });
  };
  const scan = () => { for (const c of phone.children) if (!c.classList.contains('screen') && c.id !== 'toast' && c.id !== 'notif') watchOverlay(c); };
  scan(); new MutationObserver(scan).observe(phone, { childList: true });
})();
