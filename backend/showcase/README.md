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

展示页可基于 `main` 独立发布；不需要合并 `feature/tenpay-go` 的其他功能。页面明确区分含 TenPayGo 的开发录屏和当前已部署的在线原型。

Render 官方参考：[Monorepo Support](https://render.com/docs/monorepo-support)、[Web Services](https://render.com/docs/web-services)。现有服务是 Web Service，首次打开展示页仍可能受服务休眠唤醒影响。若以后需要独立的静态 CDN，可把本目录作为 Render Static Site 发布目录。

## 替换内容

- 影片：修改 `content-config.js` 的 `video.src`，支持本地相对路径 MP4/WebM 或 HTTPS 视频地址；可选 poster 与 WebVTT captions。浏览器不自动播放有声影片。
- 原型入口：修改同文件的 `demoUrl`。目前保留仓库 README 的 GitHub Pages + Render API 链接。
- 需求卡片：修改 `evidence.js`，每条保留原话、释义、来源、上下文、功能对应与边界。票分不是实时数据。
- 双语：固定文案中文在 `index.html`，英文在 `app.js` 的 `english`；交互区文案使用同文件中的中英配对数组。
- 研究文档：`research/` 保存两份用户指定文档的副本及补充记录。修改源文档后要同步发布副本。
- 图片：`assets/` 使用项目已有设计稿。界面原图为英文，语言切换翻译页面文案和图片说明，不重绘截图。

视频区已接入约 38 秒的真实原型操作录屏，包含中英 WebVTT 字幕，并明确说明支付、航班和行程数据为模拟。它与 `demo/film/` 下的独立影片工程无关。重新录制需先在 `feature/tenpay-go` 的 H5 开发版本（`e6f9b3d`）启动本地后端，再执行 `python backend/tools/record_showcase_demo.py`（需要 Playwright、Chrome 和 ffmpeg）。

协作部分依据现有 Git 提交记录和本页实际制作过程，展示支付板块收敛的具体迭代；不虚构团队成员、分工或个人感想。

## 验证

```powershell
node --check backend/showcase/app.js
node --check backend/showcase/evidence.js
python -m pytest -q backend/tests
python backend/tools/check_showcase.py --url http://127.0.0.1:8010/showcase/
```

浏览器检查需要 Playwright 和已安装的 Chrome，或使用 `--channel chromium` 指定已安装的 Playwright Chromium。验证截图写到系统临时目录 `landing-check-review`。
