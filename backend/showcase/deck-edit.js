/* Landing Check · deck 本地编辑模式：在页面上直接改文字，⌘S / Ctrl+S 写回 deck.html 源文件。
 * 只在本地启用（localhost / 127.0.0.1 / file://，或 URL 带 ?edit）；按 E 进入 / 退出。
 * 必须在 deck.js 之前加载：此时 DOM 与源文件一一对应，给每个可编辑元素记下它在源文件中的序号；
 * 之后 deck.js 注入的内容（原声卡片、二维码、demo 步骤、SplitText 拆字）不会被当作源文件内容。
 * 保存时只把改过的元素的内部 HTML 替换回源文件对应位置，其余字节不动。
 * 写回需要 Chrome / Edge（File System Access API）；其他浏览器退化为下载新的 deck.html。 */
(function () {
  "use strict";
  var html = document.documentElement;
  var stage = document.querySelector(".deck-stage");
  if (!stage) return;

  // ---------- snapshot (before deck.js touches the DOM) ----------
  var order = new Map();
  var all = document.getElementsByTagName("*");
  for (var i = 0; i < all.length; i++) order.set(all[i], i);

  function ownText(el) {
    for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.nodeValue.trim()) return true;
    return false;
  }
  var info = new Map();   // editable el -> { idx, tag, cls, saved }
  var eds = [];
  [].forEach.call(stage.querySelectorAll("*"), function (el) {
    if (!ownText(el) || el.closest("svg,button,script,style")) return;
    for (var p = el.parentElement; p && p !== stage; p = p.parentElement) if (info.has(p)) return;
    info.set(el, { idx: order.get(el), tag: el.localName.toLowerCase(), cls: el.getAttribute("class") || "", saved: el.innerHTML });
    eds.push(el);
  });
  order = null;

  var local = location.protocol === "file:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var forced = /[?&]edit\b/.test(location.search);
  if (!local && !forced) return;

  // ---------- source scanner: element offsets in document order ----------
  var VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/;
  var RAW = /^(script|style|title|textarea)$/;
  function scan(src) {
    var out = [], stack = [], low = src.toLowerCase(), n = src.length, i = 0;
    while (i < n) {
      var lt = src.indexOf("<", i); if (lt < 0) break;
      if (src.startsWith("<!--", lt)) { var ce = src.indexOf("-->", lt + 4); i = ce < 0 ? n : ce + 3; continue; }
      if (src[lt + 1] === "!" || src[lt + 1] === "?") { i = (src.indexOf(">", lt) + 1) || n; continue; }
      var close = src[lt + 1] === "/";
      var m = /^[a-zA-Z][^\s\/>]*/.exec(src.slice(lt + (close ? 2 : 1), lt + 64));
      if (!m) { i = lt + 1; continue; }
      var name = m[0].toLowerCase(), j = lt + (close ? 2 : 1) + m[0].length, q = null;
      for (; j < n; j++) {
        var c = src[j];
        if (q) { if (c === q) q = null; } else if (c === '"' || c === "'") q = c; else if (c === ">") break;
      }
      var end = j + 1;
      if (close) {
        for (var k = stack.length - 1; k >= 0; k--) if (stack[k].tag === name) {
          while (stack.length > k) stack.pop().innerEnd = lt;
          break;
        }
        i = end; continue;
      }
      var head = src.slice(lt, end);
      var cm = /\sclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(head);
      var rec = { tag: name, start: lt, innerStart: end, innerEnd: -1, cls: cm ? (cm[1] || cm[2] || cm[3] || "") : "" };
      out.push(rec);
      var inSvg = name === "svg" || stack.some(function (s) { return s.tag === "svg"; });
      if (VOID.test(name) || (inSvg && src[j - 1] === "/")) { rec.innerEnd = end; i = end; continue; }
      if (RAW.test(name)) {
        var rc = low.indexOf("</" + name, end); if (rc < 0) rc = n;
        rec.innerEnd = rc; i = (src.indexOf(">", rc) + 1) || n; continue;
      }
      stack.push(rec); i = end;
    }
    return out;
  }
  function textOf(h) { var t = document.createElement("template"); t.innerHTML = h; return t.content.textContent.replace(/\s+/g, " ").trim(); }

  // ---------- cleanup of contenteditable artefacts ----------
  function unwrap(el) { while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el); el.remove(); }
  function clean(el) {
    var s = info.get(el), t = document.createElement("template");
    t.innerHTML = el.innerHTML;
    [].forEach.call(t.content.querySelectorAll("font"), unwrap);
    if (s.saved.indexOf("<span style") < 0) [].forEach.call(t.content.querySelectorAll("span[style]:not([class])"), unwrap);
    var last = t.content.lastChild;
    if (last && last.nodeName === "BR" && !/<br>\s*$/.test(s.saved)) last.remove();
    var out = t.innerHTML;
    if (s.saved.indexOf("&nbsp;") < 0) out = out.replace(/&nbsp;/g, " ");
    return out;
  }
  function dirtyList() { return eds.filter(function (el) { return el.dataset.dkTouched && clean(el) !== info.get(el).saved; }); }

  // ---------- UI ----------
  var css = document.createElement("style");
  css.textContent =
    ".deck-editing .deck-stage [contenteditable=true]{outline:none;outline-offset:3px;border-radius:3px;cursor:text}" +
    ".deck-editing .deck-stage [contenteditable=true]:hover{outline:1.5px dashed #3b74e088}" +
    ".deck-editing .deck-stage [contenteditable=true]:focus{outline:2px solid #3b74e0;background:#3b74e010}" +
    ".deck-editing .deck-stage [contenteditable=true].dk-dirty{outline:1.5px dashed #ee8a3c}" +
    ".dk-bar{position:fixed;top:12px;right:12px;z-index:60;display:none;align-items:center;gap:10px;padding:8px 10px 8px 14px;border-radius:12px;background:#0e204bf0;color:#fff;font:13px/1.2 system-ui,-apple-system,'PingFang SC',sans-serif;box-shadow:0 8px 28px #0e204b40}" +
    ".deck-editing .dk-bar{display:flex}" +
    ".dk-bar b{font-weight:700;letter-spacing:.02em}.dk-bar .dk-st{opacity:.75}" +
    ".dk-bar button{font:inherit;color:#fff;background:#ffffff1f;border:1px solid #ffffff33;border-radius:8px;padding:6px 10px;cursor:pointer}" +
    ".dk-bar button:hover{background:#ffffff33}.dk-bar .dk-save{background:#3b74e0;border-color:#3b74e0}" +
    ".dk-toast{position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:61;max-width:min(560px,90vw);padding:10px 16px;border-radius:10px;background:#0e204b;color:#fff;font:13.5px/1.5 system-ui,-apple-system,'PingFang SC',sans-serif;box-shadow:0 8px 28px #0e204b40;opacity:0;pointer-events:none;transition:opacity .2s}" +
    ".dk-toast.on{opacity:1}.dk-toast.err{background:#b3261e}";
  document.head.appendChild(css);

  var mac = /Mac|iPhone|iPad/.test(navigator.platform);
  var bar = document.createElement("div");
  bar.className = "dk-bar";
  bar.innerHTML = '<b>编辑模式</b><span class="dk-st"></span><button class="dk-save">保存 ' + (mac ? "⌘S" : "Ctrl+S") + '</button><button class="dk-exit">退出 E</button>';
  document.body.appendChild(bar);
  var st = bar.querySelector(".dk-st");
  var toastEl = document.createElement("div"); toastEl.className = "dk-toast"; document.body.appendChild(toastEl);
  var toastT;
  function toast(msg, err) {
    toastEl.textContent = msg; toastEl.classList.toggle("err", !!err); toastEl.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("on"); }, err ? 6000 : 3200);
  }
  function refresh() {
    var d = dirtyList();
    eds.forEach(function (el) { el.classList.toggle("dk-dirty", d.indexOf(el) >= 0); });
    st.textContent = d.length ? d.length + " 处未保存" : "点文字直接修改";
  }

  // ---------- enter / exit ----------
  var editing = false;
  function enter() {
    editing = true;
    html.classList.add("deck-edit-session", "deck-editing");   // deck.js skips SplitText from now on
    eds.forEach(function (el) {
      var s = info.get(el);
      if (!el.dataset.dkTouched && el.innerHTML !== s.saved) el.innerHTML = s.saved;   // undo SplitText etc.
      el.contentEditable = "true"; el.spellcheck = false;
    });
    refresh();
  }
  function exit() {
    editing = false;
    if (document.activeElement && info.has(document.activeElement)) document.activeElement.blur();
    eds.forEach(function (el) { el.removeAttribute("contenteditable"); });
    html.classList.remove("deck-editing");
    var d = dirtyList().length;
    if (d) toast("还有 " + d + " 处未保存，按 E 回到编辑模式后保存");
  }
  bar.querySelector(".dk-exit").addEventListener("click", exit);
  bar.querySelector(".dk-save").addEventListener("click", function () { save(); });

  stage.addEventListener("input", function (e) {
    var el = e.target.closest("[contenteditable=true]");
    if (el && info.has(el)) { el.dataset.dkTouched = "1"; refresh(); }
  });
  stage.addEventListener("keydown", function (e) {
    if (!e.target.isContentEditable) return;
    if (e.key === "Enter") { e.preventDefault(); document.execCommand("insertLineBreak"); }
    else if (e.key === "Escape") { e.target.blur(); }
  });
  stage.addEventListener("paste", function (e) {
    if (!e.target.isContentEditable) return;
    e.preventDefault();
    var txt = (e.clipboardData || window.clipboardData).getData("text/plain").replace(/\s*\n\s*/g, " ");
    document.execCommand("insertText", false, txt);
  });
  document.addEventListener("keydown", function (e) {
    if (editing && (e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "S")) { e.preventDefault(); save(); return; }
    if (e.target.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "e" || e.key === "E") { editing ? exit() : enter(); }
  });
  window.addEventListener("beforeunload", function (e) { if (dirtyList().length) { e.preventDefault(); e.returnValue = ""; } });

  var hint = document.querySelector(".deck-hint");
  if (hint) hint.textContent += " · E 编辑文字";

  // ---------- file handle (remembered in IndexedDB) ----------
  function idb(mode, val) {
    return new Promise(function (res) {
      try {
        var rq = indexedDB.open("deck-edit", 1);
        rq.onupgradeneeded = function () { rq.result.createObjectStore("kv"); };
        rq.onerror = function () { res(null); };
        rq.onsuccess = function () {
          try {
            var tx = rq.result.transaction("kv", mode), os = tx.objectStore("kv");
            var r = mode === "readonly" ? os.get("handle") : os.put(val, "handle");
            r.onsuccess = function () { res(r.result || null); };
            r.onerror = function () { res(null); };
          } catch (err) { res(null); }
        };
      } catch (err) { res(null); }
    });
  }
  var handle = null;
  async function getHandle() {
    var opt = { mode: "readwrite" };
    if (!handle) handle = await idb("readonly");
    if (handle && (await handle.queryPermission(opt)) !== "granted" && (await handle.requestPermission(opt)) !== "granted") handle = null;
    if (!handle) {
      toast("第一次保存：请选择仓库里的 backend/showcase/deck.html");
      var picked = (await window.showOpenFilePicker({ types: [{ description: "deck.html", accept: { "text/html": [".html"] } }] }))[0];
      if (picked.name !== "deck.html") { toast("选中的是 " + picked.name + "，请选择 deck.html", true); return null; }
      if ((await picked.requestPermission(opt)) !== "granted") { toast("没有写入权限，未保存", true); return null; }
      handle = picked; idb("readwrite", handle);
    }
    return handle;
  }

  // ---------- save ----------
  var saving = false;
  async function save() {
    if (saving) return;
    var dirty = dirtyList();
    if (!dirty.length) { toast("没有需要保存的改动"); return; }
    saving = true;
    try {
      var h = null, src;
      if (window.showOpenFilePicker) {
        h = await getHandle(); if (!h) return;
        src = await (await h.getFile()).text();
      } else {
        src = await (await fetch(location.href.split(/[?#]/)[0], { cache: "no-store" })).text();
      }
      var recs = scan(src), patches = [];
      for (var i = 0; i < dirty.length; i++) {
        var el = dirty[i], s = info.get(el), r = recs[s.idx];
        if (!r || r.tag !== s.tag || r.cls !== s.cls || r.innerEnd < 0 ||
            textOf(src.slice(r.innerStart, r.innerEnd)) !== textOf(s.saved)) {
          el.focus();
          toast("deck.html 和页面对不上（可能文件在别处被改过）。请复制好改动后刷新页面再改。", true);
          return;
        }
        var oldCount = 0;
        for (var k = s.idx + 1; k < recs.length && recs[k].start < r.innerEnd; k++) oldCount++;
        var neu = clean(el);
        patches.push({ el: el, s: s, r: r, html: neu, delta: scan(neu).length - oldCount });
      }
      patches.sort(function (a, b) { return b.r.innerStart - a.r.innerStart; });
      var out = src;
      patches.forEach(function (p) { out = out.slice(0, p.r.innerStart) + p.html + out.slice(p.r.innerEnd); });

      if (h) {
        var w = await h.createWritable(); await w.write(out); await w.close();
      } else {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([out], { type: "text/html" })); a.download = "deck.html"; a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      }
      // element counts inside edited blocks may change: shift the source index of everything after them
      patches.forEach(function (p) {
        if (p.delta) info.forEach(function (o) { if (o.idx > p.s.idx) o.idx += p.delta; });
        p.s.saved = p.html; delete p.el.dataset.dkTouched;
      });
      refresh();
      toast(h ? "已保存 " + patches.length + " 处到 deck.html ✓  commit + push 后线上才会更新"
              : "已下载新的 deck.html，请替换 backend/showcase/deck.html（Chrome / Edge 可直接写回）");
    } catch (err) {
      if (err && err.name === "AbortError") toast("已取消保存");
      else { toast("保存失败：" + (err && err.message || err), true); console.error(err); }
    } finally { saving = false; }
  }

  if (forced) enter();
})();
