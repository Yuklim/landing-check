# 上网 / Getting online · 知识库条目预览

识别关键词（中）：无线网络、免费WiFi、机场WiFi、验证码、手机号、护照、自助终端、输入账号、输入密码、登录、获得验证码、无服务、数据漫游、蜂窝、eSIM、SIM卡、流量、+86

识别关键词（英）：Wi-Fi, WiFi, AIRPORT-FREE-WIFI, Green Airport, BDIA-FREE-WIFI, Airport-Free-WiFi, login, captive portal, verification code, passport, kiosk, No Service, SOS, Data Roaming, Cellular, eSIM, APN, SIM, No Internet, Mobile Data, Chinese phone number, +86, CMLink

界面特征：A phone Settings page for Cellular / Mobile Data / eSIM / Data Roaming, a status bar showing No Service or SOS, a Wi-Fi captive portal page (often Chinese) asking for a phone number and code or an account and password, an airport Wi-Fi kiosk, or a browser page that will not load.

---

## Get a China eSIM before you fly

`connectivity_esim_before_flight` · 阶段 preflight · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-03

**Why** An eSIM is the one thing that makes everything else work: maps, payments, DiDi, translation. Travel eSIMs route through international gateways, so your usual apps keep working. Airport Wi-Fi only covers the terminal.

**Do this now**
1. Check the phone is carrier-unlocked: iPhone Settings > General > About > Carrier Lock should say No SIM restrictions; on Android dial *#06# and confirm an EID appears.
2. Buy a China mainland eSIM with a large or unlimited data plan (Trip.com sells China Mobile and China Unicom plans by day or by data) and install it at home on Wi-Fi. No Service at home after installing is normal; it registers after landing. Trip.com's installs directly from its app without scanning a QR code.
3. Keep your home SIM active for SMS codes but turn its data off, so verification texts from Alipay and DiDi still arrive after landing.
4. Write down the APN from the confirmation email in case the phone asks for it.

**Still stuck** No eSIM support on the phone: share a hotspot from a companion's travel eSIM (tethering is allowed on Trip.com eSIMs), buy a physical SIM at the airport counter with your passport, or rely on international roaming from your home carrier, which also reaches international services.

**依赖的事实**

- [verified] Travel eSIMs and international roaming reach international services because traffic exits through overseas gateways; local physical SIMs do not — Trip.com and WildChina agree.
- [verified] Data-only eSIMs cannot receive SMS — TripChina DiDi guide.
- [verified] Hotel Wi-Fi is often unusable, so data use doubles; 10 GB for 12 days ran out. Turn off iCloud photo and backup over cellular — Reddit 1vp7flo ↑143 (↑77, ↑15).
- [verified] Travel eSIMs allow hotspot sharing to other devices — Reddit 1sxd8d0 ↑17, 1u5txio (two confirmations).
- [verified] Showing No Service before departure is normal; the line registers in China — Reddit 1ta4fai ↑3, ↑2.

