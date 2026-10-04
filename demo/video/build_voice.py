#!/usr/bin/env python3
"""视频脚本的声音与文字源：从 SHOTS 生成旁白稿、台词稿、双语 SRT、时间表，
并用 macOS `say` 合成一条参考声轨（scratch），用来检查每个镜头的声音是否放得下。
正式配音时按 旁白稿.md / 台词稿.md 录，再用 timeline.csv 对位。

用法：python3 demo/video/build_voice.py            只出文字
      python3 demo/video/build_voice.py --audio    同时合成参考声轨（需要 ffmpeg）
"""
import csv, json, os, subprocess, sys, wave, struct

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = HERE
VOICE_ZH, VOICE_EN, VOICE_DRIVER = 'Tingting', 'Daniel', 'Eddy (中文（中国大陆）)'
RATE_ZH, RATE_EN = 150, 160          # 词/分钟，旁白要慢
GAP = 0.35                           # 台词和旁白之间留的气口（秒）

# 每镜：id, 时长(秒), 旁白, 台词列表[(who, en, zh)]。台词先说，旁白跟在后面。
SHOTS = [
 # (镜, 画面最短时长, 旁白, 台词, 选项)。实际时长 = max(最短时长, 声音所需 + 0.4s)，向上取到 0.5s
 ('0-1', 8,  '上海浦东，早上八点二十。', [], {'narr_at': 4}),
 ('0-2', 6,  '这是 Alex，第一次来中国。落地到上车，三十六分钟。真正起作用的那几分钟，在出发前。', []),
 ('T',   2,  '', []),   # 标题卡
 ('1-1', 5,  '出发前一天，Trip.com 推了一条提醒。', []),
 ('1-2', 5,  '它知道他明天飞上海，问他要不要先做落地检查。', []),
 ('1-3', 6,  '航班、酒店、上网卡，Trip.com 本来就知道。还差两件：上网，和支付。',
             [('Alex', "Okay… two things to sort out.", '好吧……还有两件事要搞定。')]),
 ('1-4', 5,  '上网这件事，一分钟。', [('Alex', "eSIM, done.", '上网卡，搞定。')]),
 ('1-5', 4,  '先按教程装好，再用一块钱验证。',
             [('Alex', "Alipay. Never used it. Let's see the guide first.", '支付宝，没用过。先看看教程。')]),
 ('1-6', 10, '一步一图：装应用、注册、加卡、护照实名。Alex 做到第三步。', []),
 ('2-1', 6,  '卡绑不上。支付宝说是网络错误，可他的网明明好好的。要是落地后才碰到，他就没退路了。',
             [('Alex', "Hm. 'Network error'? My Wi-Fi is fine…", '嗯？"网络错误"？我的网明明好好的……')]),
 ('2-2', 4,  '教程页右下角一直有"我卡住了"。截图传上去。', [('Alex', "Let's ask.", '问问它。')]),
 ('2-3', 2,  '', []),
 ('2-4', 12, '它认出这不是网络问题，是银行拒绝了绑卡验证，给了三步：换一张不同网络的卡；验证码发到原来的号码，SIM 别停；不行就走备用路。答案不是现编的，底下写着核验日期。', []),
 ('2-5', 4,  '换张 Visa，绑上了。实名顺手做完。',
             [('Alex', "Different card… linked. And ID verified.", '换张卡……绑上了。实名也过了。')]),
 ('2-6a', 4, '装好不等于能付。真实付一块钱，原路退回。',
             [('Alex', "Verify with one yuan? Sure.", '花一块钱验证？来。')]),
 ('2-6b', 4, '支付，在出发前就验证完了。',
             [('Alex', "There we go. One yuan, refunded.", '成了。一块钱，还退了。')]),
 ('2-7', 4,  '三件事，全绿。可以出发了。', []),
 ('3-1', 5,  '两天后的早上，飞机落地。', []),
 ('3-2', 5,  '手机还没联网，提醒已经弹出来了。出发前就排好了，不需要网络。', []),
 ('3-3', 3,  '回到八点二十。', []),
 ('3-4', 8,  '先看能不能上网，eSIM 在，直接过。支付，出发前验证过了。只剩一件事：去酒店。',
             [('Alex', "All green. Let's go.", '全绿了。走。')]),
 ('3-5', 1,  '', []),
 ('4-1', 8,  '它知道酒店订单，知道两件托运行李，所以推荐出租车，去二十五号门排正规队。地铁和网约车也在。', []),
 ('4-2', 5,  '上车前，一张中文地址卡。', []),
 ('4-3', 6,  '不用说一句中文。',
             [('Alex', "Hi! This one, please.", '你好！去这里，谢谢。'),
              ('Driver', "OK, The PuLi Hotel.", '好的，璞丽酒店。')]),
 ('4-4', 3,  '第一小时，结束。', []),
 ('5-1', 8,  '第一小时做成一张卡，一键分享。下一个来中国的人，从这张卡点进来。',
             [('Alex', "Thirty-six minutes. Not bad for a first-timer.", '三十六分钟。第一次来，还行吧。')]),
 ('5-2', 5,  '', []),
 ('6-1', 6,  '从订单出发，起飞前准备好，落地时帮你看一眼，卡住了给核验过的答案，再告诉你下一步。', []),
 ('6-2', 4,  'Landing Check，长在 Trip.com 里。', []),
]

def norm(s):
    return [(x[0], x[1], x[2], x[3], x[4] if len(x) > 4 else {}) for x in s]

