# 演示资料

## 初赛提交成片

初赛同时提交了横屏和竖屏两版视频，均为 83.1 秒。文件位于[初赛 Release](https://github.com/Yuklim/landing-check/releases/tag/v0.1.0-preliminary)，完整清单见[提交材料索引](../submission-final/README.md)。

- [横屏版 · 1920 × 1080](https://github.com/Yuklim/landing-check/releases/download/v0.1.0-preliminary/Landing-Check-Demo-Landscape-83s.mp4)
- [竖屏版 · 1080 × 1920](https://github.com/Yuklim/landing-check/releases/download/v0.1.0-preliminary/Landing-Check-Demo-Portrait-83s.mp4)

两版保留提交时的原始字节，不重新编码。Release 中的 `SHA256SUMS` 可用于核对下载文件。

## 网页动画

[项目展示页](https://yuklim.github.io/landing-check/backend/showcase/#demoVideo)内嵌的是约 57 秒的产品动画，文件为 [`backend/showcase/assets/landing-check-final.mp4`](../backend/showcase/assets/landing-check-final.mp4)，由 `content-config.js` 指定。展示页动画与初赛提交成片分别保留。

## 流程与设计讲解

| 文件 | 用途 |
|---|---|
| [`flow.html`](flow.html) | 带讲解词的流程页，引用 `exports/` 中的截图 |
| [`screens.html`](screens.html) | 设计页面浏览 |
| [单文件流程讲解](../LandingCheck-流程演示.html) | 内嵌资源的历史讲解页，可单独传递 |
| [`exports/`](../exports/) | 设计稿和界面截图 |

## 制作过程

[`video/`](video/README.md)保留早期旁白、字幕、人物镜头和渲染脚本，[`视频脚本.md`](视频脚本.md)记录制作过程。这些资料可能与最终提交成片不同，查看初赛结果请以 Release 为准。

[`motion/tenpaygo-appstore-download/`](motion/tenpaygo-appstore-download/README.md)是 TenPayGo 教程中使用的下载动画工程。
