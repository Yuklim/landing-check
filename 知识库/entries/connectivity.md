# 上网 / Getting online · 知识库条目预览

识别关键词（中）：无线网络、免费WiFi、机场WiFi、验证码、手机号、护照、自助终端、输入账号、输入密码、登录、获得验证码、无服务、数据漫游、蜂窝、eSIM、SIM卡、流量

识别关键词（英）：Wi-Fi, WiFi, AIRPORT-FREE-WIFI, Green Airport, BDIA-FREE-WIFI, Airport-Free-WiFi, login, captive portal, verification code, passport, kiosk, No Service, SOS, Data Roaming, Cellular, eSIM, APN, SIM, No Internet, Mobile Data

界面特征：A phone Settings page for Cellular / Mobile Data / eSIM / Data Roaming, a status bar showing No Service or SOS, a Wi-Fi captive portal page (often Chinese) asking for a phone number and code or an account and password, an airport Wi-Fi kiosk, or a browser page that will not load.

---

## Get a China eSIM before you fly

`connectivity_esim_before_flight` · 阶段 preflight · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-03

**Why** An eSIM is the one thing that makes everything else work: maps, payments, DiDi, translation. Travel eSIMs route through international gateways, so your usual apps keep working. Airport Wi-Fi only covers the terminal.

**Do this now**
1. Check the phone is carrier-unlocked: iPhone Settings > General > About > Carrier Lock should say No SIM restrictions; on Android dial *#06# and confirm an EID appears.
2. Buy a China mainland eSIM (Trip.com sells China Mobile and China Unicom plans by day or by data) and install it at home on Wi-Fi. Trip.com's installs directly from its app without scanning a QR code.
3. Keep your home SIM active for SMS codes but turn its data off, so verification texts from Alipay and DiDi still arrive after landing.
4. Write down the APN from the confirmation email in case the phone asks for it.

**Still stuck** No eSIM support on the phone: plan to buy a physical SIM at the airport counter with your passport, or rely on international roaming from your home carrier, which also reaches international services.

**依赖的事实**

- [verified] Travel eSIMs and international roaming reach international services because traffic exits through overseas gateways; local physical SIMs do not — Trip.com and WildChina agree.
- [verified] Data-only eSIMs cannot receive SMS — TripChina DiDi guide.

