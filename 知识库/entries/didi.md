# 滴滴出行 / DiDi ride-hailing · 知识库条目预览

识别关键词（中）：滴滴、滴滴出行、网约车、打车、上车点、司机、车牌、尾号、行程、快车、专车、预约、取消

识别关键词（英）：DiDi, DiDi China, Ride Hailing, Where to?, Express, Premier, Comfort, Pickup point, driver, licence plate, last 4 digits, Trips, Cancel, Payment Methods, Auto Debit, Online Car-hailing

界面特征：Orange DiDi app chrome, a map with a 'Where to?' box, ride-type price list (Express / Comfort / Premier), a driver card with plate number and ETA, the Payment Methods list (Alipay Payment, Credit/Debit Card, Apple Pay), or airport signs reading 网约车 / Online Car-hailing with pickup point codes like P2 or A1.

---

## Set up DiDi before you fly

`didi_setup_before_flight` · 阶段 preflight · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** DiDi is China's Uber. Since 2026 the mainland app registers with a foreign number and takes international cards, but solving an SMS or card problem is far easier at home than outside an airport with luggage.

**Do this now**
1. Install DiDi China (the mainland app, not DiDi Rider which serves other countries). Pick English in the first screen.
2. Tap Account and sign in with your own mobile number; select your country code, not +86. Enter the SMS code.
3. Tap Account > Wallet > Payment Methods and add a Visa or Mastercard credit card, or choose Alipay if you already linked a card there.
4. If the app asks for identity verification, complete it with your passport now rather than at the airport.

**Still stuck** If DiDi will not register, skip the app: in Alipay search DiDi or tap Transport > Taxi; it uses your Alipay account and needs no Chinese number.

**依赖的事实**

- [verified] DiDi-Greater China supports foreign mobile numbers, international credit cards, English interface and bilingual chat — TripChina citing official guidance (Sep 2026); Trip.com and WildChina agree.
- [verified] Do not install DiDi Rider; it does not operate in mainland China — WildChina.

