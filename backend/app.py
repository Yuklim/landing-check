# -*- coding: utf-8 -*-
"""Landing Check 后端入口。

    uvicorn app:app --reload --port 8000
"""
import os
from typing import Optional
from fastapi import FastAPI, HTTPException, Query, Body, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from kb import KnowledgeBase
from mock import MockTrip
import stuck
import rules

app = FastAPI(title='Landing Check API', version='0.1')
app.add_middleware(CORSMiddleware,
                   allow_origins=['https://yuklim.github.io', 'http://127.0.0.1:8787', 'http://localhost:8787', 'http://127.0.0.1:8000'],
                   allow_origin_regex=r'http://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?',
                   allow_methods=['*'], allow_headers=['*'])

kb = KnowledgeBase()
trip = MockTrip()
_H5 = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'h5'))
if os.path.isdir(_H5):
    app.mount('/app', StaticFiles(directory=_H5, html=True), name='h5')


@app.get('/')
def root():
    return {'service': 'landing-check', 'entries': len(kb.entries), 'scenarios': list(kb.scenarios), 'flight': trip.flight_status}


@app.get('/test', include_in_schema=False)
def test_page():
    return FileResponse(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'test.html'))


@app.get('/health')
def health():
    return {'ok': True}


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


@app.post('/kb/reload')
def kb_reload():
    kb.load()
    return {'ok': True, 'entries': len(kb.entries)}


# ---------------- C 模拟携程数据 ----------------
@app.get('/mock/trip')
def mock_trip():
    return trip.get_trip()


@app.get('/mock/flight')
def mock_flight():
    return trip.get_flight()


@app.post('/mock/flight/depart')
def mock_depart():
    return trip.depart()


@app.post('/mock/flight/land')
def mock_land():
    return trip.land()


@app.post('/mock/reset')
def mock_reset():
    trip.reset()
    return {'ok': True}


@app.post('/mock/pay-test')
def mock_pay_test(fail: bool = False):
    return trip.pay_test(fail=fail)


@app.post('/mock/event')
def mock_event(event: str = Body(..., embed=True)):
    if event not in ('online', 'in_car', 'arrived'):
        raise HTTPException(400, 'event must be online | in_car | arrived')
    return trip.mark(event)


@app.get('/mock/timeline')
def mock_timeline():
    return trip.timeline()


# ---------------- B 识别 ----------------
@app.post('/stuck/classify')
async def stuck_classify(image: UploadFile | None = File(None), text: str = Form(''), lang: str = Form('en'),
                         airport: str = Form(''), advice: str = Form('true')):
    img = await image.read() if image else None
    if not img and not text.strip():
        raise HTTPException(400, 'send an image or a text description')
    return stuck.classify(kb, img, text.strip(), lang=lang, airport=airport, advice=advice.lower() != 'false')


# ---------------- D 规则引擎 ----------------
@app.get('/rules/preflight')
def rules_preflight():
    return rules.preflight(trip.get_trip(), trip.done_items)


class DoneItem(BaseModel):
    item: str


@app.post('/rules/preflight/done')
def rules_preflight_done(d: DoneItem):
    if d.item not in ('esim', 'alipay', 'transfer', 'car', 'permissions', 'pack', 'passport'):
        raise HTTPException(400, 'unknown item %s' % d.item)
    trip.done_items.add(d.item)
    return rules.preflight(trip.get_trip(), trip.done_items)


@app.get('/rules/transport')
def rules_transport(landed_at: Optional[str] = None, bags: Optional[int] = None, adults: Optional[int] = None,
                    airport: str = 'PVG', weather: str = 'clear'):
    t = trip.get_trip()
    if 'transfer' in trip.done_items:
        t['transfer_booked'] = True
    if bags is not None:
        t['flight']['checked_bags'] = bags
    if adults is not None:
        t['flight']['adults'] = adults
    if landed_at is None and trip.landed_at:
        landed_at = trip.landed_at[11:16]
    return rules.transport(t, landed_at=landed_at, airport=airport, weather=weather)
