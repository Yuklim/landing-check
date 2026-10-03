# 微信支付 / WeChat Pay · 知识库条目预览

识别关键词（中）：微信、微信支付、钱包、安全验证、实名、添加银行卡、绑定银行卡、不支持的卡、存在风险、好友验证、支付密码、小程序、发现、朋友圈

识别关键词（英）：WeChat, Weixin, Weixin Pay, WeChat Pay, Wallet, Security Verification, Verify ID Info, Add Bank Card, Unsupported Card, Risk exists in this operation, friend verification, Services, Mini Program, Mini Programs, Discover, Moments, Channels

界面特征：Green WeChat app chrome. Screens titled Wallet, Verify ID Info, Add Bank Card, Security Verification, a grey modal saying 'Risk exists in this operation', a 'Select a Security Verification Method' list, or a mini-program asking for a Chinese phone number.

---

## Set up WeChat Pay before you fly

`wechat_setup_before_flight` · 阶段 preflight · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** Some small shops and street stalls only take WeChat Pay. Setting it up at home avoids the friend-verification step, which is hard to complete once you are travelling alone.

**Do this now**
1. Install WeChat and sign up with your own mobile number (any country). Enter the SMS code.
2. When WeChat asks for security verification, choose the option to add a payment card and activate Weixin Pay; it is easier than finding an existing user to scan your QR code.
3. Go to Me > Services > Wallet > Cards > Add a Card and add a Visa, Mastercard, American Express, JCB, Discover or Diners Club card issued outside mainland China. A small verification charge is taken.
4. Set the 6-digit payment password when prompted and keep it; every payment asks for it.

**Still stuck** If the card step fails, finish Alipay first and come back to WeChat later; most travellers manage with Alipay alone.

**依赖的事实**

- [verified] Accepted card networks: Visa, Mastercard, American Express, Discover, JCB, Diners Club, UnionPay International — Beijing gov Payment Services page (2024-08): Visa, Mastercard, JCB, American Express, Diners Club, Discover. Beijing gov 2020 page and WildChina agree. Amex IS accepted here.
- [unverified] Verification charge about 0.05 USD when adding a card — WildChina only; the body no longer quotes the amount.
- [verified] Card-adding path Me > Services > Wallet > Cards > Add a Card — Beijing gov Payment Services: Me > WeChat Pay > Wallet > Cards > Add a Card. Nantong gov FAQ: 我 > 服务 > 钱包 > 添加银行卡.

