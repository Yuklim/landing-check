#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""用真实截图评测识别：读 知识库/samples/*/manifest.json，逐张调 stuck.classify，输出命中率和错例。

    python3 tools/eval_samples.py                 # 全部样本目录
    python3 tools/eval_samples.py from_guides     # 指定目录
    python3 tools/eval_samples.py --scenario-only # 只看场景是否对（条目未写全时用）
需要 DEEPSEEK_API_KEY（run.sh 的加载方式同样适用：先 source）。
"""
import os, sys, json, glob, time, collections
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import stuck
from kb import KnowledgeBase

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '知识库', 'samples'))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    scen_only = '--scenario-only' in sys.argv
    kb = KnowledgeBase()
    known = set(kb.scenarios)
    dirs = [os.path.join(ROOT, a) for a in args] or sorted(glob.glob(os.path.join(ROOT, '*')))
    rows = []
    for d in dirs:
        mp = os.path.join(d, 'manifest.json')
        if not os.path.exists(mp):
            continue
        for m in json.load(open(mp, encoding='utf-8')):
            path = os.path.join(d, m['file'])
            if not os.path.exists(path):
                continue
            exp_s, exp_e = m['scenario'], m.get('expected_entry')
            # 知识库还没有这个场景时，期望结果是 unknown 或 ask，而不是乱答
            exp_s_eff = exp_s if exp_s in known else 'unknown'
            t0 = time.time()
            r = stuck.classify(kb, open(path, 'rb').read(), '', advice=False)
            got_s = r['scenario'] if r['decision'] != 'unknown' else 'unknown'
            s_ok = got_s == exp_s_eff
            e_ok = (r['entry_id'] == exp_e) if (exp_e and exp_s in known) else s_ok
            rows.append({'file': m['file'], 'kind': m.get('kind'), 'exp_s': exp_s_eff, 'got_s': got_s, 'exp_e': exp_e if exp_s in known else None,
                         'got_e': r['entry_id'], 'decision': r['decision'], 'conf': r['confidence'], 'mode': r['mode'], 'ms': int((time.time() - t0) * 1000),
                         's_ok': s_ok, 'e_ok': e_ok, 'ocr': (r.get('ocr_text') or '')[:60]})
            print('%s %-44s exp=%-10s got=%-10s %-7s conf=%.2f %-32s %5dms' % ('✓' if (s_ok if scen_only else e_ok) else '✗', m['file'][:44], exp_s_eff, got_s, r['decision'], r['confidence'], r['entry_id'], rows[-1]['ms']))
    n = len(rows)
    if not n:
        print('no samples'); return
    print('\n场景命中 %d/%d = %.0f%%' % (sum(r['s_ok'] for r in rows), n, 100 * sum(r['s_ok'] for r in rows) / n))
    ev = [r for r in rows if r['exp_e']]
    if ev:
        print('条目命中 %d/%d = %.0f%%（仅已有条目的场景）' % (sum(r['e_ok'] for r in ev), len(ev), 100 * sum(r['e_ok'] for r in ev) / len(ev)))
    dec = collections.Counter(r['decision'] for r in rows)
    print('判定分布', dict(dec), '· 平均耗时 %d ms' % (sum(r['ms'] for r in rows) / n))
    bad = [r for r in rows if not (r['s_ok'] if scen_only else r['e_ok'])]
    if bad:
        print('\n错例：')
        for r in bad:
            print('  %s | 期望 %s/%s | 得到 %s/%s (%s %.2f) | %s' % (r['file'], r['exp_s'], r['exp_e'], r['got_s'], r['got_e'], r['decision'], r['conf'], r['ocr']))
    out = os.path.join(ROOT, 'eval_report.json')
    json.dump({'when': time.strftime('%Y-%m-%d %H:%M'), 'n': n, 'rows': rows}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('报告', out)


if __name__ == '__main__':
    main()
