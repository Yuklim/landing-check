# -*- coding: utf-8 -*-
"""模拟携程数据：行程、航班状态、1 元支付验证。全部内存态，重启归零。"""
import os, json, time, random, threading
from datetime import datetime, timezone, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
CST = timezone(timedelta(hours=8))
PAY_METHODS = {'alipay': 'Alipay', 'tenpaygo': 'TenPayGo'}     # 支付组：任一个验证通过即就绪

# 模拟失败：错误码 -> (提示, 对应知识库条目)。支付宝三种沿用原来的，TenPayGo 三种见 docs/tenpaygo/02-PRD.md §6
PAY_ERRORS = {
    'alipay': {
        'CARD_NOT_SUPPORTED': ('Try a Visa or Mastercard from another bank.', 'alipay_card_bind_failed'),
        'RISK_REJECT': ('Turn off VPN-like network tools and retry in 10 minutes.', 'alipay_card_bind_failed'),
        'LIMIT_EXCEEDED': ('Complete Alipay identity verification, then retry.', 'alipay_card_bind_failed'),
    },
    'tenpaygo': {
        'ISSUER_DECLINED': ('The bank did not approve this transaction. Allow international online payments in your bank app, then retry.', 'tenpaygo_card_bind_failed'),
        'AUTH_FAILED': ("Your bank's 3-D Secure check was not completed. Keep your bank reachable and retry once.", 'tenpaygo_payment_declined'),
        'REGION_UNAVAILABLE': ('TenPayGo only charges inside mainland China. Retest after landing, or verify Alipay now.', 'tenpaygo_setup_before_flight'),
    },
}


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
            self.payments = {m: {'method': m, 'status': 'not_verified', 'tx': None, 'verified_at': None} for m in PAY_METHODS}
            self.done_items = set()
            self.events = []                           # 时间线：landed / online / payment / in_car / arrived

    def now(self):
        return datetime.now(CST).strftime('%Y-%m-%d %H:%M:%S')

    @property
    def payment(self):
        """兼容旧调用方：最先验证成功的那种方式；都没验证时是支付宝。"""
        ok = sorted((p for p in self.payments.values() if p['status'] == 'verified'), key=lambda p: p['verified_at'])
        return ok[0] if ok else self.payments['alipay']

    # ---------- 行程 ----------
    def get_trip(self):
        t = dict(self.trip)
        t['flight'] = {**t['flight'], 'status': self.flight_status, 'landed_at': self.landed_at}
        t['payment'] = self.payment
        t['payments'] = {m: dict(p) for m, p in self.payments.items()}
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
    def pay_test(self, fail: bool = False, delay: float = 1.5, method: str = 'alipay'):
        if method not in PAY_METHODS:
            raise ValueError('unknown payment method %s' % method)
        time.sleep(delay)
        if fail:
            code = random.choice(sorted(PAY_ERRORS[method]))
            hint, entry = PAY_ERRORS[method][code]
            return {'method': method, 'status': 'failed', 'error_code': code, 'hint': hint, 'entry_id': entry}
        with self._lock:
            tx = 'TRIP%d' % int(time.time())
            p = {'method': method, 'status': 'verified', 'tx': tx, 'verified_at': self.now(), 'amount': 1.00, 'currency': 'CNY',
                 'refund': 'issued', 'card': 'Visa ••4471'}
            self.payments[method] = p
            self.done_items.add(method)
            self.events.append({'event': 'payment', 'method': method, 'at': p['verified_at']})
        return dict(p)

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
