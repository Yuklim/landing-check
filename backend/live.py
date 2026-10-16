# -*- coding: utf-8 -*-
"""真实数据层：用携程营销 MCP 把演示行程里的航班、酒店、门票、租车、下一程火车换成真实数据。

取数顺序（实时 + 缓存 + 快照兜底）：
  1. 内存缓存，TTL 内直接用（source=live）；
  2. 过期或没有：先返回旧值或快照，同时后台刷新，接口不等 MCP；wait=True 时同步刷新；
  3. 快照 mock/live_snapshot.json：上一次真实调用的归一化结果，离线和 Render 休眠唤醒时兜底（source=snapshot）；
  4. 都没有：调用方继续用 mock/*.json 里的模拟数据。

q_* 把行程变成工具参数，n_* 把原始响应归一化成前端要的小字典，都是纯函数，便于测试。
LC_LIVE=off 关闭整个真实数据层（测试默认关闭）。
"""
import os, re, json, math, copy, threading
from datetime import date, datetime, timedelta
from urllib.parse import unquote

import tripmcp

HERE = os.path.dirname(os.path.abspath(__file__))
SNAPSHOT = os.path.join(HERE, 'mock', 'live_snapshot.json')
KEYS = ('flight', 'hotel', 'tickets', 'car', 'train')

AIRPORT_LL = {'PVG': (31.1443, 121.8083), 'SHA': (31.1979, 121.3363), 'PEK': (40.0799, 116.6031), 'PKX': (39.5098, 116.4105), 'CAN': (23.3924, 113.2988)}
AIRPORT_ZH = {'PVG': '浦东', 'SHA': '虹桥', 'PEK': '首都', 'PKX': '大兴', 'CAN': '白云'}
CITY_EN = {'上海': 'Shanghai', '北京': 'Beijing', '广州': 'Guangzhou', '深圳': 'Shenzhen', '杭州': 'Hangzhou', '成都': 'Chengdu', '西安': "Xi'an"}
AREA_CODE = {'上海': '021', '北京': '010', '广州': '020', '深圳': '0755', '杭州': '0571', '成都': '028', '西安': '029'}
STATION_EN = {'上海虹桥': 'Shanghai Hongqiao', '上海': 'Shanghai', '上海南': 'Shanghai South', '上海西': 'Shanghai West', '上海松江': 'Shanghai Songjiang',
              '北京南': 'Beijing South', '北京': 'Beijing', '北京西': 'Beijing West', '北京丰台': 'Beijing Fengtai', '北京朝阳': 'Beijing Chaoyang'}
PICKUP_EN = {'虹桥国际机场': 'Hongqiao Airport (SHA)', '浦东国际机场': 'Pudong Airport (PVG)'}
# car_rental 境内车型组 id（见工具定义）
CAR_GROUP_EN = {'2': 'Economy', '3': 'Comfort', '4': 'Business van', '5': 'Luxury', '6': 'SUV', '7': 'Minibus', '9': 'Sports car', '10': 'Pickup', '11': 'Campervan'}
WEEKDAY_ZH = '一二三四五六日'
WEEKDAY_EN = ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')


def enabled() -> bool:
    return os.environ.get('LC_LIVE', 'on').strip().lower() not in ('0', 'off', 'false', 'no')


def _now() -> str:
    return datetime.now().strftime('%Y-%m-%d %H:%M')


def _km(a, b) -> float:
    (la1, lo1), (la2, lo2) = a, b
    p1, p2, dp, dl = map(math.radians, (la1, la2, la2 - la1, lo2 - lo1))
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


def _phone(tel: str, city: str) -> str:
    """'32039999' + 上海 -> '021 3203 9999'；已带区号或国际码的原样返回。"""
    t = re.sub(r'\s', '', tel or '')
    if re.fullmatch(r'\d{8}', t):
        return ('%s %s %s' % (AREA_CODE[city], t[:4], t[4:])) if city in AREA_CODE else '%s %s' % (t[:4], t[4:])
    return tel or ''


# ---------------- 航班 query_flight ----------------
def q_flight(trip):
    f = trip['flight']
    num = f['number'].replace(' ', '')
    return 'query_flight', {'departCityCode': f['from'].get('city_code') or f['from']['code'],
                            'arriveCityCode': f['to'].get('city_code') or f['to']['code'],
                            'departDate': f['scheduled_departure'][:10], 'airLine': num[:2],
                            'allFlights': True, 'locale': 'en-US'}


