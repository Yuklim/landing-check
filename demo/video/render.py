#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Landing Check 演示视频粗剪渲染器。
画面全部来自 exports/ 的导出图 + 定妆照；人物镜头尚未生成，用带说明的待生成卡占位。
用法：python3 demo/video/render.py [--stills] [--only 2-4,1-3]
"""
import csv, json, os, subprocess, sys
import numpy as np
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageFont, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shotspec import SPEC, OUTRO

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
EXP = os.path.join(ROOT, 'exports')
SEG = os.path.join(HERE, 'segments')
W, H, FPS = 1920, 1080, 25

INK, INK2, INK3 = (18, 24, 38), (111, 118, 133), (160, 166, 176)
BRAND, LINE = (44, 97, 254), (218, 223, 230)
BG, CREAM, WARM = (240, 242, 245), (246, 242, 235), (252, 249, 243)
GREEN = (22, 150, 90)

CJK = '/System/Library/Fonts/Hiragino Sans GB.ttc'
LAT = '/System/Library/Fonts/Avenir Next.ttc'
_fc = {}
def font(size, weight=0, latin=False):
    key = (size, weight, latin)
    if key not in _fc:
        if latin:
            _fc[key] = ImageFont.truetype(LAT, size, index={0: 2, 1: 5, 2: 7}.get(weight, 2))
        else:
            _fc[key] = ImageFont.truetype(CJK, size, index=min(weight, 1))
    return _fc[key]

DUR = dict(json.load(open(os.path.join(HERE, 'durations.json'))))
ORDER = [k for k, _ in json.load(open(os.path.join(HERE, 'durations.json')))]
START, _t = {}, 0.0
for _s in ORDER:
    START[_s] = _t; _t += DUR[_s]
TOTAL = _t

# ---------- 字幕与旁白（时间来自 timeline.csv） ----------
CUES = {s: [] for s in ORDER}
with open(os.path.join(HERE, 'timeline.csv')) as f:
    for r in csv.DictReader(f):
        if r['kind'] == 'shot': continue
        CUES[r['shot']].append((r['kind'], float(r['start_s']), float(r['end_s']), r['who'], r['text']))
DLG = {}
for line in open(os.path.join(HERE, '02-台词稿.md'), encoding='utf-8'):
    p = [c.strip() for c in line.strip().strip('|').split('|')]
    if len(p) == 5 and p[0].isdigit():
        DLG.setdefault(p[1], []).append((p[2], p[3], p[4]))

# ---------- 缓存 ----------
_img, _phone, _zoom, _alex, _txt = {}, {}, {}, {}, {}

def export(name):
    if name not in _img:
        _img[name] = Image.open(os.path.join(EXP, name + '.png')).convert('RGB')
    return _img[name]

PH_H = 860
_frame = Image.open(os.path.join(HERE, 'phone_frame.png')).convert('RGBA')
PH_SCALE = PH_H / _frame.height
PH_W = int(_frame.width * PH_SCALE)
FRAME = _frame.resize((PH_W, PH_H), Image.LANCZOS)
SX0, SY0 = int(50 * PH_SCALE), int(50 * PH_SCALE)
SW, SH = PH_W - 2 * SX0, PH_H - 2 * SY0
PH_X, PH_Y = 96, (H - PH_H) // 2

def phone(name):
    if name not in _phone:
        pad = 60
        c = Image.new('RGBA', (PH_W + 2 * pad, PH_H + 2 * pad), (0, 0, 0, 0))
        sh = Image.new('RGBA', c.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle((pad + 6, pad + 16, pad + PH_W - 6, pad + PH_H + 10),
                                             radius=66, fill=(20, 26, 40, 70))
        c = Image.alpha_composite(c, sh.filter(ImageFilter.GaussianBlur(22)))
        scr = export(name).resize((SW, SH), Image.LANCZOS)
        c.paste(scr, (pad + SX0, pad + SY0))
        c.alpha_composite(FRAME, (pad, pad))
        _phone[name] = (c, pad)
    return _phone[name]

ZW, ZH = 620, 580
def zoom(name, rect):
    key = (name, rect)
    if key not in _zoom:
        im = export(name)
        x0, y0, x1, y1 = [int(v * (im.width if i % 2 == 0 else im.height)) for i, v in enumerate(rect)]
        crop = im.crop((x0, y0, x1, y1))
        s = min(ZW / crop.width, ZH / crop.height, 1.35)   # 不超过导出图原生像素的 1.35 倍
        tw, th = max(8, int(crop.width * s)), max(8, int(crop.height * s))
        crop = crop.resize((tw, th), Image.LANCZOS)
        pad = 46
        c = Image.new('RGBA', (tw + 2 * pad, th + 2 * pad), (0, 0, 0, 0))
        sh = Image.new('RGBA', c.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle((pad, pad + 12, pad + tw, pad + th + 14), radius=16,
                                             fill=(20, 26, 40, 96))
        c = Image.alpha_composite(c, sh.filter(ImageFilter.GaussianBlur(18)))
        card = Image.new('RGBA', (tw + 16, th + 16), (255, 255, 255, 255))
        ImageDraw.Draw(card).rounded_rectangle((0, 0, card.width - 1, card.height - 1), radius=16,
                                               outline=(214, 219, 228, 255), width=1)
        m = Image.new('L', card.size, 0)
        ImageDraw.Draw(m).rounded_rectangle((0, 0, card.width - 1, card.height - 1), radius=16, fill=255)
        card.putalpha(m)
        inner = Image.new('RGBA', (tw, th), (255, 255, 255, 255)); inner.paste(crop, (0, 0))
        im2 = Image.new('L', (tw, th), 0)
        ImageDraw.Draw(im2).rounded_rectangle((0, 0, tw - 1, th - 1), radius=9, fill=255)
        inner.putalpha(im2)
        card.alpha_composite(inner, (8, 8))
        c.alpha_composite(card, (pad - 8, pad - 8))
        _zoom[key] = (c, pad)
    return _zoom[key]

def alex(kind):
    if kind not in _alex:
        _alex[kind] = Image.open(os.path.join(HERE, 'assets', f'alex_{kind}.png')).convert('RGB')
    return _alex[kind]

# ---------- 文本 ----------
def wrap(text, f, maxw, draw):
    out, cur = [], ''
    for ch in text:
        if ch == '\n':
            out.append(cur); cur = ''; continue
        if draw.textlength(cur + ch, font=f) > maxw and cur:
            out.append(cur); cur = ch
        else:
            cur += ch
    if cur: out.append(cur)
    return out

_d0 = ImageDraw.Draw(Image.new('RGB', (10, 10)))
def text_layer(key, fn):
    if key not in _txt:
        _txt[key] = fn()
    return _txt[key]

def chip(text, f, fg, bg, padx=18, pady=9, radius=22, border=None):
    w = int(_d0.textlength(text, font=f)); a, dsc = f.getmetrics(); hgt = a + dsc
    im = Image.new('RGBA', (w + 2 * padx, hgt + 2 * pady), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, im.width - 1, im.height - 1), radius=radius, fill=bg,
                        outline=border, width=1 if border else 0)
    d.text((padx, pady), text, font=f, fill=fg)
    return im

def shadow_text(d, xy, s, f, fill, sh=(0, 0, 0, 90), off=2):
    x, y = xy
    d.text((x + off, y + off), s, font=f, fill=sh)
    d.text((x, y), s, font=f, fill=fill)

# ---------- 背景 ----------
def vgrad(size, top, bot):
    w, h = size
    g = Image.new('RGB', (1, h))
    px = g.load()
    for y in range(h):
        k = y / max(1, h - 1)
        px[0, y] = tuple(int(top[i] * (1 - k) + bot[i] * k) for i in range(3))
    return g.resize(size, Image.BILINEAR)

SPLIT = 1152

def app_base(spec):
    im = Image.new('RGB', (W, H), BG)
    im.paste(vgrad((W - SPLIT, H), WARM, (238, 233, 224)), (SPLIT, 0))
    d = ImageDraw.Draw(im)
    d.line((SPLIT, 0, SPLIT, H), fill=LINE, width=2)
    return im

def slate_base():
    im = vgrad((W, H), (252, 249, 243), (238, 234, 226)).convert('RGB')
    return im

# ---------- 各类画面 ----------
def smooth(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def screen_at(spec, u):
    name = spec['screens'][0][1]
    for st, nm in spec['screens']:
        if u >= st: name = nm
    return name


_zplan = {}
def zoom_plan(spec, sid):
    """把 zooms 归一成首尾相接的时间段（秒）。相邻段之间不再硬切，而是让高亮框滑行、卡片交叉淡化。"""
    if sid in _zplan: return _zplan[sid]
    zs = spec.get('zooms', [])
    D = DUR[sid]
    segs = []
    for k, (z0, z1, rect) in enumerate(zs):
        t0 = z0 * D
        t1 = (zs[k + 1][0] * D) if k + 1 < len(zs) else z1 * D
        segs.append((t0, t1, rect, screen_at(spec, z0)))
    tr = 0.55
    if segs:
        tr = min(0.55, 0.42 * min(b - a for a, b, _, _ in segs))
    _zplan[sid] = (segs, tr)
    return _zplan[sid]


def paste_card(im, zi, zpad, cx, cy, alpha, dy, scale=1.0):
    """放大块入场带轻微缩放和位移，不是硬切出现。"""
    if alpha <= 0.015: return
    t = zi
    ox = oy = 0
    if abs(scale - 1.0) > 0.004:
        nw, nh = max(8, int(zi.width * scale)), max(8, int(zi.height * scale))
        t = zi.resize((nw, nh), Image.BILINEAR)
        ox, oy = (zi.width - nw) // 2, (zi.height - nh) // 2
    if alpha < 0.985:
        t = t.copy()
        t.putalpha(t.getchannel('A').point(lambda v: int(v * alpha)))
    im.paste(t, (int(cx - (zpad - 8) + ox), int(cy - (zpad - 8) + oy + dy)), t)


def connector(d, rx1, ry0, ry1, cx, cy, cw, ch, a):
    """从手机上的高亮区牵两条引线到放大块，告诉观众这块是哪来的。"""
    if a <= 0.02: return
    d.polygon([(rx1, ry0), (cx, cy), (cx, cy + ch), (rx1, ry1)],
              fill=(44, 97, 254, int(16 * a)))
    d.line((rx1, ry0, cx, cy), fill=(44, 97, 254, int(90 * a)), width=2)
    d.line((rx1, ry1, cx, cy + ch), fill=(44, 97, 254, int(90 * a)), width=2)


def card_pos(zi, zpad, ry0, ry1):
    cw2, ch2 = zi.width - 2 * zpad + 16, zi.height - 2 * zpad + 16
    cx2 = min(566, SPLIT - 28 - cw2)
    cy2 = max(58, min(H - 58 - ch2, (ry0 + ry1) // 2 - ch2 // 2))
    return cx2, cy2


def draw_app(im, spec, sid, u, t, vframe=None):
    d = ImageDraw.Draw(im, 'RGBA')
    # 右侧：有生成好的镜头就直接用，没有则放定妆照占位
    rp = spec.get('rp')
    if vframe is not None:
        pw = W - SPLIT
        im.paste(vframe, (SPLIT, 0))
    elif rp:
        kind, tag = rp
        src = alex(kind)
        k = 1.0 - 0.055 * u
        cw, ch = int(src.width * k), int(src.height * k)
        ox = int((src.width - cw) * (0.5 + 0.06 * u)); oy = int((src.height - ch) * 0.42)
        crop = src.crop((ox, oy, ox + cw, oy + ch))
        pw = 560; phh = int(pw * crop.height / crop.width)
        card = crop.resize((pw, phh), Image.LANCZOS)
        cx = SPLIT + (W - SPLIT - pw) // 2; cy = (H - phh) // 2 - 92
        sh = Image.new('RGBA', (pw + 80, phh + 80), (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle((40, 48, 40 + pw, 48 + phh), radius=20, fill=(60, 50, 40, 70))
        sh = sh.filter(ImageFilter.GaussianBlur(20))
        im.paste(sh, (cx - 40, cy - 40), sh)
        m = Image.new('L', (pw, phh), 0)
        ImageDraw.Draw(m).rounded_rectangle((0, 0, pw - 1, phh - 1), radius=18, fill=255)
        im.paste(card, (cx, cy), m)
        c = chip('AI 镜头待生成 · ' + tag, font(21), (120, 110, 96), (255, 255, 255, 200), border=(222, 214, 200))
        im.paste(c, (SPLIT + (W - SPLIT - c.width) // 2, cy + phh + 26), c)

    name = screen_at(spec, u)
    ph, pad = phone(name)
    im.paste(ph, (PH_X - pad, PH_Y - pad), ph)

    # ---- 放大：高亮框滑行 + 卡片交叉淡化 ----
    segs, TR = zoom_plan(spec, sid)
    if segs:
        cur = prev = None
        p = 1.0; dim = 1.0
        last_t1 = segs[-1][1]
        if t < segs[0][0]:
            dim = 0.0
        elif t >= last_t1:
            cur = segs[-1]; p = 1.0
            dim = 1.0 - smooth((t - last_t1) / TR)
        else:
            i = 0
            for k, (a, b, _, _) in enumerate(segs):
                if a <= t < b: i = k; break
            cur = segs[i]
            ph_t = t - cur[0]
            if ph_t < TR:
                p = smooth(ph_t / TR)
                prev = segs[i - 1] if i > 0 else None
                if prev is None: dim = p
            else:
                p = 1.0
        if cur is not None and dim > 0.01:
            r_cur = cur[2]
            r_show = r_cur if prev is None else tuple(prev[2][k] + (r_cur[k] - prev[2][k]) * p for k in range(4))
            rx0 = PH_X + SX0 + int(r_show[0] * SW); ry0 = PH_Y + SY0 + int(r_show[1] * SH)
            rx1 = PH_X + SX0 + int(r_show[2] * SW); ry1 = PH_Y + SY0 + int(r_show[3] * SH)
            ov = Image.new('RGBA', (SW, SH), (10, 14, 24, int(78 * dim)))
            ImageDraw.Draw(ov).rounded_rectangle(
                (int(r_show[0] * SW), int(r_show[1] * SH), int(r_show[2] * SW), int(r_show[3] * SH)),
                radius=8, fill=(0, 0, 0, 0))
            im.paste(ov, (PH_X + SX0, PH_Y + SY0), ov)
            d.rounded_rectangle((rx0, ry0, rx1, ry1), radius=8, outline=BRAND + (int(228 * dim),), width=3)

            drift = 3.0 * np.sin(t * 1.15)
            zi, zp = zoom(cur[3], r_cur)
            cx2, cy2 = card_pos(zi, zp, PH_Y + SY0 + int(r_cur[1] * SH), PH_Y + SY0 + int(r_cur[3] * SH))
            cw2, ch2 = zi.width - 2 * zp + 16, zi.height - 2 * zp + 16
            connector(d, rx1, ry0, ry1, cx2, cy2 + drift, cw2, ch2, p * dim)
            if prev is not None:
                zi0, zp0 = zoom(prev[3], prev[2])
                px2, py2 = card_pos(zi0, zp0, PH_Y + SY0 + int(prev[2][1] * SH), PH_Y + SY0 + int(prev[2][3] * SH))
                paste_card(im, zi0, zp0, px2, py2, (1 - p) * dim, -26 * p, 1.0 - 0.035 * p)
                paste_card(im, zi, zp, cx2, cy2, p * dim, 26 * (1 - p) + drift, 0.94 + 0.06 * p)
            else:
                paste_card(im, zi, zp, cx2, cy2, p * dim, 26 * (1 - p) + drift, 0.94 + 0.06 * p)

    if spec.get('fab'):
        fx = PH_X + SX0 + int(0.838 * SW); fy = PH_Y + SY0 + int(0.792 * SH)
        q = (t - segs[0][0] if segs else t) % 1.6 / 1.6
        if q >= 0:
            r = int(16 + 44 * q)
            d.ellipse((fx - r, fy - r, fx + r, fy + r), outline=BRAND + (int(190 * (1 - q)),), width=3)
    if spec.get('thinking'):
        ov = Image.new('RGBA', (SW, SH), (246, 248, 252, 232))
        im.paste(ov, (PH_X + SX0, PH_Y + SY0), ov)
        cx, cy = PH_X + SX0 + SW // 2, PH_Y + SY0 + SH // 2
        import math
        for i in range(10):
            a0 = -math.pi / 2 + i * 0.628 + t * 3.0
            rr = 54; px, py = cx + rr * math.cos(a0), cy + rr * math.sin(a0)
            al = int(230 * (1 - i / 10.0)); sz = 7
            d.ellipse((px - sz, py - sz, px + sz, py + sz), fill=BRAND + (al,))
        f = font(27, 1)
        tw = d.textlength('识别中…', font=f)
        d.text((cx - tw / 2, cy + 90), '识别中…', font=f, fill=INK2)


def draw_slate(im, spec, sid, u):
    d = ImageDraw.Draw(im, 'RGBA')
    # 光束
    beam = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(beam)
    sx = int(-400 + 1700 * ((u * 0.5) % 1.0))
    for i in range(3):
        bd.polygon([(sx + i * 120, 0), (sx + 180 + i * 120, 0), (sx - 260 + i * 120, H), (sx - 440 + i * 120, H)],
                   fill=(255, 252, 244, 26))
    im.paste(Image.alpha_composite(Image.new('RGBA', (W, H)), beam), (0, 0), beam.filter(ImageFilter.GaussianBlur(40)))

    bw, bh = 1360, 700
    bx, by = (W - bw) // 2, (H - bh) // 2 + 10
    sh = Image.new('RGBA', (bw + 120, bh + 120), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((60, 70, 60 + bw, 70 + bh), radius=26, fill=(90, 76, 58, 60))
    im.paste(Image.alpha_composite(Image.new('RGBA', sh.size), sh.filter(ImageFilter.GaussianBlur(26))),
             (bx - 60, by - 60), sh.filter(ImageFilter.GaussianBlur(26)))
    d.rounded_rectangle((bx, by, bx + bw, by + bh), radius=24, fill=(255, 253, 249))

    photo = spec.get('photo')
    txtw = bw - 120
    if photo:
        src = alex(photo)
        k = 1.0 - 0.05 * u
        cw, ch = int(src.width * k), int(src.height * k)
        crop = src.crop(((src.width - cw) // 2, int((src.height - ch) * 0.35),
                         (src.width - cw) // 2 + cw, int((src.height - ch) * 0.35) + ch))
        pw = 470; phh = int(pw * crop.height / crop.width)
        phh = min(phh, bh - 120); pw = int(phh * crop.width / crop.height)
        card = crop.resize((pw, phh), Image.LANCZOS)
        px, py = bx + bw - pw - 56, by + (bh - phh) // 2
        m = Image.new('L', (pw, phh), 0)
        ImageDraw.Draw(m).rounded_rectangle((0, 0, pw - 1, phh - 1), radius=16, fill=255)
        im.paste(card, (px, py), m)
        txtw = bw - pw - 180

    c = chip(f'AI 镜头待生成 · {sid}', font(22, 1), (150, 120, 70), (253, 246, 232, 255), border=(236, 220, 190))
    im.paste(c, (bx + 56, by + 52), c)

    f1, f2, f3 = font(46, 1), font(25, 0, True), font(23)
    y = by + 140
    for ln in wrap(spec['zh'], f1, txtw, d):
        d.text((bx + 56, y), ln, font=f1, fill=INK); y += 64
    y += 14
    for ln in wrap(spec['en'], f2, txtw, d):
        d.text((bx + 56, y), ln, font=f2, fill=INK2); y += 36
    y += 18
    for ln in wrap(spec.get('note', ''), f3, txtw, d):
        d.text((bx + 56, y), ln, font=f3, fill=INK3); y += 34
    if spec.get('freeze') or spec.get('unfreeze'):
        tag = '定格 · 倒带进入出发前' if spec.get('freeze') else '定格解冻 · 回到 08:20'
        c2 = chip(tag, font(22, 1), BRAND, (238, 243, 255, 255), border=(206, 220, 255))
        im.paste(c2, (bx + 56, by + bh - 86), c2)

def draw_title(im, u):
    im.paste(vgrad((W, H), (255, 255, 255), (244, 246, 250)), (0, 0))
    d = ImageDraw.Draw(im, 'RGBA')
    a = min(1.0, u / 0.25)
    f1, f2, f3 = font(92, 2, True), font(32, 0, True), font(24)
    s = 'Landing Check'; tw = d.textlength(s, font=f1)
    d.text(((W - tw) / 2, 392), s, font=f1, fill=INK + (int(255 * a),))
    s2 = 'Your first hour in China, sorted.'; tw = d.textlength(s2, font=f2)
    d.text(((W - tw) / 2, 512), s2, font=f2, fill=INK2 + (int(255 * a),))
    s3 = 'Before the flight · 出发前'; tw = d.textlength(s3, font=f3)
    d.text(((W - tw) / 2, 580), s3, font=f3, fill=INK3 + (int(255 * min(1, max(0, (u - 0.25) / 0.3))),))

def draw_flash(im, u):
    # 纯白一整秒像是出错：前 35% 全白，之后迅速退回下一幕的底色
    k = max(0.0, min(1.0, 1.0 - (u - 0.35) / 0.55))
    base = Image.new('RGB', (W, H), BG)
    base.paste(vgrad((W - SPLIT, H), WARM, (238, 233, 224)), (SPLIT, 0))
    im.paste(Image.blend(base, Image.new('RGB', (W, H), (255, 255, 255)), k), (0, 0))

def draw_outro_grid(im, u):
    im.paste(vgrad((W, H), (255, 255, 255), (243, 245, 249)), (0, 0))
    d = ImageDraw.Draw(im, 'RGBA')
    n = len(OUTRO); colw = W // n
    for i, (label, sid, img) in enumerate(OUTRO):
        on = min(1.0, max(0.0, (u - 0.06 - i * 0.115) / 0.12))
        cx = colw * i + colw // 2
        tw_ = 214; th_ = int(tw_ * 1704 / 786)
        th = export(img).resize((tw_, th_), Image.LANCZOS)
        if on < 1:
            th = Image.blend(th.convert('L').convert('RGB'), th, on)
        m = Image.new('L', (tw_, th_), 0)
        ImageDraw.Draw(m).rounded_rectangle((0, 0, tw_ - 1, th_ - 1), radius=14, fill=int(120 + 135 * on))
        im.paste(th, (cx - tw_ // 2, 258), m)
        f = font(22, 1, True)
        col = tuple(int(INK3[j] + (BRAND[j] - INK3[j]) * on) for j in range(3))
        lines = wrap(label, f, colw - 30, d)
        yy = 258 + th_ + 28
        for ln in lines:
            lw = d.textlength(ln, font=f)
            d.text((cx - lw / 2, yy), ln, font=f, fill=col); yy += 30
        if i < n - 1:
            ax = colw * (i + 1)
            d.text((ax - 10, 258 + th_ // 2 - 26), '›', font=font(46, 1, True), fill=(198, 205, 216))
    f = font(30, 1)
    s = '订单 → 起飞前 → 落地 → 卡住了 → 核验过的答案 → 下一步'
    tw = d.textlength(s, font=f)
    d.text(((W - tw) / 2, 148), s, font=f, fill=INK)

def draw_outro_logo(im, u):
    im.paste(vgrad((W, H), (255, 255, 255), (242, 245, 250)), (0, 0))
    d = ImageDraw.Draw(im, 'RGBA')
    a = min(1.0, u / 0.3)
    f0, f1, f2, f3 = font(40, 2, True), font(84, 2, True), font(30, 0, True), font(24)
    s0 = 'Trip.com'; tw = d.textlength(s0, font=f0)
    d.text(((W - tw) / 2, 330), s0, font=f0, fill=BRAND + (int(255 * a),))
    s1 = 'Landing Check'; tw = d.textlength(s1, font=f1)
    d.text(((W - tw) / 2, 410), s1, font=f1, fill=INK + (int(255 * a),))
    s2 = 'Built into Trip.com.'; tw = d.textlength(s2, font=f2)
    d.text(((W - tw) / 2, 540), s2, font=f2, fill=INK2 + (int(255 * a),))
    s3 = 'Your first hour in China, sorted.'; tw = d.textlength(s3, font=f3)
    d.text(((W - tw) / 2, 596), s3, font=f3, fill=INK3 + (int(255 * a),))

# ---------- 叠加层 ----------
def draw_overlays(im, spec, sid, t_abs, u):
    d = ImageDraw.Draw(im, 'RGBA')
    if spec.get('badge'):
        c = chip(spec['badge'], font(23, 1, True), INK, (255, 255, 255, 225), border=LINE)
        im.paste(c, (W - c.width - 44, 36), c)
    if spec.get('clock'):
        shadow_text(d, (46, 40), spec['clock'], font(24, 0, True), (255, 255, 255), (60, 50, 40, 110))
    # 字幕与旁白
    dlg = narr = None
    for kind, s, e, who, text in CUES[sid]:
        if s - 0.05 <= t_abs <= e + 0.45:
            if kind == 'dialogue': dlg = (who, text)
            else: narr = text
    ybase = 1004
    if dlg:
        who, en = dlg
        zh = ''
        for w2, e2, z2 in DLG.get(sid, []):
            if e2 == en: zh = z2
        fE, fZ = font(36, 2, True), font(28)
        y0 = 872 if narr else 910
        wE, wZ = d.textlength(en, font=fE), d.textlength(zh, font=fZ)
        # 浅色画面上白字看不清，垫一条半透明深色底
        bw = int(max(wE, wZ)) + 76; bx = (W - bw) // 2
        d.rounded_rectangle((bx, y0 - 16, bx + bw, y0 + 100), radius=18, fill=(16, 22, 34, 128))
        d.text(((W - wE) / 2, y0), en, font=fE, fill=(255, 255, 255, 255))
        d.text(((W - wZ) / 2, y0 + 50), zh, font=fZ, fill=(226, 231, 238, 255))
    if narr:
        f = font(26)
        lines = wrap(narr, f, 1420, d)
        hgt = 20 + 36 * len(lines)
        bw = max(int(d.textlength(l, font=f)) for l in lines) + 120
        bx = (W - bw) // 2; by = ybase - hgt + 10
        d.rounded_rectangle((bx, by, bx + bw, by + hgt), radius=hgt // 2, fill=(18, 24, 38, 150))
        d.text((bx + 22, by + 10 + (hgt - 20 - 36 * len(lines)) // 2), '旁白', font=font(21, 1), fill=(150, 185, 255, 255))
        yy = by + 10
        for l in lines:
            d.text((bx + 96, yy), l, font=f, fill=(246, 248, 252, 255)); yy += 36

FOOT = os.path.join(HERE, 'footage')

def footage_path(name):
    for ext in ('.mp4', '.mov', '.m4v', '.webm'):
        p = os.path.join(FOOT, name + ext)
        if os.path.exists(p): return p
    return None


def clip_for(spec, sid):
    """找这一镜要用的素材，按优先级：
    整镜人物戏  footage/<镜号>.mp4
    分屏右侧    footage/<镜号>-r.mp4（这一镜单独生成的）→ footage/<R编号>.mp4（多镜共用的）"""
    if spec['kind'] == 'slate':
        return footage_path(sid)
    rp = spec.get('rp')
    if not rp: return None
    return footage_path(sid + '-r') or footage_path(rp[1].split()[0])


class VideoSource:
    """把素材解码成一串定好尺寸的帧，按需逐帧取；长度不够就定格最后一帧。"""
    def __init__(self, path, size):
        w, h = size
        self.size = size; self.n = w * h * 3; self.last = None
        self.p = subprocess.Popen(
            ['ffmpeg', '-v', 'error', '-i', path, '-vf',
             f'fps={FPS},scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}',
             '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
            stdout=subprocess.PIPE, bufsize=10 ** 8)

    def next(self):
        b = self.p.stdout.read(self.n)
        if b and len(b) == self.n:
            self.last = Image.frombytes('RGB', self.size, b)
        return self.last

    def close(self):
        try:
            self.p.stdout.close(); self.p.wait(timeout=5)
        except Exception:
            self.p.kill()


def render_frame(sid, i, nf, vframe=None):
    spec = SPEC[sid]
    u = i / max(1, nf - 1)
    t_abs = START[sid] + i / FPS
    kind = spec['kind']
    if kind == 'app':
        im = app_base(spec); draw_app(im, spec, sid, u, i / FPS, vframe)
    elif kind == 'slate':
        if vframe is not None:
            im = vframe.copy()
        else:
            im = slate_base(); draw_slate(im, spec, sid, u)
    elif kind == 'title':
        im = Image.new('RGB', (W, H), (255, 255, 255)); draw_title(im, u)
    elif kind == 'flash':
        im = Image.new('RGB', (W, H), (255, 255, 255)); draw_flash(im, u)
    elif kind == 'outro_grid':
        im = Image.new('RGB', (W, H), (255, 255, 255)); draw_outro_grid(im, u)
    else:
        im = Image.new('RGB', (W, H), (255, 255, 255)); draw_outro_logo(im, u)
    if kind not in ('flash',):
        draw_overlays(im, spec, sid, t_abs, u)
    # 镜头首尾的淡入淡出
    fade = 0
    if sid == 'T' or SPEC[sid]['kind'] in ('title', 'outro_logo'): fade = 0
    nfi = {'4-1': 8, '3-4': 4, 'T': 5}.get(sid, 0)
    if nfi and i < nfi:
        im = Image.blend(Image.new('RGB', (W, H), (255, 255, 255)), im, (i + 1) / (nfi + 1))
    if sid == '0-1' and i < FPS:
        im = Image.blend(Image.new('RGB', (W, H), (255, 255, 255)), im, i / FPS)
    if sid == '6-2' and i > nf - FPS * 1.5:
        k = max(0.0, (nf - i) / (FPS * 1.5))
        im = Image.blend(Image.new('RGB', (W, H), (255, 255, 255)), im, k)
    return im

def render_shot(sid):
    spec = SPEC[sid]
    nf = max(1, int(round(DUR[sid] * FPS)))
    src = None
    fp = clip_for(spec, sid)
    if fp:
        size = (W, H) if spec['kind'] == 'slate' else (W - SPLIT, H)
        src = VideoSource(fp, size)
    out = os.path.join(SEG, f'{ORDER.index(sid):02d}_{sid}.mp4')
    p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
                          '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-an',
                          '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
                          '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    for i in range(nf):
        p.stdin.write(render_frame(sid, i, nf, src.next() if src else None).tobytes())
    p.stdin.close(); p.wait()
    if src: src.close()
    return sid, nf

def main():
    os.makedirs(SEG, exist_ok=True)
    args = sys.argv[1:]
    if '--stills' in args:
        os.makedirs(os.path.join(HERE, 'stills'), exist_ok=True)
        for sid in (args[args.index('--only') + 1].split(',') if '--only' in args else ORDER):
            nf = max(1, int(round(DUR[sid] * FPS)))
            uu = float(args[args.index('--u') + 1]) if '--u' in args else 0.72
            render_frame(sid, int(nf * uu), nf).save(os.path.join(HERE, 'stills', f'{sid}.png'))
        print('stills ok'); return
    todo = args[args.index('--only') + 1].split(',') if '--only' in args else ORDER
    with Pool(8) as pool:
        for sid, nf in pool.imap_unordered(render_shot, todo):
            print('done', sid, nf, flush=True)
    with open(os.path.join(SEG, 'list.txt'), 'w') as f:
        for sid in ORDER:
            f.write(f"file '{ORDER.index(sid):02d}_{sid}.mp4'\n")
    mp4 = os.path.join(HERE, 'roughcut.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0',
                    '-i', os.path.join(SEG, 'list.txt'), '-i', os.path.join(HERE, 'roughcut_audio.wav'),
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', mp4], check=True)
    print('wrote', mp4)

if __name__ == '__main__':
    main()
