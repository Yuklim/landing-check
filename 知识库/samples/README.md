# 识别评测样本

真实界面截图，用来测"我卡住了"的识别。每个目录一个 `manifest.json`，写明每张图的预期场景和条目；`backend/tools/eval_samples.py` 读它跑评测，输出命中率和错例，报告写到 `eval_report.json`。

```bash
cd backend && python3 tools/eval_samples.py from_guides      # 需要 DEEPSEEK_API_KEY
```

## 目录

| 目录 | 张数 | 来源 | 说明 |
|---|---|---|---|
| `from_guides/` | 221 张，其中 64 张已打标签（含 20 张从指南拼图裁出的单屏、3 张 Apple 官方蜂窝设置截图、1 张首都机场官方 Wi-Fi 指南海报） | WildChina、Trip.com、payinchinaguide、chinavigators 等指南正文里的截图 | 真实 App 界面。只有 2 张是报错页（微信"存在风险"弹窗、支付宝添加银行卡页），其余是正常步骤页 |
| `from_reddit/` | 278 张（只在本地，不进仓库），75 张已打标签：38 张真实报错页、27 张正常页、10 张负样本 | 登录态浏览器抓 Reddit 搜索与评论接口，r/travelchina、r/chinatravel、r/chinalife 等，23 组关键词 | 真实用户的失败截图，manifest 里每条带帖子链接和日期，可按链接重新下载；配套 `知识库/raw/reddit/README.md` 有 608 帖的求助原文与高赞回答 |
| `readyforchina/` | 6 个 GIF | readyforchina.com 的设置教程动图 | 支付宝六步、微信五步，无报错页 |
| `tenpaygo_appstore/` | 4 张，3 张已打标签、1 张负样本 | App Store 上 TenPayGo 的官方截图（Tencent），2026-10-06 下载 | 带营销标题条的正常页，没有报错页。图文教程的占位配图从这里裁出 |

## 2026-10-03 基线评测（40 张，只有支付宝条目）

| 指标 | 结果 |
|---|---|
| 场景命中 | 27/40 = 68% |
| 条目命中（仅支付宝 16 张） | 12/16 = 75% |
| 判定分布 | 直接答 7 · 让用户选 16 · 未知 17 |
| 平均耗时 | 3.0 秒 |

错例 13 张里 11 张是同一个原因：**微信支付的截图被归到支付宝**（实名验证页、绑卡页、支付密码页）。知识库里还没有微信场景，模型只能在支付宝里选。写完微信条目后预计场景命中到 85% 以上。

另外 2 张是滴滴 App 自身的"Payment Methods"页被判未知，因为条目只写了支付宝里的滴滴小程序，没写滴滴独立 App。写滴滴场景时补。

模型返回非法 JSON 4 次（截断或空），都自动走了规则兜底，没有崩。

## 2026-10-03 第三轮（40 张，支付宝 + 微信 + 滴滴 + 上网，30 条）

| 指标 | 结果 |
|---|---|
| 场景命中 | 34/40 = 85% |
| 条目命中 | 26/38 = 68% |
| 判定分布 | 直接答 13 · 让用户选 20 · 未知 7 |
| 平均耗时 | 2.8 秒 |

滴滴独立 App 的 7 张改标到 `didi` 场景后 6 张命中，1 张（Account 页）判未知。上网场景目前没有样本，`connectivity` 的关键词和视觉线索还没被评测过，需要补机场 Wi-Fi 登录页和手机"蜂窝/数据漫游"设置页的截图。

剩下 6 张场景错例全是微信：通用页面（聊天列表、通知权限弹窗、支付设置）本身没有场景特征，以及 1 张微信绑卡页被归到支付宝。条目级错例多是"设置前"与"安全验证"两条之间的边界，判定给的是 ask，用户选一下即可。

## 2026-10-03 第四轮（64 张，加入裁图与上网样本；识别逻辑改一处）

| 指标 | 结果 |
|---|---|
| 场景命中 | 60/64 = 94% |
| 条目命中 | 45/62 = 73% |
| 判定分布 | 直接答 15 · 让用户选 46 · 未知 3 |
| 平均耗时 | 3.1 秒 |

