#!/usr/bin/env python3
"""Build the integrity manifest after changing the H5 or offline data (stdlib only)."""
import hashlib
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent

def build():
    paths = {'index.html', 'app.js', 'offline-db.js', 'offline.js', 'offline.css',
             'manifest.json', 'icon-180.png', 'icon-512.png', 'tutorials.json', 'data/offline-pvg-t2.json',
             'stamp.js', 'stamp-renderer.js', 'stamp.css', 'data/first-stamp.json', 'motion.js'}
    html = (HERE / 'index.html').read_text()
    paths.update(re.findall(r'''(?:src=["']|url\(["']?)(img/[^"'\s)]+)''', html))
    paths.update(p.relative_to(HERE).as_posix() for p in (HERE / 'img' / 'offline').glob('*.svg'))
    for ext in ('*.png', '*.jpg', '*.jpeg'):
        paths.update(p.relative_to(HERE).as_posix() for p in (HERE / 'img' / 'stamp').glob(ext)
                     if not (p.suffix == '.png' and p.with_suffix('.jpg').exists()))   # 原图 PNG 只给 Pen 用，H5 用同名 JPEG
    paths.update(p.relative_to(HERE).as_posix() for p in (HERE / 'fonts').glob('*') if p.is_file())
    assets = []
    for path in sorted(paths):
        content = (HERE / path).read_bytes()
        assets.append({'path': path, 'sha256': hashlib.sha256(content).hexdigest(), 'bytes': len(content)})
    revision = hashlib.sha256(json.dumps(assets, sort_keys=True).encode()).hexdigest()[:20]
    data = json.loads((HERE / 'data/offline-pvg-t2.json').read_text())
    manifest = {'schema': 1, 'version': data['version'], 'revision': revision, 'assets': assets}
    (HERE / 'offline-assets.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Offline manifest: {len(assets)} assets, {sum(a["bytes"] for a in assets):,} bytes, {revision}')
    return manifest

if __name__ == '__main__':
    build()
