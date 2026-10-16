# -*- coding: utf-8 -*-
"""携程营销 MCP 客户端（真实数据源）。

仅在后端调用。Token 从环境变量 CTRIP_MCP_TOKEN 读取，绝不写进代码或提交到 git。
  本地：  export CTRIP_MCP_TOKEN=xxxx  再启动 uvicorn
  Render：在服务的 Environment 里加 CTRIP_MCP_TOKEN

官方端点：POST https://u.ctrip.com/faas/mcp （JSON-RPC 2.0，SSE 返回）
鉴权：    Authorization: Bearer <token>
注意：有效 bearer 只是那段 32 位 hex；文档里带空格的三段串只能过 tools/list，
      真正调用工具时会返回“身份不合法”。

性能/稳定：内置 TTL 缓存（默认 10 分钟）+ 短超时；失败抛 CtripMCPError，
          由上层路由兜底，避免页面卡顿或翻车。
"""
import os
import json
import time
import itertools

import httpx

MCP_URL = os.environ.get('CTRIP_MCP_URL', 'https://u.ctrip.com/faas/mcp')
CACHE_TTL = int(os.environ.get('CTRIP_MCP_CACHE_TTL', '600'))
DEFAULT_TIMEOUT = float(os.environ.get('CTRIP_MCP_TIMEOUT', '10'))
_ID = itertools.count(1)
_CACHE = {}


class CtripMCPError(RuntimeError):
    pass


def _token():
    t = os.environ.get('CTRIP_MCP_TOKEN', '').strip()
    if not t:
        raise CtripMCPError('CTRIP_MCP_TOKEN 未设置')
    return t


def _parse_sse(text):
    """返回体是 SSE：取最后一个能解析成 JSON 的 data: 行。"""
    out = None
    for line in text.splitlines():
        line = line.strip()
        if line.startswith('data:'):
            try:
                out = json.loads(line[5:].strip())
            except json.JSONDecodeError:
                continue
    return out


def call_tool(name, arguments, timeout=None, use_cache=True):
    """调用任一工具，返回 result.content[0].text（能解析成 JSON 就解析，否则原样字符串）。

    命中缓存直接返回（demo 反复查同一条时秒出，也避免撞频次限制）。
    """
    key = name + '|' + json.dumps(arguments, sort_keys=True, ensure_ascii=False)
    if use_cache:
        hit = _CACHE.get(key)
        if hit and (time.time() - hit[0]) < CACHE_TTL:
            return hit[1]

    body = {'method': 'tools/call',
            'params': {'name': name, 'arguments': arguments, '_meta': {'progressToken': next(_ID)}},
            'jsonrpc': '2.0', 'id': next(_ID)}
    headers = {'Accept': 'application/json, text/event-stream',
               'Content-Type': 'application/json',
               'Authorization': 'Bearer ' + _token()}
    try:
        r = httpx.post(MCP_URL, headers=headers, json=body, timeout=timeout or DEFAULT_TIMEOUT)
    except httpx.TimeoutException:
        raise CtripMCPError('MCP 超时（>%ss）' % (timeout or DEFAULT_TIMEOUT))
    except httpx.HTTPError as e:
        raise CtripMCPError('MCP 请求失败: %s' % e)
    if r.status_code != 200:
        raise CtripMCPError('MCP HTTP %s' % r.status_code)
    msg = _parse_sse(r.text) or {}
    if msg.get('error'):
        raise CtripMCPError('MCP error: %s' % msg['error'])
    content = (msg.get('result') or {}).get('content') or []
    text = content[0].get('text', '') if content else ''
    try:
        result = json.loads(text)
    except (json.JSONDecodeError, TypeError):
        result = text  # 例如 "查询无结果" / "身份不合法"

    if use_cache:
        _CACHE[key] = (time.time(), result)
    return result


# ---------------- query_content：探索 / 社区笔记 ----------------
def _norm_note(n):
    return {
        'title': n.get('title', ''),
        'cover': n.get('imageURL', ''),
        'images': n.get('imageList') or [],
        'author': n.get('authorName', ''),
        'avatar': n.get('authorImage', ''),
        'likes': n.get('likeCount', 0),
        'comments': n.get('commentCount', 0),
        'reads': n.get('readCount', 0),
        'url': n.get('listUrl', ''),
        'publishTime': n.get('publishTime', ''),
    }


def query_content(query='', city='', keyword='', region='', scenarios='', size=10):
    """旅游笔记/文章（探索 feed），归一化成卡片列表。

    有效组合（优先级从高到低）：单 query / region+scenarios / region+keyword /
    city+keyword / city+scenarios。单给 city 不是有效组合，这里兜底成单 query。
    """
    if not any([query, keyword, region, scenarios]):
        query, city = (city or '热门旅行'), ''
    args = {k: v for k, v in dict(query=query, city=city, keyword=keyword,
                                  region=region, scenarios=scenarios).items() if v}
    args['size'] = size
    data = call_tool('query_content', args)
    if not isinstance(data, list):
        return {'items': [], 'note': data if isinstance(data, str) else ''}
    return {'items': [_norm_note(n) for n in data]}


# ---------------- query_train：城际火车票 ----------------
def _norm_train(t):
    seats = [{'name': s.get('SeatName', ''), 'price': s.get('Price'),
              'left': s.get('TicketLeft')} for s in (t.get('Seats') or [])]
    return {
        'trainNo': t.get('TrainNo', ''),
        'from': t.get('FromStationName', ''),
        'to': t.get('ToStationName', ''),
        'depart': t.get('StartTime', ''),
        'arrive': t.get('ArriveTime', ''),
        'durationMin': t.get('DurationMinutes'),
        'dayDiff': t.get('DayDiff', 0),
        'canBuy': t.get('CanWebBuy') == 'Y',
        'seats': seats,
    }


def query_train(from_city, to_city, depart_date, size=20):
    """城际火车票（StartTime/Price/TicketLeft 等），归一化成车次列表。"""
    data = call_tool('query_train', {'fromCity': from_city, 'toCity': to_city,
                                     'departDate': depart_date})
    trains = data.get('trains') if isinstance(data, dict) else None
    if not trains:
        return {'items': [], 'note': data if isinstance(data, str) else ''}
    return {'items': [_norm_train(t) for t in trains[:size]]}
