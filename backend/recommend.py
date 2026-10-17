# -*- coding: utf-8 -*-
"""推荐引擎：按「地理状态 × 行程上下文 × 用户画像」给出落地第一小时的可下单推荐。

同一套打分覆盖两条链路，由 geo_state 翻转：
  前链路（geo=abroad·行前）—— 抬高「准备 / 提前订」的产品（eSIM、接机、租车、提前订高铁、探索目的地），
      Landing Check 促成用户还没下的单，属于引流获客 / 增量 GMV。
  后链路（geo=in_china·落地后）—— 抬高「落地即用」的产品（现在的交通、机场酒店、附近餐厅、换票），
      把落地需求转成渠道订单，属于商业闭环。

每条推荐带一句话理由和「带归因参数」的下单链接（track_link）。外国用户点携程国内站
其实下不了单，这里标记需要路由到 trip.com 国际站。纯函数，便于测试。
"""
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

GEO = ('abroad', 'in_china')
PROFILES = ('family', 'business', 'budget')

# 地理意图权重：境外抬「准备/提前订」，境内抬「落地即用」，both 两边都中等
GEO_INTENT = {
    'abroad':   {'prepare': 3.0, 'onground': 0.3, 'both': 2.0},
    'in_china': {'prepare': 0.8, 'onground': 3.0, 'both': 2.0},
}
# 画像对产品标签的偏好微调
PROFILE_W = {
    'family':   {'transfer': 2.0, 'car': 1.0, 'restaurant': 1.0, 'airport_hotel': 0.5, 'metro': -1.0},
    'business': {'transfer': 1.0, 'fast': 1.5, 'restaurant': 0.5, 'car': -0.5},
    'budget':   {'metro': 1.0, 'airport_hotel': 1.0, 'esim': 0.5, 'transfer': -1.0, 'car': -0.8},
}

ALLIANCE = 'LANDINGCHECK'   # 演示用归因位；正式版换成真实联盟号 / SID

CITY_EN = {'上海': 'Shanghai', '北京': 'Beijing', '广州': 'Guangzhou', '深圳': 'Shenzhen',
           '杭州': 'Hangzhou', '成都': 'Chengdu', '西安': "Xi'an"}


def track_link(url, slot, geo_state):
    """给下单链接挂归因参数（演示方案），并标记是否需路由到 trip.com 国际站。
    返回 (tracked_url, routed_intl)；url 为空返回 (None, False)。"""
    if not url:
        return None, False
    p = urlsplit(url)
    q = dict(parse_qsl(p.query))
    q.update({'allianceid': ALLIANCE, 'sid': 'landingcheck',
              'ouid': 'lc_%s_%s' % (slot, geo_state),
              'utm_source': 'landing_check', 'utm_medium': 'recommend', 'utm_campaign': geo_state})
    routed_intl = 'ctrip.com' in p.netloc.lower()     # 携程国内站：外国用户应改走 trip.com 国际站
    if routed_intl:
        q['locale'] = 'en-US'
    return urlunsplit((p.scheme, p.netloc, p.path, urlencode(q), p.fragment)), routed_intl


def geo_from_ip(ip):
    """用客户端 IP 判断境内/境外。当前未内置 geoip 库，返回 None（未知），
    由 LC_GEO_DEFAULT 或显式开关决定；接入 geoip2 等数据库后在此返回 'in_china' / 'abroad'。"""
    return None


def resolve_profile(trip, profile):
    if profile in PROFILES:
        return profile
    if (trip.get('flight') or {}).get('adults', 1) >= 3:
        return 'family'
    return 'business'


def _hour(hhmm):
    try:
        return int(str(hhmm)[:2])
    except (ValueError, TypeError):
        return None


def _night_when(landed_at, trip):
    when = landed_at or ((trip.get('flight') or {}).get('scheduled_arrival', '') or '')[-5:]
    h = _hour(when)
    return (h is not None and (h >= 22 or h < 6)), when


