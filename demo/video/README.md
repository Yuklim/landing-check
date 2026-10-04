# 演示视频制作包

脚本正文在 `../视频脚本.md`（v4）。这个目录是按「先声音、后画面」的顺序准备的材料。

## 文件
| 文件 | 用途 |
|---|---|
| `01-旁白稿.md` | 中文旁白 26 句，配音用 |
| `02-台词稿.md` | Alex 英文台词 11 句 + 司机 1 句，配音用 |
| `subtitles.srt` | 双语字幕，只含人物台词，时间按参考声轨 |
| `timeline.csv` | 每镜起止时间、每句旁白和台词的起止，剪辑对位用 |
| `scratch_track.mp3` | 系统语音合成的参考声轨，全长 3:46。铺在时间轴上先对画面，正式配音录好后整条替换 |
| `scratch_parts/` | 每句单独的 wav（不进 git），想单句替换时用 |
| `build_voice.py` | 以上全部由它生成。旁白和台词以 `01-旁白稿.md`、`02-台词稿.md` 为准，改完 md 跑 `python3 demo/video/build_voice.py --audio`，再跑 `python3 demo/video/sync_script.py` 把时长、旁白、台词同步进 `../视频脚本.md` |
| `sync_script.py` | 把生成结果写回视频脚本的分镜表 |
| `durations.json` | 由声音决定的每镜时长，脚本表格里的秒数来自这里 |
| `03-人物镜头提示词.md` | 定妆照、4 张场景参考图、13 条视频镜头的中英提示词 |
| `04-字卡与角标.md` | 标题卡、角标、时间小字、字幕样式、片尾、自制社交界面 |
| `phone_frame.png` | 手机样机，屏幕区透明，参数见 `phone_frame.txt` |
| `split_layout_1920x1080.png` | 分屏模板示意：左 58% 样机、右 42% 人物、放大块、角标、字幕位置 |

## 正式配音
- 旁白：按 `01-旁白稿.md` 录，每句单独一条，文件名用镜号（如 `2-4.wav`），方便替换 `scratch_parts/` 里的同名文件后重跑 `build_voice.py` 得到新的 timeline。
- 台词：按 `02-台词稿.md`，英文男声，轻松自语的语气。司机那句找会说普通话的人录。
- 参考声轨用的是系统语音，语速偏慢。真人正常语速下全片约 3:15 到 3:30。

## BGM 和音效来源（无版权）
- BGM：Pixabay Music、Free Music Archive（CC BY）、YouTube Audio Library。搜 "piano ambient calm morning"，要无鼓点、70 BPM 左右、长度 4 分钟以上。
- 音效：Pixabay Sound Effects、freesound.org（注意选 CC0）。需要 5 个：notification ding、ui tap、tape rewind、soft loading loop、success chime。

## 如果比赛限 3 分钟
按参考声轨全片 3:46，真人配音约 3:20。还要再砍到 3:00 以内，按这个顺序剪：
1. 删第 6 幕 6-1 的六词回顾（11 秒），片尾直接出 logo。
2. 2-4 旁白删掉最后一句「答案不是现编的，底下写着核验日期」，改为放大来源小字 1.5 秒不配音（约 4 秒）。
3. 1-5 删 Alex 台词，只留旁白（约 4 秒）。
4. 5-2 街景空镜从 5 秒减到 3 秒。
5. 4-1 旁白删「地铁和网约车也在」（约 2 秒）。
这五刀约 24 秒，真人配音版落在 2:55 左右。改两个 md 后重跑 `build_voice.py` 和 `sync_script.py` 即可得到新的字幕、时间表和脚本。

---

## 粗剪 v1（已出片）

`roughcut.mp4` · 1920×1080 · 25 fps · 3 分 45 秒 · 20 MB

**两条命令重出**
```bash
python3 demo/video/audio_build.py     # BGM + 音效 -> roughcut_audio.wav
python3 demo/video/render.py          # 画面 -> segments/ -> roughcut.mp4（约 70 秒）
```

### 这一版里有什么
| 部分 | 状态 |
|---|---|
| 30 个镜头的时长与剪辑点 | 按 `durations.json`，和脚本完全一致 |
| App 画面 | 全部用 `exports/` 的导出图，左 60% 手机样机 + 右 40% 人物 |
| 放大块 | 35 处，位置逐个对过导出图坐标。高亮框在两个区域之间滑行而不是硬切，卡片交叉淡化并带入场缩放，两条引线从高亮区牵到卡片 |
| 双语字幕 | 12 句人物台词，半透明深色底，浅色画面上也看得清 |
| 中文旁白 | 26 句，暂时以字幕形式显示在底部（标「旁白」），配音后删掉这一层 |
| 角标、时间小字、标题卡、片尾 | 按 `04-字卡与角标.md` |
| BGM | 程序合成，钢琴 + 弦乐垫，70 BPM 无鼓点，按幕换和弦：开场稀疏、卡住转小调、成功转亮、片尾加厚 |
| 音效 | 22 处：通知、点击、快门、倒带、识别中、成功、白闪 |
| 人物镜头 | **占位**。本会话没有图像或视频生成工具，13 条镜头必须外部生成。生成后按 `footage/README.md` 的文件名放进 `footage/`，重跑 render.py 即自动接上，不需要改代码 |

### 换上真镜头怎么做
1. 按 `03-人物镜头提示词.md` 生成镜头。
2. 按 `footage/README.md` 的文件名丢进 `demo/video/footage/`。
3. 重跑 `python3 demo/video/render.py`。有素材的镜头自动换成素材，没有的继续用占位卡，代码不用动。

### 配音
现在没有人声，旁白以字幕显示。录好后把分句音频放进 `scratch_parts/`，重跑 `build_voice.py --audio`，再把 `render.py` 里 `draw_overlays` 的 narration 分支去掉，最后把 `roughcut_audio.wav` 和人声混在一起。

### 素材权利提醒
定妆照是短视频平台上某个真人的脸，现在只用于分屏右侧占位。正式片的 AI 镜头不要生成到可辨认为该真人的程度，否则参赛片存在肖像权风险；要么换一张授权的参考图，要么把提示词往"不像任何特定真人"的方向调。
