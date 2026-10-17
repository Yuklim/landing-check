/* 由 tools/capture_airport.py 生成，勿手改 */
Demo03.register("airport", {
 "title": "落地与机场（总结）",
 "shots": {
  "preflight": {
   "src": "shots/preflight.png"
  },
  "step1": {
   "src": "shots/step1.png"
  },
  "online": {
   "src": "shots/online.png"
  },
  "step3": {
   "src": "shots/step3.png"
  },
  "genie": {
   "src": "shots/genie.png"
  },
  "genie-load": {
   "src": "shots/genie-load.png"
  },
  "genie-res": {
   "src": "shots/genie-res.png",
   "scroll": {
    "src": "shots/genie-res-scroll.png",
    "x": 0,
    "y": 102,
    "w": 393,
    "h": 620,
    "contentH": 1724
   }
  },
  "genie-ok": {
   "src": "shots/genie-ok.png"
  },
  "done": {
   "src": "shots/done.png",
   "scroll": {
    "src": "shots/done-scroll.png",
    "x": 0,
    "y": 54,
    "w": 393,
    "h": 728,
    "contentH": 758
   }
  },
  "share": {
   "src": "shots/share.png"
  },
  "compose": {
   "src": "shots/compose.png"
  },
  "explore": {
   "src": "shots/explore.png"
  },
  "post": {
   "src": "shots/post.png"
  }
 },
 "steps": [
  {
   "beat": "一步一个任务"
  },
  {
   "show": "step1",
   "hold": 0.35
  },
  {
   "tap": [
    196,
    762
   ],
   "dur": 0.55,
   "hold": 0.05
  },
  {
   "show": "online",
   "via": "push",
   "dur": 0.4,
   "hold": 0.3
  },
  {
   "tap": [
    196,
    721
   ],
   "dur": 0.55,
   "hold": 0.05
  },
  {
   "show": "step3",
   "via": "push",
   "dur": 0.4,
   "hold": 0.35
  },
  {
   "beat": "随时可求助"
  },
  {
   "zoom": [
    342,
    116,
    1.9
   ],
   "dur": 0.5,
   "hold": 0.35
  },
  {
   "show": "preflight",
   "via": "fade",
   "dur": 0.3,
   "hold": 0.55
  },
  {
   "show": "online",
   "via": "fade",
   "dur": 0.3,
   "hold": 0.55
  },
  {
   "show": "step3",
   "via": "fade",
   "dur": 0.3,
   "hold": 0.3
  },
  {
   "zoom": null,
   "dur": 0.4,
   "hold": 0.05
  },
  {
   "tap": [
    338,
    74
   ],
   "dur": 0.6
  },
  {
   "show": "genie",
   "via": "up",
   "hold": 0.25
  },
  {
   "tap": [
    102,
    751
   ],
   "dur": 0.6
  },
  {
   "show": "genie-load",
   "via": "fade",
   "dur": 0.3,
   "hold": 0.7
  },
  {
   "beat": "AI 识别 + 备用方案"
  },
  {
   "show": "genie-res",
   "via": "fade",
   "dur": 0.35,
   "hold": 0.1
  },
  {
   "scroll": 591,
   "dur": 0.9,
   "hold": 1.1
  },
  {
   "scroll": 871,
   "dur": 0.9,
   "hold": 1.0
  },
  {
   "tap": [
    58,
    685
   ],
   "dur": 0.6,
   "hold": 0
  },
  {
   "show": "genie-ok",
   "via": "none",
   "hold": 0.5
  },
  {
   "beat": "落地完成"
  },
  {
   "show": "step3",
   "via": "down",
   "dur": 0.45,
   "hold": 0.1
  },
  {
   "tap": [
    196,
    687
   ],
   "dur": 0.6
  },
  {
   "show": "done",
   "via": "push",
   "dur": 0.45,
   "hold": 1.0
  },
  {
   "beat": "分享票根"
  },
  {
   "tap": [
    196,
    406
   ],
   "dur": 0.6
  },
  {
   "show": "share",
   "via": "push",
   "dur": 0.45,
   "hold": 0.9
  },
  {
   "tap": [
    196,
    465
   ],
   "dur": 0.6
  },
  {
   "beat": "发到社区"
  },
  {
   "show": "compose",
   "via": "push",
   "dur": 0.45,
   "hold": 0.8
  },
  {
   "tap": [
    196,
    734
   ],
   "dur": 0.6
  },
  {
   "show": "explore",
   "via": "push",
   "dur": 0.45,
   "hold": 1.0
  },
  {
   "tap": [
    196,
    453
   ],
   "dur": 0.6
  },
  {
   "show": "post",
   "via": "push",
   "dur": 0.45,
   "hold": 1.2
  }
 ]
});
