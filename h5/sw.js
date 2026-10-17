/* Explicit, verified downloads only. No API, third-party or personal-data caching. */
'use strict';
const BASE = self.registration.scope;
const PREFIX = 'lc-offline-' + encodeURIComponent(new URL(BASE).pathname) + '-';
const META = PREFIX + 'meta-v1';
const POINTER = new URL('.offline-active', BASE).href;
let downloading = false;

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

async function active() {
  const response = await (await caches.open(META)).match(POINTER);
  return response ? response.json() : null;
}
async function status() {
  const info = await active();
  if (!info || !(await caches.has(info.cache))) return { pack: null, busy: downloading };
  const cache = await caches.open(info.cache);
  // Storage eviction must never leave a misleading "saved" badge.
  const complete = (await Promise.all(info.assets.map(url => cache.match(url)))).every(Boolean);
  return { pack: complete ? info : null, busy: downloading };
}
// 超时按文件大小放宽：15 秒起步，再按慢速 4G（约 64 KB/s）给够传输时间，3 MB 的图约 1 分钟
async function network(url, size = 0) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000 + size / 64);
  try {
    const response = await fetch(url, { cache: 'no-store', credentials: 'omit', signal: controller.signal, redirect: 'error' });
    if (!response.ok || response.type === 'opaque') {
      const error = new Error('Could not download ' + new URL(url).pathname);
      error.retry = response.status >= 500 || response.status === 429;
      throw error;
    }
    const bytes = await response.arrayBuffer();
    return { response, bytes };
  } catch (error) {
    if (error.retry === undefined) error.retry = true;   // 断网、超时这类网络错误可以重试
    throw error;
  } finally { clearTimeout(timer); }
}
// 单个文件失败先重试它自己（最多 3 次），不让整包从头再来；4xx 和校验不符不重试
async function fetchAsset(asset) {
  for (let attempt = 1; ; attempt++) {
    try {
      const item = await network(asset.url, asset.bytes);
      if (await checksum(item.bytes) !== asset.sha256) throw Object.assign(new Error('Files changed during download. Please try again.'), { retry: false });
      return item;
    } catch (error) {
      if (!error.retry || attempt >= 3) throw error;
      await new Promise(resolve => setTimeout(resolve, 600 * attempt));
    }
  }
}
const PARALLEL = 5;   // 同时下载的文件数：47 个小文件主要耗在等待响应上，并发能省掉大部分等待
function checksum(bytes) {
  return crypto.subtle.digest('SHA-256', bytes).then(buffer => [...new Uint8Array(buffer)].map(n => n.toString(16).padStart(2, '0')).join(''));
}
async function download(send) {
  if (downloading) throw new Error('A download is already running in another tab. Please wait.');
  downloading = true;
  let staging;
  try {
    const manifestURL = new URL('offline-assets.json', BASE).href;
    const manifestResult = await network(manifestURL);
    const manifest = JSON.parse(new TextDecoder().decode(manifestResult.bytes));
    if (manifest.schema !== 1 || !manifest.revision || !Array.isArray(manifest.assets) || !manifest.assets.length) throw new Error('Invalid offline manifest.');
    const seen = new Set();
    const assets = manifest.assets.map(asset => {
      const url = new URL(asset.path, BASE);
      if (!url.href.startsWith(BASE) || url.search || url.hash || !/^[a-f0-9]{64}$/.test(asset.sha256) || seen.has(url.href)) throw new Error('Invalid offline asset.');
      seen.add(url.href);
      return { ...asset, url: url.href };
    });
    for (const required of ['index.html', 'app.js', 'offline.js', 'offline-db.js', 'offline.css', 'data/offline-pvg-t2.json', 'stamp.js', 'stamp-renderer.js', 'stamp.css', 'data/first-stamp.json', 'img/stamp/shanghai-dusk.jpg', 'img/stamp/discover-qr.png', 'fonts/cormorant-garamond.ttf']) {
      if (!seen.has(new URL(required, BASE).href)) throw new Error('Missing required offline asset: ' + required);
    }
    staging = PREFIX + 'pack-' + manifest.revision + '-' + crypto.randomUUID();
    const cache = await caches.open(staging);
    let bytes = 0, done = 0, next = 0, failure = null;
    const worker = async () => {
      while (!failure && next < assets.length) {
        const asset = assets[next++];
        try {
          const item = await fetchAsset(asset);
          const headers = new Headers(item.response.headers);
          headers.delete('content-encoding'); headers.delete('content-length');
          await cache.put(asset.url, new Response(item.bytes, { status: 200, headers }));
          bytes += item.bytes.byteLength;
          send({ type: 'progress', done: ++done, total: assets.length });
        } catch (error) { failure = failure || error; }
      }
    };
    // 大文件慢网下可能一分钟没有新进度；每 10 秒报一次心跳，页面那边 30 秒无消息就判超时
    const heartbeat = setInterval(() => send({ type: 'progress', done, total: assets.length }), 10000);
    // 一个文件最终失败就不再领新文件；等在途的结束后整包作废，旧包不受影响
    try { await Promise.all(Array.from({ length: Math.min(PARALLEL, assets.length) }, worker)); }
    finally { clearInterval(heartbeat); }
    if (failure) throw failure;
    await cache.put(manifestURL, new Response(manifestResult.bytes, { headers: { 'Content-Type': 'application/json' } }));
    const info = { cache: staging, revision: manifest.revision, version: manifest.version, savedAt: new Date().toISOString(), bytes, assets: [...seen, manifestURL] };
    // Publishing this pointer is the commit. A failed staging download cannot replace it.
    await (await caches.open(META)).put(POINTER, new Response(JSON.stringify(info), { headers: { 'Content-Type': 'application/json' } }));
    staging = null;
    const old = (await caches.keys()).filter(name => name.startsWith(PREFIX + 'pack-') && name !== info.cache);
    await Promise.allSettled(old.map(name => caches.delete(name)));
    return info;
  } finally {
    if (staging) await caches.delete(staging);
    downloading = false;
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.filter(client => client.url.startsWith(BASE)).forEach(client => client.postMessage({ type: 'LC_PACK_CHANGED' }));
  }
}
self.addEventListener('message', event => {
  const port = event.ports[0];
  if (!port || !event.source || !event.source.url.startsWith(BASE)) return;
  const send = value => port.postMessage(value);
  event.waitUntil((async () => {
    try {
      if (event.data.type === 'STATUS') send({ type: 'result', ...(await status()) });
      else if (event.data.type === 'DOWNLOAD') send({ type: 'result', pack: await download(send), busy: false });
      else throw new Error('Unknown offline operation.');
    } catch (error) { send({ type: 'error', message: error.message || 'Download failed. Your previous pack is unchanged.' }); }
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || !url.href.startsWith(BASE)) return;
  event.respondWith((async () => {
    const info = await active().catch(() => null);
    if (info) {
      // Only the actual app entry can reuse the shell; never rewrite API or arbitrary paths.
      const isEntry = url.pathname === new URL(BASE).pathname || url.pathname === new URL('index.html', BASE).pathname;
      const key = isEntry ? new URL('index.html', BASE).href : (!url.search ? url.href : null);
      if (key && info.assets.includes(key)) {
        const response = await (await caches.open(info.cache)).match(key);
        if (response) return response;
      }
    }
    return fetch(request);
  })());
});
