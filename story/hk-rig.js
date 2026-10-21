/* =====================================================================
   حكايتنا — تحريك الشخصيات بأجزاء (rig) — مبني على rig مشروع إيلاف.
   عيسى وآمنة: ما نرسم أي وجه جديد. كل جزء طبقة مقصوصة من الصورة المرجعية
   المعتمدة (assets/characters/<who>-<part>.webp) وتتحرك حول مفصلها.
   عدول: نفس rig إيلاف الأصلي (أجزاء من ملفه الرسمي بـ clip-path).
   نقاط الدوران تجي من rig-data.js (يتولّد من tools/build_rig.py).
   ===================================================================== */
const TRig = (() => {
  const ADOOL = "assets/characters/adool.webp";
  const poly = pts => `polygon(${pts.map(([x,y])=>`${x}% ${y}%`).join(",")})`;
  const layered = who => ({ layered:true, ar:RIG_DATA[who].ar, parts:RIG_DATA[who].parts, src:k=>`assets/characters/${who}-${k}.webp` });

  const RIGS = {
    isa: layered("isa"),
    amna: layered("amna"),
    pair: layered("pair"),
    adool: {
      src: () => ADOOL, ar: 1024/1536,
      parts: {
        legL: {z:1, o:[41,77.5], c:[[22,77.5],[51.37,77.5],[51.66,78],[51.76,79],[51.76,91],[51.95,92],[52.15,93],[52.15,100],[20,100]]},
        legR: {z:1, o:[61,77.5], c:[[51.37,77.5],[80,77.5],[80,100],[52.15,100],[52.15,93],[51.95,92],[51.76,91],[51.76,79],[51.66,78]]},
        core: {z:3, o:[50,50], c:[[36,29],[66.5,29],[72,29],[78,36],[80,42],[79,47.5],[72,48],[66.8,47.6],[70.4,48.5],[70.9,59],[71,66],[72,69.5],[75.5,69.5],[76,78.2],[25,78.2],[28,47.5],[30,47],[33,46.2],[31.6,44],[31.8,36],[33,34],[36,30],[37,21],[14,21]]},
        armL: {z:4, o:[68,33], mirror:{dx:-33, dy:2.5, sx:.8}, c:[[66.5,30.5],[72,29.5],[80,39],[81.5,47],[80.5,58],[84,63],[83.5,70],[72,69.5],[71,66],[70.9,59],[70.4,48.5],[66.8,47.6],[64.6,44],[64.3,40],[66,36],[67.5,33]]},
        armR: {z:4, o:[68,33], c:[[66.5,30.5],[72,29.5],[80,39],[81.5,47],[80.5,58],[84,63],[83.5,70],[72,69.5],[71,66],[70.9,59],[70.4,48.5],[66.8,47.6],[64.6,44],[64.3,40],[66,36],[67.5,33]]},
        wave: {z:4, o:[33,45], hidden:true, c:[[8,21],[34,21],[35,27],[36,30],[33,34],[31.8,36],[31.6,44],[33,46.2],[30,48],[8,48]]},
        head: {z:5, o:[50,29], c:[[14,0],[86,0],[86,29.5],[72,29.5],[64,31.5],[38,31.5],[36,30],[35,27],[34,21],[14,21]]}
      }
    }
  };

  const has = who => !!RIGS[who];
  function html(who){
    const R = RIGS[who];
    const parts = Object.entries(R.parts).sort((a,b)=>a[1].z-b[1].z).map(([k,p]) => R.layered
      ? `<img class="rp rp-${k}" data-p="${k}" src="${R.src(k)}" alt="" draggable="false" decoding="async" style="transform-origin:${p.o[0]}% ${p.o[1]}%${p.blink ? ";transform:scaleY(0);opacity:0" : ""}">`
      : `<img class="rp rp-${k}" data-p="${k}" src="${R.src()}" alt="" draggable="false" decoding="async" style="clip-path:${poly(p.c)};-webkit-clip-path:${poly(p.c)};transform-origin:${p.o[0]}% ${p.o[1]}%;${p.hidden?"opacity:0;":""}${p.mirror?`transform:translate(${p.mirror.dx}%,${p.mirror.dy}%) scale(${-p.mirror.sx},1);`:""}">`).join("");
    return `<div class="rig rig-${who}" style="aspect-ratio:${R.ar}">${parts}</div>`;
  }
  // صورة ثابتة كاملة (للبطاقات والقوائم)
  const still = who => who==="adool" ? ADOOL : `assets/characters/${who}.webp`;

  /* ---------- الحالة لكل شخصية ---------- */
  function attach(c, el){
    const R = RIGS[c.who]; if(!R) return;
    const rig = el.querySelector(".rig"); if(!rig) return;
    const P = {}; rig.querySelectorAll(".rp").forEach(img => P[img.dataset.p] = img);
    c.rig = { R, rig, P, ph:0, g:0, land:0, wave:0, greet:0, nod:0, shy:0, joy:0, look:0, t:Math.random()*10,
      sk:0, skv:0, dr:0, drv:0, ar:0, arv:0, hd:0, hdv:0, hd2:0, hd2v:0, px:c.x, py:c.y, vx:0, vy:0, blink:2+Math.random()*3, bt:0 };
  }
  const spring = (s, key, vkey, target, k, d, dt) => { const a = (target - s[key])*k - s[vkey]*d; s[vkey] += a*dt; s[key] += s[vkey]*dt; };
  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
  function tr(img, o){
    if(!img) return;
    let t = "";
    if(o.tx || o.ty) t += `translate(${(o.tx||0).toFixed(2)}%,${(o.ty||0).toFixed(2)}%) `;
    if(o.sx!=null || o.sy!=null) t += `scale(${(o.sx??1).toFixed(3)},${(o.sy??1).toFixed(3)}) `;
    if(o.r) t += `rotate(${o.r.toFixed(2)}deg) `;
    if(o.k) t += `skewX(${o.k.toFixed(2)}deg)`;
    img.style.transform = t || "none";
  }
  const bell = (left, dur) => left>0 ? Math.sin((1-left/dur)*Math.PI) : 0;   // 0 → 1 → 0

  // يتنادى كل فريم. c: {who,x,y,face,anim}
  function update(c, dt, calm){
    const s = c.rig; if(!s || !dt) return;
    s.t += dt;
    const amp = calm ? .35 : 1;
    const ivx = (c.x - s.px)/dt; s.px=c.x; s.py=c.y;
    s.vx += (clamp(ivx,-60,60) - s.vx)*Math.min(1, dt*12);
    const sit = c.anim==="sit";
    const spd = Math.abs(s.vx), moving = !sit && spd > 1.5;
    s.g += ((moving ? clamp(spd/19, .35, 1.25) : 0) - s.g) * Math.min(1, dt*8);
    if(moving) s.ph += dt * (2.2 + spd*.2); else s.ph += dt * s.g * 3;
    const ph = s.ph, g = s.g*amp, sw = Math.sin(ph), bob = Math.abs(Math.sin(ph));
    const breathe = Math.sin(s.t*1.7);
    const lv = s.vx * (c.face||1);
    ["land","wave","greet","nod","shy","joy"].forEach(k => s[k] = Math.max(0, s[k]-dt));
    const P = s.P, who = c.who;
    const joyK = bell(s.joy, 1.2), nodK = bell(s.nod, .8), shyK = bell(s.shy, 2.2), greetK = bell(s.greet, .9);

    // الجسم كامل: خطوة، ميلان، تنفّس، فرحة
    // آمنة بفستان طويل: خطوة ناعمة بدون ميلان الجسم كله (الميلان چان يخلّيها تترجرج)
    const gown = who==="amna" || who==="pair";
    const lean = gown ? clamp(lv*.02, -.6, .6)*amp : clamp(lv*.08, -3, 3.5)*amp;
    const bodyY = -bob*(gown ? .55 : 1.2)*g + breathe*.18*amp - joyK*(gown ? 3 : 5)*amp + (sit?3.5:0);
    s.rig.style.transform = `translateY(${bodyY.toFixed(2)}%) rotate(${lean.toFixed(2)}deg)`;

    if(who==="adool"){ adoolParts(s, P, sw, g, breathe, amp, lv, dt); return; }

    // رجلين (عيسى والثنائي)
    if(P.legL){ const A = sit ? 0 : 5.5; tr(P.legL, {r: sit ? -2 : sw*A*g}); tr(P.legR, {r: sit ? 2 : -sw*A*g}); }
    // تنورة آمنة: تتأخر عن الحركة وترفرف شوية
    if(who==="amna"){ amnaParts(s, P, ph, g, breathe, amp, lv, dt, nodK, shyK); return; }
    // التنورة (الثنائي): تتمايل من الخصر بدرجة صغيرة وتتأخر عن الحركة شوية
    if(P.skirt){ spring(s, "sk", "skv", clamp(-lv*.03,-.9,.9)*amp + Math.sin(ph)*.55*g + Math.sin(s.t*1.1)*.12*amp, 26, 7, dt); tr(P.skirt, {r:s.sk}); }
    // ذيل الحجاب
    if(P.drape){ spring(s, "dr", "drv", clamp(-lv*.03,-1,1)*amp + Math.sin(s.t*1.1+.4)*.35*amp + Math.sin(ph+.8)*.45*g, 22, 6, dt); tr(P.drape, {r:s.dr}); }
    // الراس: نظرة، هزّة، خجل
    const look = s.look*amp;   // +: يميل للثاني
    const headT = clamp(lv*.04,-1.2,1.5)*amp + breathe*.35*amp - nodK*3.2 + look;
    if(who==="isa"){ spring(s, "hd", "hdv", headT, 40, 8, dt); tr(P.head, {r:s.hd}); }
    if(who==="pair"){
      spring(s, "hd", "hdv", headT + joyK*1.5, 40, 8, dt); tr(P.ihead, {r:s.hd});
      spring(s, "hd2", "hd2v", -headT*.8 - look*1.6 + shyK*-3 + Math.sin(s.t*1.5+1)*.3*amp, 40, 8, dt); tr(P.ahead, {r:s.hd2});
    }
  }
  /* آمنة وحدها (صورتها المنفردة المعتمدة): الإيدين والجسم طبقة وحدة ما تنقص أبداً.
     الحركة: رمش، تنفّس خفيف، ميلان راس صغير، وقماش (ذيل الحجاب والتنورة) يتمايل. بدون أي مطّ للصورة. */
  function amnaParts(s, P, ph, g, breathe, amp, lv, dt, nodK, shyK){
    const greetK = s.wave>0 ? Math.sin(Math.min(1, s.wave)*Math.PI) : 0;   // «تلويح» آمنة = سلام بالراس
    const headT = clamp(lv*.03,-1,1.2)*amp + Math.sin(s.t*.9)*.45*amp + breathe*.2*amp - nodK*2.4 + s.look*amp*.9 + shyK*2.2 - greetK*1.6;
    spring(s, "hd", "hdv", clamp(headT, -2.6, 2.6), 36, 8, dt); tr(P.head, {r:s.hd});
    // ذيل الحجاب: يتأخر عن الحركة ويرفرف شوية
    spring(s, "dr", "drv", clamp(-lv*.04,-1.4,1.4)*amp + Math.sin(s.t*1.1+.4)*.55*amp + Math.sin(ph+.8)*.7*g, 20, 5, dt); tr(P.drape, {r:s.dr});
    // التنورة: تنميل من خط الورك (skew صغير) — الحافة العليا ثابتة فما يبين فاصل
    spring(s, "sk", "skv", clamp(-lv*.035,-.9,.9)*amp + Math.sin(ph)*.75*g + Math.sin(s.t*1.05)*.22*amp, 24, 6, dt); tr(P.skirt, {k:s.sk});
    // رمشة كل كم ثانية (أحياناً رمشتين ورا بعض)، والجفن يمشي ويا ميلان الراس
    s.blink -= dt; if(s.blink <= 0){ s.bt = .17; s.blink = Math.random() < .18 ? .32 : 2.6 + Math.random()*3.4; }
    s.bt = Math.max(0, s.bt - dt);
    const c = s.bt > 0 ? Math.sin((1 - s.bt/.17)*Math.PI) : 0, ho = s.R.parts.head.o;
    ["blinkL","blinkR"].forEach(k => { const img = P[k]; if(!img) return; const o = s.R.parts[k].o, dx = ho[0]-o[0], dy = ho[1]-o[1];
      img.style.opacity = c > .04 ? 1 : 0;
      img.style.transform = `translate(${dx}%,${dy}%) rotate(${s.hd.toFixed(2)}deg) translate(${-dx}%,${-dy}%) scaleY(${c.toFixed(3)})`; });
  }
  function adoolParts(s, P, sw, g, breathe, amp, lv, dt){
    const swing = sw*15*g;
    const aR = -swing + breathe*1.2*amp + (s.greet>0 ? -Math.sin((1-s.greet/.9)*Math.PI)*22 : 0);
    const aL = -swing + breathe*1.2*amp;
    const m = s.R.parts.armL.mirror, waving = s.wave>0;
    if(P.armL){ P.armL.style.opacity = waving ? 0 : 1; P.armL.style.transform = `translate(${m.dx}%,${m.dy}%) scale(${-m.sx},1) rotate(${(-aL).toFixed(2)}deg)`; }
    tr(P.armR, {r:aR});
    if(P.wave){ P.wave.style.opacity = waving ? 1 : 0; tr(P.wave, {r: waving ? Math.sin(s.wave*14)*9 : 0}); }
    tr(P.legL, {r:sw*10*g}); tr(P.legR, {r:-sw*10*g});
    // وقت يحچي: هزّة راس صغيرة ويا كل كلمتين (nod)
    spring(s, "hd", "hdv", clamp(lv*.05,-1.5,2)*amp + breathe*.5*amp + (s.greet>0 ? Math.sin((1-s.greet/.9)*Math.PI)*-4 : 0) - bell(s.nod, .8)*5, 40, 8, dt);
    tr(P.head, {r:s.hd});
  }
  const wave  = (c, t=1.4) => { if(c.rig) c.rig.wave = t; };
  const greet = c => { if(c.rig && c.rig.greet<=0) c.rig.greet = .9; };
  const nod   = c => { if(c.rig) c.rig.nod = .8; };
  const shy   = c => { if(c.rig) c.rig.shy = 2.2; };
  const joy   = c => { if(c.rig) c.rig.joy = 1.2; };
  const look  = (c, v) => { if(c.rig) c.rig.look = v; };   // ميلان الراس صوب الثاني (درجات)

  return { has, html, still, attach, update, wave, greet, nod, shy, joy, look };
})();
