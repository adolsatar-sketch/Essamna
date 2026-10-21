/* =====================================================================
   حكايتنا — النواة: الحفظ، الأدوات، الأيقونات، النوافذ، الراوتر،
   الإعدادات، شاشة التحميل والرئيسية.
   مبنية على نواة مشروع إيلاف (Store / modal / toast / go) بمحتوى عيسى وآمنة.
   ===================================================================== */
const CONFIG = {
  siteTitle: "حكايتنا",
  isa: "عيسى", amna: "آمنة", adool: "عدول",
  weddingISO: "2026-10-30T00:00:00",
  weddingLabel: "30/10/2026",
  firstMeet: "16/1",
  adoolLine: "عدول يتمنالكم زواج سعيد، يارب دوم السعادة والحياة السعيدة.",
  coreGames: ["memory", "puzzle", "camera"]
};

/* ============ الحفظ المحلي (آمن) ============ */
const Store = (() => {
  let ok = true, mem = {};
  try { const k = "__hk_t"; localStorage.setItem(k, "1"); localStorage.removeItem(k); } catch (e) { ok = false; }
  return {
    ok,
    get(k, d) { try { const v = ok ? localStorage.getItem("hk_" + k) : mem[k]; return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { const s = JSON.stringify(v); if (!ok) { mem[k] = s; return true; } try { localStorage.setItem("hk_" + k, s); return true; } catch (e) { toast("ما قدرت أحفظ — مساحة المتصفح ممتلئة", "close"); return false; } },
    del(k) { try { ok ? localStorage.removeItem("hk_" + k) : delete mem[k]; } catch (e) {} },
    keys() { try { return ok ? Object.keys(localStorage).filter(k => k.startsWith("hk_")).map(k => k.slice(3)) : Object.keys(mem); } catch (e) { return []; } }
  };
})();
const prefs = Object.assign({ calm: false, quality: "auto", music: true, sfx: true, vol: .6, subs: true, openAll: false, pad: false, wallNoteSeen: false }, Store.get("prefs", {}));
const savePrefs = () => Store.set("prefs", prefs);

/* ============ أدوات ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function h(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const wait = ms => new Promise(r => setTimeout(r, ms));
const sysReduce = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
const motionOK = () => !prefs.calm && !sysReduce.matches;
const finePointer = window.matchMedia && matchMedia("(pointer:fine)").matches;
const lowGfx = () => prefs.quality === "low" || (prefs.quality === "auto" && ((navigator.hardwareConcurrency || 4) <= 2 || (navigator.deviceMemory || 4) <= 2));
const AR_MONTHS = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];
const numSpan = t => `<span class="num">${esc(t)}</span>`;
function daysToWedding() { const d = new Date(CONFIG.weddingISO) - new Date(new Date().toDateString()); return Math.round(d / 864e5); }

/* ============ أيقونات ============ */
const IC = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>',
  story: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5.5C6 4 9 4 12 6c3-2 6-2 9-.5V19c-3-1.5-6-1.5-9 .5-3-2-6-2-9-.5z"/><path d="M12 6v13.5"/></svg>',
  games: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7 10.5v4M5 12.5h4M15.5 11.5h.01M18 13.5h.01"/></svg>',
  letter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/></svg>',
  wall: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 2.8l2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 16.8l-5.4 2.8 1-6.1-4.4-4.3 6.1-.8z" fill="#E7CB8E" stroke="#8E6C33" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.5C5 15.8 3 12.5 3.6 9.2 4.2 6 8 4.8 12 8.4c4-3.6 7.8-2.4 8.4.8.6 3.3-1.4 6.6-8.4 11.3z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M4 20h16"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5M4 20h16"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.6"/></svg>',
  restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 108-8H8"/><path d="M10 1.5L7.5 4 10 6.5"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
  calm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3c-3 4-6 6-6 10a6 6 0 0012 0c0-4-3-6-6-10z"/><path d="M12 9v9"/></svg>',
  text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 6h14M12 6v13M8 19h8"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0012 3z"/></svg>',
  full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'
};

/* ============ نوافذ وتنبيهات ============ */
function toast(msg, icon = "star") { $$(".toast").forEach(t => t.remove()); const t = h(`<div class="toast" role="status">${IC[icon] || ""}<span>${esc(msg)}</span></div>`); document.body.appendChild(t); setTimeout(() => t.remove(), 2800); }
function modal(inner, { wide = false, cls = "", onClose, label = "" } = {}) {
  const prevFocus = document.activeElement;
  const s = h(`<div class="scrim" role="dialog" aria-modal="true" ${label ? `aria-label="${esc(label)}"` : ""}><div class="modal ${wide ? "wide" : ""} ${cls}"><button class="x" aria-label="إغلاق">${IC.close}</button></div></div>`);
  const m = $(".modal", s); m.insertAdjacentHTML("beforeend", inner);
  let closed = false;
  const close = () => { if (closed) return; closed = true; s.remove(); document.removeEventListener("keydown", onKey); onClose && onClose(); prevFocus && prevFocus.focus && prevFocus.focus({ preventScroll: true }); };
  const onKey = e => { if (e.key === "Escape") close(); };
  $(".x", s).onclick = close; s.addEventListener("click", e => { if (e.target === s) close(); });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(s);
  setTimeout(() => { const f = $("[autofocus]", m) || $(".x", m); f && f.focus({ preventScroll: true }); }, 30);
  return { el: m, close };
}
function confirmBox(title, text, yes = "نعم") {
  return new Promise(res => {
    const md = modal(`<h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ""}<div class="row"><button class="btn danger" data-y>${esc(yes)}</button><button class="btn line" data-n>تراجع</button></div>`, { onClose: () => res(false) });
    $("[data-y]", md.el).onclick = () => { res(true); md.close(); };
    $("[data-n]", md.el).onclick = () => md.close();
  });
}
function confetti() {
  if (!motionOK()) return;
  const c = h('<div class="confetti" aria-hidden="true"></div>'); const cols = ["#E7CB8E", "#C9A25E", "#F4E2C7", "#E0703A", "#C98B8B"];
  for (let i = 0; i < 28; i++) { const sp = document.createElement("span"); sp.innerHTML = `<svg viewBox="0 0 12 16"><path d="M6 0C9 4 12 6 12 9a6 6 0 01-12 0C0 6 3 4 6 0z" fill="${cols[i % 5]}"/></svg>`; sp.style.left = Math.random() * 100 + "%"; sp.style.animationDelay = (Math.random() * .6) + "s"; sp.style.animationDuration = (2.2 + Math.random() * 1.6) + "s"; c.appendChild(sp); }
  document.body.appendChild(c); setTimeout(() => c.remove(), 4400);
}
function download(filename, blob) {
  try { const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); return true; } catch (e) { return false; }
}

