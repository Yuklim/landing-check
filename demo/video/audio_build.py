#!/usr/bin/env python3
"""合成 BGM 与音效，输出 roughcut_audio.wav（立体声 44.1k）。
BGM：钢琴 + 弦乐垫，70 BPM，无鼓点，按幕切换和弦与密度。
音效：通知、点击、倒带、识别中、成功、白闪，按镜头时间点落位。
全部程序生成，无版权问题。"""
import json, os
import numpy as np
from scipy.signal import fftconvolve

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 44100
BPM = 70.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT

DUR = dict(json.load(open(os.path.join(HERE, 'durations.json'))))
ORDER = [k for k, _ in json.load(open(os.path.join(HERE, 'durations.json')))]
START, _t = {}, 0.0
for _s in ORDER:
    START[_s] = _t; _t += DUR[_s]
TOTAL = _t


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12.0)

# 音名 -> midi
NAMES = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
def n(name, octv):
    return 12 * (octv + 1) + NAMES[name]

# D 大调，治愈向进行
CH = {
    'D':    [n('D',3), n('D',4), n('F#',4), n('A',4), n('D',5)],
    'Bm7':  [n('B',2), n('D',4), n('F#',4), n('A',4), n('B',4)],
    'G':    [n('G',2), n('D',4), n('G',4), n('B',4), n('D',5)],
    'A':    [n('A',2), n('C#',4), n('E',4), n('A',4), n('C#',5)],
    'Em7':  [n('E',3), n('E',4), n('G',4), n('B',4), n('D',5)],
    'Gm':   [n('G',2), n('D',4), n('G',4), n('A#',4), n('D',5)],
    'F#m':  [n('F#',2), n('F#',4), n('A',4), n('C#',5), n('F#',5)],
    'A7s':  [n('A',2), n('D',4), n('E',4), n('G',4), n('A',4)],
}
PROG = {
    'intro': ['D', 'Bm7', 'G', 'A'],
    'calm':  ['D', 'Bm7', 'G', 'A'],
    'tense': ['Bm7', 'Gm', 'Em7', 'A7s'],
    'warm':  ['G', 'D', 'Em7', 'A'],
    'full':  ['G', 'A', 'F#m', 'Bm7'],
}


def piano(freq, dur, amp=1.0):
    """简易钢琴：若干谐波 + 轻微失谐 + 指数衰减，带击弦噪声。"""
    nsmp = int(dur * SR)
    t = np.arange(nsmp) / SR
    out = np.zeros(nsmp, dtype=np.float32)
    parts = [(1, 1.0), (2, 0.42), (3, 0.19), (4, 0.11), (5, 0.055), (6, 0.03), (8, 0.015)]
    for k, a in parts:
        inh = 1 + 0.00042 * k * k                       # 弦的非谐性
        out += (a * np.sin(2 * np.pi * freq * k * inh * t + np.random.rand())).astype(np.float32)
    tau = np.clip(2.6 - 0.0022 * freq, 0.45, 2.6)
    env = np.exp(-t / tau)
    atk = int(0.004 * SR)
    env[:atk] *= np.linspace(0, 1, atk)
    out *= env
    hit = np.random.randn(min(nsmp, int(0.012 * SR))).astype(np.float32)
    hit *= np.exp(-np.arange(len(hit)) / (0.0022 * SR)) * 0.06
    out[:len(hit)] += hit
    return out * amp * 0.16