def _city(trip):
    h = trip.get('hotel') or {}
    zh = h.get('city_zh') or (trip.get('flight') or {}).get('to', {}).get('city_zh') or ''
    return CITY_EN.get(zh, zh or 'Shanghai')


def _candidates(trip, geo, night, when, paid):
    f, h = trip.get('flight') or {}, trip.get('hotel') or {}
    city_en = _city(trip)
    bags, adults = f.get('checked_bags', 0), f.get('adults', 1)
    dist = h.get('distance_from_airport_km') or 0
    pay_ok = bool(paid)
    in_cn = geo == 'in_china'
    out = []

    def add(**c):
        out.append(c)

    # 支付就绪：转化闸门（无佣金但解锁一切）。没验证就高优先，境内更急。
    if not pay_ok:
        add(slot='payment', icon='💳', title='验证支付', intent='both', base=5.0 if in_cn else 2.5, tags=['payment'],
            reason='你已落地，但还没验证支付——先搞定它才能扫码打车、买票、吃饭'
                   if in_cn else '起飞前用 ¥1 验证支付宝或 TenPayGo，落地就能直接扫码付款',
            price=None, cta='去验证支付', link=None, action='verify_payment')

    # eSIM：境外行前准备
    if not (trip.get('esim') or {}).get('bought') and not in_cn:
        add(slot='esim', icon='📶', title='eSIM 上网', intent='prepare', base=1.0, tags=['esim'],
            reason='落地即联网：支付、打车、导航全靠它，国内常注册不了境外 App',
            price=None, cta='看 eSIM 套餐', link='https://www.trip.com/sim-cards/', action=None)

    # 接机：境外提前订 / 境内深夜落地即用
    if not trip.get('transfer_booked'):
        base = 1.0 + (1.0 if (bags >= 2 or adults >= 3) else 0.0) + (2.0 if (in_cn and night) else 0.0)
        add(slot='transfer', icon='🚗', title='机场接机', intent='both', base=base, tags=['transfer'],
            reason=('现在到达口打车排长队？预约接机直接上车，%d km 到酒店' % dist) if in_cn
                   else ('%d 人 + %d 件行李，落地 %s 不排队，司机到达口举牌等你' % (adults, bags, when or '')),
            price=None, cta='预约接机',
            link='https://www.trip.com/carhire/airport-transfers/?city=%s' % city_en, action=None)

    # 租车：提前订，画像预算/商务微调
    car = trip.get('car_offer')
    if car and not trip.get('car_rental_booked'):
        add(slot='car', icon='🚙', title='租车', intent='prepare', base=0.6, tags=['car'],
            reason='%s %d 辆，经济型约 ¥%d/天 · 外国驾照需先办临时驾驶许可' % (
                car.get('city_en') or city_en, car.get('total') or 0, car.get('typical_price') or 0),
            price=('¥%d/天' % car['typical_price']) if car.get('typical_price') else None,
            cta='看车型', link=car.get('link'), action=None)

    # 换护照可用门票（N1）：检测到只认身份证的票种就高优先（防止「到了进不去」）
    for tk in trip.get('tickets') or []:
        r = tk.get('rules') or {}
        if r.get('id_card_only'):
            name = tk.get('name') or r.get('name_zh') or '景点门票'
            add(slot='ticket', icon='🎫', title='换护照可用票', intent='both', base=4.0, tags=['ticket'],
                reason='你的「%s」有 %d 个票种只认身份证，护照刷不进闸口；换成 %d 个护照可用票种' % (
                    name, r.get('id_card_only'), r.get('passport_ok', 0)),
                price=('¥%s 起' % r['from_price']) if r.get('from_price') else None,
                cta='换护照票', link=r.get('link') or tk.get('link'), action=None)
            break

    # 城际高铁（N2 行程缺口）：门票在别的城市却没订车
    leg = trip.get('next_leg')
    if leg and leg.get('trains'):
        d = leg.get('fastest_min')
        add(slot='train', icon='🚄', title='城际高铁', intent='both', base=3.0, tags=['train', 'fast'],
            reason='「%s」在 %s、你住 %s，中间没订车：退房日最快 %s，二等座 ¥%d 起' % (
                leg.get('for', '下一程'), leg.get('to_en', ''), leg.get('from_en', ''),
                ('%dh%02dm' % divmod(d, 60)) if d else '—', leg.get('from_price') or 0),
            price=('¥%d 起' % leg['from_price']) if leg.get('from_price') else None,
            cta='订高铁票', link=leg.get('link'), action=None)

    # 机场酒店（N6）：深夜落地、市区酒店太远（仅境内）
    if in_cn and night and dist and dist > 30:
        add(slot='airport_hotel', icon='🏨', title='机场酒店', intent='onground', base=3.0, tags=['airport_hotel'],
            reason='深夜落地、地铁已停、市区酒店 %d km 外：今晚先住机场酒店，明早再进城' % dist,
            price='¥273 起', cta='订机场酒店',
            link='https://www.trip.com/hotels/list?city=%s&nearairport=1' % city_en, action=None)

    # 附近餐厅（N7）：落地安顿后、能扫码付款（仅境内）
    if in_cn and not night and pay_ok:
        add(slot='restaurant', icon='🍜', title='附近餐厅', intent='onground', base=1.0, tags=['restaurant'],
            reason='到酒店快 8 点了？%s 酒店附近还营业、有英文菜单的餐厅' % city_en,
            price=None, cta='找附近餐厅',
            link='https://www.trip.com/restaurant/list?city=%s' % city_en, action=None)

    # 探索目的地：有当地攻略就顺带把门票订了
    content = trip.get('content')
    if content and content.get('count'):
        add(slot='explore', icon='🧭', title='探索 %s' % city_en, intent='prepare', base=0.3, tags=['explore'],
            reason='%s 有 %d 篇当地玩法攻略，顺手把景点门票也订了' % (city_en, content['count']),
            price=None, cta='逛逛 %s' % city_en,
            link='https://www.trip.com/things-to-do/list?city=%s' % city_en, action=None)

    return out