**来源** [Trip.com · Best China eSIM Guide: No VPN Needed for Foreigners](https://in.trip.com/guide/phone/china-esim.html) 2026-04-02；[WildChina · Staying Connected in China (Internet)](https://wildchina.com/trip-to-china-pre-departure-guide/#internet) 2026-09-24；[Beijing Government · Get Connected & Essential Apps](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/getconnected/202408/t20240830_3785643.html) 2024-08-30；[Apple Support · About cellular data roaming options for iPhone and iPad](https://support.apple.com/en-us/109037) 2026-10-03；[Reddit r/travelchina · PSA: 10GB was not enough for 12 days (↑143)](https://www.reddit.com/r/travelchina/comments/1vp7flo/psa_i_thought_10gb_would_be_enough_for_12_days_in/) 2026-10-03；[Reddit r/chinatravel · Are eSIMs still working? (Trip.com eSIM works, hotspot works) (↑30)](https://www.reddit.com/r/chinatravel/comments/1sxd8d0/vpns_not_working_in_china_right_now_are_esims/) 2026-10-03；[Reddit r/eSIMs · China eSIM not working yet, is this normal (↑5)](https://www.reddit.com/r/eSIMs/comments/1ta4fai/china_esim_not_working_yet_is_this_normal/) 2026-10-03

**可推荐给用户** [Trip.com guide: China eSIM](https://in.trip.com/guide/phone/china-esim.html)；[Beijing Government: Get Connected & Essential Apps](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/getconnected/202408/t20240830_3785643.html)

相关：`connectivity_esim_not_working`, `connectivity_buy_sim_at_airport`

---

## eSIM installed but no internet after landing

`connectivity_esim_not_working` · 阶段 landing · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** Three settings cause most failures: Data Roaming off, the wrong line carrying data, and a missing APN. Travel eSIMs count as roaming, so the phone refuses to use them until you allow it. Full signal bars with no data is the same problem, not a dead eSIM.

**Do this now**
1. Open Settings > Cellular (Mobile Data) on iPhone, or Settings > Network & internet > SIMs on Android. Set Cellular Data to the eSIM line, then turn Data Roaming ON for that line.
2. Turn Airplane Mode on for a few seconds and off again so the phone re-registers with the local tower.
3. If it still says No Service, or shows full bars but nothing loads, open the eSIM line's settings and enter the APN from the confirmation email, turn Wi-Fi off, force-quit the app that is failing, then restart the phone.
4. Check the plan is activated: some eSIMs activate on first connection, others at a start date you chose.

**Still stuck** Connect to the airport Wi-Fi and buy a second, smallest eSIM from a different seller to test; it activates in minutes. The seller's chat is slow, and a physical SIM at the arrivals counter with your passport is the other way out.

**依赖的事实**

- [verified] Data Roaming off is the number one cause of eSIM not working reports — Trip.com guide; Reddit replies in every eSIM thread ask about roaming, data line and APN first (1ngeqo1 ↑2, 1m0v096 ↑3, 1ta4fai ↑2).
- [verified] Some eSIMs show full bars with no data even with roaming on and were never fixed in the thread — Reddit 1mjwkm7 ↑7 (72 comments, unresolved), 1ngeqo1 ↑5; hence the second-eSIM fallback.
- [unverified] Trip.com's China Mobile line appears as CMLink; APN cmhk or cmlink — Single Reddit report (1ta4fai).
- [verified] Buying a second small eSIM from another seller as a backup is the most-upvoted advice — Reddit 1potu6l ↑14, ↑2.

**来源** [Apple Support · View or change cellular data settings on iPhone (Settings > Cellular > Cellular Data Options > Data Roaming)](https://support.apple.com/guide/iphone/view-or-change-cellular-data-settings-iph3dd5f213/ios) 2026-10-03；[Apple Support · About cellular data roaming options for iPhone and iPad](https://support.apple.com/en-us/109037) 2026-10-03；[Google Pixel Help · Use dual SIMs on your Pixel (Settings > Network & internet > SIMs, Roaming toggle)](https://support.google.com/pixelphone/answer/9449293) 2026-10-03；[Trip.com · Best China eSIM Guide (What should I do if my eSIM doesn't work)](https://in.trip.com/guide/phone/china-esim.html) 2026-04-02；[Reddit r/eSIMs · China eSIM not working yet, is this normal (↑5)](https://www.reddit.com/r/eSIMs/comments/1ta4fai/china_esim_not_working_yet_is_this_normal/) 2026-10-03；[Reddit r/eSIMs · eSIM shows full bars but no data (unresolved) (↑7)](https://www.reddit.com/r/eSIMs/comments/1mjwkm7/holafly_esim_not_working/) 2026-10-03；[Reddit r/travelchina · Get two eSIMs and test coverage first (↑14)](https://www.reddit.com/r/travelchina/comments/1potu6l/esim/) 2026-10-03

**可推荐给用户** [Apple Support · Cellular data settings](https://support.apple.com/guide/iphone/view-or-change-cellular-data-settings-iph3dd5f213/ios)；[Google Pixel Help · Dual SIMs](https://support.google.com/pixelphone/answer/9449293)

相关：`connectivity_airport_wifi_sms`, `connectivity_buy_sim_at_airport`

**配图**

- 第 1 步 `connectivity/connectivity_esim_not_working/step1.png`（占位，演示用） — iPhone Settings > Cellular > Cellular Data Options: Data Roaming switched on（Apple Support · iPhone cellular settings illustrations）
- 第 2 步 `connectivity/connectivity_esim_not_working/step2.png`（占位，演示用） — iPhone Control Center showing SOS only: toggle Airplane Mode on and off to re-register（Apple Support · iPhone cellular settings illustrations）

---

## Airport Wi-Fi asks for a phone number

`connectivity_airport_wifi_sms` · 阶段 landing · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-03

**Why** Public Wi-Fi in China requires identity verification by law. Airports accept an SMS code to many foreign numbers; shops and malls usually accept only Chinese numbers.

**Do this now**
1. Join the airport network: Pudong #AIRPORTPVG-FREE-WIFI, Beijing Capital AIRPORT-FREE-WIFI-NEW, Daxing BDIA-FREE-WIFI. The login page opens by itself; if not, open any website.
2. Choose the overseas or international phone option, pick your country code, type your number and tap Get code (获得验证码). The SMS arrives on your roaming line even with data off.
3. Enter the code and tap Login (登录). The session lasts a few hours; reconnect the same way if it drops.
4. No code after a minute: do not keep tapping. All three airports' login pages have a Passport Login option where you photograph your passport instead; Beijing Capital also has passport kiosks.

**Still stuck** Airport information desks and the Payment Service Center in the arrivals hall help in person; ask for 免费WiFi.

**依赖的事实**

- [verified] PVG Wi-Fi name is #AIRPORTPVG-FREE-WIFI and SMS login accepts foreign numbers from 220+ countries — ChinaAirlineTravel airport guide and Chinese airport news both give this name; the H5 design was updated to it. Not yet checked on site, so re-check on the first real landing.
- [verified] PVG login page offers passport-photo authentication for passengers without a Chinese SIM — Shanghai Airport Authority news 2026-05-28 (Wi-Fi易认证).
- [verified] Beijing Capital SSID AIRPORT-FREE-WIFI-NEW, Daxing Green Airport / BDIA-FREE-WIFI — Beijing government pages (2024 and Dec 2025); Daxing has two names in two official pages, both listed.

**来源** [Beijing Government · Get Connected (Beijing airports Wi-Fi step by step)](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/getconnected/202408/t20240830_3785643.html) 2024-08-30；[MyChinaCompass · Free Wi-Fi in China: Hotspots, Login Guide & SMS Verification](https://mychinacompass.com/free-wifi/) 2026-05-17；[ChinaAirlineTravel · Shanghai Pudong Airport Wi-Fi guide](https://www.chinaairlinetravel.com/airport-guide/shanghai-airport/pudong-airport-wifi.html) 2026；[Shanghai Airport Authority · 浦东机场打造高效便捷的“1+2+N”入境服务链](https://www.shanghaiairport.com/xwg/info_itemid_44442.html) 2026-05-28

**可推荐给用户** [Beijing Government: how to connect to airport Wi-Fi](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/getconnected/202408/t20240830_3785643.html)

相关：`connectivity_airport_wifi_passport`, `connectivity_esim_not_working`

**配图**

- 第 2 步 `connectivity/connectivity_airport_wifi_sms/step2.jpg` — Beijing Capital airport official Wi-Fi guide: choose AIRPORT-FREE-WIFI-NEW, enter mobile number, Get verification code, Login（Beijing Government · Get Connected (Beijing Capital airport Wi-Fi guide poster)）

---

## Get airport Wi-Fi with your passport

`connectivity_airport_wifi_passport` · 阶段 landing · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** Every major airport has a way to log in without any phone number. The login page at Pudong, Beijing Capital and Daxing has a Passport Login option where you photograph your passport; Beijing Capital additionally has kiosks that scan the passport and print a username and password.

**Do this now**
1. On the Wi-Fi login page tap Passport Login (护照登录), photograph the passport photo page in good light with all four corners visible, then take the selfie if asked and confirm.
2. Beijing Capital alternative: find the Wi-Fi kiosk (无线上网身份验证自助终端). Show staff this line if needed: 请问最近的无线上网身份验证自助终端在哪里?
3. Open the passport to the photo page and slide it into the slot marked 护照扫码口 Passport Scanning. A slip prints with a username and password.
4. Type them into 输入账号 (username) and 输入密码 (password) on the login page, then tap 登录.

**Still stuck** Beijing Capital slips last 5 hours, max 3 per passport. At Pudong the kiosks are all past security in departures, so arriving passengers should use the passport-photo login or ask the information desk; Wi-Fi service line (+86) 400 920 1851.

**依赖的事实**

- [verified] Beijing Capital offers three methods: SMS, passport kiosk (slip valid 5 hours, max 3 per passport), and Passport Login on the portal page — Beijing Capital Airport official poster on the Beijing government page (2024-08).
- [verified] PVG offers passport-photo login on the Wi-Fi page; its passport kiosks are in departures after security (T1 gates 17-20, T2 gate D73-D75 area) — Shanghai Airport Authority 2026-05-28 for the photo login; ChinaAirlineTravel for kiosk locations.

**来源** [Beijing Government · Get Connected (Authentication via passport kiosk)](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/getconnected/202408/t20240830_3785643.html) 2024-08-30；[Beijing Government · Free Wi-Fi at Daxing Airport with passport login](https://english.beijing.gov.cn/latest/news/202512/t20251205_4322494.html) 2025-12-05；[MyChinaCompass · Free Wi-Fi in China (airport kiosks)](https://mychinacompass.com/free-wifi/) 2026-05-17；[Shanghai Airport Authority · 浦东机场打造高效便捷的“1+2+N”入境服务链](https://www.shanghaiairport.com/xwg/info_itemid_44442.html) 2026-05-28；[ChinaAirlineTravel · Shanghai Pudong Airport Wi-Fi guide](https://www.chinaairlinetravel.com/airport-guide/shanghai-airport/pudong-airport-wifi.html) 2026

相关：`connectivity_airport_wifi_sms`

**配图**

- 第 2 步 `connectivity/connectivity_airport_wifi_passport/step2.jpg` — Beijing Capital airport official Wi-Fi guide, method 2: get an account from the passport kiosk, method 3: Passport Login on the portal（Beijing Government · Get Connected (Beijing Capital airport Wi-Fi guide poster)）

---

## Buy a SIM card at the airport

`connectivity_buy_sim_at_airport` · 阶段 landing · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-03

**Why** If the phone has no eSIM support or the eSIM failed, a physical SIM from a counter in arrivals is the next best option. It needs your passport, local SIMs do not reach international services, and airport counters charge more for weaker plans than carrier stores in the city, so treat it as the emergency option.

**Do this now**
1. At Pudong, carrier counters (China Telecom, China Mobile) sit inside the international baggage claim hall before customs and again in the arrivals public area; 7, 15 and 30 day tourist plans are sold against your passport. Only buy from a staffed carrier counter, and decline any extra app a booth offers to install.
2. At Beijing Capital T3 go to the Beijing Service counter at Exit B on the international arrivals floor. At Daxing ask for the TravelPass desk; if arrivals has none, the China Mobile shop is in the public check-in hall upstairs.
3. Hand over your passport; registration is required by law and takes a few minutes. Make sure the counter cuts the SIM to your phone's size or offers an eSIM.
4. Before you leave the counter, confirm data works and ask them to set the APN if needed.

**Still stuck** Keep your home SIM for SMS codes. For international apps on a local SIM, switch to home-carrier roaming when needed, or use a Trip.com eSIM instead.

**依赖的事实**

- [verified] PVG: China Telecom 7/15/30-day tourist SIM at the integrated service center in the international baggage claim area — Shanghai Airport Authority news 2026-05-28; WildChina describes the same counter after baggage claim.
- [unverified] PVG arrivals-hall counters open roughly 07:00-23:00 and may close early on quiet nights — Third-party eSIM sellers only (chinaesim.com, mychina.guide).
- [verified] PEK T3 Beijing Service counter, Exit B, international arrivals F2 — Beijing government page and airport's own post.
- [verified] Airport SIM counters are the most expensive option with limited plans; carrier stores in the city are preferred for stays over a few days — Reddit 1hjvnko ↑6 and ↑3, 1vefw1n ↑4, 1dafu4y.
- [unverified] Booths just outside PVG arrivals push installing an unnamed app with the SIM — Single Reddit report (1h3yer4).
- [unverified] Daxing China Mobile shop is in the departures check-in hall, not arrivals — Single Reddit report 2023 (15lgbm5 ↑8).

**来源** [Shanghai Airport Authority · 浦东机场打造高效便捷的“1+2+N”入境服务链](https://www.shanghaiairport.com/xwg/info_itemid_44442.html) 2026-05-28；[WildChina · Staying Connected in China (SIM cards at Pudong)](https://wildchina.com/trip-to-china-pre-departure-guide/#internet) 2026-09-24；[Beijing Government · PEK SIM Card Application/Collection](https://english.beijing.gov.cn/specials/beijingservice/pek/sim/) 2025；[Beijing Government · A Guide for Purchasing SIM Cards in Beijing](https://english.beijing.gov.cn/quickguideservices/purchasingsimcards/) 2025；[Reddit r/shanghai · SIM cards when arriving to Shanghai (↑4, airport kiosk semi-legit ↑6, buy at a carrier store ↑3)](https://www.reddit.com/r/shanghai/comments/1hjvnko/sim_cards_when_arriving_to_shanghai/) 2026-10-03；[Reddit r/travelchina · Foreign number to use China apps (↑6)](https://www.reddit.com/r/travelchina/comments/1vefw1n/foreign_number_to_use_china_apps/) 2026-10-03

相关：`connectivity_esim_before_flight`, `connectivity_blocked_services`

---

## Google, WhatsApp or Instagram won't load

`connectivity_blocked_services` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** On a local Chinese SIM or most public Wi-Fi, international services are not reachable. On a travel eSIM or home-carrier roaming they are, because the connection exits abroad.

**Do this now**
1. Check which line is carrying data: Settings > Cellular. If it is a local SIM or Wi-Fi, switch Cellular Data to your travel eSIM or home SIM with roaming on, and turn Wi-Fi off. A hotspot from that line gives a laptop or tablet the same access.
2. For maps, use Apple Maps or Amap (高德) which work on any connection and have better local data than Google Maps.
3. For messaging locals and hotels, WeChat works everywhere; ask contacts for their WeChat ID.
4. Trip.com, Alipay, DiDi and translation apps all work on local connections; only overseas services are affected.

**Still stuck** Buy a Trip.com eSIM from the airport Wi-Fi if you do not have one; it activates in minutes and restores access to your usual apps.

**依赖的事实**

- [verified] Roaming and travel eSIM traffic exits through the home carrier, so international services load; hotspot sharing carries the same access — Reddit 1wdzocd ↑13 ×2, 1sxd8d0 ↑17, 1sudpq7 ↑28.
- [unverified] On home-carrier roaming WeChat Pay sometimes reports a wrong region while Alipay works — Single Reddit report (1o5kz6l ↑5).

**来源** [Trip.com · Best China eSIM Guide (why you need an eSIM)](https://in.trip.com/guide/phone/china-esim.html) 2026-04-02；[WildChina · Staying Connected in China (international roaming)](https://wildchina.com/trip-to-china-pre-departure-guide/#internet) 2026-09-24；[Beijing Government · Get Connected (map apps)](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/getconnected/202408/t20240830_3785643.html) 2024-08-30；[Apple Support · View or change cellular data settings on iPhone (Settings > Cellular > Cellular Data Options > Data Roaming)](https://support.apple.com/guide/iphone/view-or-change-cellular-data-settings-iph3dd5f213/ios) 2026-10-03；[Reddit r/freedommobile · Roaming in China: traffic exits via home carrier (↑54)](https://www.reddit.com/r/freedommobile/comments/1wdzocd/roam_beyond_china_my_experience/) 2026-10-03；[Reddit r/chinatravel · Are eSIMs still working? (Trip.com eSIM works, hotspot works) (↑30)](https://www.reddit.com/r/chinatravel/comments/1sxd8d0/vpns_not_working_in_china_right_now_are_esims/) 2026-10-03

相关：`connectivity_esim_before_flight`, `connectivity_buy_sim_at_airport`

---

## An app insists on a Chinese phone number

`connectivity_chinese_number_needed` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** A foreign number is enough for Alipay, DiDi inside Alipay, Trip.com bookings and train tickets. Food delivery, shared bikes, WeChat mini-programs for attraction tickets and some vending machines only text +86 numbers.

**Do this now**
1. Check whether the same thing works without a number: attractions and trains through Trip.com with your passport, taxis through DiDi Travel inside Alipay, restaurant QR menus by scanning with Alipay.
2. For food delivery ask hotel reception to order on their account and pay them, or order at the counter.
3. If a code field is required but no SMS ever comes, such as on-train meal ordering, any digits are accepted; try that before giving up.
4. If you really need a +86 number for a longer stay, buy the cheapest plan with a number at a carrier store in the city with your passport; it takes about 45 minutes.

**Still stuck** Do not buy an airport SIM just for a number; the plans are poor and the eSIM already handles data.

**依赖的事实**

- [verified] Works with a foreign number: Alipay, WeChat (with friend verification), DiDi via Alipay, Trip.com tickets. Needs +86: Meituan delivery, shared bikes, attraction-ticket mini-programs, some vending machines — Reddit 1s6pq82 ↑47, 1vefw1n, 1kvt59e ↑3, 1o5kz6l ↑4, 1wnz9u8 ↑13.
- [unverified] On-train seat QR ordering accepts any digits as the SMS code — Reddit 1u3u40e ↑2 with one confirmation.
- [unverified] Getting a SIM with a number at a city carrier store takes about 45 minutes — Single Reddit report (1ji2bod).

**来源** [Reddit r/travelchina · Just came back from China: what needs a Chinese number (↑1285)](https://www.reddit.com/r/travelchina/comments/1s6pq82/just_came_back_from_china_here_is_some_of_my/) 2026-10-03；[Reddit r/chinatravel · Ordering food as a foreigner (↑7)](https://www.reddit.com/r/chinatravel/comments/1u3u40e/ordering_food_in_china_as_a_foreigner_off_meituan/) 2026-10-03；[Reddit r/travelchina · Foreign number to use China apps (↑6)](https://www.reddit.com/r/travelchina/comments/1vefw1n/foreign_number_to_use_china_apps/) 2026-10-03；[Reddit r/chinatravel · Struggling with apps, no Chinese number (↑13)](https://www.reddit.com/r/chinatravel/comments/1wnz9u8/struggling_with_apps_big_time_no_chinese_number/) 2026-10-03

相关：`wechat_miniprogram_needs_chinese_number`, `connectivity_buy_sim_at_airport`, `alipay_didi_miniprogram`, `tenpaygo_setup_before_flight`

