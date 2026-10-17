# 携程营销 MCP 接入说明 · 2026-10-16

演示版原来所有携程数据都是 `backend/mock/*.json` 里写死的。这次用携程营销 MCP（`trip-mkt-mcp-function`，文档见仓库根目录 `MCP使用文档.pdf`）把能对上的 5 块换成了真实数据：航班时刻、酒店（司机地址卡）、景点门票规则、租车报价、城际高铁。行程订单本身（Alex 订了哪班飞机、哪家酒店、哪张故宫票）、¥1 支付验证、落地事件仍是模拟，因为 MCP 只能查商品，不能查用户订单。

## 接了什么

| 场景 | 页面位置 | MCP 工具和参数 | 用到的字段 | 前后对比 |
|---|---|---|---|---|
| 航班时刻 | 行前检查顶部、锁屏通知、My Trips、接机页、第三步交通的落地时间 | `query_flight`：`departCityCode=SFO` `arriveCityCode=SHA` `airLine=UA` `locale=en-US` | `flightNo` `dtime` `atime` `aport.terminal` `duration` | UA 857 由模拟的 14:10 → 07:40 改为真实的 13:00 → 次日 17:25，浦东 T2 |
| 酒店 / 给司机看的地址卡 | 司机地址卡、接机提示、交通推荐里的公里数 | `query_hotel`：`cityName=上海` `hotelName=璞丽酒店` 加入离日期 | `name` `address` + `locationName` `zoneName` `contactTel` `coordinate` | 地址卡显示携程的「上海璞丽 / 静安区常德路1号 / 靠近静安寺、南京西路 / 021 3203 9999」，机场到酒店距离由 18 km 改为按坐标算的直线 35 km |
| 景点门票提醒 | 行前检查「Palace Museum reservation」一行，点开是规则层 | `query_ticket`：`scenicSpotName=故宫博物院` `cityName=北京` | `openTimeInfo.unFormatOpenTime` `latestEntryTime` 各票种的 `name` `price` `descDetail` | 新增：访问当天开放时间、最晚入园 16:00、周一闭馆；10 个票种里 6 个可凭护照，4 个只认身份证；英文讲解票 ¥268 起。访问日落在闭馆日时这一行变成待办 |
| 租车 | 行前检查「Car rental」一行、租车页搜索 | `car_rental`：`pickUpCity=上海`，取车时间为真实落地后一小时整点，还车为三天后 10:00 | `vehicleGroupName` `dailyPrice` `seat` `productName` `h5ListUrl` | 设计稿里写的「¥180/day」改为真实的「经济型约 ¥99/天 · 上海 567 辆」，租车页搜索弹出 6 个车型组的日价 |
| 城际高铁（下一程） | 行前检查新增「Shanghai → Beijing」一行和班次层 | `query_train`：`fromCity=上海` `toCity=北京` `departDate=退房日` `trainTypeMode=OnlyHighSpeed` | `TrainNo` 起止时间、站名、`DurationMinutes` `Seats` `ControlDay` `SaleTime` | 新增：行程里故宫票在北京、酒店在上海、中间没订交通，给出退房日 09:00–15:00 最快 3 班和二等座价格，可点「已订」消掉提醒 |

## 数据怎么来

```
页面请求 /mock/trip、/mock/flight、/rules/preflight、/rules/transport
        │
        ▼
live.enrich(行程)  按 航班 → 酒店 → 门票 → 租车 → 火车 的顺序合并（租车取车时间依赖真实落地时间）
        │ 每块：
        ├─ 内存缓存 30 分钟内 ─────────────► source=live
        ├─ 过期或没有：先返回旧值或快照，后台刷新，接口不等 MCP
        ├─ 快照 backend/mock/live_snapshot.json ► source=snapshot（离线、Render 休眠唤醒、没配 Token 时）
        └─ 都没有 ─────────────────────────► 继续用 mock/*.json
```

