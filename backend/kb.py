# -*- coding: utf-8 -*-
"""知识库服务：加载 知识库/entries/*.json，提供查询、检索、反馈计数。

条目文件格式见 知识库/entries/schema.md。启动时做一遍校验，不合法直接抛错。
多语言：知识库/entries/i18n/<lang>/<scenario>.json 里同 id 的 title/why/steps/fallback 覆盖英文。
"""
import os, sys, glob, json, re, threading
from typing import Dict, List, Optional
sys.path.insert(0, os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '知识库', 'tools')))
try:
    from validate_entries import check as _validate
except Exception:            # 工具目录不存在时退回轻量校验
    _validate = None

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '知识库', 'entries'))
REQ = ['id', 'stage', 'title', 'why', 'steps', 'fallback', 'applies_to', 'scope', 'sources', 'verified_at', 'volatility']
TRANSLATABLE = ('title', 'why', 'steps', 'fallback')


class KnowledgeBase:
    def __init__(self, root: str = ROOT):
        self.root = root
        self.scenarios: Dict[str, dict] = {}
        self.entries: Dict[str, dict] = {}
        self.i18n: Dict[str, Dict[str, dict]] = {}   # lang -> id -> fields
        self.feedback: Dict[str, Dict[str, int]] = {}
        self._lock = threading.Lock()
        self.load()

    # ---------- 加载 ----------
    def load(self):
        scenarios, entries, i18n = {}, {}, {}
        for path in sorted(glob.glob(os.path.join(self.root, '*.json'))):
            if _validate:
                d, errs = _validate(path)
                if errs:
                    raise ValueError('%s: %s' % (os.path.basename(path), '; '.join(errs[:5])))
            else:
                d = json.load(open(path, encoding='utf-8'))
            sid = d['scenario']
            for e in d.get('entries', []):
                missing = [k for k in REQ if k not in e]
                if missing:
                    raise ValueError('%s: 条目 %s 缺字段 %s' % (path, e.get('id'), missing))
                if e['id'] in entries:
                    raise ValueError('重复条目 id %s' % e['id'])
                e = dict(e); e['scenario'] = sid
                entries[e['id']] = e
            scenarios[sid] = {'id': sid, 'name': d.get('name', {}), 'detect': d.get('detect', {}),
                              'entry_ids': [e['id'] for e in d.get('entries', [])]}
        for path in glob.glob(os.path.join(self.root, 'i18n', '*', '*.json')):
            lang = os.path.basename(os.path.dirname(path))
            d = json.load(open(path, encoding='utf-8'))
            for e in d.get('entries', []):
                i18n.setdefault(lang, {})[e['id']] = {k: e[k] for k in TRANSLATABLE if k in e}
        for s in scenarios.values():
            for eid in s['detect'].get('sub_steps', []):
                if eid not in entries:
                    raise ValueError('场景 %s 的 sub_steps 引用了不存在的 %s' % (s['id'], eid))
        with self._lock:
            self.scenarios, self.entries, self.i18n = scenarios, entries, i18n

    # ---------- 查询 ----------
    def list_scenarios(self) -> List[dict]:
        return [{'id': s['id'], 'name': s['name'], 'keywords_zh': s['detect'].get('keywords_zh', []),
                 'keywords_en': s['detect'].get('keywords_en', []), 'entry_ids': s['entry_ids']} for s in self.scenarios.values()]

    def localize(self, e: dict, lang: str) -> dict:
        out = dict(e)
        out['lang'] = 'en'; out['translated'] = (lang == 'en')
        tr = self.i18n.get(lang, {}).get(e['id'])
        if tr:
            out.update(tr); out['lang'] = lang; out['translated'] = True
        return out

    def get(self, entry_id: str, lang: str = 'en') -> Optional[dict]:
        e = self.entries.get(entry_id)
        return self.localize(e, lang) if e else None

    def query(self, scenario: Optional[str] = None, stage: Optional[str] = None, lang: str = 'en') -> List[dict]:
        out = []
        for e in self.entries.values():
            if scenario and e['scenario'] != scenario:
                continue
            if stage and e['stage'] not in (stage, 'anytime'):
                continue
            out.append(self.localize(e, lang))
        return out

    def search(self, q: str, lang: str = 'en', limit: int = 5) -> List[dict]:
        """无模型时的兜底：按词命中计数。"""
        terms = [t for t in re.split(r'[\s,，。;；]+', q.lower()) if t]
        if not terms:
            return []
        scored = []
        for e in self.entries.values():
            le = self.localize(e, lang)
            hay = ' '.join([le['title'], le['why'], ' '.join(le['steps']), le['fallback'], ' '.join(e.get('tags', []))]).lower()
            score = sum(hay.count(t) for t in terms)
            if score:
                scored.append((score, le))
        scored.sort(key=lambda x: -x[0])
        return [{'score': s, **le} for s, le in scored[:limit]]

    def match_keywords(self, text: str) -> List[dict]:
        """给识别兜底用：用场景 detect 关键词给文本打分，返回按分数排序的场景。"""
        t = text.lower()
        res = []
        for s in self.scenarios.values():
            kws = s['detect'].get('keywords_zh', []) + s['detect'].get('keywords_en', [])
            hits = [k for k in kws if k.lower() in t]
            if hits:
                res.append({'scenario': s['id'], 'score': len(hits), 'hits': hits})
        res.sort(key=lambda x: -x['score'])
        return res

    # ---------- 反馈 ----------
    def add_feedback(self, entry_id: str, solved: bool, note: str = ''):
        if entry_id not in self.entries:
            raise KeyError(entry_id)
        with self._lock:
            f = self.feedback.setdefault(entry_id, {'solved': 0, 'unsolved': 0})
            f['solved' if solved else 'unsolved'] += 1

    def stats(self) -> dict:
        out = {}
        for eid, f in self.feedback.items():
            n = f['solved'] + f['unsolved']
            out[eid] = {**f, 'solve_rate': round(f['solved'] / n, 2) if n else None}
        return out