def score(c, geo, profile):
    s = GEO_INTENT[geo].get(c['intent'], 1.0) + c.get('base', 0.0)
    w = PROFILE_W.get(profile, {})
    s += sum(w.get(t, 0.0) for t in c.get('tags', []))
    return s


def recommend(trip, geo_state, profile='auto', paid=None, landed_at=None, airport='PVG',
              n=3, night=None, client_ip=None, geo_source='override'):
    """返回 {geo_state, profile, cards:[...], ranking:[...]}。cards 已按分数取前 n 条。
    链路标签随地理翻转：境外=前链路（拉新/提前订），境内=后链路（落地转化）。"""
    geo_state = geo_state if geo_state in GEO else 'abroad'
    prof = resolve_profile(trip, profile)
    is_night, when = _night_when(landed_at, trip)
    if night is not None:
        is_night = bool(night)
    chain = '前链路' if geo_state == 'abroad' else '后链路'
    cands = _candidates(trip, geo_state, is_night, when, paid or [])
    for c in cands:
        c['score'] = round(score(c, geo_state, prof), 2)
    cands.sort(key=lambda c: c['score'], reverse=True)
    cards = []
    for c in cands[:n]:
        link, routed = track_link(c.get('link'), c['slot'], geo_state)
        cards.append({'slot': c['slot'], 'icon': c['icon'], 'title': c['title'], 'reason': c['reason'],
                      'price': c.get('price'), 'cta': c['cta'], 'chain': chain, 'intent': c['intent'],
                      'kind': 'action' if c.get('action') else 'link', 'action': c.get('action'),
                      'link': link, 'routed_intl': routed, 'score': c['score']})
    return {'geo_state': geo_state, 'geo_source': geo_source, 'profile': prof, 'profile_input': profile,
            'client_ip': client_ip, 'night': is_night, 'landed_at': when, 'cards': cards,
            'ranking': [{'slot': c['slot'], 'score': c['score'], 'chain': chain} for c in cands]}
