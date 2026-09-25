// SLS Breakage BA v117 — render digital driver signature on printed BA.
(function(){
  'use strict';
  if(window.__SLS_BA_SIG_V117__) return;
  window.__SLS_BA_SIG_V117__=true;

  const qs=new URLSearchParams(location.search),key=qs.get('k');
  let data=null;try{data=JSON.parse(localStorage.getItem(key)||'null')}catch(_){ }
  if(!data)return;
  const items=Array.isArray(data.items)?data.items:[];
  const path=data.driver_signature_path||items.find(x=>x&&x.driver_signature_path)?.driver_signature_path||'';
  if(!path)return;

  function getSession(){for(const k of ['sls_breakage_input_session','sls_breakage_session']){try{const s=JSON.parse(sessionStorage.getItem(k)||'null');if(s?.access_token)return s}catch(_){}}return null}
  async function loadBlob(){
    const s=getSession();if(!s?.access_token)throw new Error('Sesi login tidak ditemukan');
    const base=(typeof SUPABASE_URL!=='undefined'?SUPABASE_URL:'https://mfdckngkvjnemwgmkiiv.supabase.co');
    const anon=(typeof PUBLIC_ANON!=='undefined'?PUBLIC_ANON:'');
    const encoded=String(path).split('/').map(encodeURIComponent).join('/');
    const r=await fetch(`${base}/storage/v1/object/authenticated/breakage-evidence/${encoded}`,{headers:{apikey:anon,Authorization:`Bearer ${s.access_token}`},cache:'no-store'});
    if(!r.ok)throw new Error('Paraf driver tidak dapat dimuat');
    return URL.createObjectURL(await r.blob());
  }
  function style(){
    if(document.getElementById('v117BaSigStyle'))return;
    const s=document.createElement('style');s.id='v117BaSigStyle';s.textContent='.v117-driver-signature{height:17mm;display:flex;align-items:center;justify-content:center}.v117-driver-signature img{display:block;max-width:42mm;max-height:15mm;object-fit:contain}.v117-driver-digital{font-size:7pt;color:#666;margin-top:.5mm}';document.head.appendChild(s);
  }
  async function apply(){
    const boxes=document.querySelectorAll('.sigs .sigbox');if(boxes.length<2)return false;
    const box=boxes[1];if(box.dataset.v117sig==='1')return true;
    box.dataset.v117sig='1';style();
    const space=box.querySelector('.sig-space');if(!space)return false;
    try{
      const url=await loadBlob();
      space.className='sig-space v117-driver-signature';
      space.innerHTML=`<img src="${url}" alt="Paraf digital driver">`;
      const line=box.querySelector('.sig-line');if(line)line.innerHTML='( Paraf Digital Driver )';
      const note=document.createElement('div');note.className='v117-driver-digital';note.textContent='Paraf direkam melalui SLS Breakage Input';
      box.appendChild(note);
      return true;
    }catch(e){
      box.dataset.v117sig='0';
      console.warn('[BA v117] signature load failed',e);
      return false;
    }
  }
  let tries=0;const timer=setInterval(async()=>{tries++;const ok=await apply();if(ok||tries>20)clearInterval(timer)},150);
})();
