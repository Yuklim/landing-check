# TenPayGo 接入 · PRD

v1 · 2026-10-06 · 依据 `01-需求调研.md` · §2 的四项决策已由需求方确认，其余内容随 PR 评审

---

## 1. 目标

让外国散客在起飞前**用支付宝或 TenPayGo 任一种**完成 ¥1 支付验证。支付宝走不通时，有一条不需要手机号、能用 Apple Pay 的退路。落地后的所有页面按实际验证的方式显示。

**不做**：不把 TenPayGo 放进叫车和地铁（它没有小程序，也不能过闸机）；不做真实的财付通对接；不重截 exports，不改视频脚本。

## 2. 已确认的决策

| # | 决策 | 结论 |
|---|---|---|
| D1 | 并列方式 | 任一个验证即就绪；另一个显示为备用、可选 |
| D2 | 前端改法 | `app.js` 运行时注入，不改 `index.html` 和 `appearance.pen`，另写设计说明 |
| D3 | 交付终点 | 推送 `feature/tenpay-go`，开 PR 到 main，不合并 |
| D4 | 范围 | 核心功能加图文教程；支付宝出现的地方 TenPayGo 都出现，事实不成立的位置除外 |

## 3. 用户故事

| # | 作为 | 我想 | 以便 |
|---|---|---|---|
| U1 | 不想给手机号的游客 | 行前用 TenPayGo 完成 ¥1 验证 | 不装支付宝也能出发 |
| U2 | 支付宝绑卡失败的游客 | 在失败页直接改用 TenPayGo | 不用从头查攻略 |
| U3 | 已验证支付宝的游客 | 看到 TenPayGo 作为备用 | 支付宝出问题时知道还有一条路 |
| U4 | 落地后的游客 | 第二步和完成页写明我用哪种方式验证的 | 知道该打开哪个 App 付钱 |
| U5 | 卡在 TenPayGo 某个页面的游客 | 拍屏后得到 TenPayGo 的解决步骤 | 不被当成微信问题 |
| U6 | 路演讲解人 | 在菜单里一键模拟 TenPayGo 失败 | 演示失败分支 |

## 4. 状态规则

支付组 = {支付宝, TenPayGo}。每种方式各自 `verified / not_verified`。

| 支付宝 | TenPayGo | 组状态 | 支付宝行 | TenPayGo 行 | 计入摘要 |
|---|---|---|---|---|---|
| 未验证 | 未验证 | todo | todo ✕ | todo ✕ | 1 项待办 |
| 已验证 | 未验证 | done | done ✓ | optional（备用） | 1 项完成，备用不计入 optional 数 |
| 未验证 | 已验证 | done | optional（备用） | done ✓ | 同上 |
| 已验证 | 已验证 | done | done ✓ | done ✓ | 1 项完成 |

- 必查项总数保持 6，与现有设计稿和 exports 一致：初始状态仍显示"4 of 6 ready · 2 to do · 2 optional"。
- `primary`（主支付方式）= 第一个验证成功的方式。落地后的页面都显示它的名字。

## 5. 功能需求与验收标准

### FR-1 行前检查：TenPayGo 行

- 位置：支付宝行正下方，样式与支付宝行一致。
- 标题 `TenPayGo payment`；按钮 `Verify ¥1`；下方挂 `Step-by-step setup guide · 2 screenshots ›`，打开 TenPayGo 图文教程。
- 说明文字按状态（文案见 §6）。
- **验收**：初始状态两行都是橙色 ✕，摘要不变；验证任一方式后，该行变绿 ✓，另一行变灰色备用图标，摘要变"5 of 6 ready"，另一行按钮仍可点。

### FR-2 TenPayGo ¥1 验证

- 点 `Verify ¥1` → 提示 `Charging ¥1 via TenPayGo…` → 跳到验证结果页。
- 成功页：标题、副标题、第二条"已测试"说明、底部来源小字换成 TenPayGo 版本；VERIFIED 胶囊带日期。
- 失败页：三种错误码，各有标题、原因和两步处理（文案见 §6）。
- **验收**：成功后行前检查的 TenPayGo 行为 done；失败后为 todo 不变；三种错误码都能在页面上看到对应解释。

### FR-3 失败页互相切换