/* ============ التقدّم العام (الحكاية + الألعاب) ============ */
const Progress = {
  get story() { return Store.get("story", { done: {}, cp: {}, choices: {}, endingSeen: false }); },
  get games() { return Store.get("games", {}); },
  stationsDone() { const d = this.story.done; return HIKAYAT.stations.filter(s => d[s.id]).length; },
  coreWon() { const g = this.games; return CONFIG.coreGames.filter(id => g[id] && g[id].won).length; },
  endingOpen() { return this.stationsDone() === HIKAYAT.stations.length; },   // «كلمة من عدول»: بعد ما تخلص الحكاية كلها
};

/* ============ الراوتر ============ */
let cleanup = null, current = "home";
const ROUTES = { home: viewHome, story: (r, a) => StoryEngine.view(r, a), games: (r, a) => Games.view(r, a), letters: (r, a) => Letters.view(r, a), wall: (r, a) => Wall.view(r, a), ending: (r, a) => StoryEngine.ending(r, a) };
const NAV = [["home", "الرئيسية", "home"], ["story", "الحكاية", "story"], ["games", "الألعاب", "games"], ["letters", "رسائلنا", "letter"], ["wall", "ذكرياتنا", "wall"]];
function go(route, push = true) {
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  current = route;
  if (push) { try { history.pushState({ route }, "", "#" + route); } catch (e) {} }
  const view = $("#view"); view.innerHTML = "";
  const [kind, arg] = route.split(":");
  $$(".dock a").forEach(a => a.setAttribute("aria-current", a.dataset.r === kind ? "page" : "false"));
  document.body.classList.toggle("no-dock", (kind === "story" && !!arg) || kind === "ending" || (kind === "games" && !!arg));
  const fn = ROUTES[kind] || viewHome;
  try { cleanup = fn(view, arg) || null; }
  catch (e) { console.error(e); view.innerHTML = ""; view.appendChild(h(`<section class="view page"><div class="page-inner"><div class="card" style="padding:20px"><h2 style="margin-top:0;font-family:var(--font-d);color:var(--brown)">صار خلل بهالصفحة</h2><p>جرّبوا ترجعون للرئيسية أو تعيدون التحميل.</p><div class="row"><button class="btn gold" data-h>الرئيسية</button><button class="btn line" data-r>إعادة التحميل</button></div></div></div></section>`)); $("[data-h]", view).onclick = () => go("home"); $("[data-r]", view).onclick = () => location.reload(); }
  const v = view.firstElementChild; if (v) { v.setAttribute("tabindex", "-1"); v.focus({ preventScroll: true }); }
}
window.addEventListener("popstate", e => { const r = (e.state && e.state.route) || (location.hash.slice(1) || "home"); go(r, false); });

