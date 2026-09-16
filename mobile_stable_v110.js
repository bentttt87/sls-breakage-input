// SLS Breakage Input v110 — canonical mobile form. One stable DOM, direct validated submit, no legacy form mutation.
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const up=v=>String(v??'').trim().toUpperCase();
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const KINDS=['GRANDE','GRANIT','KERAMIK'];
  const CAUSES=['Perjalanan','Susunan','Packaging / Pallet','Lainnya'];
  let MASTER={products:[],vendors:[],drivers:[]};
  let TYPE110='warehouse', KIND110='', SIZE110='', FACTORY110='', CAUSE110='Packaging / Pallet', PHOTOS110=[], BUSY110=false;
  let PREVIEW_URLS=[];

  function userId(){return ACCESS?.username||sessionStorage.getItem('sls_breakage_input_username')||''}
  function rdc(){return ACCESS?.rdc_name||SCOPE||''}
  function canInput(){return !!ACCESS?.can_input || ['admin','staff','operator'].includes(String(ACCESS?.breakage_role||ACCESS?.role||'').toLowerCase())}
  function cleanErr(s){try{const j=JSON.parse(s);return j.message||j.error||s}catch(_){return String(s||'Gagal')}}
  function rpc110(fn,params={}){return fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`,{method:'POST',cache:'no-store',headers:{apikey:PUBLIC_ANON,Authorization:`Bearer ${auth()}`,'Content-Type':'application/json'},body:JSON.stringify(params)}).then(async r=>{if(!r.ok)throw new Error(cleanErr(await r.text()));return r.json()})}

  const FALLBACK=[
    ['GRANDE','100x100'],['GRANDE','120x60'],['GRANDE','80x80'],
    ['GRANIT','100x100'],['GRANIT','120x60'],['GRANIT','122X20'],['GRANIT','60x15'],['GRANIT','60x30'],['GRANIT','80x80'],['GRANIT','90x15'],['GRANIT','30X30'],['GRANIT','60x60'],['GRANIT','STEPTILE'],
    ['KERAMIK','40x40'],['KERAMIK','30x60'],['KERAMIK','90x30'],['KERAMIK','60x30'],['KERAMIK','50x50'],['KERAMIK','40x20'],['KERAMIK','HEXA'],['KERAMIK','30x30'],['KERAMIK','50x20'],['KERAMIK','20x20']
  ].map((x,i)=>({product_type:x[0],product_size:x[1],sort_order:i+1}));

  function injectStyle(){
    if($('stable110Style'))return;
    const st=document.createElement('style');st.id='stable110Style';st.textContent=`
      #stable110{position:fixed;inset:0;z-index:1000;background:#f6f9fd;display:none;overflow:hidden;color:#102746}
      #stable110.show{display:flex;flex-direction:column}
      #stable110 .s110-head{background:linear-gradient(90deg,#0751a0,#0b69bc);color:#fff;padding:calc(12px + env(safe-area-inset-top)) 16px 12px;display:flex;align-items:center;gap:10px;flex:0 0 auto}
      #stable110 .s110-head h2{margin:0;font-size:20px}.s110-sub{font-size:12px;opacity:.85;margin-top:2px}.s110-close{margin-left:auto;width:46px;height:46px;border:0;border-radius:12px;background:rgba(255,255,255,.15);color:#fff;font-size:30px;line-height:1}
      #stable110 .s110-body{overflow:auto;-webkit-overflow-scrolling:touch;padding:14px 14px 150px;flex:1}
      .s110-card{background:#fff;border:1px solid #dbe5ef;border-radius:16px;padding:13px;margin-bottom:10px}
      .s110-label{display:block;font-size:13px;font-weight:800;color:#425b78;margin-bottom:7px}
      .s110-req:after{content:' *';color:#d92d20}
      .s110-input,.s110-select{width:100%;min-height:48px;border:1px solid #cfdce9;border-radius:11px;padding:10px 12px;background:#fff;color:#102746;font-size:16px;outline:none}
      .s110-input:focus,.s110-select:focus{border-color:#2682d4;box-shadow:0 0 0 2px rgba(38,130,212,.10)}
      .s110-read{background:#f3f6fa;color:#60728a}
      .s110-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .s110-chips{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .s110-chip{border:1px solid #94b2d0;background:#fff;color:#173a61;border-radius:10px;min-height:46px;padding:8px;font-weight:800;font-size:15px;touch-action:manipulation}
      .s110-chip.active{background:#063e7d;color:#fff;border-color:#063e7d}
      .s110-size{grid-template-columns:repeat(3,minmax(0,1fr))}
      .s110-photo-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.s110-photo-btn{display:inline-flex;align-items:center;justify-content:center;border:1px solid #7ea9d7;background:#fff;color:#0751a0;border-radius:10px;min-height:48px;padding:10px 14px;font-weight:800;font-size:15px}
      .s110-previews{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.s110-prev{position:relative;aspect-ratio:4/3;border:1px solid #dbe5ef;border-radius:10px;overflow:hidden;background:#eef2f6}.s110-prev img{width:100%;height:100%;object-fit:cover}.s110-x{position:absolute;right:5px;top:5px;border:0;border-radius:50%;width:30px;height:30px;background:#c92d25;color:#fff;font-size:20px;font-weight:900}
      .s110-foot{position:fixed;left:0;right:0;bottom:0;z-index:1001;background:#fff;border-top:1px solid #dbe5ef;padding:12px 14px calc(12px + env(safe-area-inset-bottom));display:flex;gap:10px}.s110-foot button{flex:1;min-height:58px;border-radius:12px;font-weight:900;font-size:17px}.s110-save{border:1px solid #8eaccd;background:#fff;color:#0b4f94}.s110-submit{border:0;background:linear-gradient(90deg,#0a58ad,#1284e4);color:#fff}.s110-submit:disabled{opacity:.55}
      .s110-msg{margin:10px 0;padding:11px 12px;border-radius:10px;font-size:14px;display:none}.s110-msg.show{display:block}.s110-msg.err{background:#fff0ef;border:1px solid #ffc9c6;color:#b42318}.s110-msg.ok{background:#eaf8f0;border:1px solid #b7e5c9;color:#067647}.s110-msg.wait{background:#eef7ff;border:1px solid #c9e1f7;color:#375f82}
      @media(max-width:600px){.s110-grid{grid-template-columns:1fr}.s110-size{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media(max-width:390px){.s110-size{grid-template-columns:repeat(2,minmax(0,1fr))}.s110-foot button{font-size:15px}}
    `;document.head.appendChild(st);
  }

  function build(){
    if($('stable110'))return;
    injectStyle();
    document.body.insertAdjacentHTML('beforeend',`<div id="stable110">
      <div class="s110-head"><div><h2>Input Breakage</h2><div class="s110-sub" id="s110Who">—</div></div><button type="button" class="s110-close" id="s110Close">×</button></div>
      <div class="s110-body">
        <div class="s110-grid">
          <div class="s110-card"><label class="s110-label">RDC</label><input class="s110-input s110-read" id="s110Rdc" readonly></div>
          <div class="s110-card"><label class="s110-label">Diinput Oleh</label><input class="s110-input s110-read" id="s110InputBy" readonly></div>
        </div>
        <div class="s110-card"><label class="s110-label s110-req">Jenis Kejadian</label><div class="s110-chips"><button type="button" class="s110-chip" data-s110-type="delivery">Kiriman</button><button type="button" class="s110-chip active" data-s110-type="warehouse">Gudang</button></div></div>
        <div class="s110-grid">
          <div class="s110-card"><label class="s110-label s110-req">Tanggal</label><input class="s110-input" type="date" id="s110Date"></div>
          <div class="s110-card"><label class="s110-label">No BA</label><input class="s110-input s110-read" value="AUTO / SETELAH SIMPAN" readonly></div>
        </div>
        <div class="s110-card"><label class="s110-label s110-req">Kode Item</label><input class="s110-input" id="s110Item" autocomplete="off"></div>
        <div class="s110-card"><label class="s110-label s110-req">Series / Motif</label><input class="s110-input" id="s110Series" autocomplete="off" placeholder="Contoh: S050S / motif / warna"></div>
        <div class="s110-card"><label class="s110-label s110-req">Jenis Produk</label><div class="s110-chips" id="s110Kinds">${KINDS.map(k=>`<button type="button" class="s110-chip" data-s110-kind="${k}">${k}</button>`).join('')}</div></div>
        <div class="s110-card"><label class="s110-label s110-req">Size</label><div class="s110-chips s110-size" id="s110Sizes"><div style="color:#6d7d94;font-size:13px">Pilih Jenis Produk dahulu.</div></div></div>
        <div class="s110-card"><label class="s110-label s110-req">Pabrik Asal</label><div class="s110-chips"><button type="button" class="s110-chip" data-s110-factory="SRKI">SRKI</button><button type="button" class="s110-chip" data-s110-factory="RCI">RCI</button></div></div>
        <div class="s110-card"><label class="s110-label s110-req">Jumlah</label><div style="display:flex;align-items:center;gap:8px"><input class="s110-input" id="s110Qty" type="number" min="1" step="1" value="1"><b>BOX</b></div></div>
        <div class="s110-card"><label class="s110-label s110-req">Pelapor / Reported By</label><input class="s110-input" id="s110Reported"></div>
        <div id="s110Delivery" style="display:none">
          <div class="s110-card"><label class="s110-label s110-req">No Surat Jalan</label><input class="s110-input" id="s110Sj"></div>
          <div class="s110-card"><label class="s110-label s110-req">Pelanggan</label><input class="s110-input" id="s110Customer"></div>
          <div class="s110-card"><label class="s110-label s110-req">Nama Penerima BA</label><input class="s110-input" id="s110Receiver" placeholder="Nama penerima / PIC penerima"></div>
          <div class="s110-card"><label class="s110-label s110-req">Vendor Transport</label><select class="s110-select" id="s110Vendor"><option value="">Pilih Vendor Transport</option></select></div>
          <div class="s110-card"><label class="s110-label s110-req">Driver / No Polisi</label><select class="s110-select" id="s110Driver"><option value="">Pilih Vendor dahulu</option></select></div>
          <div class="s110-card"><label class="s110-label s110-req">Saksi Pemeriksa BA</label><input class="s110-input" id="s110Witness" placeholder="Nama saksi pemeriksa"></div>
        </div>
        <div id="s110Warehouse">
          <div class="s110-card"><label class="s110-label s110-req">Kejadian Gudang</label><div class="s110-chips"><button type="button" class="s110-chip active" data-s110-wh="Pecah Dalam Pallet">Pecah Dalam Pallet</button><button type="button" class="s110-chip" data-s110-wh="Misshandling">Misshandling</button></div></div>
          <div class="s110-card" id="s110RelatedCard" style="display:none"><label class="s110-label s110-req">Nama Terkait</label><input class="s110-input" id="s110Related"></div>
        </div>
        <div class="s110-card"><label class="s110-label s110-req">Penyebab</label><div class="s110-chips" id="s110Causes">${CAUSES.map(c=>`<button type="button" class="s110-chip ${c==='Packaging / Pallet'?'active':''}" data-s110-cause="${esc(c)}">${esc(c)}</button>`).join('')}</div><textarea class="s110-input" id="s110Detail" rows="3" style="margin-top:9px;height:auto" placeholder="Keterangan penyebab / kejadian"></textarea></div>
        <div class="s110-card"><label class="s110-label s110-req">Foto Bukti 1–5</label><div style="font-size:12px;color:#6d7d94">Minimal 1 foto, maksimal 5 foto.</div><div class="s110-photo-row"><label class="s110-photo-btn" for="s110Photos">📷 Ambil Foto / Pilih Galeri</label><input id="s110Photos" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden></div><div class="s110-previews" id="s110Previews"></div></div>
        <div class="s110-msg" id="s110Msg"></div>
      </div>
      <div class="s110-foot"><button type="button" class="s110-save" id="s110Local">Simpan Draft Lokal</button><button type="button" class="s110-submit" id="s110Submit">Simpan Draft ke Sistem</button></div>
    </div>`);
    bind();
  }

  function setMsg(text,type='err'){const m=$('s110Msg');if(!m)return;m.className=`s110-msg show ${type}`;m.textContent=text;m.scrollIntoView({behavior:'smooth',block:'nearest'})}
  function clearMsg(){const m=$('s110Msg');if(m){m.className='s110-msg';m.textContent=''}}
  function setActive(selector,attr,value){document.querySelectorAll(selector).forEach(b=>b.classList.toggle('active',String(b.getAttribute(attr))===String(value)))}
  function sizes(kind){return (MASTER.products.length?MASTER.products:FALLBACK).filter(x=>up(x.product_type)===up(kind)).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(x=>String(x.product_size||''))}
  function renderSizes(){const box=$('s110Sizes'),rows=sizes(KIND110);if(!KIND110){box.innerHTML='<div style="color:#6d7d94;font-size:13px">Pilih Jenis Produk dahulu.</div>';SIZE110='';return}if(!rows.length){box.innerHTML='<div style="color:#b42318;font-size:13px">Master Size belum tersedia untuk jenis ini.</div>';SIZE110='';return}box.innerHTML=rows.map(s=>`<button type="button" class="s110-chip ${up(s)===up(SIZE110)?'active':''}" data-s110-size="${esc(s)}">${esc(s)}</button>`).join('');box.querySelectorAll('[data-s110-size]').forEach(b=>b.onclick=()=>{SIZE110=b.dataset.s110Size||'';renderSizes();saveLocal(false)})}
  function renderDrivers(){const v=$('s110Vendor').value,driver=$('s110Driver'),vendor=MASTER.vendors.find(x=>String(x.name||'')===v);const rows=(MASTER.drivers||[]).filter(x=>x.active!==false && ((vendor&&Number(x.vendor_id)===Number(vendor.id)) || up(x.vendor_name||'')===up(v)));driver.innerHTML='<option value="">'+(v?'Pilih Driver / No Polisi':'Pilih Vendor dahulu')+'</option>'+rows.map(x=>`<option value="${esc(x.name||'')}" data-plate="${esc(x.plate||'')}">${esc(x.plate||'—')} - ${esc(x.name||'')}</option>`).join('')}
  async function loadMaster(){
    const [p,l]=await Promise.allSettled([rpc110('breakage_product_master_list_v94',{}),rpc110('logistics_master_list',{p_rdc:rdc()})]);
    MASTER.products=p.status==='fulfilled'&&Array.isArray(p.value)&&p.value.length?p.value:FALLBACK.slice();
    if(l.status==='fulfilled'&&l.value){MASTER.vendors=(l.value.vendors||[]).filter(x=>x.active!==false);MASTER.drivers=(l.value.drivers||[]).filter(x=>x.active!==false)}
    const v=$('s110Vendor');v.innerHTML='<option value="">Pilih Vendor Transport</option>'+MASTER.vendors.map(x=>`<option value="${esc(x.name||'')}">${esc(x.name||'')}</option>`).join('');renderSizes();renderDrivers();
  }

  function bind(){
    $('s110Close').onclick=close110;
    document.querySelectorAll('[data-s110-type]').forEach(b=>b.onclick=()=>{TYPE110=b.dataset.s110Type;setActive('[data-s110-type]','data-s110-type',TYPE110);$('s110Delivery').style.display=TYPE110==='delivery'?'block':'none';$('s110Warehouse').style.display=TYPE110==='warehouse'?'block':'none';saveLocal(false)});
    document.querySelectorAll('[data-s110-kind]').forEach(b=>b.onclick=()=>{KIND110=b.dataset.s110Kind;SIZE110='';setActive('[data-s110-kind]','data-s110-kind',KIND110);renderSizes();saveLocal(false)});
    document.querySelectorAll('[data-s110-factory]').forEach(b=>b.onclick=()=>{FACTORY110=b.dataset.s110Factory;setActive('[data-s110-factory]','data-s110-factory',FACTORY110);saveLocal(false)});
    document.querySelectorAll('[data-s110-cause]').forEach(b=>b.onclick=()=>{CAUSE110=b.dataset.s110Cause;setActive('[data-s110-cause]','data-s110-cause',CAUSE110);saveLocal(false)});
    document.querySelectorAll('[data-s110-wh]').forEach(b=>b.onclick=()=>{setActive('[data-s110-wh]','data-s110-wh',b.dataset.s110Wh);$('s110RelatedCard').style.display=b.dataset.s110Wh==='Misshandling'?'block':'none';saveLocal(false)});
    $('s110Vendor').onchange=()=>{renderDrivers();saveLocal(false)};$('s110Driver').onchange=()=>saveLocal(false);
    $('s110Photos').onchange=e=>{const incoming=Array.from(e.target.files||[]);if(PHOTOS110.length+incoming.length>5){setMsg('Maksimal 5 foto per insiden.');e.target.value='';return}const bad=incoming.find(f=>!/^image\/(jpeg|png|webp)$/i.test(f.type||''));if(bad){setMsg('Gunakan foto JPG, PNG, atau WEBP.');e.target.value='';return}PHOTOS110.push(...incoming);e.target.value='';renderPhotos()};
    $('s110Local').onclick=()=>saveLocal(true);$('s110Submit').onclick=submit110;
    ['s110Date','s110Item','s110Series','s110Qty','s110Reported','s110Sj','s110Customer','s110Receiver','s110Witness','s110Related','s110Detail'].forEach(id=>{const e=$(id);if(e)e.oninput=()=>saveLocal(false)});
  }

  function photoKey(){return 'sls_breakage_stable110_'+userId()}
  function snapshot(){return {type:TYPE110,kind:KIND110,size:SIZE110,factory:FACTORY110,cause:CAUSE110,date:$('s110Date').value,item:up($('s110Item').value),series:up($('s110Series').value),qty:$('s110Qty').value,reported:up($('s110Reported').value),sj:up($('s110Sj').value),customer:up($('s110Customer').value),receiver:up($('s110Receiver').value),vendor:$('s110Vendor').value,driver:$('s110Driver').value,witness:up($('s110Witness').value),wh:document.querySelector('[data-s110-wh].active')?.dataset?.s110Wh||'Pecah Dalam Pallet',related:up($('s110Related').value),detail:up($('s110Detail').value)}}
  function saveLocal(show=true){try{localStorage.setItem(photoKey(),JSON.stringify(snapshot()));if(show)setMsg('Draft lokal tersimpan. Foto tidak disimpan ke draft lokal.','ok')}catch(_){if(show)setMsg('Draft lokal tidak dapat disimpan pada browser ini.')}}
  function restoreLocal(){try{const d=JSON.parse(localStorage.getItem(photoKey())||'{}');if(!d||!Object.keys(d).length)return;TYPE110=d.type||TYPE110;KIND110=d.kind||'';SIZE110=d.size||'';FACTORY110=d.factory||'';CAUSE110=d.cause||CAUSE110;[['s110Date','date'],['s110Item','item'],['s110Series','series'],['s110Qty','qty'],['s110Reported','reported'],['s110Sj','sj'],['s110Customer','customer'],['s110Receiver','receiver'],['s110Witness','witness'],['s110Related','related'],['s110Detail','detail']].forEach(([id,k])=>{if(d[k]!==undefined&&$(id))$(id).value=d[k]});setActive('[data-s110-type]','data-s110-type',TYPE110);setActive('[data-s110-kind]','data-s110-kind',KIND110);setActive('[data-s110-factory]','data-s110-factory',FACTORY110);setActive('[data-s110-cause]','data-s110-cause',CAUSE110);setActive('[data-s110-wh]','data-s110-wh',d.wh||'Pecah Dalam Pallet');$('s110Delivery').style.display=TYPE110==='delivery'?'block':'none';$('s110Warehouse').style.display=TYPE110==='warehouse'?'block':'none';$('s110RelatedCard').style.display=(d.wh==='Misshandling')?'block':'none';setTimeout(()=>{if(d.vendor){$('s110Vendor').value=d.vendor;renderDrivers();$('s110Driver').value=d.driver||''}},100)}catch(_){}}
  function renderPhotos(){PREVIEW_URLS.forEach(URL.revokeObjectURL);PREVIEW_URLS=[];$('s110Previews').innerHTML=PHOTOS110.map((f,i)=>{const u=URL.createObjectURL(f);PREVIEW_URLS.push(u);return `<div class="s110-prev"><img src="${u}" alt="Foto ${i+1}"><button type="button" class="s110-x" data-del-photo="${i}">×</button></div>`}).join('');$('s110Previews').querySelectorAll('[data-del-photo]').forEach(b=>b.onclick=()=>{PHOTOS110.splice(Number(b.dataset.delPhoto),1);renderPhotos()})}

  async function open110(){
    if(!canInput()){alert('Akun ini tidak memiliki hak input breakage.');return}
    build();clearMsg();PHOTOS110=[];renderPhotos();$('stable110').classList.add('show');$('s110Rdc').value=rdc();$('s110InputBy').value=userId();$('s110Who').textContent=`${up(ACCESS?.breakage_role||ACCESS?.role||'OPERATOR WAREHOUSE')} · ${rdc()}`;$('s110Date').value=new Date().toISOString().slice(0,10);$('s110Reported').value=up(userId());restoreLocal();await loadMaster();setActive('[data-s110-kind]','data-s110-kind',KIND110);renderSizes();document.body.style.overflow='hidden';const b=$('buildBadge');if(b)b.textContent='v110';
  }
  function close110(){if(BUSY110)return;$('stable110')?.classList.remove('show');document.body.style.overflow='';}

  function validate(){const d=snapshot(),miss=[];if(!d.date)miss.push('Tanggal');if(!d.item)miss.push('Kode Item');if(!d.series)miss.push('Series / Motif');if(!KINDS.includes(d.kind))miss.push('Jenis Produk');if(!d.size)miss.push('Size');if(!['SRKI','RCI'].includes(d.factory))miss.push('Pabrik Asal');if(!(Number(d.qty)>0))miss.push('Jumlah');if(!d.reported)miss.push('Pelapor');if(PHOTOS110.length<1)miss.push('Foto');if(TYPE110==='delivery'){if(!d.sj)miss.push('No Surat Jalan');if(!d.customer)miss.push('Pelanggan');if(!d.receiver)miss.push('Nama Penerima BA');if(!d.vendor)miss.push('Vendor Transport');if(!d.driver)miss.push('Driver / No Polisi');if(!d.witness)miss.push('Saksi Pemeriksa BA')}else{if(!['Pecah Dalam Pallet','Misshandling'].includes(d.wh))miss.push('Kejadian Gudang');if(d.wh==='Misshandling'&&!d.related)miss.push('Nama Terkait')}if(CAUSE110==='Lainnya'&&!d.detail)miss.push('Keterangan Penyebab');return [...new Set(miss)]}

  async function toJpeg(file){
    await new Promise(r=>setTimeout(r,0));let src=null;
    try{if(window.createImageBitmap)src=await createImageBitmap(file,{imageOrientation:'from-image'})}catch(_){try{if(window.createImageBitmap)src=await createImageBitmap(file)}catch(__){}}
    if(!src)src=await new Promise((resolve,reject)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{URL.revokeObjectURL(u);resolve(im)};im.onerror=()=>{URL.revokeObjectURL(u);reject(new Error('Foto tidak dapat dibaca. Gunakan JPG/PNG/WEBP.'))};im.src=u});
    const sw=src.width||src.naturalWidth,sh=src.height||src.naturalHeight,scale=Math.min(1,1100/Math.max(sw,sh)),w=Math.max(1,Math.round(sw*scale)),h=Math.max(1,Math.round(sh*scale)),c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(src,0,0,w,h);if(src.close)src.close();const blob=await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('Kompresi foto gagal')),'image/jpeg',.68));return blob;
  }
  async function uploadPhotos(){const paths=[],safe=String(rdc()).replace(/[^A-Za-z0-9_-]/g,'_'),batch='draft_'+(crypto.randomUUID?crypto.randomUUID():Date.now());for(let i=0;i<PHOTOS110.length;i++){setMsg(`Mengunggah foto ${i+1} dari ${PHOTOS110.length}…`,'wait');const blob=await toJpeg(PHOTOS110[i]),path=`${safe}/${batch}/${Date.now()}_${i+1}.jpg`,encoded=path.split('/').map(encodeURIComponent).join('/');const r=await fetch(`${SUPABASE_URL}/storage/v1/object/breakage-evidence/${encoded}`,{method:'POST',headers:{apikey:PUBLIC_ANON,Authorization:`Bearer ${auth()}`,'Content-Type':'image/jpeg','x-upsert':'false'},body:blob});if(!r.ok)throw new Error('Upload foto gagal: '+cleanErr(await r.text()));paths.push(path);await new Promise(x=>setTimeout(x,0))}return paths}

  async function submit110(){
    if(BUSY110)return;const miss=validate();if(miss.length){setMsg('Lengkapi: '+miss.join(', '));return}
    BUSY110=true;$('s110Submit').disabled=true;try{
      const d=snapshot();setMsg('Menyiapkan foto…','wait');const photoPaths=await uploadPhotos();const driver=$('s110Driver'),plate=driver.selectedOptions?.[0]?.dataset?.plate||'';
      const payload={incident_type:TYPE110,occurrence_date:d.date,item_code:d.item,ceramic_series:d.series,product_kind:d.kind,product_type:d.kind,product_size:d.size,qty_box:Number(d.qty),uom:'BOX',rdc_name:rdc(),reported_by:d.reported,factory:d.factory,cause:CAUSE110,cause_detail:d.detail,photo_paths:photoPaths};
      if(TYPE110==='delivery')Object.assign(payload,{no_sj:d.sj,customer:d.customer,ba_receiver_name:d.receiver,transporter:d.vendor,driver_name:d.driver,vehicle_no:up(plate),ba_witness_name:d.witness});
      else Object.assign(payload,{warehouse_event:d.wh,related_person:d.related});
      setMsg('Menyimpan Draft ke sistem…','wait');const res=await rpc110('breakage_incident_create_v94',{p_payload:payload});
      setMsg(`Berhasil. ${res?.incident_no||'Incident'} · ${res?.no_ba||'BA terbentuk'} tersimpan dan menunggu review SPV.`,'ok');localStorage.removeItem(photoKey());PHOTOS110=[];renderPhotos();if(typeof loadHistory==='function'){try{PERIOD=d.date.slice(0,7);if(typeof initPeriods==='function')initPeriods();await loadHistory()}catch(_){ }}setTimeout(close110,1300);
    }catch(e){setMsg('Gagal simpan: '+cleanErr(e.message||e));}
    finally{BUSY110=false;$('s110Submit').disabled=false}
  }

  function takeover(){build();if($('newBtn'))$('newBtn').onclick=open110;if($('navInput'))$('navInput').onclick=open110;try{openInput=open110;window.openInput=open110}catch(_){ }const old=$('incidentModal');if(old)old.classList.remove('show');const b=$('buildBadge');if(b)b.textContent='v110'}
  [100,400,1000,2200].forEach(ms=>setTimeout(takeover,ms));
})();