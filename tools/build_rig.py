"""Cuts the approved Isa/Amna character art into animation layers (one exact partition per character).
usage: python build_rig.py <dir with isa_full.png amna_full.png pair_full.png> <repo_root>
Every part is a full-frame transparent WebP, so the rig only rotates/skews whole layers — no clip-path ghosts.
Polygons are written in the ORIGINAL reference pixel space (1024x1536), so the pair reuses the same cuts."""
import sys, os, json, numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, root = sys.argv[1], sys.argv[2]
out = os.path.join(root, "assets", "characters"); os.makedirs(out, exist_ok=True)
FULL = (1024, 1536)
# crop boxes used for the sprites (x0, y0, x1, y1) in reference pixels — same as the exported sprites
BOX = {"isa": (75, 18, 572, 1505), "amna": (418, 149, 999, 1508), "pair": (76, 18, 999, 1507)}

def isa(px, py): return (75 + px * 4.97, 18 + py * 14.87)        # Isa sprite % -> reference px
def amn(px, py): return (418 + px * 5.81, 149 + py * 13.59)      # Amna sprite % -> reference px
I = lambda pts: [isa(*p) for p in pts]
A = lambda pts: [amn(*p) for p in pts]

ISA_HEAD = I([(38,-2),(92,-2),(92,13),(80,13.6),(74,14.6),(66,15.6),(56,16.2),(50,14),(47,12.5),(44,12),(38,10)])
ISA_SEAM = [(49,50),(49,62),(47,72),(45.5,82),(44.5,88),(44,91),(43,96),(45,101)]
ISA_LEGL = I([(-2,51)] + ISA_SEAM + [(-2,101)])
ISA_LEGR = I([(102,51)] + ISA_SEAM + [(102,101)])
AMNA_HEAD = A([(16,-2),(64,-2),(64,9),(56,12),(50,13.2),(42,14),(34,13.6),(26,12.5),(16,11)])
AMNA_DRAPE = A([(63,12),(102,18),(102,56),(74,56),(70,46),(66.5,40),(66,17)])
AMNA_ARM = A([(6,26),(25,26),(30,31),(44,32),(58,33),(60,41),(40,41),(26,39.5),(6,37)])
AMNA_SKIRT = A([(-2,39.5),(66.5,39.5),(70,46),(74,56),(102,56),(102,101),(-2,101)])

PARTS = {   # name: (polygon, pivot in reference px, z)
  "isa":  {"legL":(ISA_LEGL, isa(30,52), 1), "legR":(ISA_LEGR, isa(64,52), 1), "head":(ISA_HEAD, isa(60,15), 5)},
  "amna": {"skirt":(AMNA_SKIRT, amn(44,40), 2), "drape":(AMNA_DRAPE, amn(66,18), 4), "arm":(AMNA_ARM, amn(58,37), 4), "head":(AMNA_HEAD, amn(40,13), 5)},
  "pair": {"legL":(ISA_LEGL, isa(30,52), 1), "legR":(ISA_LEGR, isa(64,52), 1), "skirt":(AMNA_SKIRT, amn(44,40), 2),
           "drape":(AMNA_DRAPE, amn(66,18), 4), "ihead":(ISA_HEAD, isa(60,15), 5), "ahead":(AMNA_HEAD, amn(40,13), 5)},
}
# Isa's side of the gap between them (same edge as the separation step)
ISA_SIDE = [(0,0),(562,0),(562,300),(560,380),(553,470),(553,560),(561,590),(565,620),(561,650),(546,676),(536,700),(525,760),(495,900),(470,1100),(430,1300),(418,1400),(414,1536),(0,1536)]
def mask(poly, feather=2.0):
    m = Image.new("L", FULL, 0); ImageDraw.Draw(m).polygon(poly, fill=255)
    return np.asarray(m.filter(ImageFilter.GaussianBlur(feather)), dtype=np.float32) / 255

AMNA_HAND_OUT = A([(4,25),(24.5,25),(24.5,38.5),(4,38.5)])   # the hand sticks out past her body; nothing of the core stays behind it
def grow(m, px): return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(px * 2 + 1)), dtype=np.float32) / 255
def shrink(m, px): return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(px * 2 + 1)), dtype=np.float32) / 255
rig = {}
for who, parts in PARTS.items():
    im = Image.open(os.path.join(src, f"{who}_full.png")).convert("RGBA")
    rgba = np.asarray(im).astype(np.float32); alpha = rgba[:, :, 3] / 255
    x0, y0, x1, y1 = BOX[who]; cw, ch = x1 - x0, y1 - y0
    size = (round(cw * 1000 / ch), 1000)
    entry = {"ar": round(size[0] / size[1], 5), "parts": {}}
    def save(name, a):
        arr = rgba.copy(); arr[:, :, 3] = np.clip(a, 0, 1) * 255
        Image.fromarray(arr.astype(np.uint8), "RGBA").crop(BOX[who]).resize(size, Image.LANCZOS).save(
            os.path.join(out, f"{who}-{name}.webp"), "WEBP", quality=90, method=6)
    side = mask(ISA_SIDE, 0)
    rows = np.arange(FULL[1])[:, None]
    keep = np.ones_like(alpha)          # what the core keeps
    upper_taken = np.zeros_like(alpha)
    for name, (poly, piv, z) in sorted(parts.items(), key=lambda kv: -kv[1][2]):
        m = mask(poly, 0)
        if who == "pair" and name in ("legL", "legR"): m = m * side
        if who == "pair" and name == "skirt": m = m * (1 - side)
        if name == "drape":   # only the hijab fabric swings; dress pixels inside the outline stay on the core
            lum = rgba[:, :, :3].mean(axis=2); m = m * (lum < 178)
        if z >= 4:
            m = m * (1 - upper_taken); upper_taken = np.maximum(upper_taken, m)
            save(name, alpha * m)                       # the core keeps a copy behind it (no hole when it tilts)
        else:
            lay = grow(m, 4)
            if who == "pair" and name in ("legL", "legR"): lay = lay * side
            if who == "pair" and name == "skirt": lay = lay * (1 - side)
            save(name, alpha * lay * (1 - upper_taken * 0))
            top = int(np.argmax(m.any(axis=1)))
            keep = keep * (1 - m * (rows > top + 55))   # the waist/hip band stays on the core
        entry["parts"][name] = {"z": z, "o": [round((piv[0] - x0) / cw * 100, 2), round((piv[1] - y0) / ch * 100, 2)]}
    if who == "amna": keep = keep * (1 - mask(AMNA_HAND_OUT, 0))
    if who == "pair":  # Amna's arm stays on Isa's arm in the pair; nothing to cut
        pass
    save("core", alpha * keep)
    entry["parts"]["core"] = {"z": 3, "o": [50, 50]}
    rig[who] = entry
open(os.path.join(root, "story", "rig-data.js"), "w", encoding="utf-8").write(
    "/* يتولّد من tools/build_rig.py — نقاط الدوران لكل جزء (نسبة مئوية من الصورة). */\nconst RIG_DATA = " + json.dumps(rig, ensure_ascii=False) + ";\n")
print(json.dumps(rig, indent=1))
