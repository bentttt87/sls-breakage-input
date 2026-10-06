// SLS Breakage Input v120 — SPV motif type + automatic factory from Batch/Series.
(function(){
  'use strict';
  if(window.__SLS_BREAKAGE_REFINEMENT_V120__) return;
  window.__SLS_BREAKAGE_REFINEMENT_V120__=true;
  const $=id=>document.getElementById(id);
  const up=v=>String(v??'').trim().toUpperCase();

  function deriveFactory(series){
    const p=up(series).charAt(0);
    return p==='S'?'SRKI':p==='R'?'RCI':'';
  }
  function isSpv(){try{return !!ACCESS?.can_submit_approve&&!ACCESS?.is_master}catch(_){return false}}

  function hideFactoryField(inputId,seriesId,noteId){
    const el=$(inputId),series=$(seriesId); if(!el||!series)return;
    const factory=deriveFactory(series.value);
    if(factory)el.value=factory;
    const field=el.closest('.field'); if(field)field.style.display='none';
    const sField=series.closest('.field');
    if(sField&&!$(noteId)){
      sField.insertAdjacentHTML('beforeend','<div id="'+noteId+'" class="smallnote" style="margin-top:5px;color:#52647a">Pabrik Asal otomatis dari Batch/Series: <b>'+(factory||'menunggu awalan S/R')+'</b></div>');
    }else if($(noteId)){
      $(noteId).innerHTML='Pabrik Asal otomatis dari Batch/Series: <b>'+(factory||'menunggu awalan S/R')+'</b>';
    }
  }
  function relabelRemark(){
    ['fCauseDetail','cCauseDetail'].forEach(id=>{
      const el=$(id),field=el?.closest('.field'); if(!field)return;
      const l=field.querySelector('label'); if(l)l.textContent='Remark / Keterangan';
    });
  }
  function syncAutoFactory(){
    hideFactoryField('fFactory','fSeries','autoFactoryNote120');
    hideFactoryField('cFactory','cSeries','autoFactoryNoteC120');
    relabelRemark();
  }

  // Ensure payload always carries derived factory even though user no longer inputs it.
  try{
    const baseFormData=formData;
    formData=function(){
      const d=baseFormData.apply(this,arguments)||{};
      const factory=deriveFactory($('fSeries')?.value||d.series||d.ceramic_series||'');
      if(factory)d.factory=factory;
      return d;
    };
    window.formData=formData;
  }catch(_){}

  // Auto-sync hidden factory whenever Batch/Series changes.
  document.addEventListener('input',e=>{
    if(e.target?.id==='fSeries'){
      const f=$('fFactory'); if(f){const v=deriveFactory(e.target.value);if(v)f.value=v;}
      syncAutoFactory();
    }
    if(e.target?.id==='cSeries'){
      const f=$('cFactory'); if(f){const v=deriveFactory(e.target.value);if(v)f.value=v;}
      syncAutoFactory();
    }
  },true);
  document.addEventListener('change',e=>{
    if(['fSeries','cSeries'].includes(e.target?.id))syncAutoFactory();
  },true);

  async function setMotifType(id,value,sel){
    const old=sel.dataset.last||'Motif Standard';
    sel.disabled=true;
    try{
      await rpc('breakage_incident_set_motif_type_v120',{p_incident_id:Number(id),p_motif_type:value});
      sel.dataset.last=value;
      try{
        const row=INCIDENTS.find(x=>Number(x.incident_id)===Number(id));if(row)row.motif_type=value;
      }catch(_){}
      sel.style.borderColor='#12a150';
    }catch(e){
      sel.value=old;
      sel.style.borderColor='#c42d26';
      alert('Gagal menyimpan Motif Type: '+cleanErr(e.message||e));
    }finally{
      sel.disabled=false;
      setTimeout(()=>{sel.style.borderColor='';},1200);
    }
  }

  function addSpvMotifDropdowns(){
    if(!isSpv())return;
    const body=$('historyBody'); if(!body)return;
    const trs=[...body.querySelectorAll('tr')];
    let rows=[];try{rows=(Array.isArray(INCIDENTS)?INCIDENTS:[]).slice(0,60)}catch(_){}
    rows.forEach((r,i)=>{
      const tr=trs[i],td=tr?.lastElementChild;if(!td||td.querySelector('[data-motif-v120]'))return;
      const wrap=document.createElement('div');
      wrap.dataset.motifV120='1';
      wrap.style.cssText='display:flex;align-items:center;gap:4px;margin-bottom:5px;justify-content:flex-end';
      const sel=document.createElement('select');
      sel.className='mini';
      sel.title='Motif / Keterangan Standar';
      sel.style.cssText='min-width:118px;max-width:145px;padding:5px 6px;border:1px solid #b8c8da;border-radius:6px;background:white;font-size:10px';
      sel.innerHTML='<option value="Motif Standard">Motif Standard</option><option value="Motif TP">Motif TP</option>';
      sel.value=r.motif_type||'Motif Standard';
      sel.dataset.last=sel.value;
      sel.onchange=()=>setMotifType(r.incident_id,sel.value,sel);
      wrap.appendChild(sel);
      td.insertBefore(wrap,td.firstChild);
    });
  }

  try{
    const baseRenderHistory=renderHistory;
    renderHistory=function(){
      const r=baseRenderHistory.apply(this,arguments);
      setTimeout(()=>{addSpvMotifDropdowns();syncAutoFactory();},0);
      return r;
    };
    window.renderHistory=renderHistory;
  }catch(_){}

  // Re-run after dynamic modal/history render.
  const obs=new MutationObserver(()=>setTimeout(()=>{syncAutoFactory();addSpvMotifDropdowns();},0));
  obs.observe(document.body,{childList:true,subtree:true});
  [80,250,700,1500,3000].forEach(ms=>setTimeout(()=>{
    syncAutoFactory();addSpvMotifDropdowns();
    const b=$('buildBadge');if(b)b.textContent='v120';
  },ms));
})();