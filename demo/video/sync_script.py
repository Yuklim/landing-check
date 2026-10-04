#!/usr/bin/env python3
"""把 build_voice.py 的结果（durations.json、旁白、台词）同步进 ../视频脚本.md 的分镜表：
每镜的时长、旁白格、台词格里的英文和中文，以及各幕的时间范围。先跑 build_voice.py 再跑它。"""
import json, os, re, importlib.util
HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('bv', os.path.join(HERE, 'build_voice.py'))
bv = importlib.util.module_from_spec(spec); spec.loader.exec_module(bv)
shots = {x[0]: x for x in bv.load_md_overrides(bv.norm(bv.SHOTS))}
durs = dict(json.load(open(os.path.join(HERE, 'durations.json'))))
P = os.path.join(HERE, '..', '视频脚本.md')
s = open(P, encoding='utf-8').read()

def fmt(d): return ('%g' % d) + 's'
out = []
for l in s.split('\n'):
    m = re.match(r'^\| (\d-\d[ab]?|T) \| [\d.]+s \| (.*) \|$', l)
    if m and m.group(1) in shots:
        sid = m.group(1); cells = [c.strip() for c in l.strip().strip('|').split(' | ')]
        assert len(cells) == 5, (sid, len(cells))
        _, _, narr, dlg, _ = shots[sid]
        cells[1] = fmt(durs[sid])
        cells[4] = ('（前 4 秒只有 BGM）<br>' if sid == '0-1' else '') + (narr or '（留白）')
        # 台词格：按顺序替换 **"英文"**<br>中文
        pairs = re.findall(r'\*\*"[^"]*"\*\*<br>[^|<]*', cells[3])
        for i, pat in enumerate(pairs):
            if i < len(dlg):
                who, en, zh = dlg[i]
                cells[3] = cells[3].replace(pat, f'**"{en}"**<br>{zh}', 1)
        l = '| ' + ' | '.join(cells) + ' |'
    out.append(l)
s = '\n'.join(out)

order = [x[0] for x in bv.SHOTS]; t = 0; start = {}
for sid in order: start[sid] = t; t += durs[sid]
def mmss(x): return '%d:%02d' % (int(x // 60), int(round(x % 60)))
first = {'0': '0-1', '1': '1-1', '2': '2-1', '3': '3-1', '4': '4-1', '5': '5-1', '6': '6-1'}
last = {'0': 'T', '1': '1-6', '2': '2-7', '3': '3-5', '4': '4-4', '5': '5-2', '6': '6-2'}
for k in first:
    a = start[first[k]]; b = start[last[k]] + durs[last[k]]
    s = re.sub(r'(### 第 %s 幕 · [^·\n]+ ·(?: [^·\n]+ ·)? )\d+:\d\d–\d+:\d\d' % k, lambda m: m.group(1) + f'{mmss(a)}–{mmss(b)}', s)
s = re.sub(r"\*\*片长\*\* [\d:]+（", f"**片长** {mmss(t)}（", s)
open(P, 'w', encoding='utf-8').write(s)
print('script synced, total', mmss(t))
