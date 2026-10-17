# The First Stamp · 上海城市纪念票根

本地功能版本，2026-10-16。扩展现有 H5 的分享页，支持动态 1080 × 1350 PNG、系统分享、上海城市图鉴和可点击的 Community 演示。没有接入官方 Trip.com 发帖、账号或跨设备同步。

界面沿用原 H5 的蓝白配色、无衬线字体、白色导航和表单；复古纸张、深绿邮戳与城市插画集中在纪念卡及图片内容中。2026-10-16 本次 UI 调整验证：分享与离线资源相关 21 项检查通过，导出的 1080 × 1350 纪念卡与调整前逐字节一致。

## 运行与体验

无需后端。在仓库根目录运行：

```sh
python3 h5/build_offline.py
python3 -m http.server 8765 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8765/h5/index.html#share>。社区为 `#community`，图鉴为 `#city-passport`，发布编辑器为 `#community-compose`，帖子详情为 `#community-post`。也兼容后端 `/app/index.html` 和 GitHub Pages `/landing-check/h5/` 子路径。

演示路径：

1. 进入分享页，展开 **Make it yours**，填写昵称和抵达日期；昵称、日期默认不公开。
2. 展开 **Ready to explore?**，由用户确认已抵达、可联网、可支付以及已有到酒店的交通安排。确认后点亮上海并加入图鉴。只打开页面不会解锁，未来日期不能确认抵达。
3. 点击 **Save image** 导出真实 PNG。手机浏览器可能提供下载或图片查看，页面同时提供可长按保存的图片。
4. 点击 **Share** 生成图片，再点击 **Open sharing options**，在支持文件分享的浏览器打开系统分享。分享目标由设备决定；不支持时保存图片、复制文案后自行发布。不把调起分享框视为社交平台发布成功。
5. 点击 **Share a story in Community**，编辑文案，确认公开内容后保存本机演示帖子。可打开详情、收藏、查看图鉴和删除。所有帖子明确区分示例与本机演示，任何操作都不会发到官方社区。
6. 从任一原页面底部进入 **Community**。可以筛选 First Stamp、Travel Stories、Local Tips，并打开官方 Trip Moments 外链（需要联网）。

离线演示：在离线包首页保存更新后的公共包，再断网关闭、重新打开 `#share` 或 `#community-compose`；卡片生成、图片导出、收藏、图鉴和草稿仍可用。恢复网络不刷新或清除编辑内容。未提前保存时不承诺离线可用。

## 数据与隐私

- `h5/data/first-stamp.json` 集中配置上海城市信息、模板、固定公开二维码目标、开场文案和三篇明确标为示例的帖子。只有上海可解锁；城市收藏编号 `001` 与个人印章序号 `01` 分开记录。
- `h5/stamp-renderer.js` 使用固定尺寸 Canvas，预览、PNG 和本机帖子共用渲染器。动态文字与插画分开绘制，字体在本地加载完成后导出。图片下载失败时明确提示，不把空白图当作成功。
- 公共卡片从允许字段生成，包含城市、用户明确公开的昵称/日期和用户确认的纪念状态。不会从订单中提取酒店、联系方式、实时位置、支付数据。预览不写 UNLOCKED。用户编辑的自由文本需要在提交前自行审核。
- 卡片与文案默认匿名且隐藏抵达日期；编辑隐私设置会使已准备好的分享文件失效。生成期间改变公开字段会中止旧输出，避免分享旧姓名。之前已导出的图片及已保存帖子保留当时的公开字段，需要用户自行删除。
- QR 指向固定公共入口 `https://yuklim.github.io/landing-check/h5/#community`，不包含个人信息、订单参数或后端 API 地址。
- 本机私有数据保存在现有 IndexedDB 的 `first-stamp` 键，包含草稿、用户确认、城市收藏、本机帖子和收藏。不会写入公共缓存或上传 API。
- 图鉴中的清除仅移除分享模块数据，保留酒店/联系人；离线包中的 **Clear my personal data** 一并清除全部个人数据，并取消尚未执行的草稿写入、撤销导出图片 URL、移除隐藏卡片。公共指南和插画保留。

## Community 接入边界

当前为本机演示：公共示例 + 用户自己的本机帖子，没有共享数据库或登录态。页面、按钮和反馈均标明不能跨浏览器访问，也未发布到 Trip.com。

