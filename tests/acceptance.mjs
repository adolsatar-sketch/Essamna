// اختبار قبول «حكايتنا» — يحتاج سيرفر على 8765:  npx http-server -p 8765 . &  ثم  node tests/acceptance.mjs
// متغير PLAYWRIGHT يقدر يأشّر على مكتبة playwright إذا مو منصّبة محلياً.
const pwPath = process.env.PLAYWRIGHT || "playwright";
const { chromium } = await import(pwPath);
const BASE = process.env.BASE || "http://127.0.0.1:8765/index.html";
const results = []; let failed = 0;
const ok = (name, cond, info = "") => { results.push(`${cond ? "✓" : "✗"} ${name}${info ? " — " + info : ""}`); if (!cond) failed++; };
const browser = await chromium.launch();

async function page(vp) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 800, isMobile: vp.width < 800 });
  const p = await ctx.newPage(); p.errors = [];
  p.on("pageerror", e => p.errors.push(e.message));
  p.on("console", m => { if (m.type() === "error") p.errors.push(m.text()); });
  p.on("requestfailed", r => p.errors.push("failed: " + r.url()));
  return { ctx, p };
}
const go = async (p, hash) => { await p.goto(BASE + "#" + hash); await p.waitForFunction(() => !document.getElementById("loader"), null, { timeout: 15000 }); await p.waitForTimeout(900); };
const layoutCheck = p => p.evaluate(() => {
  const W = innerWidth, v = document.querySelector("#view .view");
  const overflowX = v ? v.scrollWidth > v.clientWidth + 2 : false;
  const broken = [...document.querySelectorAll("img")].filter(i => i.complete && i.getBoundingClientRect().width > 0 && i.naturalWidth === 0).map(i => i.src.split("/").pop());
  const clipped = [...document.querySelectorAll("h1,h2,h3,.btn,.dock a span")].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).textOverflow !== "ellipsis"); }).map(e => e.textContent.trim().slice(0, 20));
  const offscreen = [...document.querySelectorAll("#view h1")].filter(e => { const r = e.getBoundingClientRect(); return r.right > W + 1 || r.left < -1; }).length;
  return { overflowX, broken, clipped, offscreen };
});

/* 1) الصفحات على ثلاث مقاسات */
for (const vp of [{ width: 390, height: 844 }, { width: 430, height: 932 }, { width: 1440, height: 900 }]) {
  const { ctx, p } = await page(vp);
  for (const r of ["home", "story", "games", "letters", "wall", "ending"]) {
    await go(p, r); await p.waitForTimeout(r === "wall" ? 1500 : 300);
    const L = await layoutCheck(p);
    ok(`${vp.width}×${vp.height} ${r}: بلا قص أو تمرير أفقي`, !L.overflowX && !L.clipped.length && !L.offscreen, JSON.stringify(L.clipped));
    ok(`${vp.width}×${vp.height} ${r}: بلا صور مكسورة`, !L.broken.length, L.broken.join(","));
  }
  ok(`${vp.width}×${vp.height}: بلا أخطاء بالكونسول`, !p.errors.length, p.errors.slice(0, 3).join(" | "));
  await ctx.close();
}

/* 2) حائط الذكريات: إضافة، تعديل، حذف، وبقاء بعد إعادة التحميل */
{
  const { ctx, p } = await page({ width: 390, height: 844 });
  await go(p, "wall"); await p.waitForTimeout(1200);
  const before = await p.$$eval(".wl-frame", e => e.length);
  ok("الحائط يعرض الصور الأصلية", before >= 60, `${before} إطار`);
  // صورة PNG صغيرة حقيقية
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==", "base64");
  await p.click("[data-add]");
  await p.setInputFiles("[data-file]", { name: "test.png", mimeType: "image/png", buffer: png });
  await p.fill("input[name=t]", "ذكرى تجريبية");
  await p.fill("input[name=d]", "2026-10-21");
  await p.fill("textarea[name=desc]", "وصف للاختبار");
  await p.click("[data-save]"); await p.waitForTimeout(1200);
  await p.reload(); await p.waitForFunction(() => !document.getElementById("loader")); await p.waitForTimeout(1500);
  let has = await p.$$eval(".wl-frame", e => e.some(x => x.textContent.includes("ذكرى تجريبية") && x.textContent.includes("21/10/2026")));
  ok("الإضافة تبقى بعد إعادة التحميل", has);
  await p.click(".wl-frame >> nth=0"); await p.waitForTimeout(600);
  await p.click("[data-e]"); await p.fill("input[name=t]", "ذكرى معدّلة"); await p.click("[data-save]"); await p.waitForTimeout(1000);
  await p.reload(); await p.waitForFunction(() => !document.getElementById("loader")); await p.waitForTimeout(1500);
  has = await p.$$eval(".wl-frame", e => e.some(x => x.textContent.includes("ذكرى معدّلة")));
  ok("التعديل يبقى بعد إعادة التحميل", has);
  await p.click(".wl-frame >> nth=0"); await p.waitForTimeout(600);
  await p.click(".modal [data-x]"); await p.click(".modal [data-y]"); await p.waitForTimeout(900);
  await p.reload(); await p.waitForFunction(() => !document.getElementById("loader")); await p.waitForTimeout(1500);
  has = await p.$$eval(".wl-frame", e => e.some(x => x.textContent.includes("ذكرى معدّلة")));
  const after = await p.$$eval(".wl-frame", e => e.length);
  ok("الحذف (بعد تأكيد) يبقى بعد إعادة التحميل", !has && after === before, `${after}/${before}`);
  // البحث والفلتر
  await p.fill(".wl-search input", "دوّار"); await p.waitForTimeout(400);
  const n = await p.$$eval(".wl-frame", e => e.length);
  ok("البحث يفلتر الحائط", n > 0 && n < before, `${n}`);
  ok("الحائط بلا أخطاء", !p.errors.length, p.errors.slice(0, 3).join(" | "));
  await ctx.close();
}