def n_flight(trip, raw):
    num = trip['flight']['number'].replace(' ', '')
    for r in (raw or {}).get('routeList') or []:
        fl = r.get('flights') or []
        if len(fl) == 1 and fl[0].get('flightNo') == num:
            x, pl = fl[0], (r.get('pl') or [{}])[0]
            return {'number': trip['flight']['number'], 'departure': x['dtime'][:16], 'arrival': x['atime'][:16],
                    'from_airport': (x.get('dport') or {}).get('code'), 'from_terminal': (x.get('dport') or {}).get('terminal'),
                    'to_airport': (x.get('aport') or {}).get('code'), 'to_terminal': (x.get('aport') or {}).get('terminal'),
                    'duration_min': x.get('duration'), 'price': {'amount': pl.get('price'), 'currency': pl.get('currency')},
                    'link': r.get('h5MiddlePageUrl') or raw.get('h5ListUrl')}
    raise tripmcp.McpError('flight %s not in results' % num)


# ---------------- 酒店 query_hotel ----------------
def _hotel_core(h):
    city, name = h.get('city_zh') or '', h['name_zh']
    return name[len(city):] if city and name.startswith(city) and len(name) > len(city) else name


def q_hotel(trip):
    h = trip['hotel']
    out = (h.get('checkout') or str(date.fromisoformat(h['checkin']) + timedelta(days=1)))
    return 'query_hotel', {'cityName': h.get('city_zh', ''), 'hotelName': _hotel_core(h), 'checkInDate': h['checkin'], 'checkOutDate': out}


def n_hotel(trip, raw):
    items = raw if isinstance(raw, list) else []
    if not items:
        raise tripmcp.McpError('hotel not found')
    core = _hotel_core(trip['hotel']).replace('酒店', '')
    it = next((x for x in items if core in (x.get('basicInfo') or {}).get('name', '')), items[0])
    b, a = it.get('basicInfo') or {}, it.get('additionalInfo') or {}
    c = a.get('coordinate') or {}
    district, addr = a.get('locationName') or '', b.get('address') or ''
    zone = a.get('zoneName') or ''
    rate = next((r['HotelRate'].get('Price') for r in it.get('dailyHotelRates') or [] if (r.get('HotelRate') or {}).get('HotelBookable')), None)
    ap = AIRPORT_LL.get(trip['flight']['to']['code'])
    return {'name_zh': b.get('name'), 'address_zh': addr if addr.startswith(district) else district + addr,
            'zone_zh': zone, 'landmark_zh': ('靠近' + zone.replace('/', '、')) if zone else '',
            'phone': _phone(a.get('contactTel'), b.get('cityName')), 'lat': c.get('lat'), 'lng': c.get('lng'),
            'distance_km': round(_km(ap, (c['lat'], c['lng']))) if ap and c.get('lat') else None,
            'star': a.get('star'), 'score': b.get('score'), 'reviews': a.get('commentsCount'),
            'price_cny': round(rate) if rate else None, 'image': b.get('imageURL'),
            'link': (it.get('urlInfo') or {}).get('h5Url')}


# ---------------- 门票 query_ticket ----------------
def q_ticket(t):
    return 'query_ticket', {'scenicSpotName': t['name_zh'], 'cityName': t.get('city_zh', '')}


_SEASON = re.compile(r'每年(\d+)月(\d+)日-(次年)?(\d+)月(\d+)日\s*(\S*?)\s*(\d{1,2}:\d{2})-(\d{1,2}:\d{2})开放(?:（(\d{1,2}:\d{2})停止入园）)?')
_CLOSED = re.compile(r'全年\s*(周[^;；]*?)\s*不开放')


def _weekdays(spec: str) -> set:
    """'周二–周日' -> {1..6}；'周一' -> {0}；'周一、周三' -> {0, 2}。"""
    days = [WEEKDAY_ZH.index(c) for c in re.findall(r'周([一二三四五六日天])', spec.replace('天', '日'))]
    if len(days) == 2 and re.search(r'周.\s*[–\-—~至到]\s*周', spec):
        a, b = days
        return set(range(a, b + 1)) if a <= b else set(range(a, 7)) | set(range(0, b + 1))
    return set(days)


