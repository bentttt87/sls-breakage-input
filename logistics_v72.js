// SLS Breakage Input v72 — shared logistics master + canonical role governance.
(function(){
  'use strict';
  const RDC_LIST_V72=['Jakarta','Semarang','Surabaya','Denpasar','Palembang'];
  let LOGM={vendors:[],drivers:[],vehicles:[]},LOG_SCOPE=null;
  const h=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const errText=s=>{try{const j=JSON.parse(String(s||''));return j.message||j.error||String(s||'Gagal')}catch(_){return String(s||'Gagal')}};
  const national=()=>!!ACCESS?.is_national||!!ACCESS?.is_master;
  const isSpv=()=>String(ACCESS?.breakage_role||'').toLowerCase()==='spv'||String(ACCESS?.role||'').toLowerCase()==='supervisor';
  const isManager=()=>!!ACCESS?.is_manager;
  const isMaster=()=>!!ACCESS?.is_master;

  // Make national manager use the same RDC selector pattern as Master, without Master-only rights.
  const originalEffectiveScope=effectiveScope;
  effectiveScope=function(){return national()?(SCOPE||'Jakarta'):(ACCESS?.rdc_name||originalEffectiveScope());};

  async function loadLogistics(rdc){
    const scope=rdc||effectiveScope();
    if(!scope||scope==='ALL') return LOGM={vendors:[],drivers:[],vehicles:[]};
    LOGM=await rpc('logistics_master_list',{p_rdc:scope});
    LOG_SCOPE=scope;
    return LOGM;
  }
  function activeVendors(){return (LOGM.vendors||[]).filter(v=>v.active);}
  function vendorByName(name){return activeVendors().find(v=>String(v.name||'').toUpperCase()===String(name||'').toUpperCase());}
  function driversFor(vendorName){const v=vendorByName(vendorName);return v?(LOGM.drivers||[]).filter(d=>d.active&&Number(d.vendor_id)===Number(v.id)):[];}
  function vehiclesFor(vendorName){const v=vendorByName(vendorName);return v?(LOGM.vehicles||[]).filter(x=>x.active&&Number(x.vendor_id)===Number(v.id)):[];}
  function options(rows,key,label,current,emptyLabel){
    const cur=String(current||'');
    let out=`<option value="">${h(emptyLabel)}</option>`;
    out+=rows.map(r=>{const v=String(r[key]||'');return `<option value="${h(v)}" ${v===cur?'selected':''}>${h(r[label]||v)}</option>`}).join('');
    if(cur && !rows.some(r=>String(r[key]||'')===cur)) out+=`<option value="${h(cur)}" selected>⚠ ${h(cur)} (belum ada di database)</option>`;
    return out;
  }
  function syncDeliveryChoices(keep={}){
    const vSel=$('fTransporter'),dSel=$('fDriver'),pSel=$('fPolice');if(!vSel||!dSel||!pSel)return;
    const vNow=keep.vendor??vSel.value,dNow=keep.driver??dSel.value,pNow=keep.plate??pSel.value;
    vSel.innerHTML=options(activeVendors(),'name','name',vNow,activeVendors().length?'Pilih Vendor Ekspedisi':'Database vendor belum diisi oleh SPV');
    const vendor=vSel.value||vNow;
    dSel.innerHTML=options(driversFor(vendor),'name','name',dNow,vendor?'Pilih Driver':'Pilih Vendor dahulu');
    pSel.innerHTML=options(vehiclesFor(vendor),'plate','plate',pNow,vendor?'Pilih No Polisi':'Pilih Vendor dahulu');
    vSel.onchange=()=>{syncDeliveryChoices({vendor:vSel.value});saveDraft();};
    dSel.onchange=saveDraft;pSel.onchange=saveDraft;
  }

  const originalRenderConditional=renderConditional;
  renderConditional=function(t){
    if(t!=='delivery'){originalRenderConditional(t);return;}
    TYPE='delivery';document.querySelectorAll('#typeTabs button').forEach(b=>b.classList.toggle('active',b.dataset.type==='delivery'));
    const old={vendor:$('fTransporter')?.value||'',driver:$('fDriver')?.value||'',plate:$('fPolice')?.value||''};
    $('conditional').innerHTML=`<div class="form-grid"><div class="field"><label>No SJ *</label><input id="fSj"></div><div class="field"><label>Pelanggan *</label><input id="fCustomer"></div><div class="field"><label>Vendor Transport *</label><select id="fTransporter"></select></div><div class="field"><label>Driver *</label><select id="fDriver"></select></div><div class="field span2"><label>No Polisi *</label><select id="fPolice"></select></div></div><div class="smallnote" id="logisticsFormNote" style="margin-top:6px">Vendor, driver, dan No Polisi berasal dari Database Ekspedisi RDC.</div>`;
    syncDeliveryChoices(old);bindDraftInputs();
  };

  const originalOpenInput=openInput;
  openInput=async function(){
    try{await loadLogistics(effectiveScope());}catch(e){alert('Database ekspedisi gagal dimuat: '+errText(e.message));return;}
    originalOpenInput();
    if(TYPE==='delivery') setTimeout(()=>syncDeliveryChoices({vendor:$('fTransporter')?.value,driver:$('fDriver')?.value,plate:$('fPolice')?.value}),0);
  };

  const originalEditIncident=editIncident;
  editIncident=async function(id){
    try{await loadLogistics((INCIDENTS.find(x=>Number(x.incident_id)===Number(id))||{}).rdc||effectiveScope());}catch(e){alert('Database ekspedisi gagal dimuat: '+errText(e.message));return;}
    originalEditIncident(id);
    if(TYPE==='delivery') setTimeout(()=>syncDeliveryChoices({vendor:$('fTransporter')?.value,driver:$('fDriver')?.value,plate:$('fPolice')?.value}),30);
  };window.editIncident=editIncident;

  const originalValidate=validateIncident;
  validateIncident=function(){
    const m=originalValidate();
    if(TYPE==='delivery'){
      const d=formData(),v=vendorByName(d.transporter);
      if(!v)m.push('Vendor harus dipilih dari Database Ekspedisi');
      else{
        if(!driversFor(d.transporter).some(x=>String(x.name).toUpperCase()===d.driver))m.push('Driver harus dipilih dari Database Ekspedisi');
        if(!vehiclesFor(d.transporter).some(x=>String(x.plate).toUpperCase()===d.police))m.push('No Polisi harus dipilih dari Database Ekspedisi');
      }
    }
    return [...new Set(m)];
  };

  // ---------- Database Ekspedisi management modal ----------
  function modalHtml(){
    return `<div id="logisticsModal" class="overlay"><div class="modal"><div class="modal-head"><div><h2>Database Ekspedisi</h2><div class="small" id="lgRoleNote" style="opacity:.82"></div></div><div class="grow"></div><button class="close" id="lgClose">✕</button></div><div class="modal-body">
      <div class="field" id="lgScopeBox"><label>RDC</label><select id="lgScope"></select></div>
      <div class="hint" id="lgRule"></div>
      <div id="lgVendorForm" class="field" style="margin-top:10px"><label>Vendor Ekspedisi</label><input id="lgVendorId" type="hidden"><div class="form-grid"><div class="field"><label>Kode Vendor</label><input id="lgVendorCode" placeholder="Opsional"></div><div class="field"><label>Nama Vendor *</label><input id="lgVendorName" placeholder="Nama ekspedisi"></div></div><div style="display:flex;gap:8px;margin-top:8px"><button class="secondary" id="lgVendorCancel">Batal Edit</button><button class="primary" id="lgVendorSave">Simpan Vendor</button></div><div id="lgVendorMsg" class="small" style="margin-top:6px"></div></div>
      <div class="section-title" style="font-size:13px;font-weight:850;margin-top:12px">Daftar Vendor</div><div id="lgVendorList"></div>
      <div id="lgDriverForm" class="field" style="margin-top:12px"><label>Driver</label><input id="lgDriverId" type="hidden"><div class="form-grid"><div class="field"><label>Vendor *</label><select id="lgDriverVendor"></select></div><div class="field"><label>Nama Driver *</label><input id="lgDriverName"></div><div class="field span2"><label>No HP</label><input id="lgDriverPhone" placeholder="Opsional"></div></div><div style="display:flex;gap:8px;margin-top:8px"><button class="secondary" id="lgDriverCancel">Batal Edit</button><button class="primary" id="lgDriverSave">Simpan Driver</button></div><div id="lgDriverMsg" class="small" style="margin-top:6px"></div></div>
      <div class="section-title" style="font-size:13px;font-weight:850;margin-top:12px">Daftar Driver</div><div id="lgDriverList"></div>
      <div id="lgVehicleForm" class="field" style="margin-top:12px"><label>No Polisi / Armada</label><input id="lgVehicleId" type="hidden"><div class="form-grid"><div class="field"><label>Vendor *</label><select id="lgVehicleVendor"></select></div><div class="field"><label>No Polisi *</label><input id="lgPlate" placeholder="B 1234 ABC"></div><div class="field span2"><label>Jenis Armada</label><input id="lgVehicleType" placeholder="CDE / CDD / WB (opsional)"></div></div><div style="display:flex;gap:8px;margin-top:8px"><button class="secondary" id="lgVehicleCancel">Batal Edit</button><button class="primary" id="lgVehicleSave">Simpan Kendaraan</button></div><div id="lgVehicleMsg" class="small" style="margin-top:6px"></div></div>
      <div class="section-title" style="font-size:13px;font-weight:850;margin-top:12px">Daftar No Polisi</div><div id="lgVehicleList"></div>
    </div></div></div>`;
  }
  function ensureManagementUI(){
    if(!$('logisticsModal'))document.body.insertAdjacentHTML('beforeend',modalHtml());
    if(!$('logisticsBtn')){
      const actions=document.querySelector('.actions');if(actions)actions.insertAdjacentHTML('beforeend','<button class="secondary" id="logisticsBtn">🚚 Database Ekspedisi</button>');
    }
    $('lgClose').onclick=()=>$('logisticsModal').classList.remove('show');
    $('logisticsBtn').onclick=openLogistics;
    $('lgScope').onchange=async()=>{await loadLogistics($('lgScope').value);renderManagement();};
    bindManagementButtons();
  }
  function vendorIdOptions(selected){return '<option value="">Pilih Vendor</option>'+activeVendors().map(v=>`<option value="${v.id}" ${Number(selected)===Number(v.id)?'selected':''}>${h(v.name)}</option>`).join('');}
  function miniActions(kind,id){const a=[];if(isSpv())a.push(`<button class="mini" onclick="window.lgEdit('${kind}',${Number(id)})">Edit</button>`);if(isMaster())a.push(`<button class="mini" style="color:#b42318;border-color:#efb5b0" onclick="window.lgDelete('${kind}',${Number(id)})">Delete</button>`);return a.join('');}
  function listTable(rows,kind){
    if(!rows.length)return '<div class="empty">Belum ada data.</div>';
    if(kind==='VENDOR')return `<div class="tablewrap"><table><thead><tr><th>Vendor</th><th>Kode</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${rows.map(v=>`<tr><td>${h(v.name)}</td><td>${h(v.code||'—')}</td><td>${v.active?'Aktif':'Nonaktif'}</td><td>${miniActions(kind,v.id)}</td></tr>`).join('')}</tbody></table></div>`;
    if(kind==='DRIVER')return `<div class="tablewrap"><table><thead><tr><th>Driver</th><th>Vendor</th><th>No HP</th><th>Aksi</th></tr></thead><tbody>${rows.map(d=>`<tr><td>${h(d.name)}</td><td>${h(d.vendor_name)}</td><td>${h(d.phone||'—')}</td><td>${miniActions(kind,d.id)}</td></tr>`).join('')}</tbody></table></div>`;
    return `<div class="tablewrap"><table><thead><tr><th>No Polisi</th><th>Vendor</th><th>Armada</th><th>Aksi</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${h(x.plate)}</td><td>${h(x.vendor_name)}</td><td>${h(x.vehicle_type||'—')}</td><td>${miniActions(kind,x.id)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function renderManagement(){
    const scope=LOG_SCOPE||effectiveScope();
    $('lgRoleNote').textContent=`${String(ACCESS?.breakage_role||ACCESS?.role||'').toUpperCase()} · ${national()?'Nasional':scope}`;
    $('lgRule').innerHTML=isSpv()?'<b>SPV:</b> dapat input dan edit Vendor, Driver, dan No Polisi untuk RDC sendiri.':isMaster()?'<b>Master:</b> dapat melihat seluruh RDC dan delete data. Input/edit dilakukan oleh SPV.':'<b>Mgr Nasional:</b> akses read-only seluruh database ekspedisi.';
    const editable=isSpv();['lgVendorForm','lgDriverForm','lgVehicleForm'].forEach(id=>$(id).classList.toggle('hidden',!editable));
    $('lgDriverVendor').innerHTML=vendorIdOptions($('lgDriverVendor').value);$('lgVehicleVendor').innerHTML=vendorIdOptions($('lgVehicleVendor').value);
    $('lgVendorList').innerHTML=listTable(LOGM.vendors||[],'VENDOR');$('lgDriverList').innerHTML=listTable(LOGM.drivers||[],'DRIVER');$('lgVehicleList').innerHTML=listTable(LOGM.vehicles||[],'VEHICLE');
  }
  async function openLogistics(){
    const can=isSpv()||isManager()||isMaster();if(!can)return;
    const scope=isSpv()?ACCESS.rdc_name:(SCOPE||'Jakarta');
    $('lgScope').innerHTML=(isSpv()?[ACCESS.rdc_name]:RDC_LIST_V72).map(r=>`<option ${r===scope?'selected':''}>${h(r)}</option>`).join('');$('lgScope').disabled=isSpv();
    $('logisticsModal').classList.add('show');
    try{await loadLogistics(scope);renderManagement();}catch(e){$('lgVendorList').innerHTML=`<div class="errorbox">${h(errText(e.message))}</div>`;}
  }
  function clearVendor(){['lgVendorId','lgVendorCode','lgVendorName'].forEach(id=>$(id).value='');}
  function clearDriver(){['lgDriverId','lgDriverName','lgDriverPhone'].forEach(id=>$(id).value='');$('lgDriverVendor').value='';}
  function clearVehicle(){['lgVehicleId','lgPlate','lgVehicleType'].forEach(id=>$(id).value='');$('lgVehicleVendor').value='';}
  function bindManagementButtons(){
    $('lgVendorCancel').onclick=clearVendor;$('lgDriverCancel').onclick=clearDriver;$('lgVehicleCancel').onclick=clearVehicle;
    $('lgVendorSave').onclick=async()=>{const m=$('lgVendorMsg');try{await rpc('logistics_vendor_save',{p_id:Number($('lgVendorId').value)||null,p_rdc:LOG_SCOPE,p_vendor_name:$('lgVendorName').value,p_vendor_code:$('lgVendorCode').value,p_active:true});m.style.color='#067647';m.textContent='✓ Vendor tersimpan.';clearVendor();await loadLogistics(LOG_SCOPE);renderManagement();}catch(e){m.style.color='#b42318';m.textContent=errText(e.message)}};
    $('lgDriverSave').onclick=async()=>{const m=$('lgDriverMsg');try{await rpc('logistics_driver_save',{p_id:Number($('lgDriverId').value)||null,p_rdc:LOG_SCOPE,p_vendor_id:Number($('lgDriverVendor').value)||null,p_driver_name:$('lgDriverName').value,p_phone:$('lgDriverPhone').value,p_active:true});m.style.color='#067647';m.textContent='✓ Driver tersimpan.';clearDriver();await loadLogistics(LOG_SCOPE);renderManagement();}catch(e){m.style.color='#b42318';m.textContent=errText(e.message)}};
    $('lgVehicleSave').onclick=async()=>{const m=$('lgVehicleMsg');try{await rpc('logistics_vehicle_save',{p_id:Number($('lgVehicleId').value)||null,p_rdc:LOG_SCOPE,p_vendor_id:Number($('lgVehicleVendor').value)||null,p_plate_no:$('lgPlate').value,p_vehicle_type:$('lgVehicleType').value,p_active:true});m.style.color='#067647';m.textContent='✓ Kendaraan tersimpan.';clearVehicle();await loadLogistics(LOG_SCOPE);renderManagement();}catch(e){m.style.color='#b42318';m.textContent=errText(e.message)}};
  }
  window.lgEdit=function(kind,id){if(!isSpv())return;if(kind==='VENDOR'){const v=LOGM.vendors.find(x=>Number(x.id)===Number(id));if(!v)return;$('lgVendorId').value=v.id;$('lgVendorCode').value=v.code||'';$('lgVendorName').value=v.name||'';$('lgVendorName').focus();}else if(kind==='DRIVER'){const d=LOGM.drivers.find(x=>Number(x.id)===Number(id));if(!d)return;$('lgDriverId').value=d.id;$('lgDriverVendor').value=d.vendor_id;$('lgDriverName').value=d.name||'';$('lgDriverPhone').value=d.phone||'';$('lgDriverName').focus();}else{const x=LOGM.vehicles.find(v=>Number(v.id)===Number(id));if(!x)return;$('lgVehicleId').value=x.id;$('lgVehicleVendor').value=x.vendor_id;$('lgPlate').value=x.plate||'';$('lgVehicleType').value=x.vehicle_type||'';$('lgPlate').focus();}};
  window.lgDelete=async function(kind,id){if(!isMaster())return;const reason=prompt('Alasan delete (audit trail):','Data tidak berlaku lagi');if(reason===null)return;if(!confirm('Delete dari database aktif? Riwayat audit tetap disimpan.'))return;try{await rpc('logistics_master_delete',{p_entity:kind,p_id:Number(id),p_reason:reason});await loadLogistics(LOG_SCOPE);renderManagement();}catch(e){alert(errText(e.message))}};

  const originalShowApp=showApp;
  showApp=function(){
    if(national()&&!SCOPE)SCOPE='Jakarta';originalShowApp();ensureManagementUI();
    $('masterScope').classList.toggle('show',national());
    if(national()){$('scope').value=SCOPE;$('rdcCard').textContent=SCOPE;}
    const role=String(ACCESS?.breakage_role||ACCESS?.role||'').toUpperCase();$('who').textContent=`${role} · ${national()?'Nasional':ACCESS?.rdc_name}`;$('roleChip').textContent=role;$('rdcChip').textContent=national()?'Nasional':ACCESS?.rdc_name;
    $('logisticsBtn').classList.toggle('hidden',!(isSpv()||isManager()||isMaster()));
    if(isManager())$('roleMsg').innerHTML='<b>Mgr Nasional:</b> review seluruh RDC. Database Ekspedisi bersifat read-only.';
    if(isMaster())$('roleMsg').innerHTML='<b>Master:</b> review nasional dan hak delete Database Ekspedisi. Input/edit master dilakukan SPV.';
    if($('buildBadge'))$('buildBadge').textContent='v72';
  };

  // National scope selector now works for both Mgr and Master.
  $('scope').onchange=async e=>{SCOPE=e.target.value;$('rdcCard').textContent=SCOPE;await loadHistory()};
  ensureManagementUI();
  if($('username'))$('username').placeholder='OP.JKT.001 / SPV.JKT / MGR.SLS / MASTER.SLS';
  if($('buildBadge'))$('buildBadge').textContent='v72';
})();