- 支付宝失败页底部加文字链接 `Use TenPayGo instead ›`；TenPayGo 失败页加 `Use Alipay instead ›`。点击即用另一种方式发起验证。
- 成功页不显示该链接。
- **验收**：从支付宝失败页一键切到 TenPayGo 并验证成功后，支付组变为 done。

### FR-4 落地流程里的"先验证支付"

- 第一步 Wi-Fi 页、已联网页、第三步在支付未就绪时，主按钮都会先发起 ¥1 验证（现有行为）。
- 改为弹出底部选择层：`Verify with Alipay` / `Verify with TenPayGo` / `Not now`，每项一句说明。验证成功后回到原来的下一步。
- **验收**：在第三步点 `Verify payment first`，选 TenPayGo 成功后，结果页按钮为 `Continue to step 3 · Get to your hotel`。

### FR-5 落地卡第二步「Pay like a local」

- 已就绪：`Alipay verified before you flew · ¥1 test refunded` 或 `TenPayGo verified before you flew · ¥1 test refunded`（按 primary）。
- 未就绪：`Not verified yet · ¥1 test with Alipay or TenPayGo`。
- 门槛判断由"支付宝是否 done"改为"支付组是否 done"（第三步主按钮、已联网页主按钮、Wi-Fi 页按钮）。

### FR-6 My Trips 落地检查卡

- 支付标签显示 primary 的名字（`Alipay` 或 `TenPayGo`），未就绪时显示 `Payment`。剩余项数按支付组计算。

### FR-7 完成页与分享卡

- 时间线支付一行：`Alipay verified before flight` / `TenPayGo verified before flight` / 落地当天验证的显示 `… verified · ¥1 test` 和时刻；未就绪 `Payment not verified`。

### FR-8 I'm stuck

- 知识库新增 `tenpaygo` 场景 7 条（见 FR-11）；识别能返回 TenPayGo 条目，结果页标签 `RECOGNIZED · TENPAYGO`。
- 识别提示词加一条区分规则：TenPayGo 截图与微信支付截图的区别。
- **验收**：只给文字"TenPayGo The bank did not approve this transaction"时，规则兜底返回 `tenpaygo_card_bind_failed`；只给该报错句、不提 TenPayGo 时仍返回微信条目（不改变现有行为）。

### FR-9 图文教程

- `tenpaygo_setup_before_flight` 4 步，第 2、4 步配图；`tenpaygo_how_to_pay` 3 步，第 1、2 步配图。配图为 App Store 官方截图裁出的手机画面，标 `placeholder: true`。
- 右上角菜单的教程列表自动出现两篇；`?tutorial=tenpaygo_setup_before_flight` 可深链打开。

### FR-10 演示控制与静态模式

- 菜单加 `💳 模拟 TenPayGo 支付失败`。
- 静态模式（无后端）：TenPayGo 行照常显示，点 `Verify ¥1` 显示 TenPayGo 成功页；点支付宝 `Verify ¥1` 显示支付宝成功页，两者互不串文案。

### FR-11 知识库

| id | 阶段 | 标题 |
|---|---|---|
| `tenpaygo_setup_before_flight` | preflight | Set up TenPayGo before you fly |
| `tenpaygo_signup_blocked` | anytime | TenPayGo sign-up won't go through |
| `tenpaygo_card_bind_failed` | anytime | Card won't link to TenPayGo |
| `tenpaygo_how_to_pay` | landing | How to pay at a shop with TenPayGo |
| `tenpaygo_qr_not_supported` | anytime | TenPayGo can't pay this QR code |
| `tenpaygo_payment_declined` | anytime | TenPayGo payment declined |
| `tenpaygo_status_unclear` | anytime | TenPayGo says failed but you were charged |

- 全部 `volatility: high`；手续费、额度、实名放进 facts，正文不写数字。
- `alipay_card_bind_failed`、`wechat_card_unsupported`、`connectivity_chinese_number_needed` 的 related 加 TenPayGo 对应条目。

## 6. 文案

### 行前检查 · 说明文字

| 状态 | 支付宝行 | TenPayGo 行 |
|---|---|---|
| 组未就绪 | Installed · not verified yet · ¥1 test, refunded in 24 h | Not installed · either one is enough · email sign-up, no Chinese number |
| 本行已验证 | Verified · ¥1 test on {date}, refunded | Verified · ¥1 test on {date}, refunded |
| 本行为备用 | Backup · not verified · for shops that only take Alipay | Backup · not verified · pays wherever WeChat Pay works |