def pad(freqs, dur, amp=1.0):
    """弦乐垫：三重失谐三角波，慢起慢落，一阶低通。"""
    nsmp = int(dur * SR)
    t = np.arange(nsmp) / SR
    out = np.zeros(nsmp, dtype=np.float32)
    for f in freqs:
        for det in (-0.09, 0.0, 0.11):
            ph = 2 * np.pi * (f + det) * t + np.random.rand() * 6.28
            tri = 2 / np.pi * np.arcsin(np.sin(ph))
            out += tri.astype(np.float32) / 3.0
    a = np.exp(-1.0 / (SR * 0.0009))                     # 低通
    b = np.zeros_like(out); acc = 0.0
    for i in range(0, nsmp, 1):
        acc = a * acc + (1 - a) * out[i]; b[i] = acc
    env = np.ones(nsmp, dtype=np.float32)
    at, rl = int(1.1 * SR), int(1.4 * SR)
    at = min(at, nsmp // 2); rl = min(rl, nsmp // 2)
    env[:at] = np.linspace(0, 1, at) ** 1.6
    env[-rl:] = np.linspace(1, 0, rl) ** 1.4
    return b * env * amp * 0.052 / max(1, len(freqs))


def lowpass(x, cutoff_a):
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc = cutoff_a * acc + (1 - cutoff_a) * x[i]; y[i] = acc
    return y


def section_for(t):
    """按镜头决定情绪段。"""
    def at(sid): return START[sid]
    if t < at('1-1'): return 'intro'
    if t < at('2-1'): return 'calm'
    if t < at('2-4'): return 'tense'
    if t < at('3-1'): return 'warm'
    if t < at('4-1'): return 'calm'
    if t < at('5-1'): return 'warm'
    return 'full'


def build_bgm():
    L = int((TOTAL + 3) * SR)
    buf = np.zeros(L, dtype=np.float32)
    nbars = int(TOTAL / BAR) + 2
    for b in range(nbars):
        t0 = b * BAR
        sec = section_for(t0)
        prog = PROG[sec]
        name = prog[b % 4]
        notes = CH[name]
        root, upper = notes[0], notes[1:]
        dense = {'intro': 0.35, 'calm': 0.75, 'tense': 0.5, 'warm': 0.9, 'full': 1.0}[sec]
        gain = {'intro': 0.65, 'calm': 0.95, 'tense': 0.8, 'warm': 1.0, 'full': 1.12}[sec]

        def place(sig, tt):
            i = int(tt * SR)
            if i < 0 or i >= L: return
            e = min(L, i + len(sig)); buf[i:e] += sig[:e - i]

        place(piano(midi(root), 3.2, 0.95 * gain), t0)              # 低音根音
        place(piano(midi(root + 7), 2.4, 0.5 * gain), t0 + 2 * BEAT)
        place(pad([midi(x) for x in upper], BAR + 0.6, gain), t0)   # 弦乐垫

        # 琶音：八分音符，速度随机微动
        pattern = [0, 1, 2, 3, 2, 1, 2, 3] if sec != 'intro' else [0, 2, 1, 3]
        step = BEAT / 2 if sec != 'intro' else BEAT
        for i, pi in enumerate(pattern):
            if np.random.rand() > dense: continue
            nt = upper[pi % len(upper)]
            v = (0.44 if i % 2 == 0 else 0.3) * gain * (0.85 + 0.3 * np.random.rand())
            place(piano(midi(nt), 2.0, v), t0 + i * step)
        # 高音铃音点缀
        if sec in ('warm', 'full') and b % 2 == 1:
            place(piano(midi(upper[-1] + 12), 2.6, 0.22 * gain), t0 + 3 * BEAT)
    return buf[:int(TOTAL * SR)]


def reverb(x, rt=1.9, mix=0.26):
    n_ir = int(rt * SR)
    ir = np.random.randn(n_ir).astype(np.float32) * np.exp(-np.arange(n_ir) / (rt * SR / 4.2))
    ir = lowpass(ir, np.exp(-1.0 / (SR * 0.00022)))
    ir[:int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    ir /= np.abs(ir).sum() / 2.4
    wet = fftconvolve(x, ir)[:len(x)].astype(np.float32)
    return (1 - mix) * x + mix * wet


# ---------- 音效 ----------
def env_exp(nsmp, tau):
    return np.exp(-np.arange(nsmp) / (tau * SR)).astype(np.float32)

def sfx_ding():
    d = 1.5; t = np.arange(int(d * SR)) / SR
    x = (np.sin(2 * np.pi * 1567.98 * t) * 0.6 + np.sin(2 * np.pi * 2349.3 * t) * 0.3
         + np.sin(2 * np.pi * 3135.9 * t) * 0.12)
    x *= env_exp(len(t), 0.42); x[:80] *= np.linspace(0, 1, 80)
    return (x * 0.30).astype(np.float32)

def sfx_tap():
    d = 0.09; t = np.arange(int(d * SR)) / SR
    x = np.sin(2 * np.pi * 1250 * t) * env_exp(len(t), 0.012)
    x += np.random.randn(len(t)).astype(np.float32) * env_exp(len(t), 0.005) * 0.25
    return (x * 0.17).astype(np.float32)

def sfx_shutter():
    d = 0.22; nsmp = int(d * SR)
    x = np.random.randn(nsmp).astype(np.float32) * env_exp(nsmp, 0.018)
    x += np.sin(2 * np.pi * 2400 * np.arange(nsmp) / SR) * env_exp(nsmp, 0.010) * 0.5
    return (lowpass(x, np.exp(-1.0 / (SR * 0.00008))) * 0.26).astype(np.float32)

def sfx_rewind():
    d = 0.85; nsmp = int(d * SR); t = np.arange(nsmp) / SR
    f = np.linspace(2600, 420, nsmp)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * 0.35 + np.random.randn(nsmp).astype(np.float32) * 0.22
    x *= np.hanning(nsmp).astype(np.float32)
    x = lowpass(x, np.exp(-1.0 / (SR * 0.00011)))
    return (x * 0.33).astype(np.float32)

def sfx_thinking(d=2.0):
    nsmp = int(d * SR); t = np.arange(nsmp) / SR
    x = np.sin(2 * np.pi * 523.25 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 1.1 * t))
    x += np.sin(2 * np.pi * 784.0 * t) * 0.3 * (0.5 + 0.5 * np.sin(2 * np.pi * 1.1 * t + 1.4))
    x *= np.hanning(nsmp).astype(np.float32)
    return (x * 0.075).astype(np.float32)

def sfx_success():
    out = np.zeros(int(2.2 * SR), dtype=np.float32)
    for i, nt in enumerate([n('D',5), n('F#',5), n('A',5)]):
        s = piano(midi(nt), 1.9, 1.5)
        i0 = int(i * 0.115 * SR); out[i0:i0 + len(s)] += s[:len(out) - i0]
    return out * 0.85

def sfx_whoosh():
    d = 0.7; nsmp = int(d * SR)
    x = np.random.randn(nsmp).astype(np.float32)
    x = lowpass(x, np.exp(-1.0 / (SR * 0.00006)))
    env = np.concatenate([np.linspace(0, 1, int(nsmp * 0.45)) ** 2,
                          np.linspace(1, 0, nsmp - int(nsmp * 0.45)) ** 1.6]).astype(np.float32)
    return (x * env * 0.30).astype(np.float32)


def sfx_plan():
    """(时间, 音效) —— 时间由镜头起点推出。"""
    S = START
    p = [
        (S['0-2'] + DUR['0-2'] - 1.0, sfx_rewind()),       # 定格倒带
        (S['1-1'] + 3.0, sfx_ding()),                      # 出发前推送
        (S['1-2'] + 0.3, sfx_tap()),
        (S['1-3'] + 0.5, sfx_tap()),
        (S['1-4'] + 0.6, sfx_tap()), (S['1-4'] + 2.2, sfx_tap()),
        (S['1-5'] + 1.2, sfx_tap()),
        (S['1-6'] + 0.4, sfx_tap()), (S['1-6'] + 3.0, sfx_tap()), (S['1-6'] + 5.6, sfx_tap()),
        (S['2-2'] + 1.0, sfx_shutter()), (S['2-2'] + 2.6, sfx_tap()),
        (S['2-3'] + 0.05, sfx_thinking(DUR['2-3'] - 0.1)),
        (S['2-5'] + 1.4, sfx_tap()),
        (S['2-6a'] + 1.0, sfx_tap()),
        (S['2-6b'] + 0.5, sfx_success()),
        (S['2-7'] + 0.4, sfx_success()),
        (S['3-2'] + 1.0, sfx_ding()),                      # 落地推送
        (S['3-4'] + 0.6, sfx_tap()),
        (S['3-5'] + 0.0, sfx_whoosh()),                    # 白闪
        (S['4-1'] + 0.8, sfx_tap()),
        (S['4-2'] + 0.3, sfx_tap()),
        (S['5-1'] + 0.5, sfx_shutter()), (S['5-1'] + 6.0, sfx_tap()),
        (S['6-1'] + 0.2, sfx_whoosh()),
    ]
    return p


def main():
    np.random.seed(7)
    print('bgm...'); bgm = build_bgm()
    print('reverb...'); bgm = reverb(bgm)
    # 整体包络：开头淡入，结尾淡出
    L = len(bgm); fi, fo = int(2.5 * SR), int(3.0 * SR)
    bgm[:fi] *= np.linspace(0, 1, fi); bgm[-fo:] *= np.linspace(1, 0, fo) ** 1.3
    bgm *= 0.82

    sx = np.zeros(L, dtype=np.float32)
    for t, s in sfx_plan():
        i = int(t * SR)
        if i < 0 or i >= L: continue
        e = min(L, i + len(s)); sx[i:e] += s[:e - i]
    sx = reverb(sx, rt=1.1, mix=0.16)

    mono = bgm + sx
    # 轻微立体声：右声道 9ms 延迟
    d = int(0.009 * SR)
    left = mono.copy()
    right = np.concatenate([np.zeros(d, dtype=np.float32), mono[:-d]]) * 0.97
    st = np.stack([left, right], axis=1)
    peak = np.abs(st).max()
    st = st / peak * 0.89 if peak > 0 else st
    # 软限幅
    st = np.tanh(st * 1.12) / np.tanh(1.12)

    import wave
    out = os.path.join(HERE, 'roughcut_audio.wav')
    with wave.open(out, 'w') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(st, -1, 1) * 32767).astype('<i2').tobytes())
    print('wrote', out, round(L / SR, 1), 's')


if __name__ == '__main__':
    main()