/* 3) الألعاب: الفوز بلعبة الذاكرة ينحفظ */
{
  const { ctx, p } = await page({ width: 390, height: 844 });
  await go(p, "games:memory");
  await p.click("[data-start]"); await p.waitForTimeout(2300);
  const pairs = await p.$$eval(".mm-card", e => e.map(x => x.dataset.p));
  const seen = {};
  for (let i = 0; i < pairs.length; i++) { (seen[pairs[i]] = seen[pairs[i]] || []).push(i); }
  for (const idx of Object.values(seen)) { await p.click(`.mm-card[data-i="${idx[0]}"]`); await p.click(`.mm-card[data-i="${idx[1]}"]`); await p.waitForTimeout(250); }
  await p.waitForTimeout(1200);
  const end = await p.isVisible("[data-end] .wg-card");
  await p.reload(); await p.waitForFunction(() => !document.getElementById("loader"));
  const g = await p.evaluate(() => JSON.parse(localStorage.getItem("hk_games") || "{}"));
  ok("لعبة الذاكرة تنلعب للنهاية وتعرض الفوز", end);
  ok("التقدّم بالألعاب ينحفظ بعد إعادة التحميل", g.memory && g.memory.won && g.memory.plays === 1, JSON.stringify(g.memory));
  ok("الألعاب بلا أخطاء", !p.errors.length, p.errors.slice(0, 3).join(" | "));
  await ctx.close();
}

/* 4) النهاية: مقفولة قبل الرحلة، وجملة عدول كاملة بعدها */
{
  const { ctx, p } = await page({ width: 390, height: 844 });
  await go(p, "ending");
  ok("النهاية مقفولة قبل إكمال الرحلة", await p.isVisible(".end-lock") && !(await p.$(".tl-play")));
  await p.evaluate(() => {
    const done = {}; HIKAYAT.stations.forEach(s => done[s.id] = true);
    localStorage.setItem("hk_story", JSON.stringify({ done }));
    localStorage.setItem("hk_games", JSON.stringify({ memory: { won: true, plays: 1 } }));
  });
  await go(p, "home"); await p.reload(); await p.waitForFunction(() => !document.getElementById("loader"));
  await go(p, "ending");
  ok("المحطات بدون الألعاب الأساسية ما تكفي للنهاية", await p.isVisible(".end-lock"));
  await p.evaluate(() => localStorage.setItem("hk_games", JSON.stringify({ memory: { won: true }, puzzle: { won: true }, camera: { won: true } })));
  await p.reload(); await p.waitForFunction(() => !document.getElementById("loader")); await p.waitForTimeout(800);
  await p.click("[data-h=auto]");
  await p.waitForSelector(".fx-adool", { timeout: 60000 }).catch(() => {});
  const line = await p.$eval(".fx-adool p", e => e.textContent).catch(() => "");
  ok("عدول يقول الجملة حرفياً", line === "عدول يتمنالكم زواج سعيد، يارب دوم السعادة والحياة السعيدة.", line);
  const inFrame = await p.$eval(".tc-adool .rig", e => { const r = e.getBoundingClientRect(); return !e.closest(".tc").hidden && r.width > 0 && r.left >= 0 && r.right <= innerWidth; }).catch(() => false);
  ok("عدول داخل الكادر على الهاتف (دخل من الطرف ووگف يم عيسى وآمنة)", inFrame);
  const fits = await p.$eval(".fa-card", e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && e.scrollWidth <= e.clientWidth + 1; }).catch(() => false);
  ok("بطاقة عدول مقروءة بدون قص على الهاتف", fits);
  await p.click(".fx-adool button").catch(() => {});
  await p.waitForSelector(".tp-final", { timeout: 20000 }).catch(() => {});
  ok("بعد عدول: لقطة عيسى وآمنة وزر «إعادة عيش الحكاية» و«حفظ النهاية»", await p.isVisible("[data-replay]") && await p.isVisible("[data-save]"));
  ok("النهاية بلا أخطاء", !p.errors.length, p.errors.slice(0, 3).join(" | "));
  await ctx.close();
}

