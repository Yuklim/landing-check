# TenPayGo · App Store 下载动画

TenPayGo 图文教程第 1 步用的动画（`h5/img/tutorial/tenpaygo/tenpaygo_setup_before_flight/step1.mp4`）的源工程。HyperFrames（HTML 合成，GSAP 时间轴）制作，界面全部自绘：没有 Apple 标志、App Store 字样或截图，TenPayGo 图标是自画的绿色钱包，不是腾讯的真实图标。

- 8 秒，720×816（与教程框 353×400 同比例），30 fps，无声，首尾帧一致可无缝循环
- 流程：点搜索框 → 打出 TenPayGo → 出现结果 → 点 Get → 进度环分段填满 → Open → 回到搜索页
- 规划：`BRIEF.md`（需求）、`shot-plan.json`（每个节拍的时间和坐标）、`context.log`（决策记录）
- 合成：`index.html`（画布、配色、字体、两个点击和进度环的挂载）+ `compositions/index.html`（商店界面和时间轴）；`compositions/components/` 是从 HyperFrames 组件库加的 `touch-indicator`、`conic-progress-ring`，已按需修改
- 字体 Inter（OFL）和 GSAP 放在 `assets/`，渲染不需要联网

## 修改后重新出片

```bash
cd demo/motion/tenpaygo-appstore-download
npx --yes hyperframes@0.8.137 preview            # Studio 预览，可直接点选改文字、拖时间轴
npx --yes hyperframes@0.8.137 check .            # lint + 布局 + 动效 + 对比度
npx --yes hyperframes@0.8.137 render . -q high -o ./renders/video.mp4

# 转成网页用的版本（约 145 KB）和封面（取 3.5 s：结果行和 Get 都已出现；浏览器拦截自动播放时显示它）
D=../../../h5/img/tutorial/tenpaygo/tenpaygo_setup_before_flight
ffmpeg -y -i renders/video.mp4 -an -c:v libx264 -preset slow -profile:v main -pix_fmt yuv420p -crf 26 -movflags +faststart -tune animation $D/step1.mp4
ffmpeg -y -ss 3.5 -i renders/video.mp4 -frames:v 1 $D/step1.png      # 再用调色板压到 256 色，约 65 KB
python3 ../../../知识库/tools/validate_entries.py
```

`renders/` 和 `snapshots/` 是生成物，不进仓库。
