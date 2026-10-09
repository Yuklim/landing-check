# Landing Check 项目展示页

中文默认、中英切换的静态项目页。正文按五个章节组织：问题与需求、产品形态、技术栈、我们的思考、接下来做什么。介绍以标题和连续段落为主，需求来源、产品截图与演示视频保留交互展示。首页“项目演示”定位到本页演示视频区，在当前页面播放；“体验原型”进入 H5。

## 本地预览

在仓库根目录执行：

```powershell
python -m uvicorn app:app --app-dir backend --host 127.0.0.1 --port 8010
```

打开 `http://127.0.0.1:8010/showcase/`。也可以用支持 HTTP Range 分段请求的静态服务器承载本目录，以便拖动视频进度；页面不调用模型或状态 API。

## 与 Render 现有服务一起部署

`backend/app.py` 挂载 `/showcase/`，展示页和所需的图片、研究文档全部在 `backend/showcase/` 内。沿用现有服务的启动方式和根目录设置即可，不需要新建服务或增加依赖。域名下的原 API 根路径、`/health`、`/docs` 和 `/app/` 路由保留原有行为。

必须将改动发布到 Render 实际跟随的分支，并确认该次部署成功。检查：

- `/health` 的 commit 是否为部署提交。
- `/showcase/` 是否显示项目页，样式、图片、来源弹窗与语言切换是否正常。
- 展示页在 `backend/` 内，符合原服务按该目录触发自动部署的设置。

展示页与 H5 均从 `main` 发布，在线原型包含支付宝与 TenPayGo。动画说明产品思路，具体操作以在线原型为准；页面保留支付、航班和行程使用模拟数据的说明。

Render 官方参考：[Monorepo Support](https://render.com/docs/monorepo-support)、[Web Services](https://render.com/docs/web-services)。现有服务是 Web Service，首次打开展示页仍可能受服务休眠唤醒影响。若以后需要独立的静态 CDN，可把本目录作为 Render Static Site 发布目录。

## 替换内容

- 影片：修改 `content-config.js` 的 `video.src` 与 `video.poster`。支持本地相对路径 MP4/WebM 或 HTTPS 视频地址。当前成片已内嵌中英字幕，无需叠加原操作录屏的 WebVTT 字幕。浏览器不自动播放有声影片。
- 播放入口：首屏“项目演示”定位到 `#demoVideo`，播放器直接嵌在产品介绍中，使用浏览器原生播放、进度、音量和全屏控件。切换语言不会重建播放器或重置播放进度。
- 原型入口：修改同文件的 `demoUrl`。目前保留仓库 README 的 GitHub Pages + Render API 链接。
- 需求卡片：修改 `evidence.js`。弹窗只显示来源账号、原文短摘录、简短情境和原帖链接；已知后续并入情境。Instagram 攻略单独标识，不展示票分或核对日期。
- 双语：固定文案中文在 `index.html`，英文在 `app.js` 的 `english`；交互区文案使用同文件中的中英配对数组。
- 技术栈、项目思考与未来计划：中文段落在 `index.html`，英文在 `app.js` 的 `english`。介绍以实际代码、调研和复核记录为依据；既有截图与文字识别和计划中的现场照片、语音描述分开说明。行程只读、航班更新、交易/退款回调、App 通知和客服接力均是待合作确认的能力。
- 研究文档：`research/demand-review-2026-10-07.md` 与同名 JSON 保存详细需求判断、日期、核对状态和来源边界；旧文档保留作历史资料。
- 图片：`assets/` 使用项目已有设计稿。界面原图为英文，语言切换翻译页面文案和图片说明，不重绘截图。

视频区使用 `demo/film/landing-check-60s/renders/landing-check-v6.mp4` 最终动画版：57.3 秒、1920×1080、英文配音和中英字幕。网页文件为 `assets/landing-check-final.mp4`，只通过 ffmpeg 的 `-c copy -movflags +faststart` 将播放索引移到文件开头，画面和音频没有重新编码；封面从同一成片提取。原 38 秒录屏及其字幕保留为历史素材，当前页面不再使用。

“我们的思考”沿用黑点列表和行内加粗的段落形式，用五条简短段落记录范围与调研、支付流程衔接、识别与评测、知识库维护、失败与重试的经验。内容以开发、调研和测试记录为依据；不把工具协作署名作为项目故事，也不虚构用户测试或团队经历。

多模态输入的权限设计参考 [MDN：getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)；相机/麦克风在用户主动使用时申请，具体嵌入还需宿主 App 支持。已有截图上传使用用户主动选取的文件，参考 [MDN：File API](https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications)，不等同于后台读取相册。案例收集、脱敏核对和取得样本复用同意仍是后续工作，不宣称已完成。

## 验证

```powershell
node --check backend/showcase/app.js
node --check backend/showcase/content-config.js
node --check backend/showcase/evidence.js
python -m pytest -q backend/tests
python backend/tools/check_showcase.py --url http://127.0.0.1:8010/showcase/
```

浏览器检查需要 Playwright 和已安装的 Chrome，或使用 `--channel chromium` 指定已安装的 Playwright Chromium。验证截图写到系统临时目录 `landing-check-review`。
