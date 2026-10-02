# Landing Check · 外国散客落地中国的第一小时

Trip Hackathon 2026 高校赛 · 赛题一「旅行中国搭子 · 入境游 AI 创新」

在 Trip.com App 内新增「落地检查」：外国散客落地中国机场那一刻，先检测自己的数据能否上网，再按顺序解决上网、支付、到酒店三件事，一次只给一个任务，无网也能用。支付在起飞前用一笔 1 元真实交易验证，接机在起飞前预订。

## 目录

| 路径 | 内容 |
|---|---|
| `h5/index.html` | 可点击的 H5 原型，十五屏，手机浏览器可直接打开 |
| `h5/build_h5.py` | 从 Pen 导出的 HTML 组装 H5 的脚本，点击绑定写在里面 |
| `demo/flow.html` | 带讲解词的流程演示页（引用 exports 里的图） |
| `LandingCheck-流程演示.html` | 流程演示的单文件版，可直接发人 |
| `exports/` | 十五屏 PNG 导出和总览图 |
| `appearance.pen` | 设计源文件（pen.dev） |
| `携程Hackathon-落地助手方案.md` | 方案报告 |
| `报名-参赛想法简述*.md/.txt` | 报名材料 |

## 在线演示

GitHub Pages：见仓库 About 栏的链接，或 `https://<user>.github.io/<repo>/h5/`

## 本地运行

```bash
cd h5 && python3 -m http.server 8787
# 浏览器打开 http://127.0.0.1:8787/index.html
```

## 更新 H5

在 pen.dev 里修改 `appearance.pen` 后，导出 html-css 到 `h5/screens-css.html`，然后：

```bash
cd h5 && python3 build_h5.py
```

## 协作约定

- 设计改动走 `appearance.pen`，不要直接手改 `h5/index.html`，它是生成物。
- 点击跳转在 `h5/build_h5.py` 的 `BIND` 列表里加一行即可。
- 真实数据、接口密钥不要提交到仓库。
