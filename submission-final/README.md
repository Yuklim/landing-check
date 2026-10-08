# 初赛提交材料 · 2026-10-09

初赛已提交方案书、海报，以及横屏和竖屏两版演示视频。以下四份文件按提交时的内容归档，下载入口统一放在 [GitHub Release · v0.1.0-preliminary](https://github.com/Yuklim/landing-check/releases/tag/v0.1.0-preliminary)。

| 材料 | 下载 | 提交时的本地文件名 |
|---|---|---|
| 方案书 | [PDF](https://github.com/Yuklim/landing-check/releases/download/v0.1.0-preliminary/Landing-Check-Proposal.pdf) | `01-Landing-Check-方案书.pdf` |
| 项目海报，含二维码 | [PNG](https://github.com/Yuklim/landing-check/releases/download/v0.1.0-preliminary/Landing-Check-Poster.png) | `03-Landing-Check-项目海报-头像下置版.png` |
| 横屏演示，83.1 秒，1920 × 1080 | [MP4](https://github.com/Yuklim/landing-check/releases/download/v0.1.0-preliminary/Landing-Check-Demo-Landscape-83s.mp4) | `landing-check-real-v2-83s.mp4` |
| 竖屏演示，83.1 秒，1080 × 1920 | [MP4](https://github.com/Yuklim/landing-check/releases/download/v0.1.0-preliminary/Landing-Check-Demo-Portrait-83s.mp4) | `landing-check-vertical-83s.mp4` |

Release 使用统一的英文文件名便于下载，内容与上述本地原件完全一致。两版视频都作为初赛提交成果保留。

## 版本与校验

[`manifest.json`](manifest.json)记录文件名、大小、SHA-256、视频时长与尺寸；[`SHA256SUMS`](SHA256SUMS)按 Release 文件名列出校验值。Release 附带同样的两份记录。

下载后可用 PowerShell 核对单个文件：

```powershell
Get-FileHash -LiteralPath './Landing-Check-Demo-Landscape-83s.mp4' -Algorithm SHA256
```

或在 macOS / Linux 中，把四份材料和 `SHA256SUMS` 下载到同一目录，再执行：

```sh
shasum -a 256 -c SHA256SUMS
```

Git 中只保留本索引和校验信息，完整交付文件由 Release 保存。本地原来的 `submission-final/` 文件可继续保留，归档过程不会改写方案书、海报或视频。

## 项目入口

- [项目展示页](https://yuklim.github.io/landing-check/backend/showcase/)：中英双语介绍与页内动画。
- [在线原型](https://yuklim.github.io/landing-check/h5/?api=https://landing-check.onrender.com)：手机可交互。
- [文档导航](../docs/README.md)：需求证据、开发指南和测试记录。

初赛原型中的支付验证、航班和行程为模拟数据，尚未接入 Trip.com App 和真实交易。展示页内的约 57 秒动画与这里的两版初赛成片分别保留。