/* ============ الصوت العام ============ */
function applyAudio() { TAudio.setOpts({ music: prefs.music, sfx: prefs.sfx, vol: prefs.vol }); }
document.addEventListener("pointerdown", () => { if (!TAudio.unlocked) TAudio.unlock(); }, { once: false, passive: true });

/* ============ الإعدادات ============ */
function openSettings() {
  const sw = (k, on) => `<button class="sw" role="switch" aria-checked="${!!on}" data-k="${k}"></button>`;
  const md = modal(`<h2>الإعدادات</h2>
    <div class="set-row"><div><b>الموسيقى</b><small>موسيقى هادية تتولّد بالمتصفح لكل محطة.</small></div>${sw("music", prefs.music)}</div>
    <div class="set-row"><div><b>المؤثرات الصوتية</b><small>كاميرا، مفاتيح، ظرف، ألعاب نارية…</small></div>${sw("sfx", prefs.sfx)}</div>
    <div class="set-row"><div><b>مستوى الصوت</b></div><input type="range" min="0" max="1" step=".05" value="${prefs.vol}" data-vol style="width:150px"></div>
    <div class="set-row"><div><b>جودة الرسوم</b><small>«خفيف» يقلل الطبقات والجزيئات للهواتف البطيئة.</small></div><div class="seg" data-q>${[["auto", "تلقائي"], ["low", "خفيف"], ["high", "مرتفع"]].map(([v, l]) => `<button data-v="${v}" aria-pressed="${prefs.quality === v}">${l}</button>`).join("")}</div></div>
    <div class="set-row"><div><b>تقليل الحركة</b><small>${sysReduce.matches ? "جهازكم مفعّل عليه تقليل الحركة." : "يوقف الحركات الكبيرة والانتقالات."}</small></div>${sw("calm", prefs.calm || sysReduce.matches)}</div>
    <div class="set-row"><div><b>نص الحوار تحت المشهد</b><small>الحوار يبقى مكتوب دائماً.</small></div>${sw("subs", prefs.subs)}</div>
    <div class="set-row"><div><b>أزرار الحركة بالحكاية</b><small>اللمس على المكان يكفي للمشي؛ هذا يضيف أسهم صغيرة.</small></div>${sw("pad", prefs.pad)}</div>
    <div class="set-row"><div><b>إتاحة الحكاية كاملة</b><small>تفتح كل المحطات بأي ترتيب. فصل «كلمة من عدول» يبقى ينفتح بس بعد إكمال كل المحطات.</small></div>${sw("openAll", prefs.openAll)}</div>
    <h3 style="margin-top:18px">الخصوصية والنسخ الاحتياطي</h3>
    <p class="note">كل شي — تقدّم الحكاية والألعاب وذكريات الحائط وصورها — محفوظ بهذا المتصفح على هذا الجهاز فقط، وما يتزامن تلقائياً ويا أجهزة ثانية. حتى تنقلونه: صدّروا نسخة احتياطية واستوردوها بالجهاز الثاني.</p>
    <div class="row"><button class="btn gold sm" data-exp>${IC.save} تصدير نسخة احتياطية</button><label class="btn line sm" style="cursor:pointer">${IC.upload} استيراد نسخة<input type="file" accept="application/json,.json" data-imp hidden></label></div>
    <h3 style="margin-top:18px">البداية من جديد</h3>
    <div class="row"><button class="btn line sm" data-reset>${IC.restart} إعادة القصة</button><button class="btn danger sm" data-wipe>${IC.trash} مسح كل البيانات</button></div>
    <p class="note">«إعادة القصة» ترجّع المحطات والألعاب لأولها، وذكريات الحائط تبقى.</p>`, { wide: true, label: "الإعدادات" });
  $$(".sw", md.el).forEach(b => b.onclick = () => {
    const k = b.dataset.k; if (k === "calm" && sysReduce.matches) { toast("تقليل الحركة مفعّل من إعدادات جهازكم", "calm"); return; }
    prefs[k] = !prefs[k]; b.setAttribute("aria-checked", prefs[k]); savePrefs(); applyAudio();
    if (k === "calm") document.documentElement.classList.toggle("calm", prefs.calm);
  });
  $("[data-vol]", md.el).oninput = e => { prefs.vol = +e.target.value; savePrefs(); applyAudio(); };
  $$("[data-q] button", md.el).forEach(b => b.onclick = () => { prefs.quality = b.dataset.v; savePrefs(); $$("[data-q] button", md.el).forEach(x => x.setAttribute("aria-pressed", x === b)); document.documentElement.dataset.gfx = lowGfx() ? "low" : "high"; });
  $("[data-exp]", md.el).onclick = () => Backup.export();
  $("[data-imp]", md.el).onchange = e => { const f = e.target.files[0]; if (f) Backup.import(f).then(() => { md.close(); go(current, false); }); };
  $("[data-reset]", md.el).onclick = async () => { if (await confirmBox("نعيد القصة من البداية؟", "تقدّم المحطات والألعاب يرجع لأوله. ذكرياتكم بالحائط تبقى.", "إعادة")) { Store.del("story"); Store.del("games"); md.close(); toast("رجعت الحكاية لأول صدفة", "restart"); go("home"); } };
  $("[data-wipe]", md.el).onclick = async () => { if (await confirmBox("نمسح كل شي من هذا الجهاز؟", "التقدّم والإعدادات وذكريات الحائط اللي أضفتوها وصورها. صدّروا نسخة احتياطية قبلها إذا تحتاجونها.", "امسح كلشي")) { Store.keys().forEach(k => Store.del(k)); await Wall.wipe(); location.hash = "home"; location.reload(); } };
}

