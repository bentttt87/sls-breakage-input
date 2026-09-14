// SLS Breakage branding v92 — exact QUADRA + ROMAN logos from uploaded artwork.
(function(){
'use strict';
const SRC='/brand_quadra_roman_v92.svg?v=20260914-1705';
const $=id=>document.getElementById(id);
function img(width){return `<img src="${SRC}" alt="QUADRA ROMAN" style="display:block;width:${width}px;max-width:100%;height:auto;object-fit:contain">`}
function apply(){
  const login=$('loginLogo');if(login)login.innerHTML=img(190);
  const top=document.querySelector('.topbar');
  if(top){
    top.querySelectorAll('.quadra-roman-v91,.brand-pair-v92,.brand-v92-app').forEach(x=>x.remove());
    const wrap=document.createElement('div');wrap.className='brand-v92-app';wrap.style.cssText='background:#fff;border-radius:8px;padding:3px 7px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;width:145px;height:48px;overflow:hidden';wrap.innerHTML=img(132);top.insertBefore(wrap,top.firstChild);
  }
  document.querySelectorAll('svg[aria-label="ROMAN"],img[alt="ROMAN"],img[alt="Roman"]').forEach(el=>{if(el.closest('#loginLogo,.brand-v92-app'))return;const w=document.createElement('div');w.style.cssText='display:flex;align-items:center;justify-content:center;width:120px';w.innerHTML=img(112);el.replaceWith(w)});
  const b=$('buildBadge');if(b)b.textContent='v92';
}
[30,120,350,900,1800].forEach(ms=>setTimeout(apply,ms));
})();
