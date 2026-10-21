/* =====================================================================
   عالم الألعاب — إطار الألعاب المشترك منقول من «عالمنا» بمشروع إيلاف
   (gameUI: لوحة تعريف، بدء، إيقاف، إعادة، فوز، خروج)، وألعاب بمحتوى عيسى وآمنة.
   التقدّم محفوظ محلياً: Store("games") = {id:{won, best, plays}}
   ===================================================================== */
const Games = (() => {
  const rec = () => Store.get("games", {});
  function record(id, won, score, better) {
    const all = rec(), g = all[id] || { plays: 0 };
    g.plays++; if (won) g.won = true;
    if (score != null && (g.best == null || better(score, g.best))) { g.best = score; g.newBest = true; } else g.newBest = false;
    all[id] = g; Store.set("games", all); return g;
  }
  const lower = (a, b) => a < b, higher = (a, b) => a > b;
  const PICS = ["shoot_garden", "proposal", "amna_cake", "isa_cake3", "cinema_selfie", "court", "keys", "frame", "shoot_sunset", "hold_hand", "selfie_laugh", "amna_card"];

  /* ---------- الإطار المشترك (gameUI من إيلاف) ---------- */
  function gameUI(body, g, opts = {}) {
    const wrap = h(`<div class="wg wg-${g.id}" style="${g.bg ? `--wg-bg:${g.bg}` : ""}">
      <div class="wg-top"><span class="wg-stat" aria-live="polite"></span><span class="wg-btns"><button class="ibtn light sm" data-pause aria-label="إيقاف مؤقت" hidden>${IC.pause}</button><button class="ibtn light sm" data-restart aria-label="إعادة" hidden>${IC.restart}</button></span></div>
      <div class="wg-frame"><div class="wg-layer"></div>
        <div class="wg-ov" data-intro><div class="wg-card"><span class="wg-art">${g.art ? g.art() : TART.symbol(g.icon || "star", "#FBF3E2")}</span><h3>${esc(g.title)}</h3><p class="wg-goal">${esc(g.goal)}</p><ul class="wg-how">${g.how.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
          ${g.levels ? `<div class="seg wg-lv" role="group" aria-label="الصعوبة">${g.levels.map((l, i) => `<button data-lv="${i}" aria-pressed="${i === 0}">${l}</button>`).join("")}</div>` : ""}
          <button class="btn gold" data-start>${IC.play} يلا نلعب</button>${opts.back ? `<button class="btn line sm" data-gback>رجوع لعالم الألعاب</button>` : ""}</div></div>
        <div class="wg-ov" data-pov hidden><div class="wg-card"><h3>موقوفة</h3><button class="btn gold" data-resume>كمّلوا</button><button class="btn line sm" data-restart2>من جديد</button><button class="btn line sm" data-gback3>خروج</button></div></div>
        <div class="wg-ov" data-end hidden><div class="wg-card"></div></div>
      </div>
      <p class="wg-say" aria-live="polite"></p></div>`);
    body.appendChild(wrap);
    const frame = $(".wg-frame", wrap), layer = $(".wg-layer", wrap), intro = $("[data-intro]", wrap), pov = $("[data-pov]", wrap), endOv = $("[data-end]", wrap);
    let level = 0, cleanupG = null, paused = false, running = false, raf = 0, last = 0, loopFn = null, timers = [];
    $$("[data-lv]", wrap).forEach(b => b.onclick = () => { level = +b.dataset.lv; $$("[data-lv]", wrap).forEach(x => x.setAttribute("aria-pressed", x === b)); });
    const tick = now => { raf = requestAnimationFrame(tick); const dt = Math.min(.05, (now - last) / 1000); last = now; if (!paused && loopFn) loopFn(dt, now / 1000); };
    const ctx = {
      frame, layer, get level() { return level; }, get paused() { return paused; },
      W: () => frame.clientWidth, H: () => frame.clientHeight,
      stat: t => { $(".wg-stat", wrap).textContent = t; }, say: t => { const s = $(".wg-say", wrap); s.textContent = t; s.classList.remove("pop"); void s.offsetWidth; s.classList.add("pop"); },
      loop: fn => { loopFn = fn; last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); },
      after: (ms, fn) => { const t = { left: ms, fn }; timers.push(t); return t; },
      win: (msg, score, stars) => finish(true, msg, score, stars), lose: (msg, score) => finish(false, msg, score, 0), sfx: (n, ...a) => TAudio.sfx(n, ...a)
    };
    const tcheck = setInterval(() => { if (paused || !running) return; timers.forEach(t => { t.left -= 100; if (t.left <= 0 && !t.done) { t.done = true; t.fn(); } }); timers = timers.filter(t => !t.done); }, 100);
    function start() { TAudio.unlock(); intro.hidden = true; endOv.hidden = true; pov.hidden = true; layer.innerHTML = ""; timers = []; paused = false; running = true; loopFn = null; cancelAnimationFrame(raf); cleanupG && cleanupG(); $("[data-pause]", wrap).hidden = false; $("[data-restart]", wrap).hidden = false; ctx.say(""); TAudio.sfx("soft"); cleanupG = g.run(ctx) || null; }
    function finish(won, msg, score, stars = 1) {
      running = false; loopFn = null; cancelAnimationFrame(raf); $("[data-pause]", wrap).hidden = true;
      const r = record(g.id, won, score, g.better || lower);
      TAudio.sfx(won ? "ok" : "nope"); if (won) confetti();
      const isCore = CONFIG.coreGames.includes(g.id);
      $(".wg-card", endOv).innerHTML = `${won ? `<div class="wg-stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? "on" : ""}">${IC.star}</span>`).join("")}</div>` : ""}<h3>${esc(msg || (won ? "فزتوا!" : "قريبة!"))}</h3>
        ${score != null && g.bestLabel ? `<p>${esc(g.bestLabel(score))}${r.newBest ? " — أحسن نتيجة إلكم!" : r.best != null ? ` · الأحسن: ${esc(g.bestLabel(r.best))}` : ""}</p>` : ""}
        ${won && isCore ? `<p class="note">${Progress.coreWon()} من ${CONFIG.coreGames.length} ألعاب أساسية</p>` : ""}
        <button class="btn gold" data-again>${IC.restart} مرة ثانية</button>${g.levels ? `<button class="btn line sm" data-lvl>غيّروا الصعوبة</button>` : ""}<button class="btn line sm" data-gback2>عالم الألعاب</button>`;
      endOv.hidden = false;
      $("[data-again]", endOv).onclick = start;
      const lv = $("[data-lvl]", endOv); if (lv) lv.onclick = () => { endOv.hidden = true; intro.hidden = false; };
      $("[data-gback2]", endOv).onclick = opts.back;
    }
    $("[data-start]", wrap).onclick = start;
    const gb = $("[data-gback]", wrap); if (gb) gb.onclick = opts.back;
    $("[data-gback3]", wrap).onclick = opts.back;
    $("[data-pause]", wrap).onclick = () => { if (!running) return; paused = true; pov.hidden = false; };
    $("[data-resume]", wrap).onclick = () => { paused = false; pov.hidden = true; last = performance.now(); };
    $("[data-restart]", wrap).onclick = start; $("[data-restart2]", wrap).onclick = start;
    const vis = () => { if (document.hidden && running) { paused = true; pov.hidden = false; } };
    document.addEventListener("visibilitychange", vis);
    return { el: wrap, ctx, destroy() { cancelAnimationFrame(raf); clearInterval(tcheck); cleanupG && cleanupG(); document.removeEventListener("visibilitychange", vis); } };
  }

  /* =====================================================================
     الألعاب
     ===================================================================== */
  const G = {};

  /* 1) تتذكرها؟ — ذاكرة صورهم */
  G.memory = { id: "memory", title: "تتذكرها؟", sub: "ذاكرة الصور", core: true, color: ["#2B3350", "#C9A25E"], icon: "star",
    goal: "لگوا كل زوج صور متشابه بأقل محاولات.", how: ["اقلبوا بطاقتين بكل دور.", "إذا تطابقن يبقن مفتوحات.", "بالبداية تشوفون الصور ثانيتين."],
    levels: ["٦ أزواج", "٨ أزواج"], bestLabel: v => `${v} محاولة`, better: lower,
    run(ctx) {
      const n = ctx.level ? 8 : 6, pics = shuffle(PICS).slice(0, n), cards = shuffle(pics.concat(pics));
      let open = [], tries = 0, found = 0, lock = true;
      const grid = h(`<div class="mm-grid" style="--cols:${n === 8 ? 4 : 4}">${cards.map((p, i) => `<button class="mm-card open" data-i="${i}" data-p="${p}" aria-label="بطاقة ${i + 1}"><span class="mm-back">${IC.heart}</span><img src="${photoSrc(p, 480)}" alt="" loading="eager"></button>`).join("")}</div>`);
      ctx.layer.appendChild(grid);
      ctx.stat(`المحاولات: 0 · الأزواج: 0/${n}`);
      setTimeout(() => { $$(".mm-card", grid).forEach(c => c.classList.remove("open")); lock = false; ctx.say("يلا! اقلبوا بطاقتين."); }, 2000);
      $$(".mm-card", grid).forEach(c => c.onclick = () => {
        if (lock || c.classList.contains("open")) return;
        c.classList.add("open"); ctx.sfx("soft"); open.push(c);
        if (open.length === 2) { tries++; lock = true; const [a, b] = open;
          if (a.dataset.p === b.dataset.p) { found++; a.classList.add("got"); b.classList.add("got"); ctx.sfx("pick"); open = []; lock = false; const p = PHOTO[a.dataset.p]; ctx.say(p ? p.t : "حلو!"); if (found === n) setTimeout(() => ctx.win("كل الصور رجعت لمكانها!", tries, tries <= n + 2 ? 3 : tries <= n * 2 ? 2 : 1), 600); }
          else setTimeout(() => { a.classList.remove("open"); b.classList.remove("open"); open = []; lock = false; }, 850);
          ctx.stat(`المحاولات: ${tries} · الأزواج: ${found}/${n}`); }
      });
    } };

  /* 2) جمّع الذكرى — لغز صورة */
  G.puzzle = { id: "puzzle", title: "جمّع الذكرى", sub: "لغز الصور", core: true, color: ["#6B4A35", "#E3C68C"], icon: "flower",
    goal: "رجّعوا الصورة كاملة.", how: ["المسوا قطعة، بعدين المسوا قطعة ثانية — يتبادلن.", "تگدرون تسحبون القطعة فوق مكانها هم.", "القطعة اللي بمكانها الصح يصير إطارها ذهبي."],
    levels: ["٣×٣", "٤×٤"], bestLabel: v => `${v} حركة`, better: lower,
    run(ctx) {
      const N = ctx.level ? 4 : 3, pid = pick(["shoot_garden", "proposal", "shoot_sunset", "amna_card", "court", "frame"]), p = PHOTO[pid];
      let order = shuffle([...Array(N * N).keys()]); while (order.every((v, i) => v === i)) order = shuffle(order);
      let sel = null, moves = 0;
      const box = h(`<div class="pz-wrap"><div class="pzg" style="--n:${N};aspect-ratio:${p.ar}"></div><img class="pz-ref" src="${photoSrc(pid, 480)}" alt="الصورة كاملة"></div>`);
      ctx.layer.appendChild(box);
      const gridEl = $(".pzg", box);
      const draw = () => { gridEl.innerHTML = order.map((t, i) => `<button class="pzt ${t === i ? "ok" : ""}" data-i="${i}" style="background-image:url(${photoSrc(pid, 1280)});background-size:${N * 100}% ${N * 100}%;background-position:${(t % N) / (N - 1) * 100}% ${Math.floor(t / N) / (N - 1) * 100}%" aria-label="قطعة"></button>`).join(""); bind(); };
      const swap = (a, b) => { [order[a], order[b]] = [order[b], order[a]]; moves++; ctx.sfx("soft"); ctx.stat(`الحركات: ${moves}`); draw(); if (order.every((v, i) => v === i)) { ctx.sfx("ok"); gridEl.classList.add("done"); setTimeout(() => ctx.win(`«${p.t}» رجعت كاملة!`, moves, moves <= N * N ? 3 : moves <= N * N * 2 ? 2 : 1), 700); } };
      function bind() {
        $$(".pzt", gridEl).forEach(t => {
          t.onclick = () => { const i = +t.dataset.i; if (sel == null) { sel = i; t.classList.add("sel"); } else if (sel === i) { sel = null; t.classList.remove("sel"); } else { const a = sel; sel = null; swap(a, i); } };
          let d = null;
          t.addEventListener("pointerdown", e => { d = { x: e.clientX, y: e.clientY, m: false }; try { t.setPointerCapture(e.pointerId); } catch (_) {} });
          t.addEventListener("pointermove", e => { if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10) { d.m = true; t.style.transform = `translate(${e.clientX - d.x}px,${e.clientY - d.y}px)`; t.style.zIndex = 5; } });
          t.addEventListener("pointerup", e => { if (d && d.m) { t.style.transform = ""; const o = document.elementsFromPoint(e.clientX, e.clientY).find(x => x.classList && x.classList.contains("pzt") && x !== t); if (o) { sel = null; swap(+t.dataset.i, +o.dataset.i); } else draw(); } d = null; });
        });
      }
      ctx.stat("الحركات: 0"); ctx.say(`الصورة: «${p.t}»`); draw();
    } };

  /* 3) لقطة من القصر — كاميرا عيسى */
  G.camera = { id: "camera", title: "لقطة من القصر", sub: "كاميرا عيسى", core: true, color: ["#C9845A", "#F6D2A4"], icon: "camera",
    goal: "صوّروا ثلاث لقطات بالقصر الروماني، مثل ما چان عيسى يصوّر.", how: ["اسحبوا المشهد (أو الأسهم) لحد ما يصير الهدف وسط الإطار.", "دوسوا «صوّر» (أو Space).", "عندكم ٣ غلطات قبل ما تنتهي الجولة."],
    bestLabel: v => `${v} غلطة`, better: lower,
    run(ctx) {
      const TG = [{ k: "chandelier", n: "الثريا", a: () => TART.chandelier() }, { k: "arch", n: "الشباك المقوّس", a: () => TART.archWindow("#B9D3E2", "#7FA3C4") }, { k: "frame", n: "الإطار الذهبي", a: () => TART.goldFrame("#CDBBA0", true) }, { k: "sofa", n: "الكنبة الكحلية", a: () => TART.sofaClassic("#2E3A5C") }, { k: "column", n: "العمود", a: () => TART.column() }];
      const seq = shuffle(TG).slice(0, 3); let shot = 0, miss = 0, off = 0, vel = 0;
      const W = 1400;
      const scene = h(`<div class="cm"><div class="cm-world" style="width:${W}px">${TART.hallWall(400).replace("<svg", '<svg class="cm-wall"')}
        ${TG.map((t, i) => `<div class="cm-o cm-${t.k}" data-k="${t.k}" style="left:${120 + i * 260 + (i % 2) * 40}px">${t.a()}</div>`).join("")}</div>
        <div class="cm-vf"><i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i><span class="cm-dot"></span></div><b class="cm-flash"></b>
        <div class="cm-ui"><button class="ibtn light" data-l aria-label="يسار">${IC.next}</button><button class="btn gold" data-shoot>${IC.camera} صوّر</button><button class="ibtn light" data-r aria-label="يمين">${IC.back}</button></div></div>`);
      ctx.layer.appendChild(scene);
      const world = $(".cm-world", scene), fl = $(".cm-flash", scene);
      const maxOff = () => W - ctx.W();
      const place = () => { off = Math.max(0, Math.min(maxOff(), off)); world.style.transform = `translateX(${-off}px)`; };
      const target = () => seq[shot];
      const say = () => ctx.say(`صوّروا: ${target().n}`);
      const stat = () => ctx.stat(`اللقطات: ${shot}/3 · الغلطات: ${miss}/3`);
      let dragX = null;
      scene.addEventListener("pointerdown", e => { if (e.target.closest("button")) return; dragX = e.clientX; try { scene.setPointerCapture(e.pointerId); } catch (_) {} });
      scene.addEventListener("pointermove", e => { if (dragX == null) return; off -= (e.clientX - dragX); dragX = e.clientX; place(); });
      scene.addEventListener("pointerup", () => dragX = null);
      const hold = (btn, d) => { btn.addEventListener("pointerdown", () => vel = d); ["pointerup", "pointerleave", "pointercancel"].forEach(t => btn.addEventListener(t, () => vel = 0)); };
      hold($("[data-l]", scene), -1); hold($("[data-r]", scene), 1);
      const shoot = () => {
        fl.classList.remove("on"); void fl.offsetWidth; fl.classList.add("on"); ctx.sfx("shutter");
        const vf = $(".cm-vf", scene).getBoundingClientRect(), cx = vf.left + vf.width / 2;
        const el = $(`.cm-o[data-k="${target().k}"]`, scene).getBoundingClientRect(), ex = el.left + el.width / 2;
        if (Math.abs(ex - cx) < Math.max(36, el.width * .28)) { shot++; ctx.sfx("pick"); stat(); if (shot === 3) return ctx.win("ثلاث لقطات من القصر!", miss, miss === 0 ? 3 : miss === 1 ? 2 : 1); ctx.say("لقطة حلوة! " ); setTimeout(say, 900); }
        else { miss++; ctx.sfx("nope"); stat(); if (miss >= 3) return ctx.lose("خلصت الغلطات — جرّبوا مرة ثانية", null); ctx.say(`مو هذا… دوّروا على ${target().n}`); }
      };
      $("[data-shoot]", scene).onclick = shoot;
      const key = e => { if (e.code === "Space") { e.preventDefault(); shoot(); } if (e.code === "ArrowLeft") { off -= 40; place(); } if (e.code === "ArrowRight") { off += 40; place(); } };
      window.addEventListener("keydown", key);
      ctx.loop(dt => { if (vel) { off += vel * 420 * dt; place(); } });
      off = 0; place(); stat(); say();
      return () => window.removeEventListener("keydown", key);
    } };

  /* 4) شنو تتذكرون؟ — أسئلة من وقائع حكايتهم بس */
  const QUIZ = [
    { q: "وين صارت أول صدفة؟", o: ["القصر الروماني", "السينما", "معرض الأثاث"], a: 0 },
    { q: "شنو چان شغل آمنة بوقتها؟", o: ["تشتغل بالموقع", "تجي تصوّر", "زايرة"], a: 0 },
    { q: "عيسى ليش چان يجي للقصر؟", o: ["يجي يصوّر", "يشتغل بالموقع", "يدرس هناك"], a: 0 },
    { q: "شنو الستوري اللي بلّش الحچي؟", o: ["عرسان غريبي الأطوار", "كيكة عيد ميلاد", "غروب عند النهر"], a: 0 },
    { q: "حسب كلام آمنة، شگد بعد ما بلشوا يحچون صارحوا بعض؟", o: ["يمكن ما كملت عشرة أيام", "بعد سنة", "بعد شهرين"], a: 0 },
    { q: "شوكت أول عيد حب سوه؟", o: ["14/2/2026", "17/4/2026", "24/9/2026"], a: 0 },
    { q: "تاريخ أول سينما سوه؟", o: ["14/2/2026", "20/6/2026", "غير محدد"], a: 2 },
    { q: "شوكت ثاني عيد ميلاد عيسى سوه؟", o: ["17/4/2026", "22/4/2026", "10/5/2026"], a: 0 },
    { q: "شوكت عقد المحكمة؟", o: ["22/4/2026", "13/2/2026", "7/10/2026"], a: 0 },
    { q: "شوكت استلموا مفتاح الشقة؟", o: ["10/5/2026", "20/6/2026", "7/10/2026"], a: 0 },
    { q: "كيكة عيد ميلاد آمنة الثاني چانت بأي ورد؟", o: ["دوّار الشمس", "جوري أحمر", "ياسمين"], a: 0 },
    { q: "شوكت اختاروا البدلة؟", o: ["7/10/2026", "24/9/2026", "30/10/2026"], a: 0 },
    { q: "شوكت خطوبتهم؟", o: ["14/2/2026", "13/2/2026", "22/4/2026"], a: 1 },
    { q: "شوكت موعد الزفاف المنتظر؟", o: ["30/10/2026", "7/10/2026", "24/9/2026"], a: 0 },
    { q: "بأي كلمة يسمّون بعض برسائلهم؟", o: ["عوضي", "قمري", "دنيتي فقط"], a: 0 }
  ];
  G.quiz = { id: "quiz", title: "شنو تتذكرون؟", sub: "أسئلة من حكايتكم", core: false, color: ["#3E4E6A", "#B898A7"], icon: "letter",
    goal: "أسئلة خفيفة من وقائع حكايتكم بس — بدون تواريخ مخترعة.", how: ["اختاروا جواب واحد لكل سؤال.", "تگدرون تتخطون أي سؤال."],
    bestLabel: v => `${v} جواب صح`, better: higher,
    run(ctx) {
      const qs = shuffle(QUIZ).slice(0, 8); let i = 0, right = 0;
      const box = h(`<div class="qz"><div class="qz-card"></div></div>`); ctx.layer.appendChild(box);
      const card = $(".qz-card", box);
      const show = () => {
        if (i >= qs.length) return ctx.win(right >= 7 ? "تتذكرون كلشي!" : "حلو!", right, right >= 7 ? 3 : right >= 5 ? 2 : 1);
        const q = qs[i], opts = shuffle(q.o.map((t, k) => ({ t, ok: k === q.a })));
        ctx.stat(`سؤال ${i + 1} من ${qs.length} · صح: ${right}`);
        card.innerHTML = `<p class="qz-q">${esc(q.q)}</p><div class="qz-o">${opts.map((o, k) => `<button class="btn line" data-k="${k}">${esc(o.t)}</button>`).join("")}</div><button class="btn line sm qz-skip">تخطّي</button>`;
        $$("[data-k]", card).forEach(b => b.onclick = () => { const o = opts[+b.dataset.k]; $$("[data-k]", card).forEach(x => x.disabled = true); if (o.ok) { right++; b.classList.add("right"); ctx.sfx("pick"); ctx.say("صح!"); } else { b.classList.add("wrong"); $$("[data-k]", card)[opts.findIndex(x => x.ok)].classList.add("right"); ctx.sfx("nope"); ctx.say("مو هاي…"); } setTimeout(() => { i++; show(); }, 1100); });
        $(".qz-skip", card).onclick = () => { i++; show(); };
      };
      show();
    } };

  /* 5) جهزوا البيت — رتبوا الأثاث (لعبة تعاون) */
  G.home = { id: "home", title: "جهزوا البيت", sub: "لعبة تعاون", core: false, color: ["#7A9B66", "#F3EADC"], icon: "key",
    goal: "رتّبوا قطع الأثاث بأماكنها حتى تصير الشقة بيت.", how: ["المسوا قطعة، بعدين المسوا مكانها المرسوم — أو اسحبوها.", "العبوها سوه: واحد يختار، والثاني يحط."],
    bestLabel: v => `${v} ثانية`, better: lower,
    run(ctx) {
      const t0 = performance.now();
      const holder = h(`<div class="hm"></div>`); ctx.layer.appendChild(holder);
      const api = { solve: () => { const s = Math.round((performance.now() - t0) / 1000); ctx.win("صار بيت!", s, s < 30 ? 3 : s < 60 ? 2 : 1); }, say: t => ctx.say(t), sfx: (n, ...a) => ctx.sfx(n, ...a), note: (n, d) => TAudio.note(n, d), onHint() {}, onSkip() {}, onCleanup() {}, fill: t => t };
      TPZ.arrange(holder, { pieces: [{ a: "sofaModern", label: "الكنبة", x: 30, y: 52, w: 40 }, { a: "coffeeTable", label: "الطاولة", x: 40, y: 82, w: 20 }, { a: "floorLamp", label: "الضوي", x: 76, y: 30, w: 10 }, { a: "plant", label: "الزرعة", x: 10, y: 48, w: 12 }, { a: "wallArt", label: "اللوحة", x: 34, y: 8, w: 30 }, { a: "rugRound", label: "الزولية", x: 26, y: 88, w: 48 }] }, api);
      ctx.stat("رتّبوا الصالة"); ctx.say("اختاروا قطعة من تحت.");
    } };

  const ORDER = ["memory", "puzzle", "camera", "quiz", "home"];
  const title = id => (G[id] || {}).title || id;

  /* ---------- عالم الألعاب ---------- */
  function viewWorld(root) {
    const R = rec(), c = Progress.coreWon();
    const v = h(`<section class="view page gw-page noselect"><div class="page-inner">
      <header class="page-head"><div><h1>عالم الألعاب</h1><p class="page-sub">خمس أجنحة، كل جناح لعبة مصممة من حكايتكم. الألعاب الأساسية الثلاث تنحسب نجوم بعالم الألعاب.</p></div></header>
      <div class="gw-prog"><span class="gw-stars">${CONFIG.coreGames.map(g => `<i class="${R[g] && R[g].won ? "on" : ""}">${IC.star}</i>`).join("")}</span><span>${c} من ${CONFIG.coreGames.length} أساسية · ${Progress.stationsDone()} من ${HIKAYAT.stations.length} محطة${prefs.openAll ? " · «إتاحة الحكاية كاملة» مفعّلة" : ""}</span></div>
      <div class="gw-wings">${ORDER.map(id => { const g = G[id], s = R[id]; return `<button class="gw-wing" data-g="${id}" style="--c1:${g.color[0]};--c2:${g.color[1]}">
        <span class="gw-art">${TART.symbol(g.icon, "#FBF3E2")}</span><span class="gw-badge ${s && s.won ? "won" : ""}">${s && s.won ? "فزتوا ✦" : g.core ? "أساسية" : "إضافية"}</span>
        <span class="gw-txt"><b>${esc(g.title)}</b><small>${esc(g.sub)}${s && s.plays ? ` · لعبتوها ${s.plays} ${s.plays === 1 ? "مرة" : "مرات"}` : ""}${s && s.best != null && g.bestLabel ? ` · الأحسن: ${esc(g.bestLabel(s.best))}` : ""}</small></span></button>`; }).join("")}</div>
    </div></section>`);
    root.appendChild(v);
    $$(".gw-wing", v).forEach(b => b.onclick = () => { TAudio.unlock(); TAudio.sfx("soft"); go("games:" + b.dataset.g); });
  }
  function viewGame(root, id) {
    const g = G[id]; if (!g) { go("games", false); return; }
    const v = h(`<section class="view page gm-page noselect" style="--c1:${g.color[0]};--c2:${g.color[1]}"><div class="page-inner">
      <div class="gm-head"><button class="ibtn" data-back aria-label="رجوع لعالم الألعاب">${IC.back}</button><h1>${esc(g.title)}</h1></div><div class="gm-body"></div></div></section>`);
    root.appendChild(v);
    const back = () => go("games");
    $("[data-back]", v).onclick = back;
    const ui = gameUI($(".gm-body", v), g, { back });
    return () => ui.destroy();
  }
  function view(root, arg) { return arg ? viewGame(root, arg) : viewWorld(root); }
  return { view, title, G };
})();
