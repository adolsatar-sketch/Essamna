/* =====================================================================
   رسائلنا — رسائلهم الحقيقية (data/letters.js) كبطاقات تنفتح.
   النص ينعرض مثل ما هو؛ بس تكبير الخط واتجاه القراءة وتقسيم الأسطر.
   ===================================================================== */
const Letters = (() => {
  const S = () => Object.assign({ size: 1.12, plain: false, read: {} }, Store.get("letters", {}));
  const save = s => Store.set("letters", s);
  const sorted = () => LETTERS.slice().sort((a, b) => (a.sort || "9999") < (b.sort || "9999") ? -1 : 1);
  const preview = t => t.replace(/\s+/g, " ").slice(0, 90) + (t.length > 90 ? "…" : "");

  function view(root, arg) {
    const st = S();
    let filter = "all";
    const v = h(`<section class="view page lt-page noselect"><div class="page-inner">
      <header class="page-head"><div><h1>رسائلنا</h1><p class="page-sub">رسائلهم الحقيقية، منقولة من اللقطات مثل ما انكتبت — نفس اللهجة ونفس الإملاء. ما انضاف ولا انشال شي؛ بس قسّمنا الأسطر حتى تنقرا براحة.</p></div></header>
      <div class="seg lt-filter" role="group" aria-label="فلترة">${[["all", "الكل"], ["آمنة", "من آمنة"], ["عيسى", "من عيسى"]].map(([k, l]) => `<button data-f="${k}" aria-pressed="${k === "all"}">${l}</button>`).join("")}</div>
      <div class="lt-grid"></div>
      <p class="note lt-foot">الصور الأصلية للمحادثات ما تنعرض هنا للخصوصية. إذا جزء من رسالة ما چان واضح باللقطة، مكتوب جنبها.</p>
    </div></section>`);
    root.appendChild(v);
    const grid = $(".lt-grid", v);
    const draw = () => {
      const list = sorted().filter(m => filter === "all" || m.from === filter);
      grid.innerHTML = list.map(m => `<button class="lt-env ${st.read[m.id] ? "read" : ""}" data-id="${m.id}">
        <span class="le-flap"></span><span class="le-seal">${IC.heart}</span>
        <span class="le-meta"><b>${m.from === "غير مكتوب" ? "بطاقة بخط اليد" : `من ${esc(m.from)} لـ${esc(m.to)}`}</b><small>${esc(m.date || "التاريخ مو ظاهر")} · ${esc(m.app)}</small></span>
        <span class="le-prev">${esc(preview(m.text))}</span>${m.occasion ? `<span class="le-tag">${esc(m.occasion)}</span>` : ""}</button>`).join("");
      $$(".lt-env", grid).forEach(b => b.onclick = () => openLetter(b.dataset.id, () => { draw(); }));
    };
    $$("[data-f]", v).forEach(b => b.onclick = () => { filter = b.dataset.f; $$("[data-f]", v).forEach(x => x.setAttribute("aria-pressed", x === b)); draw(); });
    draw();
    if (arg) setTimeout(() => openLetter(arg, draw), 200);
  }

  function openLetter(id, onClose) {
    const m = LETTERS.find(x => x.id === id); if (!m) return;
    const st = S(); st.read[id] = true; save(st);
    TAudio.sfx("envelope");
    const station = m.station && HIKAYAT.stations.find(s => s.id === m.station);
    const md = modal(`<div class="lt-open ${st.plain || !motionOK() ? "plain" : ""}" style="--fs:${st.size}rem">
      <div class="lo-env" aria-hidden="true"><span class="lo-flap"></span></div>
      <article class="lo-paper">
        <header><span class="lo-from">${m.from === "غير مكتوب" ? "بطاقة بخط اليد" : `من ${esc(m.from)} لـ${esc(m.to)}`}</span><small>${esc([m.date || "التاريخ مو ظاهر باللقطة", m.time, m.app].filter(Boolean).join(" · "))}</small></header>
        ${m.photo && PHOTO[m.photo] ? `<img class="lo-photo" src="${photoSrc(m.photo, 480)}" alt="${esc(PHOTO[m.photo].t)}">` : ""}
        <div class="lo-text" dir="rtl">${esc(m.text).split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("")}</div>
        ${m.note ? `<p class="lo-note">${esc(m.note)}</p>` : ""}
        <details class="lo-how"><summary>شلون عرفنا منو كتبها؟</summary><p>${esc(m.evidence)}</p></details>
      </article>
      <div class="row lo-tools"><button class="btn line sm" data-a="-">أ−</button><button class="btn line sm" data-a="+">أ+</button><button class="btn line sm" data-plain aria-pressed="${st.plain}">${st.plain ? "عرض الظرف" : "نص عادي"}</button>${station ? `<button class="btn gold sm" data-st>محطة «${esc(station.title)}»</button>` : ""}</div>
    </div>`, { wide: true, label: "رسالة", onClose });
    const box = $(".lt-open", md.el);
    $$("[data-a]", md.el).forEach(b => b.onclick = () => { const s2 = S(); s2.size = Math.max(.95, Math.min(1.6, s2.size + (b.dataset.a === "+" ? .08 : -.08))); save(s2); box.style.setProperty("--fs", s2.size + "rem"); });
    $("[data-plain]", md.el).onclick = e => { const s2 = S(); s2.plain = !s2.plain; save(s2); box.classList.toggle("plain", s2.plain); e.currentTarget.textContent = s2.plain ? "عرض الظرف" : "نص عادي"; };
    const sb = $("[data-st]", md.el); if (sb) sb.onclick = () => { md.close(); go("story"); };
  }
  return { view, openLetter };
})();
