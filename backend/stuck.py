# -*- coding: utf-8 -*-
"""“我卡住了”识别：截图 -> 场景/条目 id -> 条目。

流程：模型分类（deepseek-flash，看图）-> 置信度分档 -> 规则兜底 -> 条目来自知识库。
模型只返回 id，永远不写答案；unknown 时才允许生成一段建议并标 unverified。
"""
import os, io, json, base64, time, logging
from typing import Optional, List
import httpx

log = logging.getLogger('stuck')
HERE = os.path.dirname(os.path.abspath(__file__))
PROMPT = open(os.path.join(HERE, 'prompts', 'classify.txt'), encoding='utf-8').read()

CONF_HIGH = float(os.environ.get('STUCK_CONF_HIGH', '0.7'))
CONF_LOW = float(os.environ.get('STUCK_CONF_LOW', '0.4'))
MODEL = os.environ.get('DEEPSEEK_MODEL', 'deepseek-flash')
BASE = os.environ.get('DEEPSEEK_BASE_URL', 'https://api.deepseek.com').rstrip('/')
KEY = os.environ.get('DEEPSEEK_API_KEY', '')
TIMEOUT = float(os.environ.get('STUCK_TIMEOUT', '25'))


def _shrink(image_bytes: bytes, max_side: int = 1024) -> (bytes, str):
    """缩到长边 1024 以内，省 token。PIL 不在就原样返回。"""
    try:
        from PIL import Image
        im = Image.open(io.BytesIO(image_bytes))
        im = im.convert('RGB')
        w, h = im.size
        if max(w, h) > max_side:
            r = max_side / max(w, h)
            im = im.resize((int(w * r), int(h * r)))
        buf = io.BytesIO(); im.save(buf, 'JPEG', quality=85)
        return buf.getvalue(), 'image/jpeg'
    except Exception:
        return image_bytes, 'image/png'


def scenarios_block(kb) -> str:
    lines = []
    for s in kb.scenarios.values():
        d = s['detect']
        lines.append('- scenario "%s" (%s): %s' % (s['id'], s['name'].get('en', s['id']), d.get('visual_cues', '')))
        lines.append('  keywords: ' + ', '.join(d.get('keywords_zh', []) + d.get('keywords_en', [])))
        for eid in s['entry_ids']:
            e = kb.entries[eid]
            lines.append('  - entry_id "%s": %s — %s' % (eid, e['title'], e['why'][:120]))
    return '\n'.join(lines)


