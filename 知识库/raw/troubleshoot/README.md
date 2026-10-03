# 支付失败排查资料 · 索引与结论

抓取日期 2026-10-03，共 27 篇，专门覆盖"失败了怎么办"。与 `../README.md` 里按场景分组的设置类指南互补。

## 一、支付宝有没有官方的解决方案页

**没有可公开访问的英文帮助页。** 试过 global.alipay.com、intl.alipay.com、cshall.alipay.com、render.alipay.com，要么跳到商户向的 Antom 文档，要么是中文客服大厅。支付宝给国际用户的"官方解决方案"只存在于三个地方：

| 渠道 | 怎么用 | 来源 |
|---|---|---|
| App 内客服 | Me → Settings → Help Center → Contact Us；或 Me → Bank Cards → FAQ → 我的客服。24 小时，有英文 | 多个指南一致 |
| 英文热线 | +86 571 2688 6000（境外拨）/ 0571 2688 6000（境内拨），每日 08:00–24:00 中国时间 | 北京政府 Payment Services 页、WaysChina |
| 中文热线 | 95188，24 小时 | chinavigators 称有英文时段，未核实 |

所以我们条目里的"官方来源"只能是：北京市政府英文站的支付服务页（含逐步绑卡）、Alipay+ 官方页（支持的卡组织）、以及这两个客服入口。失败场景的具体步骤来自下面这些第三方指南，彼此交叉核验。

## 二、按失败类型汇总的解决办法（已交叉核验）

### 1. 绑卡失败 / "Card Issuing Bank Declined" / 错误码 C6、1011

原因按概率排：银行风控拦截了首次中国交易；卡没开通国际线上交易或 3-D Secure；卡组织不支持（Amex、预付卡、虚拟卡、企业卡）；姓名与护照不一致；卡 90 天内到期。
解决顺序：
1. 换一张主流银行的信用卡（Visa 换 Mastercard 或反之）。
2. 在银行 App 里打开"国际交易 / 线上支付"开关，等 10 分钟再绑。
3. 打电话给银行，说明在中国用支付宝，商户名显示 Alipay 或 Ant Group，要求放行。美国 Chase、BoA、Citi 拦截最严。
4. 姓名改成与护照完全一致，含中间名和后缀。
5. 先完成实名再绑卡，部分绑卡失败实际是实名未完成。
6. 都不行：TourCard 预付，或 Bank of China ATM 取现。
来源：payinchinaguide（issuing-bank-declined、C6-1011）、Trip.com alipay-not-working、WaysChina、travelerlocal。

### 2. 支付被拒（已绑卡，付款时失败）

一个多数指南漏掉的原因：**外卡不能付"个人收款码"**，只能付商户码。街边摊、个人手机上的二维码会失败，看起来和银行拒绝一样。解决：让对方扫你的付款码，而不是你扫他的。
其余同绑卡失败。另加：金额超限（见 4）、网络用了境外代理触发风控、App 版本过旧。
快速判断：同一张卡在微信支付上试一次，两边都失败是卡的问题，只有支付宝失败是支付宝的问题。
来源：payinchinaguide、Trip.com。

### 3. 实名验证失败 / 卡在 Pending

原因：护照照片反光、裁边、暗；姓名与卡不一致；护照有效期不足 6 个月；选错了"中国大陆"而不是"非中国大陆"；失败 3 到 5 次后被锁 24 小时。
解决：自然光平放拍摄、四角完整；地区选 Non-Mainland China、证件选 Passport；用 NFC 读护照芯片（2010 年后的护照多有）比拍照成功率高；人脸识别面向光源、摘眼镜；提交后等 24 小时，很多是人工审核；仍失败则 App 内客服转人工，1 到 3 个工作日。
未实名的额度：约 1,000 元/日，年累计约 2,000 美元。
来源：chinavigators、hiddenchinatravel、Trip.com、payinchinaguide。

### 4. 交易超限

已实名：单笔 5,000 美元、年 50,000 美元（2024 年 3 月人民银行上调）。未实名：约 2,000 美元累计。另有银行自己的限额和商户限额。解决：分两笔付；去大商户；完成实名。
来源：payinchinaguide limits、WaysChina、WildChina。

### 5. 收不到短信验证码

