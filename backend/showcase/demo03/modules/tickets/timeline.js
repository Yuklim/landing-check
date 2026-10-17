// 由 tools/capture_tickets.py 生成，勿手改
Demo03.register('tickets', {
 "title": "门票与预约",
 "shots": {
  "home": {
   "src": "shots/home.png"
  },
  "hotels": {
   "src": "shots/hotels.png"
  },
  "attractions": {
   "src": "shots/attractions.png"
  },
  "car": {
   "src": "shots/car.png"
  },
  "guides": {
   "src": "shots/guides.png"
  },
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
  }
 },
 "steps": [
  {
   "show": "home",
   "hold": 0.5
  },
  {
   "beat": "Trip.com 已有服务"
  },
  {
   "tap": [
    58,
    176
   ],
   "dur": 0.55,
   "hold": 0.05
  },
  {
   "show": "hotels",
   "via": "push",
   "dur": 0.45,
   "hold": 0.7
  },
  {
   "beat": "一键直达"
  },
  {
   "show": "home",
   "via": "pop",
   "dur": 0.4,
   "hold": 0.15
  },
  {
   "tap": [
    123,
    252
   ],
   "dur": 0.55,
   "hold": 0.05
  },
  {
   "show": "attractions",
   "via": "push",
   "dur": 0.45,
   "hold": 0.7
  },
  {
   "show": "home",
   "via": "pop",
   "dur": 0.4,
   "hold": 0.15
  },
  {
   "tap": [
    196,
    252
   ],
   "dur": 0.55,
   "hold": 0.05
  },
  {
   "show": "car",
   "via": "push",
   "dur": 0.45,
   "hold": 0.7
  },
  {
   "show": "home",
   "via": "pop",
   "dur": 0.4,
   "hold": 0.15
  },
  {
   "tap": [
    270,
    419
   ],
   "dur": 0.55,
   "hold": 0.05
  },
  {
   "show": "guides",
   "via": "push",
   "dur": 0.45,
   "hold": 0.7
  },
  {
   "show": "home",
   "via": "pop",
   "dur": 0.4,
   "hold": 0.15
  },
  {
   "tap": [
    49,
    419
   ],
   "dur": 0.6,
   "hold": 0.05
  },
  {
   "show": "preflight",
   "via": "push",
   "dur": 0.45,
   "hold": 0.35
  },
  {
   "beat": "行前清单也接入"
  },
  {
   "scroll": 187,
   "dur": 0.9,
   "hold": 0.2
  },
  {
   "hl": [
    28,
    451,
    337,
    263
   ],
   "label": "Optional · 携程服务",
   "hold": 1.0
  }
 ]
});