- 每块数据的来源写在行程的 `live` 字段里。H5 左下角会提示「真实数据 · 携程 MCP 实时 5/5」或「携程快照」，每个结果层底部写着「Live from Trip.com · 21:17」或「Trip.com data · saved 10/16」。
- 服务启动时，有 Token 就在后台预热一遍，大约 10 到 20 秒。
- 同一块数据并发刷新时只发一次请求。`tripmcp.py` 里另有全局 1 秒请求间隔，避免触发频控。
- 演示前可以在右上角菜单点「📡 刷新真实数据（携程 MCP）」。
- 快照里的日期可能和行程对不上。航班只取时刻和跨天数，日期以行程为准；门票的开放时间每次按访问日重新算。
- 演示行程原来的日期（10-11 出发）已过，查不到未来的价格和班次。`mock.py` 会在出发日已过时把行程整周往后挪：星期几不变，故宫周一闭馆这类规则仍然成立。今天（10-16）挪成 10-18 出发、10-19 落地、10-20 去北京、10-21 进故宫。设 `LC_DEMO_SHIFT=0` 关闭。

## 真实数据纠正的模拟数据

| 项 | 原来的模拟数据 | 真实数据 | 影响 |
|---|---|---|---|
| UA 857 时刻 | SFO 14:10 → PVG 07:40 | SFO 13:00 → PVG 17:25（次日） | 落地在晚高峰。设计稿、演示视频里状态栏的 07:52 与它对不上，要么换一班早到的航班，要么在讲解里说明 |
| 机场到酒店距离 | 18 km | 按坐标算直线 35 km | 交通推荐和接机提示里的公里数变了。直线距离比实际车程短，界面只写「35 km」 |
| 酒店中文名、地址 | 上海璞丽酒店 · 静安区常德路 1 号 · 延安中路口，靠近静安寺 | 上海璞丽 · 静安区常德路1号 · 靠近静安寺、南京西路 | 地址卡用携程的名字。「延安中路口」是我们手写的，携程数据里没有 |
| 租车价格 | ¥180/day（设计稿） | 经济型中位 ¥99/天；最低有 ¥1、¥5 的营销价 | 界面用中位数，营销价单独标「Promo from ¥5/day on a few cars」 |
| 故宫门票 | 「bring passport」 | 10 个票种里 4 个入园只认身份证 | 外国人买错票会进不去，见新需求文档 N1 |

## 限制

- **租车取车点固定在虹桥机场。** `car_rental` 的参数里没有机场，试过 `pickUpAirport`、`pickUpLocation` 也没用。浦东落地的用户在结果层会看到「This search picks up at Hongqiao Airport (SHA); switch to Pudong (PVG) when you book」。需要找服务方加机场参数。
- **`query_flight` 是机票搜索，不是航班动态。** 拿不到延误、实际落地时间、行李转盘，「已落地」仍然靠演示开关触发。
- **酒店、门票、火车、租车只返回中文。** 这几个工具没有 `locale` 参数。车型组、站名、城市的英文是我们自己维护的对照表（`live.py` 顶部）。餐厅、榜单、航班支持 `locale=en-US`。
- **大部分链接是携程国内站** `m.ctrip.com`（航班、餐厅、榜单是 trip.com）。结果层如实标成「View listing on Ctrip」，不冒充 Trip.com。
- **入园凭证要从文本里解析。** 门票能不能凭护照入园，只能从 `descDetail` 的「凭「身份证」直接验证使用」里取，规则见 `live.classify_product`。
- **火车余票 `TicketLeft=99`** 我们理解为「充足」，界面写「plenty of seats」，这是推测，服务方没有说明。
- **没有接送机和 eSIM 工具**，行前检查里这两项仍是模拟。
- **频控是每个 Token 每分钟 10 次。** 2026-10-16 实测：固定 60 秒窗口，查询无结果的调用也算次数，被拒的不算；被拒后要等到下一个窗口才恢复。演示行程一次完整刷新是 6 次调用（航班、酒店、故宫门票、租车、火车、笔记），一分钟内连刷两次就会碰到频控。采集脚本和后端共用这个 Token，采集时开着后端刷新会互相挤占。
- **`query_content` 不能翻页。** `size` 最大 50，传 51 以上直接返回「查询无结果」。只传 `city` 或只传 `keyword` 也是无结果，必须按工具说明的组合传：`query`，或 `city`/`region` 加 `keyword`/`scenarios`。笔记全量要靠多组参数扫，采集脚本见 `demand-research/tools/collect_ctrip_notes.py`。
- **笔记正文里有 U+2028 字符。** 解析 SSE 时只能按 `\n` 切行，用 `splitlines()` 会把 JSON 切断（`tripmcp.call` 已修，有测试）。
- **Token 处理。** Token 写在 `backend/.env`（已被 gitignore），只有后端读，不进前端，也不进快照；`/live/status` 只返回「有没有 Token」。Render 上要在环境变量里加 `TRIP_MCP_TOKEN`；不加也能跑，用仓库里的快照。
- **不要把 `MCP使用文档.pdf` 提交进公开仓库**，文件里带有提供方的个人水印。

