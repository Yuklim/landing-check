#!/usr/bin/env python3
"""把定妆照裁成干净素材并统一到片子的日系清新色调。
原图下半部有平台字幕和 INFJ 贴纸，只取 y<570 的干净区域。"""
import os
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, 'assets')

def grade(im, desat=0.42, warm=(1.035, 1.005, 0.955), lift=14, gamma=0.96):
    """粉背景 -> 暖白；低对比高亮部的日系调。"""
    im = ImageEnhance.Color(im).enhance(1 - desat)
    a = np.asarray(im).astype(np.float32) / 255.0
    a = a ** gamma
    a = a * np.array(warm, dtype=np.float32)
    a = a * (1 - lift / 255.0) + lift / 255.0          # lift blacks
    a = np.clip(a, 0, 1)
    # 轻微柔光：和自身的高斯模糊做 screen 混合，制造清晨漫射感
    base = Image.fromarray((a * 255).astype(np.uint8))
    blur = base.filter(ImageFilter.GaussianBlur(18))
    b = np.asarray(blur).astype(np.float32) / 255.0
    a = 1 - (1 - a) * (1 - b * 0.22)
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))

def replace_backdrop(im, bg_top=(247, 242, 234), bg_bot=(233, 227, 217), feather=1.3):
    """影棚粉背景换成暖奶白。粉色背景的蓝通道高于绿通道(B-G≈+12)，
    皮肤(-16)、衣服(-1)、头发(+2)、白衬衫(+2,R-G=6)都不满足，再取与画面边缘连通的部分。"""
    import scipy.ndimage as ndi
    a = np.asarray(im).astype(np.int16)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    cand = (b - g >= 5) & (r > 150) & (r - g > 25)   # 含人物边缘的粉色阴影 halo
    lab, _ = ndi.label(cand)                                      # 先标记，形态学放后面
    edge = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1])
    edge.discard(0)
    bgm = np.isin(lab, list(edge))                                # 只要与画面边缘连通的背景
    # border_value=1：scipy 默认把画面外当背景，会把最外一圈侵蚀掉
    bgm = ndi.binary_closing(bgm, np.ones((7, 7)), border_value=1)
    bgm = ndi.binary_opening(bgm, np.ones((3, 3)), border_value=1)
    mask = Image.fromarray((bgm * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(feather))
    k = np.asarray(mask).astype(np.float32)[:, :, None] / 255.0
    h = a.shape[0]
    yy = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    bg = np.array(bg_top, dtype=np.float32) * (1 - yy) + np.array(bg_bot, dtype=np.float32) * yy
    out = a.astype(np.float32) * (1 - k) + bg * k
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def main():
    raw = Image.open(os.path.join(A, 'alex_raw.jpg')).convert('RGB')
    W, _ = raw.size
    clean = raw.crop((0, 0, W, 570))                   # 文字之上的干净区
    clean = replace_backdrop(clean)
    clean = grade(clean, desat=0.30, lift=10)
    clean.save(os.path.join(A, 'alex_portrait.png'))

    # 近景：脸部为中心，给反应镜头用
    face_cx, face_cy = 352, 300
    for name, half_w, half_h in [('close', 210, 268), ('medium', 330, 285)]:
        x0 = max(0, face_cx - half_w); x1 = min(W, face_cx + half_w)
        y0 = max(0, face_cy - half_h); y1 = min(570, face_cy + half_h)
        clean.crop((x0, y0, x1, y1)).save(os.path.join(A, f'alex_{name}.png'))
    print('portrait', clean.size)
    for n in ('close', 'medium'):
        print(n, Image.open(os.path.join(A, f'alex_{n}.png')).size)

if __name__ == '__main__':
    main()
