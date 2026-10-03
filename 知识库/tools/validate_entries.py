#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""校验 知识库/entries/*.json 并生成同名 .md 预览。

python3 validate_entries.py          # 全部
python3 validate_entries.py alipay   # 单个场景
"""
import os, sys, json, glob, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ENT = os.path.normpath(os.path.join(HERE, '..', 'entries'))
REQ = ['id', 'stage', 'title', 'why', 'steps', 'fallback', 'applies_to', 'scope', 'sources', 'verified_at', 'volatility']
STAGES = {'preflight', 'landing', 'anytime'}
VOL = {'high', 'low'}
H5 = os.path.normpath(os.path.join(HERE, '..', '..', 'h5'))
MEDIA_DIR = os.path.join(H5, 'img', 'tutorial')
TUTORIALS = os.path.join(H5, 'tutorials.json')
READER_OK = ('trip.com', 'gov.cn', 'alipayplus.com', '12306.cn', 'alipay.com', 'weixin.qq.com', 'tencent.com', 'antgroup.com',
             'unionpayintl.com', 'unionpay.com', 'didiglobal.com', 'support.apple.com', 'support.google.com')


def all_ids():
    out = set()
    for f in glob.glob(os.path.join(ENT, '*.json')):
        try:
            for e in json.load(open(f, encoding='utf-8')).get('entries', []):
                out.add(e.get('id'))
        except Exception:
            pass
    return out


def check(path):
    d = json.load(open(path, encoding='utf-8'))
    errs = []
    ids = set()
    global_ids = all_ids()
    for e in d.get('entries', []):
        for k in REQ:
            if k not in e:
                errs.append('%s: 缺字段 %s' % (e.get('id', '?'), k))
        if e.get('id') in ids:
            errs.append('重复 id %s' % e['id'])
        ids.add(e.get('id'))
        if e.get('stage') not in STAGES:
            errs.append('%s: stage 非法' % e.get('id'))
        if e.get('volatility') not in VOL:
            errs.append('%s: volatility 非法' % e.get('id'))
        if not (1 <= len(e.get('steps', [])) <= 4):
            errs.append('%s: steps 要 1 到 4 条' % e.get('id'))
        for s in e.get('sources', []):
            if not s.get('url'):
                errs.append('%s: source 缺 url' % e.get('id'))
        for r in e.get('reader_links', []) or []:
            if not any(h in r.get('url', '') for h in READER_OK):
                errs.append('%s: reader_links 只能放 Trip.com 或官方来源：%s' % (e.get('id'), r.get('url')))
        body = ' '.join([e.get('title', ''), e.get('why', ''), ' '.join(e.get('steps', [])), e.get('fallback', '')]).lower()
        bad = [w for w in ('vpn', 'wildchina', 'promo code') if w in body]
        if bad:
            errs.append('%s: 正文含禁用词 %s' % (e.get('id'), bad))
        for m in e.get('media', []) or []:
            eid = e.get('id')
            n = len(e.get('steps', []))
            if not isinstance(m.get('step'), int) or not (1 <= m['step'] <= n):
                errs.append('%s: media.step 要在 1 到 %d 之间' % (eid, n))
            for k in ('file', 'alt', 'source'):
                if not m.get(k):
                    errs.append('%s: media 缺 %s' % (eid, k))
            if not (m.get('source') or {}).get('url'):
                errs.append('%s: media.source 缺 url' % eid)
            if m.get('file', '').lower().endswith('.gif') and not m.get('poster'):
                errs.append('%s: GIF 配图要带 poster 静态首帧' % eid)
            if os.path.isdir(MEDIA_DIR):
                for k in ('file', 'poster'):
                    if m.get(k) and not os.path.isfile(os.path.join(MEDIA_DIR, m[k])):
                        errs.append('%s: media.%s 文件不存在 h5/img/tutorial/%s' % (eid, k, m[k]))
        steps_with_img = [m.get('step') for m in e.get('media', []) or []]
        if len(steps_with_img) != len(set(steps_with_img)):
            errs.append('%s: 同一步配了多张图' % e.get('id'))
        try:
            datetime.date.fromisoformat(e.get('verified_at', ''))
        except Exception:
            errs.append('%s: verified_at 不是日期' % e.get('id'))
    for sid in d.get('detect', {}).get('sub_steps', []):
        if sid not in ids:
            errs.append('detect.sub_steps 引用了不存在的 id %s' % sid)
    for e in d.get('entries', []):
        for rid in e.get('related', []) or []:
            if rid not in ids and rid not in global_ids:
                errs.append('%s: related 引用了不存在的 id %s' % (e['id'], rid))
    return d, errs


def render(d):
    L = ['# %s / %s · 知识库条目预览' % (d['name']['zh'], d['name']['en']), '',
         '识别关键词（中）：' + '、'.join(d['detect']['keywords_zh']), '',
         '识别关键词（英）：' + ', '.join(d['detect']['keywords_en']), '',
         '界面特征：' + d['detect']['visual_cues'], '']
    for e in d['entries']:
        L += ['---', '', '## %s' % e['title'], '',
              '`%s` · 阶段 %s · 适用 %s · 范围 %s · 易变 %s · 核验 %s' % (e['id'], e['stage'], '/'.join(e['applies_to']), e['scope'], e['volatility'], e['verified_at']), '',
              '**Why** ' + e['why'], '', '**Do this now**']
        L += ['%d. %s' % (i + 1, s) for i, s in enumerate(e['steps'])]
        L += ['', '**Still stuck** ' + e['fallback'], '']
        if e.get('facts'):
            L += ['**依赖的事实**', '']
            L += ['- [%s] %s — %s' % (f['status'], f['fact'], f.get('note', '')) for f in e['facts']]
            L.append('')
        L += ['**来源** ' + '；'.join('[%s](%s) %s' % (s['name'], s['url'], s.get('date', '')) for s in e['sources']), '']
        if e.get('reader_links'):
            L += ['**可推荐给用户** ' + '；'.join('[%s](%s)' % (r['name'], r['url']) for r in e['reader_links']), '']
        if e.get('related'):
            L += ['相关：' + ', '.join('`%s`' % r for r in e['related']), '']
        if e.get('media'):
            L += ['**配图**', '']
            L += ['- 第 %d 步 `%s`%s — %s（%s）' % (m['step'], m['file'], '（占位，演示用）' if m.get('placeholder') else '', m['alt'], m['source']['name']) for m in e['media']]
            L.append('')
    return '\n'.join(L)


TUT_FIELDS = ('id', 'stage', 'title', 'why', 'steps', 'fallback', 'applies_to', 'media', 'sources', 'verified_at')


def export_tutorials():
    """把带 media 的条目导出到 h5/tutorials.json，H5 在静态模式下也能展示图文教程。"""
    out = []
    for f in sorted(glob.glob(os.path.join(ENT, '*.json'))):
        d = json.load(open(f, encoding='utf-8'))
        for e in d.get('entries', []):
            if e.get('media'):
                t = {k: e[k] for k in TUT_FIELDS if k in e}
                t['scenario'] = d['scenario']
                out.append(t)
    if not os.path.isdir(H5):
        return 0
    json.dump({'generated': datetime.date.today().isoformat(), 'tutorials': out}, open(TUTORIALS, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return len(out)


if __name__ == '__main__':
    names = sys.argv[1:]
    files = [os.path.join(ENT, n + '.json') for n in names] if names else sorted(glob.glob(os.path.join(ENT, '*.json')))
    total = 0; bad = 0
    for f in files:
        d, errs = check(f)
        n = len(d.get('entries', [])); total += n
        if errs:
            bad += 1
            print('%s: %d 条，%d 个问题' % (os.path.basename(f), n, len(errs)))
            for e in errs: print('   -', e)
        else:
            print('%s: %d 条，通过' % (os.path.basename(f), n))
        open(f[:-5] + '.md', 'w', encoding='utf-8').write(render(d) + '\n')
    print('合计 %d 条，%d 个文件有问题' % (total, bad))
    if not bad:
        print('导出 %d 篇图文教程到 h5/tutorials.json' % export_tutorials())
    sys.exit(1 if bad else 0)
