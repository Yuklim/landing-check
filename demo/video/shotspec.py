# -*- coding: utf-8 -*-
"""每镜的画面方案。rect 都是导出图（786x1704）上的比例坐标 (x0,y0,x1,y1)。
kind: app 分屏 / slate 待生成镜头 / title 标题卡 / outro 片尾。
screens: [(起始比例, 导出图文件名)]  zooms: [(起, 止, rect)] 比例均相对本镜时长。
rp: 右侧人物素材 (裁切, 占位标签)。"""

PRE = '01-行前检查'
A, B, C = f'{PRE}-a-初始两项待办', f'{PRE}-b-eSIM已买', f'{PRE}-c-全部就绪'

# 常用区域
R_FLIGHT   = (0.03, 0.093, 0.97, 0.198)
R_DATA     = (0.03, 0.320, 0.97, 0.428)
R_PAY      = (0.03, 0.428, 0.97, 0.512)
R_PAYBTN   = (0.26, 0.428, 0.97, 0.512)
R_READY    = (0.03, 0.120, 0.97, 0.190)
R_CNTILE   = (0.085, 0.328, 0.378, 0.414)
R_PUSH     = (0.03, 0.520, 0.97, 0.690)
R_TUT_IMG  = (0.03, 0.100, 0.97, 0.375)
T1_TXT     = (0.03, 0.535, 0.97, 0.652)
T2_TXT     = (0.03, 0.372, 0.97, 0.530)
T3_TXT     = (0.03, 0.385, 0.97, 0.555)
T4_TXT     = (0.03, 0.368, 0.97, 0.660)
R_FAB      = (0.645, 0.757, 0.998, 0.830)
R_FAIL_DLG = (0.13, 0.405, 0.87, 0.585)
R_STUCK_HD = (0.03, 0.105, 0.97, 0.300)
R_STEP1    = (0.03, 0.352, 0.97, 0.432)
R_STEP2    = (0.03, 0.428, 0.97, 0.518)
R_STEP3    = (0.03, 0.512, 0.97, 0.625)
R_SOURCE   = (0.03, 0.636, 0.97, 0.684)
R_PAYOK    = (0.03, 0.105, 0.97, 0.365)
R_LCARD    = (0.05, 0.230, 0.95, 0.470)
R_ONLINE   = (0.03, 0.095, 0.97, 0.185)
R_FIRSTHR  = (0.03, 0.585, 0.97, 0.840)
R_REC      = (0.03, 0.195, 0.97, 0.306)
R_WHY      = (0.03, 0.292, 0.97, 0.352)
R_CHIPS    = (0.03, 0.350, 0.97, 0.400)
R_ALTS     = (0.06, 0.455, 0.94, 0.635)
R_ADDR     = (0.03, 0.155, 0.97, 0.395)
R_ADDR2    = (0.03, 0.415, 0.97, 0.610)
R_36MIN    = (0.08, 0.230, 0.92, 0.420)
R_POINTS   = (0.09, 0.395, 0.91, 0.500)
R_IG       = (0.08, 0.662, 0.36, 0.818)