## 怎么跑

```powershell
# backend/.env 里写 TRIP_MCP_TOKEN=...，或者设进程环境变量
python -m uvicorn app:app --app-dir backend --host 127.0.0.1 --port 8000
# 看每块数据的来源
curl http://127.0.0.1:8000/live/status
# 强制同步刷新一块
curl "http://127.0.0.1:8000/live/train?refresh=true"
# 更新仓库里的快照（演示前跑一次，再提交 live_snapshot.json）
python backend/tools/refresh_live_snapshot.py
```

| 环境变量 | 默认 | 作用 |
|---|---|---|
| `TRIP_MCP_TOKEN` | 无 | MCP Bearer Token；没有时只用快照 |
| `LC_LIVE` | `on` | `off` 关闭整个真实数据层，回到纯模拟 |
| `LC_LIVE_TTL` | `1800` | 缓存秒数 |
| `LC_DEMO_SHIFT` | `auto` | 演示行程过期时整周后移；`0` 关闭 |
| `TRIP_MCP_MIN_INTERVAL` | `1.0` | 两次 MCP 请求的最小间隔（秒） |

## 测试

`python -m pytest -q backend/tests`：114 个通过。设 `E2E=1` 时 137 个通过，跳过 1 个（真实模型测试需要 DeepSeek 密钥）。

- `test_live.py`（32 个）用 `tests/fixtures/mcp/` 里存下的真实响应，不联网。覆盖：
  - 5 个归一化函数；
  - 故宫开放时间的旺季、淡季、跨年和周一闭馆；
  - 「只认身份证」判断；
  - 缓存 → 快照 → 空的兜底顺序；
  - 并发只调一次 MCP；
  - 行前检查和交通规则的输出；
  - 接口不泄露 Token；
  - 日期平移不改星期几。
- `test_e2e_live.py`（4 个）在 Chrome 里点过门票规则层、火车班次层（含「已订」消掉提醒）、司机地址卡、租车结果。
- 原有用例默认 `LC_LIVE=off`、`LC_DEMO_SHIFT=0`，仍按模拟数据断言，结果不变。

## 改动的文件

- 新增：
  - `backend/tripmcp.py`：MCP 客户端；
  - `backend/live.py`：归一化、缓存、快照、合并；
  - `backend/mock/live_snapshot.json`：真实数据快照；
  - `backend/tools/refresh_live_snapshot.py`；
  - `backend/tests/test_live.py`、`backend/tests/test_e2e_live.py`、`backend/tests/fixtures/mcp/`。
- 修改：
  - `backend/app.py`：接口合并真实数据，新增 `/live/*`；
  - `backend/rules.py`：租车、门票、下一程三行；
  - `backend/mock.py`：日期平移；
  - `backend/mock/trip.json`：补中文城市名、故宫中文名、退房日；
  - `h5/app.js`：结果层、司机地址卡、租车页、下一程一行、菜单刷新；
  - `backend/tests/conftest.py`；
  - `backend/.env.example`；
  - `README.md`。
- 设计稿 `appearance.pen` 和生成的 `h5/index.html` 没有改动，新界面都是运行时注入。
