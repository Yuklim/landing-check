# 支付宝 / Alipay · 知识库条目预览

识别关键词（中）：支付宝、绑定银行卡、添加银行卡、验证失败、身份验证、实名认证、付款码、扫一扫、支付密码、TourCard、交易限额、银行卡不支持、滴滴、打车、账户受限、风险、冻结、你好中国、申诉、功能受限、未认证

识别关键词（英）：Alipay, Add bank card, Bank Cards, Verification failed, Identity Verification, Card not supported, Issuer declined, Payment limit, TourCard, Pay/Receive, payment password, DiDi, taxi, ride, locked, restricted, risk, Nihao China, personal collection code, ID Validated, Not Authenticated, mainland bank card, account restricted, Appeal, Merchant does not support payment via international bank cards, payment environment not secure, does not support functions like transfer, Collection restriction

界面特征：Blue Alipay app chrome. Screens with a bank-card form (card number, expiry, CVV), a red or grey failure banner, a passport-upload prompt, a QR payment code page, or a mini-program named TourCard. Restriction screens show a red or orange banner with an Appeal button. Identity Information page shows a status line such as ID Validated - Not Authenticated.

---

## Set up Alipay before you fly

`alipay_setup_before_flight` · 阶段 preflight · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** Most shops, taxis and metro gates in China take mobile payment only. Setting up at home on Wi-Fi takes 10 minutes and avoids doing it jet-lagged with no data.

**Do this now**
1. Install Alipay from the App Store or Google Play. Outside China it opens in English automatically.
2. Sign up with your own mobile number (any country) and enter the SMS code. No Chinese number or Chinese bank account is needed.
3. Tap Me > Bank Cards > Add Now. Set a 6-digit payment password, then add one mainstream credit card: Visa, Mastercard, American Express, JCB, Discover, Diners Club or UnionPay.
4. Tap Me > Settings > Account & Security > Identity Verification and upload your passport photo page. Outside China the status usually stops at ID Validated - Not Authenticated: that is normal and enough to pay. Do not tap Complete and do not bind a mainland bank card; finish the face check after landing.

**Still stuck** If the card will not link, see Card won't link. Set up WeChat Pay with the same card as a backup before you fly; restrictions and refusals hit one app far more often than both.

**依赖的事实**

- [verified] Supported card networks: Visa, Mastercard, JCB, Discover, Diners Club, UnionPay, and American Express cards issued by Amex itself — Ant Group press release 2024-05 lists Visa, Mastercard, JCB, Discover, Diners Club. Amex-Alipay official release 2025-02-25: eligible global Amex Card Members can link; Amex-branded cards issued by third parties outside the mainland cannot. Beijing gov page lists Visa, Mastercard, JCB.
- [verified] Registration works with a non-Chinese phone number — Ant Group press release 2024-05: no local bank account or phone number needed. All guides agree.
- [verified] Card-adding path Me > Bank Cards > Add — Beijing gov Payment Services: Me > Bank Cards > Add bank cards. Nantong gov FAQ: 我的 > 银行卡 > 立即绑定. The readyforchina demo GIF reaches the same page via Me > Settings > Bank Cards.
- [verified] Outside China (EU, UK, US) Alipay does not offer the face check, so verification stops at ID Validated - Not Authenticated and payments to merchants still work — Alipay support explanation quoted on Reddit (1tkh9z1 ↑3) and confirmed by several users whose payments worked in that state (1ve79qo, 1txeyao, 1s0l36o).
- [verified] Wise and Revolut cards link and pay reliably; prepaid and travel cards are often refused — Multiple independent Reddit reports 2024-2026 (1e9mxnj ↑7, 1m6pxcm ↑6, 1sduf2z ↑3, 1g16m8i ↑2).
- [unverified] One 2026 report of American Express giving "account not supported" — Single Reddit report (1qtl60s); official release says Amex-issued cards are eligible.

