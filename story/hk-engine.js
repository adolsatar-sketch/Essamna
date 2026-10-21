/* =====================================================================
   حكايتنا — محرّك الحكاية (منقول من محرّك «حكاياتنا» بمشروع إيلاف)
   • view(root, arg): بدون arg = طريق المحطات، "palace" = محطة مباشرة.
   • يقرأ المحطات من HIKAYAT (hk-chapters.js) ويشغّل «الخطوات» (beats) بالترتيب.
   • ending(root): نهاية عدول — ما تنفتح قبل إكمال الرحلة.
   • الحفظ محلي فقط: Store("story").
   ===================================================================== */
const StoryEngine = (() => {
  const DEF = { done: {}, cp: {}, choices: {}, items: {}, endingSeen: false, endingSaved: false };
  let SV = null;
  const save = () => Store.set("story", SV);
  function init() { SV = Object.assign(JSON.parse(JSON.stringify(DEF)), Store.get("story", {})); }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  /* ---------- الأسماء والشخصيات ---------- */
  const NAMES = { isa: () => CONFIG.isa, amna: () => CONFIG.amna, pair: () => `${CONFIG.isa} و${CONFIG.amna}`, adool: () => CONFIG.adool, narr: () => "الحكاية" };
  const CHARS = {
    isa: { h: 31, color: "#D9B48A", html: () => TRig.html("isa") },
    amna: { h: 28.3, color: "#D9A9B6", html: () => TRig.html("amna") },
    pair: { h: 31, color: "#E7CB8E", html: () => TRig.html("pair") },
    adool: { h: 17, color: "#B8D69C", html: () => TRig.html("adool") }
  };
  const fill = (t, ctx) => { if (typeof t === "function") t = t(ctx || {}); return String(t ?? "").replace(/\{I\}/g, CONFIG.isa).replace(/\{A\}/g, CONFIG.amna).replace(/\{D\}/g, CONFIG.adool); };

  /* ---------- الأقفال والتقدّم ---------- */
  const list = () => HIKAYAT.stations;
  const find = id => list().find(s => s.id === id);
  function unlocked(id) { if (prefs.openAll) return true; const L = list(); const i = L.findIndex(s => s.id === id); return i === 0 || (i > 0 && !!SV.done[L[i - 1].id]); }

  /* =====================================================================
     طريق المحطات
     ===================================================================== */
  function viewMap(root) {
    const L = list(), doneN = L.filter(s => SV.done[s.id]).length, endOpen = Progress.endingOpen();
    const cur = L.find(s => !SV.done[s.id] && unlocked(s.id));
    const node = (s, i) => {
      const un = unlocked(s.id), dn = !!SV.done[s.id], here = cur && cur.id === s.id;
      return `<li class="sm-node ${dn ? "done" : ""} ${un ? "" : "locked"} ${here ? "here" : ""} ${i % 2 ? "alt" : ""}" style="--c1:${s.color[0]};--c2:${s.color[1]}">
        <button class="sm-btn" data-s="${s.id}" aria-label="${esc(s.title)} — ${esc(s.dateLabel)}${un ? "" : " — مقفولة"}">
          <span class="sm-medal"><svg viewBox="0 0 64 64">${s.icon ? TART.symbol(s.icon, "#FBF3E2").replace(/<\/?svg[^>]*>/g, "") : ""}</svg><i class="sm-n">${i + 1}</i>${dn ? `<span class="sm-ok">${IC.check}</span>` : ""}${un ? "" : `<span class="sm-lk">${IC.lock}</span>`}</span>
          <span class="sm-txt"><small class="sm-date">${esc(s.dateLabel)}</small><b>${esc(s.title)}</b><span>${esc(s.place)}</span>${SV.cp[s.id] && !dn ? `<em>وقفتوا بنصّها</em>` : ""}</span>
        </button></li>`;
    };
    const v = h(`<section class="view page sm-page noselect">
      <div class="page-inner">
        <header class="page-head"><div><h1>طريق الحكاية</h1><p class="page-sub">إحدى عشرة محطة، من أول صدفة بالقصر الروماني لحد يوم الزواج. كل محطة مكان تمشون بيه وتلمسون تفاصيله.</p></div>
          <div class="row"><button class="btn ghost sm" data-set>${IC.gear} الإعدادات</button></div></header>
        <div class="sm-prog"><div class="prog"><i style="width:${doneN / L.length * 100}%"></i></div><span>${numSpan(doneN)} / ${numSpan(L.length)}</span></div>
        <ol class="sm-path">${L.map(node).join("")}
          <li class="sm-node end ${endOpen ? "" : "locked"}"><button class="sm-btn" data-end aria-label="النهاية${endOpen ? "" : " — مقفولة"}"><span class="sm-medal adool">${endOpen ? `<img src="${TRig.still("adool")}" alt="">` : IC.lock}</span><span class="sm-txt"><small class="sm-date">بعد الرحلة</small><b>${endOpen ? "النهاية" : "النهاية مسكّرة"}</b><span>${endOpen ? "أحد يريد يگول شي…" : `تنفتح بعد كل المحطات${prefs.openAll ? "" : " والألعاب الأساسية الثلاث"}`}</span></span></button></li>
        </ol>
      </div></section>`);
    root.appendChild(v);
    $("[data-set]", v).onclick = openSettings;
    $$(".sm-btn[data-s]", v).forEach(b => b.onclick = () => {
      TAudio.unlock(); const s = find(b.dataset.s);
      if (!unlocked(s.id)) { TAudio.sfx("nope"); toast(`تنفتح بعد «${L[L.indexOf(s) - 1].title}» — أو فعّلوا «إتاحة الحكاية كاملة» من الإعدادات`, "lock"); return; }
      openStation(s);
    });
    $("[data-end]", v).onclick = () => { if (endOpen) go("ending"); else go("ending"); };
    const here = $(".sm-node.here", v); if (here) setTimeout(() => here.scrollIntoView({ block: "center", behavior: motionOK() ? "smooth" : "auto" }), 300);
    TAudio.stop();
  }

  /* ---------- بطاقة المحطة (صفحتين مثل كتاب إيلاف) ---------- */
  function openStation(s) {
    TAudio.sfx("page");
    const cp = SV.cp[s.id], dn = SV.done[s.id];
    const ph = (s.photos || []).slice(0, 3);
    const md = modal(`<div class="st-card" style="--c1:${s.color[0]};--c2:${s.color[1]}">
      <div class="st-cover"><span class="st-date">${esc(s.dateLabel)}</span><h2>${esc(s.title)}</h2><p class="st-place">${esc(s.place)}</p></div>
      <p class="st-lead">${esc(s.lead)}</p>
      ${ph.length ? `<div class="st-thumbs">${ph.map(id => PHOTO[id] ? `<img src="${photoSrc(id, 480)}" alt="${esc(PHOTO[id].t)}" loading="lazy">` : "").join("")}<span>${(s.photos || []).length} ${(s.photos || []).length > 2 ? "صور" : "صورة"} بالمحطة</span></div>` : `<p class="note">ما عدنا صور من هذا اليوم بعد — تگدرون تضيفونها من «حائط ذكرياتنا».</p>`}
      <div class="row">${cp && !dn ? `<button class="btn gold" data-go="cp">كمّلوا من وين وقفتوا</button><button class="btn line" data-go="">من البداية</button>` : `<button class="btn gold" data-go="" autofocus>${dn ? "عيشوها مرة ثانية" : "ادخلوا المحطة"}</button>`}</div>
    </div>`, { label: s.title });
    $$("[data-go]", md.el).forEach(b => b.onclick = () => { const from = b.dataset.go; if (!from) { delete SV.cp[s.id]; save(); } md.close(); go("story:" + s.id + (from ? "@cp" : "")); });
  }

  /* =====================================================================
     مشغّل المحطة
     ===================================================================== */
  function viewPlayer(root, id, from, ext) {
    const chap = ext ? ext.chap : find(id);
    if (!chap || (!ext && !unlocked(id))) { go("story", false); return; }
    const leave = () => ext ? ext.exit() : go("story");
    const ctx = { chap, flags: {}, inv: {}, SV, get: k => SV.choices[chap.id + "." + k], aborted: false };
    const v = h(`<section class="view tl tl-play tp-enter noselect" style="--sky:${chap.sky}">
      <div class="tp-stage">
        <div class="tp-sky"></div>
        <div class="tp-world"><div class="tp-layer far"></div><div class="tp-layer mid"></div><div class="tp-layer main"></div><div class="tp-layer fore"></div></div>
        <div class="tp-fx" aria-hidden="true"></div><div class="tp-vig" aria-hidden="true"></div>
      </div>
      <div class="tp-hud">
        <button class="tp-b" data-h="back" aria-label="رجوع لطريق الحكاية">${IC.back}</button>
        <div class="tp-chip"><small>${esc(chap.dateLabel)}</small><b>${esc(chap.title)}</b><div class="tp-progress" aria-hidden="true"><i></i></div></div>
        <div class="tp-inv"></div>
        <button class="tp-b" data-h="auto" aria-pressed="false" aria-label="عرض سينمائي تلقائي"><span class="cc">تلقائي</span></button>
        <button class="tp-b" data-h="sound" aria-label="الصوت">${prefs.music || prefs.sfx ? IC.sound : IC.mute}</button>
        <button class="tp-b" data-h="skip" aria-label="تخطّي"><span class="cc">تخطّي</span></button>
        <button class="tp-b" data-h="pause" aria-label="إيقاف مؤقت">${IC.pause}</button>
      </div>
      <div class="tp-dialog" hidden><span class="tp-name"></span><p class="tp-text"></p><span class="tp-adv">▼</span></div>
      <div class="tp-narr" hidden><p></p><button class="tl-btn" hidden></button></div>
      <div class="tp-toast" hidden></div>
      <div class="tp-tap" aria-hidden="true"></div>
      <div class="tp-pad" hidden>
        <div class="tp-dir"><button data-k="right" aria-label="يمين">${arrow(0)}</button><button data-k="left" aria-label="يسار">${arrow(180)}</button></div>
        <div class="tp-act"><button data-k="act" class="actb" aria-label="تفاعل">${TART.symbol("star", "#3D3A2E")}<small>تفاعل</small></button></div>
      </div>
      <div class="tp-over" hidden></div>
      <div class="tp-wipe" aria-hidden="true"></div>
    </section>`);
    root.appendChild(v);
    const stage = $(".tp-stage", v), L = { far: $(".tp-layer.far", v), mid: $(".tp-layer.mid", v), main: $(".tp-layer.main", v), fore: $(".tp-layer.fore", v) };
    const dlg = $(".tp-dialog", v), narr = $(".tp-narr", v), over = $(".tp-over", v), pad = $(".tp-pad", v), fxL = $(".tp-fx", v), invEl = $(".tp-inv", v), toastEl = $(".tp-toast", v), tapEl = $(".tp-tap", v);
    setTimeout(() => v.classList.remove("tp-enter"), 1200);

    /* ----- قياس: الشاشة العمودية تكبّر الشخصيات شوية حتى ما تصغر ----- */
    let U = 8, VW = 100;
    function measure() { const r = stage.getBoundingClientRect(); const portrait = r.height > r.width; U = Math.max(2.5, Math.min(r.height / 100, r.width / (portrait ? 56 : 72))); VW = r.width / U; v.style.setProperty("--u", U + "px"); v.classList.toggle("portrait", portrait); }
    measure();
    const ro = new ResizeObserver(() => { measure(); if (sc) layoutParallax(); }); ro.observe(stage);

    /* ----- حالة ----- */
    let sc = null, cam = 0, mode = "idle", paused = false, raf = 0, last = performance.now();
    const chars = {};
    let P = null, playerWho = "pair", followers = [], trail = [], objs = [], items = [], zones = [];
    let skipFn = null, exploreSkip = null, camHold = false, advanceFn = null, untilFlag = null, exploreRes = null, interacting = false, autoTarget = null, pendingObj = null, idleT = 0, hintsShown = new Set();
    let auto = false, autoT = 0;
    const keys = new Set();

    /* ----- شخصيات ----- */
    function mkChar(who) {
      const C = CHARS[who];
      const el = h(`<div class="tc tc-${who}" style="--h:${C.h}"><div class="tc-shadow"></div><div class="tc-flip"><div class="tc-anim">${C.html()}</div></div><div class="tc-mark">!</div><div class="tc-bub" hidden></div></div>`);
      L.main.appendChild(el);
      const c = { who, el, x: 0, y: 86, face: 1, vis: true, anim: "idle", h: C.h };
      TRig.attach(c, el); el.classList.add("rigged");
      el.addEventListener("click", e => { if (mode === "explore" && who !== playerWho) { e.stopPropagation(); emote(who, "joy"); TAudio.sfx("soft"); bark(who, pick((HIKAYAT.barks[who] || ["…"])), 1800); } });
      chars[who] = c; return c;
    }
    function placeChar(c) { c.el.style.transform = `translate(${c.x}em, ${c.y}em)`; c.el.classList.toggle("fl", c.face < 0); }
    function setAnim(c, a) { if (c.anim === a) return; c.el.classList.remove("a-" + c.anim); c.anim = a; c.el.classList.add("a-" + a); }
    function emote(who, e, ms = 1300) {
      const c = chars[who]; if (!c) return;
      if (e === "wave") { TRig.wave(c, ms / 1000); if (who === "adool") TRig.greet(c); return; }
      if (e === "nod") return TRig.nod(c); if (e === "shy") return TRig.shy(c); if (e === "joy") return TRig.joy(c); if (e === "greet") return TRig.greet(c);
      if (e === "look") { const o = Object.values(chars).find(x => x !== c && x.vis); if (o) { c.face = o.x >= c.x ? 1 : -1; placeChar(c); } TRig.look(c, 1.4); setTimeout(() => TRig.look(c, 0), 2600); return; }
      c.el.classList.remove("e-" + e); void c.el.offsetWidth; c.el.classList.add("e-" + e); setTimeout(() => c.el.classList.remove("e-" + e), ms);
    }
    function bark(who, text, ms = 2400) { const c = chars[who]; if (!c || !c.vis) return; const b = $(".tc-bub", c.el); b.textContent = fill(text, ctx); b.hidden = false; clearTimeout(b._t); b._t = setTimeout(() => { b.hidden = true; }, ms); }

    /* ----- بناء المشهد ----- */
    function deco(d, layer) {
      if (lowGfx() && d.fx) return null;
      const art = typeof d.a === "function" ? d.a(ctx) : (TART[d.a] ? TART[d.a](...(d.args || [])) : "");
      const el = h(`<div class="tp-d ${d.cls || ""} ${d.tl ? "tl-anchor" : ""}" style="left:${d.x}em;top:${d.y}em;width:${d.w}em;${d.h ? `height:${d.h}em;` : ""}${d.o != null ? `opacity:${d.o};` : ""}${d.z ? `z-index:${d.z};` : ""}">${art}</div>`);
      if (d.id) el.dataset.id = d.id;
      (L[layer] || L.mid).appendChild(el); return el;
    }
    function loadScene(b) {
      const def = typeof b.scene === "string" ? chap.scenes[b.scene] : b.scene;
      sc = Object.assign({ len: 200, ground: 86, deco: [] }, def);
      Object.values(L).forEach(l => l.innerHTML = ""); Object.keys(chars).forEach(k => delete chars[k]); fxL.innerHTML = "";
      promptEl = null; near = null; camHold = false;
      objs = []; items = []; zones = (sc.zones || []).map(z => ({ ...z }));
      stage.style.setProperty("--sky", sc.sky || chap.sky);
      v.dataset.scene = typeof b.scene === "string" ? b.scene : "x";
      const T = HIKAYAT.themes[sc.theme] ? HIKAYAT.themes[sc.theme](sc, VW) : { far: [], mid: [], fore: [] };
      (T.far || []).forEach(d => deco(d, "far")); (T.mid || []).forEach(d => deco(d, "mid")); (T.main || []).forEach(d => deco(d, "main")); (T.fore || []).forEach(d => deco(d, "fore"));
      (sc.deco || []).forEach(d => deco(d, d.layer || "main"));
      L.main.appendChild(h(`<div class="tp-ground g-${sc.gk || "marble"}" style="left:-30em;width:${sc.len + 60}em;top:${sc.ground}em"></div>`));
      (sc.objs || []).forEach(o => addObj(o));
      (sc.items || []).forEach(it => { if (it.when && !it.when(ctx)) return; const el = h(`<div class="ti" style="left:${it.x}em;top:${it.y}em">${TART.symbol(it.icon || "star", it.color || "#FFE7AE")}</div>`); L.main.appendChild(el); items.push({ ...it, el, got: false }); });
      const cast = b.cast || {};
      Object.entries(cast).forEach(([who, pos]) => { const c = mkChar(who); c.x = pos[0]; c.y = pos[1] != null ? pos[1] : sc.ground; c.face = pos[2] || 1; if (pos[3] === "hide") { c.vis = false; c.el.hidden = true; } placeChar(c); setAnim(c, "idle"); });
      playerWho = b.player || Object.keys(cast)[0];
      followers = b.follow || [];
      cam = b.cam != null ? (typeof b.cam === "function" ? b.cam(VW) : b.cam) : clamp((chars[playerWho] ? chars[playerWho].x : 0) - VW * .42, 0, Math.max(0, sc.len - VW));
      if (sc.amb && motionOK() && !lowGfx()) ambient(sc.amb);
      layoutParallax(); render();
      if (b.music || sc.music) music(b.music || sc.music);
    }
    function addObj(o) {
      if (o.when && !o.when(ctx)) return;
      const art = artOf(o);
      const el = h(`<button class="to ${o.cls || ""} ${o.run ? "act" : ""}" style="left:${o.x}em;top:${o.y != null ? o.y : sc.ground}em;width:${o.w}em" aria-label="${esc(fill(o.label || o.name || "", ctx))}" ${o.hidden ? "hidden" : ""} tabindex="-1">${art}${o.name ? `<span class="to-name">${esc(fill(o.name, ctx))}</span>` : ""}</button>`);
      L.main.appendChild(el);
      const ob = { ...o, el, y: o.y != null ? o.y : sc.ground, done: false };
      el.addEventListener("click", e => { e.stopPropagation(); TAudio.unlock(); if (mode === "explore" && !interacting && ob.run && !ob.done && !ob.hidden) goInteract(ob); });
      objs.push(ob); return ob;
    }
    function artOf(o) { return typeof o.a === "function" ? o.a(ctx) : (o.a && TART[o.a] ? TART[o.a](...(o.args || [])) : ""); }
    const getObj = id => objs.find(o => o.id === id);
    function updObj(id, ch) { const o = getObj(id); if (!o) return; Object.assign(o, ch); if (ch.a || ch.args) o.el.innerHTML = artOf(o) + (o.name ? `<span class="to-name">${esc(fill(o.name, ctx))}</span>` : ""); if ("hidden" in ch) o.el.hidden = !!ch.hidden; if (ch.cls != null) { o.el.className = `to ${ch.cls} ${o.run ? "act" : ""}`; } if (ch.x != null) o.el.style.left = ch.x + "em"; }
    function ambient(kind) {
      const n = { dust: 22, petals: 14, stars: 26, sparks: 18, glow: 12, confetti: 18 }[kind] || 14;
      let s = ""; for (let i = 0; i < n; i++) s += `<i class="amb amb-${kind}" style="left:${Math.random() * 100}%;top:${Math.random() * 80}%;animation-delay:${-Math.random() * 12}s;animation-duration:${8 + Math.random() * 10}s"></i>`;
      fxL.innerHTML = s;
    }
    function layoutParallax() { const f = { far: .25, mid: .55, main: 1, fore: 1.3 }; Object.entries(L).forEach(([k, el]) => { el.style.transform = `translate3d(${(-cam * f[k] * U).toFixed(1)}px,0,0)`; }); }

    /* ----- الصوت ----- */
    let curMood = "explore";
    function music(m) { curMood = m; TAudio.play("main", chap.id, m, chap.theme); }

    /* ----- الواجهة: حوار وراوي ----- */
    function showText(el, text) { el.textContent = ""; const full = fill(text, ctx); if (!motionOK()) { el.textContent = full; return Promise.resolve(); } let i = 0; return new Promise(r => { const tick = () => { i += 2; el.textContent = full.slice(0, i); if (i < full.length) el._t = setTimeout(tick, 24); else r(); }; tick(); el._done = () => { clearTimeout(el._t); el.textContent = full; r(); }; }); }
    const readMs = t => clamp(1600 + fill(t, ctx).length * 55, 2200, 9000);
    function waitAdvance(t) { return new Promise(r => { const fin = () => { advanceFn = null; skipFn = null; clearTimeout(at); r(); }; advanceFn = fin; skipFn = fin; const at = auto ? setTimeout(fin, readMs(t || "")) : null; }); }
    async function say(b) {
      const who = b.say, isChar = !!CHARS[who];
      const name = isChar || who === "narr" ? NAMES[who]() : fill(who, ctx);
      if (b.e && isChar) emote(who, b.e);
      if (b.look && isChar && chars[who]) { chars[who].face = b.look; placeChar(chars[who]); }
      const text = fill(b.t, ctx);
      dlg.style.setProperty("--nc", isChar ? CHARS[who].color : "#F6E3A1");
      $(".tp-name", dlg).textContent = name;
      const c = isChar ? chars[who] : null;
      const subs = prefs.subs || !c;
      dlg.hidden = !subs; dlg.classList.toggle("narr", who === "narr");
      if (c) { const bb = $(".tc-bub", c.el); bb.hidden = false; bb.textContent = subs ? "…" : text; bb.classList.toggle("speaking", subs); }
      const pm = mode; mode = "talk";
      const p = subs ? showText($(".tp-text", dlg), text) : Promise.resolve();
      if (TAudio.unlocked && isChar) TAudio.sfx("soft");
      await new Promise(r => { let at = null; const fin = () => { advanceFn = null; skipFn = null; clearTimeout(at); r(); }; advanceFn = () => { const t = $(".tp-text", dlg); if (t._done && t.textContent.length < text.length) { t._done(); return; } fin(); }; skipFn = fin; if (auto) p.then(() => { at = setTimeout(fin, readMs(text)); }); });
      if (c) { const bb = $(".tc-bub", c.el); bb.hidden = true; bb.classList.remove("speaking"); }
      dlg.hidden = true; mode = pm === "talk" ? "idle" : pm;
    }
    async function cine(b) {
      const pm = mode; mode = "cine"; v.classList.add("cine"); camHold = true;
      if (b.music) music(b.music);
      if (b.during) act({ act: b.during });
      const pan = b.pan ? tweenCam(b.pan[0], b.pan[1], b.dur || 4000) : null;
      if (b.narr) { narr.hidden = false; narr.classList.remove("in"); void narr.offsetWidth; narr.classList.add("in"); await showText($("p", narr), b.narr); }
      const btn = $(".tl-btn", narr);
      if (b.btn) { btn.hidden = false; btn.textContent = fill(b.btn, ctx); await new Promise(r => { let at = null; const fin = () => { skipFn = null; clearTimeout(at); TAudio.unlock(); if (b.musicAfter !== false) music(b.musicAfter || "explore"); r(); }; btn.onclick = fin; skipFn = fin; if (auto) at = setTimeout(fin, readMs(b.narr || "")); }); btn.hidden = true; }
      else if (b.narr) await waitAdvance(b.narr);
      else if (pan) await new Promise(r => { skipFn = () => { skipFn = null; camTween && camTween(performance.now() + 1e9); r(); }; pan.then(() => { skipFn = null; r(); }); });
      narr.hidden = true; v.classList.remove("cine"); mode = pm === "cine" ? "idle" : pm;
    }
    let camTween = null;
    function tweenCam(a, bx, dur) { camHold = true; return new Promise(r => { const t0 = performance.now(); const from = a == null ? cam : a; camTween = now => { const t = Math.max(0, Math.min(1, (now - t0) / dur)); cam = lerp(from, bx, motionOK() ? ease(t) : 1); if (t >= 1) { camTween = null; r(); } }; }); }

    /* ----- حركات مبرمجة ----- */
    function moveChar(c, x, { speed } = {}) {
      return new Promise(r => {
        const sp = speed || 16; c.face = x >= c.x ? 1 : -1; setAnim(c, "walk"); const x0 = c.x, dist = Math.abs(x - x0), dur = Math.max(150, dist / sp * 1000), t0 = performance.now();
        const step = now => { if (ctx.aborted) return r(); const t = Math.max(0, Math.min(1, (now - t0) / dur)); c.x = lerp(x0, x, t); placeChar(c); if (t < 1 && !c._skip) requestAnimationFrame(step); else { c._skip = false; c.x = x; placeChar(c); setAnim(c, "idle"); r(); } };
        requestAnimationFrame(step);
      });
    }
    async function act(b) {
      mode = mode === "explore" ? "explore" : "busy";
      const runOne = async a => {
        const [who, verb, ...args] = a;
        if (who === "wait") return wait(verb);
        if (who === "cam") return tweenCam(null, verb, args[0] || 1200);
        if (who === "camfree") { camHold = false; return; }
        if (who === "obj") return updObj(verb, args[0]);
        if (who === "sfx") return TAudio.sfx(verb);
        if (who === "fx") return doFx(verb, args[0]);
        const c = chars[who]; if (!c) return;
        if (verb === "to") return moveChar(c, args[0], args[1] || {});
        if (verb === "place") { c.x = args[0]; placeChar(c); return; }
        if (verb === "face") { c.face = args[0]; placeChar(c); return; }
        if (verb === "hide") { c.vis = false; c.el.hidden = true; return; }
        if (verb === "show") { c.vis = true; c.el.hidden = false; return; }
        if (verb === "anim") { setAnim(c, args[0]); return; }
        if (verb === "bark") { bark(who, args[0], args[1] || 2400); return; }
        emote(who, verb, args[0] || 1300); return wait(args[0] || 600);
      };
      const prevSkip = skipFn;
      skipFn = () => { Object.values(chars).forEach(c => c._skip = true); if (camTween) camTween(performance.now() + 1e6); };
      await Promise.all(b.act.map(runOne));
      skipFn = prevSkip;
      if (mode === "busy") mode = "idle";
    }

    /* ----- مؤثرات المشهد ----- */
    async function doFx(name, arg) {
      const f = HIKAYAT.fx[name];
      if (f) return f({ v, stage, L, chars, getObj, updObj, deco, ctx, TAudio, wait, emote, bark, motionOK, sc, SV, camX: cam, VW, U, toastIn, fxL }, arg);
    }
    function toastIn(t, ms = 2200) { toastEl.textContent = fill(t, ctx); toastEl.hidden = false; toastEl.classList.remove("in"); void toastEl.offsetWidth; toastEl.classList.add("in"); clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.hidden = true, ms); }

    /* ----- ألبوم الصور الحقيقية / رسالة / صوت آمنة ----- */
    function overlay(card) { return new Promise(res => { const pm = mode; mode = "card"; over.hidden = false; v.classList.add("overlay"); over.innerHTML = ""; over.appendChild(card); requestAnimationFrame(() => card.classList.add("in")); const done = () => { skipFn = null; over.hidden = true; over.innerHTML = ""; v.classList.remove("overlay"); mode = pm === "card" ? "idle" : pm; res(); }; card._done = done; skipFn = done; }); }
    function album(b) {
      const ids = b.photos.filter(id => PHOTO[id]); if (!ids.length) return Promise.resolve();
      let i = 0;
      const card = h(`<div class="tp-card tp-album" role="dialog" aria-label="${esc(fill(b.title || "صور", ctx))}"><h3>${esc(fill(b.title || "من صورنا", ctx))}</h3>${b.t ? `<p class="pz-sub">${esc(fill(b.t, ctx))}</p>` : ""}
        <figure class="al-fig"><div class="al-img"><img alt=""></div><figcaption><b></b><small class="al-date"></small><span></span></figcaption></figure>
        <div class="al-nav">${ids.length > 1 ? `<button class="tp-b light" data-p aria-label="السابقة">${IC.back}</button><span class="al-n"></span><button class="tp-b light" data-n aria-label="التالية">${IC.next}</button>` : ""}</div>
        <button class="btn gold" data-ok>نكمّل</button></div>`);
      const img = $(".al-img img", card);
      const draw = () => { const p = PHOTO[ids[i]]; img.classList.remove("on"); img.onload = () => img.classList.add("on"); img.srcset = photoSet(p.id); img.sizes = "(max-width:600px) 92vw, 640px"; img.src = photoSrc(p.id); img.alt = p.t; img.style.aspectRatio = p.ar; $("figcaption b", card).textContent = p.t; $(".al-date", card).textContent = p.d ? p.d : "التاريخ غير معروف"; $("figcaption span", card).textContent = p.desc; const n = $(".al-n", card); if (n) n.textContent = `${i + 1} / ${ids.length}`; };
      draw(); TAudio.sfx("page");
      const pv = $("[data-p]", card), nx = $("[data-n]", card);
      if (pv) { pv.onclick = () => { i = (i - 1 + ids.length) % ids.length; draw(); TAudio.sfx("soft"); }; nx.onclick = () => { i = (i + 1) % ids.length; draw(); TAudio.sfx("soft"); }; }
      $("[data-ok]", card).onclick = () => card._done();
      const pr = overlay(card);
      if (auto) setTimeout(() => card._done && !over.hidden && card._done(), 3500 + ids.length * 1800);
      return pr;
    }
    function letter(b) {
      const L2 = LETTERS.find(x => x.id === b.letter); if (!L2) return Promise.resolve();
      const card = h(`<div class="tp-card tp-letter"><span class="lt-seal">${TART.symbol("letter", "#E7CB8E")}</span><h3>${esc(b.title || `رسالة ${L2.from === "غير مكتوب" ? "" : "من " + L2.from}`)}</h3><p class="pz-sub">${esc([L2.date || "التاريخ مو ظاهر باللقطة", L2.app].filter(Boolean).join(" · "))}</p><div class="lt-body">${esc(L2.text).replace(/\n/g, "<br>")}</div>${L2.note ? `<p class="note">${esc(L2.note)}</p>` : ""}<button class="btn gold" data-ok>نكمّل</button></div>`);
      TAudio.sfx("envelope");
      $("[data-ok]", card).onclick = () => card._done();
      return overlay(card);
    }
    function voice(b) {
      const paras = fill(b.t, ctx).split("\n").filter(Boolean);
      const card = h(`<div class="tp-card tp-voice"><span class="vo-tag">${esc(b.label || "بصوت آمنة")}</span>${b.title ? `<h3>${esc(b.title)}</h3>` : ""}<div class="vo-body">${paras.map((p, i) => `<p style="--d:${i * 1.1}s">${esc(p)}</p>`).join("")}</div><button class="btn gold" data-ok>نكمّل</button></div>`);
      if (!motionOK()) card.classList.add("still");
      $("[data-ok]", card).onclick = () => card._done();
      music("emotion");
      const pr = overlay(card);
      if (auto) setTimeout(() => card._done && !over.hidden && card._done(), readMs(b.t) * 1.6);
      return pr;
    }

    /* ----- الاستكشاف: لمس المكان للمشي (الأساسي)، والأسهم اختيارية ----- */
    function startPlayer() { const c = chars[playerWho]; P = { c, x: c.x, y: c.y }; buildTrail(); camHold = false; }
    function explore(b) {
      mode = "explore"; untilFlag = b.explore.until; idleT = 0; hintsShown = new Set();
      pad.hidden = !prefs.pad; v.classList.add("exploring");
      startPlayer();
      if (b.explore.music !== false) music(b.explore.music || "explore");
      if (!finePointer && !Store.get("tapHint", false)) { toastIn("المسوا أي مكان حتى تمشون، والمسوا الأشياء اللي تلمع", 3600); Store.set("tapHint", true); }
      return new Promise(r => { exploreRes = r; exploreSkip = () => { ctx.flags[untilFlag] = true; }; });
    }
    function endExplore() { mode = "idle"; pad.hidden = true; v.classList.remove("exploring"); keys.clear(); autoTarget = null; pendingObj = null; hidePrompt(); Object.values(chars).forEach(c => { if (c.anim !== "idle") setAnim(c, "idle"); }); exploreSkip = null; const r = exploreRes; exploreRes = null; r && r(); }
    let promptEl = null, near = null;
    function showPrompt(o) { if (!promptEl) { promptEl = h(`<div class="tp-prompt"></div>`); L.main.appendChild(promptEl); } promptEl.innerHTML = `${finePointer ? '<kbd>E</kbd>' : ""}<span>${esc(fill(o.label || "المسوها", ctx))}</span>`; promptEl.style.left = o.x + "em"; promptEl.style.top = (o.y - (o.ph || o.w * .9) - 3) + "em"; promptEl.hidden = false; pad.classList.add("can-act"); }
    function hidePrompt() { if (promptEl) promptEl.hidden = true; pad.classList.remove("can-act"); near = null; }
    async function interact(o) {
      if (interacting) return; interacting = true; keys.clear(); autoTarget = null; pendingObj = null; hidePrompt(); setAnim(P.c, "idle");
      if (o.need && !o.need(ctx)) { await runBeats(o.deny || [{ say: playerWho, t: "باقي شي…" }]); interacting = false; return; }
      P.c.face = o.x >= P.x ? 1 : -1; placeChar(P.c);
      if (o.once !== false) o.done = true;
      if (o.flag) ctx.flags[o.flag] = true;
      await runBeats(o.run);
      if (o.done) o.el.classList.remove("act");
      interacting = false; last = performance.now();
    }
    function goInteract(o) { if (Math.abs(o.x - P.x) < (o.r || 9)) interact(o); else { autoTarget = o.x - Math.sign(o.x - P.x) * 5; pendingObj = o; showTap(o.x, o.y - (o.ph || o.w * .6)); } }
    function onAction() { if (mode !== "explore" || interacting) return; if (near) interact(near); }
    function showTap(x, y) { tapEl.style.left = ((x - cam) * U) + "px"; tapEl.style.top = (stage.clientHeight - (100 - y) * U) + "px"; tapEl.classList.remove("on"); void tapEl.offsetWidth; tapEl.classList.add("on"); }

    function physics(dt) {
      const c = P.c;
      // السينمائي: يمشي لوحده للشي اللي بعده
      if (auto && !autoTarget && !pendingObj) { autoT += dt; if (autoT > .8) { autoT = 0; const nx = objs.filter(o => o.run && !o.done && !o.hidden && !o.el.hidden).sort((a, b) => Math.abs(a.x - P.x) - Math.abs(b.x - P.x))[0]; if (nx) goInteract(nx); else if (untilFlag && !ctx.flags[untilFlag]) { const z = zones.find(z => !z.fired); if (z) autoTarget = (z.x0 + z.x1) / 2; } } }
      let dir = (keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0);
      if (!dir && autoTarget != null) { const d = autoTarget - P.x; if (Math.abs(d) < .8) { autoTarget = null; if (pendingObj) { const o = pendingObj; pendingObj = null; interact(o); return; } } else dir = Math.sign(d); }
      if (dir) idleT = 0; else idleT += dt;
      const sp = 17;
      if (dir) c.face = dir;
      P.x = clamp(P.x + dir * sp * dt, 3, sc.len - 3);
      setAnim(c, dir ? "walk" : "idle");
      c.x = P.x; c.y = P.y; placeChar(c);
      // المتابعين يمشون ورا اللاعب
      const lt = trail[trail.length - 1]; if (Math.abs(P.x - lt.x) > .9) { trail.push({ x: P.x, y: P.y }); if (trail.length > 160) trail.shift(); if (Math.random() < .14) TAudio.sfx("step"); }
      let need = 0, acc = 0, ti = trail.length - 1;
      followers.forEach((w, i) => { const f = chars[w]; if (!f || !f.vis) return; need += (i === 0 ? P.c.h : chars[followers[i - 1]].h) * .26 + f.h * .26 + 1;
        while (ti > 0 && acc < need) { acc += Math.abs(trail[ti].x - trail[ti - 1].x); ti--; } const tp = trail[ti]; const nx = lerp(f.x, tp.x, Math.min(1, dt * 7)); const mv = Math.abs(nx - f.x) / dt; f.face = nx > f.x + .01 ? 1 : nx < f.x - .01 ? -1 : f.face; f.x = nx;
        if (mv > 3) f.wasMoving = true; else if (f.wasMoving && mv < .5) { f.wasMoving = false; f.face = P.c.x >= f.x ? 1 : -1; TRig.look(f, 1); setTimeout(() => TRig.look(f, 0), 1600); }
        placeChar(f); setAnim(f, mv > 2 ? "walk" : "idle"); });
      // جمع
      items.forEach(it => { if (!it.got && Math.abs(it.x - P.x) < 4.5) { it.got = true; it.el.classList.add("got"); ctx.inv[it.k] = (ctx.inv[it.k] || 0) + 1; TAudio.sfx("pick"); drawInv(); if (it.say) bark(playerWho, it.say, 2000); setTimeout(() => it.el.remove(), 700); } });
      // مناطق
      zones.forEach(z => { if (z.fired) return; if (P.x >= z.x0 && P.x <= z.x1) { if (z.need && !z.need(ctx)) { if (!z.denied) { z.denied = true; (z.deny || []).forEach(b2 => b2.say && bark(b2.say, b2.t, 2600)); setTimeout(() => z.denied = false, 6000); } if (z.block) { P.x = z.x0 - 1; autoTarget = null; } return; } z.fired = z.once !== false; if (z.flag) ctx.flags[z.flag] = true; if (z.run) { interacting = true; keys.clear(); autoTarget = null; runBeats(z.run).then(() => { interacting = false; }); } } });
      // أقرب تفاعل
      let best = null, bd = 1e9; objs.forEach(o => { if (!o.run || o.done || o.hidden || o.el.hidden) return; const d = Math.abs(o.x - P.x); if (d < (o.r || 9) && d < bd) { bd = d; best = o; } });
      if (best !== near) { if (best) { near = best; showPrompt(best); } else hidePrompt(); }
      const hs = (curExplore && curExplore.hints) || [];
      hs.forEach((hh, i) => { if (!hintsShown.has(i) && idleT > hh.after) { hintsShown.add(i); bark(hh.who || followers[0] || playerWho, hh.t, 3600); } });
      if (untilFlag && ctx.flags[untilFlag] && !interacting) endExplore();
    }
    function buildTrail() {
      const pts = followers.map(w => chars[w]).filter(Boolean).reverse().map(f => ({ x: f.x, y: f.y })).concat([{ x: P.x, y: P.y }]);
      if (pts.length === 1) pts.unshift({ x: P.x - 30 * (P.c.face || 1), y: P.y });
      trail = []; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b2 = pts[i + 1], d = Math.abs(b2.x - a.x), n = Math.max(1, Math.ceil(d / .9)); for (let k = 0; k < n; k++) trail.push({ x: lerp(a.x, b2.x, k / n), y: a.y }); }
      trail.push({ x: P.x, y: P.y });
    }
    function drawInv() { const need = (curExplore && curExplore.need) || {}; invEl.innerHTML = Object.entries(need).map(([k, n]) => `<span class="tp-ipill">${TART.symbol((HIKAYAT.itemArt[k] || ["star"])[0], (HIKAYAT.itemArt[k] || [0, "#FFE7AE"])[1])}<b>${ctx.inv[k] || 0}/${n}</b></span>`).join(""); }

    /* ----- ألغاز واختيارات ولحظات هادية ----- */
    let curExplore = null;
    function puzzle(b) {
      return new Promise(res => {
        const pm = mode; mode = "puzzle"; over.hidden = false; v.classList.add("overlay");
        if (b.music) music(b.music);
        const card = h(`<div class="tp-card pzc-${b.puzzle}"><h3>${esc(fill(b.title || "لعبة صغيرة", ctx))}</h3>${b.intro ? `<p class="pz-sub">${esc(fill(b.intro, ctx))}</p>` : ""}<div class="pz-body"></div><p class="pz-say" aria-live="polite"></p><div class="pz-foot"><button class="pz-mini" data-hint>تلميح</button><button class="pz-mini" data-skip>تخطّي</button></div></div>`);
        over.innerHTML = ""; over.appendChild(card); requestAnimationFrame(() => card.classList.add("in"));
        let hintFn = null, skipH = null, cleanupP = null, done = false;
        const sayEl = $(".pz-say", card);
        const finish = val => { if (done) return; done = true; cleanupP && cleanupP(); TAudio.sfx("ok"); card.classList.add("solved"); sayEl.textContent = fill(b.win || pick(HIKAYAT.winLines), ctx); skipFn = null; setTimeout(() => { over.hidden = true; over.innerHTML = ""; v.classList.remove("overlay"); mode = pm === "puzzle" ? "idle" : pm; if (b.key) { SV.choices[chap.id + "." + b.key] = val; save(); } res(val); }, 1200); };
        const api = { ctx, fill: t => fill(t, ctx), solve: finish, say: t => { sayEl.textContent = fill(t, ctx); sayEl.classList.remove("pop"); void sayEl.offsetWidth; sayEl.classList.add("pop"); }, sfx: (n, ...a) => TAudio.sfx(n, ...a), note: (n, d, t) => TAudio.note(n, d, t), onHint: f => hintFn = f, onSkip: f => skipH = f, onCleanup: f => cleanupP = f };
        TPZ[b.puzzle]($(".pz-body", card), Object.assign({}, b), api);
        $("[data-hint]", card).onclick = () => { TAudio.sfx("soft"); hintFn ? hintFn() : api.say("خذوا راحتكم، ماكو استعجال."); };
        const sk = () => { const val = skipH ? skipH() : undefined; finish(val); };
        $("[data-skip]", card).onclick = sk; skipFn = sk;
        if (auto) setTimeout(() => { if (!done) sk(); }, 6000);
      });
    }
    function choice(b) {
      return new Promise(res => {
        const pm = mode; mode = "choice"; over.hidden = false; v.classList.add("overlay");
        const card = h(`<div class="tp-card tp-choice"><h3>${esc(fill(b.q, ctx))}</h3><div class="tp-opts">${b.opts.map((o, i) => `<button class="tl-opt" data-i="${i}"><b>${esc(fill(o.label, ctx))}</b>${o.sub ? `<small>${esc(fill(o.sub, ctx))}</small>` : ""}</button>`).join("")}</div></div>`);
        over.innerHTML = ""; over.appendChild(card); requestAnimationFrame(() => card.classList.add("in"));
        const pickOpt = i => { const o = b.opts[i]; SV.choices[chap.id + "." + b.choice] = o.v; save(); TAudio.sfx("pick"); skipFn = null; over.hidden = true; over.innerHTML = ""; v.classList.remove("overlay"); mode = pm === "choice" ? "idle" : pm; res(o.v); };
        $$(".tl-opt", card).forEach(btn => btn.onclick = () => pickOpt(+btn.dataset.i));
        skipFn = () => pickOpt(b.def || 0);
        if (auto) setTimeout(() => skipFn && skipFn(), 4000);
      });
    }
    async function calm(b) {
      const pm = mode; mode = "calm"; v.classList.add("calm-moment");
      Object.keys(chars).forEach(w => { if (b.sit && b.sit.includes(w)) setAnim(chars[w], "sit"); });
      if (b.music) music(b.music);
      if (b.pan) tweenCam(b.pan[0], b.pan[1], b.dur || 6000);
      for (const line of (b.lines || [])) await say(line);
      narr.hidden = false; $("p", narr).textContent = fill(b.t || "لحظة هدوء…", ctx); const btn = $(".tl-btn", narr); btn.hidden = false; btn.textContent = b.btn || "نكمّل";
      await new Promise(r => { let at = null; const fin = () => { skipFn = null; clearTimeout(at); r(); }; btn.onclick = fin; skipFn = fin; if (auto) at = setTimeout(fin, readMs(b.t || "")); });
      btn.hidden = true; narr.hidden = true; v.classList.remove("calm-moment");
      Object.values(chars).forEach(c => setAnim(c, "idle")); mode = pm === "calm" ? "idle" : pm;
    }
    async function wipe() { if (!motionOK()) return; v.classList.remove("wiping"); void v.offsetWidth; v.classList.add("wiping"); TAudio.sfx("page"); await wait(520); }

    /* ----- مشغّل الخطوات ----- */
    async function runBeat(b) {
      if (ctx.aborted) return;
      if (b.if && !b.if(ctx)) return;
      if (b.scene) { if (sc) await wipe(); loadScene(b); setTimeout(() => v.classList.remove("wiping"), 500); return; }
      if (b.cine) return cine(b);
      if (b.say) return say(b);
      if (b.act) return act(b);
      if (b.explore) { curExplore = b.explore; drawInv(); await explore(b); curExplore = null; invEl.innerHTML = ""; return; }
      if (b.puzzle) return puzzle(b);
      if (b.choice) return choice(b);
      if (b.calm) return calm(b);
      if (b.photos) return album(b);
      if (b.letter) return letter(b);
      if (b.voice) return voice(b);
      if (b.fx) return doFx(b.fx, b.arg);
      if (b.set) { Object.assign(ctx.flags, b.set); return; }
      if (b.follow) { followers = b.follow.filter(w => chars[w]); if (P) buildTrail(); return; }
      if (b.player) { playerWho = b.player; return; }
      if (b.obj) { updObj(b.obj, b); return; }
      if (b.music) { music(b.music); return; }
      if (b.sfx) { TAudio.sfx(b.sfx); return; }
      if (b.wait) return wait(b.wait);
      if (b.toast) { toastIn(b.toast, b.ms || 2600); return; }
      if (b.run) return b.run(ctx, { chars, bark, emote, toastIn, updObj, getObj, SV, save });
    }
    async function runBeats(list2) { for (const b of list2) { if (ctx.aborted) return; await runBeat(b); } }
    async function runChapter(startAt) {
      const beats = chap.beats, start = Math.max(0, startAt || 0);
      if (start > 0) { const cp = SV.cp[chap.id]; if (cp) Object.assign(ctx.flags, cp.flags || {}); }
      for (let i = start; i < beats.length; i++) {
        if (ctx.aborted) return;
        const b = beats[i];
        $(".tp-progress i", v).style.width = (i / beats.length * 100) + "%";
        if (b.scene && i > 0 && !ext) { SV.cp[chap.id] = { i, flags: { ...ctx.flags } }; save(); }
        await runBeat(b);
      }
      if (ctx.aborted) return;
      $(".tp-progress i", v).style.width = "100%";
      if (ext) { ext.done && ext.done(); return; }
      SV.done[chap.id] = true; delete SV.cp[chap.id]; save();
      chapterEnd();
    }
    function chapterEnd() {
      const Ls = list(), i = Ls.findIndex(s => s.id === chap.id), nx = Ls[i + 1];
      const endNow = !nx && Progress.endingOpen();
      music("emotion"); mode = "end"; over.hidden = false; v.classList.add("overlay");
      const card = h(`<div class="tp-card tp-end"><span class="tp-seal">${TART.symbol(chap.icon || "heart", "#E7CB8E")}</span><h3>${esc(chap.title)}</h3><p class="tp-cliff">${esc(fill(chap.cliff || "", ctx))}</p>
        ${nx ? `<div class="tp-next"><small>المحطة الجاية · ${esc(nx.dateLabel)}</small><b>${esc(nx.title)}</b><span>${esc(nx.place)}</span></div>` : endNow ? `<div class="tp-next"><b>خلصت الرحلة</b><span>بس أحد يريد يگول شي قبل لا تطلعون…</span></div>` : `<div class="tp-next"><b>خلصت المحطات</b><span>${Progress.stationsDone() < Ls.length ? "باقي محطات ما خلصت بالطريق." : `النهاية تنفتح بعد الألعاب الأساسية (${Progress.coreWon()} من ${CONFIG.coreGames.length}) — أو فعّلوا «إتاحة الحكاية كاملة».`}</span></div>`}
        <div class="tp-endrow">${nx ? `<button class="btn gold" data-next>المحطة الجاية</button>` : endNow ? `<button class="btn gold" data-endg>النهاية</button>` : `<button class="btn gold" data-games>عالم الألعاب</button>`}<button class="btn line" data-again>إعادة المحطة</button><button class="btn line" data-map>طريق الحكاية</button></div></div>`);
      over.innerHTML = ""; over.appendChild(card); requestAnimationFrame(() => card.classList.add("in"));
      confetti();
      const n = $("[data-next]", card); if (n) n.onclick = () => go("story:" + nx.id);
      const e = $("[data-endg]", card); if (e) e.onclick = () => go("ending");
      const g = $("[data-games]", card); if (g) g.onclick = () => go("games");
      $("[data-again]", card).onclick = () => go("story:" + chap.id, false);
      $("[data-map]", card).onclick = () => go("story");
      if (auto && nx) setTimeout(() => { if (current === "story:" + chap.id) go("story:" + nx.id); }, 6000);
    }

    /* ----- إيقاف مؤقت وصوت ----- */
    function pauseMenu() {
      if (mode === "end") return;
      paused = true; v.classList.add("paused");
      const box = h(`<div class="tp-pausebox" role="dialog" aria-modal="true"><div class="tp-card in"><h3>موقوفة مؤقتاً</h3>
        <div class="tp-col"><button class="btn gold" data-resume>كمّلوا</button><button class="btn line" data-restart>إعادة المحطة</button><button class="btn line" data-set>الإعدادات</button><button class="btn line" data-lib>طريق الحكاية</button></div>
        <p class="note">${finePointer ? "المشي: الأسهم أو A/D، أو انقروا المكان · التفاعل: E أو Space · الإيقاف: Esc" : "المسوا المكان حتى تمشون، والمسوا الأشياء اللي تلمع حتى تتفاعلون."}</p></div></div>`);
      v.appendChild(box);
      const close = () => { box.remove(); paused = false; v.classList.remove("paused"); last = performance.now(); };
      $("[data-resume]", box).onclick = close;
      $("[data-restart]", box).onclick = () => { delete SV.cp[chap.id]; save(); go("story:" + chap.id, false); };
      $("[data-set]", box).onclick = () => openSettings();
      $("[data-lib]", box).onclick = leave;
      box._close = close;
    }

    /* ----- الإدخال ----- */
    const KEYMAP = { ArrowRight: "right", KeyD: "right", ArrowLeft: "left", KeyA: "left" };
    const onKey = e => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.type === "keydown" && (e.key === "Escape" || e.code === "KeyP")) { e.preventDefault(); const pb = $(".tp-pausebox", v); if (pb) pb._close(); else if (!$(".scrim")) pauseMenu(); return; }
      if (paused) return;
      const k = KEYMAP[e.code];
      if (mode === "explore" && !interacting) {
        if (k) { e.preventDefault(); if (e.type === "keydown") { keys.add(k); autoTarget = null; pendingObj = null; } else keys.delete(k); return; }
        if ((e.code === "Space" || e.code === "KeyE" || e.code === "Enter") && e.type === "keydown") { e.preventDefault(); onAction(); return; }
      } else if (e.type === "keydown" && (e.code === "Space" || e.code === "Enter" || e.code === "KeyE") && advanceFn && !over.contains(document.activeElement)) { e.preventDefault(); advanceFn(); }
    };
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKey);
    const releaseAll = () => { keys.clear(); $$(".tp-pad button.on", v).forEach(x => x.classList.remove("on")); };
    window.addEventListener("blur", releaseAll); document.addEventListener("visibilitychange", releaseAll);
    stage.addEventListener("click", e => {
      TAudio.unlock();
      if (advanceFn && (mode === "talk" || mode === "cine")) { advanceFn(); return; }
      if (mode === "explore" && !interacting && P) {   // لمس المكان = امشوا له
        const r = stage.getBoundingClientRect(); const wx = cam + (e.clientX - r.left) / U; const wy = 100 - (r.bottom - e.clientY) / U;
        autoTarget = clamp(wx, 3, sc.len - 3); pendingObj = null; showTap(autoTarget, Math.min(sc.ground, wy));
      }
    });
    dlg.addEventListener("click", () => advanceFn && advanceFn());
    narr.addEventListener("click", e => { if (e.target.closest(".tl-btn")) return; advanceFn && advanceFn(); });
    $$(".tp-pad button", v).forEach(b => {
      const k = b.dataset.k;
      const down = e => { e.preventDefault(); TAudio.unlock(); if (mode !== "explore" || interacting) return; autoTarget = null; pendingObj = null; if (k === "act") onAction(); else keys.add(k); b.classList.add("on"); };
      const up = () => { keys.delete(k); b.classList.remove("on"); };
      b.addEventListener("pointerdown", e => { try { b.setPointerCapture(e.pointerId); } catch (_) {} down(e); });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach(t => b.addEventListener(t, up));
      b.addEventListener("contextmenu", e => e.preventDefault());
    });
    $$(".tp-hud .tp-b", v).forEach(b => b.onclick = e => {
      e.stopPropagation(); TAudio.unlock(); const k = b.dataset.h;
      if (k === "back") leave();
      if (k === "pause") pauseMenu();
      if (k === "sound") { const on = !(prefs.music || prefs.sfx); prefs.music = on; prefs.sfx = on; savePrefs(); applyAudio(); b.innerHTML = on ? IC.sound : IC.mute; if (on) music(curMood); toastIn(on ? "الصوت شغّال" : "الصوت مكتوم", 1400); }
      if (k === "auto") { auto = !auto; b.setAttribute("aria-pressed", auto); v.classList.toggle("auto", auto); toastIn(auto ? "عرض سينمائي: الحكاية تمشي لوحدها" : "رجع التحكم إلكم", 1800); if (auto && advanceFn) setTimeout(() => advanceFn && advanceFn(), 1500); }
      if (k === "skip") { const f = skipFn || (mode === "explore" ? exploreSkip : null); if (f) { TAudio.sfx("page"); f(); } }
    });

    /* ----- الحلقة ----- */
    function render() { layoutParallax(); }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (paused) return;
      v.classList.toggle("busy", interacting || mode !== "explore");
      if (mode === "explore" && P && !interacting) physics(dt);
      if (camTween) camTween(now);
      else if (sc && mode !== "cine" && !camHold && (P && mode === "explore" ? true : chars[playerWho])) { const fx0 = mode === "explore" && P ? P.x : chars[playerWho].x; const target = clamp(fx0 - VW * .45, 0, Math.max(0, sc.len - VW)); cam = motionOK() ? lerp(cam, target, Math.min(1, dt * 3)) : target; }
      if (sc) render();
      const calmM = !motionOK(); for (const k in chars) { const c = chars[k]; if (c.vis) TRig.update(c, dt, calmM); }
    }
    raf = requestAnimationFrame(frame);

    const startIdx = !ext && from === "cp" && SV.cp[id] ? SV.cp[id].i : 0;
    runChapter(startIdx).catch(err => { console.error(err); toastIn("صار خلل بالمشهد — رجعنا لطريق الحكاية", 2600); setTimeout(() => go("story", false), 1800); });

    return () => {
      ctx.aborted = true; cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey);
      window.removeEventListener("blur", releaseAll); document.removeEventListener("visibilitychange", releaseAll);
      if (skipFn) try { skipFn(); } catch (e) {}
      TAudio.stop();
    };
  }

  function arrow(rot) { return `<svg viewBox="0 0 24 24" style="transform:rotate(${rot}deg)"><path d="M5 12h12M12 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }

  /* =====================================================================
     النهاية: عدول — بعد الرحلة فقط
     ===================================================================== */
  function ending(root) {
    init();
    if (!Progress.endingOpen()) {
      const left = list().filter(s => !SV.done[s.id]);
      const needG = prefs.openAll ? 0 : CONFIG.coreGames.length - Progress.coreWon();
      const v = h(`<section class="view page noselect"><div class="page-inner"><div class="card end-lock">
        <span class="el-ic">${IC.lock}</span><h1>النهاية بعدها مسكّرة</h1>
        <p>تنفتح بس بعد ما تكملون الرحلة كاملة${prefs.openAll ? "" : " والألعاب الأساسية الثلاث"}.</p>
        <ul>${left.length ? `<li>باقي ${numSpan(left.length)} ${left.length === 1 ? "محطة" : "محطات"}: ${left.map(s => esc(s.title)).join("، ")}</li>` : `<li>كل المحطات خلصت ✓</li>`}${prefs.openAll ? "" : `<li>${needG ? `باقي ${numSpan(needG)} من الألعاب الأساسية (${CONFIG.coreGames.map(g => esc(Games.title(g))).join("، ")})` : "الألعاب الأساسية خلصت ✓"}</li>`}</ul>
        <div class="row center"><button class="btn gold" data-story>طريق الحكاية</button>${needG ? `<button class="btn line" data-games>عالم الألعاب</button>` : ""}</div>
        <p class="note">تگدرون تفعّلون «إتاحة الحكاية كاملة» من الإعدادات حتى ما تحتاجون الفوز بالألعاب. المحطات لازم تخلص.</p></div></div></section>`);
      root.appendChild(v);
      $("[data-story]", v).onclick = () => go("story");
      const g = $("[data-games]", v); if (g) g.onclick = () => go("games");
      return;
    }
    const chap = HIKAYAT.ending;
    return viewPlayer(root, "ending", "", { chap, exit: () => go("story"), done: () => finale(root) });
  }
  function finale(root) {
    init(); SV.endingSeen = true; save();
    const v = root.querySelector(".tl-play"); if (!v) return;
    const over = $(".tp-over", v); over.hidden = false; v.classList.add("overlay");
    const card = h(`<div class="tp-card tp-final"><img class="fi-pair" src="${TRig.still("pair")}" alt="${esc(CONFIG.isa)} و${esc(CONFIG.amna)}"><h3>${esc(CONFIG.isa)} و${esc(CONFIG.amna)}</h3><p class="tp-cliff">من ${numSpan(CONFIG.firstMeet)}… لـ ${numSpan(CONFIG.weddingLabel)}، والحكاية بعدها تبدي.</p>
      <div class="tp-endrow"><button class="btn gold" data-replay>${IC.restart} إعادة عيش الحكاية</button><button class="btn line" data-save>${IC.save} حفظ النهاية</button><button class="btn line" data-home>الرئيسية</button></div></div>`);
    over.innerHTML = ""; over.appendChild(card); requestAnimationFrame(() => card.classList.add("in"));
    TAudio.sfx("cheer"); confetti();
    $("[data-replay]", card).onclick = () => go("story:" + list()[0].id);
    $("[data-home]", card).onclick = () => go("home");
    $("[data-save]", card).onclick = () => keepsake().then(ok => { if (ok) { SV.endingSaved = true; save(); } });
  }
  // صورة تذكارية للنهاية (PNG): الثنائي + عدول + جملته كاملة
  async function keepsake() {
    const load = src => new Promise((r, j) => { const im = new Image(); im.onload = () => r(im); im.onerror = j; im.src = src; });
    try {
      await document.fonts.ready;
      const [pair, adool] = await Promise.all([load(TRig.still("pair")), load(TRig.still("adool"))]);
      const W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#1A1F36"); gr.addColorStop(.55, "#4A3550"); gr.addColorStop(1, "#C98257"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,240,200,${Math.random() * .6})`; g.beginPath(); g.arc(Math.random() * W, Math.random() * H * .5, Math.random() * 2 + .5, 0, 7); g.fill(); }
      g.direction = "rtl"; g.textAlign = "center"; g.fillStyle = "#F6E3B8"; g.font = "700 96px 'Aref Ruqaa', serif"; g.fillText("حكايتنا", W / 2, 150);
      g.font = "400 34px Almarai, sans-serif"; g.fillStyle = "#EBD9BC"; g.fillText(`${CONFIG.isa} و${CONFIG.amna} · ${CONFIG.weddingLabel}`, W / 2, 210);
      const ph = 760, pw = ph * pair.width / pair.height; g.drawImage(pair, W / 2 - pw / 2 - 60, 300, pw, ph);
      const ah = 380, aw = ah * adool.width / adool.height; g.drawImage(adool, W - aw - 40, 300 + ph - ah, aw, ah);
      g.fillStyle = "rgba(255,251,243,.94)"; const bx = 60, by = 1080, bw = W - 120, bh = 220; g.beginPath(); g.roundRect ? g.roundRect(bx, by, bw, bh, 28) : g.rect(bx, by, bw, bh); g.fill();
      g.fillStyle = "#3B2A1E"; g.font = "700 38px Almarai, sans-serif";
      const words = CONFIG.adoolLine.split(" "); const lines = []; let line = "";
      words.forEach(w => { const t = line ? line + " " + w : w; if (g.measureText(t).width > bw - 80) { lines.push(line); line = w; } else line = t; }); lines.push(line);
      lines.forEach((l, i) => g.fillText(l, W / 2, by + 70 + i * 54));
      const blob = await new Promise(r => c.toBlob(r, "image/png"));
      const ok = download("hikayatna-ending.png", blob);
      toast(ok ? "انحفظت صورة النهاية" : "ما قدرت أنزّل الصورة بهذا المتصفح", ok ? "check" : "close");
      return ok;
    } catch (e) { console.error(e); toast("ما قدرت أجهّز صورة النهاية", "close"); return false; }
  }

  /* ---------- نقطة الدخول ---------- */
  function view(root, arg) {
    init();
    const [id, from] = (arg || "").split("@");
    return id ? viewPlayer(root, id, from) : viewMap(root);
  }
  return { view, ending, get save() { return SV; } };
})();
