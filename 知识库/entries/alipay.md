# 支付宝 / Alipay · 知识库条目预览

识别关键词（中）：支付宝、绑定银行卡、添加银行卡、验证失败、身份验证、实名认证、付款码、扫一扫、支付密码、TourCard、交易限额、银行卡不支持、滴滴、打车、账户受限、风险、冻结、你好中国

识别关键词（英）：Alipay, Add bank card, Bank Cards, Verification failed, Identity Verification, Card not supported, Issuer declined, Payment limit, TourCard, Pay/Receive, payment password, DiDi, taxi, ride, locked, restricted, risk, Nihao China, personal collection code

界面特征：Blue Alipay app chrome. Screens with a bank-card form (card number, expiry, CVV), a red or grey failure banner, a passport-upload prompt, a QR payment code page, or a mini-program named TourCard.

---

## Set up Alipay before you fly

`alipay_setup_before_flight` · 阶段 preflight · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-02

**Why** Most shops, taxis and metro gates in China take mobile payment only. Setting up at home on Wi-Fi takes 10 minutes and avoids doing it jet-lagged with no data.

**Do this now**
1. Install Alipay from the App Store or Google Play. Outside China it opens in English automatically.
2. Sign up with your own mobile number (any country) and enter the SMS code. No Chinese number or Chinese bank account is needed.
3. Tap Me > Bank Cards > Add Now. Set a 6-digit payment password, then add one mainstream credit card: Visa, Mastercard, JCB, Discover, Diners Club or UnionPay.
4. Tap Me > Settings > Account & Security > Identity Verification. Upload your passport photo page and do the face check. Do this now, not later.

**Still stuck** If the card will not link, see Card won't link. If you prefer not to link a card, open TourCard inside Alipay as a prepaid wallet.

**依赖的事实**

- [verified] Supported card networks: Visa, Mastercard, JCB, Discover, Diners Club, UnionPay — Trip.com, WildChina and Beijing gov agree. Amex: not on the official list; treat as unsupported.
- [verified] Registration works with a non-Chinese phone number — All sources agree.

