// SLS Breakage Input v109 — stable mobile product fields: Series + chip-based Size + gallery picker.
(function(){
  'use strict';
  const byId=id=>document.getElementById(id);
  const up=v=>String(v??'').trim().toUpperCase();
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const KINDS=['GRANDE','GRANIT','KERAMIK'];
  const FALLBACK=[
    ['GRANDE','100x100'],['GRANDE','120x60'],['GRANDE','80x80'],
    ['GRANIT','100x100'],['GRANIT','120x60'],['GRANIT','120x20'],['GRANIT','60x15'],['GRANIT','60x30'],['GRANIT','80x80'],['GRANIT','90x15'],['GRANIT','30X30'],['GRANIT','60x60'],['GRANIT','STEPTILE'],
    ['KERAMIK','40x40'],['KERAMIK','30x60'],['KERAMIK','90x30'],['KERAMIK','60x30'],['KERAMIK','50x50'],['KERAMIK','40x20'],['KERAMIK','HEXA'],['KERAMIK','30x30'],['KERAMIK','50x20'],['KERAMIK','20x20']
  ].map((x,i)=>({product_type:x[0],product_size:x[1],sort_order:i+1}));
  let MASTER=FALLBACK.slice(), masterLoaded=false, masterPromise=null, mounting=false;

  function currentType(){try{return String(TYPE||'').toLowerCase()}catch(_){return ''}}
  function currentEdit(){try{return (Array.isArray(INCIDENTS)?INCIDENTS:[]).find(x=>Number(x.incident_id)===Number(EDIT_ID))||{}}catch(_){return {}}}
  function currentDraft(){try{return JSON.parse(localStorage.getItem(draftKey())||'{}')||{}}catch(_){return {}}}
  function sizesFor(kind){return MASTER.filter(x=>up(x.product_type)===up(kind)).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(x=>String(x.product_size||''))}

  async function loadMaster(){
    if(masterLoaded)return MASTER;
    if(masterPromise)return masterPromise;
    masterPromise=(async()=>{
      try{
        const rows=await rpc('breakage_product_master_list_v94',{});
        if(Array.isArray(rows)&&rows.length){
          const filtered=rows.filter(x=>KINDS.includes(up(x.product_type))&&String(x.product_size||'').trim());
          if(filtered.length)MASTER=filtered;
        }
      }catch(_){MASTER=FALLBACK.slice()}
      finally{masterLoaded=true;masterPromise=null}
      return MASTER;
    })();
    return masterPromise;
  }

  function installStyle(){
    if(byId('mobileFormV109Style'))return;
    const st=document.createElement('style');st.id='mobileFormV109Style';st.textContent=`
      #productBlock109{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:9px}
      #productBlock109 .v109-span2{grid-column:1/-1}
      .v109-size-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:4px}
      .v109-size-btn{appearance:none;-webkit-appearance:none;border:1px solid #9bb8d5;background:#fff;color:#173a61;border-radius:10px;padding:11px 6px;font-weight:800;font-size:14px;line-height:1.1;min-height:44px;touch-action:manipulation}
      .v109-size-btn.active{background:#073f7f;color:#fff;border-color:#073f7f;box-shadow:0 0 0 2px rgba(7,63,127,.08)}
      .v109-size-empty{font-size:12px;color:#6d7d94;padding:8px 2px}
      #fSeries109{text-transform:uppercase}
      @media(max-width:760px){#productBlock109{grid-template-columns:1fr}.v109-size-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.v109-size-btn{font-size:16px;min-height:48px}}
      @media(max-width:390px){.v109-size-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;document.head.appendChild(st);
  }

  function hideLegacyProductFields(){
    ['fSeries','fProductKind','fProductType','fProductSize'].forEach(id=>{
      const el=byId(id);if(!el)return;
      const field=el.closest('.field');
      if(field && !field.closest('#productBlock109'))field.style.display='none';
    });
    document.querySelectorAll('.product-v96,.product-v94,.product-v108').forEach(el=>{if(!el.closest('#productBlock109'))el.style.display='none'});
  }

  function ensureLegacyValue(id,value){
    let el=byId(id);
    if(!el){el=document.createElement('input');el.type='hidden';el.id=id;byId('incidentModal')?.appendChild(el)}
    if(el.tagName==='SELECT'){
      if(value && ![...el.options].some(o=>up(o.value)===up(value))){const o=document.createElement('option');o.value=value;o.textContent=value;el.appendChild(o)}
    }
    el.value=value||'';
  }

  function blockHtml(){return `<div id="productBlock109">
    <div class="field v109-span2"><label>Series / Motif *</label><input id="fSeries109" maxlength="80" autocomplete="off" placeholder="Contoh: S050S / motif / warna"><div class="smallnote">Isi series / motif sesuai label barang atau dokumen.</div></div>
    <div class="field v109-span2"><label>Jenis Produk *</label><select id="fProductKind109"><option value="">Pilih Jenis Produk</option>${KINDS.map(k=>`<option value="${k}">${k}</option>`).join('')}</select><div class="smallnote">GRANDE / GRANIT / KERAMIK.</div></div>
    <div class="field v109-span2"><label>Size *</label><input id="fProductSize109" type="hidden"><div id="sizeGrid109" class="v109-size-grid"></div><div class="smallnote">Tap ukuran. Tidak menggunakan menu dropdown agar stabil di HP.</div></div>
  </div>`}

  function renderSizeButtons(kind,wanted=''){
    const grid=byId('sizeGrid109'),hidden=byId('fProductSize109');if(!grid||!hidden)return;
    const list=sizesFor(kind),desired=String(wanted||hidden.value||'');
    if(!list.length){grid.innerHTML='<div class="v109-size-empty">Pilih Jenis Produk terlebih dahulu.</div>';hidden.value='';ensureLegacyValue('fProductSize','');return}
    const match=list.find(x=>up(x)===up(desired));hidden.value=match||'';
    grid.innerHTML=list.map(s=>`<button type="button" class="v109-size-btn ${up(s)===up(hidden.value)?'active':''}" data-size="${esc(s)}">${esc(s)}</button>`).join('');
    grid.querySelectorAll('.v109-size-btn').forEach(btn=>btn.addEventListener('click',()=>{
      hidden.value=btn.dataset.size||'';
      ensureLegacyValue('fProductSize',hidden.value);
      grid.querySelectorAll('.v109-size-btn').forEach(b=>b.classList.toggle('active',b===btn));
      try{saveDraft()}catch(_){ }
    },{passive:true}));
  }

  async function mount(seed={}){
    if(mounting)return;mounting=true;
    try{
      if(!['delivery','warehouse'].includes(currentType()))return;
      installStyle();await loadMaster();
      const item=byId('fItem');if(!item)return;
      hideLegacyProductFields();
      let block=byId('productBlock109');
      if(!block){item.closest('.field')?.insertAdjacentHTML('afterend',blockHtml());block=byId('productBlock109')}
      if(!block)return;
      const d=currentDraft(),e=currentEdit();
      const series=up(seed.series||byId('fSeries109')?.value||d.series||d.ceramic_series||e.ceramic_series||'');
      const kind=up(seed.kind||byId('fProductKind109')?.value||d.product_kind||e.product_kind||e.product_type||'');
      const size=String(seed.size||byId('fProductSize109')?.value||d.product_size||e.product_size||'');
      if(byId('fSeries109'))byId('fSeries109').value=series;
      if(byId('fProductKind109')&&KINDS.includes(kind))byId('fProductKind109').value=kind;
      renderSizeButtons(byId('fProductKind109')?.value||'',size);
      ensureLegacyValue('fSeries',series);ensureLegacyValue('fProductKind',byId('fProductKind109')?.value||'');ensureLegacyValue('fProductSize',byId('fProductSize109')?.value||'');
      byId('fSeries109').oninput=()=>{byId('fSeries109').value=up(byId('fSeries109').value);ensureLegacyValue('fSeries',byId('fSeries109').value);try{saveDraft()}catch(_){}};
      byId('fProductKind109').onchange=()=>{ensureLegacyValue('fProductKind',byId('fProductKind109').value);byId('fProductSize109').value='';renderSizeButtons(byId('fProductKind109').value,'');try{saveDraft()}catch(_){}};
      try{bindDraftInputs()}catch(_){ }
      ensurePhotoPicker();
      const b=byId('buildBadge');if(b)b.textContent='v109';
    }finally{mounting=false}
  }

  function ensurePhotoPicker(){
    const p=byId('fPhotos');if(!p)return;
    p.removeAttribute('capture');p.setAttribute('accept','image/*');p.multiple=true;
    const lab=document.querySelector('label[for="fPhotos"]');if(lab)lab.textContent='📷 Ambil Foto / Pilih dari Galeri';
    p.onchange=e=>{
      const incoming=Array.from(e.target.files||[]).filter(f=>String(f.type||'').startsWith('image/')||/\.(jpe?g|png|webp|heic|heif)$/i.test(f.name||''));
      if(!incoming.length){alert('File yang dipilih bukan gambar.');e.target.value='';return}
      if(((EXISTING_PHOTO_PATHS?.length||0)+(PHOTOS?.length||0)+incoming.length)>5){alert('Maksimal 5 foto per insiden.');e.target.value='';return}
      PHOTOS.push(...incoming);e.target.value='';try{renderPhotos()}catch(_){ }
    };
  }

  function productValues(){return {
    series:up(byId('fSeries109')?.value||''),
    kind:up(byId('fProductKind109')?.value||''),
    size:String(byId('fProductSize109')?.value||'')
  }}

  try{
    const base=formData;
    formData=function(){const r=base.apply(this,arguments)||{},p=productValues();r.series=p.series;r.ceramic_series=p.series;r.product_kind=p.kind;r.product_type=p.kind;r.product_size=p.size;return r};window.formData=formData;
  }catch(_){ }
  try{
    const base=validateIncident;
    validateIncident=function(){let m=base.apply(this,arguments)||[],p=productValues();m=m.filter(x=>!/Product Type|Jenis Series Keramik|Series \/ Motif|\bSize\b|Kombinasi Jenis Produk/i.test(String(x)));if(!p.series)m.push('Series / Motif');if(!KINDS.includes(p.kind))m.push('Jenis Produk');if(!p.size)m.push('Size');else if(p.kind&&!MASTER.some(x=>up(x.product_type)===p.kind&&up(x.product_size)===up(p.size)))m.push('Kombinasi Jenis Produk / Size');return [...new Set(m)]};window.validateIncident=validateIncident;
  }catch(_){ }
  try{
    const base=rpc;
    rpc=async function(fn,params={}){
      let mapped=fn,p={...(params||{})};
      if(['breakage_incident_create_v45','breakage_incident_create_v92'].includes(fn))mapped='breakage_incident_create_v94';
      else if(['breakage_incident_update_draft_v45','breakage_incident_update_draft_v92'].includes(fn))mapped='breakage_incident_update_draft_v94';
      else if(['breakage_incident_spv_revise_v83','breakage_incident_spv_revise_v92'].includes(fn))mapped='breakage_incident_spv_revise_v94';
      if(p.p_payload){const v=productValues();p.p_payload={...p.p_payload,ceramic_series:v.series,product_kind:v.kind,product_type:v.kind,product_size:v.size}}
      return base(mapped,p);
    };window.rpc=rpc;
  }catch(_){ }

  try{const base=openInput;openInput=async function(){const r=await base.apply(this,arguments);setTimeout(()=>mount(),20);setTimeout(()=>mount(),180);return r};window.openInput=openInput}catch(_){ }
  try{const base=editIncident;editIncident=async function(id){const row=(Array.isArray(INCIDENTS)?INCIDENTS:[]).find(x=>Number(x.incident_id)===Number(id))||{};const r=await base.apply(this,arguments);setTimeout(()=>mount({series:row.ceramic_series,kind:row.product_kind||row.product_type,size:row.product_size}),30);return r};window.editIncident=editIncident}catch(_){ }
  try{const base=renderConditional;renderConditional=function(){const r=base.apply(this,arguments);setTimeout(()=>mount(),20);return r};window.renderConditional=renderConditional}catch(_){ }
  try{const base=resetForm;resetForm=function(){const r=base.apply(this,arguments);if(byId('fSeries109'))byId('fSeries109').value='';if(byId('fProductKind109'))byId('fProductKind109').value='';if(byId('fProductSize109'))byId('fProductSize109').value='';renderSizeButtons('','');return r};window.resetForm=resetForm}catch(_){ }

  document.addEventListener('click',e=>{if(['newBtn','navInput'].includes(e.target?.id)||e.target?.dataset?.type)setTimeout(()=>mount(),40)},true);
  const modal=byId('incidentModal');if(modal)new MutationObserver(muts=>{if(!byId('productBlock109')&&modal.classList.contains('show'))setTimeout(()=>mount(),30)}).observe(modal,{childList:true,subtree:true});
  loadMaster().finally(()=>{[80,300,900].forEach(ms=>setTimeout(()=>mount(),ms))});
})();