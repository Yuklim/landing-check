/* 由 tools/capture_network.py 生成，请勿手改 */
Demo03.register('network', {
 "title": "上网与通讯",
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
  "esim": {
   "src": "shots/esim.png",
   "scroll": {
    "src": "shots/esim-scroll.png",
    "x": 0,
    "y": 0,
    "w": 393,
    "h": 852,
    "contentH": 1244
   }
  },
  "esim-toast": {
   "src": "shots/esim-toast.png"
  },
  "lock": {
   "src": "shots/lock.png"
  },
  "step1": {
   "src": "shots/step1.png"
  },
  "wifi": {
   "src": "shots/wifi.png"
  },
  "offline-guide": {
   "src": "shots/offline-guide.png",
   "scroll": {
    "src": "shots/offline-guide-scroll.png",
    "x": 0,
    "y": 134,
    "w": 393,
    "h": 718,
    "contentH": 727
   }
  },
  "offline-help": {
   "src": "shots/offline-help.png"
  }
 },
 "steps": [
  {
   "beat": "行前：买 eSIM"
  },
  {
   "show": "preflight",
   "hold": 0.6
  },
  {
   "hl": [
    14,
    331,
    365,
    162
   ],
   "label": "待办：手机流量",
   "hold": 0.8
  },
  {
   "tap": [
    196,
    455
   ]
  },
  {
   "show": "esim",
   "via": "push",
   "hold": 0.4
  },
  {
   "hl": [
    25,
    272,
    113,
    92
   ],
   "label": "中国大陆套餐",
   "hold": 0.5
  },
  {
   "tap": [
    82,
    318
   ]
  },
  {
   "show": "esim-toast",
   "via": "fade",
   "dur": 0.25,
   "hold": 0.8
  },
  {
   "beat": "已落地：先联网"
  },
  {
   "show": "lock",
   "via": "fade",
   "dur": 0.6,
   "hold": 0.3
  },
  {
   "hl": [
    9,
    610,
    375,
    127
   ],
   "label": "已落地 · 浦东 T2",
   "hold": 1.3
  },
  {
   "tap": [
    196,
    674
   ]
  },
  {
   "show": "step1",
   "via": "up",
   "hold": 0.6
  },
  {
   "hl": [
    71,
    333,
    251,
    43
   ],
   "label": "没检测到流量",
   "hold": 0.9
  },
  {
   "tap": [
    196,
    721
   ]
  },
  {
   "beat": "Wi-Fi 教程"
  },
  {
   "show": "wifi",
   "via": "push",
   "hold": 0.6
  },
  {
   "hl": [
    14,
    104,
    365,
    93
   ],
   "label": "浦东免费 Wi-Fi",
   "hold": 1.2
  },
  {
   "beat": "离线包 + AI 助手兜底"
  },
  {
   "clear": true
  },
  {
   "hl": [
    185,
    56,
    196,
    40
   ],
   "label": "离线包 + Help",
   "hold": 1.0
  },
  {
   "tap": [
    246,
    76
   ]
  },
  {
   "show": "offline-guide",
   "via": "push",
   "hold": 0.9
  },
  {
   "hl": [
    13,
    635,
    367,
    51
   ],
   "label": "没网也能一步步联网",
   "hold": 1.0
  },
  {
   "tap": [
    342,
    78
   ]
  },
  {
   "show": "offline-help",
   "via": "push",
   "hold": 1.6
  },
  {
   "wait": 0.4
  }
 ]
});
