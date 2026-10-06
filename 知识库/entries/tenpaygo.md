# TenPayGo（微信支付旅客版） / TenPayGo · 知识库条目预览

识别关键词（中）：

识别关键词（英）：TenPayGo, TenPay Go, E-Wallet, Supported Payment Methods, Show payment code, Scan to pay, Under Internal Testing, Pay code, Circle for instant explanation

界面特征：Standalone TenPayGo app, English only, green accents. The Pay tab is three white cards titled Bank Card, Apple Pay and E-Wallet with a 'Supported Payment Methods' link; the bottom bar has only two tabs, Pay and Go, plus a round scan button. Bottom sheets titled 'Scan to pay' or 'Show payment code' with a green Next or Got it button. There are no Chats, Contacts, Discover or Me tabs, which is how it differs from WeChat.

---

## Set up TenPayGo before you fly

`tenpaygo_setup_before_flight` · 阶段 preflight · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-06

**Why** TenPayGo is WeChat Pay's own app for visitors. You sign up with an email address, with no Chinese phone number and no WeChat account, and it pays at shops that take WeChat Pay. Set it up at home so your bank's checks reach you on your usual number.

**Do this now**
1. Install TenPayGo from the App Store or Google Play; the developer is Tencent Technology (Shenzhen). Sign up with your email, type the code it sends and set a password.
2. On the Pay tab, add a way to pay: a Bank Card issued outside mainland China (Visa, Mastercard, American Express, JCB, Discover, Diners Club or UnionPay), Apple Pay on iPhone, or a supported E-Wallet.
3. Approve any check your bank sends: a code, an email or an in-app prompt. The card must be in your own name, with the billing address your bank has on file.
4. Learn the two ways to pay: scan the shop's green WeChat Pay code, or open your payment code and let the cashier scan it.

**Still stuck** If sign-up or the card fails, set up Alipay instead; it also books DiDi rides and buys metro tickets, which TenPayGo cannot. Keep some cash either way.

**依赖的事实**

- [verified] Sign-up needs only an email address and code; no Chinese phone number, no Chinese bank account, no WeChat account — OlaChina quoting WeChat Pay's launch guide; Reddit 1ukolqw describes the same flow.
- [verified] Card networks: UnionPay, Visa, Mastercard, American Express, JCB, Diners Club, Discover; cards must be issued outside mainland China — Cailian Press 2026-09-24 (seven networks); OlaChina (outside-mainland rule).
- [verified] Pay tab shows Bank Card, Apple Pay and E-Wallet; bottom bar has Pay and Go tabs plus a scan button — App Store screenshots 2026-09.
- [verified] Android version available on Google Play — Google Play listing updated 2026-09-24; some country stores did not list it during the beta (Reddit 1ukolqw ↑5).
- [unverified] No identity (passport) verification at sign-up — True in the beta; the service agreement says activation may require real-name information. Body text does not promise it.
- [conflict] Service fee: shown before you confirm; beta-era guides say none at ¥200 or less and 3% above — Agreement 5.1 charges card payments by card-network standards and wallets nothing; a Reddit user was charged under ¥200; the launch guide shows a crossed-out 3-yuan fee on ¥100. Body text gives no number.
- [unverified] A test payment from outside mainland China may be refused — Agreement 11.1 limits the service to the Chinese mainland; no traveller report either way.

