"""Builds Amna's SOLO rig from the approved solo character art (Amna_Bride_Solo_Character.png).
usage: python build_amna_solo.py <Amna_Bride_Solo_Character.png> <repo_root>

Only her solo appearances use this; the Isa+Amna pair (pair-*.webp) is NOT touched.
Nothing is redrawn or stretched: every layer is a full-frame cut of the same pixels, scaled uniformly.
  core   — body, both arms and both hands (never split, so a hand can't be cut off)
  head   — head + hijab top, tilts a little around the neck
  drape  — the hijab tail on her left side, sways behind the sleeve
  skirt  — the lower skirt (and shoes) below the hands, sways from the hip line (skew, no tearing)
  blinkL / blinkR — eyelids made from her own skin around each eye (inpaint) + a closed lash line;
                    shown only for a split second while blinking
Writes assets/characters/amna-<part>.webp, amna.webp (still) and updates the "amna" entry in story/rig-data.js."""
import sys, os, json, re
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter

src, root = sys.argv[1], sys.argv[2]
out = os.path.join(root, "assets", "characters")
im = Image.open(src).convert("RGBA")
W, H = im.size
rgba = np.asarray(im).astype(np.float32)
a = rgba[:, :, 3] / 255
rgb = rgba[:, :, :3]
ys, xs = np.where(a > .04)
top, bot = ys.min(), ys.max()
# horizontal centre = between her feet, so the character stands on its x and mirrors around it
feet = a[bot - 120:bot + 1]
cx = float((feet.sum(0) * np.arange(W)).sum() / feet.sum())
half = max(cx - xs.min(), xs.max() - cx) + 6
BOX = (int(round(cx - half)), int(top) - 3, int(round(cx + half)), int(bot) + 4)
x0, y0, x1, y1 = BOX; cw, ch = x1 - x0, y1 - y0
size = (round(cw * 1000 / ch), 1000)
rows = np.arange(H, dtype=np.float32)[:, None] + np.zeros((1, W), np.float32)
cols = np.arange(W, dtype=np.float32)[None, :] + np.zeros((H, 1), np.float32)
ramp = lambda v, a0, a1: np.clip((v - a0) / (a1 - a0), 0, 1)

def poly(pts, feather=0):
    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    if feather: m = m.filter(ImageFilter.GaussianBlur(feather))
    return np.asarray(m, np.float32) / 255

def save(name, col, alpha):
    arr = np.dstack([col, np.clip(alpha, 0, 1) * 255]).astype(np.uint8)
    # BOX can reach past the canvas on the empty side: pad with transparency, never stretch
    pad = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    pad.alpha_composite(Image.fromarray(arr, "RGBA").crop((max(x0, 0), max(y0, 0), min(x1, W), min(y1, H))), (max(0, -x0), max(0, -y0)))
    pad.resize(size, Image.LANCZOS).save(os.path.join(out, f"amna-{name}.webp" if name else "amna.webp"), "WEBP", quality=90, method=6)

pct = lambda px, py: [round((px - x0) / cw * 100, 2), round((py - y0) / ch * 100, 2)]
keep = np.ones((H, W), np.float32)      # what the core keeps
parts = {}

# ---- head: everything above the neck line, a 24px blend band so the tilt never shows a seam
SY = 240
head_a = a * ramp(-rows, -(SY + 12), -(SY - 12))
keep *= 1 - (1 - ramp(rows, SY - 30, SY - 18))
save("head", rgb, head_a)
parts["head"] = {"z": 5, "o": pct(470, SY + 4)}

# ---- hijab tail: mauve fabric right of her left sleeve
lum = rgb.mean(2); r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
skin = (r > 150) & (r - b > 38)
hij = (lum < 185) & ~skin & (a > .02)
tail_poly = poly([(612, 250), (720, 262), (800, 340), (850, 520), (860, 800), (760, 805), (700, 700), (688, 560), (675, 420), (650, 330), (612, 300)])
m = cv2.morphologyEx((hij * (tail_poly > .5)).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)).astype(np.float32)
m = cv2.GaussianBlur(m, (0, 0), 1.0)
top_fade = ramp(rows, 262, 286)
drape_a = a * m * top_fade
# behind the sleeve: continue the fabric a few px under the dress so a sway never opens a gap
under = cv2.dilate((m > .5).astype(np.uint8), np.ones((17, 17), np.uint8)).astype(bool) & ~(m > .5) & (a > .9) & (tail_poly > .5)
fill_rgb = cv2.inpaint(np.clip(rgb, 0, 255).astype(np.uint8), (under.astype(np.uint8) * 255), 6, cv2.INPAINT_TELEA).astype(np.float32)
d_rgb = np.where(under[:, :, None], fill_rgb, rgb)
drape_a = np.maximum(drape_a, under * top_fade)
keep *= 1 - m * ramp(rows, 282, 296)
save("drape", d_rgb, drape_a)
parts["drape"] = {"z": 2, "o": pct(655, 272)}

