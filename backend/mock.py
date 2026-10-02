# -*- coding: utf-8 -*-
"""模拟携程数据：行程、航班状态、1 元支付验证。全部内存态，重启归零。"""
import os, json, time, random, threading
from datetime import datetime, timezone, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
CST = timezone(timedelta(hours=8))


def _load(name):
    return json.load(open(os.path.join(HERE, 'mock', name), encoding='utf-8'))


class MockTrip:
    def __init__(self):
        self.trip = _load('trip.json')
        self._lock = threading.Lock()
        self.reset()

    def reset(self):
        with self._lock:
            self.flight_status = 'scheduled'          # scheduled | departed | landed
            self.landed_at = None
            self.payment = {'status': 'not_verified', 'tx': None, 'verified_at': None}
            self.done_items = set()
            self.events = []                           # 时间线：landed / online / payment / in_car / arrived

    def now(self):
        return datetime.now(CST).strftime('%Y-%m-%d %H:%M:%S')

    # ---------- 行程 ----------
    def get_trip(self):
        t = dict(self.trip)
        t['flight'] = {**t['flight'], 'status': self.flight_status, 'landed_at': self.landed_at}
        t['payment'] = self.payment
        return t

    # ---------- 航班 ----------
    def get_flight(self):
        return {**self.trip['flight'], 'status': self.flight_status, 'landed_at': self.landed_at}

    def depart(self):
        with self._lock:
            self.flight_status = 'departed'
        return self.get_flight()

    def land(self):
        with self._lock:
            self.flight_status = 'landed'
            self.landed_at = self.now()
            self.events.append({'event': 'landed', 'at': self.landed_at})
        return self.get_flight()

    # ---------- 1 元支付验证 ----------
    def pay_test(self, fail: bool = False, delay: float = 1.5):
        time.sleep(delay)
        if fail:
            code = random.choice(['CARD_NOT_SUPPORTED', 'RISK_REJECT', 'LIMIT_EXCEEDED'])
            hint = {'CARD_NOT_SUPPORTED': 'Try a Visa or Mastercard from another bank.',
                    'RISK_REJECT': 'Turn off VPN-like network tools and retry in 10 minutes.',
                    'LIMIT_EXCEEDED': 'Complete Alipay identity verification, then retry.'}[code]
            return {'status': 'failed', 'error_code': code, 'hint': hint, 'entry_id': 'alipay_card_bind_failed'}
        with self._lock:
            tx = 'TRIP%d' % int(time.time())
            self.payment = {'status': 'verified', 'tx': tx, 'verified_at': self.now(), 'amount': 1.00, 'currency': 'CNY',
                            'refund': 'issued', 'card': 'Visa ••4471'}
            self.done_items.add('alipay')
            self.events.append({'event': 'payment', 'at': self.payment['verified_at']})
        return self.payment

    def mark_done(self, item: str):
        with self._lock:
            self.done_items.add(item)

    # ---------- 事件时间线 ----------
    def mark(self, event: str):
        with self._lock:
            for e in self.events:
                if e['event'] == event:
                    return e                      # 同一事件只记第一次
            rec = {'event': event, 'at': self.now()}
            self.events.append(rec)
        return rec

    def timeline(self):
        return self.events
