# -*- coding: utf-8 -*-
"""Landing Check 后端入口。

    uvicorn app:app --reload --port 8000
"""
import os, re
from typing import Optional
from fastapi import FastAPI, HTTPException, Query, Body, UploadFile, File, Form, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

from kb import KnowledgeBase
from mock import MockTrip, TripStore
from rules import PAY_METHODS
from ctrip_mcp import (query_content as ctrip_query_content, query_train as ctrip_query_train,
                       query_hotel as ctrip_query_hotel, query_car_rental as ctrip_query_car_rental,
                       CtripMCPError)
import stuck
import rules

app = FastAPI(title='Landing Check API', version='0.1')
app.add_middleware(CORSMiddleware,
                   allow_origins=['https://yuklim.github.io', 'http://127.0.0.1:8787', 'http://localhost:8787', 'http://127.0.0.1:8000'],
                   allow_origin_regex=r'http://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?',
                   allow_methods=['*'], allow_headers=['*'])

kb = KnowledgeBase()
trip = MockTrip()                 # 没带访问者 ID 的请求（旧前端、测试台、脚本）共用这一份
trips = TripStore(default=trip)   # 带 X-LC-Visitor 的请求各用一份，评委扫码 / 多台设备互不影响


def visitor_trip(x_lc_visitor: Optional[str] = Header(None)) -> MockTrip:
    return trips.get(x_lc_visitor)


_H5 = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'h5'))
if os.path.isdir(_H5):
    app.mount('/app', StaticFiles(directory=_H5, html=True), name='h5')

# Keep the showcase self-contained under backend/ for the existing Render root.
_SHOWCASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'showcase')
if os.path.isdir(_SHOWCASE):
    app.mount('/showcase', StaticFiles(directory=_SHOWCASE, html=True), name='showcase')


@app.get('/')
def root():
    return {'service': 'landing-check', 'entries': len(kb.entries), 'scenarios': list(kb.scenarios), 'flight': trip.flight_status}


@app.get('/test', include_in_schema=False)
def test_page():
    return FileResponse(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'test.html'))


@app.get('/health')
def health():
    # Render 会注入 RENDER_GIT_COMMIT，用来确认线上跑的是哪次提交
    return {'ok': True, 'build': '2026-10-06-tenpaygo', 'commit': (os.environ.get('RENDER_GIT_COMMIT') or os.environ.get('GIT_COMMIT') or '')[:7] or None,
            'kb_scenarios': sorted(kb.scenarios)}


# ---------------- A 知识库 ----------------
@app.get('/kb/scenarios')
def kb_scenarios():
    return kb.list_scenarios()


@app.get('/kb/entries')
def kb_entries(scenario: Optional[str] = None, stage: Optional[str] = None, lang: str = 'en'):
    if scenario and scenario not in kb.scenarios:
        raise HTTPException(404, 'unknown scenario %s' % scenario)
    return kb.query(scenario, stage, lang)


@app.get('/kb/entry/{entry_id}')
def kb_entry(entry_id: str, lang: str = 'en'):
    e = kb.get(entry_id, lang)
    if not e:
        raise HTTPException(404, 'unknown entry %s' % entry_id)
    return e


@app.get('/kb/search')
def kb_search(q: str = Query(..., min_length=2), lang: str = 'en', limit: int = 5):
    return kb.search(q, lang, limit)


class Feedback(BaseModel):
    entry_id: str
    solved: bool
    note: str = ''


@app.post('/kb/feedback')
def kb_feedback(f: Feedback):
    try:
        kb.add_feedback(f.entry_id, f.solved, f.note)
    except KeyError:
        raise HTTPException(404, 'unknown entry %s' % f.entry_id)
    return {'ok': True, 'stats': kb.stats().get(f.entry_id)}


@app.get('/kb/stats')
def kb_stats():
    return kb.stats()


class Hardest(BaseModel):
    step: str


_hardest = {}


@app.post('/feedback/hardest')
def feedback_hardest(h: Hardest):
    if h.step not in ('wifi', 'payment', 'transport'):
        raise HTTPException(400, 'step must be wifi | payment | transport')
    _hardest[h.step] = _hardest.get(h.step, 0) + 1
    return {'ok': True, 'counts': _hardest}


@app.post('/kb/reload')
def kb_reload():
    kb.load()
    return {'ok': True, 'entries': len(kb.entries)}


# ---------------- C 模拟携程数据 ----------------
@app.get('/mock/trip')
def mock_trip(t: MockTrip = Depends(visitor_trip)):
    return t.get_trip()


