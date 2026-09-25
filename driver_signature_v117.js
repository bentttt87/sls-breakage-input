// SLS Breakage Input v117 — digital driver signature for Pecah Kirim.
(function(){
  'use strict';
  if(window.__SLS_DRIVER_SIG_V117__) return;
  window.__SLS_DRIVER_SIG_V117__=true;

  const previousFetch=window.fetch.bind(window);
  let hasInk=false;
  let drawing=false;
  let last=null;
  let drawVersion=0;
  let uploadedVersion=-1;
  let uploadedPath='';

  const $=id=>document.getElementById(id);
  const session=()=>{try{return JSON.parse(sessionStorage.getItem('sls_breakage_input_session')||'null')}catch(_){return null}};
  const rdcOf=p=>String(p?.rdc_name||((typeof ACCESS!=='undefined'&&ACCESS?.rdc_name)||'')||((typeof SCOPE!=='undefined'&&SCOPE)||'')).trim();

  function ensureStyle(){
    if($('v117SigStyle')) return;
    const s=document.createElement('style');
    s.id='v117SigStyle';
    s.textContent=`
      .v117-sig-card{background:#fff;border:1px solid #dbe5ef;border-radius:14px;padding:12px;margin-bottom:10px}
      .v117-sig-title{font-size:13px;font-weight:850;color:#425b78;margin-bottom:7px}.v117-sig-title:after{content:' *';color:#d92d20}
      .v117-sig-note{font-size:12px;color:#6d7d94;line-height:1.4;margin-bottom:8px}
      .v117-sig-wrap{border:1px solid #9fb7cf;border-radius:10px;background:#fff;overflow:hidden;touch-action:none}
      #v117DriverSig{display:block;width:100%;height:150px;touch-action:none;background:#fff}
      .v117-sig-actions{display:flex;gap:8px;margin-top:8px}.v117-sig-actions button{min-height:42px;border-radius:9px;padding:8px 12px;font-weight:850}
      #v117SigClear{background:#fff;border:1px solid #9fb7cf;color:#0b4f94}
      #v117SigState{margin-left:auto;align-self:center;font-size:12px;color:#667085}
    `;
    document.head.appendChild(s);
  }

  function ensureCard(){
    const delivery=$('v111Delivery');
    if(!delivery||$('v117SigCard')) return;
    ensureStyle();
    delivery.insertAdjacentHTML('beforeend',`
      <div id="v117SigCard" class="v117-sig-card">
        <div class="v117-sig-title">Paraf Driver (Digital)</div>
        <div class="v117-sig-note">Driver paraf langsung dengan jari di kotak ini. Paraf akan tersimpan pada BA dan otomatis ikut tercetak. Untuk tambah item pada BA yang sama, paraf lama dipakai kembali.</div>
        <div class="v117-sig-wrap"><canvas id="v117DriverSig" aria-label="Kotak paraf digital driver"></canvas></div>
        <div class="v117-sig-actions"><button type="button" id="v117SigClear">Hapus / Ulangi Paraf</button><span id="v117SigState">Belum ada paraf</span></div>
      </div>`);
    bindCanvas();
  }

  function canvasCtx(){
    const c=$('v117DriverSig');
    if(!c) return null;
    if(!c.dataset.ready){
      const rect=c.getBoundingClientRect();
      const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
      c.width=Math.max(320,Math.round((rect.width||320)*dpr));
      c.height=Math.round(150*dpr);
      c.dataset.ready='1';
      const x=c.getContext('2d');
      x.setTransform(dpr,0,0,dpr,0,0);
      x.lineCap='round';x.lineJoin='round';x.lineWidth=2.2;x.strokeStyle='#102746';
      x.fillStyle='#fff';x.fillRect(0,0,c.width/dpr,150);
    }
    return c.getContext('2d');
  }

  function point(e,c){
    const r=c.getBoundingClientRect();
    return {x:e.clientX-r.left,y:e.clientY-r.top};
  }
  function start(e){
    const c=$('v117DriverSig'),ctx=canvasCtx();if(!c||!ctx)return;
    e.preventDefault();drawing=true;last=point(e,c);try{c.setPointerCapture(e.pointerId)}catch(_){ }
  }
  function move(e){
    if(!drawing)return;const c=$('v117DriverSig'),ctx=canvasCtx();if(!c||!ctx)return;
    e.preventDefault();const p=point(e,c);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;
    if(!hasInk){hasInk=true;const st=$('v117SigState');if(st){st.textContent='Paraf siap disimpan';st.style.color='#067647';}}
    drawVersion++;uploadedPath='';uploadedVersion=-1;
  }
  function end(e){drawing=false;last=null;try{$('v117DriverSig')?.releasePointerCapture(e.pointerId)}catch(_){ }}
  function clearSignature(){
    const c=$('v117DriverSig');if(!c)return;const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));const ctx=canvasCtx();
    if(ctx){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.restore();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=2.2;ctx.strokeStyle='#102746';}
    hasInk=false;drawVersion++;uploadedPath='';uploadedVersion=-1;const st=$('v117SigState');if(st){st.textContent='Belum ada paraf';st.style.color='#667085';}
  }
  function bindCanvas(){
    const c=$('v117DriverSig');if(!c||c.dataset.bound)return;c.dataset.bound='1';canvasCtx();
    c.addEventListener('pointerdown',start,{passive:false});c.addEventListener('pointermove',move,{passive:false});c.addEventListener('pointerup',end);c.addEventListener('pointercancel',end);c.addEventListener('pointerleave',e=>{if(drawing)end(e)});
    $('v117SigClear').onclick=clearSignature;
  }

  function blobFromCanvas(){return new Promise((resolve,reject)=>{const c=$('v117DriverSig');if(!c)return reject(new Error('Kotak paraf tidak tersedia'));c.toBlob(b=>b?resolve(b):reject(new Error('Paraf gagal diproses')),'image/png');});}
  async function uploadSignature(payload){
    if(uploadedPath&&uploadedVersion===drawVersion)return uploadedPath;
    if(!hasInk)throw new Error('Paraf digital driver wajib untuk Pecah Kirim.');
    const s=session();if(!s?.access_token)throw new Error('Sesi login tidak ditemukan. Silakan login ulang.');
    const rdc=rdcOf(payload);if(!rdc)throw new Error('RDC tidak ditemukan untuk menyimpan paraf driver.');
    const date=String(payload?.occurrence_date||new Date().toISOString().slice(0,10));
    const ym=date.slice(0,7).replace('-','');
    const id=(crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`);
    const path=`${rdc}/driver-signatures/${ym}/${id}.png`;
    const blob=await blobFromCanvas();
    const base=(typeof SUPABASE_URL!=='undefined'?SUPABASE_URL:'');
    const anon=(typeof PUBLIC_ANON!=='undefined'?PUBLIC_ANON:'');
    const encoded=path.split('/').map(encodeURIComponent).join('/');
    const res=await previousFetch(`${base}/storage/v1/object/breakage-evidence/${encoded}`,{method:'POST',headers:{apikey:anon,Authorization:`Bearer ${s.access_token}`,'Content-Type':'image/png','x-upsert':'false'},body:blob});
    if(!res.ok)throw new Error('Gagal menyimpan paraf digital driver: '+(await res.text().catch(()=>'')));
    uploadedPath=path;uploadedVersion=drawVersion;
    const st=$('v117SigState');if(st){st.textContent='Paraf tersimpan';st.style.color='#067647';}
    return path;
  }

  window.fetch=async function(input,init={}){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(!String(url).includes('/rest/v1/rpc/breakage_incident_create_v94'))return previousFetch(input,init);
    let body;try{body=JSON.parse(typeof init.body==='string'?init.body:'{}')}catch(_){return previousFetch(input,init)}
    const payload=body?.p_payload;
    if(!payload||String(payload.incident_type||'').toLowerCase()!=='delivery')return previousFetch(input,init);
    if(!payload.reuse_no_ba){payload.driver_signature_path=await uploadSignature(payload);}
    const nextInit={...init,body:JSON.stringify({...body,p_payload:payload})};
    const res=await previousFetch(input,nextInit);
    if(res.ok)setTimeout(clearSignature,350);
    return res;
  };

  [80,250,700,1500].forEach(ms=>setTimeout(ensureCard,ms));
  document.addEventListener('click',e=>{if(['newBtn','navInput'].includes(e.target?.id)){setTimeout(()=>{ensureCard();clearSignature();},80)}},true);
})();
