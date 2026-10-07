# Landing Check 知识库 · 原始资料

两种用途：一是"我卡住了"和落地卡背后的知识库条目来源；二是行前检查和 Trip.com 页面里直接推荐给用户阅读的攻略。两种用途对来源的要求不同，见下面"能不能直接给用户看"。

抓取日期 2026-10-02 · 共 88 篇 · 全部在 `raw/` 下，按来源分目录，每篇头部有原文链接和日期。

```
知识库/
├── README.md                 本文件：总索引
├── tools/
│   ├── fetch_wildchina.py    WildChina 抓取（含 HTML → Markdown 转换器）
│   └── fetch_articles.py     其他来源抓取，URL 列表在 SOURCES 里，可随时加
└── raw/
    ├── wildchina/            28 篇，索引见 raw/wildchina/README.md
    ├── tripcom/              14 篇，Trip.com 自家指南
    ├── official/             12 篇，北京市政府英文站、Alipay+、12306、China Briefing
    ├── chinahighlights/       4 篇
    ├── blogs/                30 篇，2026 年独立攻略站
    └── tenpaygo/              8 篇，TenPayGo 官方协议、发布新闻、公测后指南（2026-10-06 抓取，索引见 raw/tenpaygo/README.md）
```

## 一、能不能直接给用户看

| 来源 | 篇数 | 直接推荐给用户阅读 | 作为知识库来源 | 说明 |
|---|---|---|---|---|
| `tripcom/` | 14 | **可以** | 可以 | 与产品同源，链接可直接放进行前检查和落地卡。更新频繁，标题带日期。缺点是夹带销售内容（eSIM、车票 3% off），推荐时注明。 |
| `official/` | 12 | **可以** | 可以，优先级最高 | 北京市政府"新到访者指南"、Alipay+ 官方页、12306 官网。数字和流程以它们为准。 |
| `wildchina/` | 28 | 不建议 | 可以 | 步骤最细、截图最全，但是竞品内容且带推广。改写成我们自己的条目后使用，不外链。 |
| `chinahighlights/` | 4 | 不建议 | 可以 | 旅行社内容，背景性强。 |
| `blogs/` | 30 | 不建议 | 可以，用于交叉验证 | 质量参差，但 2026 年更新的多，适合核对限额、手续费、错误码这类会变的数字。 |

推荐给用户时只用前两类，并在页面上标注来源和日期。其余三类只用来写我们自己的条目。

## 二、按场景找资料

每个场景列"写条目时主读"和"交叉核验"。文件路径相对 `raw/`。

### 支付宝：安装、注册、绑卡、失败处理

- 主读：`wildchina/guide-to-using-alipay-2026.md`（步骤带截图）、`tripcom/phone-how-to-use-alipay.md`（菜单路径明确：Me > Settings > Account & Security > Identity Verification）、`official/pay-in-the-chinese-mainland.md`（Alipay+ 官方，支持的卡组织）
- 核验：`blogs/guides-using-alipay.md`、`blogs/blog-alipay-foreigners-2025-ultimate-faq.md`（错误码和限额）、`blogs/articles-how-to-use-alipay-with-foreign-cards.md`（Fixes 一节）、`blogs/alipay-for-foreigners.md`
- TourCard：`wildchina/guide-to-using-alipay-2026.md` Option 2 一节、`blogs/posts-tour-card.md`（中文）
- 可推荐给用户：`tripcom/phone-how-to-use-alipay.md`、`tripcom/info-alipay-china.md`、`official/202408-t20240830-3785647.md`（北京政府 Payment Services，含逐步绑卡和支付宝英文热线）

### 微信支付：开通、验证、限制

- 主读：`wildchina/wechat-pay-in-2026.md`、`official/202005-t20200516-1899230.md`（北京政府，2026 年 3 月更新，支持卡组织清单）
- 核验：`official/news-wechat-enables-foreigners-to-pay-with-overseas-cards-in-china.md`（限额和手续费：200 元以下免费、以上 3%、新用户 60 天内千元以下免手续费）、`blogs/wechat-pay-limits-guide.md`、`blogs/blog-wechat-pay-foreigners.md`
- 关键差异：没有中国手机号时微信小程序可能用不了，滴滴请走支付宝里的小程序。

### TenPayGo：微信支付的旅客版 App

- 主读：`tenpaygo/official-user-service-agreement-20260611.md`（财付通官方协议：额度、手续费原则、仅限中国大陆、客服 95017）、`tenpaygo/tenpaygo.md`（引官方发布指南：邮箱注册、两种付款方式、不含小程序和转账）
- 核验：`tenpaygo/tenpaygo-payment-guide.md`（公测后现状，2026-10-05 更新）、`tenpaygo/news-sohu-20260924.md`（7 大卡组织、近 60 个钱包、深圳乘车码）；Reddit 见 `reddit/README.md` 的 1wp1prm、1ukolqw
- 关键差异：只能付微信支付商户的码，不能叫滴滴、不能过深圳以外的地铁闸机；手续费说法冲突，正文不写数字
- 可推荐给用户：App Store 与 Google Play 的 TenPayGo 应用页（官网 tenpaygo.com 本次抓取不可达）

