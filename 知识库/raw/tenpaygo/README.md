# TenPayGo 资料 · 索引

抓取日期 2026-10-06，共 8 篇加 4 张 App Store 官方截图。结论和需求推导在 `docs/tenpaygo/01-需求调研.md`，这里只做来源索引和可信度分级。

## 一、来源与可信度

| 文件 | 来源 | 日期 | 可信度 | 用途 |
|---|---|---|---|---|
| `official-user-service-agreement-20260611.md` | 财付通官方《TenPayGo 支付用户服务协议》英文版（gtimg.wechatpay.cn） | 2026-06-11 版 | **官方** | 运营主体、额度、手续费原则、仅限中国大陆使用、客服 95017 |
| `news-sohu-20260924.md` | 财联社经搜狐转载，发布会当天 | 2026-09-24 | 官方口径转述 | 7 大卡组织、近 60 个境外钱包、深圳通乘车码 |
| `news-tencent-launches-tenpaygo-...md` | The Paypers | 2026-09 | 行业媒体 | 定位：与支付宝直接竞争入境游 |
| `tenpaygo.md` | olachina.org，引用微信派官方发布文与使用指南 | 2026-09-24 | 第三方，引官方 | 三步上手、付款两种方式、不含小程序和转账、退款走商户、支持邮箱 |
| `tenpaygo-payment-guide.md` | tripchina.me 评测，持续更新 | 2026-10-05 | 第三方 | 公测后现状：iOS 与 Android 均已上架，绑卡与付款仍可能失败，不要只靠它 |
| `tenpaygo-why-wechat-built-...md` | memeburn | 2026-09-28 | 第三方 | 与微信支付、支付宝的对比；手续费官方未公布 |
| `blog-tenpaygo-tencent-app-for-foreigners.md` | payinchinaguide | 2026-06 内测期 | 第三方，**已部分过期** | 200 元以下免手续费、以上 3% 的说法；内测期邮箱域名限制 |
| `guide-tenpaygo-for-china-travel-...md` | jiangmitravel | 2026-06 | 第三方 | 风险提示：首次小额试付、准备备用支付 |
| `../../samples/tenpaygo_appstore/*.png` | App Store 官方截图（Tencent） | 2026-09 | 官方图，但非我方素材 | 界面特征（识别用）、教程占位配图 |
| `../reddit/README.md` 中 `1wp1prm`、`1ukolqw`、`1v3vuim`、`1vbcxh5` | Reddit 真实用户 | 2026-07 至 09 | 用户反馈 | 绑卡被银行拒、扫小程序码能否用、Apple Pay、手续费争议 |

抓取失败：tenpaygo.com 官网、新华社英文稿、21 世纪经济报道、香港商报、beyond-shenzhen、cntravelplus（超时或 403）；微信派官方文章需要验证码。官网和微信派原文的结论通过 olachina 的引用间接取得，标为"第三方，引官方"。

## 二、重新抓取

```bash
python3 知识库/tools/fetch_articles.py tenpaygo
```

URL 列表在 `fetch_articles.py` 的 `SOURCES['tenpaygo']`。抓下来的协议文件名是 URL 转义后的长串，入库时手工改成了 `official-user-service-agreement-20260611.md`。
