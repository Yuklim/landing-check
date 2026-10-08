# Landing Check · 外国游客落地中国的第一小时

Trip Hackathon 2026 高校赛 · 赛题一「旅行中国搭子 · 入境游 AI 创新」

Landing Check 面向首次来华的自由行游客，把行前准备与落地后的上网、支付、到酒店连成一条任务流程，一次给出一个明确的下一步。遇到问题时，可以通过 **I’m Stuck** 上传截图或描述情况，匹配知识库中的操作步骤与备用办法。

产品设想是在 Trip.com App 内提供这项功能；目前实现为独立的 H5 原型和 FastAPI 后端。**支付验证、航班和行程使用模拟数据，尚未接入真实扣款或 Trip.com App。**

**初赛版本已提交（2026-10-09）。** 方案书、海报和横竖两版演示视频已归入[初赛 Release](https://github.com/Yuklim/landing-check/releases/tag/v0.1.0-preliminary)，具体文件与校验值见[提交材料索引](submission-final/README.md)。

## 先看项目

| 入口 | 内容 |
|---|---|
| [项目展示页](https://yuklim.github.io/landing-check/backend/showcase/) | 中英双语介绍、需求来源、产品流程与页内动画演示 |
| [在线原型](https://yuklim.github.io/landing-check/h5/?api=https://landing-check.onrender.com) | 手机可操作，连接 Render 后端 |
| [静态原型](https://yuklim.github.io/landing-check/h5/) | 无需后端，查看界面和流程 |
| [初赛材料](https://github.com/Yuklim/landing-check/releases/tag/v0.1.0-preliminary) | 方案书 PDF、海报 PNG、横屏和竖屏演示视频，各 83.1 秒 |
| [文档导航](docs/README.md) | 产品、调研、技术、测试与历史材料 |

Render 实例休眠后，在线原型首次连接可能需要等待唤醒。展示页中的动画约 57 秒，初赛提交的两版视频均在 Release 中下载。

## 当前实现

- **行前检查与落地引导**：围绕联网、支付和交通安排任务，支付准备支持支付宝与 TenPayGo，任一种模拟验证通过即可继续。
- **I’m Stuck**：从截图或文字判断场景，返回知识库条目；不确定时给出候选，模型不可用时使用关键词规则兜底。知识库外的 AI 建议单独标记为未经核验。
- **知识库与图文教程**：5 个场景、41 条记录、10 篇图文教程，保留步骤、备用办法、来源和核验日期。
- **演示与研究资料**：可交互 H5、中英双语展示页、初赛成片，以及需求复核和测试记录。

前端使用 HTML、CSS、JavaScript，设计源文件为 `appearance.pen`；后端使用 Python、FastAPI、Uvicorn、Pydantic 和 HTTPX，截图识别接入 DeepSeek。数据保存在 JSON 文件中，测试使用 pytest 和 Playwright。GitHub Pages 承载前端，Render 承载 API。

## 本地运行

在仓库根目录执行：

```powershell
python -m pip install -r backend/requirements.txt
python -m uvicorn app:app --app-dir backend --host 127.0.0.1 --port 8000
```

- H5 原型：<http://127.0.0.1:8000/app/index.html>
- 项目展示页：<http://127.0.0.1:8000/showcase/>
- 识别测试台：<http://127.0.0.1:8000/test>
- API 文档：<http://127.0.0.1:8000/docs>

真实模型调用需要在服务进程中配置 `DEEPSEEK_API_KEY`，未配置时可使用文字规则兜底。完整的环境配置、测试命令、接口说明和部署方式见[开发指南](docs/development.md)。

## 仓库怎么找

| 目录 / 文件 | 用途 |
|---|---|
| [`h5/`](h5/) | 可点击原型、交互代码、教程数据和构建脚本 |
| [`backend/`](backend/) | FastAPI 接口、识别、规则、模拟数据与测试 |
| [`backend/showcase/`](backend/showcase/) | 已发布的中英双语项目展示页及所需资源 |
| [`知识库/`](知识库/) | 正式条目、来源资料、样本和校验工具 |
| [`docs/`](docs/README.md) | 文档导航、开发指南、需求复核与 TenPayGo 专项资料 |
| [`submission-final/`](submission-final/README.md) | 初赛交付索引、版本清单和 SHA-256 校验值；成品从 Release 下载 |
| [`demo/`](demo/README.md) | 流程讲解、早期视频制作资料和教程动画工程 |
| [`exports/`](exports/) | 设计稿导出与界面截图 |
| [`appearance.pen`](appearance.pen) | pen.dev 设计源文件 |

早期产品方案、后端方案和报名材料保留原路径，在[文档导航的历史材料部分](docs/README.md#历史材料)集中列出。

## 接下来

继续做真实用户任务测试，完善 I’m Stuck 知识库并接入现场照片、语音等多模态能力；补充离线缓存和多语言内容，确认 Trip.com 行程、航班、客服及真实支付相关接入。上述能力仍属于后续计划，具体思考见[项目展示页](https://yuklim.github.io/landing-check/backend/showcase/#next)。
