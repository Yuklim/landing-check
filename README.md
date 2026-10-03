# Landing Check · 外国散客落地中国的第一小时

Trip Hackathon 2026 高校赛 · 赛题一「旅行中国搭子 · 入境游 AI 创新」

在 Trip.com App 内新增「落地检查」：外国散客落地中国机场那一刻，先检测自己的数据能否上网，再按顺序解决上网、支付、到酒店三件事，一次只给一个任务。支付在起飞前用一笔 1 元真实交易验证，接机和租车在起飞前预订。卡住了拍一张截图，AI 认出场景，答案来自人工核验的知识库。

**在线演示（静态版）** https://yuklim.github.io/landing-check/h5/
**流程讲解页** `LandingCheck-流程演示.html`（单文件，可直接发人）

## 现在能跑什么

| 部分 | 状态 | 说明 |
|---|---|---|
| H5 原型，18 屏 | 可用 | 设计稿导出 + 点击绑定，手机浏览器可开，可添加到主屏幕 |
| 后端接口 | 可用，本机 | FastAPI：知识库、识别、模拟携程数据、规则引擎，37 个测试 |
| "我卡住了"识别 | 可用 | DeepSeek `deepseek-flash` 看截图选条目，置信度分档，规则兜底 |
| 知识库 | 1 个场景 | 支付宝 8 条，含来源和核验日期；资料库 88 篇待写成条目 |
| 公网后端（Render） | 未部署 | 部署后 H5 加 `?api=` 即接上 |
| 离线包 / Service Worker | 未做 | 方案承诺项，初赛前完成 |
| 多语言预翻译 | 未做 | 同上 |

## 快速开始

```bash
# 后端（会自动读 backend/.env 或 ~/.claude-deepseek.env 里的 DeepSeek 密钥）
~/Desktop/携程Hackathon/backend/run.sh
# 打开 http://127.0.0.1:8000/app/index.html   带后端的 H5
#      http://127.0.0.1:8000/test             识别测试台：拖截图即测
#      http://127.0.0.1:8000/docs             接口文档

# 停止
lsof -iTCP:8000 -sTCP:LISTEN -t | xargs kill

# 测试
cd backend && python3 -m pytest -q tests
```

首次运行先装依赖：`pip install -r backend/requirements.txt`，并复制 `backend/.env.example` 为 `.env` 填入 `DEEPSEEK_API_KEY`。

## 目录

```
h5/                 可点击 H5
  index.html          生成物，不要手改
  app.js              后端接入层：运行时把设计稿文字替换成接口数据，后端不可达时退回静态
  build_h5.py         从 Pen 导出的 HTML 组装 H5，点击绑定在 BIND 列表
backend/            FastAPI
  app.py              路由   kb.py 知识库   stuck.py 识别   rules.py 规则   mock.py 模拟携程数据
  prompts/classify.txt  分类提示词
  mock/*.json         演示行程、机场数据（标 verified:false 的待核验）、交通方案
  tests/              pytest
知识库/
  entries/            正式条目（JSON）+ schema.md 格式说明 + 校验脚本生成的 .md 预览
  raw/                抓取的原始资料 88 篇，按来源分目录，README.md 按场景索引
  tools/              抓取与校验脚本
exports/            18 屏 PNG 和总览图
demo/flow.html      带讲解词的流程演示（引用 exports）
appearance.pen      设计源文件（pen.dev）
携程Hackathon-落地助手方案.md   产品方案
后端方案.md                     后端方案（接口契约、部署、顺序）
报名-参赛想法简述*.md/.txt       报名材料
```

## 接口一览

| 接口 | 作用 |
|---|---|
| `GET /kb/scenarios` `GET /kb/entries` `GET /kb/entry/{id}` `GET /kb/search?q=` | 知识库查询，`lang` 指定语言，无翻译时回落英文 |
| `POST /stuck/classify` | 上传截图或一句话，返回 `decision`（answer / ask / unknown）、条目或候选、置信度、`mode`（model / rules） |
| `GET /rules/preflight` `POST /rules/preflight/done` | 行前检查项状态 |
| `GET /rules/transport?landed_at=HH:MM&bags=&adults=` | 交通推荐，带上客点和理由 |
| `GET /mock/trip` `GET /mock/flight` `POST /mock/flight/land` `POST /mock/pay-test?fail=1` `POST /mock/event` `GET /mock/timeline` `POST /mock/reset` | 模拟携程数据与演示开关 |
| `POST /kb/feedback` `POST /feedback/hardest` | 用户反馈 |

设计原则：模型只返回知识库里存在的条目 id，答案文字全部来自条目；只有判为未知时才生成建议并标 `unverified`。

## 更新 H5

在 pen.dev 修改 `appearance.pen` 后，导出 `html-css` 到 `h5/screens-css.html`，然后：

```bash
cd h5 && python3 build_h5.py
```

## 协作约定

- 设计改动走 `appearance.pen`，`h5/index.html` 是生成物。
- 点击跳转在 `h5/build_h5.py` 的 `BIND` 里加；接后端的逻辑在 `h5/app.js`。
- 知识库条目按 `知识库/entries/schema.md` 写，提交前跑 `python3 知识库/tools/validate_entries.py`。
- 密钥只放 `backend/.env`，不进仓库。公开仓库，用户数据和真实接口密钥一律不提交。

## 下一步

1. 部署后端到 Render，手机可用
2. 补微信支付、滴滴、上网三个场景的知识库条目
3. 用真机截图验证识别，调阈值
4. 离线包 + Service Worker；预翻译
5. 初赛材料：方案 PDF、演示视频
