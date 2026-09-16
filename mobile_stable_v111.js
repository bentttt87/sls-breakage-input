// SLS Breakage Input v111 — mobile-first canonical input, tested with Android-sized Chromium.
(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const up = v => String(v ?? '').trim().toUpperCase();
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const KINDS = ['GRANDE','GRANIT','KERAMIK'];
  const CAUSES = ['Perjalanan','Susunan','Packaging / Pallet','Lainnya'];
  const FALLBACK = [
    ['GRANDE','100x100'],['GRANDE','120x60'],['GRANDE','80x80'],
    ['GRANIT','100x100'],['GRANIT','120x60'],['GRANIT','122X20'],['GRANIT','60x15'],['GRANIT','60x30'],['GRANIT','80x80'],['GRANIT','90x15'],['GRANIT','30X30'],['GRANIT','60x60'],['GRANIT','STEPTILE'],
    ['KERAMIK','40x40'],['KERAMIK','30x60'],['KERAMIK','90x30'],['KERAMIK','60x30'],['KERAMIK','50x50'],['KERAMIK','40x20'],['KERAMIK','HEXA'],['KERAMIK','30x30'],['KERAMIK','50x20'],['KERAMIK','20x20']
  ].map((x,i)=>({product_type:x[0],product_size:x[1],sort_order:i+1}));

  let state = {type:'warehouse', kind:'', size:'', factory:'', cause:'Packaging / Pallet', wh:'Pecah Dalam Pallet'};
  let master = {products:FALLBACK.slice(), vendors:[], drivers:[]};
  let photos = [];
  let urls = [];
  let busy = false;
  let editId = null;

  function uid(){ return ACCESS?.username || sessionStorage.getItem('sls_breakage_input_username') || ''; }
  function rdc(){ return ACCESS?.rdc_name || SCOPE || ''; }
  function canInput(){ return !!ACCESS?.can_input || ['admin','staff','operator'].includes(String(ACCESS?.breakage_role||ACCESS?.role||'').toLowerCase()); }
  function cleanErr(s){ try{ const j=JSON.parse(String(s||'')); return j.message||j.error||String(s||'Gagal'); }catch(_){ return String(s||'Gagal'); } }
  async function refreshAuth(){ try{ if(typeof window.slsRefreshBreakageSession==='function') await window.slsRefreshBreakageSession(false); }catch(_){ } }
  async function rpc111(fn, params={}){
    await refreshAuth();
    if(typeof window.rpc === 'function') return window.rpc(fn, params);
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {method:'POST',cache:'no-store',headers:{apikey:PUBLIC_ANON,Authorization:`Bearer ${auth()}`,'Content-Type':'application/json'},body:JSON.stringify(params)});
    if(!r.ok) throw new Error(cleanErr(await r.text()));
    return r.json();
  }

  function installStyle(){
    if($('v111Style')) return;
    const st=document.createElement('style'); st.id='v111Style'; st.textContent=`
      #v111{position:fixed;inset:0;z-index:5000;background:#f5f8fc;display:none;color:#102746;font-family:Arial,sans-serif}
      #v111.show{display:flex;flex-direction:column}
      #v111 *{box-sizing:border-box}
      #v111 .head{flex:0 0 auto;display:flex;align-items:center;gap:10px;background:linear-gradient(90deg,#0751a0,#0b69bc);color:#fff;padding:calc(12px + env(safe-area-inset-top)) 14px 12px}
      #v111 .head h2{margin:0;font-size:20px}.v111-sub{font-size:12px;opacity:.85;margin-top:2px}.v111-close{margin-left:auto;width:46px;height:46px;border:0;border-radius:12px;background:rgba(255,255,255,.15);color:#fff;font-size:30px}
      #v111 .body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px 12px 150px}
      .v111-card{background:#fff;border:1px solid #dbe5ef;border-radius:14px;padding:12px;margin-bottom:10px}
      .v111-label{display:block;font-size:13px;font-weight:850;color:#425b78;margin-bottom:7px}.v111-req:after{content:' *';color:#d92d20}
      .v111-input,.v111-select{display:block;width:100%;min-height:50px;border:1px solid #cddae8;border-radius:10px;background:#fff;color:#102746;padding:10px 12px;font-size:16px;outline:none}
      .v111-input:focus,.v111-select:focus{border-color:#2d84d3;box-shadow:0 0 0 2px rgba(45,132,211,.12)}.v111-read{background:#f3f6fa;color:#60728a}
      .v111-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.v111-chips{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v111-sizes{grid-template-columns:repeat(3,minmax(0,1fr))}
      .v111-chip{appearance:none;-webkit-appearance:none;border:1px solid #94b2d0;background:#fff;color:#173a61;border-radius:10px;min-height:48px;padding:8px 6px;font-weight:850;font-size:15px;touch-action:manipulation}.v111-chip.active{background:#063e7d;color:#fff;border-color:#063e7d}
      .v111-photo-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.v111-photo-label{display:flex;align-items:center;justify-content:center;border:1px solid #7ea9d7;color:#0751a0;background:#fff;border-radius:10px;min-height:50px;padding:9px;font-weight:850;text-align:center;font-size:14px}
      .v111-previews{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.v111-prev{position:relative;aspect-ratio:4/3;border:1px solid #dbe5ef;border-radius:10px;overflow:hidden;background:#eef2f6}.v111-prev img{width:100%;height:100%;object-fit:cover}.v111-x{position:absolute;right:5px;top:5px;width:30px;height:30px;border:0;border-radius:50%;background:#c92d25;color:#fff;font-size:20px;font-weight:900}
      .v111-msg{display:none;margin:10px 0;padding:11px 12px;border-radius:10px;font-size:14px;line-height:1.45}.v111-msg.show{display:block}.v111-msg.err{background:#fff0ef;border:1px solid #ffc9c6;color:#b42318}.v111-msg.wait{background:#eef7ff;border:1px solid #c9e1f7;color:#375f82}.v111-msg.ok{background:#eaf8f0;border:1px solid #b7e5c9;color:#067647}
      .v111-foot{position:fixed;z-index:5001;left:0;right:0;bottom:0;background:#fff;border-top:1px solid #dbe5ef;padding:10px 12px calc(10px + env(safe-area-inset-bottom));display:flex;gap:10px}.v111-foot button{flex:1;min-height:58px;border-radius:12px;font-weight:900;font-size:16px}.v111-local{background:#fff;border:1px solid #8eaccd;color:#0b4f94}.v111-submit{border:0;background:linear-gradient(90deg,#0a58ad,#1284e4);color:#fff}.v111-submit:disabled{opacity:.55}
      @media(max-width:650px){.v111-grid{grid-template-columns:1fr}.v111-sizes{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media(max-width:390px){.v111-sizes{grid-template-columns:repeat(2,minmax(0,1fr))}.v111-photo-actions{grid-template-columns:1fr}}
    `; document.head.appendChild(st);
  }

  function build(){
    if($('v111')) return;
    installStyle();
    document.body.insertAdjacentHTML('beforeend', `<section id="v111" aria-label="Input Breakage Mobile">
      <div class="head"><div><h2>Input Breakage</h2><div class="v111-sub" id="v111Who">—</div></div><button type="button" id="v111Close" class="v111-close" aria-label="Tutup">×</button></div>
      <div class="body">
        <div class="v111-grid"><div class="v111-card"><label class="v111-label">RDC</label><input id="v111Rdc" class="v111-input v111-read" readonly></div><div class="v111-card"><label class="v111-label">Diinput Oleh</label><input id="v111User" class="v111-input v111-read" readonly></div></div>
        <div class="v111-card"><label class="v111-label v111-req">Jenis Kejadian</label><div class="v111-chips"><button type="button" class="v111-chip" data-v111-type="delivery">Kiriman</button><button type="button" class="v111-chip active" data-v111-type="warehouse">Gudang</button></div></div>
        <div class="v111-grid"><div class="v111-card"><label class="v111-label v111-req">Tanggal</label><input id="v111Date" type="date" class="v111-input"></div><div class="v111-card"><label class="v111-label">No BA</label><input class="v111-input v111-read" value="AUTO / SETELAH SIMPAN" readonly></div></div>
        <div class="v111-card"><label class="v111-label v111-req">Kode Item</label><input id="v111Item" class="v111-input" autocomplete="off"></div>
        <div class="v111-card"><label class="v111-label v111-req">Series / Motif</label><input id="v111Series" class="v111-input" autocomplete="off" placeholder="Contoh: S050S / MOTIF / WARNA"></div>
        <div class="v111-card"><label class="v111-label v111-req">Jenis Produk</label><div id="v111Kinds" class="v111-chips">${KINDS.map(k=>`<button type="button" class="v111-chip" data-v111-kind="${k}">${k}</button>`).join('')}</div></div>
        <div class="v111-card"><label class="v111-label v111-req">Size</label><div id="v111Sizes" class="v111-chips v111-sizes"><span style="font-size:13px;color:#6d7d94">Pilih Jenis Produk dahulu.</span></div></div>
        <div class="v111-card"><label class="v111-label v111-req">Pabrik Asal</label><div class="v111-chips"><button type="button" class="v111-chip" data-v111-factory="SRKI">SRKI</button><button type="button" class="v111-chip" data-v111-factory="RCI">RCI</button></div></div>
        <div class="v111-card"><label class="v111-label v111-req">Jumlah</label><div style="display:flex;align-items:center;gap:8px"><input id="v111Qty" type="number" min="1" step="1" value="1" class="v111-input"><b>BOX</b></div></div>
        <div class="v111-card"><label class="v111-label v111-req">Pelapor / Reported By</label><input id="v111Reported" class="v111-input"></div>
        <div id="v111Delivery" hidden>
          <div class="v111-card"><label class="v111-label v111-req">No Surat Jalan</label><input id="v111Sj" class="v111-input"></div>
          <div class="v111-card"><label class="v111-label v111-req">Pelanggan</label><input id="v111Customer" class="v111-input"></div>
          <div class="v111-card"><label class="v111-label v111-req">Nama Penerima BA</label><input id="v111Receiver" class="v111-input" placeholder="Nama penerima / PIC"></div>
          <div class="v111-card"><label class="v111-label v111-req">Vendor Transport</label><select id="v111Vendor" class="v111-select"><option value="">Pilih Vendor Transport</option></select></div>
          <div class="v111-card"><label class="v111-label v111-req">Driver / No Polisi</label><select id="v111Driver" class="v111-select"><option value="">Pilih Vendor dahulu</option></select></div>
          <div class="v111-card"><label class="v111-label v111-req">Saksi Pemeriksa BA</label><input id="v111Witness" class="v111-input" placeholder="Nama saksi pemeriksa"></div>
        </div>
        <div id="v111Warehouse"><div class="v111-card"><label class="v111-label v111-req">Kejadian Gudang</label><div class="v111-chips"><button type="button" class="v111-chip active" data-v111-wh="Pecah Dalam Pallet">Pecah Dalam Pallet</button><button type="button" class="v111-chip" data-v111-wh="Misshandling">Misshandling</button></div></div><div id="v111RelatedCard" class="v111-card" hidden><label class="v111-label v111-req">Nama Terkait</label><input id="v111Related" class="v111-input"></div></div>
        <div class="v111-card"><label class="v111-label v111-req">Penyebab</label><div class="v111-chips">${CAUSES.map(c=>`<button type="button" class="v111-chip ${c==='Packaging / Pallet'?'active':''}" data-v111-cause="${esc(c)}">${esc(c)}</button>`).join('')}</div><textarea id="v111Detail" class="v111-input" rows="3" style="height:auto;margin-top:9px" placeholder="Keterangan penyebab / kejadian"></textarea></div>
        <div class="v111-card"><label class="v111-label v111-req">Foto Bukti 1–5</label><div style="font-size:12px;color:#6d7d94">Pilih salah satu: kamera atau galeri. Minimal 1 foto.</div><div class="v111-photo-actions"><label for="v111Camera" class="v111-photo-label">📷 Ambil Foto</label><label for="v111Gallery" class="v111-photo-label">🖼 Pilih Galeri</label><input id="v111Camera" type="file" accept="image/*" capture="environment" hidden><input id="v111Gallery" type="file" accept="image/*" multiple hidden></div><div id="v111Previews" class="v111-previews"></div></div>
        <div id="v111Msg" class="v111-msg"></div>
      </div>
      <div class="v111-foot"><button type="button" id="v111Local" class="v111-local">Simpan Draft Lokal</button><button type="button" id="v111Submit" class="v111-submit">Simpan Draft ke Sistem</button></div>
    </section>`);
    bind();
  }

  function msg(text,type='err'){const m=$('v111Msg');m.className=`v111-msg show ${type}`;m.textContent=text;m.scrollIntoView({behavior:'smooth',block:'nearest'});}
  function clearMsg(){const m=$('v111Msg');m.className='v111-msg';m.textContent='';}
  function active(sel,attr,val){document.querySelectorAll(sel).forEach(b=>b.classList.toggle('active',String(b.getAttribute(attr))===String(val)));}
  function sizes(kind){return (master.products.length?master.products:FALLBACK).filter(x=>up(x.product_type)===up(kind)).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(x=>String(x.product_size||''));}
  function renderSizes(){const box=$('v111Sizes'); const rows=sizes(state.kind); if(!state.kind){state.size='';box.innerHTML='<span style="font-size:13px;color:#6d7d94">Pilih Jenis Produk dahulu.</span>';return;} if(!rows.length){state.size='';box.innerHTML='<span style="font-size:13px;color:#b42318">Size belum tersedia untuk jenis ini.</span>';return;} if(!rows.some(x=>up(x)===up(state.size))) state.size=''; box.innerHTML=rows.map(s=>`<button type="button" class="v111-chip ${up(s)===up(state.size)?'active':''}" data-v111-size="${esc(s)}">${esc(s)}</button>`).join(''); box.querySelectorAll('[data-v111-size]').forEach(b=>b.addEventListener('click',()=>{state.size=b.dataset.v111Size||'';renderSizes();}));}
  function renderDrivers(){const vendorName=$('v111Vendor').value;const vendor=master.vendors.find(v=>up(v.name)===up(vendorName));const rows=master.drivers.filter(d=>d.active!==false && ((vendor&&Number(d.vendor_id)===Number(vendor.id)) || up(d.vendor_name)===up(vendorName)));$('v111Driver').innerHTML='<option value="">'+(vendorName?'Pilih Driver / No Polisi':'Pilih Vendor dahulu')+'</option>'+rows.map(d=>`<option value="${esc(d.name||'')}" data-plate="${esc(d.plate||'')}">${esc(d.plate||'—')} - ${esc(d.name||'')}</option>`).join('');}
  async function loadMaster(){
    const [p,l]=await Promise.allSettled([rpc111('breakage_product_master_list_v94',{}),rpc111('logistics_master_list',{p_rdc:rdc()})]);
    master.products=p.status==='fulfilled'&&Array.isArray(p.value)&&p.value.length?p.value:FALLBACK.slice();
    if(l.status==='fulfilled'&&l.value){master.vendors=(l.value.vendors||[]).filter(v=>v.active!==false);master.drivers=(l.value.drivers||[]).filter(d=>d.active!==false);} else {master.vendors=[];master.drivers=[];}
    $('v111Vendor').innerHTML='<option value="">Pilih Vendor Transport</option>'+master.vendors.map(v=>`<option value="${esc(v.name||'')}">${esc(v.name||'')}</option>`).join('');
    renderSizes(); renderDrivers();
  }

  function key(){return 'sls_breakage_v111_'+uid();}
  function data(){return {type:state.type,kind:state.kind,size:state.size,factory:state.factory,cause:state.cause,wh:state.wh,date:$('v111Date').value,item:up($('v111Item').value),series:up($('v111Series').value),qty:$('v111Qty').value,reported:up($('v111Reported').value),sj:up($('v111Sj').value),customer:up($('v111Customer').value),receiver:up($('v111Receiver').value),vendor:$('v111Vendor').value,driver:$('v111Driver').value,witness:up($('v111Witness').value),related:up($('v111Related').value),detail:up($('v111Detail').value)};}
  function saveDraft(show=true){try{localStorage.setItem(key(),JSON.stringify(data()));if(show)msg('Draft lokal tersimpan. Foto tidak disimpan pada draft lokal.','ok');}catch(_){if(show)msg('Draft lokal tidak dapat disimpan di browser ini.');}}
  function restore(){try{const d=JSON.parse(localStorage.getItem(key())||'{}');if(!d||!Object.keys(d).length)return;state.type=d.type||'warehouse';state.kind=d.kind||'';state.size=d.size||'';state.factory=d.factory||'';state.cause=d.cause||'Packaging / Pallet';state.wh=d.wh||'Pecah Dalam Pallet';[['v111Date','date'],['v111Item','item'],['v111Series','series'],['v111Qty','qty'],['v111Reported','reported'],['v111Sj','sj'],['v111Customer','customer'],['v111Receiver','receiver'],['v111Witness','witness'],['v111Related','related'],['v111Detail','detail']].forEach(([id,k])=>{if(d[k]!==undefined&&$(id))$(id).value=d[k];});active('[data-v111-type]','data-v111-type',state.type);active('[data-v111-kind]','data-v111-kind',state.kind);active('[data-v111-factory]','data-v111-factory',state.factory);active('[data-v111-cause]','data-v111-cause',state.cause);active('[data-v111-wh]','data-v111-wh',state.wh);$('v111Delivery').hidden=state.type!=='delivery';$('v111Warehouse').hidden=state.type!=='warehouse';$('v111RelatedCard').hidden=state.wh!=='Misshandling';setTimeout(()=>{if(d.vendor){$('v111Vendor').value=d.vendor;renderDrivers();$('v111Driver').value=d.driver||'';}},50);}catch(_){}}

  function addFiles(list){const incoming=Array.from(list||[]);if(!incoming.length)return;if(photos.length+incoming.length>5){msg('Maksimal 5 foto per insiden.');return;}const bad=incoming.find(f=>!(String(f.type||'').startsWith('image/')||/\.(jpe?g|png|webp|heic|heif)$/i.test(f.name||'')));if(bad){msg('File harus berupa foto.');return;}photos.push(...incoming);renderPhotos();}
  function renderPhotos(){urls.forEach(u=>URL.revokeObjectURL(u));urls=[];$('v111Previews').innerHTML=photos.map((f,i)=>{const u=URL.createObjectURL(f);urls.push(u);return `<div class="v111-prev"><img src="${u}" alt="Foto ${i+1}"><button type="button" class="v111-x" data-v111-del="${i}">×</button></div>`;}).join('');$('v111Previews').querySelectorAll('[data-v111-del]').forEach(b=>b.onclick=()=>{photos.splice(Number(b.dataset.v111Del),1);renderPhotos();});}

  function bind(){
    $('v111Close').onclick=close;
    document.querySelectorAll('[data-v111-type]').forEach(b=>b.onclick=()=>{state.type=b.dataset.v111Type;active('[data-v111-type]','data-v111-type',state.type);$('v111Delivery').hidden=state.type!=='delivery';$('v111Warehouse').hidden=state.type!=='warehouse';});
    document.querySelectorAll('[data-v111-kind]').forEach(b=>b.onclick=()=>{state.kind=b.dataset.v111Kind;state.size='';active('[data-v111-kind]','data-v111-kind',state.kind);renderSizes();});
    document.querySelectorAll('[data-v111-factory]').forEach(b=>b.onclick=()=>{state.factory=b.dataset.v111Factory;active('[data-v111-factory]','data-v111-factory',state.factory);});
    document.querySelectorAll('[data-v111-cause]').forEach(b=>b.onclick=()=>{state.cause=b.dataset.v111Cause;active('[data-v111-cause]','data-v111-cause',state.cause);});
    document.querySelectorAll('[data-v111-wh]').forEach(b=>b.onclick=()=>{state.wh=b.dataset.v111Wh;active('[data-v111-wh]','data-v111-wh',state.wh);$('v111RelatedCard').hidden=state.wh!=='Misshandling';});
    $('v111Vendor').onchange=renderDrivers;
    $('v111Camera').onchange=e=>{addFiles(e.target.files);e.target.value='';};
    $('v111Gallery').onchange=e=>{addFiles(e.target.files);e.target.value='';};
    $('v111Local').onclick=()=>saveDraft(true);$('v111Submit').onclick=submit;
  }

  function validate(){const d=data(),m=[];if(!d.date)m.push('Tanggal');if(!d.item)m.push('Kode Item');if(!d.series)m.push('Series / Motif');if(!KINDS.includes(d.kind))m.push('Jenis Produk');if(!d.size)m.push('Size');if(!['SRKI','RCI'].includes(d.factory))m.push('Pabrik Asal');if(!(Number(d.qty)>0))m.push('Jumlah');if(!d.reported)m.push('Pelapor');if(photos.length<1)m.push('Foto');if(d.type==='delivery'){if(!d.sj)m.push('No Surat Jalan');if(!d.customer)m.push('Pelanggan');if(!d.receiver)m.push('Nama Penerima BA');if(!d.vendor)m.push('Vendor Transport');if(!d.driver)m.push('Driver / No Polisi');if(!d.witness)m.push('Saksi Pemeriksa BA');}else{if(state.wh==='Misshandling'&&!d.related)m.push('Nama Terkait');}if(state.cause==='Lainnya'&&!d.detail)m.push('Keterangan Penyebab');return [...new Set(m)];}

  async function jpeg(file){
    await new Promise(r=>requestAnimationFrame(()=>r()));
    let src=null;try{if(window.createImageBitmap)src=await createImageBitmap(file,{imageOrientation:'from-image'});}catch(_){try{if(window.createImageBitmap)src=await createImageBitmap(file);}catch(__){}}
    if(!src) src=await new Promise((resolve,reject)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{URL.revokeObjectURL(u);resolve(im);};im.onerror=()=>{URL.revokeObjectURL(u);reject(new Error('Foto tidak dapat dibaca. Coba foto JPG/PNG/WEBP.'));};im.src=u;});
    const sw=src.width||src.naturalWidth, sh=src.height||src.naturalHeight;if(!sw||!sh)throw new Error('Ukuran foto tidak valid.');const scale=Math.min(1,960/Math.max(sw,sh)),w=Math.max(1,Math.round(sw*scale)),h=Math.max(1,Math.round(sh*scale)),c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(src,0,0,w,h);if(src.close)src.close();return await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('Kompresi foto gagal')),'image/jpeg',.65));
  }
  async function upload(){await refreshAuth();const paths=[],safe=String(rdc()).replace(/[^A-Za-z0-9_-]/g,'_'),batch='draft_'+(crypto.randomUUID?crypto.randomUUID():Date.now());for(let i=0;i<photos.length;i++){msg(`Mengunggah foto ${i+1} dari ${photos.length}…`,'wait');const blob=await jpeg(photos[i]),path=`${safe}/${batch}/${Date.now()}_${i+1}.jpg`,encoded=path.split('/').map(encodeURIComponent).join('/');const r=await fetch(`${SUPABASE_URL}/storage/v1/object/breakage-evidence/${encoded}`,{method:'POST',headers:{apikey:PUBLIC_ANON,Authorization:`Bearer ${auth()}`,'Content-Type':'image/jpeg','x-upsert':'false'},body:blob});if(!r.ok)throw new Error('Upload foto gagal: '+cleanErr(await r.text()));paths.push(path);}return paths;}
  async function submit(){if(busy)return;const missing=validate();if(missing.length){msg('Lengkapi: '+missing.join(', '));return;}busy=true;$('v111Submit').disabled=true;try{const d=data();msg('Menyiapkan foto…','wait');const photo_paths=await upload();const driver=$('v111Driver'),plate=driver.selectedOptions?.[0]?.dataset?.plate||'';const payload={incident_type:d.type,occurrence_date:d.date,item_code:d.item,ceramic_series:d.series,product_kind:d.kind,product_type:d.kind,product_size:d.size,qty_box:Number(d.qty),uom:'BOX',rdc_name:rdc(),reported_by:d.reported,factory:d.factory,cause:d.cause,cause_detail:d.detail,photo_paths};if(d.type==='delivery')Object.assign(payload,{no_sj:d.sj,customer:d.customer,ba_receiver_name:d.receiver,transporter:d.vendor,driver_name:d.driver,vehicle_no:up(plate),ba_witness_name:d.witness});else Object.assign(payload,{warehouse_event:state.wh,related_person:d.related});msg('Menyimpan Draft ke sistem…','wait');const fn=editId?'breakage_incident_update_draft_v94':'breakage_incident_create_v94';const params=editId?{p_incident_id:editId,p_payload:payload}:{p_payload:payload};const res=await rpc111(fn,params);msg(`Berhasil. ${res?.incident_no||res?.no_ba||'Draft'} tersimpan dan menunggu review SPV.`,'ok');try{localStorage.removeItem(key())}catch(_){}photos=[];renderPhotos();if(typeof loadHistory==='function'){try{PERIOD=d.date.slice(0,7);if(typeof initPeriods==='function')initPeriods();await loadHistory();}catch(_){}}setTimeout(close,1200);}catch(e){console.error('v111 submit',e);msg('Gagal simpan: '+cleanErr(e?.message||e));}finally{busy=false;$('v111Submit').disabled=false;}}

  async function open(seed=null){if(!canInput()){alert('Akun ini tidak memiliki hak input breakage.');return;}build();clearMsg();photos=[];renderPhotos();editId=seed?.incident_id||null;state={type:seed?.incident_type||'warehouse',kind:up(seed?.product_kind||seed?.product_type||''),size:String(seed?.product_size||''),factory:up(seed?.factory||''),cause:seed?.cause||'Packaging / Pallet',wh:seed?.warehouse_event||'Pecah Dalam Pallet'};$('v111Rdc').value=seed?.rdc||rdc();$('v111User').value=uid();$('v111Who').textContent=`${up(ACCESS?.breakage_role||ACCESS?.role||'OPERATOR')} · ${rdc()}`;$('v111Date').value=seed?.occurrence_date||new Date().toISOString().slice(0,10);$('v111Item').value=seed?.item_code||'';$('v111Series').value=seed?.ceramic_series||'';$('v111Qty').value=seed?.qty_box||1;$('v111Reported').value=seed?.reported_by||up(uid());$('v111Sj').value=seed?.no_sj||'';$('v111Customer').value=seed?.customer||'';$('v111Receiver').value=seed?.ba_receiver_name||'';$('v111Witness').value=seed?.ba_witness_name||'';$('v111Related').value=seed?.related_person||'';$('v111Detail').value=seed?.cause_detail||'';active('[data-v111-type]','data-v111-type',state.type);active('[data-v111-kind]','data-v111-kind',state.kind);active('[data-v111-factory]','data-v111-factory',state.factory);active('[data-v111-cause]','data-v111-cause',state.cause);active('[data-v111-wh]','data-v111-wh',state.wh);$('v111Delivery').hidden=state.type!=='delivery';$('v111Warehouse').hidden=state.type!=='warehouse';$('v111RelatedCard').hidden=state.wh!=='Misshandling';$('v111').classList.add('show');document.body.style.overflow='hidden';await loadMaster();renderSizes();if(seed?.transporter){$('v111Vendor').value=seed.transporter;renderDrivers();$('v111Driver').value=seed.driver_name||'';}else if(!seed)restore();const badge=$('buildBadge');if(badge)badge.textContent='v111';}
  function close(){if(busy)return;$('v111')?.classList.remove('show');document.body.style.overflow='';}
  function takeover(){build();if($('newBtn'))$('newBtn').onclick=()=>open();if($('navInput'))$('navInput').onclick=()=>open();try{openInput=()=>open();window.openInput=openInput;}catch(_){ }try{const baseEdit=window.editIncident;window.editIncident=id=>{const row=(Array.isArray(INCIDENTS)?INCIDENTS:[]).find(x=>Number(x.incident_id)===Number(id));if(row)return open(row);return typeof baseEdit==='function'?baseEdit(id):undefined;};}catch(_){ }$('incidentModal')?.classList.remove('show');const badge=$('buildBadge');if(badge)badge.textContent='v111';}
  [100,400,1000,2200].forEach(ms=>setTimeout(takeover,ms));
})();