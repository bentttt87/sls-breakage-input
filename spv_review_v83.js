// SLS Breakage Input v83 — SPV review correction mirrors current master data and BA print rules.
(function(){
  'use strict';
  const $v=id=>document.getElementById(id);
  const escv=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const up=v=>String(v??'').trim().toUpperCase();
  let SPV_LOG={vendors:[],drivers:[],vehicles:[]};
  let ACTIVE_ROW=null;

  function rows(){try{return Array.isArray(INCIDENTS)?INCIDENTS:[]}catch(_){return []}}
  function roleSpv(){try{return !!ACCESS?.can_submit_approve}catch(_){return false}}
  async function loadLog(rdc){
    try{SPV_LOG=await rpc('logistics_master_list',{p_rdc:rdc})||{vendors:[],drivers:[],vehicles:[]};}
    catch(e){SPV_LOG={vendors:[],drivers:[],vehicles:[]};console.warn('logistics_master_list',e);}
    return SPV_LOG;
  }
  function vendors(){return (SPV_LOG.vendors||[]).filter(x=>x.active);}
  function vendorObj(name){return vendors().find(x=>up(x.name)===up(name));}
  function drivers(vendor){const v=vendorObj(vendor);return v?(SPV_LOG.drivers||[]).filter(x=>x.active&&Number(x.vendor_id)===Number(v.id)):[];}
  function vehicles(vendor){const v=vendorObj(vendor);return v?(SPV_LOG.vehicles||[]).filter(x=>x.active&&Number(x.vendor_id)===Number(v.id)):[];}
  function opts(list,key,current,placeholder){
    const cur=String(current||'');
    let h='<option value="">'+escv(placeholder)+'</option>';
    h+=list.map(x=>{const v=String(x[key]||'');return '<option value="'+escv(v)+'" '+(up(v)===up(cur)?'selected':'')+'>'+escv(v)+'</option>';}).join('');
    if(cur&&!list.some(x=>up(x[key])===up(cur)))h+='<option value="'+escv(cur)+'" selected>⚠ '+escv(cur)+' (legacy)</option>';
    return h;
  }
  function commonHtml(r){
    return '<div class="form-grid">'+
      '<div class="field"><label>Tanggal *</label><input id="cDate" type="date" value="'+escv(r.occurrence_date||'')+'"></div>'+
      '<div class="field"><label>Jenis *</label><select id="cType" onchange="window.spvV83TypeChanged()"><option value="delivery">Kiriman</option><option value="warehouse">Gudang</option></select></div>'+
      '<div class="field"><label>Item *</label><input id="cItem" value="'+escv(r.item_code||'')+'"></div>'+
      '<div class="field"><label>Jenis Series Keramik *</label><input id="cSeries" value="'+escv(r.ceramic_series||'')+'"></div>'+
      '<div class="field"><label>Qty BOX *</label><input id="cQty" type="number" min="0.01" step="0.01" value="'+escv(r.qty_box||'')+'"></div>'+
      '<div class="field readonly"><label>Pelapor</label><div>'+escv(r.reported_by||'SYSTEM')+'</div></div>'+
      '</div><div id="cTypeFields" style="margin-top:8px"></div>';
  }
  function deliveryHtml(r){
    const currentVendor=r.transporter||'';
    return '<div class="form-grid">'+
      '<div class="field"><label>No SJ *</label><input id="cNoSj" value="'+escv(r.no_sj||'')+'"></div>'+
      '<div class="field"><label>Pabrik Asal *</label><select id="cFactory"><option value="">Pilih Pabrik</option><option value="SRKI" '+(up(r.factory)==='SRKI'?'selected':'')+'>SRKI</option><option value="RCI" '+(up(r.factory)==='RCI'?'selected':'')+'>RCI</option></select></div>'+
      '<div class="field"><label>Customer *</label><input id="cCustomer" value="'+escv(r.customer||'')+'"></div>'+
      '<div class="field"><label>Nama Penerima BA *</label><input id="cReceiver" value="'+escv(r.ba_receiver_name||'')+'"></div>'+
      '<div class="field"><label>Vendor Transport *</label><select id="cTransporter" onchange="window.spvV83VendorChanged()">'+opts(vendors(),'name',currentVendor,vendors().length?'Pilih Vendor':'Database vendor belum diisi')+'</select></div>'+
      '<div class="field"><label>Driver *</label><select id="cDriver"></select></div>'+
      '<div class="field"><label>No Polisi *</label><select id="cVehicle"></select></div>'+
      '<div class="field"><label>Saksi Pemeriksa *</label><input id="cWitness" value="'+escv(r.ba_witness_name||'')+'"></div>'+
      '<div class="field"><label>Penyebab *</label><select id="cCause"><option value="Perjalanan">Perjalanan</option><option value="Susunan">Susunan</option><option value="Packaging / Pallet">Packaging / Pallet</option><option value="Lainnya">Lainnya</option></select></div>'+
      '<div class="field span2"><label>Keterangan</label><textarea id="cCauseDetail">'+escv(r.cause_detail||'')+'</textarea></div>'+
      '</div><div class="smallnote" style="margin-top:6px">Pabrik Asal, Vendor, Driver, No Polisi, dan Penyebab menggunakan pilihan terkontrol. Vendor/Driver/No Polisi mengikuti Database Ekspedisi RDC.</div>';
  }
  function warehouseHtml(r){
    return '<div class="form-grid">'+
      '<div class="field"><label>Kejadian Gudang *</label><select id="cWhEvent" onchange="window.spvV83WhChanged()"><option value="Pecah Dalam Pallet">Pecah Dalam Pallet</option><option value="Misshandling">Misshandling</option></select></div>'+
      '<div class="field" id="cRelatedBox"><label>Nama Terkait</label><input id="cRelated" value="'+escv(r.related_person||'')+'"></div>'+
      '<div class="field span2"><label>Keterangan</label><textarea id="cCauseDetail">'+escv(r.cause_detail||'')+'</textarea></div>'+
      '</div>';
  }
  function syncDeliverySelections(r){
    const v=$v('cTransporter'),d=$v('cDriver'),p=$v('cVehicle');if(!v||!d||!p)return;
    const vendor=v.value||r.transporter||'';
    d.innerHTML=opts(drivers(vendor),'name',r.driver_name||'',vendor?'Pilih Driver':'Pilih Vendor dahulu');
    p.innerHTML=opts(vehicles(vendor),'plate',r.vehicle_no||'',vendor?'Pilih No Polisi':'Pilih Vendor dahulu');
    if($v('cCause'))$v('cCause').value=r.cause||'Perjalanan';
  }
  function renderTypeFields(type,seed){
    const box=$v('cTypeFields');if(!box)return;
    const r=seed||ACTIVE_ROW||{};
    if(type==='delivery'){box.innerHTML=deliveryHtml(r);setTimeout(()=>syncDeliverySelections(r),0);}
    else{box.innerHTML=warehouseHtml(r);setTimeout(()=>{if($v('cWhEvent'))$v('cWhEvent').value=r.warehouse_event||'Pecah Dalam Pallet';window.spvV83WhChanged();},0);}
  }
  window.spvV83TypeChanged=function(){
    const type=$v('cType')?.value||'warehouse';
    const seed={...(ACTIVE_ROW||{}),cause_detail:$v('cCauseDetail')?.value||ACTIVE_ROW?.cause_detail||''};
    renderTypeFields(type,seed);
  };
  window.spvV83VendorChanged=function(){
    const v=$v('cTransporter')?.value||'';
    if($v('cDriver'))$v('cDriver').innerHTML=opts(drivers(v),'name','',v?'Pilih Driver':'Pilih Vendor dahulu');
    if($v('cVehicle'))$v('cVehicle').innerHTML=opts(vehicles(v),'plate','',v?'Pilih No Polisi':'Pilih Vendor dahulu');
  };
  window.spvV83WhChanged=function(){
    const miss=$v('cWhEvent')?.value==='Misshandling';
    const box=$v('cRelatedBox');if(box)box.style.display=miss?'':'none';
  };

  correctionHtml=function(r){
    ACTIVE_ROW=r;
    const type=['delivery','warehouse'].includes(r?.incident_type)?r.incident_type:'warehouse';
    setTimeout(()=>{if($v('cType'))$v('cType').value=type;renderTypeFields(type,r);},0);
    return '<div style="font-weight:850;margin-bottom:7px">Koreksi Data oleh SPV</div><div class="smallnote">No BA dan foto tidak diubah di sini. Pilihan master dibuat dropdown untuk mencegah salah ketik.</div>'+commonHtml(r)+'<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button class="secondary" type="button" onclick="document.getElementById(\'spvCorrection\').classList.add(\'hidden\')">Batal</button><button class="primary" id="saveCorrectionBtn" type="button">Simpan Revisi</button></div>';
  };

  saveSpvCorrection=async function(){
    const reason=String($v('reviewNote')?.value||'').trim();
    if(!reason){$v('reviewMsg').textContent='Alasan revisi wajib diisi.';return;}
    const type=$v('cType')?.value||'';
    const changes={
      occurrence_date:$v('cDate')?.value||'',incident_type:type,item_code:up($v('cItem')?.value),ceramic_series:up($v('cSeries')?.value),qty_box:Number($v('cQty')?.value||0),cause_detail:up($v('cCauseDetail')?.value||'')
    };
    const miss=[];
    if(!changes.occurrence_date)miss.push('Tanggal');if(!['delivery','warehouse'].includes(type))miss.push('Jenis');if(!changes.item_code)miss.push('Item');if(!changes.ceramic_series)miss.push('Series');if(!(changes.qty_box>0))miss.push('Qty');
    if(type==='delivery'){
      Object.assign(changes,{no_sj:up($v('cNoSj')?.value),factory:up($v('cFactory')?.value),customer:up($v('cCustomer')?.value),ba_receiver_name:up($v('cReceiver')?.value),transporter:up($v('cTransporter')?.value),driver_name:up($v('cDriver')?.value),vehicle_no:up($v('cVehicle')?.value),ba_witness_name:up($v('cWitness')?.value),cause:$v('cCause')?.value||''});
      if(!changes.no_sj)miss.push('No SJ');if(!['SRKI','RCI'].includes(changes.factory))miss.push('Pabrik Asal');if(!changes.customer)miss.push('Customer');if(!changes.ba_receiver_name)miss.push('Nama Penerima BA');if(!vendorObj(changes.transporter))miss.push('Vendor dari Database Ekspedisi');if(!drivers(changes.transporter).some(x=>up(x.name)===changes.driver_name))miss.push('Driver dari Database Ekspedisi');if(!vehicles(changes.transporter).some(x=>up(x.plate)===changes.vehicle_no))miss.push('No Polisi dari Database Ekspedisi');if(!changes.ba_witness_name)miss.push('Saksi Pemeriksa');if(!['Perjalanan','Susunan','Packaging / Pallet','Lainnya'].includes(changes.cause))miss.push('Penyebab');if(changes.cause==='Lainnya'&&!changes.cause_detail)miss.push('Keterangan');
    }else{
      Object.assign(changes,{warehouse_event:$v('cWhEvent')?.value||'',related_person:up($v('cRelated')?.value||'')});
      if(!['Pecah Dalam Pallet','Misshandling'].includes(changes.warehouse_event))miss.push('Kejadian Gudang');if(changes.warehouse_event==='Misshandling'&&!changes.related_person)miss.push('Nama Terkait');
    }
    if(miss.length){$v('reviewMsg').textContent='Lengkapi: '+[...new Set(miss)].join(', ');return;}
    try{
      REVIEW_BUSY=true;if(typeof syncReviewButtons==='function')syncReviewButtons();
      await rpc('breakage_incident_spv_revise_v83',{p_incident_id:REVIEW_ID,p_reason:reason,p_changes:changes});
      REVIEW_BUSY=false;closeReview();await loadHistory();
    }catch(e){$v('reviewMsg').textContent='Revisi gagal: '+cleanErr(e.message);}
    finally{REVIEW_BUSY=false;if(typeof syncReviewButtons==='function')syncReviewButtons();}
  };

  function printGroup(row){
    const group=rows().filter(x=>String(x.incident_type||'').toLowerCase()==='delivery' && (row.no_ba?up(x.no_ba)===up(row.no_ba):(up(x.no_sj)===up(row.no_sj)&&up(x.rdc)===up(row.rdc))));
    const items=group.length?group:[row];
    const data={rdc:row.rdc,occurrence_date:row.occurrence_date,no_sj:row.no_sj,factory:row.factory,customer:row.customer,receiver_name:row.ba_receiver_name,transporter:row.transporter,driver_name:row.driver_name,vehicle_no:row.vehicle_no,witness_name:row.ba_witness_name,items};
    const key='sls_ba_print_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);localStorage.setItem(key,JSON.stringify(data));
    const w=window.open('/ba_print.html?k='+encodeURIComponent(key),'_blank');if(!w)alert('Popup diblokir browser. Izinkan popup untuk mencetak BA.');
  }
  function showReviewPrint(row){
    let bar=$v('spvBaPrintBar');
    if(!bar){bar=document.createElement('div');bar.id='spvBaPrintBar';bar.className='hint';bar.style.marginTop='10px';const details=$v('reviewDetails');if(details)details.insertAdjacentElement('afterend',bar);}
    if(String(row?.incident_type||'').toLowerCase()==='delivery'){
      bar.style.display='flex';bar.style.alignItems='center';bar.style.justifyContent='space-between';bar.style.gap='8px';bar.innerHTML='<span><b>BA Pengiriman</b><br><span class="smallnote">No BA '+escv(row.no_ba||'—')+' · Print tersedia untuk Pecah Kiriman.</span></span><button class="primary" id="spvPrintBaBtn" type="button">🖨 Print BA</button>';
      $v('spvPrintBaBtn').onclick=()=>printGroup(row);
    }else{
      bar.style.display='none';bar.innerHTML='';
    }
  }

  const baseView=viewIncident;
  viewIncident=async function(id){
    const row=rows().find(x=>Number(x.incident_id)===Number(id));
    if(row&&roleSpv())await loadLog(row.rdc);
    const result=await baseView.apply(this,arguments);
    if(row)showReviewPrint(row);
    return result;
  };window.viewIncident=viewIncident;

  const baseRenderHistory=renderHistory;
  renderHistory=function(){
    const result=baseRenderHistory.apply(this,arguments);
    const trs=[...($v('historyBody')?.querySelectorAll('tr')||[])];
    rows().slice(0,60).forEach((r,i)=>{
      if(!trs[i]||String(r.incident_type||'').toLowerCase()!=='delivery')return;
      const td=trs[i].lastElementChild;if(!td||td.querySelector('[data-spv-print-v83]'))return;
      const b=document.createElement('button');b.className='mini';b.dataset.spvPrintV83='1';b.textContent='🖨 Print BA';b.onclick=()=>printGroup(r);td.appendChild(b);
    });
    return result;
  };

  const badge=$v('buildBadge');if(badge)badge.textContent='v83';
})();
