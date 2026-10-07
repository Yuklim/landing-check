# Landing Check 项目展示页

中文默认、中英切换的静态项目页。包含七个章节、社媒气泡云、来源详情、需求分类和产品流程截图。

## 本地预览

在仓库根目录执行：

```powershell
python -m uvicorn app:app --app-dir backend --host 127.0.0.1 --port 8010
```

打开 `http://127.0.0.1:8010/showcase/`。也可以直接用静态服务器承载本目录；页面不调用模型或状态 API。

## 与 Render 现有服务一起部署

`backend/app.py` 挂载 `/showcase/`，展示页和所需的图片、研究文档全部在 `backend/showcase/` 内。沿用现有服务的启动方式和根目录设置即可，不需要新建服务或增加依赖。域名下的原 API 根路径、`/health`、`/docs` 和 `/app/` 路由保留原有行为。

必须将改动发布到 Render 实际跟随的分支，并确认该次部署成功。检查：

- `/health` 的 commit 是否为部署提交。
- `/showcase/` 是否显示项目页，样式、图片、来源弹窗与语言切换是否正常。
- 展示页在 `backend/` 内，符合原服务按该目录触发自动部署的设置。

展示页与 H5 均从 `main` 发布，在线原型和录屏都包含支付宝与 TenPayGo。页面保留支付、航班和行程使用模拟数据的说明。

Render 官方参考：[Monorepo Support](https://render.com/docs/monorepo-support)、[Web Services](https://render.com/docs/web-services)。现有服务是 Web Service，首次打开展示页仍可能受服务休眠唤醒影响。若以后需要独立的静态 CDN，可把本目录作为 Render Static Site 发布目录。

## 替换内容

- 影片：修改 `content-config.js` 的 `video.src`，支持本地相对路径 MP4/WebM 或 HTTPS 视频地址；可选 poster 与 WebVTT captions。浏览器不自动播放有声影片。
- 原型入口：修改同文件的 `demoUrl`。目前保留仓库 README 的 GitHub Pages + Render API 链接。
- 需求卡片：修改 `evidence.js`。弹窗只显示来源账号、原文短摘录、简短情境和原帖链接；已知后续并入情境。Instagram 攻略单独标识，不展示票分或核对日期。
- 双语：固定文案中文在 `index.html`，英文在 `app.js` 的 `english`；交互区文案使用同文件中的中英配对数组。
- 未来规划：`app.js` 的 `roadmap` 区分当前缺口、拟申请能力和接入后的流程。“I’m stuck” 保留为一项后续改进，截图与文字识别为已有能力，现场拍照和语音为计划扩展。行程只读、航班更新、交易/退款回调、App 通知和客服接力均是待合作确认的能力，不代表已获得平台权限。
- 研究文档：`research/demand-review-2026-10-07.md` 与同名 JSON 保存详细需求判断、日期、核对状态和来源边界；旧文档保留作历史资料。
- 图片：`assets/` 使用项目已有设计稿。界面原图为英文，语言切换翻译页面文案和图片说明，不重绘截图。

视频区已接入约 38 秒的真实原型操作录屏，包含中英 WebVTT 字幕，并明确说明支付、航班和行程数据为模拟。重新录制时，在当前 `main` 启动本地后端，再执行 `python backend/tools/record_showcase_demo.py`（需要 Playwright、Chrome 和 ffmpeg）。

协作部分依据现有 Git 提交记录和本页实际制作过程，展示支付板块收敛的具体迭代；不虚构团队成员、分工或个人感想。

多模态输入的权限设计参考 [MDN：getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)；相机/麦克风在用户主动使用时申请，具体嵌入还需宿主 App 支持。已有截图上传使用用户主动选取的文件，参考 [MDN：File API](https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications)，不等同于后台读取相册。案例收集、脱敏核对和取得样本复用同意仍是后续工作，不宣称已完成。

## 验证

```powershell
node --check backend/showcase/app.js
node --check backend/showcase/evidence.js
python -m pytest -q backend/tests
python backend/tools/check_showcase.py --url http://127.0.0.1:8010/showcase/
```

浏览器检查需要 Playwright 和已安装的 Chrome，或使用 `--channel chromium` 指定已安装的 Playwright Chromium。验证截图写到系统临时目录 `landing-check-review`。