### 滴滴叫车

- 主读：`wildchina/a-guide-to-using-didi-in-china-2025.md`、`tripcom/transport-how-to-use-didi-in-china.md`、`tripcom/transport-didi-china.md`（有机场叫车一节）
- 核验：`blogs/didi-guide-foreigners-china.md`（2026-09-29，最新）、`blogs/how-to-use-didi-app-in-china.md`、`blogs/blog-how-to-use-didi-china.md`（Wise）
- 可推荐给用户：Trip.com 的两篇滴滴指南

### 上网：eSIM、机场 SIM 卡柜台、免费 Wi-Fi

- 主读：`wildchina/sections/internet.md`（eSIM 走国际网关、浦东机场 Roamingman 和中国电信柜台）、`tripcom/phone-china-esim.md`
- 机场 Wi-Fi：`blogs/free-wifi.md`（登录方式和短信验证）、`blogs/beijing-airport-wifi.md`、`official/202512-t20251205-4322494.md`（大兴机场拍护照登录）
- 北京 SIM 卡：`official/quickguideservices-purchasingsimcards.md`、`official/pek-sim.md`（首都机场 T3 国际到达 F2 B 出口 Beijing Service 柜台）、`official/pkx-changyoutong.md`（大兴 TravelPass）
- 可推荐给用户：`tripcom/phone-china-esim.md`、北京政府 Get Connected 页

### 机场落地：入境、到市区、出租车

- 浦东：`tripcom/transport-shanghai-pudong-airport.md`（可推荐）、`blogs/shanghai-pudong-airport-to-city-guide.md`（2026-09-24，最详细）、`blogs/articles-shanghai-airport-guide-pvg-and-sha.md`、`blogs/local-tips-shanghai-airport-guide.md`
- 北京：`official/202408-t20240830-3785706.md`（Transportation，出租车价格区间、地铁卡购买方式）
- 入境流程：`wildchina/chinese-airlines.md` At the airport 一节、`wildchina/a-guide-to-china-transit-visas.md` What to expect on arrival 一节
- 过境免签：`tripcom/visa-china-visa-free-transit.md`（可推荐）、`wildchina/a-guide-to-china-transit-visas.md`

### 火车票：12306 护照购票

- 主读：`tripcom/train-12306.md`（可推荐，注意带 3% off 推广）、`official/en-index.md`（12306 英文官网入口）
- 核验：`blogs/blog-how-to-buy-train-tickets-in-china.md`（Wise）、`blogs/transport-china-train-tickets-foreigners.md`、`blogs/posts-high-speed-train.md`（中文）、`wildchina/chinas-trains-a-comprehensive-guide.md`

### 行前检查页可推荐的"第一次来中国"读物

- `tripcom/info-china-apps.md`、`tripcom/phone-best-china-travel-apps.md`（装什么 App）
- `tripcom/info-alipay-vs-wechat-pay.md`（选哪个支付）
- `official/202408-t20240830-3785643.md`（北京政府 Get Connected & Essential Apps）
- `chinahighlights/travelguide-plan-first-trip.md`、`wildchina/planning-a-first-trip-to-china.md`（背景参考，不外链）

### 其他

- 小费与礼仪：`wildchina/sections/tipping-in-china.md`、`wildchina/etiquette-in-china.md`、`chinahighlights/travelguide-article-things-not-to-do-in-china.md`
- 现金与 ATM：`wildchina/sections/currency-in-china.md`、`chinahighlights/expatslife-payment-methods.md`
- 无障碍：`wildchina/accessible-travel-in-china.md`
- 饮食：`wildchina/halal-food-in-china.md`、`wildchina/vegetarian-and-vegan-dining-in-china.md`
- 支付验证对照：`blogs/en.md`（readyforchina.com 的 1 元测试支付）

## 三、抓取时的发现

- 9 个站被 Cloudflare 拦截抓不到（wanderinchina、mychina.guide、chinafortravelers、shanghaitourism、travelofchina、chinatripplans），已从列表里去掉，内容有替代来源。
- WildChina 行前指南的分节是动态加载的，通过站点接口取到 7 节，另 7 节为空。
- Trip.com 页面带大量相关推荐和航司 logo，已清洗；文中的"3% Off"是销售标题，推荐给用户时改用我们自己的标题。
- 中文来源只有两篇（chinaguidelines.com），其余全是英文，正好对应目标用户。

## 四、下一步

1. 按"二"里的分组，每个场景先读主读篇目，写成知识库条目（格式见方案报告 5.4 节：scenario、scope、steps、fallback、source、verified_at、volatility）。
2. 数字类事实用 `official/` 和 2026 年的 `blogs/` 交叉核验后再写入，尤其是限额、手续费、机场柜台位置。
3. 行前检查页的"推荐阅读"先用 Trip.com 和北京政府的页面，每条带来源和日期。
4. 缺口：广州白云、首都机场的到达层服务页面还没有官方来源；景区实名预约（故宫等）的外国人流程还没抓。
