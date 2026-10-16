#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从高德 Web 服务取 PVG T2 → 璞丽酒店的各种交通方案，写成 h5/routes.json（演示时不再调接口）。

用法：在 backend/.env 里配 AMAP_KEY（Web服务类型），然后
    python3 tools/amap_routes.py
坐标保持高德的 GCJ-02：H5 地图用高德 JS API 画，底图和路线同一坐标系。
"""
import os, json, time, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'h5', 'routes.json')
KEY = os.environ.get('AMAP_KEY')
DATE, TIME = '2026-10-12', '08-00'          # 航班 07:40 落地，按 08:00 出发查公交（夜宵线等不会混进来）

# 高德 POI（GCJ-02）：航站楼、出租车蓄车区、网约车上客区、酒店
P = {
    'airport': ('PVG T2', '浦东机场 2 号航站楼', '121.809373,31.151164'),
    'taxi_queue': ('Taxi queue · T2 P2', 'T2 P2 出租车蓄车区', '121.809900,31.146620'),
    'didi_pickup': ('Ride-hailing pickup · T2 P2', 'T2 P2 网约车上客区', '121.808313,31.148831'),
    'hotel': ('The PuLi Hotel and Spa', '璞丽酒店', '121.448392,31.222211'),
}


def call(path, params):
    time.sleep(0.5)                          # 免费额度每秒最多 3 次
    url = 'https://restapi.amap.com' + path + '?' + urllib.parse.urlencode({**params, 'key': KEY})
    r = json.load(urllib.request.urlopen(url, timeout=30))
    if str(r.get('status')) != '1':
        raise SystemExit('高德接口失败 %s: %s' % (path, r.get('info')))
    return r


def pt(s):
    lon, lat = map(float, s.split(','))
    return [round(lon, 6), round(lat, 6)]


def line(poly):
    """高德 polyline：'lon,lat;lon,lat'，可能是多段拼在一起；抽稀到 ~10 m 精度"""
    out = []
    for p in (poly or '').split(';'):
        if ',' in p:
            c = pt(p)
            if not out or abs(c[0] - out[-1][0]) + abs(c[1] - out[-1][1]) > 0.0001:
                out.append([round(c[0], 5), round(c[1], 5)])
    return out


def mins(sec):
    return max(1, round(float(sec or 0) / 60))


def point(k):
    en, cn, c = P[k]
    return {'name': en, 'cn': cn, 'c': pt(c)}


# ---- 驾车（出租车 / 网约车）----
def drive(frm):
    r = call('/v5/direction/driving', {'origin': P[frm][2], 'destination': P['hotel'][2], 'show_fields': 'cost,polyline'})
    p = r['route']['paths'][0]
    poly = line(';'.join(s['polyline'] for s in p['steps']))
    return {'distance_km': round(int(p['distance']) / 1000, 1), 'duration_min': mins(p['cost']['duration']),
            'taxi_cost': float(r['route'].get('taxi_cost') or 0), 'tolls': float(p['cost'].get('tolls') or 0), 'line': poly}


# ---- 公共交通 ----
# 外国用户看英文，路牌上是中文：页面上两个都给。线路 / 站名英文按上海地铁官方译名，公交站按道路名直译
EN = {
    '磁浮线': 'Maglev', '市域机场线': 'Airport Link', '机场四线': 'Airport Bus Line 4', '地铁2号线': 'Line 2', '地铁7号线': 'Line 7',
    '地铁9号线': 'Line 9', '地铁14号线': 'Line 14', '地铁18号线': 'Line 18',
    '浦东1号2号航站楼': 'Pudong Airport T1&T2', '浦东机场T2航站楼': 'Pudong Airport T2', '龙阳路': 'Longyang Road', '龙阳路地铁站': 'Longyang Rd Metro Stn',
    '静安寺': "Jing'an Temple", '世纪大道': 'Century Avenue', '美兰湖': 'Meilan Lake', '蟠祥路·国家会计学院': 'Panxiang Road', '曹路': 'Caolu',
    '肇嘉浜路': 'Zhaojiabang Road', '封浜': 'Fengbang', '昌邑路': 'Changyi Road', '上海松江站': 'Shanghai Songjiang Railway Stn',
    '虹桥2号航站楼': 'Hongqiao Airport T2', '上海火车站': 'Shanghai Railway Stn', '上海火车站(北广场': 'Shanghai Railway Stn (North Sq.)',
    '常德路': 'Changde Rd', '北京西路常德路': 'W. Beijing Rd & Changde Rd', '愚园路胶州路': 'Yuyuan Rd & Jiaozhou Rd', '成都北路': 'N. Chengdu Rd',
    '成都北路延安东路': 'N. Chengdu Rd & E. Yan\'an Rd', '延安东路外滩': "E. Yan'an Rd (The Bund)", '中山东二路金陵东路': 'E. Zhongshan No.2 Rd & E. Jinling Rd',
    '南浦大桥': 'Nanpu Bridge', '康文路': 'Kangwen Rd', '中春路': 'Zhongchun Rd', '申昆路枢纽站': 'Shenkun Rd Hub', '东长治路公平路枢纽站': 'E. Changzhi Rd Hub',
    '四川北路武进路': 'N. Sichuan Rd & Wujin Rd', '五角场(四平路)': 'Wujiaochang (Siping Rd)', '五角场(邯郸路)': 'Wujiaochang (Handan Rd)',
}


def en(cn):
    if not cn: return cn
    if cn in EN: return EN[cn]
    if cn.endswith('路') and cn[:-1].isdigit(): return 'Bus ' + cn[:-1]
    return cn


def seg_bus(b):
    name = b['name'].split('(')[0]
    # 高德的 type 字段不可靠（840 路会标成地铁），按线路名判断
    kind = ('maglev' if '磁浮' in name else 'metro' if '地铁' in name or '市域' in name
            else 'airport_bus' if name.startswith('机场') else 'bus')
    toward = b['name'].split('--')[-1].rstrip(')') if '--' in b['name'] else ''
    vias = [s['name'] for s in b.get('via_stops', [])]
    return {'mode': kind, 'name': en(name), 'cn': name, 'toward': en(toward), 'from_cn': b['departure_stop']['name'], 'to_cn': b['arrival_stop']['name'],
            'from': en(b['departure_stop']['name']), 'to': en(b['arrival_stop']['name']),
            'from_c': pt(b['departure_stop']['location']), 'to_c': pt(b['arrival_stop']['location']),
            'stops': int(b.get('via_num') or len(vias)) + 1, 'via': vias,
            'distance_m': int(float(b.get('distance') or 0)), 'duration_min': mins((b.get('cost') or {}).get('duration')),
            'line': line(b.get('polyline', {}).get('polyline') if isinstance(b.get('polyline'), dict) else b.get('polyline'))}


def plan(t):
    segs = []
    for s in t['segments']:
        w = s.get('walking')
        if w and int(float(w.get('distance') or 0)) > 0:
            poly = ';'.join(st.get('polyline', {}).get('polyline', '') if isinstance(st.get('polyline'), dict) else st.get('polyline', '') for st in w.get('steps', []))
            segs.append({'mode': 'walk', 'distance_m': int(float(w['distance'])), 'duration_min': mins((w.get('cost') or {}).get('duration')), 'line': line(poly)})
        if s.get('bus') and s['bus'].get('buslines'):
            b = seg_bus(s['bus']['buslines'][0])
            if s.get('entrance'): b['entrance'] = s['entrance'].get('name')
            if s.get('exit'): b['exit'] = s['exit'].get('name')
            segs.append(b)
        if s.get('railway'):
            segs.append({'mode': 'rail', 'name': s['railway'].get('name', ''), 'line': []})
    rides = [x for x in segs if x['mode'] not in ('walk', 'rail')]
    return {'duration_min': mins(t['cost']['duration']), 'fare': float(t['cost'].get('transit_fee') or 0),
            'walk_m': int(float(t.get('walking_distance') or 0)), 'transfers': max(0, len(rides) - 1),
            'modes': sorted({x['mode'] for x in rides}), 'segments': segs,
            'key': ' > '.join(x.get('cn', x['name']) for x in rides)}


def transit():
    plans, seen = [], set()
    # 0 推荐 1 最经济 2 少换乘 3 少步行 5 不乘地铁 7 地铁优先 8 时间短
    for strategy in (0, 8, 2, 3, 5, 7):
        r = call('/v5/direction/transit/integrated', {'origin': P['airport'][2], 'destination': P['hotel'][2], 'city1': '021', 'city2': '021',
                                                       'strategy': strategy, 'AlternativeRoute': 5, 'date': DATE, 'time': TIME,
                                                       'show_fields': 'cost,polyline'})
        for t in r['route'].get('transits', []):
            p = plan(t)
            if p['key'] and p['key'] not in seen:
                seen.add(p['key']); plans.append(p)
    return plans


def label(p):
    m = set(p['modes'])
    if m == {'metro'}: return 'Metro' if p['transfers'] == 0 else 'Metro · %d change%s' % (p['transfers'], '' if p['transfers'] == 1 else 's')
    if 'maglev' in m: return 'Maglev + ' + ('metro' if 'metro' in m else 'bus')
    if m <= {'bus', 'airport_bus'}: return 'Airport bus + city bus' if 'airport_bus' in m and 'bus' in m else 'Airport bus' if 'airport_bus' in m else 'City bus'
    return 'Metro + bus'


def main():
    if not KEY:
        raise SystemExit('缺少 AMAP_KEY（backend/.env）')
    taxi, didi = drive('taxi_queue'), drive('didi_pickup')
    plans = transit()
    for p in plans:
        p['label'] = label(p)
    # 同一类方式只留最快的两套，免得列表全是相似的公交组合
    plans.sort(key=lambda p: p['duration_min'])
    count = {}
    plans = [p for p in plans if count.__setitem__(p['label'], count.get(p['label'], 0) + 1) or count[p['label']] <= 2]
    # 分组标签：最快 / 最便宜 / 少步行 / 不坐地铁
    if plans:
        min(plans, key=lambda p: p['duration_min'])['tag'] = 'Fastest'
        min(plans, key=lambda p: (p['fare'], p['duration_min'])).setdefault('tag', 'Cheapest')
        min(plans, key=lambda p: (p['walk_m'], p['duration_min'])).setdefault('tag', 'Least walking')
    plans.sort(key=lambda p: p['duration_min'])
    # 地铁直达方案：地铁导航页沿用旧字段（path / stops）
    direct = next((p for p in plans if p['modes'] == ['metro'] and p['transfers'] == 0), None)
    metro = None
    if direct:
        m = next(s for s in direct['segments'] if s['mode'] == 'metro')
        metro = {'line': '2', 'colour': '#97D700', 'path': m['line'], 'stops': [{'name': m['from'], 'c': m['from_c']}, {'name': m['to'], 'c': m['to_c']}],
                 'duration_min': direct['duration_min'], 'fare': direct['fare'], 'walk_m': direct['walk_m'], 'segment': m}
    out = {'source': 'Map and routes: AMap (Gaode), queried for %s %s' % (DATE, TIME.replace('-', ':')), 'crs': 'GCJ-02',
           'airport': point('airport'), 'hotel': point('hotel'),
           'taxi': {**taxi, 'queue': point('taxi_queue')}, 'didi': {**didi, 'pickup': point('didi_pickup')},
           'metro': metro, 'plans': plans}
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('写入 %s · %d 套公共交通方案 · 出租车 %.1f km %d min 约 ¥%d' % (os.path.relpath(OUT), len(plans), taxi['distance_km'], taxi['duration_min'], taxi['taxi_cost']))
    for p in plans:
        print('  %-26s %3d min ¥%-5g 步行 %4d m  %s %s' % (p['label'], p['duration_min'], p['fare'], p['walk_m'], p['key'], p.get('tag', '')))


if __name__ == '__main__':
    main()
