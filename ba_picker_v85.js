// SLS Breakage Input — centralized Print BA picker (hardened v95).
(function(){
  'use strict';
  const el=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
  const up=s=>String(s??'').trim().toUpperCase();
  let BA_LIST=[];

  function roleText(){
    try{return up(ACCESS?.role||ACCESS?.role_name||el('roleChip')?.textContent||el('who')?.textContent||'');}catch(_){return up(el('roleChip')?.textContent||el('who')?.textContent||'');}
  }
  function canUse(){
    try{
      if(ACCESS?.can_input||ACCESS?.can_submit_approve||ACCESS?.can_manage_logistics||ACCESS?.is_manager||ACCESS?.is_master)return true;
    }catch(_){ }
    return /(ADMIN|STAFF|OPERATOR|SPV|SUPERVISOR|MANAGER|MGR|MASTER)/.test(roleText());
  }
  function scopeRdc(){
    try{return typeof effectiveScope==='function' ? effectiveScope() : (ACCESS?.rdc_name||null);}catch(_){return null;}
  }
  function fmtDate(v){
    if(!v)return '—';
    try{return new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(v+'T00:00:00'));}catch(_){return v;}
  }
  function ensureUi(){
    const actions=document.querySelector('.actions');
    if(!actions||!canUse())return;
    if(!el('baPickerBtn')){
      const anchor=el('logisticsBtn')||el('refreshBtn');
      const html='<button class="secondary" id="baPickerBtn">🖨 Print BA</button>';
      if(anchor)anchor.insertAdjacentHTML('afterend',html); else actions.insertAdjacentHTML('beforeend',html);
    }
    if(!el('baPickerModal')){
      document.body.insertAdjacentHTML('beforeend',`
      <div id="baPickerModal" class="overlay">
        <div class="modal" style="width:min(760px,100%)">
          <div class="modal-head"><div><h2>Print Berita Acara</h2><div class="small" style="opacity:.82">Pilih tanggal pengiriman dan Nomor BA</div></div><div class="grow"></div><button class="close" id="baPickerClose">✕</button></div>
          <div class="modal-body">
            <div class="hint"><b>Filter BA Pengiriman</b><br>Tanggal boleh dikosongkan untuk menampilkan seluruh BA dalam scope RDC. Gunakan Search untuk mencari No BA, No SJ, Customer, Vendor, Driver, atau No Polisi.</div>
            <div class="form-grid" style="margin-top:10px">
              <div class="field"><label>Tanggal Pengiriman / Kejadian</label><input id="baPickerDate" type="date"></div>
              <div class="field"><label>Search</label><input id="baPickerSearch" type="search" placeholder="Cari BA / SJ / customer / vendor / driver / polisi"></div>
              <div class="field span2"><label>Nomor BA</label><select id="baPickerSelect"><option value="">Memuat...</option></select></div>
            </div>
            <div id="baPickerCount" class="smallnote" style="margin-top:8px"></div>
            <div id="baPickerInfo" class="hint" style="margin-top:10px;display:none"></div>
            <div id="baPickerMsg" class="small" style="margin-top:8px;color:#b42318"></div>
          </div>
          <div class="modal-foot"><button class="secondary" id="baPickerReload">↻ Muat Ulang</button><button class="primary" id="baPickerPrint" disabled>🖨 Print BA</button></div>
        </div>
      </div>`);
    }
    const b=el('baPickerBtn');if(b){b.style.display='';b.textContent='🖨 Print BA';b.onclick=openPicker;}
    if(el('baPickerClose'))el('baPickerClose').onclick=()=>el('baPickerModal').classList.remove('show');
    if(el('baPickerReload'))el('baPickerReload').onclick=loadBaList;
    if(el('baPickerDate'))el('baPickerDate').onchange=loadBaList;
    if(el('baPickerSearch'))el('baPickerSearch').oninput=renderOptions;
    if(el('baPickerSelect'))el('baPickerSelect').onchange=renderSelected;
    if(el('baPickerPrint'))el('baPickerPrint').onclick=printSelected;
  }

  async function openPicker(){
    ensureUi();
    if(!el('baPickerModal'))return;
    el('baPickerModal').classList.add('show');
    el('baPickerMsg').textContent='';
    await loadBaList();
  }
  async function loadBaList(){
    const select=el('baPickerSelect'); if(!select)return;
    select.innerHTML='<option value="">Memuat daftar BA...</option>';
    el('baPickerPrint').disabled=true;
    el('baPickerInfo').style.display='none';
    el('baPickerMsg').textContent='';
    try{
      const date=el('baPickerDate').value||null;
      BA_LIST=await rpc('breakage_ba_search_v84',{p_date:date,p_rdc:scopeRdc()})||[];
      renderOptions();
    }catch(e){
      BA_LIST=[];select.innerHTML='<option value="">Gagal memuat BA</option>';
      el('baPickerCount').textContent='';
      el('baPickerMsg').textContent='Gagal: '+cleanErr(e.message);
    }
  }
  function filtered(){
    const q=up(el('baPickerSearch')?.value||'');
    if(!q)return BA_LIST;
    return BA_LIST.filter(x=>[x.no_ba,x.no_sj,x.customer,x.transporter,x.vehicle_no,x.driver_name].some(v=>up(v).includes(q)));
  }
  function renderOptions(){
    const select=el('baPickerSelect');if(!select)return;
    const keep=select.value;
    const rows=filtered();
    select.innerHTML='<option value="">Pilih Nomor BA</option>'+rows.map(x=>{
      const label=[x.no_ba,fmtDate(x.occurrence_date),x.no_sj?('SJ '+x.no_sj):'',x.customer||'',`${x.item_count||0} item`].filter(Boolean).join(' · ');
      return `<option value="${esc(x.no_ba)}" ${up(keep)===up(x.no_ba)?'selected':''}>${esc(label)}</option>`;
    }).join('');
    el('baPickerCount').textContent=`${rows.length.toLocaleString('id-ID')} BA ditemukan${el('baPickerDate').value?' pada tanggal terpilih':' (seluruh tanggal)'}.`;
    if(!rows.length)select.innerHTML='<option value="">Tidak ada BA sesuai filter</option>';
    renderSelected();
  }
  function renderSelected(){
    const no=el('baPickerSelect')?.value||'';
    const row=BA_LIST.find(x=>up(x.no_ba)===up(no));
    el('baPickerPrint').disabled=!row;
    if(!row){el('baPickerInfo').style.display='none';el('baPickerInfo').innerHTML='';return;}
    el('baPickerInfo').style.display='block';
    el('baPickerInfo').innerHTML=`<b>${esc(row.no_ba)}</b><br>${esc(fmtDate(row.occurrence_date))} · SJ ${esc(row.no_sj||'—')} · ${esc(row.customer||'—')}<br>${esc(row.transporter||'—')} · ${esc(row.vehicle_no||'—')} · ${Number(row.item_count||0)} item · ${Number(row.total_qty||0).toLocaleString('id-ID')} BOX`;
  }
  async function printSelected(){
    const no=el('baPickerSelect')?.value||'';if(!no)return;
    const b=el('baPickerPrint');b.disabled=true;b.textContent='Memuat BA...';el('baPickerMsg').textContent='';
    try{
      const data=await rpc('breakage_ba_get_v84',{p_no_ba:no});
      const key='sls_ba_print_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
      localStorage.setItem(key,JSON.stringify(data));
      const w=window.open('/ba_print.html?k='+encodeURIComponent(key),'_blank');
      if(!w)throw new Error('Popup diblokir browser. Izinkan popup untuk mencetak BA.');
    }catch(e){el('baPickerMsg').textContent='Gagal: '+cleanErr(e.message);}
    finally{b.disabled=false;b.textContent='🖨 Print BA';}
  }

  function cleanInlinePrint(){
    if(!canUse())return;
    document.querySelectorAll('[data-print-ba],[data-spv-print-v83]').forEach(x=>x.remove());
    const bar=el('spvBaPrintBar');if(bar)bar.style.display='none';
  }
  try{const prevRender=window.renderHistory||renderHistory;window.renderHistory=function(){const r=prevRender.apply(this,arguments);setTimeout(()=>{cleanInlinePrint();ensureUi();},0);return r};renderHistory=window.renderHistory;}catch(_){ }
  try{const prevView=window.viewIncident||viewIncident;window.viewIncident=async function(){const r=await prevView.apply(this,arguments);setTimeout(()=>{cleanInlinePrint();ensureUi();},0);return r};viewIncident=window.viewIncident;}catch(_){ }
  try{const prevShow=window.showApp||showApp;window.showApp=async function(){const r=await prevShow.apply(this,arguments);setTimeout(ensureUi,0);setTimeout(ensureUi,250);return r};showApp=window.showApp;}catch(_){ }
  try{const prevLoad=window.loadHistory||loadHistory;window.loadHistory=async function(){const r=await prevLoad.apply(this,arguments);setTimeout(ensureUi,0);return r};loadHistory=window.loadHistory;}catch(_){ }

  const app=el('app');if(app)new MutationObserver(()=>setTimeout(ensureUi,0)).observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
  [50,150,350,700,1200,2200,3500].forEach(ms=>setTimeout(()=>{ensureUi();cleanInlinePrint();},ms));
})();
