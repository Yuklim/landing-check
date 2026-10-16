# -*- coding: utf-8 -*-
"""调一遍携程营销 MCP，把演示行程的真实数据写进 backend/mock/live_snapshot.json（离线兜底用）。

    python backend/tools/refresh_live_snapshot.py            # Token 取 TRIP_MCP_TOKEN 或 backend/.env

失败的块保留旧快照，命令以非 0 退出。快照只存归一化后的数据，不存 Token。
"""
import os, sys, json

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
os.environ['LC_LIVE'] = 'on'
import live, tripmcp
from mock import MockTrip


def main():
    if not tripmcp.token():
        sys.exit('没有 TRIP_MCP_TOKEN（环境变量或 backend/.env）')
    store = live.LiveStore(ttl=0)
    trip = live.enrich(MockTrip().get_trip(), store, wait=True)
    for k, e in store.errors.items():
        print('失败 %-8s %s' % (k, e['error']))
    for k, c in store.cache.items():
        d = c['data']
        size = len(d) if isinstance(d, list) else len(json.dumps(d, ensure_ascii=False)) if d else 0
        print('实时 %-8s %s  %s' % (k, c['fetched_at'], size))
    store.save_snapshot()
    print('已写入', os.path.relpath(store.path))
    print('航班 %s → %s · 酒店 %s %s · 租车 %s' % (trip['flight']['scheduled_departure'], trip['flight']['scheduled_arrival'],
                                          trip['hotel'].get('name_zh'), trip['hotel'].get('address_zh'), (trip.get('car_offer') or {}).get('from_price')))
    sys.exit(1 if store.errors else 0)


if __name__ == '__main__':
    main()
