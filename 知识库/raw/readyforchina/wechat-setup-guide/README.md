---
title: "WeChat Pay Setup guide (iOS / Android)"
source: https://www.readyforchina.com/en/wechat
fetched: 2026-10-03
site: readyforchina
---

# readyforchina.com 微信支付设置教程（iOS / Android）

来源：<https://www.readyforchina.com/en/wechat> 页面 "Setup guide" 区块。页面用 Tab 切换 iOS / Android，服务端 HTML 只渲染 iOS，Android 文案取自页面内嵌的 i18n JSON（该页内嵌了支付宝和微信两套翻译，取的是含 WeChat 的那套），动图路径取自前端 JS 包。

**动图缺失。** JS 包里 iOS、Android 各五步都配了专属动图路径（见文末表），但源站对这十个文件全部返回 404，Next 图片代理返回 400 INVALID_IMAGE_OPTIMIZE_REQUEST，Wayback Machine 也没有存档。网站上微信教程的图本身就是坏的，所以这份只有文字。

中文为翻译，仅供内部参考；英文是原文。

## iOS

### Step 1. Download from App Store

Install the official WeChat app from the iOS App Store - ensure it's by Tencent.

> 从 App Store 下载：在 iOS App Store 安装官方 WeChat 应用，确认开发者是 Tencent。

### Step 2. Register Account

Launch WeChat, select 'Sign Up' and use your international mobile number. A friend with WeChat may need to verify you.

> 注册账号：打开 WeChat 选 'Sign Up'，用你的国际手机号注册。可能需要一位有微信的朋友帮你做辅助验证。

### Step 3. Complete Verification

Navigate to 'Me' → 'Services' → 'Wallet'. Follow the prompts to upload passport photos and complete facial recognition.

> 完成验证：进入 'Me' → 'Services' → 'Wallet'，按提示上传护照照片并做人脸识别。

### Step 4. Link Your Card

After verification, go to 'Wallet' → 'Cards' → '+' to add your international credit or debit card.

> 绑定银行卡：验证通过后，进入 'Wallet' → 'Cards' → '+'，添加你的国际信用卡或借记卡。

### Step 5. Configure Security

Set up a payment password and enable Touch ID or Face ID for secure and fast transactions.

> 配置安全设置：设置支付密码，并开启 Touch ID 或 Face ID，支付更安全更快。

## Android

### Step 1. Download from Google Play

Install the official WeChat app from the Google Play Store - search for 'WeChat' and look for the app by Tencent.

> 从 Google Play 下载：在 Google Play 搜索 'WeChat'，安装 Tencent 的官方应用。

### Step 2. Create WeChat Account

Open WeChat, tap 'Sign Up' and register using your international phone number. You might need a friend to verify you.

> 创建微信账号：打开 WeChat 点 'Sign Up'，用你的国际手机号注册。可能需要一位朋友帮你做辅助验证。

### Step 3. Verify Your Identity

Go to 'Me' → 'Services' → 'Wallet'. You will be prompted to complete identity verification. Upload photos of your passport.

> 实名认证：进入 'Me' → 'Services' → 'Wallet'，会提示完成身份验证，上传护照照片。

### Step 4. Add International Card

Once verified, go to 'Me' → 'Services' → 'Wallet' → 'Cards' and tap 'Add a Card'. Link your international Visa/Mastercard.

> 添加国际银行卡：验证通过后，进入 'Me' → 'Services' → 'Wallet' → 'Cards'，点 'Add a Card'，绑定国际 Visa/Mastercard。

### Step 5. Set Payment Password

Create a 6-digit payment password and enable fingerprint authentication for security.

> 设置支付密码：设置 6 位支付密码，并开启指纹验证。

## 站点源码里的动图路径（均不可下载）

| 平台 | 步骤 | 原始地址 | 状态 |
|---|---|---|---|
| iOS | 1 | https://www.readyforchina.com/gifs/wechat-ios-step1.gif | 404 |
| iOS | 2 | https://www.readyforchina.com/gifs/wechat-ios-step2.gif | 404 |
| iOS | 3 | https://www.readyforchina.com/gifs/wechat-ios-step3.gif | 404 |
| iOS | 4 | https://www.readyforchina.com/gifs/wechat-ios-step4.gif | 404 |
| iOS | 5 | https://www.readyforchina.com/gifs/wechat-ios-step5.gif | 404 |
| Android | 1 | https://www.readyforchina.com/gifs/wechat-android-step1.gif | 404 |
| Android | 2 | https://www.readyforchina.com/gifs/wechat-android-step2.gif | 404 |
| Android | 3 | https://www.readyforchina.com/gifs/wechat-android-step3.gif | 404 |
| Android | 4 | https://www.readyforchina.com/gifs/wechat-android-step4.gif | 404 |
| Android | 5 | https://www.readyforchina.com/gifs/wechat-android-step5.gif | 404 |
