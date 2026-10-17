# -*- coding: utf-8 -*-
"""推荐引擎测试：地理翻转、上下文触发、画像微调、归因链接。纯函数，不联网。"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import recommend


def base_trip():
    return {
        'flight': {'checked_bags': 2, 'adults': 3, 'scheduled_arrival': '2026-10-19 17:25',
                   'to': {'code': 'PVG', 'name': 'Shanghai Pudong'}},
        'hotel': {'city_zh': '上海', 'distance_from_airport_km': 35},
        'esim': {'bought': False},
        'tickets': [{'name': 'Palace Museum', 'rules': {'id_card_only': 4, 'passport_ok': 6, 'from_price': 60,
                                                        'link': 'https://m.ctrip.com/ticket/1'}}],
        'next_leg': {'trains': [{'no': 'G1'}], 'fastest_min': 264, 'from_price': 598,
                     'from_en': 'Shanghai', 'to_en': 'Beijing', 'for': 'Palace Museum',
                     'link': 'https://m.ctrip.com/train/1'},
        'car_offer': {'city_en': 'Shanghai', 'total': 567, 'typical_price': 99, 'link': 'https://m.ctrip.com/car/1'},
        'content': {'count': 10},
    }


def slots(res):
    return [r['slot'] for r in res['ranking']]


def test_geo_flips_which_products_show():
    abroad = recommend.recommend(base_trip(), 'abroad', paid=[])
    china = recommend.recommend(base_trip(), 'in_china', paid=['alipay'])
    assert 'esim' in slots(abroad)
    assert 'esim' not in slots(china)
    assert 'restaurant' in slots(china)
    assert 'restaurant' not in slots(abroad)


def test_payment_is_top_when_landed_without_pay():
    res = recommend.recommend(base_trip(), 'in_china', paid=[])
    assert res['ranking'][0]['slot'] == 'payment'
    res2 = recommend.recommend(base_trip(), 'in_china', paid=['alipay'])
    assert 'payment' not in slots(res2)


def test_realname_ticket_triggers_swap_card():
    assert 'ticket' in slots(recommend.recommend(base_trip(), 'abroad', paid=['alipay']))
    t = dict(base_trip()); t['tickets'] = [{'name': 'x', 'rules': {'id_card_only': 0, 'passport_ok': 3}}]
    assert 'ticket' not in slots(recommend.recommend(t, 'abroad', paid=['alipay']))


def test_itinerary_gap_triggers_train():
    assert 'train' in slots(recommend.recommend(base_trip(), 'abroad', paid=['alipay']))
    t = dict(base_trip()); t.pop('next_leg')
    assert 'train' not in slots(recommend.recommend(t, 'abroad', paid=['alipay']))


def test_booked_items_are_filtered_out():
    t = dict(base_trip()); t['transfer_booked'] = True; t['car_rental_booked'] = True
    s = slots(recommend.recommend(t, 'abroad', paid=['alipay']))
    assert 'transfer' not in s and 'car' not in s


def test_airport_hotel_only_on_night_landing_in_china():
    t = base_trip()
    assert 'airport_hotel' not in slots(recommend.recommend(t, 'in_china', paid=['alipay'], night=False))
    assert 'airport_hotel' in slots(recommend.recommend(t, 'in_china', paid=['alipay'], night=True))


def test_profile_family_outranks_budget_on_transfer():
    fam = {r['slot']: r['score'] for r in recommend.recommend(base_trip(), 'abroad', profile='family', paid=['alipay'])['ranking']}
    bud = {r['slot']: r['score'] for r in recommend.recommend(base_trip(), 'abroad', profile='budget', paid=['alipay'])['ranking']}
    assert fam['transfer'] > bud['transfer']


def test_track_link_adds_attribution_and_flags_ctrip():
    url, intl = recommend.track_link('https://m.ctrip.com/car/1?x=2', 'car', 'in_china')
    assert 'allianceid=LANDINGCHECK' in url and 'ouid=lc_car_in_china' in url
    assert 'utm_source=landing_check' in url and 'locale=en-US' in url
    assert 'x=2' in url and intl is True
    url2, intl2 = recommend.track_link('https://www.trip.com/sim-cards/', 'esim', 'abroad')
    assert 'allianceid=LANDINGCHECK' in url2 and intl2 is False and 'locale' not in url2
    assert recommend.track_link(None, 'x', 'abroad') == (None, False)


def test_car_card_fires_without_live_offer():
    # main 的纯 mock 行程没有 car_offer，租车卡仍应出现（通用文案）
    t = dict(base_trip()); t.pop('car_offer')
    assert 'car' in slots(recommend.recommend(t, 'abroad', paid=['alipay']))


def test_auto_profile_derives_family_for_group():
    assert recommend.resolve_profile({'flight': {'adults': 3}}, 'auto') == 'family'
    assert recommend.resolve_profile({'flight': {'adults': 1}}, 'auto') == 'business'
