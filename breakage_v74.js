// SLS Breakage Input v77 — direct production patch.
(function(){
  'use strict';
  const VERSION='v77';
  const get=id=>document.getElementById(id);
  const role=()=>String(ACCESS?.breakage_role||ACCESS?.role||'').toLowerCase();
  const canLogistics=()=>['spv','supervisor','manager','rdc_manager','master'].includes(role())||!!ACCESS?.is_manager||!!ACCESS?.is_master;
  function ensureBuild(){const b=get('buildBadge');if(b)b.textContent=VERSION;}
  function ensureSeries(){
    if(get('fSeries'))return;
    const item=get('fItem'); if(!item)return;
    const field=item.closest('.field'); if(!field)return;
    field.insertAdjacentHTML('afterend','<div class="field"><label>Jenis Series Keramik *</label><input id="fSeries" placeholder="Contoh: GRANITI / D-BALTIMORE / ROMAN GRES"></div>');
    bindDraftInputs();
  }
  function ensureLogisticsButton(){
    const actions=document.querySelector('.actions'); if(!actions)return;
    const main=get('logisticsBtn');
    const oldDirect=get('logisticsBtnDirectV74');
    const oldV73=get('logisticsMenuV73');
    if(main){ if(oldDirect) oldDirect.remove(); if(oldV73) oldV73.remove(); return; }
    if(oldV73){ if(oldDirect) oldDirect.remove(); oldV73.classList.toggle('hidden',!canLogistics()); return; }
    let b=oldDirect;
    if(!b){b=document.createElement('button');b.id='logisticsBtnDirectV74';b.className='secondary';b.textContent='🚚 Database Ekspedisi';b.onclick=()=>location.href='/logistics.html';actions.appendChild(b);}
    b.classList.toggle('hidden',!canLogistics());
  }
  const baseForm=formData;
  formData=function(){const d=baseForm();d.series=String(get('fSeries')?.value||'').trim().toUpperCase();return d;};
  const baseValidate=validateIncident;
  validateIncident=function(){const m=baseValidate()||[];if(!String(get('fSeries')?.value||'').trim())m.push('Jenis Series Keramik');return [...new Set(m)];};
  const baseRpc=rpc;
  rpc=async function(fn,params={}){
    if((fn==='breakage_incident_create_v45'||fn==='breakage_incident_update_draft_v45')&&params?.p_payload){params={...params,p_payload:{...params.p_payload,ceramic_series:String(get('fSeries')?.value||'').trim().toUpperCase()}};}
    return baseRpc(fn,params);
  };
  const baseOpen=openInput;
  openInput=async function(...args){ensureSeries();const r=await baseOpen(...args);ensureSeries();setTimeout(()=>{ensureSeries();try{const d=JSON.parse(localStorage.getItem(draftKey())||'{}');if(d.series)get('fSeries').value=d.series;}catch(_){}},0);return r;};
  const baseEdit=editIncident;
  editIncident=async function(id,...args){const row=INCIDENTS.find(x=>Number(x.incident_id)===Number(id));const r=await baseEdit(id,...args);setTimeout(()=>{ensureSeries();if(get('fSeries'))get('fSeries').value=row?.ceramic_series||'';},30);return r;}; window.editIncident=editIncident;
  const baseReset=resetForm;
  resetForm=function(){baseReset();ensureSeries();if(get('fSeries'))get('fSeries').value='';};
  const baseShow=showApp;
  showApp=function(...args){const r=baseShow(...args);ensureBuild();ensureLogisticsButton();setTimeout(ensureLogisticsButton,50);return r;};
  document.addEventListener('input',e=>{if(e.target?.id==='fSeries'){e.target.value=e.target.value.toUpperCase();saveDraft();}});
  ensureBuild();ensureSeries();ensureLogisticsButton();
  [100,300,800,1500].forEach(ms=>setTimeout(()=>{ensureBuild();ensureSeries();ensureLogisticsButton();},ms));
})();