注册号所在的 SIM 要能收短信：开漫游，或把为 eSIM 关掉的主卡重新打开；选语音播报验证码；60 秒后再发；检查国家码和前导零。
来源：payinchinaguide sms-fix、WildChina。

### 6. 微信支付的差异

微信把绑卡放在"安全验证"里，三种方式之一是绑卡，验证扣 0.05 美元；没有中国手机号时小程序（含微信里的滴滴）可能用不了；不能提现到外卡。手续费官方口径：200 元以下免费，以上 3%，新用户 60 天内千元以下免手续费。微信"Unsupported Card"错误另有专页。
来源：China Briefing（官方口径）、payinchinaguide wechat 专页、WildChina。

### 7. 替代方案

- **Nihao China App**（2025 年 12 月上线，官方入境游客 App）：邮箱或 Apple 账号注册，不需要中国手机号，绑 UnionPay、Visa、Mastercard，绑卡时预授权 1 元并退回，平台不收手续费。值得作为"支付宝绑不上"的首选备选写进条目，来源 Trip.com 指南。
- TourCard：数字各来源冲突（有效期 90 或 180 天，上限 1 万元或更高，5% 充值费），条目里不报数字。
- 金融科技卡（Wise、Revolut）成功率明显高于传统银行卡，可作为行前建议。

## 三、这批资料对知识库的直接影响

- 支付宝现有 8 条里，`alipay_card_bind_failed` 要补"个人码 vs 商户码"和"换成让对方扫我"两步；`alipay_payment_declined` 要补"先在微信试同一张卡"的判断法；`alipay_identity_verification` 要补"选 Non-Mainland China"和 NFC 读芯片。
- 新增条目：Nihao China 作为备选；`alipay_account_locked`（失败过多锁 24 小时）。
- 微信场景可以直接按第 6 条和 payinchinaguide 的两个专页写，资料够。

## 四、篇目

| 文件 | 标题 | 更新 |
|---|---|---|
| payments-alipay-not-working-in-china.md | Trip.com · Alipay Not Working in China? | 2026-07-02 |
| alipay-not-working.md | extentage · 12 Fixes | 2026-08-02 |
| alipay-verification-failed.md | chinavigators · Verification Failed | 2026-03-19 |
| alipay-wechat-pay-verification-failed.md | hiddenchinatravel | 2026-08-26 |
| blog-alipay-issuing-bank-declined-fix.md | payinchinaguide · Issuing Bank Declined | 2026-03 |
| specific-error-fix-issuer-declined-payment-error-c6-1011.md | payinchinaguide · C6 / 1011 | |
| specific-error-fix-sms-verification-code-error.md | payinchinaguide · SMS code | |
| blog-wechat-pay-card-declined-fix.md | payinchinaguide · WeChat declined | |
| specific-error-wechat-pay-unsupported-card.md | payinchinaguide · WeChat Unsupported Card | |
| specific-error-foreign-card-payment-limits-explained.md | payinchinaguide · Limits | |
| blog-alipay-passport-verification-failed-fix.md | payinchinaguide · Passport verification | |
| blog-us-banks-china-guide-chase-boa-citi.md | payinchinaguide · US banks | |
| blog-visa-vs-mastercard-china-2025-best-alipay-wechatpay.md | payinchinaguide · Visa vs Mastercard | |
| blog-amex-payments-china-guide.md | payinchinaguide · Amex | |
| tool-payment-error-codes.md | payinchinaguide · 错误码查询（页面只有样例） | |
| guides-using-wechat.md / guides-need-cash-or-not-in-china.md | payinchinaguide | |
| payments-alipay-foreign-card-fails.md | travelerlocal | 2026-08-02 |
| blog-how-to-verify-alipay-account-faq.md | Wise · 实名 FAQ | 2024-01-22 |
| articles-alipay-not-working-foreign-card.md | wsmzc | 2026-07-05 |
| wechat-pay-limits-guide.md | extentage · WeChat limits | 2026-08-17 |
| info-nihao-china-app.md | Trip.com · Nihao China App | 2026-06-12 |
| blog-how-to-use-alipay-with-a-foreign-credit-card.md | Trip.com US blog | |
| posts-tour-card.md | chinaguidelines · Tour Card（英文版） | |
| china-payment-guide.md | odynovotours | |
| ../readyforchina/ | readyforchina 11 页：测试页、设置教程、资源文章 | 2025-06 至 2026-01 |