def call_model(messages: List[dict], json_mode: bool = True, model: str = None, max_tokens: int = 1200) -> str:
    if not KEY:
        raise RuntimeError('DEEPSEEK_API_KEY not set')
    body = {'model': model or MODEL, 'messages': messages, 'temperature': 0, 'max_tokens': max_tokens}
    if json_mode:
        body['response_format'] = {'type': 'json_object'}
    r = httpx.post(BASE + '/chat/completions', headers={'Authorization': 'Bearer ' + KEY}, json=body, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()['choices'][0]['message']['content']


def classify_with_model(kb, image_bytes: Optional[bytes], text: str) -> dict:
    content = []
    if image_bytes:
        data, mime = _shrink(image_bytes)
        content.append({'type': 'image_url', 'image_url': {'url': 'data:%s;base64,%s' % (mime, base64.b64encode(data).decode())}})
    ask = 'Classify this screenshot.' if image_bytes else 'There is no screenshot. Classify from the user description alone.'
    content.append({'type': 'text', 'text': (('User says: ' + text + '\n') if text else '') + ask})
    messages = [{'role': 'system', 'content': PROMPT.replace('{SCENARIOS}', scenarios_block(kb))},
                {'role': 'user', 'content': content}]
    raw = call_model(messages)
    return clean_model_output(kb, json.loads(raw))


def clean_model_output(kb, out: dict) -> dict:
    """只接受知识库里存在的 id；模型编的 id 一律丢弃。"""
    valid = set(kb.entries)
    cands = [c for c in out.get('candidates', []) if c.get('entry_id') in valid]
    for c in cands:
        c['confidence'] = float(c.get('confidence') or 0)
    if out.get('entry_id') not in valid:
        out['entry_id'] = cands[0]['entry_id'] if cands else None
        out['confidence'] = cands[0]['confidence'] if cands else 0.0
    out['scenario'] = kb.entries[out['entry_id']]['scenario'] if out['entry_id'] else 'unknown'
    out['candidates'] = cands[:3]
    out['confidence'] = float(out.get('confidence') or 0)
    out['ocr_text'] = (out.get('ocr_text') or '')[:300]
    return out


def classify_with_rules(kb, text: str) -> dict:
    hits = kb.match_keywords(text or '')
    if not hits:
        return {'scenario': 'unknown', 'entry_id': None, 'confidence': 0.0, 'ocr_text': text or '', 'candidates': []}
    best = hits[0]
    s = kb.scenarios[best['scenario']]
    # 子步骤：按条目标题/步骤与文本的词重合挑一个，挑不出就用场景第一条
    eid = s['entry_ids'][0]; bestscore = -1
    for cand in s['entry_ids']:
        e = kb.entries[cand]
        hay = (e['title'] + ' ' + e['why']).lower()
        score = sum(1 for w in (text or '').lower().split() if len(w) > 3 and w in hay)
        if score > bestscore:
            eid, bestscore = cand, score
    conf = min(0.69, 0.3 + 0.1 * best['score'])  # 规则永远不越过"高置信"线
    return {'scenario': best['scenario'], 'entry_id': eid, 'confidence': conf, 'ocr_text': text or '',
            'candidates': [{'entry_id': eid, 'confidence': conf}], 'hits': best['hits']}


def unknown_advice(text: str, lang: str = 'en') -> Optional[str]:
    """unknown 分支：允许模型生成一段建议，调用方必须标 unverified。"""
    try:
        msg = [{'role': 'system', 'content': 'You help foreign visitors in China who are stuck on a phone screen. Give at most 3 short imperative sentences in %s. If you are not sure, say so and suggest showing the screen to staff or contacting the app\'s English support.' % lang},
               {'role': 'user', 'content': 'Screen text / description: ' + (text or '(nothing readable)')}]
        return call_model(msg, json_mode=False, max_tokens=200).strip()
    except Exception as e:
        log.warning('advice failed: %s', e)
        return None


def classify(kb, image_bytes: Optional[bytes], text: str = '', lang: str = 'en', airport: str = '', advice: bool = True,
             model_fn=None) -> dict:
    """主入口。model_fn 可注入用于测试。"""
    t0 = time.time()
    mode = 'model'
    try:
        res = (model_fn or classify_with_model)(kb, image_bytes, text) if (image_bytes or text) else None
        if res is None:
            raise ValueError('no input')
    except Exception as e:
        log.warning('model classify failed, falling back to rules: %s', e)
        mode = 'rules'
        res = classify_with_rules(kb, text)
    if mode == 'model' and res['entry_id'] is None and (text or res.get('ocr_text')):
        rules = classify_with_rules(kb, (text + ' ' + (res.get('ocr_text') or '')).strip())
        if rules['entry_id']:
            res, mode = rules, 'rules'
    conf = res['confidence']
    out = {'scenario': res['scenario'], 'entry_id': res['entry_id'], 'confidence': round(conf, 2),
           'ocr_text': res.get('ocr_text', ''), 'mode': mode, 'lang': lang, 'airport': airport,
           'candidates': [], 'entry': None, 'advice': None, 'unverified': False,
           'latency_ms': int((time.time() - t0) * 1000)}
    cands = [c for c in res.get('candidates', []) if c.get('entry_id') in kb.entries]
    if res['entry_id'] and conf >= CONF_HIGH:
        out['decision'] = 'answer'
        out['entry'] = kb.get(res['entry_id'], lang)
    elif res['entry_id'] and conf >= CONF_LOW:
        out['decision'] = 'ask'
        seen = set()
        for c in [{'entry_id': res['entry_id'], 'confidence': conf}] + cands:
            if c['entry_id'] in seen: continue
            seen.add(c['entry_id'])
            e = kb.get(c['entry_id'], lang)
            out['candidates'].append({'entry_id': c['entry_id'], 'title': e['title'], 'confidence': round(float(c['confidence']), 2)})
        out['candidates'] = out['candidates'][:3]
    else:
        out['decision'] = 'unknown'
        out['scenario'], out['entry_id'] = 'unknown', None
        if advice and mode == 'model':
            out['advice'] = unknown_advice(res.get('ocr_text') or text, lang)
            out['unverified'] = out['advice'] is not None
    out['latency_ms'] = int((time.time() - t0) * 1000)
    return out
