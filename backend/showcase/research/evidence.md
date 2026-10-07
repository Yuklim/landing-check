# Landing Check｜海外社媒需求证据与项目背景

调研与复核日期：2026-10-07。用于支持 [PRD for Trip Hackathon](PRD%20for%20Trip%20Hackathon.md) 的问题与需求章节。

## 1. 调研结论

**有自主 DIY 能力，不等于熟悉中国的数字服务。首次来华游客即使已经研究攻略、安装应用、绑定银行卡，仍会反复确认：落地能否上网、能否完成第一笔付款，以及怎样顺利坐上去酒店的车。**

本轮找到的直接需求是“确认准备是否充分”和“遇到具体障碍时知道下一步”，可以支撑 Landing Check 的行前检查、落地任务引导、截图识别与备用方案。证据支持选择这一细分场景开展产品验证；尚不足以证明它是所有外国游客的第一大痛点、已有规模化付费需求，或产品已经提高落地效率。

“落地第一小时”是产品聚焦窗口。社媒没有证明问题恰好集中在 60 分钟内，也不能保证游客一小时内完成入境、取行李并抵达酒店。行前准备纳入，是为了减少问题在落地时才暴露。

## 2. 证据怎样采集与排序

- 阅读当前 PRD、README、`backend/app.py`、`backend/rules.py`、`backend/stuck.py`、`h5/app.js`、`h5/build_h5.py`，以及 `trip/docs/` 既有报告和 `trip/data/analysis/social_findings_verified.json`、X 原始记录。
- 在公开网络补充检索 Reddit 的首次来华、支付自测、机场 Wi-Fi、凌晨机场到酒店等讨论，并打开重点原帖及评论上下文。X 原帖两次返回 403；只把现有本地采集作为历史线索，未使用项目中的登录凭证。
- **先筛选与目标人群及问题有关的证据，再按下表记录的数值降序排列。** X 的 likes 与 Reddit 的 score 分别标注；该排序仅方便浏览，不代表跨平台的需求强弱比较。
- Reddit 的“+N”是本轮搜索工具返回的页面索引票分，并非原始点赞人数，也不是本轮实时 API 读数。正文打开后通常不显示票分，因此正文可复核与票分实时核验分开处理。X 数值来自旧采集 `likes` 字段，不能把旧报告 `engagement` 的点赞、转发、回复之和写成点赞。
- 日期使用搜索结果的明确发表日期；不以页面“几小时前”等相对时间倒推出发布日期。查询日期不等于索引抓取日期。数值与正文可能来自不同快照。
- 评论使用自身票分，不借用父帖分数。同一帖的正文与评论不算多个独立样本，不加总分数或计算“游客痛点发生率”。账号是否真实旅行无法独立证实，表述统一为“用户自述”。
- 本轮是定向定性调研，并非随机抽样，也不是复核旧库的全部 1,223 条。主证据集中于英文 Reddit，不能代表所有客源市场。Instagram 旧库包含博主与推广互动，本轮未取得足以作为核心证据的新增核验结果。

检索组合包括：`site.reddit.com/r/travelchina first time China airport arrival alipay esim overwhelmed`、`Alipay test before worried`、`airport wifi SMS`、`Didi airport pickup`、具体帖子标题与 ID，以及 X 账号和原句。保留正面体验、现有解决办法与不支持产品的内容，避免只挑负面。

## 3. 入选证据：按记录热度降序

“直接”表示内容直接表达准备、求助或落地需求；“背景”表示能解释使用门槛，但不是第一小时现场案例；“历史待复核”不作为已完成在线核验的核心证据。

