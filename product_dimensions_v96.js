// SLS Breakage Input v96 — simplified product classification: Jenis Produk + Size only.
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const up=v=>String(v??'').trim().toUpperCase();
  const fallback=[
    ['GRANDE','100x100'],['GRANDE','120x60'],['GRANDE','80x80'],
    ['GRANIT','100x100'],['GRANIT','120x60'],['GRANIT','122X20'],['GRANIT','60x15'],['GRANIT','60x30'],['GRANIT','80x80'],['GRANIT','90x15'],['GRANIT','30X30'],['GRANIT','60x60'],['GRANIT','STEPTILE'],
    ['KERAMIK','40x40'],['KERAMIK','30x60'],['KERAMIK','90x30'],['KERAMIK','60x30'],['KERAMIK','50x50'],['KERAMIK','40x20'],['KERAMIK','Hexa'],['KERAMIK','30x30'],['KERAMIK','50x20'],['KERAMIK','20x20']
  ].map((x,i)=>({product_type:x[0],product_size:x[1],sort_order:i+1}));
  let MASTER=fallback.slice();
  const KINDS=['GRANDE','GRANIT','KERAMIK'];
  const curType=()=>{try{return String(TYPE||'').toLowerCase()}catch(_){return ''}};
  const editRow=()=>{try{return (Array.isArray(INCIDENTS)?INCIDENTS:[]).find(x=>Number(x.incident_id)===Number(EDIT_ID))||{}}catch(_){return {}}};
  const reviewRow=()=>{try{return (Array.isArray(INCIDENTS)?INCIDENTS:[]).find(x=>Number(x.incident_id)===Number(REVIEW_ID))||{}}catch(_){return {}}};
  async function loadMaster(){try{const r=await rpc('breakage_product_master_list_v94',{});if(Array.isArray(r)&&r.length)MASTER=r.filter(x=>KINDS.includes(up(x.product_type)))}catch(_){MASTER=fallback.slice()}}
  function sizes(kind){return MASTER.filter(x=>up(x.product_type)===up(kind)).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(x=>String(x.product_size||''))}
  function draft(){try{return JSON.parse(localStorage.getItem(draftKey())||'{}')||{}}catch(_){return {}}}
  function seed(){const d=draft(),e=editRow();return {kind:up($('fProductKind')?.value||d.product_kind||e.product_kind||e.product_type||''),size:String($('fProductSize')?.value||d.product_size||e.product_size||'')}}
  function field(id,label,options,value,note=''){
    const v=String(value||'');
    return `<div class="field product-v96"><label>${label} *</label><select id="${id}"><option value="">Pilih ${label}</option>${options.map(o=>`<option value="${String(o).replace(/"/g,'&quot;')}" ${up(o)===up(v)?'selected':''}>${o}</option>`).join('')}</select>${note?`<div class="smallnote">${note}</div>`:''}</div>`;
  }
  function refillSize(kindEl,sizeEl,wanted=''){
    if(!kindEl||!sizeEl)return;const list=sizes(kindEl.value),keep=String(wanted||sizeEl.value||'');
    sizeEl.innerHTML='<option value="">Pilih Size</option>'+list.map(s=>`<option value="${s.replace(/"/g,'&quot;')}">${s}</option>`).join('');
    const match=list.find(x=>up(x)===up(keep));if(match)sizeEl.value=match;
  }
  function purgeProductType(){
    const p=$('fProductType');if(p)p.closest('.field')?.remove();
    const cp=$('cProductType');if(cp)cp.closest('.field')?.remove();
    document.querySelectorAll('.product-v94,.product-c-v94').forEach(x=>{if(x.querySelector('#fProductType,#cProductType'))x.remove()});
  }
  function ensureInput(){
    if(!['delivery','warehouse'].includes(curType()))return;
    purgeProductType();const s=seed();let kind=$('fProductKind'),size=$('fProductSize');
    if(!kind||!size){
      document.querySelectorAll('.product-v96').forEach(x=>x.remove());
      const ref=$('fSeries')?.closest('.field')||$('fItem')?.closest('.field');if(!ref)return;
      ref.insertAdjacentHTML('afterend',field('fProductKind','Jenis Produk',KINDS,s.kind,'GRANDE / GRANIT / KERAMIK untuk analisa dashboard.')+field('fProductSize','Size',sizes(s.kind),s.size,'Size otomatis mengikuti Jenis Produk.'));
      kind=$('fProductKind');size=$('fProductSize');
    }
    if(kind&&KINDS.includes(s.kind))kind.value=s.kind;refillSize(kind,size,s.size);
    if(kind)kind.onchange=()=>{refillSize(kind,size,'');try{saveDraft()}catch(_){ }};
    if(size)size.onchange=()=>{try{saveDraft()}catch(_){ }};
    try{bindDraftInputs()}catch(_){ }
  }
  function correctionSeed(){const r=reviewRow();return {kind:up($('cProductKind')?.value||r.product_kind||r.product_type||''),size:String($('cProductSize')?.value||r.product_size||'')}}
  function ensureCorrection(){
    purgeProductType();const box=$('cTypeFields')?.querySelector('.form-grid');if(!box)return;const s=correctionSeed();let kind=$('cProductKind'),size=$('cProductSize');
    if(!kind||!size){
      box.querySelectorAll('.product-c-v96').forEach(x=>x.remove());
      const html=`<div class="field product-c-v96"><label>Jenis Produk *</label><select id="cProductKind"><option value="">Pilih Jenis Produk</option>${KINDS.map(x=>`<option value="${x}">${x}</option>`).join('')}</select></div><div class="field product-c-v96"><label>Size *</label><select id="cProductSize"><option value="">Pilih Size</option></select></div>`;
      const series=$('cSeries')?.closest('.field');if(series)series.insertAdjacentHTML('afterend',html);else box.insertAdjacentHTML('afterbegin',html);
      kind=$('cProductKind');size=$('cProductSize');
    }
    if(kind&&KINDS.includes(s.kind))kind.value=s.kind;refillSize(kind,size,s.size);if(kind)kind.onchange=()=>refillSize(kind,size,'');
  }
  function validCombo(kind,sz){return MASTER.some(x=>up(x.product_type)===up(kind)&&up(x.product_size)===up(sz))}
  try{const base=formData;formData=function(){ensureInput();const r=base.apply(this,arguments)||{};r.product_kind=up($('fProductKind')?.value);r.product_type=r.product_kind;r.product_size=String($('fProductSize')?.value||'');return r};window.formData=formData}catch(_){ }
  try{const base=validateIncident;validateIncident=function(){ensureInput();let m=base.apply(this,arguments)||[];m=m.filter(x=>x!=='Product Type'&&!/Product Type/i.test(String(x)));const k=up($('fProductKind')?.value),s=String($('fProductSize')?.value||'');if(!KINDS.includes(k))m.push('Jenis Produk');if(!s)m.push('Size');else if(k&&!validCombo(k,s))m.push('Kombinasi Jenis Produk / Size');return [...new Set(m)]};window.validateIncident=validateIncident}catch(_){ }
  try{const base=rpc;rpc=async function(fn,params={}){let mapped=fn,p={...(params||{})};if(['breakage_incident_create_v45','breakage_incident_create_v92'].includes(fn))mapped='breakage_incident_create_v94';else if(['breakage_incident_update_draft_v45','breakage_incident_update_draft_v92'].includes(fn))mapped='breakage_incident_update_draft_v94';else if(['breakage_incident_spv_revise_v83','breakage_incident_spv_revise_v92'].includes(fn))mapped='breakage_incident_spv_revise_v94';if(mapped==='breakage_incident_spv_revise_v94'){ensureCorrection();const k=up($('cProductKind')?.value);p.p_changes={...(p.p_changes||{}),product_kind:k,product_type:k,product_size:String($('cProductSize')?.value||'')}}return base(mapped,p)};window.rpc=rpc}catch(_){ }
  ['renderConditional','openInput','editIncident'].forEach(name=>{try{const base=window[name];if(typeof base==='function')window[name]=async function(){const r=await base.apply(this,arguments);await loadMaster();setTimeout(ensureInput,0);setTimeout(ensureInput,160);return r}}catch(_){ }});
  const modal=$('incidentModal');if(modal)new MutationObserver(()=>setTimeout(ensureInput,0)).observe(modal,{childList:true,subtree:true});
  const review=$('reviewModal');if(review)new MutationObserver(()=>setTimeout(ensureCorrection,0)).observe(review,{childList:true,subtree:true});
  document.addEventListener('change',e=>{if(e.target?.id==='cType')setTimeout(ensureCorrection,20)},true);
  loadMaster().finally(()=>{[50,180,500,1200].forEach(ms=>setTimeout(()=>{purgeProductType();ensureInput();ensureCorrection();const b=$('buildBadge');if(b)b.textContent='v96'},ms))});
})();
