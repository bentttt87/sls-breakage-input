// SLS Breakage Input v85 — Warehouse Operator has same Breakage Input authority as Admin RDC.
(function(){
  'use strict';
  const get=id=>document.getElementById(id);
  function roleName(){
    let role='';try{role=String(ACCESS?.role||'').toLowerCase()}catch(_){ }
    if(role==='staff')return 'OPERATOR WAREHOUSE';
    if(role==='admin')return 'ADMIN RDC';
    if(role==='operator')return 'OPERATOR WAREHOUSE';
    return String((ACCESS?.breakage_role||ACCESS?.role||'')).toUpperCase();
  }
  function apply(){
    let can=false,rdc='';try{can=!!ACCESS?.can_input;rdc=ACCESS?.rdc_name||''}catch(_){ }
    const badge=get('buildBadge');if(badge)badge.textContent='v85';
    const chip=get('roleChip');if(chip&&can)chip.textContent=roleName();
    const who=get('who');if(who&&can)who.textContent=roleName()+' · '+rdc;
    const inputIdentity=get('inputIdentity');if(inputIdentity&&can&&inputIdentity.textContent.includes('ADMIN'))inputIdentity.textContent=roleName()+' · '+rdc;
    const roleMsg=get('roleMsg');if(roleMsg&&can)roleMsg.innerHTML='<b>Admin / Operator Warehouse RDC:</b> dapat input breakage, melihat riwayat RDC, mengedit Draft/Returned dalam RDC, dan Print BA. Approval tetap dilakukan SPV.';
    const hero=document.querySelector('.hero p');
    if(hero)hero.textContent='Admin dan Operator Warehouse RDC membuat Draft. SPV memeriksa detail dan foto, kemudian Approve atau Return. Master melakukan review final di Breakage Monitoring.';
  }
  try{
    const baseShowApp=showApp;
    showApp=function(){const r=baseShowApp.apply(this,arguments);setTimeout(apply,0);return r;};
  }catch(_){ }
  try{
    const baseOpenInput=openInput;
    openInput=async function(){const r=await baseOpenInput.apply(this,arguments);setTimeout(apply,0);return r;};
  }catch(_){ }
  [80,250,700,1400].forEach(ms=>setTimeout(apply,ms));
})();