def parse_hours(text: str, visit: str, latest_entry: str = None) -> dict:
    """解析携程景点 unFormatOpenTime（季节段 + 全年闭馆日），给出访问当天的开放时间。节假日特殊时间不解析，只提示。"""
    out = {'open': None, 'close': None, 'last_entry': latest_entry, 'closed_weekdays': [], 'closed_on_visit': False, 'parsed': False}
    try:
        d = date.fromisoformat(visit)
    except (TypeError, ValueError):
        d = None
    closed = set()
    for m in _CLOSED.finditer(text or ''):
        closed |= _weekdays(m.group(1))
    for m in _SEASON.finditer(text or ''):
        m1, d1, nxt, m2, d2, days, t0, t1, last = m.groups()
        start, end = (int(m1), int(d1)), (int(m2), int(d2))
        open_days = _weekdays(days) if days else set(range(7))
        if open_days:
            closed |= set(range(7)) - open_days
        if d is None:
            continue
        md = (d.month, d.day)
        inside = (start <= md <= end) if not nxt else (md >= start or md <= end)
        if inside:
            out.update(open=t0, close=t1, last_entry=last or latest_entry, parsed=True)
    out['closed_weekdays'] = [WEEKDAY_EN[i] for i in sorted(closed)]
    if d is not None and d.weekday() in closed:
        out['closed_on_visit'] = True
    if '特殊营业时间' in (text or ''):
        out['note'] = 'Public holidays may have different hours'
    return out


def _needs(desc: str) -> str:
    m = re.search(r'凭「(.+?)」', desc or '')
    return m.group(1) if m else ''


def classify_product(r: dict) -> dict:
    """一个门票产品外国游客能不能用：入园凭证只写「身份证」的，护照进不去。"""
    name, need = r.get('name') or '', _needs(r.get('descDetail'))
    opts = [x.strip() for x in re.split('或', need) if x.strip()]
    id_only = bool(opts) and all(x.startswith('身份证') for x in opts) and '非中国大陆籍' not in name
    return {'name_zh': name, 'price': r.get('price'), 'entry_with_zh': need, 'id_card_only': id_only,
            'for_foreigners': '非中国大陆籍' in name, 'english': '英文' in name,
            'bookable_from': r.get('firstBookingDate'), 'link': (r.get('urlInfoDto') or {}).get('h5Url')}


def n_ticket(t, raw):
    items = raw if isinstance(raw, list) else []
    if not items:
        raise tripmcp.McpError('scenic spot not found')
    spot = next((x for x in items if (x.get('basicInfo') or {}).get('name') == t['name_zh']), items[0])
    b, ext = spot.get('basicInfo') or {}, spot.get('ticketExtendInfo') or {}
    ot = ext.get('openTimeInfo') or {}
    prods = [classify_product(r) for r in spot.get('resourceInfoList') or []]
    ok = [p for p in prods if not p['id_card_only']]
    eng = [p for p in ok if p['english']]
    return {'name_zh': b.get('name'), 'address_zh': b.get('address'), 'level': ext.get('sightLevel'), 'score': b.get('score'),
            'hours_text_zh': ot.get('unFormatOpenTime') or '', 'latest_entry': ot.get('latestEntryTime'),
            'products': len(prods), 'passport_ok': len(ok), 'id_card_only': len(prods) - len(ok),
            'from_price': min((p['price'] for p in ok if p['price']), default=None),
            'english_guided_from': min((p['price'] for p in eng if p['price']), default=None),
            'product_list': prods[:10], 'link': (spot.get('urlInfo') or {}).get('h5Url')}


# ---------------- 租车 car_rental ----------------
def _car_window(trip):
    arr = datetime.strptime(trip['flight']['scheduled_arrival'][:16], '%Y-%m-%d %H:%M')
    pick = (arr + timedelta(hours=1, minutes=59)).replace(minute=0)      # 落地后至少一小时，取整点
    return pick, (pick + timedelta(days=3)).replace(hour=10, minute=0)  # 与租车页设计稿一致：三天，10 点还车


def q_car(trip):
    pick, ret = _car_window(trip)
    return 'car_rental', {'pickUpCity': trip['flight']['to'].get('city_zh') or trip['hotel'].get('city_zh', ''),
                          'pickUpTime': pick.strftime('%Y-%m-%d %H:%M:%S'), 'returnTime': ret.strftime('%Y-%m-%d %H:%M:%S')}