### 验证结果页（TenPayGo）

| 位置 | 文案 |
|---|---|
| 成功标题 | Your TenPayGo works in China |
| 成功副标题 | ¥1.00 charged via TenPayGo at {HH:MM} · {card} / Refund issued · back on your card in 1–3 days |
| 已测试第 2 条 | TenPayGo is linked to that card on this phone / Installed is not enough. This proves the link is live. |
| 失败说明卡 | If the test fails, we read TenPayGo's error for you / ISSUER_DECLINED → allow international online payments in your bank app / AUTH_FAILED → approve your bank's 3-D Secure check / REGION_UNAVAILABLE → retest after landing, or verify Alipay now |
| 来源小字 | Test uses a Trip.com WeChat Pay code that TenPayGo pays · no new permissions |

### 失败原因（TenPayGo）

| 错误码 | 标题 / 原因 | 第一步 | 第二步 |
|---|---|---|---|
| ISSUER_DECLINED | Your bank refused the charge / TenPayGo shows "The bank did not approve this transaction". The block is at your bank, not TenPayGo. | Allow international online payments / Turn it on in your bank app, or call the number on the card, then retry in a few minutes. | Or switch on Apple Pay / On iPhone, Apple Pay inside TenPayGo is a separate route and often passes when a typed card fails. |
| AUTH_FAILED | Your bank's check was not completed / Your bank sent a 3-D Secure code or an in-app approval and it was not confirmed in time. | Keep your bank reachable / The code goes to the phone number or banking app your bank has on file. | Retry once, not five times / Repeated attempts in a short time can trigger a block. |
| REGION_UNAVAILABLE | TenPayGo only charges inside mainland China / Its terms limit the service to the Chinese mainland, so a test from abroad can be refused even when the card is fine. | Keep the card linked / Run the ¥1 test again after you land. | Verify Alipay now / Alipay can be tested before you fly, so you leave with one method confirmed. |

## 7. 非功能需求

| 项 | 要求 |
|---|---|
| 接口兼容 | `/mock/pay-test` 不带 `method` 时行为与现在一致；`/rules/preflight` 仍返回 `alipay` 项（新增字段不删旧字段） |
| 前端兼容 | 新 H5 连旧后端（无 `payment` 字段）时按支付宝单通道降级，不报错 |
| 设计一致 | 新增行和选择层沿用设计稿的颜色、字号、圆角；不新增设计稿屏 |
| 合规 | 不出现 VPN；不写"无需实名"的承诺；手续费不写数字 |
| 性能 | 不新增首屏请求；教程配图单张 ≤ 200 KB |
| 测试 | 后端新增用例全部通过，原 38 个用例不回归；H5 端到端脚本覆盖 FR-1 至 FR-7 |

## 8. 指标

沿用现有"三项就绪率"，把支付一项拆成按方式统计：

| 指标 | 定义 |
|---|---|
| 支付就绪率（按方式） | 起飞前支付组为 done 的行程占比，分 primary = 支付宝 / TenPayGo |
| 切换挽回率 | 一种方式验证失败后，用另一种方式验证成功的比例（FR-3、FR-4 的价值） |
| TenPayGo 错误分布 | 三种错误码的占比，用于决定知识库条目优先级 |

Demo 里时间线的 `payment` 事件带 `method` 字段，作为这些指标的数据来源。

## 9. 前提与依赖

| # | 前提 | 若不成立 |
|---|---|---|
| P1 | Trip.com 能以微信支付商户身份生成 ¥1 收款码，并能接受 TenPayGo 付款 | ¥1 验证只能做到"引导用户在 TenPayGo 里绑卡并自查" |
| P2 | 用户在国外时 TenPayGo 能完成测试付款（协议写明仅限中国大陆） | 就是 REGION_UNAVAILABLE 分支：落地后再测，行前以支付宝为准 |
| P3 | 原生 App 能检测 TenPayGo 是否安装（URL Scheme 未公开） | 说明文字不显示"已安装 / 未安装"，只显示是否验证 |

## 10. 发布清单

- [ ] 知识库校验通过，`tutorials.json` 导出 10 篇
- [ ] 后端测试全部通过
- [ ] H5 端到端脚本通过，关键屏截图复核
- [ ] README 状态表、接口一览更新
- [ ] PR 描述附测试结果与已知局限