正式官方发布需后续确认合作接入方式、授权范围、图片上传、内容审核、发布接口及结果回执；外部网页跳转不代表接通了发帖接口。届时可在 `stamp.js` 的发布提交处接入单独适配层，继续使用经过筛选的公开卡片快照。不得在没有正式回执时显示“已发布”。

## 构建与验证

`index.html` 的旧分享卡已替换成加载占位，运行时由 `stamp.js` 接管；`build_h5.py` 同步保留加载顺序和路由，避免从设计稿重建时覆盖功能。图像、字体、模板和新增脚本样式均加入现有完整性清单，更新失败沿用原离线包回退机制。每次修改资源后重新运行 `python3 h5/build_offline.py`。

```sh
E2E=1 E2E_CHANNEL=chrome python -m pytest -q backend/tests/test_stamp_e2e.py
E2E=1 E2E_CHANNEL=chrome python -m pytest -q backend/tests
```

测试覆盖直接路由、原底部 Community 入口、真实 PNG 大小与尺寸、公开字段筛选、显式解锁、草稿/收藏/本机帖子持久化、删除、离线关闭重开和图片导出、网络恢复、求助返回、清除数据、存储失败、系统分享取消/不支持、剪贴板失败、生成期间修改隐私，以及 320/393px 移动布局。使用本机 Chrome 的移动视口；iPhone Safari、Android Chrome 真机和真实社交平台发布尚需实测。

2026-10-16 本地完整回归：**149 项通过、1 项真实模型测试按原配置跳过**，其中新增分享功能 **18 项浏览器检查通过**。JavaScript 语法、Python 构建脚本编译和 Git whitespace 检查通过。保留原依赖的一条 Starlette/httpx 弃用提示，不影响测试结果。本地公共包包含 39 个校验资源，约 7.6 MiB。

演示截图：[分享页](../exports/first-stamp-page.png)、[Community](../exports/first-stamp-community.png)、[城市图鉴](../exports/first-stamp-atlas.png)、[完整导出卡](../exports/first-stamp-shanghai.png)。截图使用虚构演示旅客 Alex 和示例日期 2026-10-12，不代表真实行程。

## 视觉素材与生成记录

- 原创城市图：`h5/img/stamp/shanghai-dusk.png`，由内置 **image_gen** 工具生成并复制到项目内；H5 和离线包用缩到 1200 宽的同名 JPEG（约 0.4 MB），PNG 原图只给 Pen 设计稿用。插画用于纪念卡，不是实景照片或导航图。
- 衬线字体：Cormorant Garamond，来自 [Google Fonts 源仓库](https://github.com/google/fonts/tree/main/ofl/cormorantgaramond)，以 SIL Open Font License 随包保存，许可证位于 `h5/fonts/OFL-CormorantGaramond.txt`。
- QR：`h5/img/stamp/discover-qr.png`，固定公共入口，由本地工具生成；运行时无需二维码服务或新依赖。

实际图像生成 prompt（固定图像不含任何个人数据或动态文字）：

> Use case: stylized-concept. Asset type: original landscape city illustration for an elegant digital travel ticket in a mobile web app, Landing Check. Create ONLY the illustration, no ticket, no typography, no labels, no lettering, no logo, no watermark. Primary request: a collectible vintage Shanghai travel postcard image, romantic editorial travel magazine mixed with fine art screen print and soft painterly gouache. Wide landscape composition, approximately 3:2. Show the historic Bund buildings in foreground on the left edge, Huangpu River across the lower third reflecting soft apricot sunset, and recognizable modern Shanghai skyline across the river on the right including Oriental Pearl Tower, Shanghai Tower and the trapezoid-topped Shanghai World Financial Center, natural geographic sense rather than a literal map. Quiet expansive dusk sky, small ferry on river, architectural details restrained, no people as subjects. Warm cream paper undertones, deep forest green silhouettes, caramel brown and soft sunset orange; subtle vintage paper grain and faded ink texture. Romantic, gentle, sophisticated, welcoming sense of a new journey thousands of miles from home. Architectural forms legible, distinctive Oriental Pearl spheres; not cartoonish, no tourist advertising, no glossy 3D, no neon. Croppable horizontal scene with generous sky. This image will sit in the central panel of a cream-and-forest-green travel souvenir; all text is composed separately in code.