def n_car(trip, raw):
    groups = []
    for g in raw if isinstance(raw, list) else []:
        vs = [v for v in g.get('vechileInfos') or [] if v.get('dailyPrice') is not None]
        if not vs:
            continue
        vs.sort(key=lambda v: float(v['dailyPrice']))
        seats = sorted({int(v['seat']) for v in vs if str(v.get('seat', '')).isdigit()})
        code = str(g.get('vehiclegroupCode'))
        prices = [float(v['dailyPrice']) for v in vs]
        typical = round(prices[len(prices) // 2])             # 中位数：营销价（如 ¥1/天）只当个例，不当"起价"展示
        groups.append({'code': code, 'name_en': CAR_GROUP_EN.get(code, g.get('vehicleGroupName')), 'name_zh': g.get('vehicleGroupName'),
                       'from_price': round(prices[0]), 'typical_price': typical, 'promo': prices[0] < typical * 0.3, 'count': len(vs),
                       'seats': ('%d' % seats[0] if len(seats) == 1 else '%d–%d' % (seats[0], seats[-1])) if seats else None,
                       'example_zh': vs[0].get('productName'), 'link': ((vs[0].get('vendorInfos') or [{}])[0]).get('h5ListUrl')})
    if not groups:
        raise tripmcp.McpError('no cars')
    groups.sort(key=lambda g: g['typical_price'])
    link = groups[0]['link'] or ''
    m = re.search(r'plname=([^&]+)', link)
    pickup = unquote(m.group(1)) if m else ''
    ap = trip['flight']['to']['code']
    pick, ret = _car_window(trip)
    city = trip['flight']['to'].get('city_zh') or ''
    return {'city_zh': city, 'city_en': CITY_EN.get(city, city), 'pickup_time': pick.strftime('%Y-%m-%d %H:%M'), 'return_time': ret.strftime('%Y-%m-%d %H:%M'),
            'days': (ret.date() - pick.date()).days, 'pickup_zh': pickup, 'pickup_en': PICKUP_EN.get(pickup, pickup),
            'pickup_matches_airport': bool(pickup) and AIRPORT_ZH.get(ap, '?') in pickup,
            'from_price': groups[0]['from_price'], 'typical_price': next((g['typical_price'] for g in groups if g['code'] == '2'), groups[0]['typical_price']),
            'total': sum(g['count'] for g in groups), 'groups': groups, 'link': link}


# ---------------- 下一程火车 query_train ----------------
def next_leg(trip):
    """门票所在城市和酒店城市不同、也没订城际交通：缺一段路。返回出发城市、到达城市和日期。"""
    h = trip.get('hotel') or {}
    if trip.get('intercity_booked') or not h.get('city_zh'):
        return None
    for t in trip.get('tickets') or []:
        if t.get('city_zh') and t['city_zh'] != h['city_zh']:
            day = h.get('checkout') or str(date.fromisoformat(t['date']) - timedelta(days=1))
            return {'from_zh': h['city_zh'], 'to_zh': t['city_zh'], 'from_en': CITY_EN.get(h['city_zh'], h['city_zh']),
                    'to_en': t.get('city') or CITY_EN.get(t['city_zh'], t['city_zh']), 'date': day, 'for': t['name'], 'for_date': t['date']}
    return None


def q_train(trip):
    leg = next_leg(trip)
    return 'query_train', {'fromCity': leg['from_zh'], 'toCity': leg['to_zh'], 'departDate': leg['date'], 'trainTypeMode': 'OnlyHighSpeed'}


def _seat(x, name):
    s = next((s for s in x.get('Seats') or [] if s.get('SeatName') == name), None)
    return round(float(s['Price'])) if s and s.get('Price') is not None else None


def n_train(trip, raw, now: datetime = None):
    trains = (raw or {}).get('trains') if isinstance(raw, dict) else None
    if not trains:
        raise tripmcp.McpError('no trains')
    rows = []
    for x in trains:
        rows.append({'no': x.get('TrainNo'), 'dep': x.get('StartTime'), 'arr': x.get('ArriveTime'), 'day_diff': x.get('DayDiff') or 0,
                     'from_zh': x.get('FromStationName'), 'to_zh': x.get('ToStationName'),
                     'from_en': STATION_EN.get(x.get('FromStationName'), x.get('FromStationName')),
                     'to_en': STATION_EN.get(x.get('ToStationName'), x.get('ToStationName')),
                     'duration_min': x.get('DurationMinutes'), 'second_class': _seat(x, '二等座'), 'first_class': _seat(x, '一等座'),
                     'left': next((s.get('TicketLeft') for s in x.get('Seats') or [] if s.get('SeatName') == '二等座'), None),
                     'control_day': x.get('ControlDay'), 'sale_time': x.get('SaleTime')})
    # 退房后出发：09:00–15:00 之间，最快的三班；起价也只在这个时段里算（全天最低价往往是 12 小时的夜车）
    day = [r for r in rows if '09:00' <= (r['dep'] or '') <= '15:00' and not r['day_diff']]
    pick = sorted(day, key=lambda r: (r['duration_min'] or 9999, r['dep']))[:3]
    leg = next_leg(trip) or {}
    on_sale = None
    if pick and pick[0]['control_day'] and leg.get('date') and pick[0]['sale_time']:
        opens = datetime.combine(date.fromisoformat(leg['date']) - timedelta(days=int(pick[0]['control_day'])),
                                 datetime.strptime(pick[0]['sale_time'], '%H:%M').time())
        if opens > (now or datetime.now()):
            on_sale = opens.strftime('%Y-%m-%d %H:%M')
    prices = [r['second_class'] for r in (day or rows) if r['second_class']]
    return {'date': leg.get('date'), 'count': len(rows), 'from_price': min(prices) if prices else None,
            'fastest_min': min((r['duration_min'] for r in rows if r['duration_min']), default=None),
            'trains': pick, 'on_sale_from': on_sale, 'link': raw.get('h5ListUrl')}


# ---------------- 存储：缓存 + 后台刷新 + 快照 ----------------
SIMPLE = {'flight': (q_flight, n_flight), 'hotel': (q_hotel, n_hotel), 'car': (q_car, n_car), 'train': (q_train, n_train)}


class LiveStore:
    def __init__(self, snapshot_path: str = SNAPSHOT, ttl: int = None, caller=None):
        self.path, self.call = snapshot_path, caller or tripmcp.call
        self.ttl = ttl if ttl is not None else int(os.environ.get('LC_LIVE_TTL', '1800'))
        self.cache, self.errors, self._busy, self._key_locks = {}, {}, set(), {}
        self._lock = threading.Lock()
        self.snapshot = self._load()

    def _load(self):
        try:
            return json.load(open(self.path, encoding='utf-8'))
        except (OSError, ValueError):
            return {}

    def query(self, key, trip):
        if key == 'tickets':
            return [q_ticket(t)[1] for t in trip.get('tickets') or [] if t.get('name_zh')]
        if key == 'train' and not next_leg(trip):
            return None
        return SIMPLE[key][0](trip)[1]

    def fetch(self, key, trip) -> dict:
        """同步调一次 MCP 并归一化；失败抛 McpError。"""
        if key == 'tickets':
            data = []
            for t in trip.get('tickets') or []:
                if t.get('name_zh'):
                    tool, args = q_ticket(t)
                    data.append(n_ticket(t, self.call(tool, args)))
        elif key == 'train' and not next_leg(trip):
            data = None
        else:
            q, n = SIMPLE[key]
            tool, args = q(trip)
            data = n(trip, self.call(tool, args))
        return {'key': key, 'source': 'live', 'fetched_at': _now(), 'query': self.query(key, trip), 'data': data, '_ts': datetime.now().timestamp()}

    def refresh(self, key, trip):
        with self._lock:
            lk = self._key_locks.setdefault(key, threading.Lock())
        if not lk.acquire(blocking=False):            # 同一块已有请求在路上（预热或别的请求触发）：等它结束，共用结果，不重复调 MCP
            with lk:
                return self.cache.get(key)
        try:
            e = self.fetch(key, trip)
            with self._lock:
                self.cache[key] = e
                self.errors.pop(key, None)
            return e
        except Exception as ex:                       # 网络、鉴权、无结果、解析失败都不影响页面
            with self._lock:
                self.errors[key] = {'at': _now(), 'error': str(ex)[:200]}
            return None
        finally:
            lk.release()

    def _spawn(self, key, trip):
        with self._lock:
            if key in self._busy:
                return
            self._busy.add(key)

        def run():
            try:
                self.refresh(key, trip)
            finally:
                with self._lock:
                    self._busy.discard(key)
        threading.Thread(target=run, daemon=True).start()

    def get(self, key, trip, wait=False):
        """返回 {source, fetched_at, query, data} 或 None。wait=False 时从不阻塞。"""
        c = self.cache.get(key)
        fresh = c and datetime.now().timestamp() - c['_ts'] < self.ttl and c.get('query') == self.query(key, trip)
        if fresh:
            return c
        if wait:
            return self.refresh(key, trip) or c or self._snap(key)
        if tripmcp.token():
            self._spawn(key, trip)
        return c or self._snap(key)

    def _snap(self, key):
        s = self.snapshot.get(key)
        return {**s, 'key': key, 'source': 'snapshot'} if s else None

    def warm(self, trip_fn):
        """启动时后台预热。按 enrich 的顺序同步取：先航班再租车，租车的取车时间依赖真实落地时间。"""
        if not (enabled() and tripmcp.token()):
            return
        threading.Thread(target=lambda: enrich(trip_fn(), self, wait=True), daemon=True).start()

    def status(self):
        out = {}
        for k in KEYS:
            c, s, e = self.cache.get(k), self.snapshot.get(k), self.errors.get(k)
            out[k] = {'source': 'live' if c else ('snapshot' if s else 'mock'),
                      'fetched_at': (c or s or {}).get('fetched_at'), 'error': e}
        return out

    def save_snapshot(self, path: str = None):
        """把当前缓存里的真实数据写成快照（只有 tools/refresh_live_snapshot.py 调用，运行时不写盘）。"""
        snap = dict(self.snapshot)
        for k, c in self.cache.items():
            snap[k] = {kk: c[kk] for kk in ('fetched_at', 'query', 'data')}
        json.dump(snap, open(path or self.path, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
        self.snapshot = snap
        return snap


# ---------------- 合并进行程 ----------------
def _meta(e):
    return {'source': e['source'], 'fetched_at': e.get('fetched_at')}


def enrich(trip: dict, store: LiveStore, wait: bool = False) -> dict:
    """返回带真实数据的行程副本；拿不到的部分保持模拟数据。trip['live'] 记录每块数据的来源。"""
    if not enabled():
        return trip
    t = copy.deepcopy(trip)
    src = {}
    e = store.get('flight', t, wait)
    if e and e.get('data'):
        f = e['data']
        dep_day = t['flight']['scheduled_departure'][:10]
        # 快照可能来自别的日期：只取时刻和跨天数，日期以行程为准
        span = (date.fromisoformat(f['arrival'][:10]) - date.fromisoformat(f['departure'][:10])).days
        t['flight']['scheduled_departure'] = '%s %s' % (dep_day, f['departure'][11:16])
        t['flight']['scheduled_arrival'] = '%s %s' % (date.fromisoformat(dep_day) + timedelta(days=span), f['arrival'][11:16])
        if f.get('to_terminal'):
            t['flight']['to']['terminal'] = f['to_terminal']
        t['flight']['duration_min'] = f.get('duration_min')
        t['flight']['link'] = f.get('link')
        src['flight'] = _meta(e)
    e = store.get('hotel', t, wait)
    if e and e.get('data'):
        h = e['data']
        for k in ('name_zh', 'address_zh', 'landmark_zh', 'phone', 'lat', 'lng', 'star', 'score', 'reviews', 'price_cny', 'link'):
            if h.get(k) not in (None, ''):
                t['hotel'][k] = h[k]
        if h.get('distance_km'):
            t['hotel']['distance_from_airport_km'] = h['distance_km']
            t['hotel']['distance_basis'] = 'straight line'
        src['hotel'] = _meta(e)
    e = store.get('tickets', t, wait)
    if e and e.get('data'):
        by = {x['name_zh']: x for x in e['data']}
        for tk in t.get('tickets') or []:
            r = by.get(tk.get('name_zh'))
            if r:
                tk['rules'] = {**r, 'hours': parse_hours(r['hours_text_zh'], tk['date'], r.get('latest_entry'))}
        src['tickets'] = _meta(e)
    e = store.get('car', t, wait)
    if e and e.get('data'):
        t['car_offer'] = e['data']
        src['car'] = _meta(e)
    leg = next_leg(t)
    if leg:
        e = store.get('train', t, wait)
        t['next_leg'] = {**leg, **((e or {}).get('data') or {}), 'date': leg['date']}
        if e and e.get('data'):
            t['next_leg']['timetable_date'] = e['data'].get('date')
            src['train'] = _meta(e)
    t['live'] = src
    return t
