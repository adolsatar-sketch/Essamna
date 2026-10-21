"""Builds web derivatives of the original uploads (originals stay untouched outside the repo).
usage: python build_photos.py <uploads_dir> <repo_root>
Writes assets/photos/<id>-480.webp and <id>-1280.webp (metadata stripped), data/photos.js and ASSET_INDEX.md."""
import sys, os, glob, json
from PIL import Image, ImageOps
sys.path.insert(0, os.path.dirname(__file__))
from photos_manifest import P, EXCLUDED, ROTATE

src, root = sys.argv[1], sys.argv[2]
out = os.path.join(root, "assets", "photos"); os.makedirs(out, exist_ok=True)
STATIONS = {"palace":"القصر الروماني","story":"ستوري العرسان","engagement":"يوم خطوبتهم","valentine":"أول عيد حب","cinema":"أول سينما","isabday":"عيد ميلاد عيسى","court":"عقد المحكمة","keys":"مفتاح الشقة","furniture":"الأثاث","amnabday":"عيد ميلاد آمنة","suit":"البدلة","wedding":"يوم الزفاف — الموعد المنتظر"}
cat = []
rows = []
for (pid, pre, title, date, sort, tag, station, desc, conf) in P:
    files = sorted(f for f in glob.glob(os.path.join(src, pre + "*")) if not os.path.basename(f).startswith("."))
    if not files: raise SystemExit("missing " + pre)
    f = files[0]
    im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
    if pre in ROTATE: im = im.rotate(ROTATE[pre], expand=True)
    w, h = im.size
    for size, q in ((480, 78), (1280, 82)):
        c = im.copy()
        if max(c.size) > size: c.thumbnail((size, size), Image.LANCZOS)
        c.save(os.path.join(out, f"{pid}-{size}.webp"), "WEBP", quality=q, method=6)
    cat.append({"id": pid, "t": title, "d": date, "s": sort, "tag": tag, "st": station, "desc": desc, "ar": round(w / h, 4)})
    rows.append((os.path.basename(f), pid, title, desc, STATIONS.get(station, "حائط الذكريات"), date or "غير معروف", conf))
os.makedirs(os.path.join(root, "data"), exist_ok=True)
with open(os.path.join(root, "data", "photos.js"), "w", encoding="utf-8") as fh:
    fh.write("/* مكتبة الصور — تتولّد من tools/photos_manifest.py (لا تعدّلها يدوياً). */\n")
    fh.write("const PHOTOS = " + json.dumps(cat, ensure_ascii=False, indent=0) + ";\n")
    fh.write("const PHOTO = Object.fromEntries(PHOTOS.map(p => [p.id, p]));\n")
    fh.write('const photoSrc = (id, size=1280) => `assets/photos/${id}-${size}.webp`;\n')
    fh.write('const photoSet = id => `assets/photos/${id}-480.webp 480w, assets/photos/${id}-1280.webp 1280w`;\n')
md = ["# فهرس الصور — ASSET_INDEX", "",
      "كل صورة مستخدمة بالموقع هي نسخة مصغّرة (WebP، بدون بيانات EXIF/الموقع) من ملف أصلي رفعه صاحب المشروع. الملفات الأصلية ما انعدلت وما انرفعت للمستودع.",
      "التاريخ ينكتب بس إذا كان مقروء بالصورة نفسها أو ثابت بخط الحكاية؛ غير ذلك «غير معروف».", "",
      "| الملف الأصلي | المعرّف | العنوان | شنو يبين بشكل موثوق | المحطة/القسم | التاريخ | الثقة |", "|---|---|---|---|---|---|---|"]
for r in rows: md.append("| " + " | ".join(x.replace("|", "/") for x in r) + " |")
md += ["", "## ملفات انفحصت وما انعرضت", "", "| بداية اسم الملف | شنو هو | السبب |", "|---|---|---|"]
for e in EXCLUDED: md.append("| " + " | ".join(e) + " |")
md += ["", "## الشخصيات", "",
       "- `assets/characters/isa.webp` و`amna.webp`: مقصوصة من المرجع المعتمد `isa_amna_identity_character_reference.png` (فصل الخلفية بنموذج BiRefNet، وفصل الشخصيتين يدوياً؛ مكان إيدين آمنة على ذراع عيسى انملأ من قماش قميصه نفسه).",
       "- `assets/characters/pair.webp`: نفس المرجع كامل (ماشين إيد بإيد) للمشاهد اللي يمشون بيها سوه.",
       "- `assets/characters/adool.webp`: ملف عدول الرسمي من مشروع إيلاف (`ADOOL_OFFICIAL_CHARACTER.png`) بحجم أصغر."]
open(os.path.join(root, "ASSET_INDEX.md"), "w", encoding="utf-8").write("\n".join(md) + "\n")
print(len(cat), "photos")
