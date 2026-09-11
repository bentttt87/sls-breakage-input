// SLS Breakage Input v80 — remove manual Nama Pelapor input + official QUADRA ROMAN branding.
(function(){
  'use strict';
  const get=id=>document.getElementById(id);
  const BRAND_SRC='https://raw.githubusercontent.com/bentttt87/sls-wms/main/quadra-roman-logo.svg?v=20260911';
  function autoReporter(){
    const el=get('fReported');
    if(!el) return;
    const field=el.closest('.field');
    if(field) field.style.display='none';
    el.value=String(window.ACCESS?.username || window.ACCESS?.canonical_user_id || window.ACCESS?.role || 'SYSTEM').trim().toUpperCase();
  }
  function setVersion(){const b=get('buildBadge');if(b)b.textContent='v80';}
  function applyBrand(){
    const login=get('loginLogo');
    if(login) login.innerHTML=`<img src="${BRAND_SRC}" alt="QUADRA ROMAN" style="width:158px;height:auto;max-height:92px;object-fit:contain;display:block">`;
    // Add compact combined brand to the live application header without changing transaction controls.
    const top=document.querySelector('.topbar');
    if(top && !top.querySelector('.quadra-roman-header-logo')){
      const img=document.createElement('img');
      img.className='quadra-roman-header-logo';
      img.src=BRAND_SRC;
      img.alt='QUADRA ROMAN';
      img.style.width='92px';
      img.style.height='50px';
      img.style.objectFit='contain';
      img.style.background='#fff';
      img.style.borderRadius='7px';
      img.style.padding='3px';
      img.style.flex='0 0 auto';
      top.insertBefore(img,top.firstChild);
    }
    document.querySelectorAll('svg[aria-label="ROMAN"],img[alt="ROMAN"],img[alt="Roman"]').forEach(el=>{
      if(el.closest('#loginLogo') || el.classList?.contains('quadra-roman-header-logo')) return;
      const img=document.createElement('img');
      img.src=BRAND_SRC;img.alt='QUADRA ROMAN';img.style.width='96px';img.style.height='auto';img.style.objectFit='contain';
      el.replaceWith(img);
    });
  }
  const baseOpen=window.openInput;
  if(typeof baseOpen==='function') window.openInput=function(...args){const r=baseOpen.apply(this,args);autoReporter();setTimeout(autoReporter,0);return r;};
  const baseEdit=window.editIncident;
  if(typeof baseEdit==='function') window.editIncident=function(...args){const r=baseEdit.apply(this,args);autoReporter();setTimeout(autoReporter,0);return r;};
  const baseReset=window.resetForm;
  if(typeof baseReset==='function') window.resetForm=function(...args){const r=baseReset.apply(this,args);autoReporter();return r;};
  const baseValidate=window.validateIncident;
  if(typeof baseValidate==='function') window.validateIncident=function(...args){autoReporter();const m=baseValidate.apply(this,args)||[];return m.filter(x=>String(x).toLowerCase()!=='pelapor');};
  document.addEventListener('click',e=>{if(e.target?.id==='newBtn'||e.target?.id==='navInput')setTimeout(autoReporter,0)});
  autoReporter();setVersion();applyBrand();
  setTimeout(()=>{autoReporter();setVersion();applyBrand();},300);
})();
