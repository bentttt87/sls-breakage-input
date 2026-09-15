// SLS Breakage Input v105 — lightweight UI guard. No recursive DOM observer.
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const SRC='/brand_quadra_roman_v92.svg?v=20260915-1148';
  function enforce(){
    const top=document.querySelector('.topbar');
    if(top){
      const logos=[...top.querySelectorAll('.brand-v97-single,.quadra-roman-v91')];
      logos.slice(1).forEach(x=>x.remove());
      let one=top.querySelector('.brand-v97-single');
      if(!one){one=document.createElement('div');one.className='brand-v97-single';one.style.cssText='background:#fff;border-radius:8px;padding:4px 9px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;width:172px;height:52px;overflow:hidden';one.innerHTML=`<img src="${SRC}" alt="QUADRA + ROMAN" style="display:block;width:156px;height:auto;max-height:44px;object-fit:contain">`;top.insertBefore(one,top.firstChild)}
    }
    const ba=$('baPickerBtn');if(ba){ba.style.display='';ba.textContent='⬇ Download BA + Foto'}
    const badge=$('buildBadge');if(badge)badge.textContent='v105';
  }
  [40,180,500,1200,2500].forEach(ms=>setTimeout(enforce,ms));
  document.addEventListener('click',e=>{if(['refreshBtn','newBtn','logisticsBtn'].includes(e.target?.id))setTimeout(enforce,120)},false);
})();