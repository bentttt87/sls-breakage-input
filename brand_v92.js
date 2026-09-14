// SLS Breakage branding v92 — display QUADRA and ROMAN as two distinct official logos.
(function(){
  'use strict';
  const SRC='https://raw.githubusercontent.com/bentttt87/sls-wms/main/quadra-roman-logo.svg?v=20260914-1645';
  const $=id=>document.getElementById(id);
  function quadraSvg(w=92){return `<svg viewBox="0 0 600 160" width="${w}" role="img" aria-label="QUADRA" style="display:block;height:auto"><image href="${SRC}" x="0" y="0" width="600" height="344" preserveAspectRatio="xMidYMid meet"/></svg>`}
  function romanSvg(w=92){return `<svg viewBox="0 205 600 139" width="${w}" role="img" aria-label="ROMAN" style="display:block;height:auto"><image href="${SRC}" x="0" y="0" width="600" height="344" preserveAspectRatio="xMidYMid meet"/></svg>`}
  function pairHtml(w=92,stack=false){return `<div class="brand-pair-v92" style="display:flex;${stack?'flex-direction:column;':''}align-items:center;justify-content:center;gap:${stack?'4px':'10px'};flex:0 0 auto">${quadraSvg(w)}${romanSvg(w)}</div>`}
  function apply(){
    const login=$('loginLogo');if(login)login.innerHTML=pairHtml(132,true);
    const top=document.querySelector('.topbar');
    if(top){
      top.querySelectorAll('.quadra-roman-v91,.brand-pair-v92').forEach(x=>x.remove());
      const wrap=document.createElement('div');wrap.innerHTML=pairHtml(82,false);const p=wrap.firstElementChild;p.style.background='#fff';p.style.borderRadius='8px';p.style.padding='3px 7px';p.style.minWidth='178px';top.insertBefore(p,top.firstChild);
    }
    document.querySelectorAll('svg[aria-label="ROMAN"],img[alt="ROMAN"],img[alt="Roman"],img[alt="QUADRA ROMAN"]').forEach(el=>{
      if(el.closest('.brand-pair-v92')||el.closest('#loginLogo'))return;
      const wrap=document.createElement('div');wrap.innerHTML=pairHtml(70,false);el.replaceWith(wrap.firstElementChild);
    });
    const b=$('buildBadge');if(b)b.textContent='v92';
  }
  [30,120,350,900,1800].forEach(ms=>setTimeout(apply,ms));
})();
