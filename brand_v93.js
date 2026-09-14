// SLS Breakage branding v93 — use the exact user-approved QUADRA + ROMAN artwork together, without cropping or overlap.
(function(){
  'use strict';
  const SRC='/brand_quadra_roman_v92.svg?v=20260914-2035';
  const $=id=>document.getElementById(id);
  function logo(width){return `<img src="${SRC}" alt="QUADRA + ROMAN" style="display:block;width:${width}px;max-width:100%;height:auto;object-fit:contain">`;}
  function apply(){
    const login=$('loginLogo');
    if(login){login.innerHTML=logo(205);login.style.minWidth='205px';}
    const top=document.querySelector('.topbar');
    if(top){
      top.querySelectorAll('.quadra-roman-v91,.brand-pair-v92,.brand-v92-app,.brand-v93-app').forEach(x=>x.remove());
      const wrap=document.createElement('div');
      wrap.className='brand-v93-app';
      wrap.style.cssText='background:#fff;border-radius:8px;padding:3px 7px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;width:170px;height:50px;overflow:hidden';
      wrap.innerHTML=logo(154);top.insertBefore(wrap,top.firstChild);
    }
    const b=$('buildBadge');if(b)b.textContent='v93';
  }
  [20,100,300,800,1600].forEach(ms=>setTimeout(apply,ms));
})();