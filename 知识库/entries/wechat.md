# 微信支付 / WeChat Pay · 知识库条目预览

识别关键词（中）：微信、微信支付、钱包、安全验证、实名、添加银行卡、绑定银行卡、不支持的卡、存在风险、好友验证、支付密码、小程序、发现、朋友圈、辅助验证、账号被限制、解封、转账

识别关键词（英）：WeChat, Weixin, Weixin Pay, WeChat Pay, Wallet, Security Verification, Verify ID Info, Add Bank Card, Unsupported Card, Risk exists in this operation, friend verification, Services, Mini Program, Mini Programs, Discover, Moments, Channels, The bank did not Approve this Transaction, cannot use this card for this transaction, bank card information is incorrect, Authorization Failed, Help Friend Unblock, temporarily unavailable for users in the current region, Send cash, Transfer

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

**Still stuck** If the card step fails, finish Alipay first and come back to WeChat later. Seeing "This service is temporarily unavailable for users in the current region" abroad is not a broken account: WeChat Pay cannot be tested from outside China, so try again after landing.

**依赖的事实**

- [verified] Accepted card networks: Visa, Mastercard, American Express, Discover, JCB, Diners Club, UnionPay International — Beijing gov Payment Services page (2024-08): Visa, Mastercard, JCB, American Express, Diners Club, Discover. Beijing gov 2020 page and WildChina agree. Amex IS accepted here.
- [unverified] Verification charge about 0.05 USD when adding a card — WildChina only; the body no longer quotes the amount.
- [verified] Card-adding path Me > Services > Wallet > Cards > Add a Card — Beijing gov Payment Services: Me > WeChat Pay > Wallet > Cards > Add a Card. Nantong gov FAQ: 我 > 服务 > 钱包 > 添加银行卡.
- [verified] WeChat Pay on a foreign card cannot be tested from abroad; the message is "This service is temporarily unavailable for users in the current region" — Reddit 1v3vuim ↑69 (message quoted), 1d7s8ii ↑42, 1nhab2o ↑38.

