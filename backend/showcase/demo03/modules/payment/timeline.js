Demo03.register('payment', {
 "title": "支付",
 "shots": {
  "preflight": {
   "src": "shots/preflight.png",
   "scroll": {
    "src": "shots/preflight-scroll.png",
    "x": 0,
    "y": 54,
    "w": 393,
    "h": 728,
    "contentH": 915
   }
  },
  "paysetup": {
   "src": "shots/paysetup.png"
  },
  "cydf": {
   "src": "shots/cydf.png"
  },
  "paying": {
   "src": "shots/paying.png"
  },
  "payment": {
   "src": "shots/payment.png"
  },
  "preflight_done": {
   "src": "shots/preflight_done.png",
   "scroll": {
    "src": "shots/preflight_done-scroll.png",
    "x": 0,
    "y": 54,
    "w": 393,
    "h": 728,
    "contentH": 818
   }
  }
 },
 "steps": [
  {
   "beat": "支付宝 + TenPayGo"
  },
  {
   "show": "preflight",
   "hold": 0.6
  },
  {
   "hl": [
    12,
    524,
    369,
    68
   ],
   "label": "境内支付待办",
   "hold": 0.8
  },
  {
   "tap": [
    322,
    558
   ]
  },
  {
   "show": "paysetup",
   "via": "push",
   "hold": 0.5
  },
  {
   "hl": [
    12,
    228,
    369,
    184
   ],
   "label": "二选一即可",
   "hold": 0.9
  },
  {
   "beat": "退回或捐赠"
  },
  {
   "hl": [
    12,
    452,
    369,
    169
   ],
   "label": "退回或捐赠",
   "hold": 0.8
  },
  {
   "tap": [
    344,
    647
   ],
   "hold": 0
  },
  {
   "show": "cydf",
   "via": "fade",
   "dur": 0.35,
   "hold": 1.1
  },
  {
   "tap": [
    196,
    800
   ],
   "hold": 0
  },
  {
   "show": "paysetup",
   "via": "fade",
   "dur": 0.3,
   "hold": 0.3
  },
  {
   "beat": "¥1 真实验证"
  },
  {
   "tap": [
    196,
    796
   ],
   "hold": 0
  },
  {
   "show": "paying",
   "via": "none",
   "hold": 0.8
  },
  {
   "show": "payment",
   "via": "push",
   "hold": 0.5
  },
  {
   "beat": "链路已打通"
  },
  {
   "hl": [
    14,
    104,
    365,
    287
   ],
   "label": "¥1 验证成功",
   "hold": 0.4
  },
  {
   "zoom": [
    196,
    303,
    1.3
   ],
   "hold": 1.2
  },
  {
   "zoom": null
  },
  {
   "clear": true
  },
  {
   "hl": [
    12,
    397,
    369,
    122
   ],
   "label": "已捐给 CYDF",
   "hold": 0.8
  },
  {
   "tap": [
    196,
    751
   ],
   "hold": 0
  },
  {
   "show": "preflight_done",
   "via": "pop",
   "hold": 0.4
  },
  {
   "scroll": 90,
   "dur": 0.8,
   "hold": 0.2
  },
  {
   "hl": [
    14,
    723,
    365,
    56
   ],
   "label": "支付已就绪",
   "hold": 1.1
  }
 ]
});