# ---- skirt: below her hands; skews from the hip line so the band never tears
SK = 868
sk_a = a * ramp(rows, SK - 12, SK + 12)
keep *= 1 - ramp(rows, SK + 14, SK + 26)
save("skirt", rgb, sk_a)
parts["skirt"] = {"z": 1, "o": pct(cx, SK)}

save("core", rgb, a * keep)
parts["core"] = {"z": 3, "o": [50, 50]}

# ---- eyelids (closed) from her own skin: inpaint the eye opening, then a soft closed lash line
EYES = {
    "blinkL": {"open": [(418, 138), (424, 132.5), (432, 130), (441, 130.5), (448, 134), (452, 139), (446, 144), (436, 146), (425, 144.5)],
               "lash": [(418, 139), (426, 142.5), (435, 144), (444, 142.5), (452, 138.5)], "o": (435, 131)},
    "blinkR": {"open": [(463, 131.5), (469, 124), (477, 119), (486, 116.5), (494, 117.5), (494, 123), (487, 129), (477, 133), (468, 134)],
               "lash": [(463, 132), (471, 130.5), (479, 128), (487, 124.5), (495, 119.5)], "o": (480, 118)},
}
for name, e in EYES.items():
    hole = poly(e["open"]) > .5
    ys_, xs_ = np.where(hole)
    lid = rgb.copy()
    # her own skin tone right around this eye (a ring outside the lashes), so the lid matches the face
    ring = cv2.dilate(hole.astype(np.uint8), np.ones((15, 15), np.uint8)).astype(bool) & ~cv2.dilate(hole.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
    sk_ = ring & skin & (lum > 130)
    c = np.median(rgb[sk_], axis=0)
    for x in range(xs_.min(), xs_.max() + 1):
        col = np.where(hole[:, x])[0]
        if not len(col): continue
        t0, t1 = col.min(), col.max()
        for y in range(t0, t1 + 1):
            k = (y - t0) / max(1, t1 - t0)
            lid[y, x] = c * (.93 - .07 * k)       # a closed lid is a touch darker than the cheek, deepest at the lash line
    lim = Image.fromarray(np.clip(lid, 0, 255).astype(np.uint8), "RGB").filter(ImageFilter.GaussianBlur(.8))
    d = ImageDraw.Draw(lim)
    d.line(e["lash"], fill=(78, 50, 44), width=2, joint="curve")          # closed lash line (soft, not drawn-on)
    lim = lim.filter(ImageFilter.GaussianBlur(.5))
    lid = np.asarray(lim, np.float32)
    al = np.asarray(Image.fromarray((hole * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(.9)), np.float32) / 255
    save(name, lid, al * a)
    parts[name] = {"z": 6, "o": pct(*e["o"]), "blink": 1}

save("", rgb, a)   # still sprite
entry = {"ar": round(size[0] / size[1], 5), "parts": parts}

rd = os.path.join(root, "story", "rig-data.js")
txt = open(rd, encoding="utf-8").read()
data = json.loads(re.search(r"const RIG_DATA = (\{.*\});", txt, re.S).group(1))
data["amna"] = entry
open(rd, "w", encoding="utf-8").write(
    "/* يتولّد من tools/build_rig.py (عيسى والثنائي) وtools/build_amna_solo.py (آمنة وحدها) — نقاط الدوران لكل جزء (نسبة مئوية من الصورة). */\nconst RIG_DATA = "
    + json.dumps(data, ensure_ascii=False) + ";\n")
print("box", BOX, "cx", round(cx, 1), json.dumps(entry))
