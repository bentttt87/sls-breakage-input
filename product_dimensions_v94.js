// SLS Breakage Input v94 — Product Type/Size master from Type product & Size.xlsx + Jenis Produk.
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const up=v=>String(v??'').trim().toUpperCase();
  const fallback=[
    ['GRANDE','100x100'],['GRANDE','120x60'],['GRANDE','80x80'],
    ['GRANIT','100x100'],['GRANIT','120x60'],['GRANIT','122X20'],['GRANIT','60x15'],['GRANIT','60x30'],['GRANIT','80x80'],['GRANIT','90x15'],['GRANIT','30X30'],['GRANIT','60x60'],['GRANIT','STEPTILE'],
    ['KERAMIK','40x40'],['KERAMIK','30x60'],['KERAMIK','90x30'],['KERAMIK','60x30'],['KERAMIK','50x50'],['KERAMIK','40x20'],['KERAMIK','Hexa'],['KERAMIK','30x30'],['KERAMIK','50x20'],['KERAMIK','20x20'],
    ['MOZAIK','30x30'],['PORCELINE','30x30']
  ].map((x,i)=>({product_type:x[0],product_size:x[1],sort_order:i+1}));
  let MASTER=fallback.slice();
  const curType=()=>{try{return String(TYPE||'').toLowerCase()}catch(_){return ''}};
  const editRow=()=>{try{return (Array.isArray(INCIDENTS)?INCIDENTS:[]).find(x=>Number(x.incident_id)===Number(EDIT_ID))||{}}catch(_){return {}}};
  const reviewRow=()=>{try{return (Array.isArray(INCIDENTS)?INCIDENTS:[]).find(x=>Number(x.incident_id)===Number(REVIEW_ID))||{}}catch(_){return {}}};
  function types(){return [...new Set(MASTER.map(x=>up(x.product_type)).filter(Boolean))]}
  function sizes(pt){return MASTER.filter(x=>up(x.product_type)===up(pt)).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(x=>String(x.product_size||''))}
  async function loadMaster(){try{const r=await rpc('breakage_product_master_list_v94',{});if(Array.isArray(r)&&r.length)MASTER=r}catch(_){MASTER=fallback.slice()}}
  function sel(id,label,opts,value,note=''){
    const v=String(value||'');
    return `<div class="field product-v94" data-product-field="${id}"><label>${label} *</label><select id="${id}"><option value="">Pilih ${label}</option>${opts.map(o=>`<option value="${String(o).replace(/"/g,'&quot;')}" ${up(o)===up(v)?'selected':''}>${o}</option>`).join('')}</select>${note?`<div class="smallnote">${note}</div>`:''}</div>`;
  }
  function seed(){let d={};try{d=JSON.parse(localStorage.getItem(draftKey())||'{}')||{}}catch(_){ }const e=editRow();return {kind:up($('fProductKind')?.value||d.product_kind||e.product_kind||''),type:up($('fProductType')?.value||d.product_type||e.product_type||''),size:String($('fProductSize')?.value||d.product_size||e.product_size||'')}}
  function refillSize(typeEl,sizeEl,wanted=''){
    if(!typeEl||!sizeEl)return;const list=sizes(typeEl.value);const keep=String(wanted||sizeEl.value||'');sizeEl.innerHTML='<option value="">Pilih Size</option>'+list.map(s=>`<option value="${s.replace(/"/g,'&quot;')}">${s}</option>`).join('');if(list.some(x=>up(x)===up(keep)))sizeEl.value=list.find(x=>up(x)===up(keep))||'';
  }
  function ensureInput(){
    if(!['delivery','warehouse'].includes(curType()))return;
    const s=seed();let kind=$('fProductKind'),ptype=$('fProductType'),psize=$('fProductSize');
    if(!kind||!ptype||!psize){
      document.querySelectorAll('.product-v94').forEach(x=>x.remove());
      const ref=$('fSeries')?.closest('.field')||$('fItem')?.closest('.field');if(!ref)return;
      ref.insertAdjacentHTML('afterend',sel('fProductKind','Jenis Produk',['GRANIT','KERAMIK'],s.kind,'Untuk dashboard: Granit vs Keramik.')+sel('fProductType','Product Type',types(),s.type,'Daftar sesuai file Type product & Size.xlsx.')+sel('fProductSize','Size',sizes(s.type),s.size,'Size mengikuti Product Type yang dipilih.'));
      kind=$('fProductKind');ptype=$('fProductType');psize=$('fProductSize');
    }
    if(kind&&['GRANIT','KERAMIK'].includes(s.kind))kind.value=s.kind;
    if(ptype&&types().includes(s.type))ptype.value=s.type;
    refillSize(ptype,psize,s.size);
    if(ptype)ptype.onchange=()=>{refillSize(ptype,psize,'');try{saveDraft()}catch(_){ }};
    [kind,psize].forEach(el=>{if(el)el.onchange=()=>{try{saveDraft()}catch(_){ }}});
    try{bindDraftInputs()}catch(_){ }
  }
  function correctionSeed(){const r=reviewRow();return {kind:up($('cProductKind')?.value||r.product_kind||''),type:up($('cProductType')?.value||r.product_type||''),size:String($('cProductSize')?.value||r.product_size||'')}}
  function ensureCorrection(){
    const box=$('cTypeFields')?.querySelector('.form-grid');if(!box)return;const s=correctionSeed();let kind=$('cProductKind'),ptype=$('cProductType'),psize=$('cProductSize');
    if(!kind||!ptype||!psize){
      box.querySelectorAll('.product-c-v94').forEach(x=>x.remove());
      const html=`<div class="field product-c-v94"><label>Jenis Produk *</label><select id="cProductKind"><option value="">Pilih Jenis</option><option value="GRANIT">GRANIT</option><option value="KERAMIK">KERAMIK</option></select></div><div class="field product-c-v94"><label>Product Type *</label><select id="cProductType"><option value="">Pilih Product Type</option>${types().map(x=>`<option value="${x}">${x}</option>`).join('')}</select></div><div class="field product-c-v94"><label>Size *</label><select id="cProductSize"><option value="">Pilih Size</option></select></div>`;
      const series=$('cSeries')?.closest('.field');if(series)series.insertAdjacentHTML('afterend',html);else box.insertAdjacentHTML('afterbegin',html);
      kind=$('cProductKind');ptype=$('cProductType');psize=$('cProductSize');
    }
    if(kind&&['GRANIT','KERAMIK'].includes(s.kind))kind.value=s.kind;if(ptype&&types().includes(s.type))ptype.value=s.type;refillSize(ptype,psize,s.size);if(ptype)ptype.onchange=()=>refillSize(ptype,psize,'');
  }
  function validCombo(pt,sz){return MASTER.some(x=>up(x.product_type)===up(pt)&&up(x.product_size)===up(sz))}
  try{const base=formData;formData=function(){ensureInput();const r=base.apply(this,arguments)||{};r.product_kind=up($('fProductKind')?.value);r.product_type=up($('fProductType')?.value);r.product_size=String($('fProductSize')?.value||'');return r};window.formData=formData}catch(_){ }
  try{const base=validateIncident;validateIncident=function(){ensureInput();let m=base.apply(this,arguments)||[];const k=up($('fProductKind')?.value),t=up($('fProductType')?.value),s=String($('fProductSize')?.value||'');if(!['GRANIT','KERAMIK'].includes(k))m.push('Jenis Produk');if(!t)m.push('Product Type');if(!s)m.push('Size');else if(t&&!validCombo(t,s))m.push('Kombinasi Product Type / Size');return [...new Set(m)]};window.validateIncident=validateIncident}catch(_){ }
  try{const base=rpc;rpc=async function(fn,params={}){let mapped=fn,p={...(params||{})};if(['breakage_incident_create_v45','breakage_incident_create_v92'].includes(fn))mapped='breakage_incident_create_v94';else if(['breakage_incident_update_draft_v45','breakage_incident_update_draft_v92'].includes(fn))mapped='breakage_incident_update_draft_v94';else if(['breakage_incident_spv_revise_v83','breakage_incident_spv_revise_v92'].includes(fn))mapped='breakage_incident_spv_revise_v94';if(mapped==='breakage_incident_spv_revise_v94'){ensureCorrection();p.p_changes={...(p.p_changes||{}),product_kind:up($('cProductKind')?.value),product_type:up($('cProductType')?.value),product_size:String($('cProductSize')?.value||'')}}return base(mapped,p)};window.rpc=rpc}catch(_){ }
  ['renderConditional','openInput','editIncident'].forEach(name=>{try{const base=window[name];if(typeof base==='function')window[name]=async function(){const r=await base.apply(this,arguments);await loadMaster();setTimeout(ensureInput,0);setTimeout(ensureInput,160);return r}}catch(_){ }});
  const modal=$('incidentModal');if(modal)new MutationObserver(()=>setTimeout(ensureInput,0)).observe(modal,{childList:true,subtree:true});const review=$('reviewModal');if(review)new MutationObserver(()=>setTimeout(ensureCorrection,0)).observe(review,{childList:true,subtree:true});
  document.addEventListener('change',e=>{if(e.target?.id==='cType')setTimeout(ensureCorrection,20)},true);
  loadMaster().finally(()=>{[80,250,700,1500].forEach(ms=>setTimeout(()=>{ensureInput();ensureCorrection();const b=$('buildBadge');if(b)b.textContent='v94'},ms))});
})();