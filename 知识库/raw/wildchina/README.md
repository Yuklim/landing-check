# WildChina 实操指南 · 抓取索引

抓取日期：2026-10-02 · 来源站：https://wildchina.com · 抓取脚本：`知识库/tools/fetch_wildchina.py`

- `*.md`：博客文章，正文完整（标题、步骤、FAQ、截图链接），到"Related Tours"为止截断。
- `sections/*.md`：行前指南（Pre-departure Guide）的分节，网页上是动态加载的，通过站点的 WordPress 接口取到。
- `index.json`：每篇的标题、链接、发布和更新日期、字数、小标题。

每篇开头有 front matter：`source` 是原文链接，`modified` 是原站最后更新日期。写知识库条目时把这两项抄进 `source` 和 `verified_at`。

## 一、按我们的六类卡点和三步流程分类

| 我们的场景 | 可直接取材的篇目 | 可提炼的条目 |
|---|---|---|
| 支付宝绑卡 / 支付失败 | `guide-to-using-alipay-2026.md`（2026-05-29） | 安装、注册、实名、绑卡两种方式（国际卡直绑 / TourCard 预付）、付款方式（扫码与被扫）、限制（无个人转账、部分交易要 CVC）、FAQ |
| 微信支付开通 | `wechat-pay-in-2026.md`（2026-06-01） | 注册后的安全验证三种方式（推荐直接开通支付）、支持卡组织、验证扣 0.05 美元、6 位支付密码、限制（无中国手机号不能用小程序、不能提现到外卡） |
| 滴滴叫车 | `a-guide-to-using-didi-in-china-2025.md`（2025-11-10） | 别装错 Didi Rider、支付宝内小程序免中国手机号、车型含义、多目的地、内置翻译、24 小时英文客服入口 Account → Help |
| 上网（eSIM / SIM / 漫游） | `sections/internet.md`（2026-09-24） | eSIM 推荐并说明走国际网关、支付宝内搜 eSIM 可买、浦东机场 Roamingman 和中国电信柜台位置与套餐、SIM 需护照实名、漫游可访问国际服务 |
| 到酒店 / 交通 | `chinas-trains-a-comprehensive-guide.md`、`sections/transport-in-china.md` | 车票提前 15 天放、不能选座、商务和一等座可能前 1 到 2 天才放、车站英文广播、行李带轮、车上 Wi-Fi 慢、各座位插座位置、安检限制液体 |
| 机场落地 | `chinese-airlines.md`（At the airport in China 一节）、`a-guide-to-china-transit-visas.md`（What to expect on arrival） | 跟"Foreigners"指示牌走、可能采指纹和拍照、入境卡、绿色 / 红色海关通道、过境免签在柜台申请时会被问的五个问题、护照贴纸标注停留天数 |
| 现金与刷卡 | `sections/currency-in-china.md` | ATM 接受外卡、大城市中大型商户收信用卡小店不收、离境前换回人民币、每天约 100 美元现金建议 |
| 小费 | `sections/tipping-in-china.md`、`etiquette-in-china.md` | 出租车、餐馆、咖啡不给小费；二维码支付没有小费入口；向导司机例外 |
| 无障碍 / 带老人 | `accessible-travel-in-china.md`（2024-12-02） | 大陆几乎没有升降板无障碍车、高铁站有坡道电梯、五星酒店有无障碍房、高德有无障碍导航和无障碍厕所信息 |
| 饮食（菜单场景） | `halal-food-in-china.md`、`vegetarian-and-vegan-dining-in-china.md` | 清真餐厅识别方法、素食表达方式，可作为"菜单和扫码点单"条目的补充 |
| 景区预约 | `how-to-visit-the-great-wall-of-china.md` | 长城各段的交通和可达性，预约细节不足，需另找官方来源 |
| 行前检查 | `planning-a-first-trip-to-china.md`、`how-to-visit-china-in-2026.md`、`sections/visas.md`、`sections/china-pre-trip-checklist.md`、`sections/accommodation-in-china.md` | 签证与免签、申请时间、国定假日避开、酒店入住需护照原件、行前清单 |
| 背景 / 不直接入库 | `faq.md`、`solo-travel-in-china.md`、`lgbtq-travel-in-china.md`、`high-tech-travel-in-china.md`、`whats-trending-in-travel-in-china.md`、`trip-to-china-city-guide.md`、`fastest-way-to-enter-china-with-wildchina.md` | 了解外国游客的担忧和提问方式，用来设计"我卡住了"的场景分类和问法 |

## 二、写知识库条目时要注意的

