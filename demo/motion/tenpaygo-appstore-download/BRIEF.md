---
workflow: motion-graphics
flow: automation
storyboard: no
message: "Get TenPayGo from the App Store in a few taps: search, Get, Open"
destination: web-embed
aspect: 720x816
language: en
length: 8s
---

## Intent

A short, silent, looping UI animation for step 1 of the Landing Check tutorial "Set up TenPayGo before you fly" (H5 page in `h5/`, tutorial media in `h5/img/tutorial/tenpaygo/tenpaygo_setup_before_flight/`). It shows a traveller on an iPhone finding and installing TenPayGo: App Store search tab → type "TenPayGo" → the result row (TenPayGo · Tencent Technology (Shenzhen)) → tap Get → progress ring fills → button becomes Open. Calm, clear, product-tutorial feel; one action at a time so a tired traveller can follow it.

The user asked for it in their words: "你自己制作 app store 下载的动画 嵌入网页" (make the App Store download animation yourself and embed it in the web page).

## Notes

- Our own drawn UI. No Apple logo, no App Store wordmark artwork, no scraped screenshots. A generic store look (white page, large "Search" title, grey search field, blue "Get" pill) is enough for recognition.
- TenPayGo's real store facts to show: name "TenPayGo", developer "Tencent Technology (Shenzhen)", category line such as "Pay in China with your own card". App icon: draw a simple green rounded-square mark with a white "T"/wallet glyph; do not copy Tencent's real icon artwork.
- Portrait phone screen only (no device frame needed; the tutorial page already frames it in a rounded box). Readable when scaled down to about 353 px wide in the tutorial, so text sizes must stay large.
- Must loop cleanly: last frame returns to the first state or holds on "Open" long enough that the jump back reads as a restart.
- Embedding: the tutorial shows media in an `<img>`; the final deliverable will be converted from the MP4 render into a looping MP4 for a `<video muted autoplay loop playsinline>` plus a static poster PNG (the tutorial code will be extended to play video media).
- English UI text (the H5 is English for foreign travellers).
- Canvas changed from 720x1560 to 720x816: the H5 shows portrait video in a 353x400 `object-fit: contain` box, so 720x1560 rendered only about 185 px wide; 720x816 matches the box and fills it at 353 px (about 0.49 scale).
