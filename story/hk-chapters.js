/* =====================================================================
   حكايتنا — المحطات (بيانات الحكاية)
   ---------------------------------------------------------------------
   شلون تعدّلون نص؟  ابحثوا عن الجملة هنا وغيّروها. الأسماء تنكتب كرموز:
     {I} = عيسى   {A} = آمنة   {D} = عدول
   الوقائع والتواريخ من صاحبة الحكاية فقط؛ اللي ما نعرفه ينكتب «غير محدد».

   أنواع الخطوات (beats) — نفس محرّك إيلاف، ويا إضافات حكايتنا:
     {scene:"اسم", cast:{isa:[x], amna:[x], pair:[x], adool:[x]}, player:"pair", follow:[...]}
     {cine:true, narr:"نص", btn:"زر"}      {say:"isa|amna|pair|adool|narr", t:"نص", e:"wave|nod|shy|joy|look"}
     {act:[[who,"to",x], ["fx","اسم"], ["sfx","اسم"], ["wait",ms]]}
     {explore:{until:"علم", hints:[...], need:{نوع:عدد}}}
     {puzzle:"focus|candles|sign|arrange|letters|starpath|symbols|timing|quiz", ...}
     {photos:[معرّفات من data/photos.js], title, t}   ← ألبوم الصور الحقيقية
     {letter:"معرّف من data/letters.js"}              ← رسالة حقيقية
     {voice:true, t:"…"}                                ← نص بصوت آمنة
     {calm:true, t:"…"}  {fx:"اسم"}  {toast:"…"}
   ===================================================================== */
