# 支付宝 / Alipay · 知识库条目预览

识别关键词（中）：支付宝、绑定银行卡、添加银行卡、验证失败、身份验证、实名认证、付款码、扫一扫、支付密码、TourCard、交易限额、银行卡不支持

识别关键词（英）：Alipay, Add bank card, Bank Cards, Verification failed, Identity Verification, Card not supported, Issuer declined, Payment limit, TourCard, Pay/Receive, payment password

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

`alipay_card_bind_failed` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-02

**Why** Alipay asks your bank to approve the card. Banks often block an unfamiliar Chinese merchant, and debit, prepaid and virtual cards fail more than mainstream credit cards.

**Do this now**
1. Try a different card first: a credit card from a major bank on another network (Visa if Mastercard failed, or the reverse). This fixes most cases.
2. Check that the name on the card, on your passport and in your Alipay profile match exactly.
3. Finish Identity Verification (Me > Settings > Account & Security > Identity Verification), then add the card again. Some link failures are really verification failures.
4. Call your bank: ask them to allow international online transactions and confirm the card supports online verification (3-D Secure). Then retry once.

**Still stuck** Open TourCard inside Alipay and top it up from your card instead. If that also fails, withdraw cash at a Bank of China ATM with your foreign card.

**依赖的事实**

- [verified] Alipay English hotline +86 571 2688 6000, daily 08:00-24:00 China time — Beijing gov page and WaysChina agree.
- [unverified] Bank of China ATMs accept Visa/Mastercard/JCB/Amex, 3,000 RMB per withdrawal — Single source (WaysChina). Check before quoting the cap.

**来源** [WaysChina · How to Use Alipay with Foreign Cards: Setup, Fees and Fixes](https://wayschina.com/en/articles/how-to-use-alipay-with-foreign-cards) 2026-08；[WildChina · Guide to Using Alipay in 2026 (Option 1)](https://wildchina.com/2026/05/guide-to-using-alipay-2026/) 2026-05-29；[PayInChinaGuide · Alipay for Foreigners FAQ](https://www.payinchinaguide.com/blog/alipay-foreigners-2025-ultimate-faq) 2026-03

相关：`alipay_identity_verification`, `alipay_tourcard`, `alipay_setup_before_flight`

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

`alipay_payment_declined` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-02

**Why** Either the shop's amount tripped a limit, your bank declined the charge, or the terminal only reads one payment method. Alipay shows a short reason on the failure screen.

**Do this now**
1. Read the failure line. Issuer declined or Bank declined means your bank: retry once, then call the bank to allow transactions in China.
2. Limit exceeded means you have hit the unverified allowance. Complete Identity Verification in Me > Settings > Account & Security, then pay again.
3. If the amount is above 200 RMB, expect a fee line on the confirmation screen before you confirm. Approve it.
4. If nothing is shown, close and reopen Alipay, then tap Pay/Receive again. Let the cashier scan your code instead of you scanning theirs.

**Still stuck** Pay with cash. Every merchant in China must accept RMB cash by law. Withdraw at a Bank of China ATM with your foreign card.

**依赖的事实**

- [conflict] Payments under 200 RMB are fee-free; above 200 RMB a 3% fee applies — PayInChinaGuide states this for Alipay. China Briefing confirms it as WeChat Pay's published rule. WaysChina says Alipay 'works out similarly' and to read the confirmation screen. Keep the wording 'expect a fee line' until Alipay's own page is found.
- [unverified] Minimum transaction 10 RMB — WildChina only.
- [verified] Verified users: 5,000 USD per transaction, 50,000 USD per year; unverified about 2,000 USD cumulative — WildChina, PayInChinaGuide and WaysChina agree; raised in March 2024 per PBOC.

**来源** [PayInChinaGuide · Alipay for Foreigners FAQ (fees, limits, errors)](https://www.payinchinaguide.com/blog/alipay-foreigners-2025-ultimate-faq) 2026-03；[WaysChina · Alipay with Foreign Cards (fees and limits)](https://wayschina.com/en/articles/how-to-use-alipay-with-foreign-cards) 2026-08；[Beijing Government · Payment Services (cash must be accepted)](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html) 2024-08-30

相关：`alipay_identity_verification`, `alipay_card_bind_failed`

---

## Alipay asks for your passport

`alipay_identity_verification` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-02

**Why** Chinese rules let you spend a small total without ID. Past that, or for larger single payments, Alipay must verify your passport before it lets the payment through.

**Do this now**
1. Tap Me > Settings > Account & Security > Identity Verification.
2. Choose passport, photograph the photo page in good light with all four corners visible, then follow the face check.
3. Wait for the result. It usually completes within the hour; the app allows up to 72 hours.
4. Retry the payment once the status shows verified.

**Still stuck** If verification is rejected, retake the passport photo without glare and make sure the name you typed matches the passport exactly. If it fails twice, contact Alipay support at +86 571 2688 6000.

**依赖的事实**

- [verified] Up to about 2,000 USD may be spent without ID; verification is required for single transactions over 500 USD — WildChina states both thresholds (March 2024 rules); PayInChinaGuide confirms the 2,000 USD cap.
- [unverified] Verification usually completes within an hour, up to 72 hours — WildChina only.

**来源** [WildChina · Guide to Using Alipay in 2026 (Verification, FAQ)](https://wildchina.com/2026/05/guide-to-using-alipay-2026/) 2026-05-29；[Trip.com · How to Use Alipay in China for Foreigners 2026 (menu path)](https://www.trip.com/guide/phone/how-to-use-alipay.html) 2026-04-08；[PayInChinaGuide · Alipay for Foreigners FAQ](https://www.payinchinaguide.com/blog/alipay-foreigners-2025-ultimate-faq) 2026-03

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