**来源** [Trip.com · Best China eSIM Guide: No VPN Needed for Foreigners](https://in.trip.com/guide/phone/china-esim.html) 2026-04-02；[WildChina · Staying Connected in China (Internet)](https://wildchina.com/trip-to-china-pre-departure-guide/#internet) 2026-09-24；[Beijing Government · Get Connected & Essential Apps](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/getconnected/202408/t20240830_3785643.html) 2024-08-30

**可推荐给用户** [Trip.com guide: China eSIM](https://in.trip.com/guide/phone/china-esim.html)；[Beijing Government: Get Connected & Essential Apps](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/getconnected/202408/t20240830_3785643.html)

相关：`connectivity_esim_not_working`, `connectivity_buy_sim_at_airport`

---

## eSIM installed but no internet after landing

`connectivity_esim_not_working` · 阶段 landing · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** Nine times out of ten the eSIM is fine and one switch is off: Data Roaming. Travel eSIMs count as roaming, so the phone refuses to use them until you allow it.

**Do this now**
1. Open Settings > Cellular (Mobile Data). Set Cellular Data to the eSIM line, then turn Data Roaming ON for that line.
2. Turn Airplane Mode on for 10 seconds and off again so the phone re-registers with the local tower.
3. If it still says No Service, open the eSIM line's settings and enter the APN from the confirmation email, then restart the phone.
4. Check the plan is activated: some eSIMs activate on first connection, others at a start date you chose.

**Still stuck** Connect to the airport Wi-Fi to reach the eSIM seller's 24/7 chat (Trip.com has one), or buy a physical SIM at the arrivals counter with your passport.

**依赖的事实**

- [verified] Data Roaming off is the number one cause of eSIM 'not working' reports — Trip.com guide; consistent with how travel eSIMs work.

**来源** [Trip.com · Best China eSIM Guide (What should I do if my eSIM doesn't work)](https://in.trip.com/guide/phone/china-esim.html) 2026-04-02

相关：`connectivity_airport_wifi_sms`, `connectivity_buy_sim_at_airport`

---

## Airport Wi-Fi asks for a phone number

`connectivity_airport_wifi_sms` · 阶段 landing · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-03

**Why** Public Wi-Fi in China requires identity verification by law. Airports accept an SMS code to many foreign numbers; shops and malls usually accept only Chinese numbers.

**Do this now**
1. Join the airport network: Pudong #AIRPORTPVG-FREE-WIFI, Beijing Capital AIRPORT-FREE-WIFI-NEW, Daxing BDIA-FREE-WIFI. The login page opens by itself; if not, open any website.
2. Choose the overseas or international phone option, pick your country code, type your number and tap Get code (获得验证码). The SMS arrives on your roaming line even with data off.
3. Enter the code and tap Login (登录). The session lasts a few hours; reconnect the same way if it drops.
4. No code after 60 seconds: do not keep tapping. All three airports' login pages have a Passport Login option where you photograph your passport instead; Beijing Capital also has passport kiosks.

**Still stuck** Airport information desks and the Payment Service Center in the arrivals hall help in person; ask for 免费WiFi.

**依赖的事实**

- [verified] PVG Wi-Fi name is #AIRPORTPVG-FREE-WIFI and SMS login accepts foreign numbers from 220+ countries — ChinaAirlineTravel airport guide; name also in Chinese airport news. Not yet checked on site.
- [verified] PVG login page offers passport-photo authentication for passengers without a Chinese SIM — Shanghai Airport Authority news 2026-05-28 (Wi-Fi易认证).
- [verified] Beijing Capital SSID AIRPORT-FREE-WIFI-NEW, Daxing Green Airport / BDIA-FREE-WIFI — Beijing government pages (2024 and Dec 2025); Daxing has two names in two official pages, both listed.

**来源** [Beijing Government · Get Connected (Beijing airports Wi-Fi step by step)](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/getconnected/202408/t20240830_3785643.html) 2024-08-30；[MyChinaCompass · Free Wi-Fi in China: Hotspots, Login Guide & SMS Verification](https://mychinacompass.com/free-wifi/) 2026-05-17；[ChinaAirlineTravel · Shanghai Pudong Airport Wi-Fi guide](https://www.chinaairlinetravel.com/airport-guide/shanghai-airport/pudong-airport-wifi.html) 2026；[Shanghai Airport Authority · 浦东机场打造高效便捷的“1+2+N”入境服务链](https://www.shanghaiairport.com/xwg/info_itemid_44442.html) 2026-05-28

**可推荐给用户** [Beijing Government: how to connect to airport Wi-Fi](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/getconnected/202408/t20240830_3785643.html)

相关：`connectivity_airport_wifi_passport`, `connectivity_esim_not_working`

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

---

## Buy a SIM card at the airport

`connectivity_buy_sim_at_airport` · 阶段 landing · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-03

**Why** If the phone has no eSIM support or the eSIM failed, a physical SIM from a counter in arrivals is the next best option. It needs your passport, and note that local SIMs do not reach international services.

**Do this now**
1. At Pudong go to the integrated service center inside the international baggage claim hall (before customs): China Telecom sells 7, 15 and 30 day tourist SIMs there against your passport. Another counter sits in the arrivals public area after customs.
2. At Beijing Capital T3 go to the Beijing Service counter at Exit B on the international arrivals floor; at Daxing ask for the TravelPass desk. Both airports also have SIM vending machines.
3. Hand over your passport; registration is required by law and takes a few minutes. Make sure the counter cuts the SIM to your phone's size or offers an eSIM.
4. Before you leave the counter, confirm data works and ask them to set the APN if needed.

**Still stuck** Keep your home SIM for SMS codes. For international apps on a local SIM, switch to home-carrier roaming when needed, or use a Trip.com eSIM instead.

**依赖的事实**

- [verified] PVG: China Telecom 7/15/30-day tourist SIM at the integrated service center in the international baggage claim area — Shanghai Airport Authority news 2026-05-28; WildChina describes the same counter after baggage claim.
- [unverified] PVG arrivals-hall counters open roughly 07:00-23:00 and may close early on quiet nights — Third-party eSIM sellers only (chinaesim.com, mychina.guide).
- [verified] PEK T3 Beijing Service counter, Exit B, international arrivals F2 — Beijing government page and airport's own post.

**来源** [Shanghai Airport Authority · 浦东机场打造高效便捷的“1+2+N”入境服务链](https://www.shanghaiairport.com/xwg/info_itemid_44442.html) 2026-05-28；[WildChina · Staying Connected in China (SIM cards at Pudong)](https://wildchina.com/trip-to-china-pre-departure-guide/#internet) 2026-09-24；[Beijing Government · PEK SIM Card Application/Collection](https://english.beijing.gov.cn/specials/beijingservice/pek/sim/) 2025；[Beijing Government · A Guide for Purchasing SIM Cards in Beijing](https://english.beijing.gov.cn/quickguideservices/purchasingsimcards/) 2025

相关：`connectivity_esim_before_flight`, `connectivity_blocked_services`

---

## Google, WhatsApp or Instagram won't load

`connectivity_blocked_services` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** On a local Chinese SIM or most public Wi-Fi, international services are not reachable. On a travel eSIM or home-carrier roaming they are, because the connection exits abroad.

**Do this now**
1. Check which line is carrying data: Settings > Cellular. If it is a local SIM or Wi-Fi, switch Cellular Data to your travel eSIM or home SIM with roaming on, and turn Wi-Fi off.
2. For maps, use Apple Maps or Amap (高德) which work on any connection and have better local data than Google Maps.
3. For messaging locals and hotels, WeChat works everywhere; ask contacts for their WeChat ID.
4. Trip.com, Alipay, DiDi and translation apps all work on local connections; only overseas services are affected.

**Still stuck** Buy a Trip.com eSIM from the airport Wi-Fi if you do not have one; it activates in minutes and restores access to your usual apps.

**来源** [Trip.com · Best China eSIM Guide (why you need an eSIM)](https://in.trip.com/guide/phone/china-esim.html) 2026-04-02；[WildChina · Staying Connected in China (international roaming)](https://wildchina.com/trip-to-china-pre-departure-guide/#internet) 2026-09-24；[Beijing Government · Get Connected (map apps)](https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/getconnected/202408/t20240830_3785643.html) 2024-08-30

相关：`connectivity_esim_before_flight`, `connectivity_buy_sim_at_airport`

