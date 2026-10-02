# -*- coding: utf-8 -*-
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import pytest


@pytest.fixture(autouse=True)
def _isolate(monkeypatch):
    """每个用例前重置共享状态；HTTP 识别用例不真调模型。"""
    from app import trip, kb
    import stuck
    trip.reset()
    kb.feedback.clear()
    if not os.environ.get('LIVE_MODEL'):
        def fake(kb_, image, text):
            raise RuntimeError('model disabled in tests')
        monkeypatch.setattr(stuck, 'classify_with_model', fake)
    yield
    trip.reset()
