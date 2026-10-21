/* =====================================================================
   حائط ذكرياتنا — جدار صور حقيقي.
   • الصور الأصلية (data/photos.js) معلّقة من البداية.
   • الذكريات اللي تنضاف تنحفظ بـ IndexedDB بهذا المتصفح (الصورة نفسها + البيانات).
   • الصور الأصلية تتعدّل نصوصها أو تنشال من الحائط (تنحفظ كتعديل محلي).
   ===================================================================== */
const Wall = (() => {
  /* ---------- قاعدة البيانات ---------- */
  const DBN = "hk-wall";
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    try { const r = indexedDB.open(DBN, 1); r.onupgradeneeded = () => r.result.createObjectStore("mem", { keyPath: "id" }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); }
  }));
  const tx = (mode, fn) => open().then(db => new Promise((res, rej) => { const t = db.transaction("mem", mode); const out = fn(t.objectStore("mem")); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }));
  const DB = { all: () => tx("readonly", s => s.getAll()), put: r => tx("readwrite", s => s.put(r)), del: id => tx("readwrite", s => s.delete(id)), clear: () => tx("readwrite", s => s.clear()) };
  let dbOK = true;
  const urls = {};
  const blobUrl = r => urls[r.id + r.updated] || (urls[r.id + r.updated] = URL.createObjectURL(r.blob));

  /* ---------- تعديلات الصور الأصلية ---------- */
  const edits = () => Store.get("wallEdits", { hidden: {}, over: {} });
  const saveEdits = e => Store.set("wallEdits", e);

  /* ---------- تواريخ ---------- */
  const isoToLabel = iso => { if (!iso) return ""; const [y, m, d] = iso.split("-").map(Number); return `${d}/${m}/${y}`; };
  const yearOf = it => (it.s || "").slice(0, 4) || "";
  const TAGS = ["صورنا", "طلعاتنا", "مناسباتنا", "أعياد ميلاد", "بيتنا", "هدايانا", "احتفالاتنا", "أماكن"];

  async function items() {
    const e = edits();
    const seeds = PHOTOS.filter(p => !e.hidden[p.id]).map(p => { const o = e.over[p.id] || {}; return { id: p.id, seed: true, t: o.t ?? p.t, d: o.d ?? p.d, s: o.s ?? p.s, tag: o.tag ?? p.tag, desc: o.desc ?? p.desc, by: o.by ?? "من الصور الأصلية", ar: p.ar, thumb: photoSrc(p.id, 480), full: photoSrc(p.id, 1280), set: photoSet(p.id) }; });
    let mine = [];
    try { mine = (await DB.all()) || []; dbOK = true; } catch (err) { dbOK = false; }
    mine = mine.map(r => ({ id: r.id, seed: false, t: r.title, d: r.date ? isoToLabel(r.date) : (r.dateText || null), s: r.date || null, tag: r.tag || "صورنا", desc: r.desc || "", by: r.by || "", ar: r.ar || 1, thumb: blobUrl(r), full: blobUrl(r), rec: r }));
    // الأحدث إضافةً أول، بعدين المؤرّخة بالترتيب، بعدين اللي بلا تاريخ
    mine.sort((a, b) => b.rec.created - a.rec.created);
    seeds.sort((a, b) => (a.s ? 0 : 1) - (b.s ? 0 : 1) || (a.s || "").localeCompare(b.s || ""));
    return mine.concat(seeds);
  }

  /* ---------- الحائط ---------- */
  const FRAMES = ["gold", "wood", "white", "black", "gold2"];
  function view(root) {
    let all = [], q = "", tag = "all", year = "all", loading = true;
    const v = h(`<section class="view page wall-page"><div class="page-inner">
      <header class="page-head"><div><h1>حائط ذكرياتنا</h1><p class="page-sub">كل إطار ذكرى. المسوه يفتح الصورة كاملة ويا تاريخها ووصفها.</p></div>
        <div class="row"><span class="wl-count" aria-live="polite"></span><button class="btn gold" data-add>${IC.plus} إضافة ذكرى</button></div></header>
      <div class="wl-note" role="note">${IC.bulb}<span>الذكريات اللي تضيفونها تنحفظ <b>بهذا المتصفح على هذا الجهاز</b> فقط، وما تتزامن تلقائياً ويا الأجهزة الثانية. للنقل: الإعدادات ← تصدير نسخة احتياطية.</span></div>
      <div class="wl-tools">
        <label class="wl-search">${IC.search}<input type="search" placeholder="دوّروا بعنوان أو وصف…" aria-label="بحث"></label>
        <div class="wl-chips" data-tags role="group" aria-label="المناسبة"></div>
        <div class="wl-chips" data-years role="group" aria-label="السنة"></div>
      </div>
      <div class="wl-wall"><div class="wl-grid" aria-live="polite"><div class="wl-empty">نعلّق الصور…</div></div></div>
      <div class="row center wl-foot"><button class="btn ghost sm" data-reset hidden>${IC.restart} إعادة الصور الأصلية اللي انشالت</button></div>
    </div></section>`);
    root.appendChild(v);
    const grid = $(".wl-grid", v), count = $(".wl-count", v);
    const filtered = () => all.filter(it => (tag === "all" || it.tag === tag) && (year === "all" || (year === "none" ? !it.s : yearOf(it) === year)) && (!q || (it.t + " " + it.desc + " " + (it.d || "")).includes(q)));
    function chips() {
      const tags = TAGS.filter(t => all.some(it => it.tag === t)).concat([...new Set(all.map(it => it.tag))].filter(t => !TAGS.includes(t)));
      $("[data-tags]", v).innerHTML = [["all", "كل المناسبات"], ...tags.map(t => [t, t])].map(([k, l]) => `<button data-t="${esc(k)}" aria-pressed="${tag === k}">${esc(l)}</button>`).join("");
      const years = [...new Set(all.map(yearOf).filter(Boolean))].sort();
      $("[data-years]", v).innerHTML = [["all", "كل السنين"], ...years.map(y => [y, y]), ["none", "تاريخ غير معروف"]].map(([k, l]) => `<button data-y="${k}" aria-pressed="${year === k}">${l}</button>`).join("");
      $$("[data-t]", v).forEach(b => b.onclick = () => { tag = b.dataset.t; chips(); draw(); });
      $$("[data-y]", v).forEach(b => b.onclick = () => { year = b.dataset.y; chips(); draw(); });
    }
    function draw() {
      const list = filtered();
      count.innerHTML = `${numSpan(all.length)} ذكرى${list.length !== all.length ? ` · معروض ${numSpan(list.length)}` : ""}`;
      if (!dbOK) toast("المتصفح ما يسمح بحفظ الصور هنا — الذكريات الجديدة ما راح تنحفظ", "bulb");
      if (!all.length) { grid.innerHTML = `<div class="wl-empty"><b>الحائط فاضي</b><p>ضيفوا أول ذكرى بزر «إضافة ذكرى».</p></div>`; return; }
      if (!list.length) { grid.innerHTML = `<div class="wl-empty"><b>ماكو ذكرى تطابق البحث</b><p>جرّبوا كلمة ثانية أو شيلوا الفلتر.</p></div>`; return; }
      grid.innerHTML = list.map((it, i) => { const f = FRAMES[(hash(it.id)) % FRAMES.length], rot = ((hash(it.id + "r") % 5) - 2) * .6;
        return `<button class="wl-frame f-${f}" data-id="${esc(it.id)}" style="--rot:${rot}deg" aria-label="${esc(it.t)}"><span class="wl-nail"></span><span class="wl-mat"><img src="${it.thumb}" alt="" loading="lazy" decoding="async" style="aspect-ratio:${it.ar}" onerror="this.closest('.wl-frame').classList.add('broken')"></span><span class="wl-plaque"><b>${esc(it.t)}</b><small>${esc(it.d || "التاريخ غير معروف")}</small></span>${it.seed ? "" : `<span class="wl-new">أضفتوها</span>`}</button>`; }).join("");
      $$(".wl-frame", grid).forEach(b => b.onclick = () => { const L = filtered(); openViewer(L, L.findIndex(x => x.id === b.dataset.id), refresh); });
    }
    async function refresh() { all = await items(); loading = false; chips(); draw(); const hid = Object.keys(edits().hidden).length; const rb = $("[data-reset]", v); rb.hidden = !hid; }
    $("[data-reset]", v).onclick = async () => { if (await confirmBox("نرجّع الصور الأصلية؟", "ترجع كل الصور الأصلية اللي انشالت، وتعديلات نصوصها ترجع لأصلها.", "رجّعها")) { resetSeeds(); refresh(); } };
    let st; $("input[type=search]", v).addEventListener("input", e => { clearTimeout(st); st = setTimeout(() => { q = e.target.value.trim(); draw(); }, 160); });
    $("[data-add]", v).onclick = () => editForm(null, refresh);
    refresh();
  }
  const hash = s => { let x = 0; for (const c of String(s)) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; };

  /* ---------- عارض الصورة الكاملة ---------- */
  function openViewer(list, i, onChange) {
    if (i < 0) return;
    const md = modal(`<div class="wv"><figure class="wv-fig"><div class="wv-img"><img alt=""><span class="wv-load">نحمّل الصورة…</span></div>
      <figcaption><h3 class="wv-t"></h3><span class="wv-d"></span><p class="wv-desc"></p><small class="wv-by"></small></figcaption></figure>
      <div class="row wv-nav"><button class="btn line sm" data-p aria-label="السابقة">${IC.back} السابقة</button><span class="wv-n"></span><button class="btn line sm" data-n aria-label="التالية">التالية ${IC.next}</button></div>
      <div class="row wv-act"><button class="btn line sm" data-e>${IC.pen} تعديل</button><button class="btn danger sm" data-x>${IC.trash} <span></span></button></div></div>`, { wide: true, label: "ذكرى" });
    const img = $(".wv-img img", md.el), ld = $(".wv-load", md.el);
    const draw = () => { const it = list[i]; img.classList.remove("on"); ld.hidden = false; ld.textContent = "نحمّل الصورة…"; img.onload = () => { img.classList.add("on"); ld.hidden = true; }; img.onerror = () => { ld.textContent = "ما قدرنا نحمّل الصورة"; };
      if (it.set) { img.srcset = it.set; img.sizes = "(max-width:760px) 92vw, 720px"; } else img.removeAttribute("srcset");
      img.src = it.full; img.alt = it.t; $(".wv-t", md.el).textContent = it.t; $(".wv-d", md.el).textContent = it.d || "التاريخ غير معروف"; $(".wv-desc", md.el).textContent = it.desc || ""; $(".wv-by", md.el).textContent = [it.tag, it.by && `أضافها: ${it.by}`].filter(Boolean).join(" · "); $(".wv-n", md.el).textContent = `${i + 1} / ${list.length}`; $("[data-x] span", md.el).textContent = it.seed ? "شيلها من الحائط" : "احذفها"; };
    const step = d => { i = (i + d + list.length) % list.length; draw(); };
    $("[data-p]", md.el).onclick = () => step(-1); $("[data-n]", md.el).onclick = () => step(1);
    const key = e => { if (e.key === "ArrowLeft") step(1); if (e.key === "ArrowRight") step(-1); };
    document.addEventListener("keydown", key);
    let sx = null; const fig = $(".wv-img", md.el);
    fig.addEventListener("touchstart", e => sx = e.touches[0].clientX, { passive: true });
    fig.addEventListener("touchend", e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) step(dx > 0 ? 1 : -1); sx = null; });
    const close = md.close; md.close = () => { document.removeEventListener("keydown", key); close(); };
    $(".x", md.el).onclick = md.close;
    $("[data-e]", md.el).onclick = () => { const it = list[i]; md.close(); editForm(it, onChange); };
    $("[data-x]", md.el).onclick = async () => {
      const it = list[i];
      const ok = await confirmBox(it.seed ? "نشيل هالصورة من الحائط؟" : "نحذف هالذكرى؟", it.seed ? "الصورة الأصلية تبقى بالمشروع؛ تگدرون ترجعوها من «إعادة الصور الأصلية» بأسفل الحائط." : "تنمسح الصورة والوصف من هذا المتصفح نهائياً.", it.seed ? "شيلها" : "احذف");
      if (!ok) return;
      if (it.seed) { const e = edits(); e.hidden[it.id] = true; saveEdits(e); } else await DB.del(it.id);
      md.close(); toast(it.seed ? "انشالت من الحائط" : "انحذفت الذكرى", "check"); onChange();
    };
    draw();
  }

  /* ---------- نموذج الإضافة والتعديل ---------- */
  function editForm(it, onDone) {
    const isSeed = it && it.seed, rec = it && !it.seed ? it.rec : null;
    const iso = rec ? (rec.date || "") : "";
    const md = modal(`<h2>${it ? "تعديل الذكرى" : "إضافة ذكرى"}</h2>
      <form class="wf" novalidate>
        ${isSeed ? `<img class="wf-prev on" src="${it.thumb}" alt="">` : `<label class="wf-pick"><img class="wf-prev ${rec ? "on" : ""}" ${rec ? `src="${it.thumb}"` : ""} alt=""><span class="wf-pt">${rec ? "غيّروا الصورة (اختياري)" : "اختاروا صورة"}</span><input type="file" accept="image/*" data-file ${rec ? "" : "required"}></label>`}
        <label class="field"><span>العنوان *</span><input name="t" maxlength="80" required value="${esc(it ? it.t : "")}"></label>
        <label class="field"><span>التاريخ ${isSeed ? "(كما ينعرض)" : "(اختياري)"}</span>${isSeed ? `<input name="dtext" maxlength="40" value="${esc(it.d || "")}" placeholder="غير معروف">` : `<input type="date" name="d" value="${esc(iso)}">`}</label>
        <label class="field"><span>الوصف</span><textarea name="desc" rows="3" maxlength="400">${esc(it ? it.desc : "")}</textarea></label>
        <div class="field"><span>المناسبة</span><select name="tag">${TAGS.map(t => `<option ${it && it.tag === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
        ${isSeed ? "" : `<div class="field"><span>منو أضافها</span><div class="seg" data-by>${["عيسى", "آمنة", "غيرهم"].map(b => `<button type="button" data-v="${b}" aria-pressed="${(rec && rec.by === b) || (!rec && b === "آمنة")}">${b}</button>`).join("")}</div></div>`}
        <p class="wf-msg note" role="alert"></p>
        <div class="row"><button class="btn gold" type="submit" data-save>${IC.check} احفظ</button><button class="btn line" type="button" data-cancel>إلغاء</button></div>
        <p class="note">تنحفظ بهذا المتصفح على هذا الجهاز فقط.</p>
      </form>`, { label: it ? "تعديل الذكرى" : "إضافة ذكرى" });
    const f = $("form", md.el), msg = $(".wf-msg", md.el), btn = $("[data-save]", md.el);
    let file = null, by = rec ? rec.by : "آمنة";
    $$("[data-by] button", md.el).forEach(b => b.onclick = () => { by = b.dataset.v; $$("[data-by] button", md.el).forEach(x => x.setAttribute("aria-pressed", x === b)); });
    const fi = $("[data-file]", md.el);
    if (fi) fi.onchange = () => { file = fi.files[0] || null; if (file && !/^image\//.test(file.type)) { msg.textContent = "هذا الملف مو صورة."; file = null; return; } const p = $(".wf-prev", md.el); if (file) { p.src = URL.createObjectURL(file); p.classList.add("on"); $(".wf-pt", md.el).textContent = file.name; msg.textContent = ""; } };
    $("[data-cancel]", md.el).onclick = md.close;
    f.onsubmit = async e => {
      e.preventDefault();
      const t = f.t.value.trim();
      if (!t) { msg.textContent = "اكتبوا عنوان للذكرى."; f.t.focus(); return; }
      if (isSeed) {
        const ed = edits(); ed.over[it.id] = { t, d: f.dtext.value.trim() || null, desc: f.desc.value.trim(), tag: f.tag.value }; saveEdits(ed);
        md.close(); toast("انحفظ التعديل", "check"); onDone(); return;
      }
      if (!rec && !file) { msg.textContent = "اختاروا صورة أول."; return; }
      btn.disabled = true; btn.textContent = "قيد الحفظ…"; msg.textContent = "";
      try {
        let blob = rec ? rec.blob : null, ar = rec ? rec.ar : 1;
        if (file) ({ blob, ar } = await shrink(file));
        const now = Date.now();
        const r = { id: rec ? rec.id : "m" + now.toString(36) + Math.random().toString(36).slice(2, 6), title: t, date: f.d.value || "", desc: f.desc.value.trim(), tag: f.tag.value, by, blob, ar, created: rec ? rec.created : now, updated: now };
        await DB.put(r);
        md.close(); toast(rec ? "انحفظ التعديل" : "انضافت الذكرى للحائط", "check"); onDone();
      } catch (err) { console.error(err); btn.disabled = false; btn.innerHTML = `${IC.check} احفظ`; msg.textContent = "ما قدرنا نحفظ — ممكن مساحة المتصفح ممتلئة أو التصفح الخاص يمنع الحفظ."; }
    };
  }
  // نصغّر الصورة بالجهاز نفسه (حتى 1600px) قبل الحفظ
  async function shrink(file) {
    const bmp = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(file); });
    const max = 1600, sc = Math.min(1, max / Math.max(bmp.naturalWidth, bmp.naturalHeight));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.naturalWidth * sc); c.height = Math.round(bmp.naturalHeight * sc);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, "image/jpeg", .86));
    return { blob: blob || file, ar: +(c.width / c.height).toFixed(4) };
  }

  /* ---------- نسخ احتياطي ---------- */
  const toData = b => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(b); });
  async function dump() { let all = []; try { all = await DB.all(); } catch (e) {} return Promise.all(all.map(async r => ({ ...r, blob: undefined, data: await toData(r.blob) }))); }
  async function restore(list) {
    let n = 0;
    for (const r of list) { try { const blob = await (await fetch(r.data)).blob(); const { data, ...rest } = r; await DB.put({ ...rest, blob }); n++; } catch (e) { console.error(e); } }
    return n;
  }
  async function wipe() { try { await DB.clear(); } catch (e) {} Store.del("wallEdits"); }
  function resetSeeds() { Store.del("wallEdits"); }
  return { view, dump, restore, wipe, resetSeeds, _db: DB };
})();
