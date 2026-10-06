# -*- coding: utf-8 -*-
"""规则引擎：行前检查项状态、交通推荐。纯函数，输入输出都是 dict，便于测试。"""
import os, json
from datetime import datetime, date
from mock import PAY_METHODS

HERE = os.path.dirname(os.path.abspath(__file__))
TRANSPORT = json.load(open(os.path.join(HERE, 'mock', 'transport.json'), encoding='utf-8'))
AIRPORTS = json.load(open(os.path.join(HERE, 'mock', 'airports.json'), encoding='utf-8'))


# ---------------- 行前检查 ----------------
def preflight(trip: dict, done: set = frozenset(), today: date = None) -> dict:
    """六项必查 + 两项可选。状态：done / todo / optional / pending。
    支付是一组两项（支付宝 / TenPayGo），任一个验证即算这一项完成，另一个变成备用（optional）。"""
    today = today or date.today()
    p = trip.get('permissions', {})
    esim = trip.get('esim', {})
    pack = trip.get('offline_pack', {})
    tickets = trip.get('tickets', [])
    passport = trip.get('passport', {})
    items = []

    def add(id_, title, status, desc, action=None, entry=None, **extra):
        items.append({'id': id_, 'title': title, 'status': status, 'desc': desc, 'action': action, 'entry': entry, **extra})

    perm_ok = p.get('location') in ('always', 'while_using') and p.get('notifications') is True
    add('permissions', 'Location & notifications', 'done' if perm_ok else 'todo',
        'Allowed · triggers the landing check offline' if perm_ok else 'Needed to trigger the landing check when you land', None if perm_ok else 'request_permissions')

    data_ok = bool(esim.get('bought'))
    add('data', 'Mobile data in China', 'done' if data_ok else 'todo',
        'eSIM ready · activates when you land' if data_ok else 'No eSIM or roaming plan found', None if data_ok else 'buy_esim')

    pays = _payments(trip, done)
    _add_payment_group(add, pays, trip.get('payment_apps', {}))

    add('transfer', 'Ride from the airport · optional', 'done' if trip.get('transfer_booked') else 'optional',
        'Driver will wait at arrivals' if trip.get('transfer_booked') else _transfer_hint(trip), None if trip.get('transfer_booked') else 'book_transfer')

    add('car', 'Car rental · optional', 'done' if trip.get('car_rental_booked') else 'optional',
        'Booked' if trip.get('car_rental_booked') else 'Pick up at the airport · foreign licences need a temporary Chinese permit', None if trip.get('car_rental_booked') else 'book_car')

    realname = [t for t in tickets if t.get('realname')]
    if realname:
        t = realname[0]
        add('tickets', '%s reservation' % t['name'], 'done', 'Confirmed · %s %s · bring passport' % (t['date'], t.get('slot', '')), None)
    else:
        add('tickets', 'Attraction reservations', 'done', 'No real-name tickets on this trip', None)

    valid = passport.get('valid_until')
    months_left = None
    if valid:
        months_left = (date.fromisoformat(valid) - today).days
    pp_ok = months_left is not None and months_left >= 183
    add('passport', 'Passport', 'done' if pp_ok else 'todo',
        ('Valid until %s · matches your bookings' % valid[:4]) if pp_ok else 'Less than 6 months validity, check entry rules', None if pp_ok else 'check_passport')

    pack_ok = pack.get('downloaded')
    add('pack', 'Offline landing pack', 'done' if pack_ok else 'todo',
        ('Downloaded · %s · %s MB · %s' % (pack.get('airport'), pack.get('size_mb'), pack.get('date'))) if pack_ok else 'Download before you fly', None if pack_ok else 'download_pack')

    # 组内（支付宝 / TenPayGo）只算一项：任一个 done 即 done；组内的备用项不计入 optional 数
    plain = [i for i in items if not i.get('group')]
    grouped = [i for i in items if i.get('group')]
    groups = sorted({i['group'] for i in grouped})
    required = len([i for i in plain if i['status'] in ('done', 'todo')]) + len(groups)
    ndone = sum(1 for i in plain if i['status'] == 'done') + sum(1 for g in groups if any(i['status'] == 'done' for i in grouped if i['group'] == g))
    optional_open = sum(1 for i in plain if i['status'] == 'optional')
    return {'items': items, 'ready': ndone, 'required': required,
            'optional_open': optional_open,
            'backup_open': sum(1 for i in grouped if i['status'] == 'optional'),
            'payment': _payment_summary(pays),
            'pct': int(round(100 * ndone / required)) if required else 100,
            'summary': ('You\'re ready for Shanghai · %d of %d ready' % (ndone, required)) if required and ndone == required else
                       '%d of %d ready · %d to do · %d optional' % (ndone, required, required - ndone, optional_open)}


# ---------------- 支付组 ----------------
PAY_ITEM = {
    'alipay': {'title': 'Alipay payment', 'entry': 'alipay_setup_before_flight', 'pitch': '¥1 test, refunded in 24 h',
               'backup': 'Backup · not verified · for shops that only take Alipay'},
    'tenpaygo': {'title': 'TenPayGo payment', 'entry': 'tenpaygo_setup_before_flight', 'pitch': 'email sign-up, no Chinese number',
                 'backup': 'Backup · not verified · pays wherever WeChat Pay works'},
}


def _payments(trip: dict, done) -> dict:
    """每种方式的验证状态。旧调用方只给 trip['payment']（单个支付宝），按支付宝处理。"""
    pays = trip.get('payments') or {'alipay': trip.get('payment') or {}}
    return {m: {**(pays.get(m) or {}), 'ok': (pays.get(m) or {}).get('status') == 'verified' or m in done} for m in PAY_METHODS}


