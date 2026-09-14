// SLS Breakage Input v91 — single BA+Foto document + official QUADRA ROMAN branding.
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const BRAND_SRC='https://raw.githubusercontent.com/bentttt87/sls-wms/main/quadra-roman-logo.svg?v=20260914-1617';

  function applyBrand(){
    const login=$('loginLogo');
    if(login) login.innerHTML=`<img src="${BRAND_SRC}" alt="QUADRA ROMAN" style="width:172px;max-width:100%;height:auto;max-height:116px;object-fit:contain;display:block">`;
    const top=document.querySelector('.topbar');
    if(top){
      let img=top.querySelector('.quadra-roman-v91');
      if(!img){img=document.createElement('img');img.className='quadra-roman-v91';img.alt='QUADRA ROMAN';img.style.cssText='width:102px;height:52px;object-fit:contain;background:#fff;border-radius:7px;padding:2px;flex:0 0 auto';top.insertBefore(img,top.firstChild)}
      img.src=BRAND_SRC;
    }
    document.querySelectorAll('svg[aria-label="ROMAN"],img[alt="ROMAN"],img[alt="Roman"]').forEach(el=>{
      if(el.classList?.contains('quadra-roman-v91')||el.closest('#loginLogo'))return;
      const img=document.createElement('img');img.src=BRAND_SRC;img.alt='QUADRA ROMAN';img.style.cssText='width:104px;height:auto;object-fit:contain';el.replaceWith(img);
    });
  }

  function singleFileUi(){
    // v90 bulk Excel+photo export is intentionally removed. BA picker now produces one BA+photo document.
    $('exportBreakageBtn')?.remove();$('exportBreakageModal')?.remove();
    const btn=$('baPickerBtn');if(btn)btn.textContent='⬇ Download BA + Foto';
    const run=$('baPickerPrint');if(run)run.textContent=run.disabled?'⬇ Pilih BA dahulu':'⬇ Buka BA + Foto';
    const title=document.querySelector('#baPickerModal .modal-head h2');if(title)title.textContent='Download Berita Acara + Lampiran Foto';
    const sub=document.querySelector('#baPickerModal .modal-head .small');if(sub)sub.textContent='Pilih BA. Berita Acara dan seluruh foto evidence disatukan dalam satu dokumen PDF.';
    const hint=$('baPickerInfo');if(hint&&hint.style.display!=='none'&&!/satu dokumen/i.test(hint.textContent||''))hint.insertAdjacentHTML('beforeend','<br><span class="smallnote">Output: 1 dokumen BA + seluruh lampiran foto.</span>');
    const b=$('buildBadge');if(b)b.textContent='v91';
  }

  document.addEventListener('click',e=>{
    if(['baPickerBtn','baPickerReload','baPickerSelect','baPickerPrint'].includes(e.target?.id))setTimeout(singleFileUi,30);
  },true);
  document.addEventListener('change',e=>{if(e.target?.id==='baPickerSelect')setTimeout(singleFileUi,20)},true);
  [60,180,500,1200,2500].forEach(ms=>setTimeout(()=>{applyBrand();singleFileUi()},ms));
})();
