// SLS Breakage Input v108 — mobile stability + Series + gallery upload.
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const up=v=>String(v??'').trim().toUpperCase();
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const KINDS=['GRANDE','GRANIT','KERAMIK'];
  const FALLBACK=[
    ['GRANDE','100x100'],['GRANDE','120x60'],['GRANDE','80x80'],
    ['GRANIT','100x100'],['GRANIT','120x60'],['GRANIT','120x20'],['GRANIT','60x15'],['GRANIT','60x30'],['GRANIT','80x80'],['GRANIT','90x15'],['GRANIT','30X30'],['GRANIT','60x60'],['GRANIT','STEPTILE'],
    ['KERAMIK','40x40'],['KERAMIK','30x60'],['KERAMIK','90x30'],['KERAMIK','60x30'],['KERAMIK','50x50'],['KERAMIK','40x20'],['KERAMIK','HEXA'],['KERAMIK','30x30'],['KERAMIK','50x20'],['KERAMIK','20x20']
  ].map((x,i)=>({product_type:x[0],product_size:x[1],sort_order:i+1}));
  let MASTER=FALLBACK.slice(), loaded=false, loading=null;

  const currentType=()=>{try{return String(TYPE||'').toLowerCase()}catch(_){return ''}};
  const editRow=()=>{try{return (Array.isArray(INCIDENTS)?INCIDENTS:[]).find(x=>Number(x.incident_id)===Number(EDIT_ID))||{}}catch(_){return {}}};
  const draft=()=>{try{return JSON.parse(localStorage.getItem(draftKey())||'{}')||{}}catch(_){return {}}};
  const sizes=kind=>MASTER.filter(x=>up(x.product_type)===up(kind)).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(x=>String(x.product_size||''));

  async function loadMaster(){
    if(loaded)return MASTER;
    if(loading)return loading;
    loading=(async()=>{try{const r=await rpc('breakage_product_master_list_v94',{});if(Array.isArray(r)&&r.length)MASTER=r.filter(x=>KINDS.includes(up(x.product_type)))}catch(_){MASTER=FALLBACK.slice()}finally{loaded=true;loading=null}return MASTER})();
    return loading;
  }
  function fieldHtml(id,label,kind='input',note=''){
    const control=kind==='series'?`<input id="${id}" maxlength="80" autocomplete="off" placeholder="Contoh: S050S / motif / warna">`:`<select id="${id}"></select>`;
    return `<div class="field product-v108" data-v108="${id}"><label>${label} *</label>${control}${note?`<div class="smallnote">${note}</div>`:''}</div>`;
  }
  function optionSignature(list){return list.map(x=>up(x)).join('|')}
  function fillKind(el,wanted=''){
    if(!el)return;const sig=KINDS.join('|');if(el.dataset.sig!==sig){el.innerHTML='<option value="">Pilih Jenis Produk</option>'+KINDS.map(x=>`<option value="${x}">${x}</option>`).join('');el.dataset.sig=sig}
    const m=KINDS.find(x=>up(x)===up(wanted));if(m)el.value=m;
  }
  function fillSize(kindEl,sizeEl,wanted=''){
    if(!kindEl||!sizeEl)return;const list=sizes(kindEl.value),sig=optionSignature(list);const keep=String(wanted||sizeEl.value||'');
    if(sizeEl.dataset.sig!==sig){sizeEl.innerHTML='<option value="">Pilih Size</option>'+list.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');sizeEl.dataset.sig=sig}
    const m=list.find(x=>up(x)===up(keep));if(m)sizeEl.value=m;else if(keep)sizeEl.value='';
  }
  function ensureInputFields(seed={}){
    if(!['delivery','warehouse'].includes(currentType()))return;
    document.querySelectorAll('.product-v96,.product-v94').forEach(x=>x.remove());
    const d=draft(),e=editRow();
    const seriesSeed=up(seed.series||$('fSeries')?.value||d.series||d.ceramic_series||e.ceramic_series||'');
    const kindSeed=up(seed.kind||$('fProductKind')?.value||d.product_kind||e.product_kind||e.product_type||'');
    const sizeSeed=String(seed.size||$('fProductSize')?.value||d.product_size||e.product_size||'');
    let item=$('fItem');if(!item)return;
    let series=$('fSeries');
    if(!series){item.closest('.field')?.insertAdjacentHTML('afterend',fieldHtml('fSeries','Series / Motif','series','Isi series/motif produk sesuai barang atau dokumen.'));series=$('fSeries')}
    let kind=$('fProductKind'),size=$('fProductSize');
    if(!kind){series.closest('.field')?.insertAdjacentHTML('afterend',fieldHtml('fProductKind','Jenis Produk','select','GRANDE / GRANIT / KERAMIK untuk analisa dashboard.'));kind=$('fProductKind')}
    if(!size){kind.closest('.field')?.insertAdjacentHTML('afterend',fieldHtml('fProductSize','Size','select','Size otomatis mengikuti Jenis Produk.'));size=$('fProductSize')}
    if(series){series.readOnly=false;series.disabled=false;if(seriesSeed&&!series.value)series.value=seriesSeed;series.oninput=()=>{series.value=up(series.value);try{saveDraft()}catch(_){}}}
    fillKind(kind,kindSeed);fillSize(kind,size,sizeSeed);
    if(kind)kind.onchange=()=>{fillSize(kind,size,'');try{saveDraft()}catch(_){}};
    if(size)size.onchange=()=>{try{saveDraft()}catch(_){}};
    try{bindDraftInputs()}catch(_){ }
  }
  function ensurePhotoPicker(){
    const p=$('fPhotos');if(!p)return;
    p.removeAttribute('capture');p.setAttribute('accept','image/*');p.setAttribute('multiple','multiple');
    const lab=document.querySelector('label[for="fPhotos"]');if(lab)lab.textContent='📷 Ambil Foto / Pilih dari Galeri';
    p.onchange=e=>{
      const incoming=Array.from(e.target.files||[]).filter(f=>String(f.type||'').startsWith('image/')||/\.(jpe?g|png|webp|heic|heif)$/i.test(f.name||''));
      if(!incoming.length){alert('File yang dipilih bukan gambar.');e.target.value='';return}
      if(((EXISTING_PHOTO_PATHS?.length||0)+(PHOTOS?.length||0)+incoming.length)>5){alert('Maksimal 5 foto per insiden.');e.target.value='';return}
      PHOTOS.push(...incoming);e.target.value='';try{renderPhotos()}catch(_){ }
    };
  }
  function schedule(seed={}){setTimeout(async()=>{await loadMaster();ensureInputFields(seed);ensurePhotoPicker();const b=$('buildBadge');if(b)b.textContent='v108'},30)}

  try{const base=formData;formData=function(){ensureInputFields();const r=base.apply(this,arguments)||{};r.series=up($('fSeries')?.value||'');r.ceramic_series=r.series;r.product_kind=up($('fProductKind')?.value||'');r.product_type=r.product_kind;r.product_size=String($('fProductSize')?.value||'');return r};window.formData=formData}catch(_){ }
  try{const base=validateIncident;validateIncident=function(){ensureInputFields();let m=base.apply(this,arguments)||[];m=m.filter(x=>!/Product Type/i.test(String(x)));const s=up($('fSeries')?.value||''),k=up($('fProductKind')?.value||''),z=String($('fProductSize')?.value||'');if(!s)m.push('Series / Motif');if(!KINDS.includes(k))m.push('Jenis Produk');if(!z)m.push('Size');else if(k&&!MASTER.some(x=>up(x.product_type)===k&&up(x.product_size)===up(z)))m.push('Kombinasi Jenis Produk / Size');return [...new Set(m)]};window.validateIncident=validateIncident}catch(_){ }
  try{const base=rpc;rpc=async function(fn,params={}){let mapped=fn,p={...(params||{})};if(['breakage_incident_create_v45','breakage_incident_create_v92'].includes(fn))mapped='breakage_incident_create_v94';else if(['breakage_incident_update_draft_v45','breakage_incident_update_draft_v92'].includes(fn))mapped='breakage_incident_update_draft_v94';else if(['breakage_incident_spv_revise_v83','breakage_incident_spv_revise_v92'].includes(fn))mapped='breakage_incident_spv_revise_v94';if(p.p_payload){p.p_payload={...p.p_payload,ceramic_series:up($('fSeries')?.value||p.p_payload.ceramic_series||''),product_kind:up($('fProductKind')?.value||p.p_payload.product_kind||''),product_type:up($('fProductKind')?.value||p.p_payload.product_type||''),product_size:String($('fProductSize')?.value||p.p_payload.product_size||'')}}if(mapped==='breakage_incident_spv_revise_v94'&&p.p_changes){p.p_changes={...p.p_changes,product_kind:up($('cProductKind')?.value||p.p_changes.product_kind||''),product_type:up($('cProductKind')?.value||p.p_changes.product_type||''),product_size:String($('cProductSize')?.value||p.p_changes.product_size||'')}}return base(mapped,p)};window.rpc=rpc}catch(_){ }

  try{const base=openInput;openInput=async function(){const r=await base.apply(this,arguments);schedule();setTimeout(()=>schedule(),180);return r};window.openInput=openInput}catch(_){ }
  try{const base=editIncident;editIncident=async function(id){const row=(Array.isArray(INCIDENTS)?INCIDENTS:[]).find(x=>Number(x.incident_id)===Number(id))||{};const r=await base.apply(this,arguments);schedule({series:row.ceramic_series,kind:row.product_kind||row.product_type,size:row.product_size});setTimeout(()=>schedule({series:row.ceramic_series,kind:row.product_kind||row.product_type,size:row.product_size}),180);return r};window.editIncident=editIncident}catch(_){ }
  try{const base=renderConditional;renderConditional=function(){const r=base.apply(this,arguments);schedule();return r};window.renderConditional=renderConditional}catch(_){ }
  try{const base=resetForm;resetForm=function(){const r=base.apply(this,arguments);if($('fSeries'))$('fSeries').value='';if($('fProductKind'))$('fProductKind').value='';if($('fProductSize')){$('fProductSize').innerHTML='<option value="">Pilih Size</option>';$('fProductSize').dataset.sig=''}return r};window.resetForm=resetForm}catch(_){ }

  try{compressEvidenceFile=async function(file){
    if(!file)throw new Error('Foto tidak ditemukan.');await new Promise(r=>requestAnimationFrame(()=>r()));
    let src=null;try{if(window.createImageBitmap)src=await createImageBitmap(file,{imageOrientation:'from-image'})}catch(_){try{if(window.createImageBitmap)src=await createImageBitmap(file)}catch(__){}}
    if(!src)src=await new Promise((resolve,reject)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{URL.revokeObjectURL(u);resolve(im)};im.onerror=()=>{URL.revokeObjectURL(u);reject(new Error('Format foto dari galeri tidak dapat dibaca. Pilih foto JPG/PNG/WEBP.'))};im.src=u});
    const sw=src.width||src.naturalWidth,sh=src.height||src.naturalHeight;if(!sw||!sh)throw new Error('Ukuran foto tidak valid.');const scale=Math.min(1,1024/Math.max(sw,sh)),w=Math.max(1,Math.round(sw*scale)),h=Math.max(1,Math.round(sh*scale));const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(src,0,0,w,h);if(src.close)src.close();const blob=await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('Kompresi foto gagal')),'image/jpeg',.70));return new File([blob],(file.name||'evidence').replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg',lastModified:Date.now()})
  }}catch(_){ }

  document.addEventListener('click',e=>{if(['newBtn','navInput'].includes(e.target?.id)||e.target?.dataset?.type)schedule()},true);
  document.addEventListener('change',e=>{if(e.target?.id==='fProductKind')fillSize($('fProductKind'),$('fProductSize'),'')},true);
  loadMaster().finally(()=>{schedule();[180,500,1200].forEach(ms=>setTimeout(()=>schedule(),ms))});
})();
