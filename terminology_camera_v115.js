// SLS Breakage Input v115 — stability hotfix.
// Goals: keep canonical terminology, direct mobile camera, and prevent login UI freeze.
// Backend values remain delivery/warehouse for compatibility.
(function(){
  'use strict';
  if(window.__SLS_BREAKAGE_V115__) return;
  window.__SLS_BREAKAGE_V115__=true;

  const $=id=>document.getElementById(id);
  const TYPE_LABEL={
    delivery:'Pecah Kirim', kiriman:'Pecah Kirim', pengiriman:'Pecah Kirim',
    'pecah kiriman':'Pecah Kirim','pecah pengiriman':'Pecah Kirim','pecah kirim':'Pecah Kirim',
    warehouse:'Pecah Pallet', gudang:'Pecah Pallet','pecah gudang':'Pecah Pallet',
    'pecah dalam pallet':'Pecah Pallet','pecah pallet':'Pecah Pallet',
    receiving:'Penerimaan', penerimaan:'Penerimaan'
  };
  function mappedType(v){
    const raw=String(v??'').trim();
    return TYPE_LABEL[raw.toLowerCase()]||raw;
  }

  // Use canonical labels at render time so history does not need expensive DOM rescans.
  try{typeLabel=mappedType;}catch(_){ }
  window.typeLabel=mappedType;
  window.slsBreakageTypeLabel=mappedType;

  const exact=new Map([
    ['Kiriman','Pecah Kirim'],['Pengiriman','Pecah Kirim'],['Pecah Kiriman','Pecah Kirim'],['Pecah Pengiriman','Pecah Kirim'],
    ['Gudang','Pecah Pallet'],['Pecah Gudang','Pecah Pallet'],['Pecah Dalam Pallet','Pecah Pallet'],['Pecah dalam Pallet','Pecah Pallet'],
    ['Rasio Pecah Pengiriman','Rasio Pecah Kirim'],['Rasio Pecah Kiriman','Rasio Pecah Kirim'],['Rasio Pecah Gudang','Rasio Pecah Pallet'],
    ['Kejadian Gudang','Kejadian Pecah Pallet']
  ]);
  const phrases=[
    ['Pecah Pengiriman','Pecah Kirim'],['Pecah Kiriman','Pecah Kirim'],['Pecah Gudang','Pecah Pallet'],
    ['Pecah Dalam Pallet','Pecah Pallet'],['Pecah dalam Pallet','Pecah Pallet'],
    ['Rasio Pengiriman','Rasio Pecah Kirim'],['Rasio Gudang','Rasio Pecah Pallet']
  ];
  function normalizeText(text){
    const raw=String(text??'');
    const trimmed=raw.trim();
    if(!trimmed) return raw;
    const lead=(raw.match(/^\s*/)||[''])[0],trail=(raw.match(/\s*$/)||[''])[0];
    if(exact.has(trimmed)) return lead+exact.get(trimmed)+trail;
    let out=trimmed;
    for(const [from,to] of phrases) out=out.split(from).join(to);
    return lead+out+trail;
  }
  function normalizeSubtree(root){
    if(!root) return;
    if(root.nodeType===Node.TEXT_NODE){
      const next=normalizeText(root.nodeValue);
      if(next!==root.nodeValue) root.nodeValue=next;
      return;
    }
    if(root.nodeType!==Node.ELEMENT_NODE && root!==document.body) return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
      const p=node.parentElement;
      if(!p||['SCRIPT','STYLE','NOSCRIPT','TEXTAREA'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    for(const n of nodes){const next=normalizeText(n.nodeValue);if(next!==n.nodeValue)n.nodeValue=next;}
  }

  // ---------- Direct camera ----------
  let stream=null;
  let facing='environment';
  function stopStream(){
    try{if(stream)stream.getTracks().forEach(t=>t.stop());}catch(_){ }
    stream=null;
    const v=$('v115CameraVideo');if(v)v.srcObject=null;
  }
  function closeCamera(){stopStream();$('v115CameraOverlay')?.classList.remove('show');}
  function ensureCameraUI(){
    if($('v115CameraOverlay')) return;
    const style=document.createElement('style');
    style.id='v115CameraStyle';
    style.textContent=`#v115CameraOverlay{position:fixed;inset:0;z-index:9000;background:#071525;display:none;flex-direction:column;color:#fff;font-family:Arial,sans-serif}#v115CameraOverlay.show{display:flex}#v115CameraOverlay .v115-head{display:flex;align-items:center;padding:calc(10px + env(safe-area-inset-top)) 14px 10px;background:#0b4f94}#v115CameraOverlay .v115-head b{font-size:18px}.v115-close{margin-left:auto;width:44px;height:44px;border:0;border-radius:12px;background:rgba(255,255,255,.16);color:#fff;font-size:28px}#v115CameraOverlay .v115-stage{flex:1;display:flex;align-items:center;justify-content:center;min-height:0;background:#000;overflow:hidden}#v115CameraVideo{width:100%;height:100%;object-fit:contain;background:#000}#v115CameraOverlay .v115-foot{display:grid;grid-template-columns:1fr 1.35fr 1fr;gap:10px;padding:12px 12px calc(12px + env(safe-area-inset-bottom));background:#fff}#v115CameraOverlay .v115-foot button{min-height:54px;border-radius:12px;font-size:15px;font-weight:900}#v115Flip{background:#fff;border:1px solid #8aa8c7;color:#0b4f94}#v115Snap{background:#0877d1;border:0;color:#fff;font-size:17px}#v115Cancel{background:#fff;border:1px solid #d0d8e2;color:#425b78}#v115CameraNote{position:absolute;left:12px;right:12px;bottom:92px;text-align:center;font-size:12px;color:#fff;text-shadow:0 1px 2px #000;background:rgba(0,0,0,.30);padding:6px 8px;border-radius:8px;pointer-events:none}`;
    document.head.appendChild(style);
    const root=document.createElement('div');
    root.id='v115CameraOverlay';
    root.innerHTML='<div class="v115-head"><b>Ambil Foto Bukti</b><button type="button" class="v115-close" id="v115CamClose" aria-label="Tutup">×</button></div><div class="v115-stage"><video id="v115CameraVideo" playsinline autoplay muted></video><div id="v115CameraNote">Arahkan kamera ke bukti kerusakan, lalu tekan Ambil Foto.</div></div><div class="v115-foot"><button type="button" id="v115Flip">↺ Balik Kamera</button><button type="button" id="v115Snap">📷 Ambil Foto</button><button type="button" id="v115Cancel">Batal</button></div>';
    document.body.appendChild(root);
    $('v115CamClose').onclick=closeCamera;$('v115Cancel').onclick=closeCamera;
    $('v115Flip').onclick=async()=>{facing=facing==='environment'?'user':'environment';await startCamera(false);};
    $('v115Snap').onclick=capturePhoto;
  }
  function fallbackNativeCamera(){
    closeCamera();
    const input=$('v111Camera');if(!input)return;
    input.setAttribute('accept','image/*');input.setAttribute('capture','environment');
    try{input.click();}catch(_){ }
  }
  async function startCamera(showOverlay=true){
    ensureCameraUI();if(showOverlay)$('v115CameraOverlay').classList.add('show');stopStream();
    if(!navigator.mediaDevices?.getUserMedia){fallbackNativeCamera();return;}
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facing}}});
      const video=$('v115CameraVideo');video.srcObject=stream;await video.play();
    }catch(e){console.warn('[SLS v115] direct camera fallback',e);fallbackNativeCamera();}
  }
  function capturePhoto(){
    const video=$('v115CameraVideo');if(!video?.videoWidth||!video?.videoHeight)return;
    const max=1600,scale=Math.min(1,max/Math.max(video.videoWidth,video.videoHeight));
    const w=Math.max(1,Math.round(video.videoWidth*scale)),h=Math.max(1,Math.round(video.videoHeight*scale));
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(video,0,0,w,h);
    canvas.toBlob(blob=>{if(!blob)return;const input=$('v111Camera');if(!input){closeCamera();return;}try{const file=new File([blob],`breakage_${Date.now()}.jpg`,{type:'image/jpeg',lastModified:Date.now()});const dt=new DataTransfer();dt.items.add(file);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));closeCamera();}catch(e){console.warn('[SLS v115] camera inject fallback',e);fallbackNativeCamera();}},'image/jpeg',.82);
  }
  function bindCamera(){
    const input=$('v111Camera');const label=document.querySelector('label[for="v111Camera"]');
    if(input){input.setAttribute('accept','image/*');input.setAttribute('capture','environment');}
    if(!label||label.dataset.v115Bound==='1')return;
    label.dataset.v115Bound='1';label.textContent='📷 Foto Langsung';
    label.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();facing='environment';startCamera(true);},true);
  }

  // ---------- Login stability ----------
  let loginBusy=false;
  let historyBusy=false;
  function afterPaint(fn){
    requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(fn,80)));
  }
  async function loadHistorySafe(){
    if(historyBusy||typeof loadHistory!=='function')return;
    historyBusy=true;
    try{await loadHistory();}catch(e){console.warn('[SLS v115] history load',e);}finally{historyBusy=false;}
  }
  async function stableLogin(){
    if(loginBusy)return;
    const btn=$('loginBtn'),msg=$('loginMsg'),u=$('username')?.value?.trim()||'',pw=$('pw')?.value||'';
    loginBusy=true;
    if(btn){btn.disabled=true;btn.dataset.v115Original=btn.dataset.v115Original||btn.textContent;btn.textContent='Memproses login…';}
    if(msg){msg.style.color='#52708f';msg.textContent='Memverifikasi akun…';}
    try{
      const signInFn=window.signIn||(typeof signIn==='function'?signIn:null);
      if(!signInFn)throw new Error('Fungsi login tidak tersedia. Muat ulang halaman.');
      await signInFn(u,pw);
      PERIOD=currentPeriod();SCOPE=ACCESS?.is_master?'Jakarta':ACCESS?.rdc_name;
      initPeriods();showApp();
      if(msg)msg.textContent='';
      // Important: do not run history in the same microtask as login/showApp.
      afterPaint(()=>loadHistorySafe());
    }catch(e){if(msg){msg.style.color='';msg.textContent=(typeof cleanErr==='function'?cleanErr(e.message):String(e.message||e));}}
    finally{loginBusy=false;if(btn){btn.disabled=false;btn.textContent=btn.dataset.v115Original||'Masuk ke Breakage Input';}}
  }
  function bindStableLogin(){
    const btn=$('loginBtn');if(btn)btn.onclick=stableLogin;
    ['username','pw'].forEach(id=>{const el=$(id);if(el)el.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();stableLogin();}};});
    try{login=stableLogin;}catch(_){ }
    window.login=stableLogin;
  }

  // Light, debounced observer: only process newly-added DOM; never observe characterData.
  let scheduled=false;
  const pending=[];
  function schedule(root){
    if(root)pending.push(root);
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;const roots=pending.splice(0,pending.length);for(const r of roots)normalizeSubtree(r);bindCamera();bindStableLogin();});
  }
  normalizeSubtree(document.body);bindCamera();bindStableLogin();
  const obs=new MutationObserver(muts=>{for(const m of muts)for(const n of m.addedNodes)schedule(n);});
  obs.observe(document.body,{childList:true,subtree:true});
  [150,500,1200].forEach(ms=>setTimeout(()=>{normalizeSubtree(document.body);bindCamera();bindStableLogin();const b=$('buildBadge');if(b)b.textContent='v115';},ms));
})();