加入 24 张新样本后先跌到 73%：滴滴的正常订车页模型都选对了条目，但置信度只给 0.30 到 0.35，卡在"让用户选"门槛 0.40 之下被判未知。改动：模型置信度低于门槛时也跑一次关键词兜底，若关键词场景与模型一致，抬到 0.5 以内的"让用户选"档，绝不抬到"直接答"；场景不一致则不动（`backend/stuck.py`，有测试）。同时给滴滴补了订车页关键词（Enter Destination、Discount Express、我的钱包 等）。

上网场景 4 张全部命中（Apple 蜂窝设置页、SOS 状态、首都机场海报）。剩余 4 张场景错例：微信通用页面 2 张、微信绑卡页被归到支付宝 1 张、微信里的滴滴顺风车小程序被归到滴滴 1 张（这张两边都说得通）。条目级错例集中在"设置前"与"机场上客 / 验证码"之间，都是 ask，用户点一下即可。

## 2026-10-03 第五轮：Reddit 真实失败截图（75 张，独立评测）

| 指标 | 结果 |
|---|---|
| 场景命中 | 63/75 = 84% |
| 条目命中 | 49/65 = 75% |
| 判定分布 | 直接答 37 · 让用户选 24 · 未知 14 |

38 张真实报错页按条目分布，这是目前最接近"用户真的会卡在哪"的数据：

| 条目 | 张数 |
|---|---|
| `alipay_account_locked` | 13 |
| `alipay_identity_verification` | 9 |
| `wechat_card_unsupported` | 6 |
| `alipay_card_bind_failed` | 3 |
| `connectivity_esim_not_working` | 2 |
| `alipay_payment_declined` | 2 |
| `didi_setup_before_flight` | 1 |
| `alipay_tourcard` | 1 |
| `wechat_risk_control` | 1 |
| `wechat_miniprogram_needs_chinese_number` | 1 |

两个和原先假设不一样的发现：

1. 最常见的不是绑卡失败，是账户风控。支付宝 "Account Restrictions / Transaction Termination / Restricting main account functions / restricted payment status, call 0571-26886000" 一类占了报错截图的三分之一，触发原因多是刚绑外卡就连续小额交易或换设备登录。`alipay_account_locked` 条目要扩写：解封路径（Appeal / Upload Proof / 热线）、等待时长、哪些情况 "cannot be resolved through appeal"。
2. 实名验证失败的具体形态：护照读取失败（Reading failed）、认证未完成（certification not completed / Query timed out）、以及被要求 "Verify Chinese Mainland bank card"。最后一种是用户误入了大陆用户流程，解法是重选 Non-Mainland，这一点条目里已有但要放到第一步。

微信侧的真实报错集中在 "current transaction does not support international bank cards"（付款、转账、充值都有）和 "Weixin Security Alert"。上网类只抓到 eSIM 安装卡住两张；滴滴只有一张 "Failed to activate"。

评测里 4 张在 12 秒左右返回未知且置信度 0，是模型两次都没返回合法 JSON（都是带 Google Lens 翻译浮层的图），要再查。负样本 10 张里 2 张被误判为有场景（Hypergryph 客服聊天、美团登录页）。

## 样本的局限

- 真正的报错截图只有 2 张。指南作者截的是"怎么做"，不是"做失败了"。真实用户的失败截图（卡被拒、验证失败弹窗、风控锁定）仍然缺。
- Reddit 的 r/chinatravel、r/travelchina 有大量这类帖子，但官方接口和第三方归档都拒绝了抓取请求。要补这部分只能人工：登录 Reddit 搜 "alipay declined"、"verification failed"，把带图的帖子截图存进 `from_reddit/`，按同样格式写 manifest。
- 团队里有国外卡的人在支付宝里真实绑一次，是最有价值的样本。

## 怎么加样本

1. 截图放进对应目录，文件名随意。
2. 在 `manifest.json` 加一条：`{"file": "xxx.png", "scenario": "alipay", "expected_entry": "alipay_card_bind_failed", "kind": "error", "note": "..."}`。场景在知识库里还没有时照样写，评测会按"应判未知"处理。
3. 重跑评测。
