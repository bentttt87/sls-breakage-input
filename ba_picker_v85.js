// SLS Breakage Input — BA picker v105. Instant local list, background sync, duplicate-safe DOM.
(function(){
  'use strict';
  const el=id=>document.getElementById(id);
  const up=s=>String(s??'').trim().toUpperCase();
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let BA_LIST=[]; let LOAD_SEQ=0;
  function roleText(){try{return up(ACCESS?.role||ACCESS?.role_name||el('roleChip')?.textContent||el('who')?.textContent||'')}catch(_){return ''}}
  function canUse(){try{if(ACCESS?.can_input||ACCESS?.can_submit_approve||ACCESS?.can_manage_logistics||ACCESS?.is_manager||ACCESS?.is_master)return true}catch(_){ }return /(ADMIN|STAFF|OPERATOR|SPV|SUPERVISOR|MANAGER|MGR|MASTER)/.test(roleText())}
  function scopeRdc(){try{return typeof effectiveScope==='function'?effectiveScope():(ACCESS?.rdc_name||null)}catch(_){return null}}
  function fmtDate(v){if(!v)return '—';try{return new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(v+'T00:00:00'))}catch(_){return v}}
  function errText(e){try{return typeof cleanErr==='function'?cleanErr(e?.message||e):String(e?.message||e||'Gagal')}catch(_){return String(e?.message||e||'Gagal')}}
  function timeout(p,ms,label){return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error(label)),ms))])}

  function removeDuplicates(id){const a=[...document.querySelectorAll('#'+id)];a.slice(1).forEach(x=>x.remove())}
  function ensureUi(){
    if(!canUse())return; const actions=document.querySelector('.actions'); if(!actions)return;
    removeDuplicates('baPickerBtn'); removeDuplicates('baPickerModal');
    let b=el('baPickerBtn');
    if(!b){b=document.createElement('button');b.className='secondary';b.id='baPickerBtn';b.type='button';b.textContent='⬇ Download BA + Foto';const anchor=el('logisticsBtn')||el('refreshBtn');if(anchor?.parentNode===actions)anchor.insertAdjacentElement('afterend',b);else actions.appendChild(b)}
    if(!el('baPickerModal'))document.body.insertAdjacentHTML('beforeend',`<div id="baPickerModal" class="overlay" aria-hidden="true"><div class="modal" style="width:min(760px,100%)"><div class="modal-head"><div><h2>Download Berita Acara + Lampiran Foto</h2><div class="small" style="opacity:.82">Pilih BA. Berita Acara dan seluruh foto evidence disatukan dalam satu dokumen.</div></div><div class="grow"></div><button class="close" id="baPickerClose" type="button">✕</button></div><div class="modal-body"><div class="hint"><b>Filter BA</b><br>Tanggal boleh dikosongkan untuk menampilkan seluruh BA dalam scope RDC. Search dapat mencari No BA, No SJ, Customer, Vendor, Driver, atau No Polisi.</div><div class="form-grid" style="margin-top:10px"><div class="field"><label>Tanggal Kejadian</label><input id="baPickerDate" type="date"></div><div class="field"><label>Search</label><input id="baPickerSearch" type="search" placeholder="Cari BA / SJ / customer / vendor / driver / polisi"></div><div class="field span2"><label>Nomor BA</label><select id="baPickerSelect"><option value="">Pilih Nomor BA</option></select></div></div><div id="baPickerCount" class="smallnote" style="margin-top:8px"></div><div id="baPickerInfo" class="hint" style="margin-top:10px;display:none"></div><div id="baPickerMsg" class="small" style="margin-top:8px;color:#b42318"></div></div><div class="modal-foot"><button class="secondary" id="baPickerReload" type="button">↻ Muat Ulang</button><button class="primary" id="baPickerPrint" type="button" disabled>⬇ Pilih BA dahulu</button></div></div></div>`);
    b.textContent='⬇ Download BA + Foto'; b.onclick=openPicker;
    el('baPickerClose').onclick=closePicker; el('baPickerReload').onclick=()=>loadBaList(true); el('baPickerDate').onchange=()=>loadBaList(true); el('baPickerSearch').oninput=renderOptions; el('baPickerSelect').onchange=renderSelected; el('baPickerPrint').onclick=printSelected;
  }
  function closePicker(){const m=el('baPickerModal');if(m){m.classList.remove('show');m.setAttribute('aria-hidden','true')}}

  function localRows(){
    try{
      const src=Array.isArray(INCIDENTS)?INCIDENTS:[]; const map=new Map(); const date=el('baPickerDate')?.value||'';
      src.filter(r=>String(r.incident_type||'').toLowerCase()==='delivery'&&String(r.no_ba||'').trim()&&(!date||r.occurrence_date===date)).forEach(r=>{
        const k=up(r.no_ba); if(!map.has(k))map.set(k,{no_ba:r.no_ba,rdc:r.rdc||r.rdc_name||scopeRdc(),occurrence_date:r.occurrence_date,no_sj:r.no_sj||'',customer:r.customer||'',transporter:r.transporter||'',driver_name:r.driver_name||'',vehicle_no:r.vehicle_no||'',item_count:0,total_qty:0,photo_count:0,status:r.status||''});
        const x=map.get(k);x.item_count++;x.total_qty+=Number(r.qty_box||0);x.photo_count+=(Array.isArray(r.photo_paths)?r.photo_paths.length:0);
      }); return [...map.values()].sort((a,b)=>String(b.occurrence_date).localeCompare(String(a.occurrence_date))||String(b.no_ba).localeCompare(String(a.no_ba)));
    }catch(_){return []}
  }
  function openPicker(){ensureUi();const m=el('baPickerModal');if(!m)return;m.classList.add('show');m.setAttribute('aria-hidden','false');el('baPickerMsg').textContent='';const local=localRows();if(local.length){BA_LIST=local;renderOptions(true);el('baPickerMsg').textContent='Menyinkronkan daftar BA terbaru…';}else{setSelectMessage('Memuat daftar BA…');}loadBaList(false)}
  function setSelectMessage(text){const s=el('baPickerSelect');if(!s)return;s.replaceChildren(new Option(text,''));s.disabled=true;const pb=el('baPickerPrint');if(pb){pb.disabled=true;pb.textContent='⬇ Pilih BA dahulu'}}
  async function loadBaList(force){
    const seq=++LOAD_SEQ; const local=localRows(); if(force&&!local.length)setSelectMessage('Memuat daftar BA…');
    if(el('baPickerMsg'))el('baPickerMsg').textContent=local.length?'Menyinkronkan daftar BA terbaru…':'Memuat daftar BA…';
    try{
      const date=el('baPickerDate')?.value||null;
      const rows=await timeout(Promise.resolve(rpc('breakage_ba_search_v84',{p_date:date,p_rdc:scopeRdc()})),8000,'Daftar BA terlalu lama dimuat. Tekan Muat Ulang.');
      if(seq!==LOAD_SEQ)return; BA_LIST=Array.isArray(rows)?rows:[]; renderOptions(false); el('baPickerMsg').textContent='';
    }catch(e){
      if(seq!==LOAD_SEQ)return;
      if(local.length){BA_LIST=local;renderOptions(true);el('baPickerMsg').textContent='Daftar terbaru belum tersinkron. Menampilkan BA dari riwayat yang sudah termuat.';}
      else{BA_LIST=[];setSelectMessage('Gagal memuat BA');el('baPickerCount').textContent='';el('baPickerMsg').textContent='Gagal: '+errText(e)}
    }
  }
  function filtered(){const q=up(el('baPickerSearch')?.value||'');if(!q)return BA_LIST;return BA_LIST.filter(x=>[x.no_ba,x.no_sj,x.customer,x.transporter,x.vehicle_no,x.driver_name].some(v=>up(v).includes(q)))}
  function renderOptions(fromLocal){
    const s=el('baPickerSelect');if(!s)return; const keep=s.value; const rows=filtered(); const frag=document.createDocumentFragment(); frag.appendChild(new Option(rows.length?'Pilih Nomor BA':'Tidak ada BA sesuai filter',''));
    rows.forEach(x=>{const label=[x.no_ba,fmtDate(x.occurrence_date),x.no_sj?('SJ '+x.no_sj):'',x.customer||'',`${x.item_count||0} item`].filter(Boolean).join(' · ');const o=new Option(label,String(x.no_ba||''));frag.appendChild(o)});
    s.replaceChildren(frag); s.disabled=false;
    if(keep&&rows.some(x=>up(x.no_ba)===up(keep)))s.value=keep; else if(rows.length===1)s.value=String(rows[0].no_ba||'');
    el('baPickerCount').textContent=`${rows.length.toLocaleString('id-ID')} BA ditemukan${el('baPickerDate')?.value?' pada tanggal terpilih':' (seluruh tanggal)'}${fromLocal?' · dari riwayat saat ini':''}.`; renderSelected();
  }
  function renderSelected(){const no=el('baPickerSelect')?.value||'',row=BA_LIST.find(x=>up(x.no_ba)===up(no)),pb=el('baPickerPrint'),info=el('baPickerInfo');pb.disabled=!row;pb.textContent=row?'⬇ Buka BA + Foto':'⬇ Pilih BA dahulu';if(!row){info.style.display='none';info.innerHTML='';return}info.style.display='block';info.innerHTML=`<b>${esc(row.no_ba)}</b><br>${esc(fmtDate(row.occurrence_date))} · SJ ${esc(row.no_sj||'—')} · ${esc(row.customer||'—')}<br>${esc(row.transporter||'—')} · ${esc(row.vehicle_no||'—')} · ${Number(row.item_count||0)} item · ${Number(row.total_qty||0).toLocaleString('id-ID')} BOX<br><span class="smallnote">Output: 1 dokumen BA + seluruh lampiran foto evidence.</span>`}
  async function printSelected(){const no=el('baPickerSelect')?.value||'';if(!no)return;const b=el('baPickerPrint');if(b.dataset.busy==='1')return;const w=window.open('about:blank','_blank');if(!w){el('baPickerMsg').textContent='Popup diblokir browser. Izinkan popup untuk membuka BA.';return}try{w.document.write('<!doctype html><title>Memuat BA</title><body style="font-family:Arial;padding:24px">Memuat Berita Acara + foto…</body>');w.document.close()}catch(_){ }b.dataset.busy='1';b.disabled=true;b.textContent='Memuat BA…';el('baPickerMsg').textContent='';try{const data=await timeout(Promise.resolve(rpc('breakage_ba_get_v84',{p_no_ba:no})),10000,'Data BA terlalu lama dimuat. Silakan coba lagi.');if(!data)throw new Error('Data BA tidak ditemukan.');const key='sls_ba_print_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);localStorage.setItem(key,JSON.stringify(data));w.location.replace('/ba_print.html?k='+encodeURIComponent(key)+'&v=105')}catch(e){el('baPickerMsg').textContent='Gagal: '+errText(e);try{w.document.body.innerHTML='<div style="font-family:Arial;padding:24px;color:#b42318"><b>Gagal membuka BA.</b><br>'+esc(errText(e))+'</div>'}catch(_){try{w.close()}catch(__){ }}}finally{delete b.dataset.busy;b.disabled=false;b.textContent='⬇ Buka BA + Foto'}}

  function afterRender(){setTimeout(ensureUi,0)}
  try{const prev=window.showApp||showApp;window.showApp=async function(){const r=await prev.apply(this,arguments);afterRender();return r};showApp=window.showApp}catch(_){ }
  try{const prev=window.loadHistory||loadHistory;window.loadHistory=async function(){const r=await prev.apply(this,arguments);afterRender();return r};loadHistory=window.loadHistory}catch(_){ }
  [50,250,700,1500].forEach(ms=>setTimeout(ensureUi,ms)); window.__SLS_BA_PICKER_VERSION='v105';
})();