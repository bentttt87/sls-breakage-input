// SLS Breakage Input v113
// UI-only terminology normalization + direct mobile camera capture.
// Backend values remain unchanged (delivery/warehouse) to preserve compatibility.
(function(){
  'use strict';

  const TYPE_LABEL = {
    delivery: 'Pecah Kirim',
    kiriman: 'Pecah Kirim',
    'pecah kiriman': 'Pecah Kirim',
    warehouse: 'Pecah Pallet',
    gudang: 'Pecah Pallet',
    'pecah gudang': 'Pecah Pallet'
  };

  function mappedType(v){
    const raw = String(v ?? '').trim();
    return TYPE_LABEL[raw.toLowerCase()] || raw;
  }

  function applyTerminology(){
    // Canonical mobile input buttons.
    const deliveryBtn = document.querySelector('[data-v111-type="delivery"]');
    const warehouseBtn = document.querySelector('[data-v111-type="warehouse"]');
    if(deliveryBtn) deliveryBtn.textContent = 'Pecah Kirim';
    if(warehouseBtn) warehouseBtn.textContent = 'Pecah Pallet';

    // Main incident history table: third column = Jenis.
    document.querySelectorAll('#historyBody tr').forEach(tr=>{
      const td = tr.children && tr.children[2];
      if(td && td.tagName === 'TD'){
        const next = mappedType(td.textContent);
        if(next && next !== td.textContent.trim()) td.textContent = next;
      }
    });

    // Incident detail/review modal.
    document.querySelectorAll('#reviewDetails .field').forEach(field=>{
      const label = field.querySelector('label');
      if(!label || label.textContent.trim().toLowerCase() !== 'jenis') return;
      const value = Array.from(field.children).find(el=>el !== label);
      if(value){
        const next = mappedType(value.textContent);
        if(next) value.textContent = next;
      }
    });

    // Any visible select dedicated to incident type, when present in legacy form.
    ['incidentType','type','jenisIncident','jenisKejadian'].forEach(id=>{
      const el = document.getElementById(id);
      if(el && el.tagName === 'SELECT'){
        Array.from(el.options).forEach(o=>{
          const next = mappedType(o.textContent);
          if(next) o.textContent = next;
        });
      }
    });
  }

  // ---------- Direct camera ----------
  let stream = null;
  let facing = 'environment';

  function ensureCameraUI(){
    if(document.getElementById('v113CameraOverlay')) return;
    const style = document.createElement('style');
    style.id = 'v113CameraStyle';
    style.textContent = `
      #v113CameraOverlay{position:fixed;inset:0;z-index:9000;background:#071525;display:none;flex-direction:column;color:#fff;font-family:Arial,sans-serif}
      #v113CameraOverlay.show{display:flex}
      #v113CameraOverlay .v113-head{display:flex;align-items:center;padding:calc(10px + env(safe-area-inset-top)) 14px 10px;background:#0b4f94}
      #v113CameraOverlay .v113-head b{font-size:18px}.v113-cam-close{margin-left:auto;width:44px;height:44px;border:0;border-radius:12px;background:rgba(255,255,255,.16);color:#fff;font-size:28px}
      #v113CameraOverlay .v113-stage{flex:1;display:flex;align-items:center;justify-content:center;min-height:0;background:#000;overflow:hidden}
      #v113CameraVideo{width:100%;height:100%;object-fit:contain;background:#000}
      #v113CameraOverlay .v113-foot{display:grid;grid-template-columns:1fr 1.35fr 1fr;gap:10px;padding:12px 12px calc(12px + env(safe-area-inset-bottom));background:#fff}
      #v113CameraOverlay .v113-foot button{min-height:54px;border-radius:12px;font-size:15px;font-weight:900}
      #v113Flip{background:#fff;border:1px solid #8aa8c7;color:#0b4f94}
      #v113Snap{background:#0877d1;border:0;color:#fff;font-size:17px}
      #v113Cancel{background:#fff;border:1px solid #d0d8e2;color:#425b78}
      #v113CameraNote{position:absolute;left:12px;right:12px;bottom:92px;text-align:center;font-size:12px;color:#fff;text-shadow:0 1px 2px #000;background:rgba(0,0,0,.30);padding:6px 8px;border-radius:8px;pointer-events:none}
    `;
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.id = 'v113CameraOverlay';
    root.innerHTML = `
      <div class="v113-head"><b>Ambil Foto Bukti</b><button type="button" class="v113-cam-close" id="v113CamClose" aria-label="Tutup">×</button></div>
      <div class="v113-stage"><video id="v113CameraVideo" playsinline autoplay muted></video><div id="v113CameraNote">Arahkan kamera ke bukti kerusakan, lalu tekan Ambil Foto.</div></div>
      <div class="v113-foot"><button type="button" id="v113Flip">↺ Balik Kamera</button><button type="button" id="v113Snap">📷 Ambil Foto</button><button type="button" id="v113Cancel">Batal</button></div>
    `;
    document.body.appendChild(root);

    document.getElementById('v113CamClose').onclick = closeCamera;
    document.getElementById('v113Cancel').onclick = closeCamera;
    document.getElementById('v113Flip').onclick = async()=>{
      facing = facing === 'environment' ? 'user' : 'environment';
      await startCamera(false);
    };
    document.getElementById('v113Snap').onclick = capturePhoto;
  }

  function stopStream(){
    try{ if(stream) stream.getTracks().forEach(t=>t.stop()); }catch(_e){}
    stream = null;
    const v = document.getElementById('v113CameraVideo');
    if(v) v.srcObject = null;
  }

  function closeCamera(){
    stopStream();
    document.getElementById('v113CameraOverlay')?.classList.remove('show');
  }

  function fallbackNativeCamera(){
    closeCamera();
    const input = document.getElementById('v111Camera');
    if(!input) return;
    input.setAttribute('accept','image/*');
    input.setAttribute('capture','environment');
    try{ input.click(); }catch(_e){}
  }

  async function startCamera(showOverlay=true){
    ensureCameraUI();
    if(showOverlay) document.getElementById('v113CameraOverlay').classList.add('show');
    stopStream();
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      fallbackNativeCamera();
      return;
    }
    try{
      stream = await navigator.mediaDevices.getUserMedia({
        audio:false,
        video:{facingMode:{ideal:facing}}
      });
      const video = document.getElementById('v113CameraVideo');
      video.srcObject = stream;
      await video.play();
    }catch(err){
      console.warn('Direct camera unavailable, using native capture fallback', err);
      fallbackNativeCamera();
    }
  }

  function pushCapturedFile(blob){
    const input = document.getElementById('v111Camera');
    if(!input) return;
    const file = new File([blob], `breakage_${Date.now()}.jpg`, {type:'image/jpeg', lastModified:Date.now()});
    try{
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change',{bubbles:true}));
    }catch(err){
      console.warn('Unable to inject captured file', err);
      fallbackNativeCamera();
    }
  }

  function capturePhoto(){
    const video = document.getElementById('v113CameraVideo');
    if(!video || !video.videoWidth || !video.videoHeight) return;
    const max = 1600;
    const scale = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.max(1, Math.round(video.videoWidth * scale));
    const h = Math.max(1, Math.round(video.videoHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d', {alpha:false});
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,w,h);
    ctx.drawImage(video,0,0,w,h);
    canvas.toBlob(blob=>{
      if(!blob) return;
      pushCapturedFile(blob);
      closeCamera();
    }, 'image/jpeg', .82);
  }

  function bindDirectCamera(){
    const label = document.querySelector('label[for="v111Camera"]');
    const input = document.getElementById('v111Camera');
    if(input){
      input.setAttribute('accept','image/*');
      input.setAttribute('capture','environment');
    }
    if(!label || label.dataset.v113CameraBound === '1') return;
    label.dataset.v113CameraBound = '1';
    label.textContent = '📷 Foto Langsung';
    label.addEventListener('click', e=>{
      e.preventDefault();
      e.stopPropagation();
      facing = 'environment';
      startCamera(true);
    }, true);
  }

  function applyAll(){
    applyTerminology();
    bindDirectCamera();
  }

  [50,200,500,1000,2000,4000].forEach(ms=>setTimeout(applyAll,ms));
  const observer = new MutationObserver(()=>applyAll());
  observer.observe(document.documentElement,{subtree:true,childList:true});

  window.slsBreakageTypeLabel = mappedType;
})();