**来源** [OlaChina · TenPayGo: WeChat Pay Without WeChat (quotes WeChat Pay's official launch guide)](https://olachina.org/tenpaygo) 2026-09-24；[Cailian Press via Sohu · Tencent officially launches TenPay Go, seven card networks, about 60 overseas wallets](https://www.sohu.com/a/1080344858_121019331) 2026-09-24；[Tenpay · TenPayGo Payment User Service Agreement (EN, 2026-06-11 version): quota, fees, mainland-only, hotline 95017](https://gtimg.wechatpay.cn/resource/xres/wego/account/TenPayGo%E6%94%AF%E4%BB%98%E7%94%A8%E6%88%B7%E6%9C%8D%E5%8A%A1%E5%8D%8F%E8%AE%AE-20260611-EN.html) 2026-06-11；[Apple App Store · TenPayGo listing (Tencent Technology (Shenzhen), v1.1.2, 3.1 from 63 ratings, screenshots)](https://apps.apple.com/us/app/tenpaygo/id6778755338) 2026-09-24；[Google Play · TenPayGo listing (com.tencent.wxpai, updated 2026-09-24)](https://play.google.com/store/apps/details?id=com.tencent.wxpai) 2026-09-24；[TripChina · TenPayGo Review 2026 (updated after public launch)](https://tripchina.me/tenpaygo-payment-guide/) 2026-10-05；[Reddit r/travelchina · TenpayGo is a much better user experience than WeChat Pay (↑36; Gmail sign-up, Apple Pay, fee reports, mini-program codes)](https://www.reddit.com/r/travelchina/comments/1ukolqw/tencents_new_payment_app_tenpaygo_is_a_much/) 2026-07-01

**可推荐给用户** [TenPayGo on the App Store](https://apps.apple.com/us/app/tenpaygo/id6778755338)；[TenPayGo on Google Play](https://play.google.com/store/apps/details?id=com.tencent.wxpai)

相关：`tenpaygo_card_bind_failed`, `tenpaygo_how_to_pay`, `tenpaygo_signup_blocked`, `alipay_setup_before_flight`

**配图**

- 第 1 步 `tenpaygo/tenpaygo_setup_before_flight/step1.mp4` — Animation: in the App Store search for TenPayGo, tap Get, wait for the ring to fill, then Open（Landing Check · own animation (HyperFrames)）
- 第 2 步 `tenpaygo/tenpaygo_setup_before_flight/step2.png`（占位，演示用） — TenPayGo Pay tab: Bank Card, Apple Pay and E-Wallet, with Supported Payment Methods below（Apple App Store · TenPayGo screenshots (Tencent)）
- 第 4 步 `tenpaygo/tenpaygo_setup_before_flight/step4.png`（占位，演示用） — Scan to pay: scan the merchant's WeChat Pay code, check the amount and confirm（Apple App Store · TenPayGo screenshots (Tencent)）

---

## TenPayGo sign-up won't go through

`tenpaygo_signup_blocked` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-06

**Why** During the June to September 2026 test, sign-ups from some email providers stopped at an 'Under Internal Testing' message, and email codes can land in spam. The app has been public since 24 September 2026, so an old version is the first thing to rule out.

**Do this now**
1. Update TenPayGo to the latest version in the App Store or Google Play, then sign up again.
2. Look for the code in your spam or promotions folder. Wait a minute before tapping resend and use only the newest code.
3. If it still says the service is in testing or not available, sign up with a Gmail address; testers report it passes when other providers do not.
4. If TenPayGo is not in your app store at all, skip it and set up Alipay. Do not install it from an APK site.

**Still stuck** Write to TenPayGo through Support > Send Feedback in the app or tenpaygo_support@tencent.com, and set up Alipay in the meantime.

**依赖的事实**

- [verified] 'Under Internal Testing' message for some non-Gmail sign-ups — Reddit 1ukolqw and PayInChinaGuide, beta period only. Not re-checked after the 2026-09-24 public launch.
- [verified] Store listing visibility varies by country or region — TripChina 2026-10-05; Reddit 1ukolqw ↑5 (a European Play Store).
- [verified] Support email tenpaygo_support@tencent.com and in-app Support > Send Feedback — OlaChina, quoting the official guide.

**来源** [Reddit r/travelchina · TenpayGo is a much better user experience than WeChat Pay (↑36; Gmail sign-up, Apple Pay, fee reports, mini-program codes)](https://www.reddit.com/r/travelchina/comments/1ukolqw/tencents_new_payment_app_tenpaygo_is_a_much/) 2026-07-01；[PayInChinaGuide · TenPayGo: Tencent's new payment app for foreigners (beta period)](https://www.payinchinaguide.com/blog/tenpaygo-tencent-app-for-foreigners) 2026-06-28；[TripChina · TenPayGo Review 2026 (updated after public launch)](https://tripchina.me/tenpaygo-payment-guide/) 2026-10-05；[OlaChina · TenPayGo: WeChat Pay Without WeChat (quotes WeChat Pay's official launch guide)](https://olachina.org/tenpaygo) 2026-09-24

相关：`tenpaygo_setup_before_flight`, `alipay_setup_before_flight`

---

## Card won't link to TenPayGo

`tenpaygo_card_bind_failed` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-06

**Why** The usual message is 'The bank did not approve this transaction': your bank blocked the verification charge from an unfamiliar Chinese merchant, which is rarely TenPayGo's fault. Mainland-issued cards are refused by design, and prepaid or virtual cards fail more often.

**Do this now**
1. Open your bank app, allow international and online transactions and make sure 3-D Secure is on, then add the card again after a few minutes.
2. Type the cardholder name and billing address exactly as your bank has them; the card must be in your own name.
3. On iPhone, switch on Apple Pay on the Pay tab instead of typing the card; it is a separate option that uses the card already in your Wallet.
4. Try another card, ideally a Visa or Mastercard credit card from a major bank. Do not retry the same card many times in a row.

**Still stuck** Alipay runs its own card check, so try the same card there. Otherwise carry cash from a Bank of China ATM.

**依赖的事实**

- [verified] Link failure message 'The bank did not Approve this Transaction' on Visa and Mastercard — Reddit 1wp1prm ↑21; the same wording as WeChat Pay, see wechat_card_unsupported.
- [verified] Most failures are the issuing bank blocking the charge — Reddit 1wp1prm top comment ↑88; TripChina lists issuer controls and 3-D Secure.
- [verified] Card must be in the user's own name — Service agreement 2.8.
- [verified] Apple Pay is a separate payment option on the Pay tab — App Store screenshots; Reddit 1ukolqw. Whether it passes when a typed card fails is not established, so the body does not claim it.

**来源** [Reddit r/chinalife · Tencent released a new payment app for foreigners (TenPayGo) (↑255; cards blocked by issuer ↑88; 'The bank did not Approve this Transaction' ↑21)](https://www.reddit.com/r/chinalife/comments/1wp1prm/tencent_released_a_new_payment_app_for_foreigners/) 2026-09-24；[Tenpay · TenPayGo Payment User Service Agreement (EN, 2026-06-11 version): quota, fees, mainland-only, hotline 95017](https://gtimg.wechatpay.cn/resource/xres/wego/account/TenPayGo%E6%94%AF%E4%BB%98%E7%94%A8%E6%88%B7%E6%9C%8D%E5%8A%A1%E5%8D%8F%E8%AE%AE-20260611-EN.html) 2026-06-11；[OlaChina · TenPayGo: WeChat Pay Without WeChat (quotes WeChat Pay's official launch guide)](https://olachina.org/tenpaygo) 2026-09-24；[TripChina · TenPayGo Review 2026 (updated after public launch)](https://tripchina.me/tenpaygo-payment-guide/) 2026-10-05；[Apple App Store · TenPayGo listing (Tencent Technology (Shenzhen), v1.1.2, 3.1 from 63 ratings, screenshots)](https://apps.apple.com/us/app/tenpaygo/id6778755338) 2026-09-24

相关：`tenpaygo_payment_declined`, `tenpaygo_setup_before_flight`, `alipay_card_bind_failed`, `wechat_card_unsupported`

---

## How to pay at a shop with TenPayGo

`tenpaygo_how_to_pay` · 阶段 landing · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-06

**Why** TenPayGo pays wherever WeChat Pay is accepted. Stalls and small shops show a QR code that you scan; supermarkets and chains scan a code on your phone.

**Do this now**
1. At a stall or small shop: tap the scan button, scan their green WeChat Pay code, type the amount and confirm.
2. At a supermarket or chain: open your payment code and let the cashier scan it, then confirm on your phone if asked.
3. Before you confirm, check the shop name, the amount and any service fee shown on the last screen.

**Still stuck** If the code opens a menu or a mini-program instead of a payment page, TenPayGo cannot use it: ask to pay at the counter, or use Alipay.

**依赖的事实**

- [verified] Two ways to pay: scan the merchant code, or show your payment code — App Store screenshots 'Scan to pay' and 'Show payment code'; OlaChina.
- [verified] The fee, if any, is shown before you confirm — OlaChina quoting the official FAQ; TripChina.

**来源** [Apple App Store · TenPayGo listing (Tencent Technology (Shenzhen), v1.1.2, 3.1 from 63 ratings, screenshots)](https://apps.apple.com/us/app/tenpaygo/id6778755338) 2026-09-24；[OlaChina · TenPayGo: WeChat Pay Without WeChat (quotes WeChat Pay's official launch guide)](https://olachina.org/tenpaygo) 2026-09-24；[TripChina · TenPayGo Review 2026 (updated after public launch)](https://tripchina.me/tenpaygo-payment-guide/) 2026-10-05

相关：`tenpaygo_qr_not_supported`, `tenpaygo_payment_declined`, `alipay_how_to_pay`, `wechat_how_to_pay`

**配图**

- 第 1 步 `tenpaygo/tenpaygo_how_to_pay/step1.png`（占位，演示用） — Scan to pay: tap scan, scan the merchant's WeChat Pay code, check the amount and confirm（Apple App Store · TenPayGo screenshots (Tencent)）
- 第 2 步 `tenpaygo/tenpaygo_how_to_pay/step2.png`（占位，演示用） — Show payment code: let the cashier scan your Pay code, then confirm on your phone（Apple App Store · TenPayGo screenshots (Tencent)）

---

## TenPayGo can't pay this QR code

`tenpaygo_qr_not_supported` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-06

**Why** TenPayGo only pays WeChat Pay merchant codes. Alipay-only codes, restaurant table codes that open an ordering mini-program, and metro gates outside Shenzhen do not work in it.

**Do this now**
1. Look at the sticker: a blue Alipay code needs Alipay. Ask the staff for WeChat Pay (Weixin); many shops have both codes.
2. At a restaurant table code, order with the staff or at the counter, then pay by showing your TenPayGo payment code.
3. For the metro outside Shenzhen, use Alipay's transit code or buy a single ticket at the machine.

**Still stuck** Carry some cash for the code that nothing else can pay.

**依赖的事实**

- [verified] No mini-programs in TenPayGo (DiDi, Amap, Dianping, tickets) — OlaChina quoting the official guide; Reddit 1wp1prm ↑11.
- [verified] Transit code only for Shenzhen metro and buses, opening gradually — Cailian Press 2026-09-24; OlaChina.
- [verified] Merchant QR configuration can still block a WeChat Pay code — TripChina 2026-10-05.

**来源** [OlaChina · TenPayGo: WeChat Pay Without WeChat (quotes WeChat Pay's official launch guide)](https://olachina.org/tenpaygo) 2026-09-24；[Cailian Press via Sohu · Tencent officially launches TenPay Go, seven card networks, about 60 overseas wallets](https://www.sohu.com/a/1080344858_121019331) 2026-09-24；[Reddit r/travelchina · TenpayGo is a much better user experience than WeChat Pay (↑36; Gmail sign-up, Apple Pay, fee reports, mini-program codes)](https://www.reddit.com/r/travelchina/comments/1ukolqw/tencents_new_payment_app_tenpaygo_is_a_much/) 2026-07-01；[TripChina · TenPayGo Review 2026 (updated after public launch)](https://tripchina.me/tenpaygo-payment-guide/) 2026-10-05

相关：`tenpaygo_how_to_pay`, `alipay_how_to_pay`, `wechat_miniprogram_needs_chinese_number`

---

## TenPayGo payment declined

`tenpaygo_payment_declined` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-06

**Why** A card that linked fine can still be declined when you pay: your bank wants a 3-D Secure confirmation, it blocked the merchant, or you reached the spending quota TenPayGo set for your account.

**Do this now**
1. Approve the check your bank sends (a code or an in-app prompt), then pay again once.
2. If the message mentions a limit or quota, follow the in-app prompt to raise it, or pay this one another way.
3. Pay with another source you added: a second card, Apple Pay or an E-Wallet.
4. Still declined: pay with Alipay or cash, and ask your bank to allow payments to Chinese merchants.

**Still stuck** Contact TenPayGo through Support > Send Feedback, tenpaygo_support@tencent.com, or the Tenpay hotline 95017.

**依赖的事实**

- [verified] Payments are limited to a quota shown in the app, which can be raised by following the in-app guidance — Service agreement 1.5.1; amounts are not published.
- [unverified] Third-party claims of $5,000 per payment and $50,000 per year — General inbound-payment limits quoted by ChinaTravelPlus, not published by TenPayGo; not used in the body.
- [verified] Hotline 95017 — Service agreement 2.7 and 4.12.

**来源** [Tenpay · TenPayGo Payment User Service Agreement (EN, 2026-06-11 version): quota, fees, mainland-only, hotline 95017](https://gtimg.wechatpay.cn/resource/xres/wego/account/TenPayGo%E6%94%AF%E4%BB%98%E7%94%A8%E6%88%B7%E6%9C%8D%E5%8A%A1%E5%8D%8F%E8%AE%AE-20260611-EN.html) 2026-06-11；[TripChina · TenPayGo Review 2026 (updated after public launch)](https://tripchina.me/tenpaygo-payment-guide/) 2026-10-05；[OlaChina · TenPayGo: WeChat Pay Without WeChat (quotes WeChat Pay's official launch guide)](https://olachina.org/tenpaygo) 2026-09-24

相关：`tenpaygo_card_bind_failed`, `tenpaygo_status_unclear`, `alipay_payment_declined`

---

## TenPayGo says failed but you were charged

`tenpaygo_status_unclear` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-06

**Why** App Store reviewers report a payment page that said 'failed' while Apple Pay had already charged them, and shops saying nothing arrived. The card hold and the payment result can take a while to match.

**Do this now**
1. Do not pay again yet. Open your TenPayGo transaction records and check whether the payment is listed.
2. Ask the shop to check whether the money reached them and show them your screen.
3. If your card shows a charge but TenPayGo and the shop do not, screenshot both and send them through Support > Send Feedback.
4. Refunds go back to the original card; the shop starts them, and the timing depends on your bank.

**Still stuck** Call the Tenpay hotline 95017 or email tenpaygo_support@tencent.com with the screenshots and the time of payment.

**依赖的事实**

- [verified] Failed screen while Apple Pay was charged; shop says no money arrived — App Store reviews, 2026-09.
- [verified] Transaction records are viewable in the app — Service agreement 3.2.
- [verified] Refunds return to the original card and are started by the merchant — Service agreement 5.2 and refund clause; OlaChina.

**来源** [Apple App Store · TenPayGo listing (Tencent Technology (Shenzhen), v1.1.2, 3.1 from 63 ratings, screenshots)](https://apps.apple.com/us/app/tenpaygo/id6778755338) 2026-09-24；[Tenpay · TenPayGo Payment User Service Agreement (EN, 2026-06-11 version): quota, fees, mainland-only, hotline 95017](https://gtimg.wechatpay.cn/resource/xres/wego/account/TenPayGo%E6%94%AF%E4%BB%98%E7%94%A8%E6%88%B7%E6%9C%8D%E5%8A%A1%E5%8D%8F%E8%AE%AE-20260611-EN.html) 2026-06-11；[TripChina · TenPayGo Review 2026 (updated after public launch)](https://tripchina.me/tenpaygo-payment-guide/) 2026-10-05；[OlaChina · TenPayGo: WeChat Pay Without WeChat (quotes WeChat Pay's official launch guide)](https://olachina.org/tenpaygo) 2026-09-24

相关：`tenpaygo_payment_declined`, `tenpaygo_how_to_pay`