**来源** [Trip.com · How to Use Alipay in China for Foreigners 2026](https://www.trip.com/guide/phone/how-to-use-alipay.html) 2026-04-08；[Beijing Government · Payment Services (step-by-step card linking)](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html) 2024-08-30；[WildChina · Guide to Using Alipay in 2026](https://wildchina.com/2026/05/guide-to-using-alipay-2026/) 2026-05-29

**可推荐给用户** [Trip.com guide: How to use Alipay in China](https://www.trip.com/guide/phone/how-to-use-alipay.html)；[Beijing Government: Payment Services for new arrivals](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html)

相关：`alipay_card_bind_failed`, `alipay_identity_verification`, `alipay_tourcard`

---

## Card won't link to Alipay

`alipay_card_bind_failed` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** Alipay asks your bank to approve the card. Banks often block an unfamiliar Chinese merchant, and debit, prepaid and virtual cards fail more than mainstream credit cards.

**Do this now**
1. Try a different card first: a credit card from a major bank on another network (Visa if Mastercard failed, or the reverse). Fintech cards such as Wise or Revolut succeed more often than traditional bank cards.
2. In your banking app turn on International transactions and Online purchases, wait 10 minutes, then add the card again. If it still fails, call the bank: say you are in China paying through Alipay and the merchant will show as Alipay or Ant Group.
3. Make the name on the card, your passport and your Alipay profile match exactly, including middle names, then finish Identity Verification (Me > Settings > Account & Security) before adding the card again.
4. Still refused: set up Nihao China instead. It is the official inbound-visitor app, registers with email or Apple ID, links Visa, Mastercard and UnionPay, and does not depend on an Alipay card link.

**Still stuck** Open TourCard inside Alipay as a prepaid wallet, or withdraw cash at a Bank of China ATM with your foreign card. Alipay English support: +86 571 2688 6000, daily 08:00-24:00.

**依赖的事实**

- [verified] Alipay English hotline +86 571 2688 6000, daily 08:00-24:00 China time — Beijing gov page and WaysChina agree.
- [unverified] Bank of China ATMs accept Visa/Mastercard/JCB/Amex, 3,000 RMB per withdrawal — Single source (WaysChina). Check before quoting the cap.

**来源** [PayInChinaGuide · Alipay 'Card Issuing Bank Declined' Error](https://www.payinchinaguide.com/blog/alipay-issuing-bank-declined-fix) 2026-03；[Trip.com · Alipay Not Working in China? Common Causes and How to Fix It](https://www.trip.com/guide/payments/alipay-not-working-in-china.html) 2026-07-02；[WaysChina · How to Use Alipay with Foreign Cards: Setup, Fees and Fixes](https://wayschina.com/en/articles/how-to-use-alipay-with-foreign-cards) 2026-08；[Trip.com · Nihao China App: Setup, Card Link & Payment Guide](https://www.trip.com/guide/info/nihao-china-app.html) 2026-06-12

相关：`alipay_identity_verification`, `alipay_tourcard`, `alipay_nihao_china`, `alipay_account_locked`

---

## No SMS code from Alipay

`alipay_sms_code_not_received` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-02

**Why** The code goes to the number you registered with. After landing, many phones are on a new eSIM or have roaming off, so the SMS to your home number never arrives.

**Do this now**
1. Make sure the SIM that owns your registered number can receive texts: turn on roaming for that line, or switch it back on if you disabled it for an eSIM.
2. On the code screen choose the voice-call option if offered. Alipay can read the code out in an automated call.
3. Wait 60 seconds before requesting again. Repeated taps can lock requests for a few minutes.
4. Check your country code is correct on the login screen and that the number has no leading zero.

**Still stuck** If your home number cannot receive texts in China at all, you cannot log in until it can: turn roaming on for that line, or contact Alipay support at +86 571 2688 6000 to change the registered number.

**依赖的事实**

- [verified] Alipay offers a voice-call delivery of the verification code — WildChina registration section.

**来源** [WildChina · Guide to Using Alipay in 2026 (Registration)](https://wildchina.com/2026/05/guide-to-using-alipay-2026/) 2026-05-29；[Trip.com · How to Use Alipay in China for Foreigners 2026](https://www.trip.com/guide/phone/how-to-use-alipay.html) 2026-04-08

相关：`alipay_setup_before_flight`

---

## Payment failed at the counter

`alipay_payment_declined` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-03

**Why** Three different things look the same at the counter: your bank refused the charge, the shop showed a personal collection code that foreign cards cannot pay, or you hit a limit. Alipay prints a short reason on the failure screen.

**Do this now**
1. Ask the cashier to scan YOUR code instead: open Pay/Receive and show the barcode. Foreign cards cannot pay a person's own collection QR, only registered merchant codes, and scanning their code at a stall or small shop fails for that reason.
2. Issuer declined or Bank declined means your bank. Retry once, then turn on international and online payments in your banking app, or call the bank to allow charges from Alipay / Ant Group in China.
3. Limit exceeded or a request for ID means you hit the unverified allowance. Complete Identity Verification (Me > Settings > Account & Security), then pay again. For large amounts, ask to split the bill.
4. Quick test: try the same card for a small payment in WeChat Pay. If both fail, it is the card or bank. If only Alipay fails, reopen Alipay, update it, and switch from Wi-Fi to mobile data.

**Still stuck** Pay with cash. Every merchant in China must accept RMB cash by law; withdraw at a Bank of China ATM with your foreign card. If the account says it is locked, see Account locked.

**依赖的事实**

- [conflict] Payments under 200 RMB are fee-free; above 200 RMB a 3% fee applies — PayInChinaGuide states this for Alipay. China Briefing confirms it as WeChat Pay's published rule. WaysChina says Alipay 'works out similarly' and to read the confirmation screen. Keep the wording 'expect a fee line' until Alipay's own page is found.
- [unverified] Minimum transaction 10 RMB — WildChina only.
- [verified] Verified users: 5,000 USD per transaction, 50,000 USD per year; unverified about 2,000 USD cumulative — WildChina, PayInChinaGuide and WaysChina agree; raised in March 2024 per PBOC.
- [verified] Foreign cards cannot pay personal collection codes, only merchant codes; there is no visual difference — PayInChinaGuide and Trip.com both state it.

**来源** [PayInChinaGuide · Alipay 'Card Issuing Bank Declined' Error](https://www.payinchinaguide.com/blog/alipay-issuing-bank-declined-fix) 2026-03；[Trip.com · Alipay Not Working in China? Common Causes and How to Fix It](https://www.trip.com/guide/payments/alipay-not-working-in-china.html) 2026-07-02；[PayInChinaGuide · Alipay for Foreigners FAQ (fees, limits, errors)](https://www.payinchinaguide.com/blog/alipay-foreigners-2025-ultimate-faq) 2026-03；[Beijing Government · Payment Services (cash must be accepted)](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html) 2024-08-30

相关：`alipay_identity_verification`, `alipay_card_bind_failed`, `alipay_account_locked`

---

## Alipay asks for your passport

`alipay_identity_verification` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-03

**Why** Chinese rules let you spend a small total without ID. Past that, or for larger single payments, Alipay must verify your passport before it lets the payment through.

**Do this now**
1. Tap Me > Settings > Account & Security > Identity Verification. When asked for region choose Non-Mainland China, then Passport. Choosing Mainland China asks for a Chinese ID number and fails.
2. Photograph the passport photo page flat, in daylight, no glare, all four corners visible. If offered, scan the passport's NFC chip instead by holding the phone on the back cover; it skips the photo check and succeeds more often.
3. Type your name exactly as the passport prints it, including middle names and suffixes, and make the linked card's name match. For the face check, face a window, remove glasses, hold still.
4. Wait. Most checks finish within minutes; manual reviews take up to 24 hours. After 3 to 5 failed attempts the flow locks for 24 hours, so stop retrying and wait.

**Still stuck** Still rejected after a day: contact Alipay support in the app (Me > Settings > Help Center) or call +86 571 2688 6000 for a manual review, which takes 1 to 3 working days. Meanwhile use Nihao China or cash.

**依赖的事实**

- [verified] Up to about 2,000 USD may be spent without ID; verification is required for single transactions over 500 USD — WildChina states both thresholds (March 2024 rules); PayInChinaGuide confirms the 2,000 USD cap.
- [unverified] Verification usually completes within an hour, up to 72 hours — WildChina only.
- [unverified] Passports with under 6 months validity are often rejected by verification — Trip.com guide only.
- [verified] 3-5 failed attempts lock verification for 24 hours — Trip.com and ChinaVigators agree.

**来源** [ChinaVigators · Alipay Verification Failed? How to Fix It](https://www.chinavigators.com/alipay-verification-failed/) 2026-03-19；[Trip.com · Alipay Not Working in China? Common Causes and How to Fix It](https://www.trip.com/guide/payments/alipay-not-working-in-china.html) 2026-07-02；[PayInChinaGuide · Alipay Passport Verification Failed: How to Fix](https://www.payinchinaguide.com/blog/alipay-passport-verification-failed-fix) 2026；[WildChina · Guide to Using Alipay in 2026 (Verification, FAQ)](https://wildchina.com/2026/05/guide-to-using-alipay-2026/) 2026-05-29

相关：`alipay_payment_declined`, `alipay_card_bind_failed`

---

## Use TourCard when your card won't link

`alipay_tourcard` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-02

**Why** TourCard is a prepaid wallet inside Alipay issued by a Chinese bank. You top it up from your foreign card, so it works even when direct card linking is refused. It costs more per top-up.

**Do this now**
1. In Alipay, type TourCard in the top search bar and open the mini-program.
2. Register with your passport when prompted.
3. Top up from a Visa, Mastercard, JCB or Diners Club card. A service charge is added to each top-up; the exact rate is shown before you confirm.
4. Pay as usual with Pay/Receive or Scan. TourCard is for paying merchants only, not for sending money to people.

**Still stuck** If TourCard also refuses your card, use cash from a Bank of China ATM, or check whether your home e-wallet is part of the Alipay+ network and can scan Chinese codes directly.

**依赖的事实**

- [conflict] TourCard validity 180 days, top-up cap 10,000 RMB, 5% fee per top-up — WildChina and PayInChinaGuide say 180 days / 10,000 RMB / 5%. A 2026 search summary cited 90 days. WaysChina says fees and caps vary between sources. Do not quote numbers to users until checked in the TourCard mini-program agreement.
- [unverified] TourCard accepts Visa, Mastercard, Diners Club, JCB; Amex not yet — WildChina only.
- [conflict] PayInChinaGuide claims TourCard allows peer-to-peer transfers; WildChina says it does not — Entry says merchants only, the safer claim.

**来源** [WildChina · Guide to Using Alipay in 2026 (Option 2: TourCard)](https://wildchina.com/2026/05/guide-to-using-alipay-2026/) 2026-05-29；[PayInChinaGuide · Alipay for Foreigners FAQ (TourCard)](https://www.payinchinaguide.com/blog/alipay-foreigners-2025-ultimate-faq) 2026-03；[ChinaGuidelines · Tour Card 完整申请与使用指南 (中文)](https://chinaguidelines.com/zh/posts/tour-card) 2026

相关：`alipay_card_bind_failed`

---

## How to pay at a shop with Alipay

`alipay_how_to_pay` · 阶段 landing · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-02

**Why** There are two directions: the cashier scans you, or you scan the shop's printed code. Small stalls usually have a printed code; chains and taxis scan you.

**Do this now**
1. To be scanned: open Alipay, tap Pay/Receive at the top, hold the barcode and QR code to the scanner. Enter your 6-digit payment password if asked.
2. To scan them: tap Scan, point at the shop's printed QR code, type the amount the cashier tells you, confirm.
3. Check the confirmation screen for the amount and any fee line, then confirm.
4. Online, choose Alipay at checkout; the site opens the app or shows a QR code for you to scan.

**Still stuck** If the code will not scan, ask the cashier to scan yours instead, or pay cash.

**来源** [WildChina · Guide to Using Alipay in 2026 (Using Alipay for Payments)](https://wildchina.com/2026/05/guide-to-using-alipay-2026/) 2026-05-29；[Beijing Government · Payment Services](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html) 2024-08-30

相关：`alipay_payment_declined`

---

## Call a DiDi ride from inside Alipay

`alipay_didi_miniprogram` · 阶段 landing · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-02

**Why** DiDi inside Alipay needs no Chinese phone number and charges your linked card automatically. The WeChat version of DiDi may refuse accounts without a Chinese number.

**Do this now**
1. Open Alipay and type DiDi in the top search bar, or tap the DiDi icon on the home screen.
2. Allow location, confirm the pickup pin, type the destination in English or Chinese.
3. Pick a ride type (Express is the cheapest), confirm. The fare is charged to your linked card after the ride.
4. When the car arrives, match the licence plate with the one shown. The driver may ask for the last 4 digits of your phone number; show them on screen.

**Still stuck** Use the in-app chat; messages are translated automatically. For help, DiDi has 24/7 English support under Account > Help.

**依赖的事实**

- [verified] DiDi via the Alipay mini-program does not require a Chinese phone number — WildChina Didi guide; WeChat guide notes WeChat mini-programs may need a Chinese number.

**来源** [WildChina · Guide to Using Didi in China 2025](https://wildchina.com/2025/10/a-guide-to-using-didi-in-china-2025/) 2025-11-10；[WildChina · Guide to Using Alipay in 2026 (Using Didi in Alipay)](https://wildchina.com/2026/05/guide-to-using-alipay-2026/) 2026-05-29；[Trip.com · How to Use DiDi in China for Foreigners](https://www.trip.com/guide/transport/how-to-use-didi-in-china.html) 2026-05-14

**可推荐给用户** [Trip.com guide: How to use DiDi in China](https://www.trip.com/guide/transport/how-to-use-didi-in-china.html)

相关：`alipay_setup_before_flight`

---

## Alipay says your account is locked or restricted

`alipay_account_locked` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** Too many failed card links, verification attempts or payments in a short time trigger a temporary risk lock. It usually lifts by itself; retrying makes it longer.

**Do this now**
1. Stop retrying. Note the exact message and the time.
2. Make sure you are on a normal mobile or Wi-Fi connection without any network tool that routes traffic abroad; Alipay's risk system flags foreign-looking traffic.
3. Wait 24 hours, then open Alipay once and check whether the lock has lifted.
4. If it has not, contact support in the app (Me > Settings > Help Center > Contact Us) with your passport number, registered phone and a screenshot of the message.

**Still stuck** Use Nihao China or cash in the meantime. Alipay English support: +86 571 2688 6000, daily 08:00-24:00.

**依赖的事实**

- [unverified] Risk locks typically auto-release within 24-72 hours — TravelerLocal; Trip.com says wait 24 hours.

**来源** [Trip.com · Alipay Not Working in China? Common Causes and How to Fix It](https://www.trip.com/guide/payments/alipay-not-working-in-china.html) 2026-07-02；[ChinaVigators · Alipay Verification Failed? How to Fix It](https://www.chinavigators.com/alipay-verification-failed/) 2026-03-19；[TravelerLocal · Alipay Foreign Card Declined in China: What to Check](https://www.travelerlocal.com/payments/alipay-foreign-card-fails) 2026-08-02

相关：`alipay_card_bind_failed`, `alipay_identity_verification`

---

## Use Nihao China when Alipay won't take your card

`alipay_nihao_china` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-03

**Why** Nihao China is the official app for inbound visitors, run by China UnionPay. It registers with email or Apple ID, needs no Chinese phone number, links Visa, Mastercard and UnionPay, and charges no platform fee on QR payments.

**Do this now**
1. Install Nihao China from the App Store or Google Play. Register with email, Apple ID or Google if SMS codes are not reaching you.
2. Complete identity verification with your passport when prompted.
3. Tap Profile > Tour Wallet > Bank Card > +. Enter the card details and pass your bank's one-time check; a 1 yuan pre-authorisation is taken and refunded.
4. Pay with Pay (show your code) or Scan (scan the shop's code), the same two ways as Alipay.

**Still stuck** If Nihao China also refuses the card, top up its Tour Wallet from the card instead (small load fee), or use cash.

**依赖的事实**

- [unverified] Tour Wallet top-up fee about 0.5% — Single source (Trip.com guide).
- [unverified] Launched December 2025 by China UnionPay — Trip.com guide and search summary.

**来源** [Trip.com · Nihao China App: Setup, Card Link & Payment Guide](https://www.trip.com/guide/info/nihao-china-app.html) 2026-06-12

**可推荐给用户** [Trip.com guide: Nihao China App setup](https://www.trip.com/guide/info/nihao-china-app.html)

相关：`alipay_card_bind_failed`, `alipay_tourcard`