**来源** [Beijing Government · Payment Services: Alipay and Weixin Pay card-adding paths, accepted networks, cash must be accepted, hotlines](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html) 2024-08-30；[Nantong Government (Foreign Affairs Office) · 境外人士在华使用移动支付常见知识问答: Alipay and WeChat binding paths, accepted documents, WeChat fee rule](https://www.nantong.gov.cn/ntsrmzf/wscl/content/d052c16c-1ea0-464a-bc90-125f9bff5cfa.html) 2023-08-01；[Beijing Government · How can Foreigners Use WeChat Pay? (updated 2026-03)](https://english.beijing.gov.cn/livinginbeijing/finance/mobilepaymentlist/202005/t20200516_1899230.html) 2026-03-26；[WildChina · How to Set Up WeChat Pay (Weixin Pay) in 2026](https://wildchina.com/2026/05/wechat-pay-in-2026/) 2026-06-01；[China Briefing · WeChat Enables Foreigners to Pay with Overseas Cards in China](https://www.china-briefing.com/news/wechat-enables-foreigners-to-pay-with-overseas-cards-in-china/) 2025-03-03；[Reddit r/travelchina · WeChat Pay and Alipay (cannot test from abroad) (↑42)](https://www.reddit.com/r/travelchina/comments/1d7s8ii/wechat_pay_and_alipay/) 2026-10-03

**可推荐给用户** [Beijing Government: How can foreigners use WeChat Pay](https://english.beijing.gov.cn/livinginbeijing/finance/mobilepaymentlist/202005/t20200516_1899230.html)；[Beijing Government · Payment Services](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html)

相关：`wechat_security_verification`, `wechat_card_unsupported`, `wechat_risk_control`

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
3. If the card option is missing, choose Verify via QR scan and ask someone with an established WeChat account, such as hotel reception or a tour guide, to scan your code. The screen lists the helper conditions: registered more than 6 months, a bank card linked, and under the help limit. Never pay a stranger online to scan it; those offers are scams.
4. Set the payment password when prompted.

**Still stuck** If no option works, use Alipay for payments; WeChat is rarely essential for a short trip.

**依赖的事实**

- [verified] The QR-scan option requires the scanning user to have registered more than 6 months ago — Text of WeChat's own Select a Security Verification Method screen, visible in the sample screenshot samples/from_guides/wildchina_wechat-pay-in-2026_fb0b81.png.
- [verified] Helper conditions shown by WeChat: active contact, registered over 6 months, bank card linked, has not exceeded the Help Friend Unblock limit of 3, no violation history — Screen text quoted in Reddit 1wir3tl; same list on WeChat's Select a Security Verification Method screenshot.
- [unverified] Foreign accounts may be allowed to scan for others only once, or not at all — Single Reddit comment (↑2).
- [verified] Paid "verification scan" services advertised on Reddit are mostly scams — Subreddit moderator bots warn on r/WeChatQRScan and r/wechat_verify_scan.

**来源** [WildChina · How to Set Up WeChat Pay (Security Verification)](https://wildchina.com/2026/05/wechat-pay-in-2026/) 2026-06-01；[ReadyForChina · Test your WeChat Pay setup (setup guide)](https://www.readyforchina.com/en/wechat) 2026；[Beijing Government · Payment Services: Alipay and Weixin Pay card-adding paths, accepted networks, cash must be accepted, hotlines](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html) 2024-08-30；[Reddit r/chinalife · Blocked from making WeChat account (↑0, bank card option instead of QR scan)](https://www.reddit.com/r/chinalife/comments/1kugv4z/blocked_from_making_wechat_account_for_doing/) 2026-10-03；[Reddit r/wechat_verify_scan · WeChat unblock conditions (screen text) (↑1)](https://www.reddit.com/r/wechat_verify_scan/comments/1wir3tl/hey_guys_i_need_help_with_wechat_verifycation_5/) 2026-10-03

相关：`wechat_setup_before_flight`, `wechat_card_unsupported`

---

## WeChat Pay refuses your card

`wechat_card_unsupported` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-03

**Why** The messages differ (The bank did not approve this transaction, cannot use this card for this transaction, bank card information is incorrect, Authorization Failed) but the cause is usually the same: your bank blocked an unfamiliar Chinese merchant, or the card type is not covered.

**Do this now**
1. Call your bank or use its app to allow international and online transactions, then add the card again after a few minutes. Most refusals are the issuer, not WeChat.
2. Try a different card: a Visa or Mastercard credit card from a major bank, American Express, or a Wise or Revolut card. Debit, prepaid and virtual cards fail more often. Link two cards so one refusal does not stop you.
3. Complete Verify ID Info with your passport; some card links are refused until identity verification is done.
4. If every card fails, add the same card to Alipay; cards refused by WeChat often link there.

**Still stuck** Set up Nihao China, or carry cash from a Bank of China ATM. Checking Me > Settings > General > Region matches your passport country is a cheap extra check, but no traveller reports it as the fix.

**依赖的事实**

- [verified] Refusals are mostly issuer-side security; completing ID verification and calling the bank fixes most cases — Reddit 1q0ocjw ↑15, 1wp1prm ↑88 and ↑5, several others.
- [verified] American Express links to WeChat Pay — Beijing gov Payment Services lists Amex; two Reddit users confirm (1ur24re).
- [unverified] A card refused by WeChat often links in Alipay — PayInChinaGuide and user reports.
- [unverified] Region setting as a cause — PayInChinaGuide only; no Reddit confirmation.

**来源** [PayInChinaGuide · WeChat Pay 'Unsupported Card' Error: 5 Proven Fixes](https://www.payinchinaguide.com/tool/specific-error/wechat-pay-unsupported-card) 2026；[PayInChinaGuide · WeChat Pay Card Declined? Fix Guide](https://www.payinchinaguide.com/blog/wechat-pay-card-declined-fix) 2026；[Beijing Government · Payment Services: Alipay and Weixin Pay card-adding paths, accepted networks, cash must be accepted, hotlines](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html) 2024-08-30；[Reddit r/chinalife · Tencent released a new payment app for foreigners (↑255, cards blocked by issuing bank ↑88)](https://www.reddit.com/r/chinalife/comments/1wp1prm/tencent_released_a_new_payment_app_for_foreigners/) 2026-10-03；[Reddit r/travelchina · WeChat Pay for foreigners (↑21, issuer security, complete ID verification ↑15)](https://www.reddit.com/r/travelchina/comments/1q0ocjw/wechat_pay_for_foreigners/) 2026-10-03

相关：`wechat_setup_before_flight`, `alipay_card_bind_failed`, `alipay_nihao_china`, `tenpaygo_card_bind_failed`

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

## WeChat: Risk exists, account blocked or restricted

`wechat_risk_control` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** WeChat's risk system pauses verification or blocks a new account when something looks unusual: joining a large group, adding many contacts quickly, many failed attempts, or traffic that appears to come from outside China. Unblocking usually needs another WeChat user to vouch for you.

**Do this now**
1. Tap Close and stop retrying. Do not add contacts or join groups for now.
2. Switch to a normal connection: mobile data or ordinary Wi-Fi, without any tool that routes traffic through another country, then wait a few hours and try the same step once.
3. If the account is blocked, use Unblock by friend: the helper must be an active contact, registered more than 6 months, with a bank card linked and under the help limit. Hotel reception or a tour guide can often do it.
4. If no one can help, open Me > Services > Wallet > Customer Service Center and describe the message with a screenshot. Support for accounts without a Chinese ID is limited, so keep Alipay working in the meantime.

**Still stuck** Use Alipay or Nihao China for payments while WeChat is restricted.

**依赖的事实**

- [verified] Joining a large chat group or adding many people right after registration is a common block trigger; another user can unblock you — Reddit 1kia4oq ↑20 (↑8 confirmations).
- [verified] Unblock helper conditions: active contact, registered over 6 months, bank card linked, under the Help Friend Unblock limit of 3, no violations — Screen text quoted in Reddit 1wir3tl.
- [unverified] Tencent customer service is limited for users without a Chinese ID number — Single Reddit comment.
- [verified] "Risk exists in this operation" popup — Shown in a ChinaVigators screenshot in the samples; not found in Reddit threads.

**来源** [ChinaVigators · WeChat Pay for Foreigners 2026 (screens)](https://www.chinavigators.com/wechat-pay-foreigners-guide/) 2026-07-03；[HiddenChinaTravel · Alipay/WeChat Verification Failed? Fixes](https://hiddenchinatravel.com/alipay-wechat-pay-verification-failed) 2026-08-26；[Reddit r/chinalife · How does adding people cause your WeChat account to be blocked (↑20, unblocked by another user ↑8)](https://www.reddit.com/r/chinalife/comments/1kia4oq/how_does_adding_people_cause_your_wechat_account/) 2026-10-03；[Reddit r/wechat_verify_scan · WeChat unblock conditions (screen text) (↑1)](https://www.reddit.com/r/wechat_verify_scan/comments/1wir3tl/hey_guys_i_need_help_with_wechat_verifycation_5/) 2026-10-03

相关：`wechat_identity_verification`, `wechat_security_verification`, `alipay_account_locked`

---

## A WeChat mini-program wants a Chinese phone number

`wechat_miniprogram_needs_chinese_number` · 阶段 landing · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** Many mini-programs inside WeChat, including ride-hailing and food delivery, register users by +86 number. Without one they stop at the phone screen.

**Do this now**
1. Do not buy a Chinese SIM just for this. Use the same service inside Alipay instead: Alipay's DiDi mini-program works with a foreign number.
2. For food delivery, Meituan, Dianping and Taobao also need a +86 number. Ask hotel reception to order delivery, or order at the counter and pay by scanning your Alipay or WeChat code.
3. For attractions, book through Trip.com or the venue's website with your passport instead of the WeChat mini-program.
4. If a mini-program will not even open, switch off any tool that routes traffic through another country; mini-programs need a mainland connection.

**Still stuck** If a Chinese number is unavoidable, hotel reception can sometimes help; otherwise skip that service.

**依赖的事实**

- [verified] Meituan, Dianping, Taobao, shared bikes and attraction-ticket mini-programs require a +86 number; Alipay, DiDi via Alipay and Trip.com do not — Reddit 1wnz9u8 ↑13, 1r4id3b ↑8, 1s6pq82 ↑47 comment, 1vefw1n.

**来源** [WildChina · How to Set Up WeChat Pay (Limitations)](https://wildchina.com/2026/05/wechat-pay-in-2026/) 2026-06-01；[WildChina · Guide to Using Didi in China 2025](https://wildchina.com/2025/10/a-guide-to-using-didi-in-china-2025/) 2025-11-10；[Reddit r/chinatravel · Struggling with apps, no Chinese number (↑13)](https://www.reddit.com/r/chinatravel/comments/1wnz9u8/struggling_with_apps_big_time_no_chinese_number/) 2026-10-03

相关：`alipay_didi_miniprogram`, `connectivity_chinese_number_needed`

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
4. Foreign cards pay merchants only: sending money to people, topping up balance and red packets are not available. If a payment to a small shop fails, they are using a personal collection code; pay cash or with Alipay instead.

**Still stuck** If the code will not scan, ask the cashier to scan yours, or pay cash.

**依赖的事实**

- [verified] Fee-free under 200 RMB; 3% above; new users 60 days fee-free under 1,000 RMB — Nantong gov FAQ (official): 单笔不超过200元免手续费, 超过200元收3%. China Briefing citing WeChat Pay's policy; PayInChinaGuide agrees. The 60-day new-user waiver is from China Briefing only.
- [verified] Transfers to people fail with foreign cards; the common workaround is a friend or hotel staff transferring for you in exchange for cash — Reddit 1v3vuim ↑69, 1cdk3w0 ↑72 (↑14, ↑11), 1wrj0k4.

**来源** [Nantong Government (Foreign Affairs Office) · 境外人士在华使用移动支付常见知识问答: Alipay and WeChat binding paths, accepted documents, WeChat fee rule](https://www.nantong.gov.cn/ntsrmzf/wscl/content/d052c16c-1ea0-464a-bc90-125f9bff5cfa.html) 2023-08-01；[Beijing Government · Payment Services: Alipay and Weixin Pay card-adding paths, accepted networks, cash must be accepted, hotlines](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html) 2024-08-30；[China Briefing · WeChat Enables Foreigners to Pay with Overseas Cards (fees)](https://www.china-briefing.com/news/wechat-enables-foreigners-to-pay-with-overseas-cards-in-china/) 2025-03-03；[WildChina · How to Set Up WeChat Pay (Using WeChat Pay for payments)](https://wildchina.com/2026/05/wechat-pay-in-2026/) 2026-06-01；[Reddit r/chinatravel · Why your WeChat Pay transfer is failing (↑69)](https://www.reddit.com/r/chinatravel/comments/1v3vuim/why_your_wechat_pay_transfer_is_failing_the/) 2026-10-03

相关：`alipay_how_to_pay`, `wechat_transfer_to_person`

---

## WeChat Pay won't send money to a person

`wechat_transfer_to_person` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** WeChat Pay on a foreign card is for merchant payments only. Transfer, Send cash and red packets are switched off, and paying a personal collection code is treated as a transfer, so it fails too.

**Do this now**
1. Do not retry; repeated attempts can get the account restricted.
2. Pay the person in cash from a Bank of China ATM.
3. If it has to be digital, give cash to a friend, hotel reception or your guide and ask them to transfer from their own account.
4. For a shop or stall whose code fails, ask for a merchant code, or pay with Alipay or cash.

**Still stuck** Alipay on a foreign card has the same limit; only a mainland bank card unlocks transfers.

**依赖的事实**

- [verified] Transfers to individuals need a mainland bank account; merchant payments and scanning merchant codes work — Reddit 1v3vuim ↑69 (↑14), 1cdk3w0 ↑72 (↑5, ↑11).

**来源** [Reddit r/chinatravel · Why your WeChat Pay transfer is failing (↑69)](https://www.reddit.com/r/chinatravel/comments/1v3vuim/why_your_wechat_pay_transfer_is_failing_the/) 2026-10-03；[Reddit r/chinalife · Foreigners can't pay Chinese people (↑72, friend tops up balance ↑11)](https://www.reddit.com/r/chinalife/comments/1cdk3w0/foreigners_cant_pay_chinese_people_buying_stuff/) 2026-10-03

相关：`wechat_how_to_pay`, `alipay_transfer_to_person`

