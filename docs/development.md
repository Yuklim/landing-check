# 开发指南

这里记录初赛原型的运行和维护方式。产品介绍见[仓库首页](../README.md)，交付文件见[初赛材料索引](../submission-final/README.md)。

## 启动服务

在仓库根目录执行，下面的环境变量示例使用 Windows PowerShell：

```powershell
python -m pip install -r backend/requirements.txt
python -m uvicorn app:app --app-dir backend --host 127.0.0.1 --port 8000
```

| 地址 | 用途 |
|---|---|
| `http://127.0.0.1:8000/app/index.html` | 带后端的 H5 原型 |
| `http://127.0.0.1:8000/showcase/` | 项目展示页，支持视频分段加载与拖动进度 |
| `http://127.0.0.1:8000/test` | 截图识别测试台 |
| `http://127.0.0.1:8000/docs` | 当前代码生成的 API 文档 |

macOS / Linux 可使用相同的 Python 命令；也可运行 `sh backend/run.sh`，该脚本会读取本地 `backend/.env`。

### 模型配置

FastAPI 启动前，在同一个 PowerShell 终端设置进程环境变量：

```powershell
$env:DEEPSEEK_API_KEY = '填入自己的密钥'
$env:DEEPSEEK_MODEL = 'deepseek-flash'
python -m uvicorn app:app --app-dir backend --host 127.0.0.1 --port 8000
```

可配置项见 [`backend/.env.example`](../backend/.env.example)。直接运行 uvicorn 不会自动读取 `.env`；未配置密钥时，文字描述可使用关键词规则兜底，截图不会得到真实模型识别结果。API 密钥只由后端使用。

### 静态原型与状态

H5 后端接入代码位于 [`h5/app.js`](../h5/app.js)，接口不可达时退回静态展示。模拟航班、支付验证、行前检查和反馈等运行时状态保存在内存中，服务重启后重置；H5 菜单也提供重置演示数据入口。

## 验证

后端回归不需要启动单独的服务：

```powershell
python -m pytest -q backend/tests
```

H5 端到端测试会自行启动本地服务，需要 Playwright 和浏览器。使用本机 Chrome 时：

```powershell
python -m pip install playwright
$env:E2E = '1'
$env:E2E_CHANNEL = 'chrome'
python -m pytest -q backend/tests
```

没有 Chrome 时，先运行 `python -m playwright install chromium`，再清除 `E2E_CHANNEL`，使用 Playwright 自带 Chromium。真实模型测试默认跳过；只有主动设置 `LIVE_MODEL=1` 且配置模型密钥时才执行。

展示页检查需要先启动服务：

```powershell
python backend/tools/check_showcase.py --url http://127.0.0.1:8000/showcase/
```

检查涵盖中英文、来源弹窗、键盘操作、页内视频和多尺寸布局，截图写到系统临时目录。默认使用 Chrome，也可以加 `--channel chromium`。

2026-10-07 的回归记录见[最终演示版检查](final-review-2026-10-07.md)，其中的测试数量和界面描述对应当日版本，不代表每次文档更新都重新执行了全部测试。

## 更新界面和知识库

### H5

设计源文件为 [`appearance.pen`](../appearance.pen)。在 pen.dev 中导出 `html-css` 到 `h5/screens-css.html` 后执行：

```powershell
Push-Location h5
python build_h5.py
Pop-Location
```

`h5/index.html` 是生成物。点击跳转在 `h5/build_h5.py` 的 `BIND` 中配置，后端数据与运行时交互在 `h5/app.js` 中维护。

### 知识库与教程

正式条目位于 `知识库/entries/*.json`，字段见[格式说明](../知识库/entries/schema.md)。修改后运行：

```powershell
python 知识库/tools/validate_entries.py
```

脚本会校验条目，并生成同名 Markdown 预览和 `h5/tutorials.json`。图文教程的素材位于 `h5/img/tutorial/`，有 `media` 字段的条目会出现在教程列表中；可用 `h5/?tutorial=<条目id>&step=<n>` 直接进入某一步。

模型只负责匹配条目，不直接改写知识库中的解决步骤。未命中条目时生成的建议带有 `unverified` 标记；教程中的第三方占位图需要在正式使用前替换或确认授权。

### 展示页

固定中文文案在 `backend/showcase/index.html`，英文在 `app.js` 的 `english` 对象；视频、封面和原型链接由 `content-config.js` 配置。更详细的维护说明见[展示页 README](../backend/showcase/README.md)。

## 接口导航

| 模块 | 接口 |
|---|---|
| 知识库 | `GET /kb/scenarios`、`GET /kb/entries`、`GET /kb/entry/{id}`、`GET /kb/search?q=` |
| I’m Stuck | `POST /stuck/classify`，接收截图或文字，返回条目、候选或未知结果 |
| 行前与交通规则 | `GET /rules/preflight`、`POST /rules/preflight/done`、`GET /rules/transport` |
| 演示数据 | `/mock/trip`、`/mock/flight`、`/mock/pay-test`、`/mock/timeline`、`/mock/reset` 等 |
| 反馈 | `POST /kb/feedback`、`POST /feedback/hardest` |
| 健康检查 | `GET /health`，返回部署提交与知识库场景 |

完整参数、方法和响应结构以服务的 `/docs` 为准。早期的[后端方案](../后端方案.md)包含尚未落地的设计。

## 部署

GitHub Pages 从 `main` 的仓库根目录发布，根入口转向 `backend/showcase/`，H5 位于 `/h5/`。展示页视频使用浏览器原生播放器，直接在当前页面播放。

Render Web Service 的根目录为 `backend/`，启动命令为：

```sh
uvicorn app:app --host 0.0.0.0 --port $PORT
```

在 Render 中设置 `DEEPSEEK_API_KEY`。只修改知识库时，应确认构建过滤器包含 `知识库/**`，或手动触发部署；模拟数据随进程重启归零。

代码发布后，打开 `/health` 核对实际部署提交，并确认场景包含 `tenpaygo`。纯文档整理不要求后端重新部署到相同提交，但涉及 API 或知识库改动时需要确认部署结果。

## 提交范围

源码、正式知识库条目、必要的演示资源和文档进入 Git。依赖、日志、渲染缓存、登录态工作目录和本地用户截图不进入公开仓库。初赛交付文件保存在 [Release](https://github.com/Yuklim/landing-check/releases/tag/v0.1.0-preliminary)，仓库中的 `submission-final/` 只跟踪说明、文件清单和校验值，避免把两版大视频重复放入 Git 历史。
