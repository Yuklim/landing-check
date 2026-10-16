# -*- coding: utf-8 -*-
"""携程营销 MCP（trip-mkt-mcp-function）客户端：直接 HTTP 调 tools/call，不走 initialize。

文档：仓库根目录 MCP使用文档.pdf。Token 只从环境变量 TRIP_MCP_TOKEN 或 backend/.env 读，不进仓库、不下发前端。
"""
import os, json, time, threading, urllib.request, urllib.error

URL = os.environ.get('TRIP_MCP_URL', 'https://u.ctrip.com/faas/mcp')
HERE = os.path.dirname(os.path.abspath(__file__))

# 客户端限速：全局最小请求间隔（秒）。刷新快照时 flight/hotel/tickets/car/train 可能并发或连续
# 发起多次调用（tickets 每个景点一次），这里把所有请求串成至少隔 MIN_INTERVAL 秒发一个，避免打满营销 MCP 频控。
# TRIP_MCP_MIN_INTERVAL=0 关闭限速。
MIN_INTERVAL = float(os.environ.get('TRIP_MCP_MIN_INTERVAL', '1.0'))
_rate_lock = threading.Lock()
_last_call = 0.0


def _throttle():
    """阻塞到距上一次请求发起至少 MIN_INTERVAL 秒。线程安全：多块并发刷新时请求发起点被串行间隔开。"""
    global _last_call
    if MIN_INTERVAL <= 0:
        return
    with _rate_lock:
        wait = _last_call + MIN_INTERVAL - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        _last_call = time.monotonic()


class McpError(Exception):
    """调用失败：鉴权、频控、参数不合法、无结果、网络超时都归到这里，message 是服务端原话或异常。"""


def token() -> str:
    t = os.environ.get('TRIP_MCP_TOKEN', '').strip()
    if t:
        return t
    # 直接跑 uvicorn 时没有 run.sh 帮忙加载 .env，这里只补这一个变量
    try:
        for line in open(os.path.join(HERE, '.env'), encoding='utf-8'):
            k, _, v = line.strip().partition('=')
            if k == 'TRIP_MCP_TOKEN':
                return v.strip().strip('"\'')
    except OSError:
        pass
    return ''


def call(tool: str, args: dict, timeout: float = 10.0):
    """调用一个工具，返回 result.content[0].text 解析后的 JSON。服务端用纯文本报错（请求失败 / 查询无结果 / 数据不合法）。"""
    tk = token()
    if not tk:
        raise McpError('no token')
    body = json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': 'tools/call',
                       'params': {'name': tool, 'arguments': args}}, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(URL, data=body, method='POST', headers={
        'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream',
        'Authorization': 'Bearer ' + tk})
    _throttle()
    try:
        raw = urllib.request.urlopen(req, timeout=timeout).read().decode('utf-8')
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise McpError('network: %s' % e) from e
    msg = None
    # 响应是 SSE：event: message / data: {...}。只按 \n 切：笔记正文里有 U+2028，splitlines() 会把它当换行切断 JSON
    for line in raw.split('\n'):
        if line.startswith('data:'):
            msg = json.loads(line[5:].strip())
    if msg is None:
        msg = json.loads(raw)
    if msg.get('error'):
        raise McpError(str(msg['error'].get('message') or msg['error']))
    content = (msg.get('result') or {}).get('content') or []
    text = content[0].get('text', '') if content else ''
    try:
        return json.loads(text)
    except ValueError:
        raise McpError(text or 'empty result')
