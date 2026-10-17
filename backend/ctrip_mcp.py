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
import re
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


# 笔记正文里有 <poi ...>外滩</poi> 这种标签：只留文字；标题为空时取正文第一行
_POI = re.compile(r'<poi\b[^>]*>(.*?)</poi>', re.S)
_TAG = re.compile(r'<[^>]+>')


def clean_text(text):
    return _TAG.sub('', _POI.sub(r'\1', text or '')).replace('﻿', '').strip()


def query_guides(city='上海', scenarios='第一次去', size=6):
    """行前检查「出发前读一读」：第一次来这座城市的旅游笔记（city+scenarios 组合）。"""
    data = call_tool('query_content', {'city': city, 'scenarios': scenarios, 'size': size})
    if not isinstance(data, list):
        return {'items': [], 'note': data if isinstance(data, str) else ''}
    items = []
    for n in data:
        it = _norm_note(n)
        text = clean_text(n.get('content', ''))
        it['text'] = text[:600]
        it['title'] = clean_text(it['title']) or text.split('\n', 1)[0][:60]
        items.append(it)
    return {'items': items}


# ---------------- query_ticket：景点门票 ----------------
# 外国游客看英文：上海热门景点用官方 / 通行英文名，其余由上层翻译或保留中文
SPOT_EN = {
    '外滩': 'The Bund', '上海迪士尼度假区': 'Shanghai Disney Resort', '东方明珠': 'Oriental Pearl Tower',
    '豫园': 'Yu Garden', '上海海昌海洋公园': 'Haichang Ocean Park', '上海乐高乐园®度假区': 'LEGOLAND® Shanghai Resort',
    '上海野生动物园': 'Shanghai Wild Animal Park', '上海海洋水族馆': 'Shanghai Ocean Aquarium',
    '上海千古情景区': 'The Romance of Shanghai Park', '上海天文馆': 'Shanghai Astronomy Museum',
    '上海中心大厦': 'Shanghai Tower', '上海博物馆': 'Shanghai Museum', '朱家角古镇': 'Zhujiajiao Water Town',
    '田子坊': 'Tianzifang', '南京路步行街': 'Nanjing Road Pedestrian Street', '上海科技馆': 'Shanghai Science & Technology Museum',
    '上海环球金融中心': 'Shanghai World Financial Center', '武康路': 'Wukang Road', '新天地': 'Xintiandi',
}


def _norm_ticket(t):
    b = t.get('basicInfo') or {}
    a = t.get('additionalInfo') or {}
    u = t.get('urlInfo') or {}
    prices = [_num(r.get('price')) for r in t.get('resourceInfoList') or []]
    prices = [p for p in prices if p]
    open_time = (((t.get('ticketExtendInfo') or {}).get('openTimeInfo') or {}).get('unFormatOpenTime') or '')
    name = b.get('name', '')
    return {
        'id': t.get('productID') or b.get('productID'),
        'name': name,
        'name_en': SPOT_EN.get(name, ''),
        'cover': b.get('imageURL', ''),
        'score': b.get('score'),
        'comments': a.get('commentsCount') or 0,
        'price_from': min(prices) if prices else None,
        'rank': a.get('rankTag', ''),
        'recommend': a.get('pmRecommand', ''),
        'open_time': open_time,
        'free': ('全天开放' in open_time) and not prices,
        'url': u.get('h5Url') or u.get('pcUrl') or '',
    }


def query_ticket(city='上海', tag='必打卡', size=8):
    """景点门票榜单（cityName + tag），每个景点只取起价，归一化成卡片。"""
    data = call_tool('query_ticket', {'cityName': city, 'tag': tag, 'resourceSize': 3})
    if not isinstance(data, list):
        return {'items': [], 'note': data if isinstance(data, str) else ''}
    return {'items': [_norm_ticket(t) for t in data[:size]]}


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


# ---------------- query_hotel：酒店 ----------------
def _num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _norm_hotel(h):
    b = h.get('basicInfo') or {}
    a = h.get('additionalInfo') or {}
    u = h.get('urlInfo') or {}
    return {
        'id': h.get('productID') or b.get('productID'),
        'name': b.get('name', ''),
        'cover': b.get('imageURL', ''),
        'price': b.get('price'),
        'score': b.get('score'),
        'star': a.get('star'),
        'comments': a.get('commentsCount') or a.get('showCommentsCount') or 0,
        'address': b.get('address', ''),
        'cityName': b.get('cityName', ''),
        'zone': a.get('zoneName', ''),
        'district': a.get('locationName', ''),
        'tags': a.get('typeTags') or a.get('tags') or [],
        'recommend': (a.get('recommendText') or '').strip('“”"'),
        'url': u.get('h5Url') or u.get('pcUrl') or '',
    }


def query_hotel(city='', keyword='', hotel_name='', landmark='', tags='',
                stars='', check_in='', check_out='', sort_type='1', size=10):
    """酒店列表，归一化成卡片。参数组合按官方优先级，详见工具描述。

    常用：单 keyword / cityName(+tags/+stars/+hotelName/+landmarkName)。
    """
    args = {k: v for k, v in dict(
        keyword=keyword, cityName=city, hotelName=hotel_name,
        landmarkName=landmark, tags=tags, stars=stars,
        checkInDate=check_in, checkOutDate=check_out, sortType=sort_type,
    ).items() if v}
    if not args:
        args = {'cityName': '上海', 'sortType': '1'}
    data = call_tool('query_hotel', args)
    # keyword 查询返回结构不同（只给 H5/App 地址），这里只处理标准列表
    if not isinstance(data, list):
        return {'items': [], 'note': data if isinstance(data, str) else ''}
    return {'items': [_norm_hotel(h) for h in data[:size]]}


# ---------------- car_rental：租车 ----------------
def _norm_cars(groups, size):
    """返回按车型分组，拍平成一辆辆车的列表，UI 好渲染。"""
    out = []
    for g in groups or []:
        gname = g.get('vehicleGroupName', '')
        gcode = g.get('vehiclegroupCode', '')
        for v in (g.get('vechileInfos') or []):
            vendors = v.get('vendorInfos') or []
            out.append({
                'group': gname,
                'groupCode': gcode,
                'name': v.get('productName', ''),
                'image': v.get('productImg', ''),
                'brand': v.get('brandName', ''),
                'brandLogo': v.get('brandlogo', ''),
                'type': v.get('carriageDesc', ''),
                'trans': v.get('trans', ''),
                'seat': v.get('seat', ''),
                'doors': v.get('doorNo', ''),
                'fuel': v.get('fuel', ''),
                'displacement': v.get('displacement', ''),
                'price': _num(v.get('dailyPrice') or g.get('dailyPrice')),
                'url': vendors[0].get('h5ListUrl', '') if vendors else '',
            })
            if len(out) >= size:
                return out
    return out


def query_car_rental(pick_up_city, return_city='', vehicle_group_ids='',
                     pick_up_time='', return_time='', size=12):
    """租车：按取车城市查，归一化成车辆列表（品牌/座位/变速箱/日租价/下单链接）。"""
    args = {'pickUpCity': pick_up_city}
    if return_city:
        args['returnCity'] = return_city
    if vehicle_group_ids:
        args['vehiclegroupIds'] = vehicle_group_ids
    if pick_up_time:
        args['pickUpTime'] = pick_up_time
    if return_time:
        args['returnTime'] = return_time
    data = call_tool('car_rental', args)
    if not isinstance(data, list):
        return {'items': [], 'note': data if isinstance(data, str) else ''}
    return {'items': _norm_cars(data, size)}