def _add_payment_group(add, pays: dict, apps: dict):
    group_ok = any(p['ok'] for p in pays.values())
    for m, p in pays.items():
        c = PAY_ITEM[m]
        installed = (apps.get(m) or {}).get('installed', m == 'alipay')
        if p['ok']:
            status, desc = 'done', ('Verified · ¥1 test on %s, refunded' % p['verified_at'][:10]) if p.get('verified_at') else 'Verified before you flew · ¥1 test, refunded'
        elif group_ok:
            status, desc = 'optional', c['backup']
        elif m == 'alipay':
            status, desc = 'todo', ('Installed · not verified yet · ' if installed else 'Not installed · either one is enough · ') + c['pitch']
        else:
            status, desc = 'todo', ('Installed · not verified yet · either one is enough' if installed else 'Not installed · either one is enough · ' + c['pitch'])
        add(m, c['title'], status, desc, None if p['ok'] else 'verify_payment', c['entry'], group='payment', method=m)


def _payment_summary(pays: dict) -> dict:
    order = list(PAY_METHODS)
    verified = [m for m in order if pays[m]['ok']]
    primary = min(verified, key=lambda m: (pays[m].get('verified_at') or '', order.index(m))) if verified else None
    return {'ready': bool(verified), 'primary': primary, 'primary_name': PAY_METHODS.get(primary),
            'verified': verified, 'verified_at': pays[primary].get('verified_at') if primary else None, 'methods': order}


def _transfer_hint(trip):
    f, h = trip.get('flight', {}), trip.get('hotel', {})
    return '%d bag%s, %d adult%s, %d km · a pre-booked transfer beats the taxi queue' % (f.get('checked_bags', 0), '' if f.get('checked_bags', 0) == 1 else 's', f.get('adults', 1), '' if f.get('adults', 1) == 1 else 's', h.get('distance_from_airport_km', 0))


# ---------------- 交通推荐 ----------------
def _mins(hhmm: str) -> int:
    h, m = [int(x) for x in hhmm.split(':')]
    return h * 60 + m


def _is_night(hhmm: str, metro: dict = None) -> bool:
    """地铁已停运（末班前 15 分钟起）或首班前即视为深夜。"""
    t = _mins(hhmm)
    last = _mins((metro or {}).get('last', '22:30')) - 15
    first = _mins((metro or {}).get('first', '05:30'))
    return t >= last or t < first


def transport(trip: dict, landed_at: str = None, airport: str = 'PVG', weather: str = 'clear') -> dict:
    """返回 recommended + alternatives，每个带 reason。landed_at 'HH:MM' 覆盖航班时间，便于演示。"""
    f, h = trip.get('flight', {}), trip.get('hotel', {})
    if airport not in TRANSPORT:
        airport = 'PVG'
    opts = TRANSPORT[airport]
    ap = AIRPORTS.get(airport, AIRPORTS['PVG'])
    when = landed_at or (f.get('scheduled_arrival', '14:20')[-5:])
    bags, adults = f.get('checked_bags', 0), f.get('adults', 1)
    dist, metro_walk = h.get('distance_from_airport_km', 0), h.get('nearest_metro', {}).get('walk_m', 9999)
    facts = ['Landed %s' % when, '%d checked bag%s' % (bags, '' if bags == 1 else 's'), '%d adult%s' % (adults, '' if adults == 1 else 's'), 'Hotel %d km' % dist]
    night = _is_night(when, ap.get('metro'))

    if trip.get('transfer_booked'):
        rec, why, alts = 'transfer', 'You pre-booked a transfer. The driver is waiting at arrivals with your name.', ['taxi']
    elif night:
        rec, why, alts = 'taxi', 'Landed at %s: the metro has stopped for the night. A taxi from the official queue is the simplest.' % when, ['transfer', 'didi']
    elif bags >= 2 or adults >= 3:
        rec, why, alts = 'taxi', '%d checked bag%s%s make the metro a hassle. Hotel is %d km away%s.' % (bags, '' if bags == 1 else 's', (' and %d adults' % adults) if adults >= 3 else '', dist, ', not rush hour' if not _is_rush(when) else ''), ['metro', 'didi']
    elif metro_walk > 1000:
        rec, why, alts = 'taxi', 'Your hotel is %d m from the nearest metro station, too far with luggage.' % metro_walk, ['metro', 'didi']
    elif weather == 'rain':
        rec, why, alts = 'taxi', 'It is raining and the metro needs a walk at both ends.', ['metro']
    else:
        rec, why, alts = 'metro', 'Light luggage and your hotel is %d m from %s station. Metro Line %s is the cheapest.' % (metro_walk, h.get('nearest_metro', {}).get('name', 'the'), ap['metro']['line']), ['taxi', 'didi']

    def pack(oid, is_rec=False):
        o = dict(opts[oid]); o['recommended'] = is_rec
        o.setdefault('go_to', {'title': o['title'], 'where': o.get('where', ''), 'verified': False})
        lo, hi = o['price_cny']; o['price'] = '¥%d' % lo if lo == hi else '¥%d–%d' % (lo, hi)
        return o

    return {'airport': airport, 'landed_at': when, 'night': night, 'facts': facts,
            'recommended': {**pack(rec, True), 'why': why},
            'alternatives': [pack(a) for a in alts if a != rec],
            'taxi_queue': ap.get('taxi_queue', {}).get('where'), 'metro': ap.get('metro')}


def _is_rush(hhmm: str) -> bool:
    h = int(hhmm.split(':')[0])
    return 7 <= h < 10 or 17 <= h < 20
