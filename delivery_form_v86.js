// SLS Breakage Input v86 — normalize delivery form, factory dropdown, vendor-linked driver/plate, SPV correction.
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const up=s=>String(s??'').trim().toUpperCase();
  let MASTER={vendors:[],drivers:[],vehicles:[]};
  let ACTIVE_CORR=null;

  function rdcScope(){try{return (ACCESS?.is_national?(SCOPE||'Jakarta'):ACCESS?.rdc_name)||'Jakarta';}catch(_){return 'Jakarta';}}
  async function loadMaster(rdc){try{MASTER=await rpc('logistics_master_list',{p_rdc:rdc||rdcScope()})||MASTER;}catch(e){console.warn('logistics master',e);}return MASTER;}
  function vendors(){return (MASTER.vendors||[]).filter(x=>x.active);}
  function vendorByName(name){return vendors().find(x=>up(x.name)===up(name));}
  function driverRows(vendor){const v=vendorByName(vendor);return v?(MASTER.drivers||[]).filter(x=>x.active&&Number(x.vendor_id)===Number(v.id)):[];}
  function currentType(){try{return String(TYPE||'').toLowerCase();}catch(_){return '';}}
  function optionVendor(current){const cur=up(current);return '<option value="">Pilih Vendor Transport</option>'+vendors().map(v=>`<option value="${esc(v.name)}" ${up(v.name)===cur?'selected':''}>${esc(v.name)}</option>`).join('');}
  function optionDriver(vendor,currentName,currentPlate){const rows=driverRows(vendor),cn=up(currentName),cp=up(currentPlate);let h='<option value="">'+(vendor?(rows.length?'Pilih Driver / No Polisi':'Belum ada Driver / No Polisi untuk vendor ini'):'Pilih Vendor dahulu')+'</option>';h+=rows.map(x=>`<option value="${esc(x.name)}" data-plate="${esc(x.plate||'')}" ${(up(x.name)===cn&&(!cp||up(x.plate)===cp))?'selected':''}>${esc(x.plate||'—')} - ${esc(x.name||'')}</option>`).join('');return h;}
  function getDraft(){try{return JSON.parse(localStorage.getItem(draftKey())||'{}')||{};}catch(_){return {};}}

  function ensureFactory(){
    if(currentType()!=='delivery')return;
    const sj=$('fSj'),customer=$('fCustomer');if(!sj||!customer)return;
    if(!$('fFactory')){
      const fld=sj.closest('.field');
      if(fld)fld.insertAdjacentHTML('afterend','<div class="field"><label>Pabrik Asal *</label><select id="fFactory"><option value="">Pilih Pabrik Asal</option><option value="SRKI">SRKI</option><option value="RCI">RCI</option></select></div>');
    }else if($('fFactory').tagName!=='SELECT'){
      const old=$('fFactory'),val=up(old.value);const s=document.createElement('select');s.id='fFactory';s.innerHTML='<option value="">Pilih Pabrik Asal</option><option value="SRKI">SRKI</option><option value="RCI">RCI</option>';s.value=val;old.replaceWith(s);
    }
    const d=getDraft();if($('fFactory')&&!$('fFactory').value&&d.factory)$('fFactory').value=up(d.factory);
    if($('fFactory'))$('fFactory').onchange=()=>{try{saveDraft();}catch(_){ }};
  }

  function ensureDeliveryMaster(){
    if(currentType()!=='delivery')return;
    ensureFactory();
    const v=$('fTransporter'),d=$('fDriver');if(!v||!d)return;
    const draft=getDraft();
    const oldVendor=v.value||draft.transporter||'';
    const oldDriver=d.value||draft.driver||'';
    const oldPlate=d.selectedOptions?.[0]?.dataset?.plate||draft.police||'';
    const p=$('fPolice');if(p){const fld=p.closest('.field');if(fld)fld.remove();}
    const lab=d.closest('.field')?.querySelector('label');if(lab)lab.textContent='Driver / No Polisi *';
    v.innerHTML=optionVendor(oldVendor);
    if(oldVendor&&!v.value&&vendors().some(x=>up(x.name)===up(oldVendor)))v.value=oldVendor;
    d.innerHTML=optionDriver(v.value,oldDriver,oldPlate);
    v.onchange=()=>{d.innerHTML=optionDriver(v.value,'','');try{saveDraft();}catch(_){ }};
    d.onchange=()=>{try{saveDraft();}catch(_){ }};
    try{bindDraftInputs();}catch(_){ }
  }

  async function normalizeDelivery(){if(currentType()!=='delivery')return;await loadMaster(rdcScope());ensureDeliveryMaster();setBadge();}

  try{
    const baseRender=renderConditional;
    renderConditional=function(t){const r=baseRender.apply(this,arguments);if(String(t).toLowerCase()==='delivery'){setTimeout(normalizeDelivery,0);setTimeout(normalizeDelivery,120);}return r;};
  }catch(_){ }
  try{
    const baseOpen=openInput;
    openInput=async function(){const r=await baseOpen.apply(this,arguments);setTimeout(normalizeDelivery,40);setTimeout(normalizeDelivery,280);return r;};
  }catch(_){ }
  try{
    const baseEdit=editIncident;
    editIncident=async function(id){const row=(Array.isArray(INCIDENTS)?INCIDENTS:[]).find(x=>Number(x.incident_id)===Number(id));await loadMaster(row?.rdc||rdcScope());const r=await baseEdit.apply(this,arguments);setTimeout(normalizeDelivery,50);setTimeout(normalizeDelivery,300);return r;};window.editIncident=editIncident;
  }catch(_){ }

  try{
    const baseForm=formData;
    formData=function(){const r=baseForm.apply(this,arguments)||{};if(currentType()==='delivery'){
      const d=$('fDriver'),opt=d?.selectedOptions?.[0];
      r.factory=up($('fFactory')?.value||'');r.transporter=up($('fTransporter')?.value||'');r.driver=up(d?.value||'');r.police=up(opt?.dataset?.plate||'');
    }return r;};
  }catch(_){ }

  try{
    const baseValidate=validateIncident;
    validateIncident=function(){let m=baseValidate.apply(this,arguments)||[];if(currentType()!=='delivery')return [...new Set(m)];
      m=m.filter(x=>!/Vendor|Driver|No Polisi|Pabrik Asal/i.test(String(x)));
      const factory=up($('fFactory')?.value||''),vendor=$('fTransporter')?.value||'',d=$('fDriver'),driver=d?.value||'',plate=d?.selectedOptions?.[0]?.dataset?.plate||'';
      if(!['SRKI','RCI'].includes(factory))m.push('Pabrik Asal');
      if(!vendorByName(vendor))m.push('Vendor Transport');
      const match=driverRows(vendor).some(x=>up(x.name)===up(driver)&&up(x.plate)===up(plate));
      if(!match)m.push('Driver / No Polisi');
      return [...new Set(m)];
    };
  }catch(_){ }

  // ---------- SPV correction ----------
  function corrCommon(r){return '<div class="form-grid">'+
    `<div class="field"><label>Tanggal *</label><input id="cDate" type="date" value="${esc(r.occurrence_date||'')}"></div>`+
    `<div class="field"><label>Jenis *</label><select id="cType" onchange="window.v86TypeChanged()"><option value="delivery">Kiriman</option><option value="warehouse">Gudang</option></select></div>`+
    `<div class="field"><label>Item *</label><input id="cItem" value="${esc(r.item_code||'')}"></div>`+
    `<div class="field"><label>Jenis Series Keramik *</label><input id="cSeries" value="${esc(r.ceramic_series||'')}"></div>`+
    `<div class="field"><label>Qty BOX *</label><input id="cQty" type="number" min="0.01" step="0.01" value="${esc(r.qty_box||'')}"></div>`+
    `<div class="field readonly"><label>Pelapor</label><div>${esc(r.reported_by||'SYSTEM')}</div></div></div><div id="cTypeFields" style="margin-top:8px"></div>`;}
  function corrDelivery(r){return '<div class="form-grid">'+
    `<div class="field"><label>No SJ *</label><input id="cNoSj" value="${esc(r.no_sj||'')}"></div>`+
    `<div class="field"><label>Pabrik Asal *</label><select id="cFactory"><option value="">Pilih Pabrik</option><option value="SRKI" ${up(r.factory)==='SRKI'?'selected':''}>SRKI</option><option value="RCI" ${up(r.factory)==='RCI'?'selected':''}>RCI</option></select></div>`+
    `<div class="field"><label>Customer *</label><input id="cCustomer" value="${esc(r.customer||'')}"></div>`+
    `<div class="field"><label>Nama Penerima BA *</label><input id="cReceiver" value="${esc(r.ba_receiver_name||'')}"></div>`+
    `<div class="field"><label>Vendor Transport *</label><select id="cTransporter" onchange="window.v86VendorChanged()">${optionVendor(r.transporter||'')}</select></div>`+
    `<div class="field"><label>Driver / No Polisi *</label><select id="cDriverCombo">${optionDriver(r.transporter||'',r.driver_name||'',r.vehicle_no||'')}</select></div>`+
    `<div class="field"><label>Saksi Pemeriksa *</label><input id="cWitness" value="${esc(r.ba_witness_name||'')}"></div>`+
    `<div class="field"><label>Penyebab *</label><select id="cCause"><option value="Perjalanan">Perjalanan</option><option value="Susunan">Susunan</option><option value="Packaging / Pallet">Packaging / Pallet</option><option value="Lainnya">Lainnya</option></select></div>`+
    `<div class="field span2"><label>Keterangan</label><textarea id="cCauseDetail">${esc(r.cause_detail||'')}</textarea></div></div>`;}
  function corrWarehouse(r){return '<div class="form-grid">'+
    `<div class="field"><label>Kejadian Gudang *</label><select id="cWhEvent" onchange="window.v86WhChanged()"><option value="Pecah Dalam Pallet">Pecah Dalam Pallet</option><option value="Misshandling">Misshandling</option></select></div>`+
    `<div class="field" id="cRelatedBox"><label>Nama Terkait</label><input id="cRelated" value="${esc(r.related_person||'')}"></div>`+
    `<div class="field span2"><label>Keterangan</label><textarea id="cCauseDetail">${esc(r.cause_detail||'')}</textarea></div></div>`;}
  function renderCorrType(type,r){const box=$('cTypeFields');if(!box)return;r=r||ACTIVE_CORR||{};if(type==='delivery'){box.innerHTML=corrDelivery(r);if($('cCause'))$('cCause').value=r.cause||'Perjalanan';}else{box.innerHTML=corrWarehouse(r);if($('cWhEvent'))$('cWhEvent').value=r.warehouse_event||'Pecah Dalam Pallet';window.v86WhChanged();}}
  window.v86TypeChanged=function(){renderCorrType($('cType')?.value||'warehouse',ACTIVE_CORR||{});};
  window.v86VendorChanged=function(){const v=$('cTransporter')?.value||'';if($('cDriverCombo'))$('cDriverCombo').innerHTML=optionDriver(v,'','');};
  window.v86WhChanged=function(){const box=$('cRelatedBox');if(box)box.style.display=$('cWhEvent')?.value==='Misshandling'?'':'none';};

  try{
    correctionHtml=function(r){ACTIVE_CORR=r;const type=['delivery','warehouse'].includes(String(r?.incident_type))?String(r.incident_type):'warehouse';setTimeout(()=>{if($('cType'))$('cType').value=type;renderCorrType(type,r);},0);return '<div style="font-weight:850;margin-bottom:7px">Koreksi Data oleh SPV</div><div class="smallnote">No BA dan foto tidak diubah di sini. Pabrik, Vendor dan Driver/No Polisi menggunakan pilihan terkontrol.</div>'+corrCommon(r)+'<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button class="secondary" type="button" onclick="document.getElementById(\'spvCorrection\').classList.add(\'hidden\')">Batal</button><button class="primary" id="saveCorrectionBtn" type="button">Simpan Revisi</button></div>';};
  }catch(_){ }

  try{
    saveSpvCorrection=async function(){
      const reason=String($('reviewNote')?.value||'').trim();if(!reason){$('reviewMsg').textContent='Alasan revisi wajib diisi.';return;}
      const type=$('cType')?.value||'',changes={occurrence_date:$('cDate')?.value||'',incident_type:type,item_code:up($('cItem')?.value),ceramic_series:up($('cSeries')?.value),qty_box:Number($('cQty')?.value||0),cause_detail:up($('cCauseDetail')?.value||'')},miss=[];
      if(!changes.occurrence_date)miss.push('Tanggal');if(!['delivery','warehouse'].includes(type))miss.push('Jenis');if(!changes.item_code)miss.push('Item');if(!changes.ceramic_series)miss.push('Series');if(!(changes.qty_box>0))miss.push('Qty');
      if(type==='delivery'){
        const combo=$('cDriverCombo'),plate=combo?.selectedOptions?.[0]?.dataset?.plate||'';
        Object.assign(changes,{no_sj:up($('cNoSj')?.value),factory:up($('cFactory')?.value),customer:up($('cCustomer')?.value),ba_receiver_name:up($('cReceiver')?.value),transporter:up($('cTransporter')?.value),driver_name:up(combo?.value||''),vehicle_no:up(plate),ba_witness_name:up($('cWitness')?.value),cause:$('cCause')?.value||''});
        if(!changes.no_sj)miss.push('No SJ');if(!['SRKI','RCI'].includes(changes.factory))miss.push('Pabrik Asal');if(!changes.customer)miss.push('Customer');if(!changes.ba_receiver_name)miss.push('Nama Penerima BA');if(!vendorByName(changes.transporter))miss.push('Vendor Transport');if(!driverRows(changes.transporter).some(x=>up(x.name)===changes.driver_name&&up(x.plate)===changes.vehicle_no))miss.push('Driver / No Polisi');if(!changes.ba_witness_name)miss.push('Saksi Pemeriksa');if(!['Perjalanan','Susunan','Packaging / Pallet','Lainnya'].includes(changes.cause))miss.push('Penyebab');if(changes.cause==='Lainnya'&&!changes.cause_detail)miss.push('Keterangan');
      }else{
        Object.assign(changes,{warehouse_event:$('cWhEvent')?.value||'',related_person:up($('cRelated')?.value||'')});if(!['Pecah Dalam Pallet','Misshandling'].includes(changes.warehouse_event))miss.push('Kejadian Gudang');if(changes.warehouse_event==='Misshandling'&&!changes.related_person)miss.push('Nama Terkait');
      }
      if(miss.length){$('reviewMsg').textContent='Lengkapi: '+[...new Set(miss)].join(', ');return;}
      try{REVIEW_BUSY=true;if(typeof syncReviewButtons==='function')syncReviewButtons();await rpc('breakage_incident_spv_revise_v83',{p_incident_id:REVIEW_ID,p_reason:reason,p_changes:changes});REVIEW_BUSY=false;closeReview();await loadHistory();}catch(e){$('reviewMsg').textContent='Revisi gagal: '+(typeof cleanErr==='function'?cleanErr(e.message):String(e.message||e));}finally{REVIEW_BUSY=false;if(typeof syncReviewButtons==='function')syncReviewButtons();}
    };
  }catch(_){ }

  try{
    const baseView=viewIncident;
    viewIncident=async function(id){const row=(Array.isArray(INCIDENTS)?INCIDENTS:[]).find(x=>Number(x.incident_id)===Number(id));if(row)await loadMaster(row.rdc||rdcScope());return await baseView.apply(this,arguments);};window.viewIncident=viewIncident;
  }catch(_){ }

  function setBadge(){const b=$('buildBadge');if(b)b.textContent='v86';}
  [80,250,700,1400].forEach(ms=>setTimeout(()=>{setBadge();if(currentType()==='delivery')normalizeDelivery();},ms));
})();
