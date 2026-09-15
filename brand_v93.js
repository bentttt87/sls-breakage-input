// SLS Breakage branding — single QUADRA + ROMAN combined logo only.
(function(){
  'use strict';
  const SRC='/brand_quadra_roman_v92.svg?v=20260915-0845';
  const $=id=>document.getElementById(id);
  let busy=false;
  function logo(width){return `<img src="${SRC}" alt="QUADRA + ROMAN" style="display:block;width:${width}px;max-width:100%;height:auto;object-fit:contain">`;}
  function apply(){
    if(busy)return;busy=true;
    try{
      const login=$('loginLogo');
      if(login){login.innerHTML=logo(205);login.style.minWidth='205px';}
      const top=document.querySelector('.topbar');
      if(top){
        [...top.children].forEach(ch=>{
          if(ch.classList?.contains('brand-v95-single'))return;
          if(ch.tagName==='IMG'||ch.querySelector?.('img')||/brand|quadra|roman/i.test(ch.className||''))ch.remove();
        });
        let wrap=top.querySelector('.brand-v95-single');
        if(!wrap){
          wrap=document.createElement('div');wrap.className='brand-v95-single';
          wrap.style.cssText='background:#fff;border-radius:8px;padding:4px 9px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;width:172px;height:52px;overflow:hidden';
          wrap.innerHTML=logo(156);top.insertBefore(wrap,top.firstChild);
        }
      }
    }finally{busy=false;}
  }
  const top=document.querySelector('.topbar');if(top)new MutationObserver(()=>setTimeout(apply,0)).observe(top,{childList:true,subtree:true});
  [20,100,300,800,1600,2800].forEach(ms=>setTimeout(apply,ms));
})();
