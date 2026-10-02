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
READER_OK = ('trip.com', 'gov.cn', 'alipayplus.com', '12306.cn', 'alipay.com', 'weixin.qq.com', 'tencent.com')


def check(path):
    d = json.load(open(path, encoding='utf-8'))
    errs = []
    ids = set()
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
        try:
            datetime.date.fromisoformat(e.get('verified_at', ''))
        except Exception:
            errs.append('%s: verified_at 不是日期' % e.get('id'))
    for sid in d.get('detect', {}).get('sub_steps', []):
        if sid not in ids:
            errs.append('detect.sub_steps 引用了不存在的 id %s' % sid)
    for e in d.get('entries', []):
        for rid in e.get('related', []) or []:
            if rid not in ids:
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
    return '\n'.join(L)


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
    sys.exit(1 if bad else 0)
