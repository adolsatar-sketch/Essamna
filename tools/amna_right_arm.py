"""Rebuilds Amna's right arm for the standalone sprite.
In the approved reference her right forearm is hidden behind Isa's sleeve, so the standalone cut had no right arm.
Everything here is re-used from her own art: her left upper sleeve (mirrored), her left forearm fabric and cuff
(turned to hang down), and her real right hand (skin + ring only, Isa's sleeve removed), turned to rest at her side.
usage: python amna_right_arm.py <reference.png> <amna_full.png> <out.png>"""
import sys, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
REF, AMNA, OUT = sys.argv[1:4]
ref = np.asarray(Image.open(REF).convert("RGB")).astype(np.float32)
am = np.asarray(Image.open(AMNA).convert("RGBA")).astype(np.float32)
H, W = am.shape[:2]
def poly(pts, feather=0):
    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    if feather: m = m.filter(ImageFilter.GaussianBlur(feather))
    return np.asarray(m, dtype=np.float32) / 255

def layer_from(src_rgb, mask):            # RGBA float layer
    return np.dstack([src_rgb, mask * 255])

def transform(layer, M, size=(W, H)):     # affine warp of an RGBA layer (premultiplied to avoid dark fringes)
    a = layer[:, :, 3:4] / 255; pm = np.dstack([layer[:, :, :3] * a, a])
    out = cv2.warpAffine(pm, M, size, flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    al = np.clip(out[:, :, 3:4], 0, 1); rgb = np.where(al > 1e-4, out[:, :, :3] / np.maximum(al, 1e-4), 0)
    return np.dstack([np.clip(rgb, 0, 255), al * 255])

def solidify(layer, k=15):                 # close small notches in a layer's outline, filling colour from its neighbours
    a = layer[:, :, 3] / 255
    closed = cv2.morphologyEx((a > .5).astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    new = ((closed > 0) & (a < .5)).astype(np.uint8) * 255
    rgb8 = np.clip(layer[:, :, :3], 0, 255).astype(np.uint8)
    rgb8 = cv2.inpaint(rgb8, new, 7, cv2.INPAINT_TELEA)
    a2 = np.maximum(a, cv2.GaussianBlur(closed.astype(np.float32), (3, 3), 0))
    return np.dstack([rgb8.astype(np.float32), a2 * 255])

def over(dst, src):                       # src over dst
    sa = src[:, :, 3:4] / 255; da = dst[:, :, 3:4] / 255
    oa = sa + da * (1 - sa)
    rgb = np.where(oa > 1e-4, (src[:, :, :3] * sa + dst[:, :, :3] * da * (1 - sa)) / np.maximum(oa, 1e-4), 0)
    return np.dstack([rgb, oa * 255])

rgb = am[:, :, :3]; alpha = am[:, :, 3] / 255
lum = rgb.mean(axis=2)

# 1) upper sleeve: her left upper sleeve (light fabric only), mirrored onto her right side
up_poly = [(728, 366), (775, 371), (806, 385), (819, 418), (822, 466), (842, 492), (846, 522), (840, 548), (826, 562), (822, 600), (735, 606), (721, 560), (718, 480), (721, 420)]
up = poly(up_poly, 1.5) * alpha * (lum > 140)
up = cv2.morphologyEx(up, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)) * poly(up_poly, 1.5) * alpha
A = 647.5                                  # mirror axis: the sleeve's inner seam lands on her right shoulder
M_up = np.float32([[-1, 0, 2 * A], [0, 1, 0]])
upper = solidify(transform(layer_from(rgb, up), M_up), 17)

# 2) forearm fabric: the straight part of her left forearm (near the cuff), turned to hang straight down
fa_poly = [(630, 590), (700, 578), (766, 576), (768, 690), (700, 696), (630, 690)]
fa = poly(fa_poly, 1.5) * alpha * (lum > 140)
fa = cv2.morphologyEx(fa, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)) * poly(fa_poly, 1.5) * alpha
cx, cy = 699, 636                          # forearm centre in the reference
M_fa = cv2.getRotationMatrix2D((cx, cy), 90, 1.0)       # elbow end (right) goes to the top
M_fa = np.vstack([M_fa, [0, 0, 1]])
S_ = np.float32([[0.84, 0, 0], [0, 1.0, 0], [0, 0, 1]])  # a little slimmer than the elbow puff
T1 = np.float32([[1, 0, -cx], [0, 1, -cy], [0, 0, 1]]); T2 = np.float32([[1, 0, 522], [0, 1, 672], [0, 0, 1]])
R = np.vstack([cv2.getRotationMatrix2D((0, 0), 90, 1.0), [0, 0, 1]])
M = (T2 @ S_ @ R @ T1)[:2]
fore = transform(layer_from(rgb, fa), M.astype(np.float32))
fore = transform(fore, np.float32([[-1, 0, 2 * 522], [0, 1, 0]]))   # outer fold faces outwards