1. **区分事实和推广。** 文中大量"WildChina 可以帮你"、Nomad 优惠码、VIP 接机服务，入库时全部去掉，只留对普通散客可执行的步骤。
2. **有日期的事实要重新核验。** 价格、手续费、限额、机场柜台位置都会变。已知需核验的：TourCard 5% 手续费和 180 天 / 1 万元上限；微信验证扣 0.05 美元；浦东 Roamingman 和中国电信柜台位置；火车票提前 15 天放票。
3. **发现的矛盾点。** 滴滴指南说支付宝小程序版不需要中国手机号，微信指南说没有中国手机号可能用不了小程序，两者都对，入库时写成"用支付宝里的滴滴，不要用微信里的"。
4. **VPN 相关内容不入库。** 文中多处建议入境前装 VPN，我们的产品不出现 VPN 表述，统一改为"用 eSIM 或漫游访问国际服务"。
5. **截图链接可以用。** 每篇里的 `wp-content/uploads` 图片是真实界面截图，整理步骤时可对照，但不能直接放进我们的产品。

## 三、篇目清单

| 文件 | 标题 | 原站更新 | 字数 |
|---|---|---|---|
| guide-to-using-alipay-2026.md | A Guide to Using Alipay in 2026 | 2026-05-29 | 13.5k |
| wechat-pay-in-2026.md | How to Set Up WeChat Pay in 2026 | 2026-06-01 | 11.0k |
| a-guide-to-using-didi-in-china-2025.md | A Guide to Using Didi in China 2025 | 2025-11-10 | 6.4k |
| planning-a-first-trip-to-china.md | Planning a First Trip to China | 2026-07-03 | 11.9k |
| how-to-visit-china-in-2026.md | How to Visit China in 2026 | 2026-06-01 | 7.8k |
| a-guide-to-china-transit-visas.md | A Guide to China Transit Visas | 2026-06-01 | 12.1k |
| chinas-trains-a-comprehensive-guide.md | China's Trains: A Comprehensive Guide | 2025-09-04 | 15.3k |
| chinese-airlines.md | Chinese Airlines: Flying to and Within China | 2025-05-07 | 13.2k |
| accessible-travel-in-china.md | Accessible Travel in China | 2024-12-02 | 6.3k |
| etiquette-in-china.md | Etiquette in China | 2026-06-29 | 5.7k |
| halal-food-in-china.md | Halal food in China | 2025-09-05 | 8.4k |
| vegetarian-and-vegan-dining-in-china.md | Vegetarian and Vegan Dining in China | 2025-08-26 | 8.6k |
| how-to-visit-the-great-wall-of-china.md | How to Visit the Great Wall in 2026 | 2026-04-29 | 4.7k |
| faq.md | WildChina FAQ | 2025-10-28 | 37.6k |
| solo-travel-in-china.md | A Guide to Solo Travel in China | 2025-09-30 | 6.2k |
| lgbtq-travel-in-china.md | LGBTQ+ Travel in China | 2025-08-26 | 4.3k |
| high-tech-travel-in-china.md | High-Tech Travel in China | 2025-09-30 | 7.0k |
| whats-trending-in-travel-in-china.md | What's Trending in Travel in China | 2026-03-16 | 7.2k |
| trip-to-china-city-guide.md | City Guide hub | 2026-06-29 | 19.0k |
| fastest-way-to-enter-china-with-wildchina.md | VIP Airport Arrival Service | 2024-09-26 | 4.2k |
| trip-to-china-pre-departure-guide.md | Pre-departure Guide hub（分节见 sections/） | 2025-05-29 | 20.1k |
| sections/internet.md | Staying Connected in China | 2026-09-24 | 3.3k |
| sections/currency-in-china.md | Currency in China | 2026-09-24 | 3.5k |
| sections/transport-in-china.md | Transport in China | 2026-09-24 | 6.8k |
| sections/tipping-in-china.md | Tipping in China | 2025-07-31 | 5.2k |
| sections/accommodation-in-china.md | Accommodation in China | 2026-09-24 | 1.7k |
| sections/visas.md | Tourist Visas for China Travel | 2026-09-24 | 0.9k |
| sections/china-pre-trip-checklist.md | China Pre-Trip Checklist | 2026-09-24 | 0.3k |

行前指南里"What to Pack、Culture、Language、Weather、Health、Electricity、Time Zone"等分节在站点接口里是空的，无法抓取。

## 四、下一批来源（按优先级）

1. 支付宝、微信支付、滴滴的官方国际用户帮助页，用来核验上面的步骤和数字。
2. Trip.com 自己的指南：How to Use Alipay、China eSIM、Best China Travel Apps，与产品同源，可直接引用。
3. 浦东、首都、大兴、白云四个机场官网的 Wi-Fi 和到达层服务页面，补机场专属条目。
4. 12306 和主要景区（故宫、长城各段）的外国人预约说明。
5. readyforchina.com 的 1 元测试支付流程，作为支付验证条目的对照。