**来源** [Trip.com · How to Use DiDi in China for Foreigners](https://www.trip.com/guide/transport/how-to-use-didi-in-china.html) 2026-05-14；[TripChina · How to Use DiDi in China: Before Your First Ride](https://tripchina.me/didi-guide-foreigners-china/) 2026-09-29；[WildChina · Guide to Using Didi in China 2025](https://wildchina.com/2025/10/a-guide-to-using-didi-in-china-2025/) 2025-11-10

**可推荐给用户** [Trip.com guide: How to use DiDi in China](https://www.trip.com/guide/transport/how-to-use-didi-in-china.html)

相关：`alipay_didi_miniprogram`, `didi_payment_failed`

---

## No SMS code from DiDi

`didi_sms_code_not_received` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** The code goes to the number you typed. A data-only eSIM gives you internet but not texts, so if your home SIM is off or roaming is disabled the code never arrives.

**Do this now**
1. Check the country code and number; DiDi defaults to +86.
2. Turn on the SIM that owns that number and enable roaming for it, or re-enable it if you switched it off for an eSIM. Data-only eSIMs cannot receive SMS.
3. Wait 60 seconds before requesting again; rapid requests get throttled.
4. Still nothing: book the ride inside Alipay instead (search DiDi), which uses your Alipay login and needs no new code.

**Still stuck** Take the official taxi queue at the airport, or pre-book a Trip.com transfer so the ride does not depend on an unresolved app.

**来源** [TripChina · How to Use DiDi in China (SMS troubleshooting)](https://tripchina.me/didi-guide-foreigners-china/) 2026-09-29；[WildChina · Guide to Using Didi in China 2025](https://wildchina.com/2025/10/a-guide-to-using-didi-in-china-2025/) 2025-11-10

相关：`alipay_sms_code_not_received`, `alipay_didi_miniprogram`

---

## DiDi can't charge your card

`didi_payment_failed` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 high · 核验 2026-10-03

**Why** DiDi charges after the ride. If your bank blocks the Chinese merchant or the card is not supported, the trip shows as unpaid and you cannot book the next one until it is settled.

**Do this now**
1. Open Account > Wallet > Payment Methods and switch the default to Alipay if you have a card linked there; most declines are the card, not DiDi.
2. If paying by card directly, enable international and online transactions in your banking app and retry the unpaid trip from Account > Trips.
3. Try a second card from another network (Visa if Mastercard failed).
4. For a ride right now, choose the Taxi option inside DiDi, which lets you pay the driver with Alipay or cash at the end.

**Still stuck** Contact DiDi's 24/7 English support under Account > Help with the trip number. Unpaid trips block new bookings until settled.

**依赖的事实**

- [verified] DiDi accepts Alipay, WeChat Pay, credit/debit card and Apple Pay as payment methods — WildChina screenshots of the Payment Methods list; TripChina.
- [verified] The Taxi ride type accepts cash — WildChina FAQ.

**来源** [TripChina · How to Use DiDi in China (payment)](https://tripchina.me/didi-guide-foreigners-china/) 2026-09-29；[Trip.com · How to Get Didi Ride in China: Airport Booking, Payment Tips](https://in.trip.com/guide/transport/didi-china.html) 2026-07-07；[WildChina · Guide to Using Didi in China 2025 (FAQ)](https://wildchina.com/2025/10/a-guide-to-using-didi-in-china-2025/) 2025-11-10

相关：`alipay_card_bind_failed`, `alipay_didi_miniprogram`

---

## Where to meet a DiDi at the airport

`didi_airport_pickup` · 阶段 landing · 适用 ios/android · 范围 PVG · 易变 high · 核验 2026-10-03

**Why** Ride-hailing cars cannot stop at the arrivals kerb. Every major airport has a signed pickup zone, usually a numbered bay in a car park, and the app will not match you until you are near it.

**Do this now**
1. Collect your luggage first; do not book from the plane or the baggage hall.
2. Follow the signs reading Online Car-hailing / 网约车 to the pickup zone (at PVG T2 the signs lead to the P2 area on the ground floor). Ignore anyone offering a ride inside the terminal.
3. Open DiDi at the zone. It auto-selects the airport pickup spot; if the pin is across the road, drag it to your bay and note the bay code (such as A1 or B3).
4. Type the hotel name in English, pick Express or, with big luggage, the Airport Transfer car type, then confirm. Follow the in-app arrow to your bay.

**Still stuck** If no cars are matching, walk to the official taxi queue (PVG T2: ground floor, Exit 9). A pre-booked Trip.com transfer avoids all of this: the driver waits at arrivals with your name.

**依赖的事实**

- [unverified] PVG T2 ride-hailing pickup is the P2 area, ground floor; taxi queue at Exit 9 — From our mock data and Trip.com's general P1/P2 description. Verify on site before quoting.
- [verified] Order only once you reach the pickup zone to avoid waiting fees — Trip.com airport tips.

**来源** [Trip.com · How to Get Didi Ride in China: Airport Booking, Payment Tips](https://in.trip.com/guide/transport/didi-china.html) 2026-07-07；[TripChina · How to Use DiDi in China (airport pickup)](https://tripchina.me/didi-guide-foreigners-china/) 2026-09-29

**可推荐给用户** [Trip.com guide: DiDi airport booking](https://in.trip.com/guide/transport/didi-china.html)

相关：`didi_find_driver`, `alipay_didi_miniprogram`

---

## Can't find your DiDi driver

`didi_find_driver` · 阶段 landing · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** Drivers cannot read English addresses and pickup zones are large. The app gives you three tools: the plate number, bilingual chat, and the last four digits of your phone number, which the driver will ask for.

**Do this now**
1. Compare the plate number on the car with the one in the app before opening the door.
2. If the car is not there, tap the chat icon and type in English; messages are translated to Chinese automatically. Say which bay or pillar you are at.
3. When the driver asks a question in Chinese, show them the last 4 digits of your registered phone number on screen; this is how they confirm the passenger.
4. Tap Call only if chat fails; the driver may not speak English.

**Still stuck** If you cannot meet within a few minutes, cancel from the trip screen and rebook from the exact bay. DiDi English support is under Account > Help, 24/7.

**依赖的事实**

- [verified] In-app chat auto-translates between English and Chinese — WildChina, Trip.com and TripChina all state it.

**来源** [WildChina · Guide to Using Didi in China 2025](https://wildchina.com/2025/10/a-guide-to-using-didi-in-china-2025/) 2025-11-10；[Trip.com · How to Get Didi Ride in China (meet your driver)](https://in.trip.com/guide/transport/didi-china.html) 2026-07-07

相关：`didi_airport_pickup`, `didi_cancel_or_wrong_car`

---

## Cancel a DiDi, or you got in the wrong car

`didi_cancel_or_wrong_car` · 阶段 anytime · 适用 ios/android · 范围 global · 易变 low · 核验 2026-10-03

**Why** Cancelling after the driver is on the way can cost a small fee, and touts at airports try to get passengers into unlicensed cars. Both are easy to avoid once you know the rule.

**Do this now**
1. To cancel: open the trip, tap Cancel, pick a reason. Cancelling within the first minute or two is normally free; later a cancellation fee is shown before you confirm.
2. Never get into a car whose plate does not match the app, even if the driver calls your name. Cancel and rebook.
3. If you were charged a fee you think is wrong, go to Account > Trips, open the trip and tap Help to dispute it in English.
4. At airports, ignore anyone approaching with 'taxi?' inside the terminal; licensed rides only come from the signed zone or the official queue.

**Still stuck** DiDi has a safety hotline inside the app for emergencies; for a wrong charge, support usually refunds within the same conversation.

**依赖的事实**

- [unverified] Exact free-cancellation window and fee amounts — Not stated in sources; wording kept generic.

**来源** [Trip.com · How to Get Didi Ride in China (pitfalls, black cars)](https://in.trip.com/guide/transport/didi-china.html) 2026-07-07；[WildChina · Guide to Using Didi in China 2025 (FAQ: problems)](https://wildchina.com/2025/10/a-guide-to-using-didi-in-china-2025/) 2025-11-10

相关：`didi_find_driver`