**来源** [Beijing Government · Payment Services: Alipay and Weixin Pay card-adding paths, accepted networks, cash must be accepted, hotlines](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html) 2024-08-30；[Nantong Government (Foreign Affairs Office) · 境外人士在华使用移动支付常见知识问答: Alipay and WeChat binding paths, accepted documents, WeChat fee rule](https://www.nantong.gov.cn/ntsrmzf/wscl/content/d052c16c-1ea0-464a-bc90-125f9bff5cfa.html) 2023-08-01；[Beijing Government · How can Foreigners Use WeChat Pay? (updated 2026-03)](https://english.beijing.gov.cn/livinginbeijing/finance/mobilepaymentlist/202005/t20200516_1899230.html) 2026-03-26；[WildChina · How to Set Up WeChat Pay (Weixin Pay) in 2026](https://wildchina.com/2026/05/wechat-pay-in-2026/) 2026-06-01；[China Briefing · WeChat Enables Foreigners to Pay with Overseas Cards in China](https://www.china-briefing.com/news/wechat-enables-foreigners-to-pay-with-overseas-cards-in-china/) 2025-03-03

**可推荐给用户** [Beijing Government: How can foreigners use WeChat Pay](https://english.beijing.gov.cn/livinginbeijing/finance/mobilepaymentlist/202005/t20200516_1899230.html)；[Beijing Government · Payment Services](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html)

相关：`wechat_security_verification`, `wechat_card_unsupported`

**配图**

- 第 1 步 `wechat/wechat_setup_before_flight/step1.png`（占位，演示用） — WeChat Sign Up with Mobile: region, phone number, password, then Accept and Continue（WildChina · WeChat Pay in 2026 guide）
- 第 2 步 `wechat/wechat_setup_before_flight/step2.png`（占位，演示用） — Select a Security Verification Method: pick Verify and Activate Weixin Pay（WildChina · WeChat Pay in 2026 guide）
- 第 3 步 `wechat/wechat_setup_before_flight/step3.png`（占位，演示用） — Enter card information: valid date and CVV, a 0.05 USD verification fee is deducted（WildChina · WeChat Pay in 2026 guide）
- 第 4 步 `wechat/wechat_setup_before_flight/step4.png`（占位，演示用） — Payment Password: set and confirm the 6-digit code（WildChina · WeChat Pay in 2026 guide）

---

## WeChat asks a friend to verify you

`wechat_security_verification` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** New accounts must pass a security check to keep spammers out. WeChat offers three ways; only one needs another person.

**Do this now**
1. On the Select a Security Verification Method screen pick Verify via Payment Card (or Verify and Activate Weixin Pay). It needs no friend.
2. Add a card from Visa, Mastercard, Amex, JCB, Discover or Diners Club issued outside mainland China and confirm the small verification charge.
3. If the card option is missing, choose Verify via QR scan and ask anyone with a WeChat account older than 6 months, such as hotel reception, to scan your code.
4. Set the payment password when prompted.

**Still stuck** If no option works, use Alipay for payments; WeChat is rarely essential for a short trip.

**依赖的事实**

- [verified] The QR-scan option requires the scanning user to have registered more than 6 months ago — Text of WeChat's own Select a Security Verification Method screen, visible in the sample screenshot samples/from_guides/wildchina_wechat-pay-in-2026_fb0b81.png.

**来源** [WildChina · How to Set Up WeChat Pay (Security Verification)](https://wildchina.com/2026/05/wechat-pay-in-2026/) 2026-06-01；[ReadyForChina · Test your WeChat Pay setup (setup guide)](https://www.readyforchina.com/en/wechat) 2026；[Beijing Government · Payment Services: Alipay and Weixin Pay card-adding paths, accepted networks, cash must be accepted, hotlines](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html) 2024-08-30

相关：`wechat_setup_before_flight`, `wechat_card_unsupported`

---

## WeChat Pay says Unsupported Card

`wechat_card_unsupported` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-03

**Why** Either the card was issued in a region WeChat's foreign-card service does not cover, the account region is set wrong, or the bank refused the small verification charge.

**Do this now**
1. Check WeChat's region: Me > Settings > General > Region should match your passport country, not China.
2. Try a different card, ideally a Visa or Mastercard credit card from a major bank. Debit, prepaid and virtual cards fail more often.
3. Turn on international and online transactions in your banking app, then add the card again after a few minutes.
4. If it still fails, switch to Alipay with the same card; many cards refused by WeChat link fine in Alipay.

**Still stuck** Set up Nihao China (official inbound app, no platform fee) or carry cash from a Bank of China ATM.

**依赖的事实**

- [unverified] A card refused by WeChat often links in Alipay — PayInChinaGuide, user reports.

**来源** [PayInChinaGuide · WeChat Pay 'Unsupported Card' Error: 5 Proven Fixes](https://www.payinchinaguide.com/tool/specific-error/wechat-pay-unsupported-card) 2026；[PayInChinaGuide · WeChat Pay Card Declined? Fix Guide](https://www.payinchinaguide.com/blog/wechat-pay-card-declined-fix) 2026；[Beijing Government · Payment Services: Alipay and Weixin Pay card-adding paths, accepted networks, cash must be accepted, hotlines](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html) 2024-08-30

相关：`wechat_setup_before_flight`, `alipay_card_bind_failed`, `alipay_nihao_china`

---

## WeChat asks for your passport (Verify ID Info)

`wechat_identity_verification` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** Payments above a small total need real-name verification. The form asks for ID type, passport number, dates, nationality, address and occupation.

**Do this now**
1. On Verify ID Info choose ID type Passport and enter the number, country and expiry exactly as printed.
2. Fill the remaining fields: address can be your hotel, occupation any honest option. Empty fields block the Next button.
3. Upload the passport photo page in good light and complete the face scan facing a window.
4. If the screen says Risk exists in this operation, stop, wait, and see Risk control.

**Still stuck** Verification can take up to a day. Pay with Alipay or cash meanwhile; contact WeChat Pay support from Me > Services > Wallet > Customer Service Center if it stays pending.

**依赖的事实**

- [verified] Accepted documents: passport, HK/Macao and Taiwan travel permits and residence permits, Foreign Permanent Resident ID Card — Nantong gov FAQ 2023-08.

**来源** [Nantong Government (Foreign Affairs Office) · 境外人士在华使用移动支付常见知识问答: Alipay and WeChat binding paths, accepted documents, WeChat fee rule](https://www.nantong.gov.cn/ntsrmzf/wscl/content/d052c16c-1ea0-464a-bc90-125f9bff5cfa.html) 2023-08-01；[ChinaVigators · WeChat Pay for Foreigners 2026: Link Visa & Mastercard](https://www.chinavigators.com/wechat-pay-foreigners-guide/) 2026-07-03；[HiddenChinaTravel · Alipay/WeChat Verification Failed? Fixes](https://hiddenchinatravel.com/alipay-wechat-pay-verification-failed) 2026-08-26

相关：`wechat_risk_control`, `wechat_security_verification`

**配图**

- 第 1 步 `wechat/wechat_identity_verification/step1.webp`（占位，演示用） — Verify ID Info: ID type picker, choose Passport（ChinaVigators · WeChat Pay for foreigners guide）
- 第 2 步 `wechat/wechat_identity_verification/step2.webp`（占位，演示用） — Verify ID Info: address field, Select on map or Enter address（ChinaVigators · WeChat Pay for foreigners guide）
- 第 4 步 `wechat/wechat_identity_verification/step4.webp`（占位，演示用） — WeChat popup: Risk exists in this operation（ChinaVigators · WeChat Pay for foreigners guide）

---

## WeChat: Risk exists in this operation

`wechat_risk_control` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** WeChat's risk system pauses real-name verification or payments when something looks unusual: a new account, many attempts, or traffic that appears to come from outside China.

**Do this now**
1. Tap Close and stop retrying for now.
2. Switch to a normal connection: mobile data or ordinary Wi-Fi, without any tool that routes traffic through another country.
3. Wait a few hours, reopen WeChat and try the same step once.
4. If it repeats, open Me > Services > Wallet > Customer Service Center and describe the message; keep a screenshot.

**Still stuck** Use Alipay or Nihao China for payments while WeChat is restricted.

**来源** [ChinaVigators · WeChat Pay for Foreigners 2026 (screens)](https://www.chinavigators.com/wechat-pay-foreigners-guide/) 2026-07-03；[HiddenChinaTravel · Alipay/WeChat Verification Failed? Fixes](https://hiddenchinatravel.com/alipay-wechat-pay-verification-failed) 2026-08-26

相关：`wechat_identity_verification`, `alipay_account_locked`

---

## A WeChat mini-program wants a Chinese phone number

`wechat_miniprogram_needs_chinese_number` · 阶段 landing · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** Many mini-programs inside WeChat, including ride-hailing and food delivery, register users by +86 number. Without one they stop at the phone screen.

**Do this now**
1. Do not buy a Chinese SIM just for this. Use the same service inside Alipay instead: Alipay's DiDi mini-program works with a foreign number.
2. For menus and ordering, ask staff to take the order at the counter and pay by scanning your Alipay or WeChat code.
3. For attractions, book through Trip.com or the venue's website with your passport instead of the WeChat mini-program.

**Still stuck** If a Chinese number is unavoidable, hotel reception can sometimes help; otherwise skip that service.

**来源** [WildChina · How to Set Up WeChat Pay (Limitations)](https://wildchina.com/2026/05/wechat-pay-in-2026/) 2026-06-01；[WildChina · Guide to Using Didi in China 2025](https://wildchina.com/2025/10/a-guide-to-using-didi-in-china-2025/) 2025-11-10

相关：`alipay_didi_miniprogram`

---

## No SMS code from WeChat

`wechat_sms_code_not_received` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** The code goes to the number you registered. If that line has roaming off, or you switched to an eSIM and disabled it, nothing arrives.

**Do this now**
1. Turn on roaming for the line that owns the registered number, or re-enable that SIM if you turned it off for an eSIM.
2. Wait about a minute before requesting again; rapid retries pause delivery.
3. Check the country code and that the number has no leading zero.
4. Try the voice-call option if the screen offers one.

**Still stuck** If the number cannot receive texts in China at all, log in from a device where WeChat is still signed in, or set up Alipay or Nihao China (email sign-up) instead.

**来源** [PayInChinaGuide · Not Receiving SMS Code from Alipay/WeChat?](https://www.payinchinaguide.com/tool/specific-error/fix-sms-verification-code-error) 2026；[Trip.com · Nihao China App (SMS fallback to email sign-up)](https://www.trip.com/guide/info/nihao-china-app.html) 2026-06-12

相关：`alipay_sms_code_not_received`, `didi_sms_code_not_received`

---

## How to pay at a shop with WeChat Pay

`wechat_how_to_pay` · 阶段 landing · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-03

**Why** Same two directions as Alipay: show your code or scan theirs. Fees apply above 200 RMB.

**Do this now**
1. To be scanned: tap the + at the top right, then Money, and show the barcode. Enter your 6-digit password if asked.
2. To scan them: tap + then Scan, point at the shop's printed code, type the amount. Foreign cards can only pay registered merchant codes; if a stall's code fails, ask them to scan yours.
3. Check the confirmation screen: payments under 200 RMB are free; above that a 3% fee is shown before you confirm.
4. Keep in mind foreign cards cannot send money to people or receive red packets; merchant payments only.

**Still stuck** If the code will not scan, ask the cashier to scan yours, or pay cash.

**依赖的事实**

- [verified] Fee-free under 200 RMB; 3% above; new users 60 days fee-free under 1,000 RMB — Nantong gov FAQ (official): 单笔不超过200元免手续费, 超过200元收3%. China Briefing citing WeChat Pay's policy; PayInChinaGuide agrees. The 60-day new-user waiver is from China Briefing only.

**来源** [Nantong Government (Foreign Affairs Office) · 境外人士在华使用移动支付常见知识问答: Alipay and WeChat binding paths, accepted documents, WeChat fee rule](https://www.nantong.gov.cn/ntsrmzf/wscl/content/d052c16c-1ea0-464a-bc90-125f9bff5cfa.html) 2023-08-01；[Beijing Government · Payment Services: Alipay and Weixin Pay card-adding paths, accepted networks, cash must be accepted, hotlines](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html) 2024-08-30；[China Briefing · WeChat Enables Foreigners to Pay with Overseas Cards (fees)](https://www.china-briefing.com/news/wechat-enables-foreigners-to-pay-with-overseas-cards-in-china/) 2025-03-03；[WildChina · How to Set Up WeChat Pay (Using WeChat Pay for payments)](https://wildchina.com/2026/05/wechat-pay-in-2026/) 2026-06-01

相关：`alipay_how_to_pay`

