/* =====================================================================
   حكايتنا — الصوت (محرّك صوت مشروع إيلاف)
   • موسيقى أصلية تتولّد بالمتصفح (Web Audio) لكل حكاية بثلاث حالات:
     intro (مقدمة) / explore (استكشاف) / emotion (لحظة عاطفية/انتصار).
   • ملفات أغاني يضيفها صاحب الموقع من «الإعدادات» تنحفظ
     على الجهاز (IndexedDB) وتغلب الموسيقى المولّدة للمكان المحدد.
   • أو ضع ملفاً داخل المشروع واربطه في HIKAYAT.audio (hk-chapters.js).
   • ما يشتغل أي صوت قبل ما أحد يضغط على شي.
   ===================================================================== */
const TAudio = (() => {
  let ctx=null, master, musicBus, sfxBus, timer=null, step=0, nextT=0, theme=null, mood="explore";
  let el=null, elKey="", opts={music:true, sfx:true, vol:.6}, unlocked=false, noiseBuf=null;
  const urls = {};

  /* ---------- IndexedDB للأغاني المضافة ---------- */
  const DB = (() => {
    let p=null;
    const open = () => p || (p = new Promise((res, rej) => {
      try{ const r = indexedDB.open("hk-audio", 1); r.onupgradeneeded = () => r.result.createObjectStore("songs", {keyPath:"id"}); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }catch(e){ rej(e); }
    }));
    const tx = (mode, fn) => open().then(db => new Promise((res, rej) => { const t = db.transaction("songs", mode); const st = t.objectStore("songs"); const out = fn(st); t.oncomplete = () => res(out && out.result!==undefined ? out.result : out); t.onerror = () => rej(t.error); }));
    return {
      all: () => tx("readonly", st => st.getAll()).catch(() => []),
      put: rec => tx("readwrite", st => st.put(rec)),
      del: id => tx("readwrite", st => st.delete(id))
    };
  })();
  let songs = [];
  const refreshSongs = () => DB.all().then(a => { songs = a || []; return songs; });
  refreshSongs();

  /* ---------- أساسيات ---------- */
  function ensure(){
    if(!unlocked) return null;
    if(!ctx){
      try{
        ctx = new (window.AudioContext||window.webkitAudioContext)();
        master = ctx.createGain(); master.connect(ctx.destination);
        musicBus = ctx.createGain(); sfxBus = ctx.createGain();
        const lp = ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=3200;
        musicBus.connect(lp); lp.connect(master); sfxBus.connect(master);
      }catch(e){ ctx=null; return null; }
    }
    if(ctx.state==="suspended") ctx.resume();
    apply();
    return ctx;
  }
  function apply(){
    if(ctx){ master.gain.value = opts.vol; musicBus.gain.value = opts.music ? .42 : 0; sfxBus.gain.value = opts.sfx ? .9 : 0; }
    if(el){ el.volume = Math.min(1, opts.vol); el.muted = !opts.music; }
  }
  const mtof = m => 440*Math.pow(2,(m-69)/12);
  function tone(f, t, dur, {type="triangle", vol=.14, bus, attack=.02, bend=0}={}){
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type; o.frequency.setValueAtTime(f,t); if(bend) o.frequency.exponentialRampToValueAtTime(f*bend, t+dur);
    g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+attack); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g); g.connect(bus||sfxBus); o.start(t); o.stop(t+dur+.05);
  }
  function noise(t, dur, {vol=.08, freq=900, q=.7, type="bandpass", sweep=0}={}){
    if(!noiseBuf){ const n=ctx.sampleRate*1.5; noiseBuf=ctx.createBuffer(1,n,ctx.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1; }
    const s=ctx.createBufferSource(); s.buffer=noiseBuf; const f=ctx.createBiquadFilter(); f.type=type; f.frequency.setValueAtTime(freq,t); if(sweep) f.frequency.exponentialRampToValueAtTime(freq*sweep,t+dur); f.Q.value=q;
    const g=ctx.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+dur*.3); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t); s.stop(t+dur+.05);
  }

  /* ---------- موسيقى مولّدة ---------- */
  // theme: {root, scale:[...], tempo, motif:[درجات أو null], chords:[درجات]}
  const deg = (d, oct=0) => { const sc=theme.scale, n=sc.length; const o=Math.floor(d/n); const i=((d%n)+n)%n; return theme.root + sc[i] + 12*(o+oct); };
  function schedule(){
    if(!ctx || !theme) return;
    const spb = 60/theme.tempo/2; // ثُمن
    while(nextT < ctx.currentTime + .35){
      const t = nextT, s = step % 32, bar = Math.floor(step/8) % theme.chords.length, ch = theme.chords[bar];
      const m = theme.motif[s % theme.motif.length];
      if(mood==="intro"){
        if(s%2===0) tone(mtof(deg(ch + [0,2,4,7][(s/2)%4], 1)), t, spb*3, {type:"sine", vol:.07, bus:musicBus});
        if(s%8===0) tone(mtof(deg(ch,-1)), t, spb*8, {type:"triangle", vol:.06, bus:musicBus, attack:.3});
        if(m!=null && s>=16) tone(mtof(deg(m,1)), t, spb*1.8, {type:"triangle", vol:.08, bus:musicBus});
      } else if(mood==="emotion"){
        if(s%8===0){ [0,2,4].forEach(k=>tone(mtof(deg(ch+k,0)), t, spb*8.5, {type:"sine", vol:.045, bus:musicBus, attack:.6})); tone(mtof(deg(ch,-1)), t, spb*8, {type:"triangle", vol:.06, bus:musicBus, attack:.4}); }
        if(m!=null && s%2===0) tone(mtof(deg(m,1)), t, spb*3.4, {type:"sine", vol:.09, bus:musicBus, attack:.05});
      } else {
        if(s%4===0) tone(mtof(deg(ch,-1)), t, spb*3, {type:"triangle", vol:.07, bus:musicBus});
        if(s%4===2) tone(mtof(deg(ch+4,-1)), t, spb*2, {type:"triangle", vol:.05, bus:musicBus});
        tone(mtof(deg(ch + [0,2,4,2][s%4], 0)), t, spb*.9, {type:"sine", vol:.035, bus:musicBus});
        if(m!=null) tone(mtof(deg(m,1)), t, spb*1.6, {type:"triangle", vol:.075, bus:musicBus});
        if(s%8===4) noise(t, .08, {vol:.02, freq:6000, type:"highpass"});
      }
      nextT += mood==="emotion" ? spb*1.25 : mood==="intro" ? spb*1.1 : spb; step++;
    }
  }
  function stopGen(){ clearInterval(timer); timer=null; }
  function startGen(){ if(!ensure()) return; stopGen(); step=0; nextT=ctx.currentTime+.08; timer=setInterval(schedule, 90); schedule(); }

  /* ---------- اختيار المصدر ---------- */
  function findSong(storyId, chapId, md){
    let best=null, score=-1;
    songs.forEach(r => {
      if(!((r.story==="all"||r.story===storyId) && (r.chapter==="all"||r.chapter===chapId) && (r.mood==="all"||r.mood===md))) return;
      const sc = (r.chapter!=="all"?4:0) + (r.story!=="all"?2:0) + (r.mood!=="all"?1:0);
      if(sc>score){ score=sc; best=r; }
    });
    return best;
  }
  function stopEl(){ if(el){ try{ el.pause(); }catch(e){} el=null; elKey=""; } }
  function play(storyId, chapId, md, th){
    mood = md; theme = th || theme;
    if(!unlocked) return;
    const rec = findSong(storyId, chapId, md);
    const fileUrl = rec ? (urls[rec.id] || (urls[rec.id] = URL.createObjectURL(rec.blob))) : (typeof HIKAYAT!=="undefined" && HIKAYAT.audio && HIKAYAT.audio[storyId] && HIKAYAT.audio[storyId][md]) || "";
    if(fileUrl){
      stopGen();
      if(elKey===fileUrl && el) { apply(); return; }
      stopEl(); el = new Audio(fileUrl); el.loop = true; elKey = fileUrl; apply();
      el.play().catch(()=>{});
      return;
    }
    stopEl();
    if(!timer) startGen(); else ensure();
  }
  function stop(){ stopGen(); stopEl(); }

  /* ---------- مؤثرات ---------- */
  const fx = {
    step(){ noise(ctx.currentTime, .05, {vol:.025, freq:500, q:2}); },
    jump(){ tone(380, ctx.currentTime, .16, {type:"sine", vol:.08, bend:1.8}); },
    land(){ noise(ctx.currentTime, .08, {vol:.04, freq:300, q:1}); },
    pick(){ const t=ctx.currentTime; tone(988,t,.18,{type:"sine",vol:.08}); tone(1319,t+.08,.3,{type:"sine",vol:.07}); },
    ok(){ const t=ctx.currentTime; [784,988,1175,1568].forEach((f,i)=>tone(f,t+i*.09,.35,{type:"sine",vol:.07})); },
    soft(){ tone(520, ctx.currentTime, .12, {type:"sine", vol:.05, bend:1.3}); },
    nope(){ tone(330, ctx.currentTime, .2, {type:"triangle", vol:.05, bend:.8}); },
    knock(){ const t=ctx.currentTime; [0,.28,.56].forEach(d=>{ tone(150,t+d,.12,{type:"triangle",vol:.18,bend:.6}); noise(t+d,.06,{vol:.08,freq:700,q:3}); }); },
    door(){ tone(110, ctx.currentTime, .9, {type:"sawtooth", vol:.03, bend:1.6}); noise(ctx.currentTime,.6,{vol:.03,freq:400,sweep:3}); },
    page(){ noise(ctx.currentTime, .32, {vol:.06, freq:2500, q:.6, sweep:.4}); },
    wind(){ noise(ctx.currentTime, 1.8, {vol:.09, freq:500, q:.5, sweep:2.4}); },
    bell(){ const t=ctx.currentTime; [1,2.4,3.9,5.4].forEach((m,i)=>tone(660*m,t,2.4-i*.4,{type:"sine",vol:.07/(i+1)})); },
    whistle(){ const t=ctx.currentTime; tone(880,t,.6,{type:"sine",vol:.06}); tone(1108,t,.6,{type:"sine",vol:.05}); tone(880,t+.7,.9,{type:"sine",vol:.06}); },
    splash(){ noise(ctx.currentTime, .4, {vol:.07, freq:1200, q:.5, sweep:.3}); },
    sparkle(){ const t=ctx.currentTime; for(let i=0;i<5;i++) tone(1500+Math.random()*1200, t+i*.05, .2, {type:"sine", vol:.03}); },
    bump(){ tone(200, ctx.currentTime, .2, {type:"triangle", vol:.08, bend:.6}); },
    thunder(){ noise(ctx.currentTime, 1.6, {vol:.06, freq:120, q:.4, type:"lowpass"}); },
    bird(){ const t=ctx.currentTime, b=2200+Math.random()*800; tone(b,t,.08,{type:"sine",vol:.04,bend:1.3}); tone(b*1.1,t+.12,.08,{type:"sine",vol:.035,bend:.9}); },
    shutter(){ const t=ctx.currentTime; noise(t,.05,{vol:.12,freq:3000,q:1.2}); noise(t+.07,.06,{vol:.09,freq:1800,q:1.4}); },
    keys(){ const t=ctx.currentTime; for(let i=0;i<6;i++) tone(2400+Math.random()*1600, t+i*.06+Math.random()*.03, .14, {type:"sine", vol:.03}); },
    envelope(){ noise(ctx.currentTime, .5, {vol:.05, freq:1800, q:.5, sweep:.5}); tone(700, ctx.currentTime+.35, .3, {type:"sine", vol:.04, bend:1.4}); },
    firework(){ const t=ctx.currentTime; tone(300,t,.5,{type:"sine",vol:.04,bend:3}); noise(t+.5,.9,{vol:.11,freq:900,q:.4,sweep:.25}); for(let i=0;i<8;i++) tone(2000+Math.random()*2000,t+.6+i*.05,.15,{type:"sine",vol:.02}); },
    cheer(){ const t=ctx.currentTime; noise(t,1.6,{vol:.07,freq:1100,q:.3,sweep:1.2}); [523,659,784].forEach((f,i)=>tone(f,t+.2+i*.12,.5,{type:"triangle",vol:.04})); },
    heart(){ const t=ctx.currentTime; tone(70,t,.16,{type:"sine",vol:.2,bend:.7}); tone(64,t+.22,.2,{type:"sine",vol:.16,bend:.7}); },
    laugh(i=0){ const t=ctx.currentTime; for(let k=0;k<3;k++) tone(500+i*90+k*30, t+k*.12, .1, {type:"square", vol:.03, bend:.8}); }
  };
  function sfx(name, ...a){ if(!ensure() || !opts.sfx) return; try{ fx[name] && fx[name](...a); }catch(e){} }
  // نغمة رقم n من سلّم الحكاية (للألغاز)
  function note(n, dur=.5, type="sine"){ if(!ensure()) return; const th=theme||{root:62,scale:[0,2,4,7,9]}; const sc=th.scale, k=sc.length; tone(mtof(th.root+12+sc[((n%k)+k)%k]+12*Math.floor(n/k)), ctx.currentTime, dur, {type, vol:.12}); }

  return {
    unlock(){ unlocked = true; ensure(); },
    get unlocked(){ return unlocked; },
    setOpts(o){ Object.assign(opts, o); apply(); if(!opts.music) stopGen(); },
    play, stop, sfx, note,
    songs: () => songs.slice(),
    addSong: rec => DB.put(rec).then(refreshSongs),
    delSong: id => { if(urls[id]){ URL.revokeObjectURL(urls[id]); delete urls[id]; } return DB.del(id).then(refreshSongs); },
    previewUrl: rec => urls[rec.id] || (urls[rec.id] = URL.createObjectURL(rec.blob))
  };
})();
