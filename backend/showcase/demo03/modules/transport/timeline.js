/* 由 tools/capture_transport.py 生成，勿手改 */
Demo03.register("transport", {
 "title": "市内交通与打车",
 "shots": {
  "step3": {
   "src": "shots/step3.png"
  },
  "ways": {
   "src": "shots/ways.png",
   "scroll": {
    "src": "shots/ways-scroll.png",
    "x": 0,
    "y": 54,
    "w": 393,
    "h": 728,
    "contentH": 1827
   }
  },
  "route": {
   "src": "shots/route.png",
   "scroll": {
    "src": "shots/route-scroll.png",
    "x": 0,
    "y": 102,
    "w": 393,
    "h": 665,
    "contentH": 948
   }
  },
  "driver": {
   "src": "shots/driver.png"
  }
 },
 "steps": [
  {
   "beat": "高德真实地图"
  },
  {
   "show": "step3",
   "hold": 0.5
  },
  {
   "hl": [
    12,
    165,
    369,
    184
   ],
   "label": "高德真实路线",
   "hold": 1.0
  },
  {
   "beat": "按情况推荐交通"
  },
  {
   "hl": [
    26,
    367,
    215,
    25
   ],
   "label": "按行李推荐",
   "hold": 0.8
  },
  {
   "hl": [
    28,
    394,
    337,
    69
   ],
   "label": "出租车 · 官方排队点",
   "hold": 0.9
  },
  {
   "clear": true
  },
  {
   "tap": [
    196,
    616
   ]
  },
  {
   "show": "ways",
   "via": "fade",
   "dur": 0.3,
   "hold": 0.3
  },
  {
   "scroll": 484,
   "dur": 1.0,
   "hold": 0.3
  },
  {
   "hl": [
    20,
    206,
    353,
    174
   ],
   "label": "打车 / 网约车",
   "hold": 0.8
  },
  {
   "hl": [
    20,
    423,
    353,
    258
   ],
   "label": "地铁 / 磁悬浮",
   "hold": 1.0
  },
  {
   "clear": true
  },
  {
   "beat": "换乘 + 中文路牌"
  },
  {
   "tap": [
    196,
    464
   ]
  },
  {
   "show": "route",
   "via": "push",
   "hold": 0.6
  },
  {
   "hl": [
    2,
    104,
    389,
    256
   ],
   "label": "高德分段路线",
   "hold": 0.9
  },
  {
   "hl": [
    12,
    437,
    369,
    26
   ],
   "label": "磁悬浮 › 地铁",
   "hold": 0.7
  },
  {
   "clear": true
  },
  {
   "scroll": 250,
   "dur": 1.2,
   "hold": 0.3
  },
  {
   "zoom": [
    201.0,
    372.5,
    1.4
   ],
   "hold": 0.2
  },
  {
   "hl": [
    66,
    357,
    270,
    31
   ],
   "label": "中文路牌",
   "hold": 1.2
  },
  {
   "zoom": null
  },
  {
   "clear": true
  },
  {
   "tap": [
    32,
    78
   ],
   "dur": 0.6
  },
  {
   "beat": "司机大字卡"
  },
  {
   "show": "step3",
   "via": "pop",
   "hold": 0.4
  },
  {
   "tap": [
    196,
    494
   ]
  },
  {
   "show": "driver",
   "via": "push",
   "hold": 0.6
  },
  {
   "finger": false
  },
  {
   "hl": [
    18,
    156,
    357,
    193
   ],
   "label": "给司机看的大字卡",
   "hold": 0.9
  },
  {
   "clear": true
  },
  {
   "zoom": [
    196.5,
    252.5,
    1.1
   ],
   "hold": 2.2
  },
  {
   "zoom": null,
   "hold": 0.3
  }
 ]
});
