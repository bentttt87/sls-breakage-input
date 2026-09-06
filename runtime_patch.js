// SLS Breakage Input runtime hardening v49
// Auth/session hardening + multi-photo evidence + client-side compression.
(function(){
  const PATCH_VERSION='v49-photo-per-box-compression-20260906';
  const BUILD_LABEL='BUILD v49';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  let PREVIEW_URLS=[];

  function ensureBuildBadge(){
    let el=document.getElementById('slsBuildBadge');
    if(el){el.textContent=BUILD_LABEL;return}
    const bar=document.querySelector('.topbar');if(!bar)return;
    el=document.createElement('span');el.id='slsBuildBadge';el.textContent=BUILD_LABEL;
    el.style.cssText='font-size:9px;font-weight:800;letter-spacing:.4px;padding:4px 7px;border:1px solid rgba(255,255,255,.28);border-radius:999px;opacity:.82;white-space:nowrap';
    const grow=bar.querySelector('.grow');bar.insertBefore(el,grow||null);
  }
  ensureBuildBadge();

  function saveSession(){if(SESSION)sessionStorage.setItem('sls_breakage_input_session',JSON.stringify(SESSION))}
  function jwtExp(token){try{let s=String(token||'').split('.')[1].replace(/-/g,'+').replace(/_/g,'/');s+='='.repeat((4-s.length%4)%4);return Number(JSON.parse(atob(s)).exp||0)}catch(_e){return 0}}
  function expiresSoon(){const exp=Number(SESSION?.expires_at||jwtExp(SESSION?.access_token));return !exp||exp-Math.floor(Date.now()/1000)<120}
  async function refreshSession(force=false){
    if(!SESSION?.refresh_token)return false;
    if(!force&&!expiresSoon())return true;
    const r=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(20000),headers:{apikey:PUBLIC_ANON,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:SESSION.refresh_token})});
    if(!r.ok){const t=await r.text().catch(()=>String(r.status));if(force)throw new Error('Sesi login perlu diperbarui: '+cleanErr(t));return false}
    const n=await r.json();SESSION={...SESSION,...n};if(!SESSION.expires_at&&n.expires_in)SESSION.expires_at=Math.floor(Date.now()/1000)+Number(n.expires_in);saveSession();return true;
  }
  window.slsRefreshBreakageSession=refreshSession;

  async function authedFetch(url,opts={},networkRetries=2){
    await refreshSession(false).catch(()=>false);
    let lastErr,refreshed=false;
    for(let attempt=0;attempt<=networkRetries;attempt++){
      try{
        const headers={...(opts.headers||{}),apikey:PUBLIC_ANON,Authorization:`Bearer ${auth()}`};
        const r=await fetch(url,{...opts,cache:'no-store',signal:opts.signal||AbortSignal.timeout(25000),headers});
        if((r.status===401||r.status===403)&&SESSION?.refresh_token&&!refreshed){
          const body=await r.clone().text().catch(()=> '');
          if(r.status===401||/jwt|token|unauthori|accessdenied|row-level security/i.test(body)){refreshed=true;if(await refreshSession(true).catch(()=>false))continue}
        }
        return r;
      }catch(e){lastErr=e;if(attempt===networkRetries)throw e;await sleep(500*(attempt+1))}
    }
    throw lastErr||new Error('Koneksi gagal');
  }

  rpc=async function(fn,params={}){const r=await authedFetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(params)},2);if(!r.ok)throw new Error(await r.text());return r.json()};

  loadHistory=async function(){
    ensureBuildBadge();const s=effectiveScope();if(ACCESS?.is_master)$('rdcCard').textContent=s||'Pilih RDC';$('historyBody').innerHTML='<tr><td colspan="9"><div class="empty">Memuat riwayat…</div></td></tr>';
    try{if(ACCESS?.is_master&&!s){INCIDENTS=[];renderHistory();return}INCIDENTS=await rpc('breakage_incident_list',{p_period:PERIOD,p_rdc:s})||[];renderHistory()}
    catch(e){const msg=cleanErr(e?.message||String(e)),sessionProblem=/jwt|token|session|unauthor/i.test(msg);$('historyBody').innerHTML=`<tr><td colspan="9"><div class="empty">${sessionProblem?'Sesi login perlu diperbarui.':'Data belum berhasil dimuat.'}<br><span class="smallnote">${esc(msg)}</span><br><button class="secondary" style="margin-top:10px" onclick="loadHistory()">↻ Coba Lagi</button></div></td></tr>`}
  };

  function requiredPhotoCount(){const q=Number($('fQty')?.value||0);return q>0?Math.max(1,Math.ceil(q)):1}
  function totalEvidenceCount(){return (EXISTING_PHOTO_PATHS?.length||0)+(PHOTOS?.length||0)}
  function updateEvidenceRequirement(){
    const area=document.querySelector('.photo-area');if(!area)return;
    const title=area.querySelector('b');if(title)title.textContent='Evidence Foto — 1 foto per BOX pecah *';
    const note=area.querySelector('.smallnote');if(note){const req=requiredPhotoCount(),got=totalEvidenceCount();note.innerHTML=`Qty <b>${Number($('fQty')?.value||0)||'—'} BOX</b> = minimal <b>${req} foto</b>. Saat ini <b>${got}</b> foto. Foto dikompres otomatis sebelum upload untuk menghemat storage.`}
  }
  function injectEvidenceStyle(){if(document.getElementById('evidenceV49Style'))return;const s=document.createElement('style');s.id='evidenceV49Style';s.textContent='.photo-preview{grid-template-columns:repeat(auto-fill,minmax(110px,1fr))!important}.ph{aspect-ratio:4/3!important}.ph .ph-remove{position:absolute;right:4px;top:4px;z-index:2;border:0;border-radius:50%;width:24px;height:24px;background:rgba(190,35,35,.92);color:#fff;font-weight:900;line-height:24px;padding:0}.ph .ph-tag{position:absolute;left:5px;bottom:5px;background:rgba(0,28,67,.82);color:#fff;padding:3px 6px;border-radius:5px;font-size:9px;font-weight:800}';document.head.appendChild(s)}
  injectEvidenceStyle();

  renderPhotos=function(){
    PREVIEW_URLS.forEach(u=>URL.revokeObjectURL(u));PREVIEW_URLS=[];
    const existing=(EXISTING_PHOTO_PATHS||[]).map((p,i)=>`<div class="ph"><div class="smallnote" style="padding:28px 8px;text-align:center">Foto existing</div><span class="ph-tag">Foto ${i+1}</span></div>`);
    const offset=existing.length;
    const fresh=(PHOTOS||[]).map((f,i)=>{const u=URL.createObjectURL(f);PREVIEW_URLS.push(u);return `<div class="ph"><img src="${u}" alt="Evidence ${offset+i+1}"><button type="button" class="ph-remove" onclick="removeNewEvidencePhoto(${i})" aria-label="Hapus foto ${offset+i+1}">×</button><span class="ph-tag">Foto ${offset+i+1}</span></div>`});
    $('photoPreview').innerHTML=[...existing,...fresh].join('')||'<div class="smallnote" style="grid-column:1/-1;padding:12px 0">Belum ada foto evidence.</div>';
    updateEvidenceRequirement();
  };
  window.removeNewEvidencePhoto=function(i){PHOTOS.splice(i,1);renderPhotos()};

  $('fPhotos').onchange=e=>{
    const incoming=Array.from(e.target.files||[]);
    const bad=incoming.find(f=>!['image/jpeg','image/png'].includes(f.type));
    if(bad){alert('Format foto harus JPG atau PNG.');e.target.value='';return}
    PHOTOS=[...(PHOTOS||[]),...incoming];
    e.target.value='';
    renderPhotos();
  };
  $('fQty')?.addEventListener('input',updateEvidenceRequirement);

  const baseValidateIncident=validateIncident;
  validateIncident=function(){
    const m=(baseValidateIncident?baseValidateIncident():[]).filter(x=>x!=='Foto');
    const req=requiredPhotoCount(),got=totalEvidenceCount();
    if(Number($('fQty')?.value||0)>0&&got<req)m.push(`Foto evidence minimal ${req} (1 foto per BOX; saat ini ${got})`);
    return m;
  };

  async function imageSource(file){
    if(window.createImageBitmap){try{return await createImageBitmap(file,{imageOrientation:'from-image'})}catch(_e){try{return await createImageBitmap(file)}catch(_e2){}}}
    return await new Promise((resolve,reject)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{URL.revokeObjectURL(u);resolve(im)};im.onerror=()=>{URL.revokeObjectURL(u);reject(new Error('Foto tidak dapat dibaca'))};im.src=u});
  }
  async function canvasBlob(canvas,quality){return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Kompresi foto gagal')),'image/jpeg',quality))}
  async function compressEvidenceFile(file){
    if(!['image/jpeg','image/png'].includes(file.type))throw new Error('Format foto harus JPG atau PNG.');
    const src=await imageSource(file),sw=src.width||src.naturalWidth,sh=src.height||src.naturalHeight;
    if(!sw||!sh)throw new Error('Ukuran foto tidak valid.');
    let maxEdge=1280,scale=Math.min(1,maxEdge/Math.max(sw,sh)),w=Math.max(1,Math.round(sw*scale)),h=Math.max(1,Math.round(sh*scale));
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(src,0,0,w,h);if(src.close)src.close();
    let blob=await canvasBlob(canvas,.72);if(blob.size>450*1024)blob=await canvasBlob(canvas,.60);
    const name=(file.name||'evidence').replace(/\.[^.]+$/,'')+'.jpg';return new File([blob],name,{type:'image/jpeg',lastModified:Date.now()});
  }

  uploadEvidence=async function(files,rdc){
    if(!SESSION?.access_token)throw new Error('Sesi login tidak aktif. Silakan login kembali.');
    await refreshSession(false);const batch='draft_'+crypto.randomUUID(),paths=[],safe=String(rdc).replace(/[^A-Za-z0-9_-]/g,'_');
    for(let i=0;i<files.length;i++){
      const compressed=await compressEvidenceFile(files[i]);
      const path=`${safe}/${batch}/${Date.now()}_${i+1}.jpg`,encoded=path.split('/').map(encodeURIComponent).join('/');
      const r=await authedFetch(`${SUPABASE_URL}/storage/v1/object/breakage-evidence/${encoded}`,{method:'POST',headers:{'Content-Type':'image/jpeg','x-upsert':'false','x-evidence-compressed':'v49'},body:compressed},2);
      if(!r.ok){const raw=await r.text();if(r.status!==409)throw new Error(`Upload foto ${i+1} gagal (HTTP ${r.status}): ${cleanErr(raw)}`)}paths.push(path);
    }
    return paths;
  };

  evidenceBlob=async function(path){if(typeof path!=='string'||!path||path.startsWith('/')||path.split('/').includes('..'))throw new Error('Path evidence tidak valid');const encoded=path.split('/').map(encodeURIComponent).join('/'),r=await authedFetch(`${SUPABASE_URL}/storage/v1/object/authenticated/breakage-evidence/${encoded}`,{method:'GET'},2);if(!r.ok)throw new Error('Foto tidak dapat dibuka: '+cleanErr(await r.text()));const blob=await r.blob();if(!['image/jpeg','image/png'].includes(blob.type))throw new Error('Format evidence bukan JPEG/PNG');return blob};

  $('submitIncident').onclick=async()=>{
    const miss=validateIncident(),msg=$('inputMsg');msg.classList.remove('hidden');
    if(miss.length){msg.style.color='#c42d26';msg.textContent='Mohon lengkapi: '+miss.join(', ');return}
    const b=$('submitIncident');b.disabled=true;msg.style.color='#6f7b91';msg.textContent=EDIT_ID?'Mengompresi foto & memperbarui Draft…':'Mengompresi foto & menyimpan Draft ke sistem…';
    try{
      const d=formData(),rdc=effectiveScope(),newPaths=PHOTOS.length?await uploadEvidence(PHOTOS,rdc):[],paths=[...(EXISTING_PHOTO_PATHS||[]),...newPaths];
      const payload={incident_type:TYPE,occurrence_date:d.date,item_code:d.item,qty_box:Number(d.qty),uom:'BOX',rdc_name:rdc,no_ba:d.ba.toUpperCase(),reported_by:d.reported,no_sj:d.sj,factory:d.factory,customer:d.customer,transporter:d.transporter,driver_name:d.driver,vehicle_no:d.police.toUpperCase(),cause:CAUSE,cause_detail:d.detail,warehouse_event:d.wh,related_person:d.related,photo_paths:paths};
      const res=EDIT_ID?await rpc('breakage_incident_update_draft_v45',{p_incident_id:EDIT_ID,p_payload:payload}):await rpc('breakage_incident_create_v45',{p_payload:payload});
      msg.style.color='#079455';msg.textContent=EDIT_ID?'Draft diperbarui. Menunggu review SPV.':`Draft ${res.incident_no} tersimpan dengan ${paths.length} foto evidence. Menunggu review SPV.`;
      localStorage.removeItem(draftKey());resetForm();setTimeout(async()=>{$('incidentModal').classList.remove('show');PERIOD=d.date.slice(0,7);initPeriods();await loadHistory();document.querySelector('.panel').scrollIntoView({behavior:'smooth'})},750);
    }catch(e){msg.style.color='#c42d26';msg.textContent='Gagal: '+cleanErr(e.message)}finally{b.disabled=false}
  };

  $('refreshBtn').onclick=()=>loadHistory();
  $('period').onchange=async e=>{PERIOD=e.target.value;$('periodLabel').textContent=monthName(PERIOD);await loadHistory()};
  $('scope').onchange=async e=>{SCOPE=e.target.value;if(ACCESS?.is_master)$('rdcCard').textContent=SCOPE;await loadHistory()};

  setTimeout(async()=>{ensureBuildBadge();updateEvidenceRequirement();if(!SESSION?.refresh_token)return;try{await refreshSession(false);if(!ACCESS)ACCESS=await rpc('breakage_my_access_v44',{});if(ACCESS&&$('app').style.display!=='none')await loadHistory()}catch(_e){}},100);
  window.__SLS_BREAKAGE_INPUT_PATCH=PATCH_VERSION;
})();