@app.get('/mock/flight')
def mock_flight(t: MockTrip = Depends(visitor_trip)):
    return t.get_flight()


@app.post('/mock/flight/depart')
def mock_depart(t: MockTrip = Depends(visitor_trip)):
    return t.depart()


@app.post('/mock/flight/land')
def mock_land(t: MockTrip = Depends(visitor_trip)):
    return t.land()


@app.post('/mock/reset')
def mock_reset(t: MockTrip = Depends(visitor_trip)):
    t.reset()
    return {'ok': True}


@app.post('/mock/pay-test')
def mock_pay_test(fail: bool = False, method: str = 'alipay', donate: bool = False, t: MockTrip = Depends(visitor_trip)):
    """donate=true：¥1 测试款不退回，捐给中国青少年发展基金会（CYDF）"""
    if method not in PAY_METHODS:
        raise HTTPException(400, 'method must be %s' % ' | '.join(PAY_METHODS))
    return t.pay_test(fail=fail, method=method, donate=donate)


class Consent(BaseModel):
    location: bool = False
    notifications: bool = False
    camera: bool = False
    microphone: bool = False


@app.get('/mock/consent')
def mock_consent_get(t: MockTrip = Depends(visitor_trip)):
    return {'consent': t.consent}


@app.post('/mock/consent')
def mock_consent(c: Consent, t: MockTrip = Depends(visitor_trip)):
    """行前检查首次进入的隐私授权页：逐项授权的结果"""
    return {'consent': t.set_consent(c.dict()), 'preflight': rules.preflight(_trip_with_done(t), t.done_items)}


@app.post('/mock/event')
def mock_event(event: str = Body(..., embed=True), t: MockTrip = Depends(visitor_trip)):
    if event not in ('online', 'in_car', 'arrived'):
        raise HTTPException(400, 'event must be online | in_car | arrived')
    return t.mark(event)


@app.get('/mock/timeline')
def mock_timeline(t: MockTrip = Depends(visitor_trip)):
    return t.timeline()


# ---------------- E 携程营销 MCP（真实数据，Token 走环境变量 CTRIP_MCP_TOKEN） ----------------
# 失败一律返回 {items:[], note}（HTTP 200），让前端静默兜底到静态/mock，绝不空页面翻车。
@app.get('/content/community')
def content_community(query: str = '', city: str = '', keyword: str = '',
                      region: str = '', scenarios: str = '', size: int = 10):
    """探索 / 社区信息流：代理官方 query_content，归一化成卡片列表。"""
    try:
        return ctrip_query_content(query=query, city=city, keyword=keyword,
                                   region=region, scenarios=scenarios,
                                   size=min(max(size, 1), 30))
    except CtripMCPError as e:
        return {'items': [], 'note': str(e)}


@app.get('/content/trains')
def content_trains(fromCity: str, toCity: str, departDate: str, size: int = 20):
    """城际火车票：代理官方 query_train，归一化成车次列表。departDate 格式 yyyy-MM-dd。"""
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', departDate or ''):
        raise HTTPException(400, 'departDate must be yyyy-MM-dd')
    try:
        return ctrip_query_train(fromCity, toCity, departDate, size=min(max(size, 1), 40))
    except CtripMCPError as e:
        return {'items': [], 'note': str(e)}


@app.get('/content/hotels')
def content_hotels(city: str = '', keyword: str = '', hotelName: str = '', landmark: str = '',
                   tags: str = '', stars: str = '', checkIn: str = '', checkOut: str = '',
                   sortType: str = '1', size: int = 10):
    """酒店列表：代理官方 query_hotel，归一化成卡片。常用 city=上海。"""
    for d in (checkIn, checkOut):
        if d and not re.fullmatch(r'\d{4}-\d{2}-\d{2}', d):
            raise HTTPException(400, 'checkIn/checkOut must be yyyy-MM-dd')
    try:
        return ctrip_query_hotel(city=city, keyword=keyword, hotel_name=hotelName,
                                 landmark=landmark, tags=tags, stars=stars,
                                 check_in=checkIn, check_out=checkOut, sort_type=sortType,
                                 size=min(max(size, 1), 30))
    except CtripMCPError as e:
        return {'items': [], 'note': str(e)}