const HIKAYAT = (() => {
  const R = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  const rnd = (i, k = 1) => { const x = Math.sin(i * 9301 + 49297 * k) * 233280; return x - Math.floor(x); };
  const span = (sc, VW, f) => Math.ceil((sc.len * f + VW) / 1) + 40;

  /* ---------------- البيئات (طبقات الخلفية) ---------------- */
  const themes = {
    // القصر الروماني: قاعة بيضة بأعمدة وثريات وستائر زرقة، وأرضية رخام تلمع
    palace: (sc, VW) => ({
      far: [{ a: "hallWall", args: [400], x: -20, y: 6, w: span(sc, VW, .25), h: 80, tl: true },
        ...R(Math.ceil(span(sc, VW, .25) / 34), i => ({ a: "archWindow", args: ["#B9D3E2", "#7FA3C4"], x: 14 + i * 34, y: 78, w: 15 }))],
      mid: [...R(Math.ceil(span(sc, VW, .55) / 30), i => ({ a: "column", x: i * 30 + 4, y: 87, w: 9 })),
        ...R(Math.ceil(span(sc, VW, .55) / 60), i => ({ a: "chandelier", x: i * 60 + 32, y: 30, w: 17, cls: "sway", fx: false })),
        ...R(Math.ceil(span(sc, VW, .55) / 60), i => ({ a: "goldFrame", args: ["#CDBBA0", i % 2 === 1], x: i * 60 + 18, y: 64, w: 7 })),
        ...R(Math.ceil(span(sc, VW, .55) / 90), i => ({ a: "sofaClassic", args: ["#2E3A5C"], x: i * 90 + 50, y: 87, w: 22 }))],
      main: [{ a: "rugRound", args: ["#7A3B3B"], x: 80, y: 88.5, w: 46 }, { a: "topiary", x: 8, y: 86.5, w: 6 }, { a: "topiary", x: sc.len - 8, y: 86.5, w: 6 }],
      fore: R(Math.ceil(span(sc, VW, 1.3) / 95), i => ({ a: "column", args: ["#E9DCC4", "#B9A27E"], x: i * 95 + 60, y: 112, w: 14, o: .92, cls: "fore-col" }))
    }),
    // ليلة الستوري: غرفة عيسى يسار، غرفة آمنة يمين، والمدينة بالنص
    night: (sc, VW) => ({
      far: [{ a: "stars", args: [60], x: -20, y: 2, w: span(sc, VW, .25), h: 40, tl: true }, { a: "moon", x: VW * .35 + 18, y: 28, w: 12 },
        { a: "cityNight", args: [800], x: -20, y: 40, w: span(sc, VW, .25), h: 46, tl: true }],
      mid: [{ a: "roomNight", args: [200, "#2C2F4C"], x: -40, y: 10, w: 100, h: 76, tl: true }, { a: "roomNight", args: [200, "#3A2E48"], x: 120, y: 10, w: 160, h: 76, tl: true },
        { a: "windowNight", x: 25, y: 60, w: 14 }, { a: "windowNight", x: 160, y: 60, w: 14 }],
      main: [{ a: "desk", x: 32, y: 86.5, w: 20 }, { a: "laptop", args: [true], x: 30, y: 76, w: 10 }, { a: "lampDesk", x: 40, y: 76, w: 5 },
        { a: "bedNight", x: 152, y: 86.5, w: 28 }],
      fore: []
    }),
    // عيد الحب: مساء دافي، أضواء معلّقة وشموع
    evening: (sc, VW) => ({
      far: [{ a: "hills", args: ["#5A3E4A", "#6E4A52", 400], x: -20, y: 92, w: span(sc, VW, .25), tl: true, h: 34, cls: "tl-y58" },
        { a: "cityNight", args: [800], x: -20, y: 56, w: span(sc, VW, .25), h: 30, tl: true, o: .7 }],
      mid: [{ a: "stringLights", args: [600], x: -20, y: 18, w: span(sc, VW, .55), h: 10, tl: true },
        ...R(Math.ceil(span(sc, VW, .55) / 40), i => ({ a: "lanternHang", args: [["#F6C86A", "#F2A07A", "#F6C86A"][i % 3]], x: i * 40 + 20, y: 40, w: 3.4, cls: "swing" })),
        ...R(Math.ceil(span(sc, VW, .55) / 50), i => ({ a: "palm", args: ["#2E2A30"], x: i * 50 + 10, y: 87, w: 14, o: .85 }))],
      main: [{ a: "tableRound", x: 128, y: 87, w: 22 }, { a: "roses", x: 128, y: 77.5, w: 6 }],
      fore: R(Math.ceil(span(sc, VW, 1.3) / 70), i => ({ a: "plant", args: ["#3E5A3A"], x: i * 70 + 30, y: 106, w: 14, o: .9 }))
    }),
    // السينما: خطوط ضوء بالسقف، شاشة بيضة، مقاعد صفرة
    cinema: (sc, VW) => ({
      far: [{ a: "cinemaWall", args: [600], x: -20, y: 0, w: span(sc, VW, .25), h: 86, tl: true }],
      mid: [{ a: "screen", x: VW * .55 + 60, y: 66, w: 80, cls: "glowscreen" }],
      main: [],
      fore: R(Math.ceil(span(sc, VW, 1.3) / 52), i => ({ a: "cinemaSeats", args: [3], x: i * 52 + 26, y: 104, w: 30 }))
    }),
    // عيد ميلاد عيسى: استوديو تصوير وبالونات وكيكة الكاميرا
    studio: (sc, VW) => ({
      far: [{ a: "studioBackdrop", args: [400], x: -20, y: 4, w: span(sc, VW, .25), h: 82, tl: true }],
      mid: [{ a: "stringLights", args: [600], x: -20, y: 14, w: span(sc, VW, .55), h: 10, tl: true },
        ...R(Math.ceil(span(sc, VW, .55) / 55), i => ({ a: "softbox", x: i * 55 + 20, y: 87, w: 9 })),
        ...R(Math.ceil(span(sc, VW, .55) / 22), i => ({ a: "balloon", args: [["#C9A25E", "#E7CB8E", "#2E3A5C", "#F4E2C7"][i % 4]], x: i * 22 + 10, y: 46 + rnd(i) * 10, w: 4.5, cls: "bob" }))],
      main: [{ a: "tableRound", x: 100, y: 87, w: 22 }, { a: "giftBox", args: ["#E7CB8E", "#2E3A5C"], x: 120, y: 86.5, w: 6 }, { a: "giftBox", args: ["#2E3A5C", "#E7CB8E"], x: 127, y: 86.5, w: 5 }],
      fore: []
    }),
    // المحكمة: نهار، مبنى أبيض بأعمدة ونخيل
    court: (sc, VW) => ({
      far: [{ a: "hills", args: ["#9DB0A0", "#B8C6B0", 400], x: -20, y: 92, w: span(sc, VW, .25), tl: true, h: 40, cls: "tl-y56" },
        ...R(Math.ceil(span(sc, VW, .25) / 30), i => ({ a: "cloud", args: ["#FFFFFF", .8], x: i * 30 + rnd(i) * 10, y: 20 + rnd(i, 2) * 10, w: 16, cls: "drift" }))],
      mid: [{ a: "courtBuilding", x: 70, y: 87, w: 70 }, ...R(Math.ceil(span(sc, VW, .55) / 36), i => ({ a: "palm", args: ["#3E5A38"], x: i * 36 + 8, y: 87, w: 13 }))],
      main: [{ a: "steps", x: 112, y: 87, w: 26 }],
      fore: R(Math.ceil(span(sc, VW, 1.3) / 80), i => ({ a: "plant", args: ["#4E6B45"], x: i * 80 + 40, y: 108, w: 13 }))
    }),
    // ممر العمارة قبل الباب
    corridor: (sc, VW) => ({
      far: [{ a: "corridor", args: [400], x: -20, y: 4, w: span(sc, VW, .25), h: 82, tl: true }],
      mid: [...R(Math.ceil(span(sc, VW, .55) / 50), i => ({ a: "door", args: [0], x: i * 50 + 15, y: 87, w: 12, o: .9 })), ...R(Math.ceil(span(sc, VW, .55) / 50), i => ({ a: "sconce", x: i * 50 + 40, y: 52, w: 3 }))],
      main: [], fore: []
    }),
    // الشقة الفاضية: ضوء نهار من الشبابيك
    empty: (sc, VW) => ({
      far: [{ a: "emptyRoom", args: [500], x: -20, y: 4, w: span(sc, VW, .25), h: 82, tl: true }],
      mid: [], main: [{ a: "boxes", x: 30, y: 86.5, w: 12 }], fore: []
    }),
    // معرض الأثاث
    showroom: (sc, VW) => ({
      far: [{ a: "hallWall", args: [400, "#F1ECE3", "#E1D8C8"], x: -20, y: 6, w: span(sc, VW, .25), h: 80, tl: true }],
      mid: [...R(Math.ceil(span(sc, VW, .55) / 50), i => ({ a: "chandelier", x: i * 50 + 25, y: 28, w: 12, cls: "sway" })),
        ...R(Math.ceil(span(sc, VW, .55) / 70), i => ({ a: "showroomShelf", x: i * 70 + 10, y: 80, w: 16 })),
        ...R(Math.ceil(span(sc, VW, .55) / 70), i => ({ a: "chairDining", x: i * 70 + 40, y: 87, w: 5 }))],
      main: [{ a: "sofaModern", args: ["#9EA3A8"], x: 40, y: 87, w: 26 }, { a: "coffeeTable", x: 40, y: 87.5, w: 12 }, { a: "floorLamp", x: 95, y: 87, w: 6 }],
      fore: []
    }),
    // بيتنا بعد الأثاث
    home: (sc, VW) => ({
      far: [{ a: "emptyRoom", args: [500], x: -20, y: 4, w: span(sc, VW, .25), h: 82, tl: true }],
      mid: [{ a: "wallArt", x: 70, y: 46, w: 16, id: "art", cls: "furnish" }],
      main: [{ a: "sofaModern", x: 70, y: 87, w: 30, id: "sofa", cls: "furnish" }, { a: "coffeeTable", x: 70, y: 87.8, w: 13, id: "table", cls: "furnish" },
        { a: "floorLamp", x: 96, y: 87, w: 6, id: "lamp", cls: "furnish" }, { a: "plant", x: 44, y: 87, w: 7, id: "plant", cls: "furnish" }],
      fore: []
    }),
    // عيد ميلاد آمنة: غرفة كلاسيكية ذهبية ودوّار الشمس
    gold: (sc, VW) => ({
      far: [{ a: "hallWall", args: [400, "#F2E6CC", "#DCC7A0"], x: -20, y: 6, w: span(sc, VW, .25), h: 80, tl: true }],
      mid: [...R(Math.ceil(span(sc, VW, .55) / 45), i => ({ a: "sconce", x: i * 45 + 22, y: 50, w: 3.2 })),
        ...R(Math.ceil(span(sc, VW, .55) / 60), i => ({ a: "goldFrame", args: ["#5E7A58", false], x: i * 60 + 40, y: 62, w: 8 })),
        ...R(Math.ceil(span(sc, VW, .55) / 60), i => ({ a: "chairGold", x: i * 60 + 12, y: 87, w: 11 }))],
      main: [{ a: "tableRound", x: 125, y: 87, w: 20 }, { a: "bookCake", x: 125, y: 77.8, w: 12 }],
      fore: R(Math.ceil(span(sc, VW, 1.3) / 60), i => ({ a: "sunflower", x: i * 60 + 20, y: 112, w: 9, o: .95 }))
    }),
    // محل البدلات
    tailor: (sc, VW) => ({
      far: [{ a: "roomNight", args: [400, "#3B2E26"], x: -20, y: 6, w: span(sc, VW, .25), h: 80, tl: true }],
      mid: [...R(Math.ceil(span(sc, VW, .55) / 50), i => ({ a: "suitRack", x: i * 50 + 20, y: 87, w: 26 })), ...R(Math.ceil(span(sc, VW, .55) / 50), i => ({ a: "sconce", x: i * 50 + 45, y: 46, w: 3 }))],
      main: [{ a: "mannequin", x: 70, y: 87, w: 7 }, { a: "rugRound", args: ["#5A3A2E"], x: 132, y: 88.5, w: 30 }],
      fore: []
    }),
    // ليلة الزواج: حديقة، أضواء، قوس ورد ونوافير نار
    wedding: (sc, VW) => ({
      far: [{ a: "stars", args: [70], x: -20, y: 2, w: span(sc, VW, .25), h: 40, tl: true },
        { a: "cityNight", args: [800], x: -20, y: 52, w: span(sc, VW, .25), h: 34, tl: true, o: .6 }],
      mid: [{ a: "stringLights", args: [800], x: -20, y: 16, w: span(sc, VW, .55), h: 12, tl: true },
        ...R(Math.ceil(span(sc, VW, .55) / 30), i => ({ a: "lanternHang", args: [["#F6C86A", "#F2A07A"][i % 2]], x: i * 30 + 15, y: 38 + rnd(i) * 6, w: 3.2, cls: "swing" })),
        ...R(Math.ceil(span(sc, VW, .55) / 45), i => ({ a: "palm", args: ["#1E1E2A"], x: i * 45 + 22, y: 87, w: 14 }))],
      main: [{ a: "flowerArch", x: sc.archX || (sc.len - 20), y: 87, w: 26 }],
      fore: R(Math.ceil(span(sc, VW, 1.3) / 60), i => ({ a: "plant", args: ["#24302A"], x: i * 60 + 30, y: 110, w: 14, o: .95 }))
    })
  };

  /* ---------------- مؤثرات المشاهد ---------------- */
  const q = (api, id) => api.stage.querySelector(`[data-id="${id}"]`);
  const fx = {
    flash: async api => { const f = h(`<div class="fx-flash"></div>`); api.v.appendChild(f); api.TAudio.sfx("shutter"); await api.wait(420); f.remove(); },
    likes: async api => { const box = h(`<div class="fx-likes">${R(9, i => `<span style="--i:${i};left:${40 + rnd(i) * 30}%">${TART.symbol("heart", "#E46A6A")}</span>`).join("")}</div>`); api.v.appendChild(box); for (let i = 0; i < 4; i++) { api.TAudio.sfx("pick"); await api.wait(380); } await api.wait(1400); box.remove(); },
    storyPost: async api => { const el = h(`<div class="fx-story">${TART.storyCard()}</div>`); api.v.appendChild(el); api.TAudio.sfx("whistle"); await api.wait(3600); el.classList.add("out"); await api.wait(600); el.remove(); },
    chat: async api => { const box = h(`<div class="fx-chat"></div>`); api.v.appendChild(box); for (let i = 0; i < 6; i++) { const b = h(`<span class="${i % 2 ? "me" : "you"}">${TART.chatBubble(i % 2 === 1)}</span>`); box.appendChild(b); api.TAudio.sfx("soft"); await api.wait(520); } await api.wait(900); box.classList.add("out"); await api.wait(500); box.remove(); },
    days: async api => { const el = h(`<div class="fx-days"><div class="fd-sky"></div><b></b></div>`); api.v.appendChild(el); const t = $("b", el);
      for (const s of ["يوم…", "يومين…", "كم يوم…", "«يمكن ما كملت عشرة أيام»"]) { t.textContent = s; t.classList.remove("in"); void t.offsetWidth; t.classList.add("in"); api.TAudio.sfx("soft"); await api.wait(1300); }
      await api.wait(900); el.classList.add("out"); await api.wait(600); el.remove(); },
    candlesOn: async api => { api.stage.classList.add("candlelit"); api.TAudio.sfx("sparkle"); },
    lightsDown: async api => { api.stage.classList.add("dim"); api.TAudio.sfx("soft"); },
    doorOpen: async api => { const d = api.getObj("door"); api.TAudio.sfx("keys"); await api.wait(500); api.TAudio.sfx("door"); if (d) api.updObj("door", { args: [1], cls: "opened" }); api.stage.classList.add("doorlight"); await api.wait(1200); },
    furnish: async api => { const ids = ["plant", "sofa", "table", "lamp", "art"]; for (const id of ids) { const el = q(api, id); if (el) { el.classList.add("in"); api.TAudio.sfx("pick"); await api.wait(380); } } },
    bouquet: async api => { const a = api.chars.amna; if (!a) return; const el = api.deco({ a: "bouquetYellow", x: a.x - 2.5, y: a.y - 9, w: 7, cls: "gift-in" }, "main"); api.TAudio.sfx("sparkle"); await api.wait(800); },
    sparks: async api => { api.stage.classList.add("sparking"); api.TAudio.sfx("firework"); await api.wait(1600); },
    fireworks: async api => { if (!api.motionOK()) { api.TAudio.sfx("cheer"); return; } const box = h(`<div class="fx-fireworks">${R(6, i => `<span style="left:${10 + rnd(i) * 80}%;top:${8 + rnd(i, 3) * 30}%;--d:${i * .45}s">${TART.firework(["#FFD48A", "#F2A07A", "#E7CB8E", "#FFFFFF"][i % 4])}</span>`).join("")}</div>`); api.v.appendChild(box); for (let i = 0; i < 4; i++) { api.TAudio.sfx("firework"); await api.wait(700); } api.TAudio.sfx("cheer"); await api.wait(1400); box.classList.add("out"); setTimeout(() => box.remove(), 900); },
    adoolCard: api => new Promise(res => {
      const card = h(`<div class="fx-adool" role="dialog" aria-label="رسالة عدول"><div class="fa-card"><img src="${TRig.still("adool")}" alt="عدول"><span class="fa-tag">عدول</span><p>${esc(CONFIG.adoolLine)}</p><button class="btn gold">نكمّل</button></div></div>`);
      api.v.appendChild(card); api.TAudio.sfx("sparkle");
      $("button", card).onclick = () => { card.classList.add("out"); setTimeout(() => { card.remove(); res(); }, 450); };
    })
  };

  /* ---------------- عناصر الجمع ---------------- */
  const itemArt = { key: ["key", "#E7B94A"], sun: ["flower", "#F2C230"], tape: ["tape", "#E7CB8E"], pin: ["pin", "#E7CB8E"], tie: ["tie", "#C98B8B"] };

  /* ---------------- نصوص عامة ---------------- */
  const barks = {
    isa: ["…", "هلا.", "يلا نكمّل."], amna: ["شوف هناك!", "نمشي سوه؟", "هلا 🤍"], pair: ["سوه.", "يلا!"], adool: ["هلااا!"]
  };
  const winLines = ["حلو!", "ولا أحلى!", "عاشت إيدكم!"];
  const mus = (root, tempo, scale, chords, motif) => ({ root, tempo, scale, chords, motif });
  const M = {
    warm: mus(62, 84, [0, 2, 4, 7, 9], [0, 3, 1, 4], [0, null, 2, null, 4, null, 2, 3, 4, null, null, null, 5, 4, 2, null, 0, null, 2, null, 4, null, 5, null, 4, 2, 1, null, 0, null, null, null]),
    night: mus(57, 76, [0, 2, 3, 5, 7, 8, 10], [0, 5, 3, 4], [4, null, 2, null, 0, null, null, 2, 3, null, 2, null, 0, null, null, null, 4, null, 5, null, 4, null, 2, null, 0, null, null, null, null, null, null, null]),
    bright: mus(64, 98, [0, 2, 4, 5, 7, 9, 11], [0, 5, 3, 4], [4, null, 2, null, 0, null, 2, 4, 5, null, 4, null, 2, null, null, null, 4, null, 5, null, 7, null, 5, 4, 2, null, 1, null, 0, null, null, null]),
    tender: mus(60, 72, [0, 2, 4, 7, 9], [0, 2, 3, 1], [0, null, null, 2, 3, null, 2, null, 4, null, 3, null, 2, null, null, null, 0, null, null, 2, 3, null, 5, null, 4, null, null, 3, 2, null, null, null]),
    celebrate: mus(65, 108, [0, 2, 4, 5, 7, 9, 11], [0, 4, 5, 3], [0, 2, 4, null, 6, null, 4, null, 5, 4, 2, null, 4, null, null, null, 0, 2, 4, null, 7, null, 6, null, 4, null, 2, null, 1, null, 0, null])
  };
  const SKY = {
    palace: "linear-gradient(180deg,#E9DCC6 0%,#F4EBDD 60%,#E6D6BA 100%)",
    night: "linear-gradient(180deg,#0E1226 0%,#1C2140 55%,#2C2848 100%)",
    evening: "linear-gradient(180deg,#2B2445 0%,#7A4A5C 45%,#E09A6A 85%,#F2C48A 100%)",
    cinema: "linear-gradient(180deg,#0C0B12 0%,#17151F 100%)",
    studio: "linear-gradient(180deg,#2A2F44 0%,#3A3F56 100%)",
    court: "linear-gradient(180deg,#8EC3E0 0%,#CFE4EE 60%,#F3EBDA 100%)",
    corridor: "linear-gradient(180deg,#E4DED2 0%,#EFEAE0 100%)",
    empty: "linear-gradient(180deg,#F6F1E8 0%,#FFFFFF 100%)",
    gold: "linear-gradient(180deg,#E8D7B2 0%,#F4E8CF 100%)",
    tailor: "linear-gradient(180deg,#2B211C 0%,#3B2E26 100%)",
    wedding: "linear-gradient(180deg,#0B0E22 0%,#1E1A3A 50%,#3A2340 85%,#6A3A3A 100%)"
  };

  // مشهد الكاميرا للعبة «لقطة عيسى» (قاعة كلاسيكية صغيرة)
  const focusScene = `<rect width="160" height="100" fill="#F2E8D6"/>${R(5, i => `<rect x="${8 + i * 34}" y="10" width="10" height="80" fill="#FBF4E6"/><rect x="${6 + i * 34}" y="8" width="14" height="4" fill="#E2CDA4"/>`)}<path d="M50 30a30 30 0 0160 0v60H50z" fill="#B9D3E2"/><path d="M80 0v18" stroke="#C9A25E" stroke-width="2"/><circle cx="80" cy="24" r="8" fill="#FFE7B0"/><rect x="0" y="88" width="160" height="12" fill="#E6D8BE"/><path d="M60 88c4-20 36-20 40 0z" fill="#2E3A5C"/>`;

  /* =====================================================================
     المحطات — بالترتيب الزمني
     ===================================================================== */
  const stations = [
    /* 1 ----------------------------------------------------------------- */
    { id: "palace", title: "أول صدفة", dateLabel: "16/1", place: "القصر الروماني", icon: "camera", color: ["#C9A25E", "#7FA3C4"], sky: SKY.palace, theme: M.warm,
      lead: "عيسى چان يجي للقصر الروماني يصوّر، وآمنة تشتغل بالموقع. بالبداية ما چان بيناتهم حچي: يجي، يصوّر، ويطلع.",
      photos: ["halls1", "halls2", "amna_hall"],
      cliff: "ولا كلمة… بس لايكات. لحد ليلة الستوري.",
      scenes: { hall: { theme: "palace", len: 190, gk: "marble", amb: "dust",
        objs: [
          { id: "desk", x: 26, w: 16, a: "desk", label: "مكان شغل آمنة", run: [{ say: "narr", t: "آمنة چانت تشتغل بالموقع. من هنا تشوف منو يدخل ومنو يطلع." }, { say: "amna", t: "كل يوم وجوه جديدة… بس واحد بس يرجع كل مرة.", e: "shy" }] },
          { id: "frames", x: 64, y: 70, w: 8, a: "goldFrame", args: ["#CDBBA0", false], label: "صور قاعات المكان", run: [{ photos: ["halls1", "halls2", "amna_hall"], title: "قاعات بديكور كلاسيكي", t: "من الصور المرفوعة. اسم المكان مو مكتوب عليها، فنخليه بدون تأكيد." }] },
          { id: "tripod", x: 124, w: 7, a: "tripod", label: "كاميرا عيسى", run: [{ act: [["fx", "flash"]] }, { say: "narr", t: "كل مرة نفس الشي: يركّب الكاميرا، يصوّر بهدوء، ويطلع." }, { act: [["isa", "bark", "…", 1600]] }] },
          { id: "phone", x: 168, w: 4, a: "phone", args: [true], y: 79, label: "الإنستا", flag: "likes", run: [{ say: "narr", t: "بعدين صاروا متابعين بالإنستا… وصارت بس لايكات على الستوريات، بلا حچي." }, { fx: "likes" }, { say: "amna", t: "لايك… ولايك… ولا رسالة وحدة.", e: "shy" }] }
        ],
        deco: [{ a: "desk", x: 168, y: 86.5, w: 14 }]
      } },
      beats: [
        { scene: "hall", cast: { amna: [30, null, 1], isa: [140, null, -1] }, player: "amna", cam: 0 },
        { cine: true, narr: "16/1 · القصر الروماني. قاعات بيضة وثريات وأعمدة… والناس تجي تتصوّر بيها.", btn: "ادخلوا" },
        { act: [["isa", "to", 128], ["cam", 70, 1400]] },
        { act: [["fx", "flash"], ["wait", 500]] }, { act: [["fx", "flash"]] },
        { say: "amna", t: "هذا نفس الولد… يجي، يصوّر، ويطلع.", e: "look" },
        { say: "amna", t: "ما يحچي ويا أحد. أحسّه شايف نفسه شوية." },
        { act: [["cam", 0, 1200]] },
        { explore: { until: "likes", hints: [{ after: 7, who: "amna", t: "خلّي أشوف الكاميرا مالته… والتلفون على الميز هناك." }] } },
        { puzzle: "focus", title: "لقطة من عين عيسى", intro: "عيسى چان يجي يصوّر بالقصر. انتظروا الصورة تصفى، ودوسوا الغالق — ثلاث لقطات.", scene: focusScene, need: 3, win: "ثلاث لقطات واضحة. مثل ما يسوّي هو." },
        { act: [["isa", "to", 200], ["wait", 1800]] }, { act: [["isa", "hide"]] },
        { say: "narr", t: "ويطلع… مثل كل مرة." },
        { letter: "site", title: "بعدين، كتبلها عيسى" }
      ] },

    /* 2 ----------------------------------------------------------------- */
    { id: "story", title: "أول رسالة", dateLabel: "بداية الحكاية", place: "ستوري العرسان", icon: "letter", color: ["#2C2F4C", "#B9A0B7"], sky: SKY.night, theme: M.night,
      lead: "ستوري نزّله عيسى بالليل عن عرسان غريبي الأطوار صوّرهم. آمنة علّقت، ومن هناك بلشوا يحچون — صدفة ملخبطة تحوّلت لأحلى صدفة.",
      photos: ["story_bw"],
      cliff: "صدفة ملخبطة… صارت أحلى صدفة.",
      scenes: { rooms: { theme: "night", len: 180, gk: "nightfloor", amb: "stars",
        objs: [
          { id: "laptop", x: 30, y: 76, w: 10, a: "laptop", args: [true], label: "شاشة عيسى", run: [{ say: "narr", t: "عيسى بالليل يعدّل الصور اللي صوّرها." }] },
          { id: "story2", x: 104, y: 70, w: 6, a: "phone", args: [false], label: "ستوري ثاني", run: [{ photos: ["story_bw"], title: "«بعض التواريخ يبقى شعورها عُمر»", t: "ستوري بالأبيض والأسود. الرقم المكتوب عليه (25.1.22) ننقله مثل ما هو." }] },
          { id: "phone", x: 150, y: 78, w: 4.5, a: "phone", args: [true], label: "تعليق على الستوري", flag: "comment", run: [{ say: "amna", t: "شنو هالعرسان؟! والله غريبين شوية…", e: "joy" }, { say: "narr", t: "آمنة علّقت على الستوري… ومن هناك بلشوا يحچون." }, { fx: "chat" }] }
        ] } },
      beats: [
        { scene: "rooms", cast: { isa: [42, null, -1], amna: [140, null, -1] }, player: "amna", cam: 0 },
        { cine: true, narr: "بالليل… عيسى نزّل ستوري لعرسان غريبي الأطوار صوّرهم.", btn: "شوفوا الستوري" },
        { fx: "storyPost" },
        { act: [["cam", 120, 1600]] },
        { explore: { until: "comment", hints: [{ after: 6, who: "amna", t: "التلفون… خلّي أشوف الستوري." }] } },
        { fx: "days" },
        { act: [["isa", "to", 86], ["amna", "to", 98], ["cam", 55, 2200]] },
        { act: [["isa", "face", 1], ["amna", "face", -1]] },
        { act: [["isa", "look"], ["amna", "look"]] },
        { say: "narr", t: "حسّوا شكد يشبهون بعض، وكل واحد صارح الثاني بمشاعره." },
        { voice: true, title: "علاقتنا…", t: "علاقتنا چانت غريبة، بس حلوة بنفس الوقت… بدت بصدفة بالقصر الروماني. عيسى چان يجي يصوّر، وآني چنت أشتغل بالموقع. بالبداية ما چان بيناتنا أي حچي؛ أشوفه يجي يصوّر ويطلع، وكنت أحسّه شايف نفسه لأن ما يحچي ويا أحد.\nبعدين شفت ستوري إله، وضفته بالإنستا، وصارت بس لايكات على الستوريات… لحد ذاك اليوم اللي نشر بيه ستوري عن عرسان غريبي الأطوار صوّرهم. علّقتله، ومن هناك بلشنا نحچي.\nبأيام بسيطة، يمكن ما كملت عشرة أيام، حسّينا شكد نشبه بعض، وكل واحد صارح الثاني بمشاعره. من يوم 16/1 لهسه، أحسها أحلى صدفة صارت بحياتي." }
      ] },

    /* 3 ----------------------------------------------------------------- */
    { id: "valentine", title: "أول عيد حب سوه", dateLabel: "14/2/2026", place: "لحظة إلهم", icon: "heart", color: ["#7A4A5C", "#E09A6A"], sky: SKY.evening, theme: M.tender,
      lead: "أول ١٤ شباط وهم سوه — لحظة هادية وخاصة إلهم الاثنين.",
      photos: ["frame", "hands_rings"],
      cliff: "أول ١٤ شباط… وهم سوه.",
      scenes: { eve: { theme: "evening", len: 170, gk: "terrace", amb: "glow",
        objs: [
          { id: "candles", x: 62, w: 3.4, a: "candle", args: [24], label: "ولّعوا الشموع", run: [{ fx: "candlesOn" }, { say: "narr", t: "ضوّة صغيرة… تكفي." }] },
          { id: "frame", x: 98, y: 72, w: 8, a: "goldFrame", args: ["#E8DDC8", false], label: "«وخلقناكم أزواجاً»", run: [{ photos: ["frame", "hands_rings"], title: "«وخلقناكم أزواجاً»", t: "مكتوب بالإطار: «لقد تم العقد… بتاريخ 13 فبراير 2026»، وتحته Eisa و Amna." }] },
          { id: "table", x: 128, w: 22, a: "tableRound", ph: 6, label: "الطاولة", flag: "table", run: [{ act: [["pair", "to", 120]] }, { act: [["pair", "look"]] }] }
        ] } },
      beats: [
        { scene: "eve", cast: { pair: [18] }, player: "pair", cam: 0 },
        { cine: true, narr: "14/2/2026 · أول عيد حب سوه. لحظة هادية… إلهم وحدهم.", btn: "نمشي" },
        { explore: { until: "table", hints: [{ after: 7, t: "الطاولة هناك… والشموع بالطريق." }] } },
        { puzzle: "letters", title: "كلمة من رسائلهم", letters: ["ع", "و", "ض", "ي"], word: "عوضي", clue: "كلمة تتكرر برسائلهم لبعض.", win: "«عوضي» — هيج يسمّون بعض." },
        { calm: true, t: "أول ١٤ شباط وهم سوه. ما يحتاج أكثر من هيج." }
      ] },

    /* 4 ----------------------------------------------------------------- */
    { id: "cinema", title: "أول سينما ديت سوه", dateLabel: "التاريخ غير محدد", place: "السينما", icon: "star", color: ["#14131C", "#E8B92F"], sky: SKY.cinema, theme: M.night,
      lead: "أول مرة بالسينما سوه. التاريخ مو مكتوب بالصور — بس اللحظة محفوظة.",
      photos: ["cinema_hall", "cinema_selfie"],
      cliff: "ما نعرف تاريخها… بس نعرف إنها چانت أول مرة.",
      scenes: { hall: { theme: "cinema", len: 170, gk: "carpet", amb: "dust",
        objs: [
          { id: "seats", x: 128, w: 14, a: "cinemaSeats", args: [2], y: 88, label: "مقاعدنا", flag: "seats", run: [{ act: [["pair", "to", 128]] }, { act: [["pair", "anim", "sit"], ["fx", "lightsDown"]] }, { photos: ["cinema_hall", "cinema_selfie"], title: "أول سينما سوه", t: "من الصور: قاعة السينما وسيلفي بنفس الإضاءة. تاريخها غير محدد." }] }
        ] } },
      beats: [
        { scene: "hall", cast: { pair: [16] }, player: "pair", cam: 0 },
        { cine: true, narr: "أول سينما ديت سوه. ما نعرف التاريخ، وما راح نخترعه.", btn: "ندخل" },
        { explore: { until: "seats", hints: [{ after: 6, t: "مقاعدنا هناك قدّام الشاشة." }] } },
        { puzzle: "starpath", title: "خطوط ضوي السقف", intro: "سقف السينما بيه خطوط ضوي. تذكّروا ترتيب الأضواء اللي تشتعل.", stars: [[15, 30], [32, 18], [50, 30], [68, 18], [85, 30]], seq: [0, 2, 4, 3, 1], win: "الأضواء نزلت… والفيلم بلّش." },
        { calm: true, t: "شاشة كبيرة، ومقعدين يم بعض. هذا كل اللي نعرفه — وهذا يكفي.", sit: ["pair"] }
      ] },

    /* 5 ----------------------------------------------------------------- */
    { id: "isabday", title: "ثاني عيد ميلاد نعيّده سوه", dateLabel: "17/4/2026", place: "عيد ميلاد عيسى", icon: "camera", color: ["#2E3A5C", "#C9A25E"], sky: SKY.studio, theme: M.bright,
      lead: "ثاني عيد ميلاد لعيسى وآمنة يمّه. كيكة كاميرا، وصور، ورسالتين بنفس اليوم من سنتين.",
      photos: ["isa_cake1", "isa_cake2", "isa_cake3", "isa_cake4"],
      cliff: "كل عام وانت بألف خير يا عيسى.",
      scenes: { studio: { theme: "studio", len: 170, gk: "wood", amb: "confetti",
        objs: [
          { id: "cake", x: 100, y: 78.6, w: 9, a: "cameraCake", label: "كيكة الكاميرا", flag: "cake", run: [{ puzzle: "candles", title: "الشموع", intro: "المسوا الشموع وحدة وحدة.", n: 5, say: "تمنّى أمنية يا عيسى…", win: "كل عام وانت بخير!" }, { photos: ["isa_cake1", "isa_cake2", "isa_cake3", "isa_cake4"], title: "كيكات عيد ميلاد عيسى", t: "كيكة الكاميرا و«HAPPY YEAR ESSA». السنة مو مكتوبة على الصور." }] },
          { id: "letters", x: 142, w: 5, a: "giftBox", args: ["#FBF3E2", "#C9A25E"], label: "رسالتين بنفس اليوم", run: [{ say: "narr", t: "بنفس اليوم من سنتين، آمنة كتبتله." }, { letter: "bday26", title: "17/4/2026 — من آمنة" }, { letter: "bday25", title: "17/4/2025 — من آمنة" }] }
        ] } },
      beats: [
        { scene: "studio", cast: { pair: [18] }, player: "pair", cam: 0 },
        { cine: true, narr: "17/4/2026 · ثاني عيد ميلاد نعيّده سوه.", btn: "عيد ميلاد سعيد!" },
        { act: [["sfx", "cheer"], ["pair", "joy"]] },
        { explore: { until: "cake", hints: [{ after: 6, t: "الكيكة على الطاولة!" }] } },
        { say: "pair", t: "سنة ثانية… سوه.", e: "look" }
      ] },

    /* 6 ----------------------------------------------------------------- */
    { id: "court", title: "عقد المحكمة", dateLabel: "22/4/2026", place: "خطوة قبل الزواج", icon: "ring", color: ["#8EC3E0", "#8E1F2A"], sky: SKY.court, theme: M.warm,
      lead: "يوم فرح وطمأنينة: ورقة، توقيعين، ودفتر عائلة أحمر.",
      photos: ["court", "family_book"],
      cliff: "صار رسمي… والقلب مطمئن.",
      scenes: { court: { theme: "court", len: 180, gk: "plaza", amb: "dust",
        objs: [
          { id: "papers", x: 118, y: 80.5, w: 6, a: "papers", label: "أوراق العقد", flag: "signed", run: [{ act: [["pair", "to", 110]] }, { puzzle: "sign", title: "توقيعين", paper: "عقد الزواج", names: ["عيسى", "آمنة"], win: "صار رسمي." }, { photos: ["court", "family_book"], title: "يوم المحكمة", t: "المبنى والأوراق بيوم العقد، ودفتر العائلة الأحمر." }] }
        ] } },
      beats: [
        { scene: "court", cast: { pair: [14] }, player: "pair", cam: 0 },
        { cine: true, narr: "22/4/2026 · عقد المحكمة. خطوة مهمة قبل الزواج — بفرح وطمأنينة.", btn: "نطلع الدرج" },
        { explore: { until: "signed", hints: [{ after: 6, t: "الأوراق هناك عند الدرج." }] } },
        { act: [["pair", "joy"], ["sfx", "bell"]] },
        { calm: true, t: "ورقة وتوقيعين… وصار اللي بيناتهم رسمي." }
      ] },

    /* 7 ----------------------------------------------------------------- */
    { id: "keys", title: "مفتاح بيتنا", dateLabel: "10/5/2026", place: "الشقة", icon: "key", color: ["#E4DED2", "#E7B94A"], sky: SKY.corridor, theme: M.bright,
      lead: "استلموا مفتاح الشقة — باب ينفتح على بيتهم الجاي.",
      photos: ["keys", "cleaning"],
      cliff: "باب انفتح… ووراه بيت جاي.",
      scenes: {
        hall: { theme: "corridor", len: 150, gk: "tile",
          items: [{ k: "key", x: 56, y: 70, icon: "key", color: "#E7B94A", say: "المفتاح!" }],
          objs: [{ id: "door", x: 120, w: 13, a: "door", args: [0], label: "باب الشقة", flag: "door", need: c => c.inv.key, deny: [{ say: "pair", t: "المفتاح… لازم نلگاه أول." }], run: [{ fx: "doorOpen" }, { say: "narr", t: "تِك… الباب انفتح." }] }] },
        inside: { theme: "empty", len: 150, gk: "tilewhite",
          objs: [
            { id: "mop", x: 70, w: 5, a: "mop", label: "أول تنظيف", run: [{ photos: ["cleaning"], title: "أول تنظيف", t: "عيسى يمسح أرضية الشقة الفاضية. اليوم بالضبط مو مؤكد." }] },
            { id: "win", x: 118, y: 70, w: 6, a: "keyGlow", label: "المفتاح", flag: "home", run: [{ photos: ["keys"], title: "تسليم المفتاح", t: "إيد تسلّم المفاتيح بالشقة الفاضية." }] }
          ] }
      },
      beats: [
        { scene: "hall", cast: { pair: [14] }, player: "pair", cam: 0 },
        { cine: true, narr: "10/5/2026 · مفتاح الشقة.", btn: "ندوّر على المفتاح" },
        { explore: { until: "door", need: { key: 1 }, hints: [{ after: 6, t: "شي يلمع بالممر…" }] } },
        { scene: "inside", cast: { pair: [16] }, player: "pair", cam: 0 },
        { say: "pair", t: "فاضية… بس من هسه تحسها بيت.", e: "look" },
        { explore: { until: "home", hints: [{ after: 6, t: "الضوي يجي من الشباك." }] } },
        { calm: true, t: "حيطان بيضة وضوي من الشبابيك. هنا… بيتنا." }
      ] },

    /* 8 ----------------------------------------------------------------- */
    { id: "furniture", title: "اختارينه الأثاث", dateLabel: "20/6/2026", place: "من شقة لبيت", icon: "star", color: ["#9EA3A8", "#E7CB8E"], sky: SKY.gold, theme: M.warm,
      lead: "اختاروا الأثاث ونقلوه — والمكان صار بيت بالتفاصيل الصغيرة.",
      photos: ["showroom", "living", "living_night", "kitchen"],
      cliff: "التفاصيل الصغيرة… هي اللي تسوي البيت.",
      scenes: {
        shop: { theme: "showroom", len: 150, gk: "tilewhite",
          objs: [{ id: "sofa", x: 40, y: 80, w: 8, a: "phone", args: [true], label: "معرض الأثاث", flag: "chosen", run: [{ photos: ["showroom"], title: "بمعرض الأثاث", t: "عيسى بمعرض بيه كنب وطاولات وثريات. اليوم بالضبط مو مؤكد." }, { say: "pair", t: "هذا… يصير بصالتنا.", e: "look" }] }] },
        home: { theme: "home", len: 140, gk: "parquet" }
      },
      beats: [
        { scene: "shop", cast: { pair: [110, null, -1] }, player: "pair", cam: 40 },
        { cine: true, narr: "20/6/2026 · اختاروا الأثاث ونقلوه.", btn: "نختار" },
        { explore: { until: "chosen", hints: [{ after: 6, t: "الكنبة هناك!" }] } },
        { scene: "home", cast: { pair: [20] }, player: "pair", cam: 0 },
        { puzzle: "arrange", title: "رتّبوا الصالة", intro: "المسوا قطعة، بعدين المسوا مكانها — أو اسحبوها.", pieces: [{ a: "sofaModern", label: "الكنبة", x: 30, y: 52, w: 40 }, { a: "coffeeTable", label: "الطاولة", x: 40, y: 82, w: 20 }, { a: "floorLamp", label: "الضوي", x: 76, y: 30, w: 10 }, { a: "plant", label: "الزرعة", x: 10, y: 48, w: 12 }, { a: "wallArt", label: "اللوحة", x: 34, y: 8, w: 30 }], win: "صار بيت!" },
        { fx: "furnish" },
        { photos: ["living", "living_night", "kitchen"], title: "بيتنا", t: "الصالة والمطبخ من الصور المرفوعة. تاريخ تصويرها غير معروف." },
        { calm: true, t: "كنبة، وضوي، وزرعة بالزاوية… والمكان صار بيت." }
      ] },

    /* 9 ----------------------------------------------------------------- */
    { id: "amnabday", title: "ثاني عيد ميلاد آمنة سوه", dateLabel: "24/9/2026", place: "دوّار الشمس", icon: "flower", color: ["#F2C230", "#8E6C33"], sky: SKY.gold, theme: M.tender,
      lead: "ورد أصفر، وكيكة كتاب بدوّار الشمس مكتوب عليها اسمها، وآمنة.",
      photos: ["amna_cake", "amna_card", "amna_gifts", "amna_yellow1", "amna_yellow2"],
      cliff: "كل عام وانتِ بخير يا آمنة.",
      scenes: { room: { theme: "gold", len: 170, gk: "parquet", amb: "glow",
        items: [{ k: "sun", x: 30, y: 72, icon: "flower", color: "#F2C230" }, { k: "sun", x: 52, y: 66, icon: "flower", color: "#F2C230" }, { k: "sun", x: 74, y: 74, icon: "flower", color: "#F2C230" }, { k: "sun", x: 92, y: 64, icon: "flower", color: "#F2C230" }, { k: "sun", x: 104, y: 74, icon: "flower", color: "#F2C230", say: "خمسة! صارت باقة." }],
        zones: [{ x0: 112, x1: 150, need: c => (c.inv.sun || 0) >= 5, deny: [{ say: "isa", t: "باقي دوّار شمس للباقة…" }], flag: "given", block: true }]
      } },
      beats: [
        { scene: "room", cast: { isa: [16], amna: [140, null, -1] }, player: "isa", cam: 0 },
        { cine: true, narr: "24/9/2026 · ثاني عيد ميلاد آمنة سوه. دوّار الشمس بكل مكان.", btn: "نجمع الورد" },
        { explore: { until: "given", need: { sun: 5 }, hints: [{ after: 6, who: "isa", t: "خمس وردات دوّار شمس… للباقة." }] } },
        { act: [["isa", "to", 132], ["amna", "face", -1], ["isa", "face", 1]] },
        { fx: "bouquet" }, { act: [["amna", "shy"], ["isa", "look"]] },
        { say: "amna", t: "دوّار الشمس… 🤍", e: "shy" },
        { photos: ["amna_card", "amna_cake", "amna_gifts", "amna_yellow1", "amna_yellow2"], title: "عيد ميلاد آمنة", t: "الكيكة مكتوب عليها «Happy B… Amona» و 24/9، ويا الباقة الصفرة." },
        { calm: true, t: "ورد أصفر، وكيكة بدوّار الشمس، وآمنة." }
      ] },

    /* 10 ---------------------------------------------------------------- */
    { id: "suit", title: "دنختار البدلة", dateLabel: "7/10/2026", place: "تجهيزات الزواج", icon: "tie", color: ["#3B2E26", "#D8CBB4"], sky: SKY.tailor, theme: M.warm,
      lead: "مشهد لطيف من تجهيزات الزواج: محل بدلات، ومراية، وموعد يقرب.",
      photos: [],
      cliff: "البدلة جاهزة… والموعد قريب.",
      scenes: { shop: { theme: "tailor", len: 160, gk: "wooddark", amb: "dust",
        items: [{ k: "tape", x: 40, y: 72, icon: "tape", color: "#E7CB8E" }, { k: "tie", x: 82, y: 66, icon: "tie", color: "#C98B8B" }, { k: "pin", x: 104, y: 72, icon: "pin", color: "#E7CB8E" }],
        objs: [{ id: "mirror", x: 138, w: 9, a: "mirrorTall", label: "المراية", flag: "mirror", need: c => c.inv.tape && c.inv.tie && c.inv.pin, deny: [{ say: "amna", t: "شريط القياس… والربطة… والدبوس. بعدين المراية." }], run: [{ act: [["isa", "to", 130], ["amna", "to", 124]] }, { act: [["amna", "wave"], ["isa", "nod"]] }, { say: "amna", t: "هيچ… حلو.", e: "shy" }] }]
      } },
      beats: [
        { scene: "shop", cast: { isa: [24], amna: [14] }, player: "isa", follow: ["amna"], cam: 0 },
        { cine: true, narr: "7/10/2026 · اختيار البدلة.", btn: "ندخل المحل" },
        { explore: { until: "mirror", need: { tape: 1, tie: 1, pin: 1 }, hints: [{ after: 6, who: "amna", t: "شريط القياس هناك." }] } },
        { calm: true, t: "قدّام المراية… باقي كم يوم. (ما عدنا صورة من هذا اليوم بعد — تگدرون تضيفونها بحائط ذكرياتنا.)" }
      ] },

    /* 11 ---------------------------------------------------------------- */
    { id: "wedding", title: "يوم الزواج", dateLabel: "30/10/2026", place: "الموعد اللي تمشي له الحكاية", icon: "ring", color: ["#3A2340", "#E0703A"], sky: SKY.wedding, theme: M.celebrate,
      lead: "هنا تنتهي الطريق… وتبدي الحكاية الأحلى.",
      photos: ["fire1", "fire2", "fire3", "shoot_garden", "proposal"],
      cliff: "هنا ما تخلص الحكاية… هنا تبدي.",
      scenes: { garden: { theme: "wedding", len: 210, gk: "grassnight", amb: "sparks", archX: 192,
        objs: [
          { id: "f1", x: 58, w: 4, a: "fountain", label: "نافورة نار", run: [{ fx: "sparks" }] },
          { id: "drum", x: 86, w: 5, a: "drum", label: "الزفة", run: [{ act: [["sfx", "cheer"], ["pair", "joy"]] }, { say: "narr", t: "طبل وهلاهل… الزفة." }] },
          { id: "cele", x: 118, y: 72, w: 7, a: "goldFrame", args: ["#5A3A3A", false], label: "من احتفالاتنا", run: [{ photos: ["fire1", "fire2", "fire3"], title: "من احتفالاتنا", t: "صور احتفال وألعاب نارية. المناسبة والتاريخ غير محددين بالصور." }] },
          { id: "trip", x: 152, y: 72, w: 7, a: "goldFrame", args: ["#E8DDC8", false], label: "من رحلتنا", run: [{ photos: ["shoot_garden", "shoot_roses", "shoot_tree", "shoot_bw", "proposal", "shoot_sunset"], title: "من رحلتنا", t: "صور سوه. تواريخها غير معروفة." }] },
          { id: "f2", x: 172, w: 4, a: "fountain", label: "نافورة نار", run: [{ fx: "sparks" }] },
          { id: "arch", x: 192, w: 16, ph: 26, a: () => "", label: "تحت القوس", flag: "arch", run: [{ act: [["pair", "to", 192]] }] }
        ] } },
      beats: [
        { scene: "garden", cast: { pair: [14] }, player: "pair", cam: 0 },
        { cine: true, narr: c => { const d = daysToWedding(); return `30/10/2026 · يوم الزواج. ${d > 1 ? `باقي ${d} يوم على الموعد.` : d === 1 ? "باچر الموعد!" : d === 0 ? "اليوم الموعد!" : "صار… مبروك!"}`; }, btn: "الزفة" },
        { explore: { until: "arch", hints: [{ after: 7, t: "القوس بآخر الطريق…" }] } },
        { act: [["pair", "look"], ["fx", "fireworks"]] },
        { calm: true, t: "من 16/1 لهنا. هنا ما تخلص الحكاية… هنا تبدي." }
      ] }
  ];

  /* ---------------- النهاية: عدول (بعد الرحلة فقط) ---------------- */
  const ending = { id: "ending", title: "النهاية", dateLabel: "بعد الرحلة", place: "", sky: SKY.wedding, theme: M.celebrate,
    scenes: { night: { theme: "wedding", len: 150, gk: "grassnight", amb: "sparks", archX: 60 } },
    beats: [
      { scene: "night", cast: { pair: [60, null, 1], adool: [140, null, -1, "hide"] }, player: "pair", cam: c => 20 },
      { cine: true, narr: "خلصت الرحلة… بس أحد صغير جاي يركض من طرف الحديقة." },
      { act: [["adool", "show"], ["adool", "to", 88, { speed: 20 }]] },
      { act: [["adool", "wave", 1800], ["pair", "look"]] },
      { act: [["adool", "greet"], ["wait", 700]] },
      { say: "adool", t: CONFIG.adoolLine, e: "greet" },
      { fx: "adoolCard" },
      { act: [["pair", "joy"], ["fx", "fireworks"]] }
    ] };

  return { stations, ending, themes, fx, itemArt, barks, winLines, audio: {} };
})();
