// SLS Breakage Input v95 — final UI guard: one logo + Print BA visibility + version badge.
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const SRC='/brand_quadra_roman_v92.svg?v=20260915-0845';
  let busy=false;
  function enforce(){
    if(busy)return;busy=true;
    try{
      const top=document.querySelector('.topbar');
      if(top){
        const logoNodes=[...top.children].filter(ch=>ch.tagName==='IMG'||ch.querySelector?.('img')||/brand|quadra|roman/i.test(ch.className||''));
        logoNodes.forEach(ch=>{if(!ch.classList?.contains('brand-v95-single'))ch.remove();});
        let one=top.querySelector('.brand-v95-single');
        if(!one){one=document.createElement('div');one.className='brand-v95-single';one.style.cssText='background:#fff;border-radius:8px;padding:4px 9px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;width:172px;height:52px;overflow:hidden';one.innerHTML=`<img src="${SRC}" alt="QUADRA + ROMAN" style="display:block;width:156px;height:auto;max-height:44px;object-fit:contain">`;top.insertBefore(one,top.firstChild);}
      }
      const ba=$('baPickerBtn');if(ba){ba.style.display='';ba.textContent='🖨 Print BA';}
      const run=$('baPickerPrint');if(run&&!run.disabled)run.textContent='🖨 Print BA';
      const badge=$('buildBadge');if(badge)badge.textContent='v95';
    }finally{busy=false;}
  }
  const app=$('app');if(app)new MutationObserver(()=>setTimeout(enforce,0)).observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  [30,100,250,600,1200,1800,2600,4000].forEach(ms=>setTimeout(enforce,ms));
})();
