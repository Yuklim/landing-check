/* A single, local renderer for preview, PNG export and community snapshots. */
(function () {
  'use strict';
  const images = new Map();
  const BASE = new URL('./', location.href);
  const GREEN = '#243f35', CREAM = '#f6f1e7', BROWN = '#947455';
  function image(path) {
    if (!images.has(path)) images.set(path, new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => { images.delete(path); reject(new Error('The city artwork is unavailable. Connect and save the updated offline pack, then retry.')); };
      img.src = new URL(path, BASE).href;
    }));
    return images.get(path);
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const date = new Date(value + 'T00:00:00Z');
    return !Number.isNaN(+date) && date.toISOString().slice(0, 10) === value;
  }
  function formatDate(value) {
    return validDate(value) ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z')).toUpperCase() : 'DATE KEPT PRIVATE';
  }
  // Deliberate allowlist. Never spread a trip, private draft or API object into a public card.
  function publicCard(config, draft, stamp) {
    return {
      template: config.template.id, cityId: config.city.id, city: config.city.name, country: config.city.country,
      edition: config.city.edition,
      traveler: draft.showName && draft.name.trim() ? Array.from(draft.name.trim()).slice(0, 40).join('') : 'A traveler',
      arrival: draft.showDate && validDate(draft.arrival) ? draft.arrival : null,
      status: stamp ? 'READY TO EXPLORE' : 'JOURNEY PREVIEW',
      unlocked: Boolean(stamp), sequence: stamp ? stamp.sequence : null,
    };
  }
  function font(ctx, size, weight = 500, serif = false) {
    ctx.font = `${weight} ${size}px ${serif ? '"LC Editorial", Georgia, serif' : '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'}`;
  }
  function fit(ctx, value, x, y, width, size, serif = false, weight = 500) {
    let text = String(value), n = size;
    font(ctx, n, weight, serif);
    while (ctx.measureText(text).width > width && n > 20) font(ctx, --n, weight, serif);
    if (ctx.measureText(text).width > width) {
      const chars = Array.from(text);
      while (chars.length && ctx.measureText(chars.join('') + '…').width > width) chars.pop();
      text = chars.join('') + '…';
    }
    ctx.fillText(text, x, y);
  }
  function label(ctx, text, x, y) { ctx.fillStyle = BROWN; font(ctx, 17, 600); ctx.fillText(text, x, y); ctx.fillStyle = GREEN; }
  function cover(ctx, img, x, y, w, h) {
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const iw = w / scale, ih = h / scale;
    ctx.drawImage(img, (img.naturalWidth - iw) / 2, (img.naturalHeight - ih) / 2, iw, ih, x, y, w, h);
  }
  async function draw(canvas, card, config) {
    const [art, qr] = await Promise.all([image(config.city.art), image(config.template.qr), document.fonts.load('600 80px "LC Editorial"')]);
    canvas.width = config.template.width; canvas.height = config.template.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image rendering is unavailable in this browser.');
    ctx.fillStyle = CREAM; ctx.fillRect(0, 0, 1080, 1350);
    // Deterministic paper speckles; no network texture or randomized personal identifier.
    ctx.fillStyle = '#8f795615';
    for (let i = 0; i < 6500; i++) ctx.fillRect((i * 277 + 17) % 1080, (i * 613 + 29) % 1350, i % 3 ? 1 : 2, 1);
    ctx.strokeStyle = '#b6b79e'; ctx.lineWidth = 1; ctx.strokeRect(25.5, 25.5, 1029, 1299);
    ctx.fillStyle = GREEN; ctx.textAlign = 'center';
    font(ctx, 20, 650); ctx.fillText(config.template.headline, 540, 89);
    font(ctx, 112, 500, true); ctx.fillText(`Hello, ${card.city}.`, 540, 220);
    font(ctx, 24, 400); ctx.fillText(card.unlocked ? config.city.subtitle : 'A new city. A story waiting to begin.', 540, 270);
    ctx.strokeStyle = '#b4b7a1'; ctx.beginPath(); ctx.moveTo(58, 307); ctx.lineTo(1022, 307); ctx.stroke();
    ctx.textAlign = 'left'; font(ctx, 17, 500); ctx.fillText('✈   THE FIRST STAMP', 60, 334);
    ctx.textAlign = 'right'; font(ctx, 16, 400); ctx.fillText(config.city.coordinates, 1020, 334);
    ctx.save(); ctx.beginPath(); ctx.rect(54, 354, 972, 457); ctx.clip(); cover(ctx, art, 54, 354, 972, 457); ctx.restore();
    ctx.save(); ctx.translate(859, 730); ctx.rotate(-.18);
    ctx.fillStyle = '#f6f1e7ed'; ctx.beginPath(); ctx.arc(0, 0, 103, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = GREEN; ctx.lineWidth = 2.8;
    [96, 87].forEach(r => { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); });
    ctx.fillStyle = GREEN; ctx.textAlign = 'center'; font(ctx, 16, 700); ctx.fillText(`${card.city.toUpperCase()} · ${card.country.toUpperCase()}`, 0, -28);
    font(ctx, 14, 600); ctx.fillText(`CITY NO. ${card.edition}`, 0, 0);
    font(ctx, 27, 650, true); ctx.fillText(card.unlocked ? 'UNLOCKED' : 'A NEW CHAPTER', 0, 35);
    ctx.restore();
    ctx.strokeStyle = '#b5b49e'; ctx.lineWidth = 1.5; ctx.setLineDash([7, 8]); ctx.beginPath(); ctx.moveTo(26, 852); ctx.lineTo(1054, 852); ctx.stroke(); ctx.setLineDash([]);
    [25, 1055].forEach(x => { ctx.fillStyle = '#e9e5da'; ctx.beginPath(); ctx.arc(x, 852, 13, 0, Math.PI * 2); ctx.fill(); });
    ctx.textAlign = 'left'; label(ctx, 'TRAVELER', 67, 905); fit(ctx, card.traveler, 67, 955, 680, 47, true, 600);
    label(ctx, 'DESTINATION', 67, 1009); font(ctx, 27, 600); ctx.fillText(`${card.city.toUpperCase()}, ${card.country.toUpperCase()}`, 67, 1048);
    label(ctx, 'ARRIVAL', 67, 1098); font(ctx, 22, 500); ctx.fillText(formatDate(card.arrival), 67, 1133);
    label(ctx, 'JOURNEY STATUS', 490, 1098); font(ctx, 22, 600); ctx.fillText(card.status, 490, 1133);
    ctx.textAlign = 'center'; label(ctx, 'CITY STAMP', 884, 905); font(ctx, 93, 500, true); ctx.fillText(card.sequence ? String(card.sequence).padStart(2, '0') : '—', 884, 996);
    ctx.fillStyle = GREEN; font(ctx, 31, 500, true); ctx.fillText('Not just a destination.', 495, 1205); ctx.fillText('The beginning of something unforgettable.', 495, 1243);
    font(ctx, 17, 650); ctx.fillText(config.template.brand, 495, 1290); font(ctx, 15, 400); ctx.fillText(config.template.tagline, 495, 1314);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(qr, 937, 1200, 78, 78); ctx.imageSmoothingEnabled = true;
    ctx.textAlign = 'center'; font(ctx, 10, 600); ctx.fillText('DISCOVER', 976, 1290);
    if (!card.unlocked) { ctx.fillStyle = '#947455'; ctx.textAlign = 'left'; font(ctx, 11, 600); ctx.fillText('PREVIEW · ARRIVAL NOT CONFIRMED', 67, 1310); }
    return canvas;
  }
  async function blob(card, config) {
    const canvas = document.createElement('canvas');
    await draw(canvas, card, config);
    return new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not create the image. Please retry.')), 'image/png'));
  }
  window.LCStampRenderer = { publicCard, validDate, formatDate, draw, blob };
})();
