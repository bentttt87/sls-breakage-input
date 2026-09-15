// SLS Breakage Input — BA picker stable v104. No mutation loop; popup opened synchronously.
(function(){
  'use strict';
  const el=id=>document.getElementById(id);
  const up=s=>String(s??'').trim().toUpperCase();
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let BA_LIST=[];
  let LOAD_SEQ=0;
  let OPENING=false;

  function roleText(){
    try{return up(ACCESS?.role||ACCESS?.role_name||el('roleChip')?.textContent||el('who')?.textContent||'');}
    catch(_){return up(el('roleChip')?.textContent||el('who')?.textContent||'');}
  }
  function canUse(){
    try{if(ACCESS?.can_input||ACCESS?.can_submit_approve||ACCESS?.can_manage_logistics||ACCESS?.is_manager||ACCESS?.is_master)return true;}catch(_){ }
    return /(ADMIN|STAFF|OPERATOR|SPV|SUPERVISOR|MANAGER|MGR|MASTER)/.test(roleText());
  }
  function scopeRdc(){
    try{return typeof effectiveScope==='function' ? effectiveScope() : (ACCESS?.rdc_name||null);}catch(_){return null;}
  }
  function fmtDate(v){
    if(!v)return '—';
    try{return new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(v+'T00:00:00'));}catch(_){return v;}
  }
  function errText(e){
    try{return typeof cleanErr==='function'?cleanErr(e?.message||e):String(e?.message||e||'Gagal');}catch(_){return String(e?.message||e||'Gagal');}
  }
  function timeout(p,ms,label){
    return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error(label||'Waktu tunggu habis. Silakan coba lagi.')),ms))]);
  }

  function ensureUi(){
    if(!canUse())return;
    const actions=document.querySelector('.actions');
    if(!actions)return;
    let b=el('baPickerBtn');
    if(!b){
      b=document.createElement('button');b.className='secondary';b.id='baPickerBtn';b.type='button';b.textContent='⬇ Download BA + Foto';
      const anchor=el('logisticsBtn')||el('refreshBtn');
      if(anchor?.parentNode===actions)anchor.insertAdjacentElement('afterend',b);else actions.appendChild(b);
    }
    if(!el('baPickerModal')){
      document.body.insertAdjacentHTML('beforeend',`
      <div id="baPickerModal" class="overlay" aria-hidden="true">
        <div class="modal" style="width:min(760px,100%)">
          <div class="modal-head"><div><h2>Download Berita Acara + Lampiran Foto</h2><div class="small" style="opacity:.82">Pilih BA. Berita Acara dan foto evidence dibuka sebagai satu dokumen.</div></div><div class="grow"></div><button class="close" id="baPickerClose" type="button">✕</button></div>
          <div class="modal-body">
            <div class="hint"><b>Filter BA</b><br>Tanggal boleh dikosongkan untuk menampilkan seluruh BA dalam scope RDC. Search dapat mencari No BA, No SJ, Customer, Vendor, Driver, atau No Polisi.</div>
            <div class="form-grid" style="margin-top:10px">
              <div class="field"><label>Tanggal Kejadian</label><input id="baPickerDate" type="date"></div>
              <div class="field"><label>Search</label><input id="baPickerSearch" type="search" placeholder="Cari BA / SJ / customer / vendor / driver / polisi"></div>
              <div class="field span2"><label>Nomor BA</label><select id="baPickerSelect"><option value="">Pilih Nomor BA</option></select></div>
            </div>
            <div id="baPickerCount" class="smallnote" style="margin-top:8px"></div>
            <div id="baPickerInfo" class="hint" style="margin-top:10px;display:none"></div>
            <div id="baPickerMsg" class="small" style="margin-top:8px;color:#b42318"></div>
          </div>
          <div class="modal-foot"><button class="secondary" id="baPickerReload" type="button">↻ Muat Ulang</button><button class="primary" id="baPickerPrint" type="button" disabled>⬇ Buka BA + Foto</button></div>
        </div>
      </div>`);
    }
    b.textContent='⬇ Download BA + Foto';
    b.onclick=openPicker;
    el('baPickerClose').onclick=closePicker;
    el('baPickerReload').onclick=()=>loadBaList(true);
    el('baPickerDate').onchange=()=>loadBaList(true);
    el('baPickerSearch').oninput=renderOptions;
    el('baPickerSelect').onchange=renderSelected;
    el('baPickerPrint').onclick=printSelected;
  }
  function closePicker(){const m=el('baPickerModal');if(m){m.classList.remove('show');m.setAttribute('aria-hidden','true');}}
  async function openPicker(){
    if(OPENING)return;OPENING=true;
    try{
      ensureUi();const m=el('baPickerModal');if(!m)return;
      m.classList.add('show');m.setAttribute('aria-hidden','false');
      el('baPickerMsg').textContent='';
      await loadBaList(false);
    }finally{OPENING=false;}
  }
  async function loadBaList(force){
    const select=el('baPickerSelect');if(!select)return;
    const seq=++LOAD_SEQ;
    select.disabled=true;select.innerHTML='<option value="">Memuat daftar BA...</option>';
    const pb=el('baPickerPrint');pb.disabled=true;
    const info=el('baPickerInfo');info.style.display='none';
    el('baPickerMsg').textContent='Memuat daftar BA…';
    try{
      const date=el('baPickerDate')?.value||null;
      const rows=await timeout(Promise.resolve(rpc('breakage_ba_search_v84',{p_date:date,p_rdc:scopeRdc()})),12000,'Daftar BA terlalu lama dimuat. Tekan Muat Ulang.');
      if(seq!==LOAD_SEQ)return;
      BA_LIST=Array.isArray(rows)?rows:[];
      el('baPickerMsg').textContent='';
      renderOptions();
    }catch(e){
      if(seq!==LOAD_SEQ)return;
      BA_LIST=[];select.innerHTML='<option value="">Gagal memuat BA</option>';
      el('baPickerCount').textContent='';el('baPickerMsg').textContent='Gagal: '+errText(e);
    }finally{if(seq===LOAD_SEQ)select.disabled=false;}
  }
  function filtered(){
    const q=up(el('baPickerSearch')?.value||'');if(!q)return BA_LIST;
    return BA_LIST.filter(x=>[x.no_ba,x.no_sj,x.customer,x.transporter,x.vehicle_no,x.driver_name].some(v=>up(v).includes(q)));
  }
  function renderOptions(){
    const select=el('baPickerSelect');if(!select)return;
    const keep=select.value,rows=filtered();
    select.innerHTML='<option value="">Pilih Nomor BA</option>'+rows.map(x=>{
      const label=[x.no_ba,fmtDate(x.occurrence_date),x.no_sj?('SJ '+x.no_sj):'',x.customer||'',`${x.item_count||0} item`].filter(Boolean).join(' · ');
      return `<option value="${esc(x.no_ba)}" ${up(keep)===up(x.no_ba)?'selected':''}>${esc(label)}</option>`;
    }).join('');
    el('baPickerCount').textContent=`${rows.length.toLocaleString('id-ID')} BA ditemukan${el('baPickerDate')?.value?' pada tanggal terpilih':' (seluruh tanggal)'}.`;
    if(!rows.length)select.innerHTML='<option value="">Tidak ada BA sesuai filter</option>';
    renderSelected();
  }
  function renderSelected(){
    const no=el('baPickerSelect')?.value||'',row=BA_LIST.find(x=>up(x.no_ba)===up(no)),pb=el('baPickerPrint'),info=el('baPickerInfo');
    pb.disabled=!row;pb.textContent=row?'⬇ Buka BA + Foto':'⬇ Pilih BA dahulu';
    if(!row){info.style.display='none';info.innerHTML='';return;}
    info.style.display='block';
    info.innerHTML=`<b>${esc(row.no_ba)}</b><br>${esc(fmtDate(row.occurrence_date))} · SJ ${esc(row.no_sj||'—')} · ${esc(row.customer||'—')}<br>${esc(row.transporter||'—')} · ${esc(row.vehicle_no||'—')} · ${Number(row.item_count||0)} item · ${Number(row.total_qty||0).toLocaleString('id-ID')} BOX<br><span class="smallnote">Output: 1 dokumen BA + seluruh lampiran foto evidence.</span>`;
  }
  async function printSelected(){
    const no=el('baPickerSelect')?.value||'';if(!no)return;
    const b=el('baPickerPrint');if(b.dataset.busy==='1')return;
    // Open synchronously while click gesture is still active; prevents popup blocking/freeze after await.
    const w=window.open('about:blank','_blank');
    if(!w){el('baPickerMsg').textContent='Popup diblokir browser. Izinkan popup untuk membuka BA.';return;}
    try{w.document.write('<!doctype html><title>Memuat BA</title><body style="font-family:Arial;padding:24px">Memuat Berita Acara + foto…</body>');w.document.close();}catch(_){ }
    b.dataset.busy='1';b.disabled=true;b.textContent='Memuat BA…';el('baPickerMsg').textContent='';
    try{
      const data=await timeout(Promise.resolve(rpc('breakage_ba_get_v84',{p_no_ba:no})),15000,'Data BA terlalu lama dimuat. Silakan coba lagi.');
      if(!data)throw new Error('Data BA tidak ditemukan.');
      const key='sls_ba_print_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
      localStorage.setItem(key,JSON.stringify(data));
      w.location.replace('/ba_print.html?k='+encodeURIComponent(key)+'&v=104');
    }catch(e){
      el('baPickerMsg').textContent='Gagal: '+errText(e);
      try{w.document.body.innerHTML='<div style="font-family:Arial;padding:24px;color:#b42318"><b>Gagal membuka BA.</b><br>'+esc(errText(e))+'</div>';}catch(_){try{w.close();}catch(__){ }}
    }finally{delete b.dataset.busy;b.disabled=false;b.textContent='⬇ Buka BA + Foto';}
  }

  // Old versions installed a subtree+attribute MutationObserver which could recursively retrigger itself.
  // v104 deliberately uses only low-frequency hooks and does not observe attributes.
  function afterAppRender(){setTimeout(ensureUi,0);}
  try{const prev=window.showApp||showApp;window.showApp=async function(){const r=await prev.apply(this,arguments);afterAppRender();return r};showApp=window.showApp;}catch(_){ }
  try{const prev=window.loadHistory||loadHistory;window.loadHistory=async function(){const r=await prev.apply(this,arguments);afterAppRender();return r};loadHistory=window.loadHistory;}catch(_){ }
  document.addEventListener('click',e=>{if(['refreshBtn','logisticsBtn'].includes(e.target?.id))setTimeout(ensureUi,150)},false);
  [50,250,700,1500,3000].forEach(ms=>setTimeout(ensureUi,ms));
  window.__SLS_BA_PICKER_VERSION='v104';
})();
