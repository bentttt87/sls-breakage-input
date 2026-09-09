// SLS Breakage Input v80 — remove manual Nama Pelapor input.
(function(){
  'use strict';
  const get=id=>document.getElementById(id);
  function autoReporter(){
    const el=get('fReported');
    if(!el) return;
    const field=el.closest('.field');
    if(field) field.style.display='none';
    el.value=String(window.ACCESS?.username || window.ACCESS?.canonical_user_id || window.ACCESS?.role || 'SYSTEM').trim().toUpperCase();
  }
  function setVersion(){const b=get('buildBadge');if(b)b.textContent='v80';}
  const baseOpen=window.openInput;
  if(typeof baseOpen==='function') window.openInput=function(...args){const r=baseOpen.apply(this,args);autoReporter();setTimeout(autoReporter,0);return r;};
  const baseEdit=window.editIncident;
  if(typeof baseEdit==='function') window.editIncident=function(...args){const r=baseEdit.apply(this,args);autoReporter();setTimeout(autoReporter,0);return r;};
  const baseReset=window.resetForm;
  if(typeof baseReset==='function') window.resetForm=function(...args){const r=baseReset.apply(this,args);autoReporter();return r;};
  const baseValidate=window.validateIncident;
  if(typeof baseValidate==='function') window.validateIncident=function(...args){autoReporter();const m=baseValidate.apply(this,args)||[];return m.filter(x=>String(x).toLowerCase()!=='pelapor');};
  document.addEventListener('click',e=>{if(e.target?.id==='newBtn'||e.target?.id==='navInput')setTimeout(autoReporter,0)});
  autoReporter();setVersion();
  setTimeout(()=>{autoReporter();setVersion();},300);
})();