**来源** [Ant Group · Press release on inbound spending via Alipay: international cards Visa, Mastercard, JCB, Discover, Diners Club; no local bank account or phone number needed](https://www.antgroup.com/en/news-media/press-releases/1714976531000) 2024-05-06；[Alipay · American Express and Alipay enable payments for international travelers in China (official release)](https://idocs.alipay.com/intl-website/intl-website/en/american-express-and-alipay-to-enable-seamless-payments-for-international-travelers-in-china) 2025-02-25；[Nantong Government (Foreign Affairs Office) · 境外人士在华使用移动支付常见知识问答: Alipay and WeChat binding paths, accepted documents, WeChat fee rule](https://www.nantong.gov.cn/ntsrmzf/wscl/content/d052c16c-1ea0-464a-bc90-125f9bff5cfa.html) 2023-08-01；[Trip.com · How to Use Alipay in China for Foreigners 2026](https://www.trip.com/guide/phone/how-to-use-alipay.html) 2026-04-08；[Beijing Government · Payment Services (step-by-step card linking)](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html) 2024-08-30；[WildChina · Guide to Using Alipay in 2026](https://wildchina.com/2026/05/guide-to-using-alipay-2026/) 2026-05-29；[Reddit r/travelchina · Alipay asking me for Mainland China bank card (↑2, support explanation: no face check in EU/US ↑3)](https://www.reddit.com/r/travelchina/comments/1tkh9z1/alipay_asking_me_for_mainland_china_bank_card_for/) 2026-10-03；[Reddit r/chinatravel · Alipay Not Authenticated identity information (↑2)](https://www.reddit.com/r/chinatravel/comments/1txeyao/alipay_not_authenticated_identity_information/) 2026-10-03；[Reddit r/travelchina · Calm my nerves about digital payments (↑0, No need for Tour Card ↑10; 3% fee is real ↑6)](https://www.reddit.com/r/travelchina/comments/1e9mxnj/calm_my_nerves_about_digital_payments/) 2026-10-03

**可推荐给用户** [Trip.com guide: How to use Alipay in China](https://www.trip.com/guide/phone/how-to-use-alipay.html)；[Beijing Government: Payment Services for new arrivals](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html)；[Alipay+ · Pay in the Chinese mainland](https://www.alipayplus.com/pay-in-the-chinese-mainland/)

相关：`alipay_not_authenticated`, `alipay_card_bind_failed`, `alipay_identity_verification`, `alipay_account_locked`, `tenpaygo_setup_before_flight`

**配图**

- 第 1 步 `alipay/alipay_setup_before_flight/step1.gif`（占位，演示用） — App Store: search Alipay, install the app by Alipay (Hangzhou) Technology（readyforchina.com · AliPay setup guide (iOS)）
- 第 2 步 `alipay/alipay_setup_before_flight/step2.gif`（占位，演示用） — Alipay sign-up: pick country code, enter your mobile number, enter the SMS code（readyforchina.com · AliPay setup guide (iOS)）
- 第 3 步 `alipay/alipay_setup_before_flight/step3.gif`（占位，演示用） — Alipay: Me > Settings > Bank Cards > + to add an international card（readyforchina.com · AliPay setup guide (iOS)）
- 第 4 步 `alipay/alipay_setup_before_flight/step4.gif`（占位，演示用） — Alipay: Me > Settings > Account & Security > Identity Verification, upload passport and selfie（readyforchina.com · AliPay setup guide (iOS)）

---

## Card won't link to Alipay

`alipay_card_bind_failed` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** Alipay asks your bank to approve the card. Banks often block an unfamiliar Chinese merchant, and debit, prepaid and virtual cards fail more than mainstream credit cards.

**Do this now**
1. Try a different card first: a credit card from a major bank on another network (Visa if Mastercard failed, or the reverse). Fintech cards such as Wise or Revolut succeed more often than traditional bank cards.
2. In your banking app turn on International transactions and Online purchases, wait a few minutes, then add the card again. If it still fails, call the bank: say you are in China paying through Alipay and the merchant will show as Alipay or Ant Group.
3. Make the name on the card, your passport and your Alipay profile match exactly, including middle names. Upload the passport page first (ID Validated is enough outside China). If Alipay then asks for a photo of you holding the passport and the card, that is its normal second check: do it in good light.
4. Still refused: set up Nihao China instead. It is the official inbound-visitor app, registers with an email address or Apple account, links UnionPay, Visa and Mastercard cards, and does not depend on an Alipay card link.

**Still stuck** Add the same card to WeChat Pay instead; many cards refused by one app link in the other. Otherwise withdraw cash at a Bank of China ATM. Tour Pass is a last resort: 5% per top-up and frequent sign-up errors. Alipay English support: +86 571 2688 6000, daily 08:00-24:00.

**依赖的事实**

- [verified] Alipay English hotline +86 571 2688 6000, daily 08:00-24:00 China time — Alipay+ official page: 0571-2688 6000 locally, +86 571 2688 6000 from overseas, Mon-Sun 08:00-24:00 GMT+8. Beijing gov page agrees.
- [unverified] Bank of China ATMs accept Visa/Mastercard/JCB/Amex, 3,000 RMB per withdrawal — Single source (WaysChina). Check before quoting the cap.
- [verified] Wise shows a debit card verification request from "AliPay Merchant Services Pte. Ltd" when linking; approve it in the Wise app — Three independent Reddit reports (1s2ji2j, 1jvhojo, 1n9xk6k).
- [unverified] Prepaid and travel money cards are refused by the bank-side check; Capital One, Fidelity and Monzo refusals reported — Single reports each (1g16m8i, 1vp7loc, 1w95qun).
- [unverified] Nihao China has no Reddit reports yet — Zero mentions across 608 threads collected 2026-10-03; keep it as a documented option, not a user-proven one.

**来源** [Alipay+ · Pay in the Chinese mainland (official page; customer service +86 571 2688 6000, 08:00-24:00)](https://www.alipayplus.com/pay-in-the-chinese-mainland/) 2026-10-03；[UnionPay International · Nihao China press release (register with email or Apple account; UnionPay, Visa, Mastercard cards)](https://www.prnewswire.com/apac/news-releases/nihao-china-app-launches-as-an-all-in-one-solution-for-international-visitors-302649202.html) 2025-12-24；[PayInChinaGuide · Alipay 'Card Issuing Bank Declined' Error](https://www.payinchinaguide.com/blog/alipay-issuing-bank-declined-fix) 2026-03；[Trip.com · Alipay Not Working in China? Common Causes and How to Fix It](https://www.trip.com/guide/payments/alipay-not-working-in-china.html) 2026-07-02；[WaysChina · How to Use Alipay with Foreign Cards: Setup, Fees and Fixes](https://wayschina.com/en/articles/how-to-use-alipay-with-foreign-cards) 2026-08；[Trip.com · Nihao China App: Setup, Card Link & Payment Guide](https://www.trip.com/guide/info/nihao-china-app.html) 2026-06-12；[Reddit r/transferwiser · AliPay Merchant Services Pte. Ltd debit card verification on Wise (↑5)](https://www.reddit.com/r/transferwiser/comments/1s2ji2j/alipay_merchant_services_pte_ltd/) 2026-10-03；[Reddit r/travelchina · Calm my nerves about digital payments (↑0, No need for Tour Card ↑10; 3% fee is real ↑6)](https://www.reddit.com/r/travelchina/comments/1e9mxnj/calm_my_nerves_about_digital_payments/) 2026-10-03

相关：`alipay_not_authenticated`, `alipay_identity_verification`, `alipay_tourcard`, `alipay_nihao_china`, `alipay_account_locked`, `wechat_card_unsupported`, `tenpaygo_card_bind_failed`

---

## No SMS code from Alipay

`alipay_sms_code_not_received` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-02

**Why** The code goes to the number you registered with. After landing, many phones are on a new eSIM or have roaming off, so the SMS to your home number never arrives.

**Do this now**
1. Make sure the SIM that owns your registered number can receive texts: turn on roaming for that line, or switch it back on if you disabled it for an eSIM.
2. Turn Wi-Fi off so the phone is on mobile data only, then request the code again after about a minute. Repeated taps pause delivery.
3. Check the country code and that the number has no leading zero. Check the spam or filtered messages folder; on iPhone turn off Filter Unknown Senders.
4. If the screen offers a voice call or email option, use it.

**Still stuck** If your home number cannot receive texts in China at all, log in with the email address on the account if one is set, or contact Alipay support at +86 571 2688 6000 to change the registered number.

**依赖的事实**

- [unverified] Alipay offers a voice-call delivery of the verification code — WildChina registration section; no Reddit user confirms seeing it, so the body says "if offered".
- [unverified] Wi-Fi off plus mobile data only, and checking filtered messages, fixed delivery for some users — Single Reddit thread with two confirmations (1s0l36o).

**来源** [WildChina · Guide to Using Alipay in 2026 (Registration)](https://wildchina.com/2026/05/guide-to-using-alipay-2026/) 2026-05-29；[Trip.com · How to Use Alipay in China for Foreigners 2026](https://www.trip.com/guide/phone/how-to-use-alipay.html) 2026-04-08；[Reddit r/travelchina · SMS verification code tips (↑3)](https://www.reddit.com/r/travelchina/comments/1s0l36o/wechat_sms_verification_code/) 2026-10-03

相关：`alipay_setup_before_flight`, `wechat_sms_code_not_received`, `didi_sms_code_not_received`

---

## Payment failed at the counter

`alipay_payment_declined` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-03

**Why** Three different things look the same at the counter: your bank refused the charge, the shop showed a personal collection code that foreign cards cannot pay, or you hit a limit. Alipay prints a short reason on the failure screen.

**Do this now**
1. If the card is greyed out or the screen says Merchant does not support payment via international bank cards, the shop is using a personal collection code, which foreign cards cannot pay. Ask for a merchant code or offer your own code to scan; if neither works, pay with WeChat Pay or cash. It is not a fault in your account.
2. Issuer declined or Bank declined means your bank. Retry once, then turn on international and online payments in your banking app, or call the bank to allow charges from Alipay / Ant Group in China.
3. Limit exceeded or a request for ID means you hit the unverified allowance. Complete Identity Verification (Me > Settings > Account & Security), then pay again. For large amounts, ask to split the bill.
4. Quick test: try the same card for a small payment in WeChat Pay. If both fail, it is the card or bank. If only Alipay fails, reopen Alipay, update it, and switch from Wi-Fi to mobile data. Do not keep retrying: repeated failures can restrict the account.

**Still stuck** Pay with cash. Every merchant in China must accept RMB cash by law; withdraw at a Bank of China ATM with your foreign card. If the account says it is locked, see Account locked.

**依赖的事实**

- [verified] Payments under 200 RMB are fee-free; above 200 RMB a 3% fee applies — Trip.com card guide plus at least five independent Reddit confirmations 2024-2026 (1e9mxnj ↑6, 1bys9g8 ↑2, 1m6pxcm ↑4, 1vvx0nj, 1l2thjl). No Alipay page states it, so the body still says 'check the fee line'.
- [unverified] Minimum transaction 10 RMB — WildChina only.
- [verified] Verified users: 5,000 USD per transaction, 50,000 USD per year; unverified about 2,000 USD cumulative — PBOC (Xinhua report on pbc.gov.cn, March 2024): single limit raised from 1,000 to 5,000 USD, annual from 10,000 to 50,000 USD for inbound visitors. Unverified allowance about 2,000 USD comes from guides, not the PBOC text.
- [verified] Foreign cards cannot pay personal collection codes, only merchant codes; there is no visual difference — PayInChinaGuide and Trip.com both state it.
- [verified] Message "payment environment not secure" appears when traffic is routed through another country; turning that off fixes it — Reddit 1izxwc4 ↑7 and others.
- [unverified] A failed or test payment can itself trigger a restriction — Single reports (1wt6nqa, 1ri5oa9 comment) that payments to unknown test merchants led to a restriction.

**来源** [PayInChinaGuide · Alipay 'Card Issuing Bank Declined' Error](https://www.payinchinaguide.com/blog/alipay-issuing-bank-declined-fix) 2026-03；[Trip.com · Alipay Not Working in China? Common Causes and How to Fix It](https://www.trip.com/guide/payments/alipay-not-working-in-china.html) 2026-07-02；[PayInChinaGuide · Alipay for Foreigners FAQ (fees, limits, errors)](https://www.payinchinaguide.com/blog/alipay-foreigners-2025-ultimate-faq) 2026-03；[Beijing Government · Payment Services (cash must be accepted)](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html) 2024-08-30；[People's Bank of China · Xinhua report on measures for inbound visitors' mobile payment (single 5,000 USD, annual 50,000 USD; simplified identity verification)](https://www.pbc.gov.cn/redianzhuanti/118742/5275415/5275421/5391688/index.html) 2024-03；[Reddit r/travelchina · Merchant does not support payment via international bank cards (↑10)](https://www.reddit.com/r/travelchina/comments/1p6uixs/merchant_does_not_support_payment_via/) 2026-10-03

相关：`alipay_identity_verification`, `alipay_card_bind_failed`, `alipay_account_locked`, `alipay_transfer_to_person`

---

## Alipay asks for your passport

`alipay_identity_verification` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-03

**Why** Chinese rules let you spend a small total without ID. Past that, or for larger single payments, Alipay must verify your passport before it lets the payment through.

**Do this now**
1. Tap Me > Settings > Account & Security > Identity Verification and choose Passport as the ID type. If the only option shown is to bind a mainland bank card, you are outside China where the face check is not offered: stop at ID Validated and finish after landing (see ID Validated - Not Authenticated).
2. Photograph the passport photo page flat, in daylight, no glare, all four corners visible. If the app offers to read the passport chip and says Reading failed, skip it: the chip reader works for Chinese passports only.
3. Type your name exactly as the passport prints it, including middle names and suffixes, and make the linked card's name match. For the face check, face a window, remove glasses, hold still.
4. Stop after two failed face checks. Repeated failures restrict the account and the Appeal button can disappear. Open Help Center, tell the assistant it was not helpful and ask for a customer service representative; they request a photo of you holding the passport and clear it, usually the same day.

**Still stuck** Still rejected after a day: call +86 571 2688 6000 for a manual review. Meanwhile pay with WeChat Pay or cash; payments at ID Validated level keep working for everyday amounts.

**依赖的事实**

- [verified] Up to about 2,000 USD may be spent without ID; verification is required for single transactions over 500 USD — WildChina states both thresholds (March 2024 rules); PayInChinaGuide confirms the 2,000 USD cap.
- [unverified] Verification usually completes within an hour, manual review up to 72 hours; support manual review 1 to 3 working days — WildChina for the 72 hours; ChinaVigators for 1 to 3 working days. No official figure, so the body says "a day or more" and "a few working days".
- [unverified] Passports with under 6 months validity are often rejected by verification — Trip.com guide only.
- [unverified] 3-5 failed attempts lock verification for 24 hours — Trip.com and ChinaVigators say so; Reddit users instead report the account being restricted and the Appeal button disappearing after repeated liveness failures (1t0r71e, 1viblua).
- [verified] Passport chip (NFC) reading fails for non-Chinese passports with "Reading failed: Your passport information wasn't recognized" — Reddit 1wuii4i ↑7 and 1v6zxn4 ↑2 agree it only works for Chinese passports.
- [verified] Human support reachable by telling the Help Center bot "not helpful" and asking for a representative — Reddit 1wuii4i ↑7, confirmed by several users in restriction threads.

**来源** [ChinaVigators · Alipay Verification Failed? How to Fix It](https://www.chinavigators.com/alipay-verification-failed/) 2026-03-19；[Trip.com · Alipay Not Working in China? Common Causes and How to Fix It](https://www.trip.com/guide/payments/alipay-not-working-in-china.html) 2026-07-02；[PayInChinaGuide · Alipay Passport Verification Failed: How to Fix](https://www.payinchinaguide.com/blog/alipay-passport-verification-failed-fix) 2026；[WildChina · Guide to Using Alipay in 2026 (Verification, FAQ)](https://wildchina.com/2026/05/guide-to-using-alipay-2026/) 2026-05-29；[People's Bank of China · Xinhua report on measures for inbound visitors' mobile payment (single 5,000 USD, annual 50,000 USD; simplified identity verification)](https://www.pbc.gov.cn/redianzhuanti/118742/5275415/5275421/5391688/index.html) 2024-03；[Reddit r/travelchina · Account restricted and stuck in appeal loop (↑4, human agent via Help Center ↑7; NFC only for Chinese passports ↑7)](https://www.reddit.com/r/travelchina/comments/1wuii4i/alipay_issue_account_restricted_and_stuck_in/) 2026-10-03；[Reddit r/travelchina · Alipay asking me for Mainland China bank card (↑2, support explanation: no face check in EU/US ↑3)](https://www.reddit.com/r/travelchina/comments/1tkh9z1/alipay_asking_me_for_mainland_china_bank_card_for/) 2026-10-03

相关：`alipay_not_authenticated`, `alipay_payment_declined`, `alipay_card_bind_failed`, `alipay_account_locked`

---

## Alipay shows ID Validated - Not Authenticated or asks for a mainland bank card

`alipay_not_authenticated` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-03

**Why** Outside China, especially in the EU, UK and US, Alipay does not run its face check, so the only option it shows is to bind a mainland bank card. The status ID Validated - Not Authenticated is the normal stopping point abroad and payments to merchants work.

**Do this now**
1. Stop at ID Validated - Not Authenticated. It is enough for paying shops, taxis and DiDi. Do not tap Complete and never tap Verify Chinese Mainland bank; that path cannot be undone from abroad and leaves verification stuck.
2. If a screen says the current situation does not support foreign bank cards and asks whether to continue adding a bank card, tap Cancel. You are in the mainland-resident flow by mistake. Go back to Me > Settings > Account & Security > Identity Verification and choose Passport.
3. After landing in China, open Identity Verification again. The face check is now offered; finish it before any large payment.
4. If verification is stuck after a wrong tap or a failed face check, do not retry. Open Help Center, tell the assistant it was not helpful and ask for a customer service representative, then send the photo of you holding your passport when asked.

**Still stuck** If a payment is refused for missing verification before you can finish the face check, use WeChat Pay or cash. Taobao and other apps that jump to Alipay for real-name checks accept the same passport verification once it is done.

**依赖的事实**

- [verified] Alipay support: in Europe and the US the face recognition service is not provided, so only mainland-bank-card binding is shown; verification by face is available once in China — Support message quoted by a user (1tkh9z1 ↑3) and matched by several others told to re-upload after arrival (1o0anhh, 1w3fkt9 ↑2, 1m98d1o ↑2).
- [verified] Payments work at ID Validated - Not Authenticated; the app popup says full authentication is only needed when a restricted service prompts for it — Popup text quoted in 1txeyao; payments confirmed in 1ve79qo and 1s0l36o.
- [unverified] Tapping Verify Chinese Mainland bank by mistake leaves the status stuck with no self-service way back — Single report (1uc0bm6 ↑3); no user reported a fix other than support.

**来源** [Reddit r/travelchina · Alipay asking me for Mainland China bank card (↑2, support explanation: no face check in EU/US ↑3)](https://www.reddit.com/r/travelchina/comments/1tkh9z1/alipay_asking_me_for_mainland_china_bank_card_for/) 2026-10-03；[Reddit r/chinatravel · Alipay Not Authenticated identity information (↑2)](https://www.reddit.com/r/chinatravel/comments/1txeyao/alipay_not_authenticated_identity_information/) 2026-10-03；[Reddit r/travelchina · Alipay Real Name verification is stuck (↑3)](https://www.reddit.com/r/travelchina/comments/1uc0bm6/alipay_real_name_verification_is_stuck/) 2026-10-03；[Reddit r/travelchina · Account restricted and stuck in appeal loop (↑4, human agent via Help Center ↑7; NFC only for Chinese passports ↑7)](https://www.reddit.com/r/travelchina/comments/1wuii4i/alipay_issue_account_restricted_and_stuck_in/) 2026-10-03

相关：`alipay_identity_verification`, `alipay_account_locked`, `alipay_setup_before_flight`

---

## Use Tour Pass (TourCard) when your card won't link

`alipay_tourcard` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-03

**Why** Tour Pass, often called TourCard, is a prepaid card inside Alipay issued by Bank of Shanghai, topped up from your foreign card with a 5% service charge. Since 2024 a passport-verified account with a linked card does the same job without the fee, and the mini-program often fails at sign-up or phone binding, so treat it as the last resort.

**Do this now**
1. In Alipay, type Tour Pass or TourCard in the top search bar and open the mini-program.
2. Register with your passport when prompted.
3. Top up from a Visa, Mastercard, JCB or Diners Club card. A 5% service charge is added to each purchase or top-up and shown before you confirm.
4. Pay as usual with Pay/Receive or Scan. Tour Pass is for paying merchants only; transfers to people are not allowed. The card runs for 90 days and any unused balance is refunded to your card automatically.

**Still stuck** If TourCard also refuses your card, use cash from a Bank of China ATM, or check whether your home e-wallet is part of the Alipay+ network and can scan Chinese codes directly.

**依赖的事实**

- [verified] Validity 90 days from activation; unused balance converted at the card scheme rate and refunded to the original card automatically — Bank of Shanghai prepaid card agreement hosted by Alipay (自您开通服务之日起90日; 剩余款项自动退还). Guides saying 180 days are outdated.
- [verified] Service fee 5% of each purchase or top-up amount, deducted from the international card — Same agreement. Purchase and top-up caps are set by Bank of Shanghai and shown on the service page, so no cap is quoted here.
- [verified] Accepted cards: Visa, Mastercard, Diners Club, JCB — Both agreements define International Card Organizations as these four. Amex is not listed.
- [verified] No transfers to own or other people's cards — Agreement explicitly forbids using the card for transfers or remittance. PayInChinaGuide's claim of peer-to-peer transfer is wrong.
- [verified] Travellers consistently report TourCard as unnecessary since 2024 and the mini-program as unreliable (phone number mismatch, sign-up failing without reason, codes not arriving) — Reddit 1e9mxnj ↑10, 1kqg8hc ↑3, 1etk63l ↑2, 13dvcs4 ↑11, 1s2uiyh (2026-03 "not working at all").

**来源** [Bank of Shanghai · Prepaid card (Tour Pass / TourCard) service agreement hosted by Alipay (official, Chinese)](https://render.alipay.com/p/c/k0mtcsgi/1572520436172.html) 2019-10-31；[Alipay · Tour Pass information technology service agreement (official, English)](https://render.alipay.com/p/c/k2ffmmxp) 2026-10-03；[WildChina · Guide to Using Alipay in 2026 (Option 2: TourCard)](https://wildchina.com/2026/05/guide-to-using-alipay-2026/) 2026-05-29；[PayInChinaGuide · Alipay for Foreigners FAQ (TourCard)](https://www.payinchinaguide.com/blog/alipay-foreigners-2025-ultimate-faq) 2026-03；[ChinaGuidelines · Tour Card 完整申请与使用指南 (中文)](https://chinaguidelines.com/zh/posts/tour-card) 2026；[Reddit r/travelchina · Calm my nerves about digital payments (↑0, No need for Tour Card ↑10; 3% fee is real ↑6)](https://www.reddit.com/r/travelchina/comments/1e9mxnj/calm_my_nerves_about_digital_payments/) 2026-10-03；[Reddit r/travelchina · Payment Visa/Mastercard/TourCard (↑1, TourCard mini-program not working 2026-03)](https://www.reddit.com/r/travelchina/comments/1s2uiyh/payment_visamastercardtourcard/) 2026-10-03

**可推荐给用户** [Alipay · Tour Pass service agreement](https://render.alipay.com/p/c/k2ffmmxp)

相关：`alipay_card_bind_failed`

---

## How to pay at a shop with Alipay

`alipay_how_to_pay` · 阶段 landing · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-02

**Why** There are two directions: the cashier scans you, or you scan the shop's printed code. Small stalls usually have a printed code; chains and taxis scan you.

**Do this now**
1. To be scanned: open Alipay, tap Pay/Receive at the top, hold the barcode and QR code to the scanner. Enter your 6-digit payment password if asked.
2. To scan them: tap Scan, point at the shop's printed QR code, type the amount the cashier tells you, confirm. Foreign cards can only pay registered merchant codes; if a stall's code fails or the card is greyed out, pay with WeChat Pay or cash.
3. Check the confirmation screen for the amount and any fee line, then confirm.
4. Online, choose Alipay at checkout; the site opens the app or shows a QR code for you to scan.

**Still stuck** If the code will not scan, ask the cashier to scan yours instead, or pay cash. Metro gates: the transport code mini-program may refuse foreign cards; buy a single ticket or tap the physical card at gates that take it.

**依赖的事实**

- [verified] Metro transport codes often refuse international cards; single tickets or tapping the physical card at the gate works — Reddit 1c54je9 (three confirmations), 1232vqo ↑5, 1m19u6g.

**来源** [WildChina · Guide to Using Alipay in 2026 (Using Alipay for Payments)](https://wildchina.com/2026/05/guide-to-using-alipay-2026/) 2026-05-29；[Beijing Government · Payment Services](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html) 2024-08-30；[Reddit r/travelchina · Merchant does not support payment via international bank cards (↑10)](https://www.reddit.com/r/travelchina/comments/1p6uixs/merchant_does_not_support_payment_via/) 2026-10-03

相关：`alipay_payment_declined`, `alipay_transfer_to_person`

---

## Alipay won't send money to a person

`alipay_transfer_to_person` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** An Alipay account on a foreign card can pay merchants only. Transfers to people, topping up the balance and paying a personal collection code are switched off, and the message says the international card only supports daily expenses.

**Do this now**
1. Do not retry the transfer; repeated attempts are a known trigger for an account restriction.
2. For a guide, driver, landlord or private seller, pay cash: withdraw at a Bank of China ATM with your foreign card.
3. If you must pay a person digitally, hand cash to a friend, your hotel reception or a tour guide and ask them to transfer it from their own account.
4. For a shop or stall whose code fails, see Payment failed at the counter: it is a personal collection code, and WeChat Pay or cash is the way out.

**Still stuck** WeChat Pay on a foreign card has the same limit: merchant payments only, no transfers or red packets.

**依赖的事实**

- [verified] Foreign-card accounts cannot transfer to people or hold a balance; message "Alipay international card only supports daily expenses and does not support functions like transfer" — Reddit 1iqq3n4 ↑8, 1l2thjl ↑4, 1w1o2su ↑7, 1s5jsqk; message text quoted in two threads.
- [verified] Having a local friend or hotel staff transfer on your behalf in exchange for cash is the common workaround — Reddit 1cdk3w0 ↑11, 17nekct, 1wrj0k4 ↑3, 1fdckcz ↑9.

**来源** [Reddit r/travelchina · How do I pay a Chinese resident on WeChat or Alipay (↑1, no transfers with foreign cards ↑8)](https://www.reddit.com/r/travelchina/comments/1iqq3n4/how_do_i_pay_a_chinese_resident_on_wechat_or/) 2026-10-03；[Reddit r/chinalife · Foreigners can't pay Chinese people (↑72, friend tops up balance ↑11)](https://www.reddit.com/r/chinalife/comments/1cdk3w0/foreigners_cant_pay_chinese_people_buying_stuff/) 2026-10-03；[Reddit r/travelchina · Merchant does not support payment via international bank cards (↑10)](https://www.reddit.com/r/travelchina/comments/1p6uixs/merchant_does_not_support_payment_via/) 2026-10-03

相关：`alipay_payment_declined`, `alipay_how_to_pay`, `wechat_transfer_to_person`

---

## Call a DiDi ride from inside Alipay

`alipay_didi_miniprogram` · 阶段 landing · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-02

**Why** DiDi inside Alipay needs no Chinese phone number and charges your linked card automatically. The WeChat version of DiDi may refuse accounts without a Chinese number.

**Do this now**
1. Open Alipay and search DiDi Travel or 滴滴出行 in the top bar, or tap Transport on the home screen. Make one small payment at a shop before your first ride; the first payment after landing is a common trigger for a restriction and a DiDi booking is a bad place to hit it.
2. Allow location, confirm the pickup pin, type the destination in English or Chinese.
3. Pick a ride type (Express is the cheapest), confirm. The fare is charged to your linked card after the ride.
4. When the car arrives, match the licence plate with the one shown. The driver may ask for the last 4 digits of your phone number; show them on screen.

**Still stuck** Use the in-app chat; messages are translated automatically. For help, DiDi has 24/7 English support under Account > Help.

**依赖的事实**

- [verified] DiDi via the Alipay mini-program does not require a Chinese phone number — WildChina Didi guide; WeChat guide notes WeChat mini-programs may need a Chinese number.
- [verified] The Alipay mini-program is the path most travellers use successfully; it inherits the Alipay passport verification — Reddit 1p2ys74 ↑26, 1b5cius ↑5, 1rayefc ↑3, 1u46zjq, 1geu6qn; 1p3myr3 ↑15 on inherited verification.

**来源** [WildChina · Guide to Using Didi in China 2025](https://wildchina.com/2025/10/a-guide-to-using-didi-in-china-2025/) 2025-11-10；[WildChina · Guide to Using Alipay in 2026 (Using Didi in Alipay)](https://wildchina.com/2026/05/guide-to-using-alipay-2026/) 2026-05-29；[Trip.com · How to Use DiDi in China for Foreigners](https://www.trip.com/guide/transport/how-to-use-didi-in-china.html) 2026-05-14；[Reddit r/travelchina · China travel must-have apps (↑235, DiDi mini app in Alipay, no Chinese number ↑26)](https://www.reddit.com/r/travelchina/comments/1p2ys74/china_travel_musthave_apps/) 2026-10-03

**可推荐给用户** [Trip.com guide: How to use DiDi in China](https://www.trip.com/guide/transport/how-to-use-didi-in-china.html)

相关：`alipay_setup_before_flight`

---

## Alipay says your account is restricted

`alipay_account_locked` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** Alipay's risk system often restricts a new foreign account at the first payment after landing, after switching cards mid-payment, after a transfer attempt to a person, a web login, or when traffic looks routed through another country. Appeals are usually cleared within one or two hours; waiting it out rarely helps.

**Do this now**
1. Tap Appeal on the restriction screen right away. Upload what it asks for: passport photo page, a photo of you holding the passport in front of your chest, and both sides of the linked bank card. The appeal page itself says the average time is 2 hours.
2. While waiting, pay with WeChat Pay or cash. Do not retry payments, do not open a second account with the same card or number, and stay on a normal mobile or Wi-Fi connection without any tool that routes traffic through another country.
3. If the appeal is rejected, or the appeal page only offers binding a mainland bank card, open Help Center, tell the assistant it was not helpful and ask for a customer service representative. They request the same photos by chat or email and usually clear it the same day. English hotline +86 571 2688 6000.
4. If support confirms the restriction cannot be lifted, register a new account with a different email and phone number. A card already used on the restricted account can trigger the same block, so start with another card.

**Still stuck** WeChat Pay is the practical backup, so set it up before you fly. Cash is accepted everywhere by law; withdraw at a Bank of China ATM.

**依赖的事实**

- [verified] Appeal with passport, selfie holding passport and card photos is cleared within about 1 to 2 hours — Reddit 1v5s8tl ↑8, 1onqs74 ↑27, 1w81a2v, 1wt6nqa ↑5; appeal page text "Average time: 2 hours" (1gflip8).
- [verified] Common triggers: first payment after landing, switching card during a payment, transfer to a person, web login, traffic routed abroad, repeated verification failures, payments to test-QR sites — Collected from 16 restriction threads; each trigger reported by at least two users except the test-QR one.
- [verified] Some new accounts are restricted before any use, appeals are rejected twice and support says it cannot be lifted; a new account with a new email sometimes works and sometimes is restricted again — Reddit 1w3fkt9 ↑9, 1v6z87p ↑2, 1uekpx1 ↑5.
- [unverified] Risk locks auto-release within 24-72 hours — TravelerLocal and Trip.com say to wait; Reddit threads show almost no case resolved by waiting alone.

**来源** [Trip.com · Alipay Not Working in China? Common Causes and How to Fix It](https://www.trip.com/guide/payments/alipay-not-working-in-china.html) 2026-07-02；[ChinaVigators · Alipay Verification Failed? How to Fix It](https://www.chinavigators.com/alipay-verification-failed/) 2026-03-19；[TravelerLocal · Alipay Foreign Card Declined in China: What to Check](https://www.travelerlocal.com/payments/alipay-foreign-card-fails) 2026-08-02；[Alipay+ · Pay in the Chinese mainland (official page; customer service +86 571 2688 6000, 08:00-24:00)](https://www.alipayplus.com/pay-in-the-chinese-mainland/) 2026-10-03；[Reddit r/travelchina · Alipay app restricted and I appealed it (↑2, appeal cleared within one hour ↑8)](https://www.reddit.com/r/travelchina/comments/1v5s8tl/alipay_app_restricted_and_i_appealed_it/) 2026-10-03；[Reddit r/travelchina · I have over $145k but I am starving in china (↑6, resolved in two hours ↑27)](https://www.reddit.com/r/travelchina/comments/1onqs74/i_have_over_145k_but_i_am_starving_in_china/) 2026-10-03；[Reddit r/chinatravel · Alipay Account Restricted twice rejected (↑9)](https://www.reddit.com/r/chinatravel/comments/1w3fkt9/alipay_account_restricted_twice_rejected/) 2026-10-03；[Reddit r/travelchina · Account restricted and stuck in appeal loop (↑4, human agent via Help Center ↑7; NFC only for Chinese passports ↑7)](https://www.reddit.com/r/travelchina/comments/1wuii4i/alipay_issue_account_restricted_and_stuck_in/) 2026-10-03

相关：`alipay_not_authenticated`, `alipay_identity_verification`, `alipay_card_bind_failed`, `wechat_setup_before_flight`

---

## Use Nihao China when Alipay won't take your card

`alipay_nihao_china` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-03

**Why** Nihao China is the official app for inbound visitors, launched by China UnionPay in December 2025. It registers with an email address or Apple account, needs no Chinese phone number, and links UnionPay, Visa and Mastercard cards issued outside the mainland.

**Do this now**
1. Install Nihao China from the App Store or Google Play. Register with an email address, Apple account or mobile number; email works when SMS codes are not reaching you.
2. Complete identity verification with your passport when prompted.
3. Tap Tour Wallet, then + to add a card. Enter the card details and pass your bank's one-time check; a small pre-authorisation is taken and refunded.
4. Pay with Pay (show your code) or Scan (scan the shop's code), the same two ways as Alipay. Tour Balance can also be topped up from the card for payments that need a wallet balance.

**Still stuck** If Nihao China also refuses the card, top up its Tour Wallet from the card instead (small load fee), or use cash.

**依赖的事实**

- [verified] Launched 2025-12-19 by China UnionPay at the China International Travel Mart; registration by email or Apple account; cards: UnionPay, Visa, Mastercard issued outside the mainland — China UnionPay official news 2025-12-19 and UnionPay International press release 2025-12-24. Official product page adds mobile-number registration, Tour Wallet, Tour Balance, Pay and Scan.
- [unverified] No platform fee on QR payments; Tour Wallet top-up fee about 0.5% — Trip.com guide only. Not stated on UnionPay's pages, so the body does not promise zero fees.
- [unverified] A small pre-authorisation is taken when linking a card — Trip.com guide says 1 yuan; not on official pages, so the body says 'small'.

**来源** [UnionPay International · Nihao China App (official product page: register with email or mobile, Tour Wallet, Pay / Scan)](https://m.unionpayintl.com/ZT/en/NHCAPP/) 2026-10-03；[China UnionPay · “Nihao China” APP正式上线 (official news, launched 2025-12-19)](https://cn.unionpay.com/upowhtml/cn/templates/newInfo-nosub/7885004da382485e8bde5a0ba000fdd3/20251219164753.html) 2025-12-19；[UnionPay International · Nihao China press release (register with email or Apple account; UnionPay, Visa, Mastercard cards)](https://www.prnewswire.com/apac/news-releases/nihao-china-app-launches-as-an-all-in-one-solution-for-international-visitors-302649202.html) 2025-12-24；[Trip.com · Nihao China App: Setup, Card Link & Payment Guide](https://www.trip.com/guide/info/nihao-china-app.html) 2026-06-12

**可推荐给用户** [Trip.com guide: Nihao China App setup](https://www.trip.com/guide/info/nihao-china-app.html)；[UnionPay International · Nihao China App](https://m.unionpayintl.com/ZT/en/NHCAPP/)

相关：`alipay_card_bind_failed`, `alipay_tourcard`