def load_md_overrides(shots):
    """01-旁白稿.md / 02-台词稿.md 是可编辑的源：存在就以它们为准，覆盖 SHOTS 里的文字。"""
    import re
    narr, dlg = {}, {}
    f1 = os.path.join(OUT, '01-旁白稿.md')
    if os.path.exists(f1):
        for l in open(f1, encoding='utf-8'):
            m = re.match(r'^\|\s*\d+\s*\|\s*(\S+)\s*\|\s*(.*?)\s*\|\s*$', l)
            if m: narr[m.group(1)] = m.group(2)
    f2 = os.path.join(OUT, '02-台词稿.md')
    if os.path.exists(f2):
        for l in open(f2, encoding='utf-8'):
            m = re.match(r'^\|\s*\d+\s*\|\s*(\S+)\s*\|\s*(\S+)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$', l)
            if m: dlg.setdefault(m.group(1), []).append((m.group(2), m.group(3), m.group(4)))
    out = []
    for sid, dur, n, d, opt in shots:
        if sid in narr: n = narr[sid]
        if sid in dlg: d = dlg[sid]
        out.append((sid, dur, n, d, opt))
    return out

def ts(sec):
    ms = int(round(sec * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return '%02d:%02d:%02d,%03d' % (h, m, s, ms)

def say(text, voice, rate, path):
    subprocess.run(['say', '-v', voice, '-r', str(rate), '-o', path + '.aiff', text], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', path + '.aiff', '-ar', '22050', '-ac', '1', '-c:a', 'pcm_s16le', path + '.wav'], check=True)
    os.remove(path + '.aiff')
    with wave.open(path + '.wav') as w:
        return w.getnframes() / w.getframerate()

def main(audio):
    shots = load_md_overrides(norm(SHOTS))
    tmp = os.path.join(OUT, 'scratch_parts'); os.makedirs(tmp, exist_ok=True)
    rows, srt, narr_md, dlg_md, clips = [], [], [], [], []
    t0, n_srt, n_narr, n_dlg = 0.0, 0, 0, 0
    overflow = []
    final = []
    for sid, dur, narr, dlg, opt in shots:
        cur = t0
        for who, en, zh in dlg:
            n_dlg += 1
            d = say(en if who != 'Driver' else zh, VOICE_EN if who != 'Driver' else VOICE_DRIVER, RATE_EN, os.path.join(tmp, f'{sid}_dlg{n_dlg}')) if audio else max(1.5, len(en.split()) * 0.42)
            n_srt += 1
            srt.append(f'{n_srt}\n{ts(cur)} --> {ts(cur + d)}\n{en}\n{zh}\n')
            dlg_md.append(f'| {n_dlg} | {sid} | {who} | {en} | {zh} |')
            rows.append([sid, 'dialogue', who, round(cur, 2), round(cur + d, 2), round(d, 2), en])
            clips.append((cur, os.path.join(tmp, f'{sid}_dlg{n_dlg}.wav')))
            cur += d + GAP
        if narr:
            n_narr += 1
            start = max(cur, t0 + opt.get('narr_at', 0))
            d = say(narr, VOICE_ZH, RATE_ZH, os.path.join(tmp, f'{sid}_narr')) if audio else len(narr) * 0.22
            narr_md.append(f'| {n_narr} | {sid} | {narr} |')
            rows.append([sid, 'narration', '旁白', round(start, 2), round(start + d, 2), round(d, 2), narr])
            clips.append((start, os.path.join(tmp, f'{sid}_narr.wav')))
            cur = start + d
        need = cur - t0 + 0.4
        if need > dur:
            overflow.append((sid, dur, round(need, 1)))
            dur = __import__('math').ceil(need * 2) / 2
        final.append((sid, dur))
        rows.append([sid, 'shot', '', round(t0, 2), round(t0 + dur, 2), dur, ''])
        t0 += dur

    total = t0
    with open(os.path.join(OUT, 'durations.json'), 'w') as f:
        json.dump(final, f, ensure_ascii=False)
    with open(os.path.join(OUT, '01-旁白稿.md'), 'w') as f:
        f.write('# 旁白稿（中文，不打字幕）\n\n语速慢，句间留气口。数字按中文读法。\n\n| # | 镜 | 旁白 |\n|---|---|---|\n' + '\n'.join(narr_md) + '\n')
    with open(os.path.join(OUT, '02-台词稿.md'), 'w') as f:
        f.write('# 台词稿（人物英文，打双语字幕）\n\nAlex 的台词做画外音，语气轻松、自言自语。司机一句中文。\n\n| # | 镜 | 谁 | 英文 | 中文字幕 |\n|---|---|---|---|---|\n' + '\n'.join(dlg_md) + '\n')
    with open(os.path.join(OUT, 'subtitles.srt'), 'w') as f:
        f.write('\n'.join(srt))
    with open(os.path.join(OUT, 'timeline.csv'), 'w', newline='') as f:
        w = csv.writer(f); w.writerow(['shot', 'kind', 'who', 'start_s', 'end_s', 'dur_s', 'text']); w.writerows(rows)

    if audio:
        import numpy as np
        sr = 22050; buf = np.zeros(int((total + 2) * sr), dtype=np.float32)
        for start, path in clips:
            with wave.open(path) as w:
                a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
            i = int(start * sr); buf[i:i + len(a)] += a
        buf = np.clip(buf, -1, 1)
        wavp = os.path.join(OUT, 'scratch_track.wav')
        with wave.open(wavp, 'w') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((buf * 32767).astype(np.int16).tobytes())
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wavp, '-b:a', '96k', os.path.join(OUT, 'scratch_track.mp3')], check=True)

    print(f'total {total:.1f}s = {int(total//60)}:{int(total%60):02d}; narration {n_narr}, dialogue {n_dlg}, srt {n_srt}')
    if overflow:
        print('镜头因声音延长 (镜, 最短, 实际):')
        for o in overflow: print('  ', o)

if __name__ == '__main__':
    main('--audio' in sys.argv)