/* 5) الخط الزمني: الخطوبة مستقلة، والزفاف موعد مستقبلي، وعدول ما يطلع قبل النهاية */
{
  const { ctx, p } = await page({ width: 390, height: 844 });
  await go(p, "story");
  const T = await p.evaluate(() => {
    const S = HIKAYAT.stations, e = S.find(s => s.id === "engagement"), w = S.find(s => s.id === "wedding");
    const txt = s => JSON.stringify(s, (k, v) => typeof v === "function" ? v.toString() : v);
    return { e: e && { t: e.title, d: e.dateLabel, ph: e.photos }, w: w && { t: w.title, d: w.dateLabel, ph: w.photos || [], txt: txt(w) },
      order: S.map(s => s.id), weddingPhotos: PHOTOS.filter(x => x.st === "wedding").length };
  });
  ok("محطة «يوم خطوبتهم» بتاريخ 13/2/2026", T.e && T.e.t === "يوم خطوبتهم" && T.e.d === "13/2/2026", JSON.stringify(T.e));
  ok("الخطوبة قبل عيد الحب والزفاف آخر محطة", T.order.indexOf("engagement") < T.order.indexOf("valentine") && T.order[T.order.length - 1] === "wedding", T.order.join(","));
  ok("صور الخطوبة ما تطلع بمحطة الزفاف", T.w && !T.w.ph.some(x => T.e.ph.includes(x)) && T.weddingPhotos === 0);
  ok("الزفاف موعد مستقبلي 30/10/2026", T.w && /الموعد المنتظر/.test(T.w.t) && /30\/10\/2026/.test(T.w.d) && /قريباً/.test(T.w.d), JSON.stringify([T.w.t, T.w.d]));
  ok("نصوص الزفاف بلا صيغة ماضي", T.w && !/تزوّجوا|تزوجوا|صار الزفاف|ليلة الزفاف چانت|مبروك/.test(T.w.txt));
  const map = await p.evaluate(() => ({ text: document.querySelector("#view").textContent, adool: [...document.querySelectorAll("#view img")].some(i => /adool/.test(i.src)) }));
  ok("طريق الحكاية يعرض الخطوبة والزفاف «قريباً»", map.text.includes("يوم خطوبتهم") && map.text.includes("قريباً"));
  ok("عدول ما يظهر بطريق الحكاية", !map.adool);
  await go(p, "home");
  ok("عدول ما يظهر بالرئيسية", !(await p.evaluate(() => [...document.querySelectorAll("#view img")].some(i => /adool/.test(i.src)) || !!document.querySelector("#view .tc-adool"))));
  ok("الخط الزمني بلا أخطاء", !p.errors.length, p.errors.slice(0, 3).join(" | "));
  await ctx.close();
}

/* 6) العروس: طبقة الإيد اليمين موجودة ومحمّلة بكل محطة تمشي بيها آمنة وحدها */
{
  const { ctx, p } = await page({ width: 390, height: 844 });
  await go(p, "home");
  await p.evaluate(() => localStorage.setItem("hk_prefs", JSON.stringify({ openAll: true })));
  for (const id of ["palace", "story", "amnabday", "suit"]) {
    await go(p, "story:" + id); await p.reload(); await p.waitForFunction(() => !document.getElementById("loader")); await p.waitForTimeout(1500);
    const r = await p.evaluate(() => { const im = [...document.querySelectorAll(".tp-stage img")].filter(i => /(amna|pair)-/.test(i.src));
      const arm = im.filter(i => /amna-armR/.test(i.src));
      return { n: im.length, arm: arm.length, loaded: arm.every(i => i.complete && i.naturalWidth > 0), pair: im.some(i => /pair-/.test(i.src)) }; });
    ok(`آمنة بمحطة ${id}: إيدها اليمين (طبقة armR) محمّلة`, r.arm > 0 && r.loaded, JSON.stringify(r));
  }
  ok("العروس بلا أخطاء", !p.errors.length, p.errors.slice(0, 3).join(" | "));
  await ctx.close();
}

/* 7) تقليل الحركة + النسخ الاحتياطي يشتغل */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(BASE + "#story:palace"); await p.waitForFunction(() => !document.getElementById("loader")); await p.waitForTimeout(1200);
  ok("المحطة تشتغل ويا تقليل الحركة", await p.isVisible(".tp-stage") && !errs.length, errs.join(" | "));
  await p.goto(BASE + "#home"); await p.waitForTimeout(800);
  const dl = p.waitForEvent("download", { timeout: 8000 }).catch(() => null);
  await p.evaluate(() => Backup.export());
  const d = await dl;
  ok("تصدير نسخة احتياطية ينزّل ملف", !!d, d ? d.suggestedFilename() : "");
  await ctx.close();
}

await browser.close();
console.log(results.join("\n"));
console.log(failed ? `\n${failed} فشل` : "\nكل الاختبارات نجحت");
process.exit(failed ? 1 : 0);