/* ============ النسخ الاحتياطي ============ */
const Backup = {
  async export() {
    const data = { app: "hikayatna", v: 1, at: new Date().toISOString(), store: {}, wall: await Wall.dump() };
    Store.keys().forEach(k => data.store[k] = Store.get(k));
    const ok = download(`hikayatna-backup-${new Date().toISOString().slice(0, 10)}.json`, new Blob([JSON.stringify(data)], { type: "application/json" }));
    toast(ok ? "انحفظت النسخة الاحتياطية" : "ما قدرت أنزّل الملف بهذا المتصفح", ok ? "check" : "close");
  },
  async import(file) {
    try {
      const d = JSON.parse(await file.text()); if (d.app !== "hikayatna") throw new Error("bad");
      Object.entries(d.store || {}).forEach(([k, v]) => Store.set(k, v));
      Object.assign(prefs, Store.get("prefs", {}));
      const n = await Wall.restore(d.wall || []);
      toast(`رجعت النسخة${n ? ` ويا ${n} ذكرى` : ""}`, "check");
    } catch (e) { toast("هذا الملف مو نسخة احتياطية من حكايتنا", "close"); }
  }
};

/* ============ الرئيسية ============ */
function heroSkyline() {
  // أفق مسائي دافئ: نهر، نخيل، جسر وقصر بأعمدة — لوحة الرئيسية
  const palms = [[60, 520], [150, 540], [820, 528], [900, 548], [980, 520]].map(([x, y]) => `<g transform="translate(${x} ${y})"><path d="M0 0c2-30 4-60 0-92" stroke="#2A2230" stroke-width="7" fill="none"/>${[-70, -35, 0, 35, 70, 110, -110].map(a => `<path d="M0-92c18-6 34 2 46 18" transform="rotate(${a} 0 -92)" stroke="#2A2230" stroke-width="6" fill="none" stroke-linecap="round"/>`).join("")}</g>`).join("");
  const cols = Array.from({ length: 8 }, (_, i) => `<rect x="${388 + i * 30}" y="372" width="12" height="96" rx="3" fill="#F2DFC0"/>`).join("");
  return `<svg viewBox="0 0 1040 620" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><linearGradient id="hwater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C98257"/><stop offset="1" stop-color="#3A2B3A"/></linearGradient>
    <radialGradient id="hsun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE6B0"/><stop offset=".5" stop-color="#F5B979" stop-opacity=".55"/><stop offset="1" stop-color="#F5B979" stop-opacity="0"/></radialGradient>
    <linearGradient id="hpal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8E7C9"/><stop offset="1" stop-color="#D9B98E"/></linearGradient></defs>
    <circle cx="520" cy="430" r="190" fill="url(#hsun)"/>
    <path d="M0 470 L60 440 L120 452 L190 420 L260 446 L330 430 L360 470Z" fill="#5A3E4A" opacity=".7"/>
    <path d="M680 470 L720 436 L790 448 L850 410 L920 440 L1000 424 L1040 450 L1040 470Z" fill="#5A3E4A" opacity=".7"/>
    <g opacity=".9" transform="translate(330 40) scale(.8)"><path d="M370 372h300l-18-28H388z" fill="#E9D2AE"/><path d="M398 344h244l-122-50z" fill="#F4E2C6"/><path d="M520 302l0-8" stroke="#E7CB8E" stroke-width="4"/>${cols}<rect x="370" y="466" width="300" height="12" fill="#CDAE82"/>
      ${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${403 + i * 30} 400a8 10 0 0 1 16 0v40h-16z" fill="#FFD796" opacity=".85"/>`).join("")}</g>
    <path d="M0 478h1040v142H0z" fill="url(#hwater)"/>
    <path d="M140 500c120 6 240-6 360 2s260 8 400-4" stroke="#F5C48A" stroke-width="3" opacity=".55" fill="none"/>
    <path d="M90 540c160 4 300-6 470 2s300 6 420-2" stroke="#F5C48A" stroke-width="2" opacity=".35" fill="none"/>
    <rect x="490" y="486" width="60" height="120" fill="#FFD796" opacity=".18"/>
    ${palms}
    <path d="M0 600c200-24 420-30 520-26s340 6 520 26v20H0z" fill="#21192A"/>
  </svg>`;
}
function viewHome(root) {
  const st = Progress.story, done = Progress.stationsDone(), N = HIKAYAT.stations.length, d = daysToWedding();
  const next = HIKAYAT.stations.find(s => !st.done[s.id]);
  const countdown = d > 0 ? `<span class="days">باقي ${numSpan(d)} ${d === 1 ? "يوم" : d <= 10 ? "أيام" : "يوم"}</span>` : d === 0 ? `<span class="days">اليوم!</span>` : `<span class="days">${numSpan(CONFIG.weddingLabel)}</span>`;
  const v = h(`<section class="home view noselect">
    <div class="home-hero">
      <div class="hh-sky"></div>
      <div class="hh-stars" aria-hidden="true">${Array.from({ length: 36 }, () => `<i style="left:${Math.random() * 100}%;top:${Math.random() * 38}%;animation-delay:${-Math.random() * 4}s"></i>`).join("")}</div>
      <div class="hh-art">${heroSkyline()}</div>
      <div class="hh-top"><button class="ibtn" data-set aria-label="الإعدادات">${IC.gear}</button><button class="ibtn" data-snd aria-label="الصوت" aria-pressed="${prefs.music || prefs.sfx}">${prefs.music || prefs.sfx ? IC.sound : IC.mute}</button></div>
      <div class="hh-title"><span class="kick">من ${numSpan(CONFIG.firstMeet)} لـ ${numSpan(CONFIG.weddingLabel)}</span><h1>حكايتنا</h1><p>${esc(CONFIG.isa)} و${esc(CONFIG.amna)} — صدفة ملخبطة بالقصر الروماني، صارت أحلى صدفة.</p></div>
      <div class="hh-cast"><div class="hc" data-pair>${TRig.html("pair")}</div></div>
      <div class="hh-panel">
        <div class="hh-count"><b>${d > 0 ? "لموعد الزفاف" : "يوم الزفاف"}</b>${countdown}</div>
        <div><div class="prog" aria-label="${done} من ${N} محطة"><i style="width:${done / N * 100}%"></i></div><p class="note" style="margin:6px 0 0">${done ? `خلصتوا ${numSpan(done)} من ${numSpan(N)} محطة` : `${numSpan(N)} محطة من أول صدفة لحد موعد الزفاف`}${Progress.endingOpen() ? " · «كلمة من عدول» انفتحت" : ""}</p></div>
        <div class="row"><button class="btn gold" data-go style="flex:1">${next ? (done ? `كمّلوا: ${esc(next.title)}` : "ابدأوا الحكاية") : "إعادة عيش الحكاية"}</button><button class="btn line" data-map>${IC.map} المحطات</button></div>
        <div class="hh-links">
          <a class="hh-link" href="#games">${IC.games}<span>عالم الألعاب</span><small>${Progress.coreWon()} من ${CONFIG.coreGames.length} أساسية</small></a>
          <a class="hh-link" href="#letters">${IC.letter}<span>رسائلنا</span><small>${LETTERS.length} رسائل</small></a>
          <a class="hh-link" href="#wall">${IC.wall}<span>حائط ذكرياتنا</span><small>صور وتواريخ</small></a>
        </div>
      </div>
    </div></section>`);
  root.appendChild(v);
  const c = { who: "pair", x: 0, y: 0, face: 1, anim: "idle" }; const el = $("[data-pair]", v);
  TRig.attach(c, el);
  el.onclick = () => { TRig.joy(c); TAudio.sfx("soft"); };
  let raf = 0, lt = performance.now();
  const loop = now => { const dt = Math.min(.05, (now - lt) / 1000); lt = now; TRig.update(c, dt, !motionOK()); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
  setTimeout(() => TRig.look(c, 1.2), 1500);
  $("[data-go]", v).onclick = () => go(next ? "story:" + next.id : "story");
  $("[data-map]", v).onclick = () => go("story");
  $("[data-set]", v).onclick = openSettings;
  $("[data-snd]", v).onclick = e => { const on = !(prefs.music || prefs.sfx); prefs.music = on; prefs.sfx = on; savePrefs(); applyAudio(); e.currentTarget.setAttribute("aria-pressed", on); e.currentTarget.innerHTML = on ? IC.sound : IC.mute; toast(on ? "الصوت شغّال" : "الصوت مكتوم", "sound"); };
  $$("a.hh-link", v).forEach(a => a.onclick = e => { e.preventDefault(); go(a.getAttribute("href").slice(1)); });
  return () => cancelAnimationFrame(raf);
}

/* ============ الإقلاع: تحميل حقيقي ============ */
function preload(urls, onProg) {
  let n = 0; const total = urls.length;
  return Promise.all(urls.map(u => new Promise((res, rej) => { const im = new Image(); im.decoding = "async"; im.onload = () => { onProg(++n / total); res(); }; im.onerror = () => rej(new Error(u)); im.src = u; })));
}
function boot() {
  document.documentElement.classList.toggle("calm", prefs.calm);
  document.documentElement.dataset.gfx = lowGfx() ? "low" : "high";
  const dock = h(`<nav class="dock" aria-label="التنقل">${NAV.map(([r, l, ic]) => `<a href="#${r}" data-r="${r}">${IC[ic]}<span>${l}</span></a>`).join("")}</nav>`);
  document.body.appendChild(dock);
  $$("a", dock).forEach(a => a.onclick = e => { e.preventDefault(); TAudio.unlock(); go(a.dataset.r); });
  applyAudio();
  const ld = $("#loader"), bar = $(".ld-bar i", ld), msg = $(".ld-msg", ld);
  const chars = ["isa", "amna", "pair"].flatMap(w => Object.keys(RIG_DATA[w].parts).map(k => `assets/characters/${w}-${k}.webp`)).concat(["assets/characters/adool.webp"]);
  const start = () => {
    $(".ld-err", ld).hidden = true; msg.hidden = false; msg.textContent = "نجهّز الحكاية…";
    preload(chars, p => bar.style.width = (p * 100).toFixed(0) + "%").then(() => {
      ld.classList.add("gone"); setTimeout(() => ld.remove(), 700);
      const startR = location.hash.slice(1); const [k] = startR.split(":");
      go(ROUTES[k] ? startR : "home", false);
      try { history.replaceState({ route: current }, "", "#" + current); } catch (e) {}
      if (!Store.ok) setTimeout(() => toast("المتصفح ما يسمح بالحفظ — التقدّم يضيع عند الإغلاق", "bulb"), 1200);
    }).catch(err => { console.error(err); msg.hidden = true; $(".ld-err", ld).hidden = false; });
  };
  $("[data-retry]", ld).onclick = start;
  start();
}
