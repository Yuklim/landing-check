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
async function network(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { cache: 'no-store', credentials: 'omit', signal: controller.signal, redirect: 'error' });
    if (!response.ok || response.type === 'opaque') throw new Error('Could not download ' + new URL(url).pathname);
    const bytes = await response.arrayBuffer();
    return { response, bytes };
  } finally { clearTimeout(timer); }
}
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
    for (const required of ['index.html', 'app.js', 'offline.js', 'offline-db.js', 'offline.css', 'data/offline-pvg-t2.json', 'stamp.js', 'stamp-renderer.js', 'stamp.css', 'data/first-stamp.json', 'img/stamp/shanghai-dusk.png', 'img/stamp/discover-qr.png', 'fonts/cormorant-garamond.ttf']) {
      if (!seen.has(new URL(required, BASE).href)) throw new Error('Missing required offline asset: ' + required);
    }
    staging = PREFIX + 'pack-' + manifest.revision + '-' + crypto.randomUUID();
    const cache = await caches.open(staging);
    let bytes = 0;
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const item = await network(asset.url);
      if (await checksum(item.bytes) !== asset.sha256) throw new Error('Files changed during download. Please try again.');
      const headers = new Headers(item.response.headers);
      headers.delete('content-encoding'); headers.delete('content-length');
      await cache.put(asset.url, new Response(item.bytes, { status: 200, headers }));
      bytes += item.bytes.byteLength;
      send({ type: 'progress', done: i + 1, total: assets.length });
    }
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