SPEC = {
 '0-1': dict(kind='slate', scene='hall', clock='Shanghai Pudong · 08:20',
             zh='到达大厅，高处平稳弧形环绕下降', en='Arrivals hall · orbital opening',
             note='空镜 · 丁达尔光束里漂浮细小灰尘'),
 '0-2': dict(kind='slate', scene='alex', photo='portrait', freeze=True,
             zh='环绕收束到 Alex，他掏出手机，拇指停在屏幕前', en='Orbit settles on Alex · freeze frame',
             note='本镜最后一帧定格、褪色、倒带，进入「出发前」'),
 'T':   dict(kind='title'),

 '1-1': dict(kind='slate', scene='home', photo='medium', clock='San Francisco · the day before',
             zh='旧金山公寓窗边，手机亮起一条通知', en='San Francisco apartment · the phone lights up',
             note='窗边一杯咖啡、一本护照、半开的行李箱'),
 '1-2': dict(kind='app', badge='Your trip', screens=[(0, '07b-锁屏推送-出发前')],
             zooms=[(0.22, 1.0, R_PUSH)], rp=('medium', 'R1 平静看手机')),
 '1-3': dict(kind='app', badge='Your trip', screens=[(0, A)],
             zooms=[(0.10, 0.34, R_FLIGHT), (0.36, 0.66, R_DATA), (0.68, 1.0, R_PAY)],
             rp=('close', 'R1 平静看手机')),
 '1-4': dict(kind='app', badge='Before you fly', screens=[(0, A), (0.30, '06-eSIM页'), (0.72, B)],
             zooms=[(0.34, 0.68, R_CNTILE), (0.76, 1.0, R_DATA)], rp=('close', 'R1 点头')),
 '1-5': dict(kind='app', badge='Before you fly', screens=[(0, B)],
             zooms=[(0.12, 1.0, R_PAYBTN)], rp=('close', 'R1 平静看手机')),
 '1-6': dict(kind='app', badge='Before you fly',
             screens=[(0, '19-支付宝图文教程-第1步'), (0.30, '19-支付宝图文教程-第2步'), (0.62, '19-支付宝图文教程-第3步')],
             zooms=[(0.06, 0.28, T1_TXT), (0.34, 0.58, T2_TXT), (0.66, 1.0, R_TUT_IMG)],
             rp=('medium', 'R5 一手卡一手机照着做')),

 '2-1': dict(kind='app', badge="When you're stuck", screens=[(0, '20-支付宝绑卡失败-真实截图')],
             zooms=[(0.18, 1.0, R_FAIL_DLG)], rp=('close', 'R2 皱眉往后靠')),
 '2-2': dict(kind='app', badge="When you're stuck", screens=[(0, B)],
             zooms=[(0.12, 0.60, R_FAB)], fab=True, rp=('close', 'R2 截图')),
 '2-3': dict(kind='app', badge="When you're stuck", screens=[(0, B)],
             thinking=True, rp=('close', 'R2 等待')),
 '2-4': dict(kind='app', badge='Verified answers', screens=[(0, '13-ImStuck结果')],
             zooms=[(0.04, 0.22, R_STUCK_HD), (0.24, 0.44, R_STEP1), (0.46, 0.64, R_STEP2),
                    (0.66, 0.86, R_STEP3), (0.88, 1.0, R_SOURCE)],
             rp=('close', 'R3 边看边点头')),
 '2-5': dict(kind='app', badge='Verified answers',
             screens=[(0, '19-支付宝图文教程-第3步'), (0.45, '19-支付宝图文教程-第4步')],
             zooms=[(0.08, 0.40, T3_TXT), (0.52, 1.0, T4_TXT)], rp=('medium', 'R5 换卡输入')),
 '2-6a': dict(kind='app', badge='Before you fly', screens=[(0, B)],
              zooms=[(0.08, 1.0, R_PAYBTN)], rp=('close', 'R1 点一下，等')),
 '2-6b': dict(kind='app', badge='Before you fly', screens=[(0, '02-支付验证')],
              zooms=[(0.10, 1.0, R_PAYOK)], rp=('close', 'R4 笑，往后一靠')),
 '2-7': dict(kind='app', badge='Before you fly', screens=[(0, C)],
             zooms=[(0.12, 1.0, R_READY)], rp=('medium', 'R4 合上行李箱')),

 '3-1': dict(kind='slate', scene='plane', photo='close', clock='Shanghai Pudong · 07:52',
             zh='机舱窗边，飞机落地滑行，关掉飞行模式', en='Window seat · airplane mode off',
             note='晨光扫过他的脸'),
 '3-2': dict(kind='app', badge='When you land', screens=[(0, '07-锁屏推送-落地')],
             zooms=[(0.18, 1.0, R_PUSH)], rp=('close', 'R1 座位上看手机')),
 '3-3': dict(kind='slate', scene='alex', photo='portrait', unfreeze=True, clock='08:20',
             zh='回到定格那一帧，颜色恢复，拇指落到屏幕上', en='The freeze frame thaws',
             note='不重放环绕镜头'),
 '3-4': dict(kind='app', badge='When you land',
             screens=[(0, '08-MyTrips入口'), (0.34, '11-落地卡-已联网分支')],
             zooms=[(0.10, 0.30, R_LCARD), (0.40, 0.58, R_ONLINE), (0.60, 1.0, R_FIRSTHR)],
             rp=('medium', '3-4 大厅边走边看')),
 '3-5': dict(kind='flash'),

 '4-1': dict(kind='app', badge='One next step', screens=[(0, '14-落地卡-第三步交通')],
             zooms=[(0.06, 0.30, R_REC), (0.32, 0.54, R_WHY), (0.56, 0.74, R_CHIPS), (0.76, 1.0, R_ALTS)],
             rp=('medium', '3-4 扶梯口看手机')),
 '4-2': dict(kind='app', badge='One next step', screens=[(0, '16-给司机看地址')],
             zooms=[(0.12, 0.66, R_ADDR), (0.70, 1.0, R_ADDR2)], rp=('medium', '4-3 走向 25 号门')),
 '4-3': dict(kind='slate', scene='taxi', photo='medium',
             zh='出租车窗边，把手机递给司机，司机点头', en='Shows the phone to the driver',
             note='镜头从车外环绕到车内'),
 '4-4': dict(kind='app', badge='One next step', screens=[(0, '17-完成页')],
             zooms=[(0.10, 1.0, (0.03, 0.050, 0.97, 0.225))], rp=('close', '4-4 后座看窗外')),
 '5-1': dict(kind='app', badge='Your first hour', screens=[(0, '18-分享卡')],
             zooms=[(0.06, 0.34, R_36MIN), (0.38, 0.66, R_POINTS), (0.72, 1.0, R_IG)],
             rp=('close', '4-4 笑着截图')),
 '5-2': dict(kind='slate', scene='street',
             zh='车窗外的上海清晨街景', en='Shanghai morning street from the taxi window',
             note='空镜 · 梧桐、老洋房和玻璃高楼交替掠过'),
 '6-1': dict(kind='outro_grid'),
 '6-2': dict(kind='outro_logo'),
}

# 片尾六词与缩略图
OUTRO = [
    ('Your trip', '1-3', A),
    ('Before you fly', '1-6', '19-支付宝图文教程-第1步'),
    ("When you're stuck", '2-2', '20-支付宝绑卡失败-真实截图'),
    ('Verified answers', '2-4', '13-ImStuck结果'),
    ('When you land', '3-4', '11-落地卡-已联网分支'),
    ('One next step', '4-2', '16-给司机看地址'),
]