| ID | 热度及口径 | 发表日期 / 来源 | 原话节选与中文释义 | 能支持的主张、边界与对应功能 |
|---|---:|---|---|---|
| X01 | **2,268 likes**，旧采集 | 2026-09-23 · [X / fixer82601](https://x.com/fixer82601/status/2102740465695277467) | “without having a mental breakdown”——在微信官方预告下调侃，希望公布一个不让人崩溃的外卡绑定教程。 | **历史待复核、共鸣线索**。支持绑卡操作引导值得关注；不能证明作者是首访游客，也不能把围绕官方发布的互动都算成失败经历。本轮原帖 403；旧报告 2,307 是总互动，不是点赞。对应行前图文教程。 |
| R01 | **+594**，整帖 score 索引快照 | 2025-11-19 · [25 days in China](https://www.reddit.com/r/travelchina/comments/1p1f8db/25_days_in_china_an_absolute_horror_trip_and_what/) | “Mostly it worked for me.”——作者说支付多数时候正常，支付宝不能用时改用微信；另自述 Wi-Fi 连接问题，但 eSIM 正常。 | **背景、正反并存**。作者明确首次来华、独自旅行；支持按具体问题提供备用路径。帖子主要还谈疾病、天气、拥挤，**594 不能归因于支付或落地问题**。不是首小时案例，不用其“horror trip”标题做产品宣传。 |
| X02 | **372 likes**，旧采集 | 2026-09-24 · [X / kiriyasan_1123](https://x.com/kiriyasan_1123/status/2103260857589461418) | “中国旅行のハードルは決済・ネット・地図”——作者概括旅行门槛为支付、网络与地图，同时认为准备少量工具即可。 | **历史待复核、经验建议**。支持最小准备清单，不证明服务普遍失灵。作者首访身份未知，本轮原帖 403。对应清单与任务导航。 |
| R02 | **+257**，整帖 score 索引快照 | 2025-05-15 · [Trip report: 3 months across China](https://www.reddit.com/r/travelchina/comments/1kmx6ob/trip_report_3_months_across_china/) | “You essentially have to learn to use a whole new suite of apps”——需要重新学习一套应用；作者自述已旅行约 70 个国家，并认为掌握工具后中国旅行十分便利。 | **背景、目标能力匹配**。有旅行能力仍有本地工具学习成本；首访身份未单独确认。支持少量关键步骤和情境帮助，不支持“中国很难自由行”。对应教程与下一步引导。 |
| R03 | **+84**，整帖 score 索引快照 | 2024-11-03 · [Returned from 1.5 weeks in Shanghai](https://www.reddit.com/r/travelchina/comments/1gicqzq) | “a message entirely in Mandarin”——作者自述行前已完成验证，之后又收到全中文的微信补充验证提示。 | **历史背景**。支持看不懂状态和异常信息的真实摩擦，适配「我卡住了」。作者曾来华，并非首访；旧版行为不当作 2026 年普遍规则。本轮搜索索引可读，直接打开失败，证据强度低于已打开原帖。 |
| R04 | **+82**，整帖 score 索引快照 | 2026-10-04 · [What were things you wish you knew before your first trip to China?](https://www.reddit.com/r/travelchina/comments/1wxayfr/what_were_things_you_wish_you_knew_before_your/) | “I am trying to prepare (will get esim, alipay&wechat) - but I am (quite) a bit anxious.”——欧洲首访游客主动准备网络和支付工具，仍有焦虑。 | **直接、优先用于 PRD**。清楚知道工具名称仍需要确认准备。不是已经发生的支付失败。对应行前检查。父帖 R04 与 C02、C03 是同一个讨论串。 |
| C01 | **+67**，评论 score 索引快照；父帖 +17 不计入 | 2026-07-23 · [RoninBelt：机场 Wi-Fi 评论](https://www.reddit.com/r/travelchina/comments/1v40u86/comment/oz7e7hi/) | “but an Airport where international visitors arrive?”——抱怨国际机场 Wi-Fi 等服务的手机号门槛。 | **直接、但技术归因需纠正**。支持找不到可用登录路径的挫败感；不能据此宣称所有机场必须中国手机号。上海机场官方已提供护照认证。对应按机场给 Wi-Fi 路径、护照认证与人工服务入口。 |
| R05 | **+53**，整帖 score 索引快照 | 2025-06-19 · [Traveling to China for the first time in my life. Any tips?](https://www.reddit.com/r/travelchina/comments/1lfa5yr/traveling_to_china_for_the_first_time_in_my_life/) | “we know more or less what we wanna visit”——首访游客已经大致安排好游览内容，仍询问应用和抵达时的实用建议。 | **直接、能力匹配**。会制定行程的人仍会寻找本地数字准备信息。问题覆盖全旅程，不把整帖分数视为首小时需求支持率。对应准备清单和落地说明；本轮以搜索索引正文核验。 |
| C02 | **+46**，评论 score 索引快照 | 2026-10-04 · [Fernandodieg：不要假设装好就能用](https://www.reddit.com/r/travelchina/comments/1wxayfr/comment/pdrvdtf/) | “don’t just set them up before leaving and assume everything will work.”——建议完成绑卡、实名并尽可能检查，而非仅安装应用。 | **直接、操作建议**。支持区分“已安装”与“已准备”；属于经验建议，不能证明统一的境外测试办法可行。对应清单状态与备用方式。 |
| R06 | **+31**，整帖 score 索引快照 | 2025-08-22 · [Solo China trip prep — worried I'm missing something](https://www.reddit.com/r/travelchina/comments/1mxjqrk/solo_china_trip_prep_worried_im_missing_something/) | “Passport verified, card added but still worried it won’t work”——美国独自出行者已实名、绑卡、列出航班和 eSIM，仍担心不能付款。 | **直接、优先用于 PRD**。表现出主动 DIY 准备能力；原文说首次 solo，不据此额外断言首次来华。证明缺少就绪信心，不证明银行卡已失败。对应就绪检查和备用路径。 |
| R07 | **+18**，整帖 score 索引快照 | 2025-09-21 · [Some questions for a first time in China](https://www.reddit.com/r/travelchina/comments/1nmskx7) | “Unfortunately, my phone doesn’t support eSIMs.”——首次来华情侣同时问支付工具选择，以及北京机场能否买实体 SIM。 | **直接、个体条件差异**。工具选择不能只有“买 eSIM”一条路径。对应设备条件检查及机场联网备用办法。本轮以搜索索引正文核验。 |
| C03 | **+11**，评论 score 索引快照 | 2026-10-04 · [Front_Appointment203：先确认付款再上车](https://www.reddit.com/r/travelchina/comments/1wxayfr/comment/pdrxrnt/) | “make sure it works before you get in a taxi”——刚结束首次中国旅行的用户建议，落地后买瓶水等小额商品确认付款，再乘出租车。 | **直接、最贴近落地任务衔接**。支持支付确认与首程交通的联系。作者也报告 eSIM 很顺畅、遇到滴滴注册障碍；其网络归因只是猜测。不是所有交通方式必须先做数字支付测试。 |
| R08 | **+8**，整帖 score 索引快照 | 2026-03-12 · [First time in Shanghai for 3 nights — Survival Kit](https://www.reddit.com/r/chinatravel/comments/1rs2zsc/first_time_in_shanghai_for_3_nights_next_week/) | “a bit overwhelmed by the digital prep”——德国首访游客询问必要应用、外卡支付、eSIM 和地图。 | **直接、反复出现的需求**。需要知道最小准备集合及不同工具用途。签证与景点部分不纳入本项目。对应清单；本轮以搜索索引正文核验。 |
| R09 | **+5**，整帖 score 索引快照 | 2025-03-04 · [Is there a way to test WeChat / Alipay online before I arrive to China?](https://www.reddit.com/r/travelchina/comments/1j2ztfs/is_there_a_way_to_test_wechat_alipay_online/) | “whatever as it will give me peace of mind”——用户已为自己和家人配置工具，询问能否花 1、5 或 10 美元确认支付可用。 | **直接、强需求表达但低票分**。支持“想提前确认能付”的价值，不等于愿意购买 Landing Check，更不能证明一次交易验证覆盖所有商户。对应验证流程设计；目前代码仍是 mock。 |

### 不应为凑高赞而采用的材料

| 热度 | 来源 | 处理理由 |
|---:|---|---|
| 12,470 likes，旧采集 | [X / yubilip_](https://x.com/yubilip_/status/2099672235250438277) | 主要是语言、消费、打车方便等综合旅行建议，首小时问题关联弱，不作为高需求核心证据。 |
| 3,684 likes，旧采集 | [X / marclou](https://x.com/marclou/status/2089299092585529835) | 回访者综合游记，网络段偏远程办公，不能拿整帖热度支持机场失联。 |
| +226，整帖 score 索引快照 | [5 mistakes I made on my first China trip](https://www.reddit.com/r/travelchina/comments/1owvy8j/5_mistakes_i_made_on_my_first_china_trip/) | 虽有“机场花两小时绑卡”的吸引人叙述，但作者账号 RealChinaGuide，帖子上下文有付费指南导流和读者质疑。**不作独立游客核心证据，不用于项目背景的开场故事。**不能仅凭质疑认定虚假，也不能忽略商业属性。 |

### 机场到酒店的补充证据

[Didi from Beijing airport (PEK) at 3AM](https://www.reddit.com/r/travelchina/comments/1sd0hpe/didi_from_beijing_airport_pek_at_3am/) 中，发帖者明确问凌晨 2:30 到达后，到酒店的价格、车源以及公共交通替代选项。正文已打开；本轮没有可靠读到父帖分数，因此不填数值、不进入数值排序。2026-04-05 的回复包括预订接机、寻找 e-hailing 指示和使用应用内消息；9 月回访回复表示现场叫车顺利。支持“按落地时刻与条件给方案”，不支持“凌晨普遍打不到车”。

## 4. 对 PRD 核心主张的判断

| PRD 主张 | 本轮判断 | 建议写法 |
|---|---|---|
| 首次来华且有 DIY 能力的游客存在真实需求 | 有多条直接求助与准备帖子支撑；不是代表性抽样 | 已能规划行程，却仍不确定网络、支付和机场交通是否准备充分。 |
| 工具已经很多，但不知道下一步 | 有支持；R04、R05、R06、R08、R09 表达知道工具后仍有疑问 | 需要把工具清单转化为可操作的准备与现场步骤。 |
| 网络、支付、交通有依赖关系 | C03 提供具体衔接建议；联网影响数字工具是场景逻辑 | 这些任务在抵达阶段衔接；依赖失败时仍可能通过现金、预订接机和人工服务继续。 |
| 第一小时是问题最多、能力最低的时段 | **未被证明**；现有社媒样本不能比较全旅程各时段负担 | 第一小时是首次实际使用这些工具、适合提供情境帮助的产品切口。 |
| 所有外国游客都有同样痛点 | **不支持**；准备充分和使用顺畅的证据很多 | 共同任务是上网、支付准备与离开机场；具体失败因设备、卡片、机场和准备程度不同。 |
| 可以解决银行风控、实名认证拒绝 | **不能由现有产品解决根因** | 可以识别已覆盖场景、提供经过核验的步骤、备用方式和官方求助入口。 |
| 必须嵌入 Trip.com 才能解决 | 这是产品与渠道选择，不是社媒证明的唯一解 | 如果获得授权接入航班、机场和酒店信息，可减少用户重复输入并在合适时刻提示。 |
| AI 截图识别是用户明确要求 | **未找到足够直接证据** | 用户表达的是看不懂或不会处理；截图识别是团队提出的解决方式，需要可用性验证。 |

## 5. 产品能力与需求对应

| 用户需求 | 当前项目可演示的对应能力 | 提交材料必须区分的边界 |
|---|---|---|
| 起飞前知道还差哪些准备 | 行前清单、支付方式状态、图文教程 | 规则多数读取模拟行程状态，尚非对手机设置和账户的完整真实检测。 |
| 确认第一笔支付及备用方式 | 支付成功/失败分支、支付宝与 TenPayGo 切换 | `h5/app.js` 调用 `/mock/pay-test`，不能写成真实扣款退款已接通。支付自测愿望也不能证明跨境测试或全面支付保证成立。 |
| 联不上网时找到可行路径 | Wi-Fi 引导与联网知识条目 | 部分系统设置、自助机、服务台按钮仍为 Demo 提示；不是完整网络诊断器。无网时云端截图识别不可用，离线包尚未实现。 |
| 看不懂报错，不会描述问题 | `/stuck/classify` 接收截图/文字，匹配知识库条目 | 支持有限条目；未知情形可能给带 `unverified` 的建议。不能保证识别全部报错或解除第三方风控。 |
| 按抵达条件到酒店 | 交通规则、中文地址展示、交通方案页面 | 航班、行程和机场数据为演示数据；不等于已接入 Trip.com 正式订单或实时派车。机场指引应持续维护。 |

## 6. 官方资料交叉核验

1. [国家移民管理局：2026 年上半年数据](https://www.nia.gov.cn/n794014/n794021/c1789835/content.html)：入境外国人 2,291.4 万人次，同比增长 20.4%；其中免签入境 1,781.5 万人次，占 77.7%。**这是入境人次，含多种来华目的，并非首次自由行游客人数或潜在付费用户数。**可保留为宏观背景，不用于计算市场规模。
2. [上海机场官方设施说明](https://www.shanghaiairport.com/enpd/fuwusheshi/index_lcid_418.html) 与 [上海市政府 2024-05-06 服务介绍](https://english.shanghai.gov.cn/en-Latest-WhatsNew/20240506/98106a67e6d54bceba780d96d55768a2.html)：存在护照认证上网与入境便利服务。因此 C01 应解释为“游客需要找到适用入口”，不能解释成“没有中国手机号就必然无法联网”。

## 7. 可直接用于比赛的背景文案

首次来中国的外国自由行游客，往往已经能独立安排机票、酒店和游览路线，却仍需要学习一套陌生的数字服务：用什么方式联网，支付应用是否准备好，以及离开机场时怎样前往酒店。

这种需求在海外旅行社区中有具体表达。首次来华的欧洲游客，在准备 eSIM、支付宝和微信后仍发帖询问自己遗漏了什么；另一位独自出行者已经完成实名和绑卡，却仍担心支付无法使用。还有用户主动询问，能否在出发前花一笔小额费用确认支付可用。对他们而言，“知道需要哪些 App”与“确定落地时能完成任务”之间，仍存在一步准备和判断的距离。[首次来华提问](https://www.reddit.com/r/travelchina/comments/1wxayfr/what_were_things_you_wish_you_knew_before_your/) · [已绑卡仍担忧](https://www.reddit.com/r/travelchina/comments/1mxjqrk/solo_china_trip_prep_worried_im_missing_something/) · [支付自测需求](https://www.reddit.com/r/travelchina/comments/1j2ztfs/is_there_a_way_to_test_wechat_alipay_online/)

落地是这些准备开始接受实际检验的时刻。一位刚结束首次中国旅行的游客建议，在机场先完成一笔小额付款，再上出租车；另有旅客询问凌晨抵达后怎样选择去酒店的交通方式。这些讨论让我们选择“落地第一小时”作为切入点：把行前准备和落地后的上网、支付、交通步骤衔接起来，在用户卡住时，帮助他找到当前可执行的下一步。[落地付款建议](https://www.reddit.com/r/travelchina/comments/1wxayfr/comment/pdrxrnt/) · [凌晨到酒店的疑问](https://www.reddit.com/r/travelchina/comments/1sd0hpe/didi_from_beijing_airport_pek_at_3am/)

Landing Check 因此面向首次来华、有一定 DIY 能力的外国自由行游客，设计为 Trip.com 内的落地辅助功能：行前明确准备事项，落地后按情境提供任务引导；遇到看不懂的界面或操作障碍时，通过截图匹配经过核验的知识条目，给出处理步骤与备用路径。我们的目标是减少抵达阶段反复搜索、切换应用和猜测操作的负担，让用户更有把握地开始自己的旅行。

## 8. 评委可能追问时的回答

- **为什么不是攻略？** 社媒显示有人已经看过攻略、完成绑卡，仍不确定准备是否充分。产品方案把通用信息放到具体行程阶段，提供状态与下一步；是否比攻略更有效仍需用户任务测试。
- **既然很多人说很顺利，为什么需要你们？** 顺利体验说明既有工具有能力完成任务。我们聚焦首访者完成准备和第一次操作的过程，以及少部分异常时刻，不把每位游客都描绘成受困者。
- **高赞能证明多少人需要吗？** 不能。它是讨论热度信号；需求可信度来自明确用户情境、独立帖反复出现、原帖上下文和产品能力匹配。
- **为什么选择第一小时？** 这是范围可控、具有实际任务衔接的介入窗口，不是统计结论或到酒店时长承诺。
- **还需要验证什么？** 请目标用户分别用现有攻略和原型完成联网准备、理解支付报错、选择机场到酒店方案；记录完成率、时间、求助次数和错误判断。当前报告不包含此类实验结果。

## 9. 后续复核位置

旧 X 条目的原始记录见 `trip/data/social/x_tweets.jsonl`、`x_replies.jsonl`，按 status URL 定位；旧结论见 `trip/data/analysis/social_findings_verified.json` 的 PAY-2、INFO-1 等。它们是待复核历史材料，不继承旧文件 `verified: true` 就宣称本轮核验成功。

提交版推荐优先引用 R04、R06、R09 与 C03；C01 配合机场官方说明使用。R01、R02 用于补充上下文和反向证据。X01、X02 可留在研究附录，避免在未获得原帖复核截图时作为答辩的主要高赞证据。
