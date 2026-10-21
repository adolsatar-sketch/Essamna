/* =====================================================================
   حكايتنا — الألغاز (من محرّك إيلاف)
   كل لغز: TPZ.<نوع>(body, o, api)
     body: عنصر DOM لرسم اللغز داخله
     o:    إعدادات اللغز من بيانات الفصل
     api:  { solve(value), say(text), sfx(name), note(n), onHint(fn), onSkip(fn), ctx }
   ما بيها عقوبة؛ الغلط يرجّع اللغز بلطف، والتلميح والتخطي موجودين دائماً.
   ===================================================================== */
const TPZ = (() => {
  const H = html => { const t=document.createElement("template"); t.innerHTML=html.trim(); return t.content.firstElementChild; };
  const sh = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  const wait = ms => new Promise(r=>setTimeout(r, ms));
  const pulse = (el, cls="pz-flash", ms=520) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(()=>el.classList.remove(cls), ms); };
  const P = {};

  /* 1) ترتيب الرموز بالنغمات */
  P.symbols = (body, o, api) => {
    const syms = o.syms, order = o.order; let pos=0, busy=false;
    const view = sh(syms.map((k,i)=>i));
    body.appendChild(H(`<div class="pz-symbols">
      <div class="pz-slots">${order.map(()=>'<span class="pz-slot"></span>').join("")}</div>
      <div class="pz-tiles">${view.map(i=>`<button class="pz-tile" data-i="${i}" aria-label="${o.labels?o.labels[i]:syms[i]}">${TART.symbol(syms[i])}</button>`).join("")}</div>
      <button class="pz-mini" data-replay>اسمعوا الترتيب مرة ثانية</button></div>`));
    const tiles = [...body.querySelectorAll(".pz-tile")], slots=[...body.querySelectorAll(".pz-slot")];
    const tileOf = i => tiles.find(t=>+t.dataset.i===i);
    async function play(){ busy=true; await wait(400); for(const i of order){ pulse(tileOf(i)); api.note(i*2, .55); await wait(720); } busy=false; }
    function reset(){ pos=0; slots.forEach(s=>{ s.innerHTML=""; s.classList.remove("on"); }); }
    tiles.forEach(t => t.onclick = async () => {
      if(busy) return; const i=+t.dataset.i; api.note(i*2,.4); pulse(t);
      if(i===order[pos]){ slots[pos].innerHTML = TART.symbol(syms[i]); slots[pos].classList.add("on"); pos++; if(pos===order.length){ busy=true; await wait(350); api.solve(); } }
      else { api.sfx("nope"); body.querySelector(".pz-slots").classList.add("pz-shake"); setTimeout(()=>body.querySelector(".pz-slots").classList.remove("pz-shake"),500); api.say(o.retry || "قريبة! خلّينا نسمع الترتيب مرة ثانية."); reset(); setTimeout(play, 700); }
    });
    body.querySelector("[data-replay]").onclick = () => { if(!busy){ reset(); play(); } };
    api.onHint(() => { const t=tileOf(order[pos]); t.classList.add("pz-glow"); setTimeout(()=>t.classList.remove("pz-glow"), 2200); api.say(o.hint || "الرمز اللي يلمع هو اللي بعده."); });
    api.onSkip(() => { order.forEach((i,k)=>{ slots[k].innerHTML=TART.symbol(syms[i]); slots[k].classList.add("on"); }); });
    play();
  };


  /* 5) لعبة توقيت لطيفة: التقاء العقارب */
  P.timing = (body, o, api) => {
    const need=o.need||3; let hits=0, a1=0, a2=200, raf=0, last=performance.now(), alive=true;
    const slow = (window.motionOK && !motionOK()) ? .5 : 1;
    body.appendChild(H(`<div class="pz-timing"><svg viewBox="0 0 120 120" class="pz-clock"><circle cx="60" cy="60" r="56" fill="#F6E3A1" stroke="#7A5A3A" stroke-width="5"/><g class="h1"><path d="M60 60V26" stroke="#5E3B28" stroke-width="7" stroke-linecap="round"/></g><g class="h2"><path d="M60 60V14" stroke="#C8705F" stroke-width="4" stroke-linecap="round"/></g><circle cx="60" cy="60" r="5" fill="#5E3B28"/></svg>
      <div class="pz-hits">${"<i></i>".repeat(need)}</div><button class="btn honey pz-now">هسه!</button></div>`));
    const h1=body.querySelector(".h1"), h2=body.querySelector(".h2"), clk=body.querySelector(".pz-clock");
    const diff = () => { let d=Math.abs(((a2-a1)%360+360)%360); return Math.min(d, 360-d); };
    const loop = now => { if(!alive) return; const dt=Math.min(.05,(now-last)/1000); last=now; a1=(a1+22*slow*dt)%360; a2=(a2+84*slow*dt)%360; h1.setAttribute("transform",`rotate(${a1} 60 60)`); h2.setAttribute("transform",`rotate(${a2} 60 60)`); clk.classList.toggle("near", diff()<26); raf=requestAnimationFrame(loop); };
    raf=requestAnimationFrame(loop);
    const press = () => { if(diff()<16){ hits++; api.sfx("pick"); body.querySelectorAll(".pz-hits i")[hits-1].classList.add("on"); a2=(a2+150)%360; if(hits>=need){ alive=false; cancelAnimationFrame(raf); setTimeout(()=>api.solve(),400); } } else { api.sfx("soft"); api.say(["قريبة! استني العقربين يتلاگون.","ماكو مشكلة، الساعة تنتظر.","شوية بعد… لما يصيرون فوگ بعض."][Math.floor(Math.random()*3)]); } };
    body.querySelector(".pz-now").onclick = press;
    const key = e => { if(e.code==="Space"||e.key==="Enter"){ e.preventDefault(); press(); } };
    window.addEventListener("keydown", key);
    api.onHint(() => api.say("لما الساعة تلمع ذهبي، العقارب قريبة من بعض. اضغطوا بوقتها."));
    api.onCleanup(() => { alive=false; cancelAnimationFrame(raf); window.removeEventListener("keydown", key); });
  };


  /* 10) تذكّر مسار النجوم */
  P.starpath = (body, o, api) => {
    let pos=0, busy=true;
    body.appendChild(H(`<div class="pz-stars"><div class="pz-sky">${o.stars.map((s,i)=>`<button class="pz-star" data-i="${i}" style="left:${s[0]}%;top:${s[1]}%" aria-label="نجمة ${i+1}">${TART.symbol("star","#FFF0B8")}</button>`).join("")}<svg class="pz-trail" viewBox="0 0 100 100" preserveAspectRatio="none"></svg></div><button class="pz-mini" data-replay>شوفوا الطريق مرة ثانية</button></div>`));
    const stars=[...body.querySelectorAll(".pz-star")], trail=body.querySelector(".pz-trail");
    const drawTrail = n => { const p=o.seq.slice(0,n).map(i=>o.stars[i]); trail.innerHTML = p.length>1?`<polyline points="${p.map(q=>q.join(",")).join(" ")}" fill="none" stroke="#FFF0B8" stroke-width=".8" stroke-dasharray="2 2"/>`:""; };
    async function show(){ busy=true; pos=0; drawTrail(0); stars.forEach(s=>s.classList.remove("on")); await wait(500); for(const i of o.seq){ pulse(stars[i],"pz-flash",650); api.note(i,.5); await wait(800); } busy=false; }
    stars.forEach(s => s.onclick = () => { if(busy) return; const i=+s.dataset.i; api.note(i,.4);
      if(i===o.seq[pos]){ s.classList.add("on"); pos++; drawTrail(pos); if(pos===o.seq.length){ busy=true; setTimeout(()=>api.solve(),600); } }
      else { api.sfx("nope"); api.say("النجوم تلف شوية… نشوف الطريق مرة ثانية."); setTimeout(show, 600); } });
    body.querySelector("[data-replay]").onclick = () => { if(!busy) show(); };
    api.onHint(() => { const s=stars[o.seq[pos]]; s.classList.add("pz-glow"); setTimeout(()=>s.classList.remove("pz-glow"),2000); });
    api.onSkip(() => { o.seq.forEach(i=>stars[i].classList.add("on")); drawTrail(o.seq.length); });
    show();
  };

  /* 11) ترتيب الحروف */
  P.letters = (body, o, api) => {
    const L=[...o.letters]; let pos=0;
    body.appendChild(H(`<div class="pz-letters"><div class="pz-lslots">${L.map(()=>'<span></span>').join("")}</div><div class="pz-ltiles">${sh(L.map((c,i)=>({c,i}))).map(t=>`<button class="pz-ltile" data-c="${t.c}">${t.c}</button>`).join("")}</div><p class="pz-sub">${o.clue||""}</p></div>`));
    const slots=[...body.querySelectorAll(".pz-lslots span")];
    body.querySelectorAll(".pz-ltile").forEach(b => b.onclick = () => {
      if(b.disabled) return;
      if(b.dataset.c===L[pos]){ slots[pos].textContent=L[pos]; slots[pos].classList.add("on"); b.disabled=true; b.classList.add("used"); pos++; api.sfx("pick");
        if(pos===L.length){ body.querySelector(".pz-lslots").classList.add("joined"); body.querySelector(".pz-lslots").innerHTML=`<b>${o.word}</b>`; setTimeout(()=>api.solve(),900); } }
      else { api.sfx("soft"); pulse(b,"pz-shake",450); api.say("هالحرف يجي بعدين. شنو أول حرف بالكلمة؟"); }
    });
    api.onHint(() => { const b=[...body.querySelectorAll(".pz-ltile")].find(x=>!x.disabled && x.dataset.c===L[pos]); if(b){ b.classList.add("pz-glow"); setTimeout(()=>b.classList.remove("pz-glow"),2000); } });
    api.onSkip(() => { body.querySelector(".pz-lslots").innerHTML=`<b>${o.word}</b>`; });
  };

  /* 12) تفاصيل مخبّاة بمشاهد سابقة */
  P.hidden = (body, o, api) => {
    let found=0;
    body.appendChild(H(`<div class="pz-hidden">${o.panels.map((p,i)=>`<div class="pz-panel" style="background:${p.bg}"><span class="pz-ptitle">${p.title}</span>${p.deco}<button class="pz-hit" data-i="${i}" style="left:${p.x}%;top:${p.y}%" aria-label="${p.label}">${p.item}</button><span class="pz-q">${p.q}</span></div>`).join("")}</div>`));
    body.querySelectorAll(".pz-hit").forEach(b => b.onclick = () => { if(b.classList.contains("found")) return; b.classList.add("found"); b.closest(".pz-panel").classList.add("done"); found++; api.sfx("sparkle"); if(found===o.panels.length) setTimeout(()=>api.solve(),700); });
    body.querySelectorAll(".pz-panel").forEach(p => p.addEventListener("click", e => { if(!e.target.closest(".pz-hit")) api.sfx("soft"); }));
    api.onHint(() => { const b=[...body.querySelectorAll(".pz-hit")].find(x=>!x.classList.contains("found")); if(b){ b.classList.add("pz-glow"); setTimeout(()=>b.classList.remove("pz-glow"),2400); } });
    api.onSkip(() => body.querySelectorAll(".pz-hit").forEach(b=>b.classList.add("found")));
  };

  /* 13) سؤال بالحوار (جواب واحد صحيح، والغلط يعطي رد لطيف) */
  P.quiz = (body, o, api) => {
    body.appendChild(H(`<div class="pz-quiz"><p class="pz-qq">${o.q}</p><div class="pz-opts">${o.opts.map((t,i)=>`<button class="btn ghost" data-i="${i}">${t}</button>`).join("")}</div></div>`));
    body.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { const i=+b.dataset.i; if(i===o.a){ b.classList.add("right"); api.sfx("pick"); setTimeout(()=>api.solve(),500); } else { b.disabled=true; api.sfx("soft"); api.say((o.why&&o.why[i]) || "مو هاي… بس فكرة حلوة!"); } });
    api.onHint(() => api.say(o.hint || "فكّري بشي شفناه بالطريق."));
  };

  /* 14) صفحة نكتبها سوا (حفظ محلي فقط) */
  P.write = (body, o, api) => {
    body.appendChild(H(`<div class="pz-write"><label>العنوان<input class="pz-in" maxlength="40" value="${api.fill(o.defTitle||"").replace(/"/g,"&quot;")}"></label>
      <label>النهاية<textarea class="pz-ta" rows="3" maxlength="240" placeholder="اكتبوا جملة، أو اختاروا وحدة جاهزة"></textarea></label>
      <div class="pz-ready">${o.ready.map((t,i)=>`<button class="pz-chip" data-i="${i}">${t}</button>`).join("")}</div>
      <p class="pz-note">تنحفظ على هذا الجهاز فقط، وما تنرسل لأي مكان.</p>
      <button class="btn honey pz-done">نحفظها</button></div>`));
    const ta=body.querySelector(".pz-ta"), ti=body.querySelector(".pz-in");
    body.querySelectorAll(".pz-chip").forEach(b => b.onclick = () => { ta.value = o.ready[+b.dataset.i]; api.sfx("soft"); });
    body.querySelector(".pz-done").onclick = () => { const text=ta.value.trim() || o.ready[0]; api.solve({title: ti.value.trim() || api.fill(o.defTitle||""), text}); };
    api.onHint(() => api.say("جملة وحدة تكفي. حتى «وعاشوا يضحكون» نهاية حلوة."));
    api.onSkip(() => ({title: ti.value.trim() || api.fill(o.defTitle||""), text: ta.value.trim() || o.ready[0]}));
  };


  /* 16) لقطة عيسى: الصورة تصفى وتغبش، ودوسوا الغالق لما تصير واضحة */
  P.focus = (body, o, api) => {
    const need = o.need || 3; let hits = 0, t = 0, raf = 0, last = performance.now(), alive = true;
    const slow = (window.motionOK && !motionOK()) ? .45 : 1;
    body.appendChild(H(`<div class="pz-focus"><div class="pz-vf"><svg viewBox="0 0 160 100" class="pz-scene">${o.vf || ""}</svg><span class="pz-af"></span><i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i><b class="pz-flash2"></b></div>
      <div class="pz-hits">${"<i></i>".repeat(need)}</div><button class="btn gold pz-now" aria-label="الغالق">${TART.symbol("camera","#2A1E12")}<span>صوّر</span></button></div>`));
    const sceneEl = body.querySelector(".pz-scene"), vf = body.querySelector(".pz-vf"), fl = body.querySelector(".pz-flash2");
    const blur = () => Math.abs(Math.sin(t)) * 7;
    const loop = now => { if (!alive) return; const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt * (1.1 + hits * .25) * slow; const b = blur(); sceneEl.style.filter = `blur(${b.toFixed(2)}px)`; vf.classList.toggle("sharp", b < 1.1); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const press = () => { fl.classList.remove("on"); void fl.offsetWidth; fl.classList.add("on"); api.sfx("shutter");
      if (blur() < 1.4) { hits++; body.querySelectorAll(".pz-hits i")[hits - 1].classList.add("on"); if (hits >= need) { alive = false; cancelAnimationFrame(raf); setTimeout(() => api.solve(), 500); } else api.say(["لقطة حلوة!", "واضحة… وحدة بعد."][hits - 1] || "حلو!"); }
      else api.say(pick2(["طلعت مغبّشة شوية. استنوا لما تصفى.", "قريبة! لما الإطار يصير ذهبي دوسوا.", "عيسى يقول: الصبر نص الصورة."])); };
    body.querySelector(".pz-now").onclick = press;
    const key = e => { if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); press(); } };
    window.addEventListener("keydown", key);
    api.onHint(() => api.say("لما زوايا الإطار تصير ذهبية، الصورة واضحة. بوقتها صوّروا."));
    api.onCleanup(() => { alive = false; cancelAnimationFrame(raf); window.removeEventListener("keydown", key); });
  };
  const pick2 = a => a[Math.floor(Math.random() * a.length)];

  /* 17) شموع الكيكة: المسوا كل شمعة حتى تنطفي */
  P.candles = (body, o, api) => {
    const n = o.n || 5; let out = 0;
    body.appendChild(H(`<div class="pz-candles"><div class="pz-cake">${TART.cameraCake()}</div><div class="pz-cands">${Array.from({ length: n }, (_, i) => `<button class="pz-cand" data-i="${i}" aria-label="شمعة ${i + 1}">${TART.candle(26)}</button>`).join("")}</div></div>`));
    body.querySelectorAll(".pz-cand").forEach(b => b.onclick = () => { if (b.classList.contains("out")) return; b.classList.add("out"); out++; api.sfx("soft"); api.note(out, .3);
      if (out === n) { api.sfx("cheer"); setTimeout(() => api.solve(), 600); } else if (out === 1) api.say(o.say || "تمنّوا أمنية… وكمّلوا."); });
    api.onHint(() => api.say("المسوا كل لهب بإصبع."));
  };

  /* 18) توقيعين على الورقة: عيسى بعدين آمنة */
  P.sign = (body, o, api) => {
    const names = o.names || ["عيسى", "آمنة"]; let i = 0;
    body.appendChild(H(`<div class="pz-sign"><div class="pz-paper"><p class="pz-pt">${o.paper || "ورقة العقد"}</p>${names.map((nm, k) => `<button class="pz-line" data-k="${k}"><svg viewBox="0 0 200 50" class="pz-sig"><path d="M10 34c18-22 26 10 40-8s16-20 26 0 20-10 30 4 14 6 26-6 22 4 34 2 14-8 24-4" fill="none" stroke="#2B3A6B" stroke-width="3" stroke-linecap="round"/></svg><small>توقيع ${nm}</small></button>`).join("")}</div></div>`));
    const lines = [...body.querySelectorAll(".pz-line")];
    lines.forEach((b, k) => b.onclick = () => { if (k !== i) { api.say(`أول ${names[i]}…`); api.sfx("soft"); return; } b.classList.add("signed"); api.sfx("pick"); i++; if (i === names.length) setTimeout(() => api.solve(), 900); });
    api.onHint(() => { const b = lines[i]; if (b) { b.classList.add("pz-glow"); setTimeout(() => b.classList.remove("pz-glow"), 2000); } });
    api.onSkip(() => lines.forEach(b => b.classList.add("signed")));
  };

  /* 19) رتّبوا البيت: المسوا قطعة بعدين مكانها (أو اسحبوها) */
  P.arrange = (body, o, api) => {
    const pieces = o.pieces; let sel = null, placed = 0;
    body.appendChild(H(`<div class="pz-arrange"><div class="pz-room">${pieces.map((p, k) => `<button class="pz-slot2" data-k="${k}" style="left:${p.x}%;top:${p.y}%;width:${p.w}%" aria-label="مكان ${p.label}"><span class="ghost">${TART[p.a]()}</span></button>`).join("")}</div>
      <div class="pz-tray">${sh(pieces.map((p, k) => k)).map(k => `<button class="pz-piece" data-k="${k}" aria-label="${pieces[k].label}">${TART[pieces[k].a]()}<small>${pieces[k].label}</small></button>`).join("")}</div></div>`));
    const room = body.querySelector(".pz-room");
    const put = (k, slot) => { if (+slot.dataset.k !== k) { api.sfx("nope"); api.say("مو هنا… جرّبوا مكان ثاني."); return false; } slot.classList.add("filled"); slot.innerHTML = TART[pieces[k].a](); const pc = body.querySelector(`.pz-piece[data-k="${k}"]`); pc.remove(); placed++; api.sfx("pick"); if (placed === pieces.length) setTimeout(() => api.solve(), 700); return true; };
    body.querySelectorAll(".pz-piece").forEach(pc => {
      pc.onclick = () => { body.querySelectorAll(".pz-piece").forEach(x => x.classList.toggle("sel", x === pc && !pc.classList.contains("sel"))); sel = pc.classList.contains("sel") ? +pc.dataset.k : null; api.sfx("soft"); };
      let drag = null;
      pc.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, moved: false }; try { pc.setPointerCapture(e.pointerId); } catch (_) {} });
      pc.addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 8) drag.moved = true; if (drag.moved) pc.style.transform = `translate(${dx}px,${dy}px)`; });
      pc.addEventListener("pointerup", e => { if (drag && drag.moved) { pc.style.transform = ""; const t = document.elementsFromPoint(e.clientX, e.clientY).find(x => x.classList && x.classList.contains("pz-slot2")); if (t) put(+pc.dataset.k, t); pc.onclickBlock = true; setTimeout(() => pc.onclickBlock = false, 50); } drag = null; });
    });
    room.querySelectorAll(".pz-slot2").forEach(s => s.onclick = () => { if (s.classList.contains("filled")) return; if (sel == null) { api.say("اختاروا قطعة من تحت أول."); return; } if (put(sel, s)) sel = null; });
    api.onHint(() => { const k = pieces.findIndex((p, k) => !room.querySelector(`.pz-slot2[data-k="${k}"]`).classList.contains("filled")); const s = room.querySelector(`.pz-slot2[data-k="${k}"]`); if (s) { s.classList.add("pz-glow"); setTimeout(() => s.classList.remove("pz-glow"), 2000); api.say(`مكان ${pieces[k].label} هو اللي يلمع.`); } });
    api.onSkip(() => room.querySelectorAll(".pz-slot2").forEach((s, k) => { s.classList.add("filled"); s.innerHTML = TART[pieces[k].a](); }));
  };

  return P;
})();