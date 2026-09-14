// SLS Breakage Input v92 — Pabrik Asal wajib untuk Kiriman & Gudang; SPV correction aligned.
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const up=v=>String(v??'').trim().toUpperCase();
  const currentType=()=>{try{return String(TYPE||'').toLowerCase()}catch(_){return ''}};
  function fieldOf(id){return $(id)?.closest('.field')||null}
  function factoryHtml(id='fFactory',value=''){
    const v=up(value);
    return `<div class="field" id="factoryField92"><label>Pabrik Asal *</label><select id="${id}"><option value="">Pilih Pabrik Asal</option><option value="SRKI" ${v==='SRKI'?'selected':''}>SRKI</option><option value="RCI" ${v==='RCI'?'selected':''}>RCI</option></select><div class="smallnote">Wajib pilih SRKI atau RCI.</div></div>`;
  }
  function draftFactory(){try{return up(JSON.parse(localStorage.getItem(draftKey())||'{}')?.factory||'')}catch(_){return ''}}
  function ensureInputFactory(seed=''){
    if(!['delivery','warehouse'].includes(currentType()))return;
    let el=$('fFactory'); const current=up(el?.value||seed||draftFactory());
    if(!el){
      const ref=currentType()==='delivery'?(fieldOf('fSj')||fieldOf('fSeries')):fieldOf('fSeries');
      if(ref){ref.insertAdjacentHTML('afterend',factoryHtml('fFactory',current));el=$('fFactory')}
    }
    if(el&&el.tagName!=='SELECT'){
      const s=document.createElement('select');s.id='fFactory';s.innerHTML='<option value="">Pilih Pabrik Asal</option><option value="SRKI">SRKI</option><option value="RCI">RCI</option>';el.replaceWith(s);el=s;
    }
    if(el){
      if(![...el.options].some(o=>o.value==='SRKI'))el.innerHTML='<option value="">Pilih Pabrik Asal</option><option value="SRKI">SRKI</option><option value="RCI">RCI</option>';
      if(['SRKI','RCI'].includes(current))el.value=current;
      el.onchange=()=>{try{saveDraft()}catch(_){ }};
    }
    try{bindDraftInputs()}catch(_){ }
  }
  function ensureWarehouseCorrectionFactory(seed=''){
    const type=$('cType')?.value||''; if(type!=='warehouse')return;
    let el=$('cFactory');const current=up(el?.value||seed||'');
    if(!el){
      const box=$('cTypeFields')?.querySelector('.form-grid');
      if(box){box.insertAdjacentHTML('afterbegin',factoryHtml('cFactory',current));el=$('cFactory')}
    }
    if(el&&['SRKI','RCI'].includes(current))el.value=current;
  }

  // Canonical warehouse validation. Delivery remains protected by v87.
  try{
    const baseValidate=validateIncident;
    validateIncident=function(){
      ensureInputFactory();
      let m=baseValidate.apply(this,arguments)||[];
      if(['delivery','warehouse'].includes(currentType())&&!['SRKI','RCI'].includes(up($('fFactory')?.value)))m.push('Pabrik Asal');
      return [...new Set(m)];
    }; window.validateIncident=validateIncident;
  }catch(_){ }

  try{
    const baseRender=renderConditional;
    renderConditional=function(){const r=baseRender.apply(this,arguments);setTimeout(()=>ensureInputFactory(),0);setTimeout(()=>ensureInputFactory(),120);return r};window.renderConditional=renderConditional;
  }catch(_){ }
  try{
    const baseOpen=openInput;
    openInput=async function(){const r=await baseOpen.apply(this,arguments);setTimeout(()=>ensureInputFactory(),0);setTimeout(()=>ensureInputFactory(),180);return r};window.openInput=openInput;
  }catch(_){ }
  try{
    const baseEdit=editIncident;
    editIncident=async function(id){let row=null;try{row=INCIDENTS.find(x=>Number(x.incident_id)===Number(id))}catch(_){ }const r=await baseEdit.apply(this,arguments);setTimeout(()=>ensureInputFactory(row?.factory||''),80);setTimeout(()=>ensureInputFactory(row?.factory||''),260);return r};window.editIncident=editIncident;
  }catch(_){ }

  // SPV correction: Gudang now also carries factory.
  try{
    const baseTypeChanged=window.spvV83TypeChanged;
    if(typeof baseTypeChanged==='function')window.spvV83TypeChanged=function(){const r=baseTypeChanged.apply(this,arguments);setTimeout(()=>ensureWarehouseCorrectionFactory(ACTIVE_ROW?.factory||''),20);return r};
  }catch(_){ }
  try{
    const baseSave=saveSpvCorrection;
    saveSpvCorrection=async function(){
      if(($('cType')?.value||'')!=='warehouse')return baseSave.apply(this,arguments);
      const reason=String($('reviewNote')?.value||'').trim();
      const changes={occurrence_date:$('cDate')?.value||'',incident_type:'warehouse',item_code:up($('cItem')?.value),ceramic_series:up($('cSeries')?.value),qty_box:Number($('cQty')?.value||0),factory:up($('cFactory')?.value),warehouse_event:$('cWhEvent')?.value||'',related_person:up($('cRelated')?.value||''),cause_detail:up($('cCauseDetail')?.value||'')};
      const miss=[];if(!reason)miss.push('Alasan revisi');if(!changes.occurrence_date)miss.push('Tanggal');if(!changes.item_code)miss.push('Item');if(!changes.ceramic_series)miss.push('Series');if(!(changes.qty_box>0))miss.push('Qty');if(!['SRKI','RCI'].includes(changes.factory))miss.push('Pabrik Asal');if(!['Pecah Dalam Pallet','Misshandling'].includes(changes.warehouse_event))miss.push('Kejadian Gudang');if(changes.warehouse_event==='Misshandling'&&!changes.related_person)miss.push('Nama Terkait');
      if(miss.length){if($('reviewMsg'))$('reviewMsg').textContent='Lengkapi: '+[...new Set(miss)].join(', ');return}
      try{REVIEW_BUSY=true;if(typeof syncReviewButtons==='function')syncReviewButtons();await rpc('breakage_incident_spv_revise_v83',{p_incident_id:REVIEW_ID,p_reason:reason,p_changes:changes});REVIEW_BUSY=false;closeReview();await loadHistory();}catch(e){if($('reviewMsg'))$('reviewMsg').textContent='Revisi gagal: '+cleanErr(e.message)}finally{REVIEW_BUSY=false;if(typeof syncReviewButtons==='function')syncReviewButtons()}
    };window.saveSpvCorrection=saveSpvCorrection;
  }catch(_){ }

  const modal=$('incidentModal');if(modal)new MutationObserver(()=>setTimeout(()=>ensureInputFactory(),0)).observe(modal,{childList:true,subtree:true});
  const review=$('reviewModal');if(review)new MutationObserver(()=>{if(($('cType')?.value||'')==='warehouse')setTimeout(()=>ensureWarehouseCorrectionFactory(ACTIVE_ROW?.factory||''),0)}).observe(review,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target?.dataset?.type||['newBtn','navInput'].includes(e.target?.id))setTimeout(()=>ensureInputFactory(),30)},true);
  document.addEventListener('change',e=>{if(e.target?.id==='cType'&&e.target.value==='warehouse')setTimeout(()=>ensureWarehouseCorrectionFactory(ACTIVE_ROW?.factory||''),30)},true);
  [60,180,500,1200].forEach(ms=>setTimeout(()=>{ensureInputFactory();const b=$('buildBadge');if(b)b.textContent='v92'},ms));
})();
