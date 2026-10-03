# 知识库条目格式

一个场景一个 JSON 文件（`alipay.json`、`wechat.json`、`didi.json` …），文件里是一个对象：

```json
{
  "scenario": "alipay",
  "name": {"en": "Alipay", "zh": "支付宝"},
  "detect": { ...识别线索，给"我卡住了"的分类用... },
  "entries": [ ...条目... ]
}
```

## detect：怎么认出用户卡在这个场景

| 字段 | 说明 |
|---|---|
| `keywords_zh` | 截图 OCR 出的中文关键词，命中即倾向本场景 |
| `keywords_en` | 英文界面关键词 |
| `visual_cues` | 给多模态模型的描述：界面长什么样 |
| `sub_steps` | 本场景下的子步骤 id 列表，模型要在其中选一个 |

## entry：一条可执行的解决办法

| 字段 | 必填 | 说明 |
|---|---|---|
| `id` | 是 | `场景_子步骤`，全库唯一，H5 和后端都用它引用 |
| `stage` | 是 | `preflight` 行前 / `landing` 落地 / `anytime` |
| `title` | 是 | 用户看到的标题，英文，一句话说明卡在哪 |
| `why` | 是 | 一句话解释为什么会这样，英文 |
| `steps` | 是 | 1 到 4 步，每步一句可执行的话，带菜单路径 |
| `fallback` | 是 | 都不行时的出路，一句话 |
| `applies_to` | 是 | `["ios","android"]` 或其一 |
| `scope` | 是 | `global` 通用，或机场代码 `PVG` / 城市 |
| `sources` | 是 | 来源列表，每条 `{"name","url","date"}`，第一条是主来源 |
| `verified_at` | 是 | 我们最后核对的日期 |
| `volatility` | 是 | `high` 数字和规则常变，季度复核；`low` 一年不动 |
| `facts` | 否 | 条目依赖的具体数字，单独列出便于复核：`{"fact":"...", "status":"verified|conflict|unverified", "note":"..."}` |
| `related` | 否 | 相关条目 id |
| `reader_links` | 否 | 可直接推荐给用户阅读的外链。只允许 Trip.com 和官方来源：政府网、支付宝/Alipay+/蚂蚁集团、微信/腾讯、银联、滴滴、Apple 与 Google 的支持页，白名单在校验脚本 `READER_OK` |
| `tags` | 否 | 自由标签 |
| `media` | 否 | 图文教程配图，列表。每项 `{"step": 1, "file": "...", "poster": "...", "alt": "...", "source": {"name","url"}, "placeholder": true, "note": "..."}`，见下文 |

## media：图文教程配图

有 `media` 的条目会被导出成 H5 的图文教程（`h5/tutorials.json`），一步一图，配到 `steps` 的第几步由 `step` 指定。

| 字段 | 必填 | 说明 |
|---|---|---|
| `step` | 是 | 1 到 `steps` 的长度，配到哪一步 |
| `file` | 是 | 相对 `h5/img/tutorial/` 的路径，按 `场景/条目id/stepN.<ext>` 放。GIF、PNG、JPG、WebP 都可以；竖屏截图教程屏会按原比例完整显示 |
| `poster` | 否 | 静态首帧 PNG，弱网先显示；GIF 必须配 |
| `alt` | 是 | 一句话说明图里是什么，英文，给读屏和图片加载失败时用 |
| `source` | 是 | `{"name","url"}`，图从哪来 |
| `placeholder` | 否 | `true` 表示第三方站点扒来的图，只能演示用，正式版要换成自己截的或 Trip.com 自家的图 |
| `note` | 否 | 内部备注，比如图和文字路径不完全一致 |
| `origin` | 否 | 图在 `知识库/samples/` 里的原文件名，便于回溯 |

规则：一步最多一张图；`placeholder: true` 的图不得出现在正式版里；图里不能有第三方站点水印以外的推广信息。

## 写作规则

1. 每步一句话，用祈使句，写清按哪里：`Me > Bank Cards > Add Now`。
2. 不写"可能、也许"，不确定的数字放进 `facts` 并标 `unverified` 或 `conflict`，正文里用保守说法。
3. 不出现 VPN、不出现 WildChina 等竞品名、不出现任何推广码。
4. 大模型只负责把 `title`、`why`、`steps`、`fallback` 翻成用户语言，不允许增删步骤。
5. 一条条目只解决一个问题。用户卡在"绑卡失败"和"收不到验证码"是两条。

## 校验和预览

```bash
python3 知识库/tools/validate_entries.py          # 检查全部文件并生成同名 .md 预览
# 同时把带 media 的条目导出到 h5/tutorials.json，供 H5 教程屏使用
```
