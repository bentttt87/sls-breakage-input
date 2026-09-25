// SLS Breakage BA v118 — robust digital driver signature rendering.
(function(){
  'use strict';
  if(window.__SLS_BA_SIG_V118__) return;
  window.__SLS_BA_SIG_V118__=true;

  const SUPABASE='https://mfdckngkvjnemwgmkiiv.supabase.co';
  const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Im1mZGNrbmdrdmpuZW13Z21raWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMDcxMjUsImV4cCI6MjEwMTU4MzEyNX0.mFhv9hgQvjzg6AYfmEI2GiJ71I2xSkOozC43mwFcogU';
  const qs=new URLSearchParams(location.search),key=qs.get('k');
  let data=null;try{data=JSON.parse(localStorage.getItem(key)||'null')}catch(_){ }
  if(!data)return;
  const items=Array.isArray(data.items)?data.items:[];
  const path=data.driver_signature_path||items.find(x=>x&&x.driver_signature_path)?.driver_signature_path||'';
  if(!path)return;

  function parseSession(raw){try{const s=JSON.parse(raw||'null');return s?.access_token?s:null}catch(_){return null}}
  function getSession(){
    for(const k of ['sls_breakage_input_session','sls_breakage_session']){
      const local=parseSession(sessionStorage.getItem(k));if(local)return local;
      try{const op=window.opener&&window.opener.sessionStorage?parseSession(window.opener.sessionStorage.getItem(k)):null;if(op){try{sessionStorage.setItem(k,JSON.stringify(op))}catch(_){ }return op}}catch(_){ }
    }
    return null;
  }
  async function loadBlob(){
    const s=getSession();if(!s)throw new Error('Sesi login tidak ditemukan');
    const encoded=String(path).split('/').map(encodeURIComponent).join('/');
    const r=await fetch(`${SUPABASE}/storage/v1/object/authenticated/breakage-evidence/${encoded}`,{headers:{apikey:ANON,Authorization:`Bearer ${s.access_token}`},cache:'no-store'});
    if(!r.ok)throw new Error(`Paraf driver tidak dapat dimuat (${r.status})`);
    return URL.createObjectURL(await r.blob());
  }
  function ensureStyle(){
    if(document.getElementById('v118BaSigStyle'))return;
    const s=document.createElement('style');s.id='v118BaSigStyle';s.textContent='@media print{.v118-driver-signature img{display:block!important}}.v118-driver-signature{height:17mm;display:flex;align-items:center;justify-content:center}.v118-driver-signature img{display:block;max-width:42mm;max-height:15mm;object-fit:contain}.v118-driver-digital{font-size:7pt;color:#666;margin-top:.5mm}.v118-driver-warn{font-size:7pt;color:#b42318;margin-top:1mm}';document.head.appendChild(s);
  }
  async function apply(){
    const boxes=document.querySelectorAll('.sigs .sigbox');if(boxes.length<2)return false;
    const box=boxes[1],space=box.querySelector('.sig-space');if(!space)return false;
    if(box.dataset.v118sig==='ok')return true;
    ensureStyle();
    try{
      const url=await loadBlob();
      const img=new Image();img.alt='Paraf digital driver';img.src=url;
      await new Promise((res,rej)=>{img.onload=res;img.onerror=rej});
      space.className='sig-space v118-driver-signature';space.innerHTML='';space.appendChild(img);
      const line=box.querySelector('.sig-line');if(line)line.textContent='( Paraf Digital Driver )';
      let note=box.querySelector('.v118-driver-digital');if(!note){note=document.createElement('div');note.className='v118-driver-digital';box.appendChild(note)}note.textContent='Paraf direkam melalui SLS Breakage Input';
      box.querySelector('.v118-driver-warn')?.remove();
      box.dataset.v118sig='ok';
      return true;
    }catch(e){
      box.dataset.v118sig='retry';
      console.warn('[BA v118] signature load failed',e);
      return false;
    }
  }
  let tries=0;const timer=setInterval(async()=>{tries++;const ok=await apply();if(ok||tries>=20){clearInterval(timer);if(!ok){const box=document.querySelectorAll('.sigs .sigbox')[1];if(box&&!box.querySelector('.v118-driver-warn')){const n=document.createElement('div');n.className='v118-driver-warn';n.textContent='Paraf digital belum dapat dimuat. Buka ulang Print BA.';box.appendChild(n)}}}},200);
})();
