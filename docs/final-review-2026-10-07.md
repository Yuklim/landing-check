# Landing Check 最终演示版检查 · 2026-10-07

TenPayGo [PR #1](https://github.com/Yuklim/landing-check/pull/1) 已合并到 `main`，合并提交为 `2f65e5f3196f269a1db7721af5f579e69b8b970d`。本轮在合并后的版本上检查后端规则、H5 交互、展示页、知识库和本地资源，并修复检查中复现的问题。

## 本轮修复

- 支付验证防止重复点击发送多个请求；后端重复或并发验证同一种方式时复用成功结果，不重复写交易和时间线。
- 两种支付方式在同一秒验证成功时，保留实际先验证的方式作为主要方式。
- 支付请求超过 15 秒时显示连接失败并允许重试，避免一直等待。
- 浏览器返回、前进与可见页面同步，切换页面时关闭支付方式选择层。
- 上传新截图时清除上一张的步骤、教程入口和备用建议；晚到的旧识别响应不能覆盖新结果，替换截图时释放旧预览资源。
- 候选指南加载失败时保留选择并提示重试，避免未处理的异常。
- 展示页、录屏说明与合并后的 TenPayGo 版本保持一致；保留已确认的简洁来源弹窗。
- README 改用当前 Windows 项目可直接执行的启动与测试命令，并明确演示数据边界。

## 验证结果

| 检查 | 结果 |
|---|---|
| 自动化回归 | 101 通过：82 个后端测试、19 个 Chrome H5 端到端测试；1 个真实模型调用测试跳过 |
| 知识库校验 | 5 个场景、41 条记录通过，10 篇图文教程导出正常 |
| 展示页浏览器检查 | 七个章节、14 条来源记录、来源弹窗、分类切换、中英切换、键盘操作、视频与字幕均通过 |
| 展示页适配 | 320、390、768、1280 像素宽度及减少动态效果设置通过，无页面异常或资源请求错误 |
| H5 页面适配 | 18 个设计页面及运行时教程页，在 320×568、390×844、430×932、1280×900 下共 76 次页面检查通过 |
| 静态资源 | 页面及教程引用的 43 个本地资源全部存在 |
| 代码检查 | H5 与展示页 JavaScript 语法检查、Git 差异空白检查通过 |

真实模型测试未使用 API 密钥，因此本轮不宣称重新验证了模型识别准确率。TenPayGo 的独立识别准确率评测仍待补充。测试环境有一条 Starlette/httpx 弃用提示，不影响本轮通过结果。

## 复查命令

在仓库根目录使用 PowerShell；依赖已安装且本机有 Chrome：

```powershell
$env:E2E = '1'
$env:E2E_CHANNEL = 'chrome'
python -m pytest -q backend/tests
python 知识库/tools/validate_entries.py
node --check h5/app.js
node --check backend/showcase/app.js
```

启动本地服务后检查展示页：

```powershell
python -m uvicorn app:app --app-dir backend --host 127.0.0.1 --port 8000
# 另开终端
python backend/tools/check_showcase.py --url http://127.0.0.1:8000/showcase/
```

## 演示入口与范围

- [产品展示页](https://yuklim.github.io/landing-check/)
- [带后端的 H5](https://yuklim.github.io/landing-check/h5/?api=https://landing-check.onrender.com)
- [后端健康状态](https://landing-check.onrender.com/health)：部署后 `commit` 应与发布提交前七位一致，场景应包含 `tenpaygo`。

这是面向评委的最终演示版。支付扣款、航班和行程仍为模拟数据；正式 App 集成、自动推送、离线包和多语言预翻译尚未实现。Render 免费实例休眠后首次访问可能需要等待唤醒，路演前应先打开带后端的 H5。