# 3) cuff: her left cuff (vertical band) turned into a horizontal band at the wrist
cf_poly = [(566, 598), (600, 592), (628, 600), (630, 686), (600, 690), (568, 684)]
cf = poly(cf_poly, 1.2) * alpha * (lum > 150)
M_cf = cv2.getRotationMatrix2D((598, 641), 90, 0.9); M_cf[0, 2] += 522 - 598; M_cf[1, 2] += 748 - 641
cuff = transform(layer_from(rgb, cf), M_cf)

# 4) her real right hand (it held Isa's sleeve): keep skin, nails and the ring, drop the brown sleeve and the old cuff
hand_poly = [(455, 570), (457, 540), (475, 510), (495, 487), (502, 490), (500, 500), (515, 502), (540, 512), (542, 522), (537, 530), (537, 540), (535, 550), (525, 555), (502, 557), (495, 570), (485, 580), (480, 592), (466, 592)]
r, g, b = ref[:, :, 0], ref[:, :, 1], ref[:, :, 2]
skin = (r > 150) & (r > g) & (g > b) & ((r - b) > 28)
ring = (np.abs(r - g) < 22) & (np.abs(g - b) < 26) & (r > 120) & (r < 235)
hm = poly(hand_poly, 0.8) * np.clip((skin | ring).astype(np.float32), 0, 1)
hm = cv2.morphologyEx(hm, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
hm = cv2.GaussianBlur(hm, (3, 3), 0)
wrist, tips = (470, 578), (538, 506)       # wrist → fingertips points up-right; turn it to point down
theta = np.degrees(np.arctan2(tips[1] - wrist[1], tips[0] - wrist[0]))   # -47°: up-right
ang_h = -(84 - theta)                     # cv2 turns counter-clockwise; aim the fingers down, a touch inward
M_h = cv2.getRotationMatrix2D(wrist, ang_h, 1.0); M_h[0, 2] += 526 - wrist[0]; M_h[1, 2] += 760 - wrist[1]
hand = transform(layer_from(ref, hm), M_h)

# compose: hand behind cuff, forearm, then upper sleeve on top at the elbow, all behind the body edge slightly
arm = np.zeros_like(am)
for part in (hand, fore, cuff, upper): arm = over(arm, part)
# order: body < right arm < her left forearm and hand (that arm crosses in front of everything)
def amn(px, py): return (418 + px * 5.81, 149 + py * 13.59)
LEFT_FORE = [amn(*q) for q in [(6, 26), (25, 26), (30, 31), (44, 32), (58, 33), (60, 41), (40, 41), (26, 39.5), (6, 37)]]
left = am.copy(); left[:, :, 3] = am[:, :, 3] * poly(LEFT_FORE, 1.2)
# fill background pockets that are fully enclosed by her silhouette (between the new sleeve and the bodice)
U = (np.maximum(am[:, :, 3], arm[:, :, 3]) > 128).astype(np.uint8)
ff = U.copy() * 255; mask = np.zeros((H + 2, W + 2), np.uint8)
cv2.floodFill(ff, mask, (0, 0), 128)
holes = ((ff == 0)).astype(np.uint8)
holes = cv2.dilate(holes, np.ones((3, 3), np.uint8))
body = am.copy()
rgb8 = cv2.inpaint(np.clip(body[:, :, :3], 0, 255).astype(np.uint8), holes * 255, 9, cv2.INPAINT_TELEA)
body[:, :, :3] = np.where(holes[:, :, None] > 0, rgb8, body[:, :, :3])
body[:, :, 3] = np.maximum(body[:, :, 3], holes * 255.0)
print("filled px", int(holes.sum()))
Image.fromarray(np.clip(body, 0, 255).astype(np.uint8), "RGBA").save(OUT.replace(".png", "_body.png"))
out = over(over(body, arm), left)
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA").save(OUT)
Image.fromarray(np.clip(arm, 0, 255).astype(np.uint8), "RGBA").save(OUT.replace(".png", "_armR.png"))
print("ok", ang_h)
