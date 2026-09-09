// SLS Breakage Input v73 — visible SPV logistics menu + Jenis Series Keramik.
(function(){
  'use strict';
  const VERSION='v73';
  let installed=false;
  const esc73=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const get=id=>document.getElementById(id);
  const roleName=()=>String(window.ACCESS?.breakage_role||window.ACCESS?.role||'').toLowerCase();
  const canLogistics=()=>['spv','supervisor','manager','rdc_manager','master'].includes(roleName())||!!window.ACCESS?.is_manager||!!window.ACCESS?.is_master;
  const isSpv=()=>['spv','supervisor'].includes(roleName());

  function ensureBuild(){const b=get('buildBadge');if(b)b.textContent=VERSION;}
  function ensureSeriesField(){
    if(get('fSeries'))return;
    const item=get('fItem');if(!item)return;
    const field=item.closest('.field');if(!field)return;
    field.insertAdjacentHTML('afterend','<div class="field"><label>Jenis Series Keramik *</label><input id="fSeries" placeholder="Contoh: GRANITI / D-BALTIMORE / ROMAN GRES"></div>');
    try{window.bindDraftInputs?.();}catch(_){ }
  }
  function ensureLogisticsMenu(){
    const actions=document.querySelector('.actions');if(!actions)return;
    let btn=get('logisticsMenuV73');
    if(!btn){
      btn=document.createElement('button');btn.id='logisticsMenuV73';btn.className='secondary';btn.innerHTML='🚚 Database Ekspedisi';
      btn.onclick=()=>{window.location.href='/logistics.html';};actions.appendChild(btn);
    }
    btn.classList.toggle('hidden',!canLogistics());
    if(canLogistics()&&!get('logisticsTopV73')){
      const top=document.querySelector('.topbar .grow');if(top){const t=document.createElement('button');t.id='logisticsTopV73';t.className='top-btn';t.textContent='Database Ekspedisi';t.onclick=()=>{window.location.href='/logistics.html';};top.insertAdjacentElement('afterend',t);}
    }
    const t=get('logisticsTopV73');if(t)t.classList.toggle('hidden',!canLogistics());
  }
  function install(){
    if(installed)return;
    if(typeof window.rpc!=='function'||typeof window.formData!=='function'||typeof window.validateIncident!=='function')return;
    installed=true;
    ensureBuild();ensureSeriesField();ensureLogisticsMenu();

    const baseRpc=window.rpc;
    window.rpc=async function(fn,params={}){
      if((fn==='breakage_incident_create_v45'||fn==='breakage_incident_update_draft_v45')&&params?.p_payload){
        params={...params,p_payload:{...params.p_payload,ceramic_series:String(get('fSeries')?.value||'').trim().toUpperCase()}};
      }
      return baseRpc(fn,params);
    };

    const baseFormData=window.formData;
    window.formData=function(){const d=baseFormData();d.series=String(get('fSeries')?.value||'').trim().toUpperCase();return d;};

    const baseValidate=window.validateIncident;
    window.validateIncident=function(){const m=baseValidate()||[];if(!String(get('fSeries')?.value||'').trim())m.push('Jenis Series Keramik');return [...new Set(m)];};

    if(typeof window.restoreDraft==='function'){
      const baseRestore=window.restoreDraft;
      window.restoreDraft=function(){baseRestore();ensureSeriesField();try{const d=JSON.parse(localStorage.getItem(window.draftKey())||'{}');if(d.series)get('fSeries').value=d.series;}catch(_){}};
    }
    if(typeof window.resetForm==='function'){
      const baseReset=window.resetForm;
      window.resetForm=function(){baseReset();ensureSeriesField();if(get('fSeries'))get('fSeries').value='';};
    }
    if(typeof window.openInput==='function'){
      const baseOpen=window.openInput;
      window.openInput=async function(...args){ensureSeriesField();const r=await baseOpen(...args);ensureSeriesField();setTimeout(()=>{ensureSeriesField();try{const d=JSON.parse(localStorage.getItem(window.draftKey())||'{}');if(d.series)get('fSeries').value=d.series;}catch(_){ }},0);return r;};
    }
    if(typeof window.editIncident==='function'){
      const baseEdit=window.editIncident;
      window.editIncident=async function(id,...args){const row=(window.INCIDENTS||[]).find(x=>Number(x.incident_id)===Number(id));const r=await baseEdit(id,...args);setTimeout(()=>{ensureSeriesField();if(get('fSeries'))get('fSeries').value=row?.ceramic_series||'';},30);return r;};window.editIncident=window.editIncident;
    }
    if(typeof window.viewIncident==='function'){
      const baseView=window.viewIncident;
      window.viewIncident=async function(id,...args){const row=(window.INCIDENTS||[]).find(x=>Number(x.incident_id)===Number(id));const r=await baseView(id,...args);if(row?.ceramic_series&&get('reviewDetails')&&!get('reviewSeriesV73')){get('reviewDetails').insertAdjacentHTML('beforeend',`<div class="field" id="reviewSeriesV73"><label>Jenis Series Keramik</label><div>${esc73(row.ceramic_series)}</div></div>`);}return r;};window.viewIncident=window.viewIncident;
    }

    const baseShow=window.showApp;
    if(typeof baseShow==='function')window.showApp=function(...args){const r=baseShow(...args);ensureBuild();ensureLogisticsMenu();return r;};

    document.addEventListener('input',e=>{if(e.target?.id==='fSeries'){e.target.value=e.target.value.toUpperCase();try{window.saveDraft?.();}catch(_){}}});
    setTimeout(()=>{ensureBuild();ensureSeriesField();ensureLogisticsMenu();},100);
    setTimeout(()=>{ensureBuild();ensureSeriesField();ensureLogisticsMenu();},700);
  }

  const timer=setInterval(()=>{install();ensureBuild();ensureSeriesField();ensureLogisticsMenu();if(installed&&window.ACCESS)clearInterval(timer);},120);
  setTimeout(()=>{clearInterval(timer);install();ensureBuild();ensureSeriesField();ensureLogisticsMenu();},4000);
})();