@app.get('/content/cars')
def content_cars(pickUpCity: str, returnCity: str = '', vehicleGroupIds: str = '',
                 pickUpTime: str = '', returnTime: str = '', size: int = 12):
    """租车列表：代理官方 car_rental，归一化成车辆列表。pickUpCity=取车城市(如 上海)。"""
    try:
        return ctrip_query_car_rental(pickUpCity, return_city=returnCity,
                                      vehicle_group_ids=vehicleGroupIds,
                                      pick_up_time=pickUpTime, return_time=returnTime,
                                      size=min(max(size, 1), 30))
    except CtripMCPError as e:
        return {'items': [], 'note': str(e)}


# 预热：把 demo 常用的查询先打一遍灌进缓存，现场点开就秒出（租车冷启动≈10s，务必先热）。
_WARM_JOBS = [
    ('community', lambda: ctrip_query_content(query='上海外滩', size=10)),
    ('hotels', lambda: ctrip_query_hotel(city='上海', sort_type='1', size=10)),
    ('cars', lambda: ctrip_query_car_rental('上海', size=12)),
]


def _warm(fn):
    try:
        r = fn()
        return len((r or {}).get('items', []))
    except Exception:
        return -1


@app.get('/content/warmup')
def content_warmup():
    """演示前手动预热：curl 一下，返回每项命中的条数与耗时。"""
    import time as _t
    out = {}
    for name, fn in _WARM_JOBS:
        t0 = _t.time()
        n = _warm(fn)
        out[name] = {'items': n, 'ms': round((_t.time() - t0) * 1000)}
    return {'warmed': out}


@app.on_event('startup')
def _warm_on_startup():
    """后端一启动就在后台线程预热（不阻塞启动）；没设 token 时各项静默失败，无副作用。"""
    import threading
    threading.Thread(target=lambda: [_warm(fn) for _, fn in _WARM_JOBS], daemon=True).start()


# ---------------- B 识别 ----------------
MAX_UPLOAD = 5 * 1024 * 1024


@app.post('/stuck/classify')
async def stuck_classify(image: UploadFile | None = File(None), text: str = Form(''), lang: str = Form('en'),
                         airport: str = Form(''), advice: str = Form('true')):
    img = None
    if image is not None:
        if image.content_type and not image.content_type.startswith('image/'):
            raise HTTPException(415, 'image must be image/*')
        img = await image.read()
        if len(img) > MAX_UPLOAD:
            raise HTTPException(413, 'image larger than 5 MB')
        if not img:
            img = None
    text = text.strip()[:500]
    if not img and not text:
        raise HTTPException(400, 'send an image or a text description')
    return await run_in_threadpool(stuck.classify, kb, img, text, lang=lang[:12], airport=airport[:8], advice=advice.lower() != 'false')


# ---------------- D 规则引擎 ----------------
def _trip_with_done(mt: MockTrip):
    t = mt.get_trip()
    d = mt.done_items
    if 'transfer' in d: t['transfer_booked'] = True
    if 'car' in d: t['car_rental_booked'] = True
    if 'esim' in d: t['esim'] = {**t.get('esim', {}), 'bought': True}
    if 'pack' in d: t['offline_pack'] = {**t.get('offline_pack', {}), 'downloaded': True}
    if 'permissions' in d: t['permissions'] = {'location': 'always', 'notifications': True}
    return t


@app.get('/rules/preflight')
def rules_preflight(t: MockTrip = Depends(visitor_trip)):
    return rules.preflight(_trip_with_done(t), t.done_items)


class DoneItem(BaseModel):
    item: str


@app.post('/rules/preflight/done')
def rules_preflight_done(d: DoneItem, t: MockTrip = Depends(visitor_trip)):
    if d.item not in ('esim', 'alipay', 'tenpaygo', 'transfer', 'car', 'permissions', 'pack'):
        raise HTTPException(400, 'unknown item %s' % d.item)
    t.mark_done(d.item)
    return rules.preflight(_trip_with_done(t), t.done_items)


@app.get('/rules/transport')
def rules_transport(landed_at: Optional[str] = None, bags: Optional[int] = None, adults: Optional[int] = None,
                    airport: str = 'PVG', weather: str = 'clear', mt: MockTrip = Depends(visitor_trip)):
    if landed_at is not None and not re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d', landed_at):
        raise HTTPException(400, 'landed_at must be HH:MM')
    t = _trip_with_done(mt)
    if bags is not None:
        t['flight']['checked_bags'] = bags
    if adults is not None:
        t['flight']['adults'] = adults
    if landed_at is None and mt.landed_at:
        landed_at = mt.landed_at[11:16]
    return rules.transport(t, landed_at=landed_at, airport=airport, weather=weather, paid=rules.verified_methods(t, mt.done_items))
