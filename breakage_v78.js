// SLS Breakage Input v78 — combine Driver + No Polisi, factory dropdown SRKI/RCI, dedupe logistics button.
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let MASTER78={vendors:[],drivers:[]};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function dedupeButtons(){
    const a=document.querySelector('.actions'); if(!a)return;
    const btns=[...a.querySelectorAll('button')].filter(b=>/Database Ekspedisi/i.test(b.textContent||''));
    btns.slice(1).forEach(b=>b.remove());
  }
  function badge(){const b=$('buildBadge'); if(b)b.textContent='v78';}
  function factoryDropdown(){
    const el=$('fFactory'); if(!el)return;
    if(el.tagName==='SELECT'){
      if(![...el.options].some(o=>o.value==='SRKI')) el.innerHTML='<option value="">Pilih Pabrik Asal</option><option value="SRKI">SRKI</option><option value="RCI">RCI</option>';
      return;
    }
    const s=document.createElement('select'); s.id='fFactory'; s.innerHTML='<option value="">Pilih Pabrik Asal</option><option value="SRKI">SRKI</option><option value="RCI">RCI</option>'; s.value=String(el.value||'').toUpperCase(); el.replaceWith(s); try{bindDraftInputs();}catch(_){ }
  }
  async function loadMaster(){
    try{MASTER78=await rpc('logistics_master_list',{p_rdc:(ACCESS?.is_national?(SCOPE||'Jakarta'):ACCESS?.rdc_name)||'Jakarta'})||MASTER78;}catch(_){ }
  }
  function driverCombined(){
    const d=$('fDriver'); if(!d)return;
    const p=$('fPolice');
    if(p){const fld=p.closest('.field'); if(fld)fld.remove();}
    const lab=d.closest('.field')?.querySelector('label'); if(lab)lab.textContent='Driver / No Polisi *';
    const vendor=String($('fTransporter')?.value||'');
    const rows=(MASTER78.drivers||[]).filter(x=>x.active&&(!vendor||String(x.vendor_name||'').toUpperCase()===vendor.toUpperCase()));
    const current=String(d.value||'');
    d.innerHTML='<option value="">Pilih Driver / No Polisi</option>'+rows.map(x=>`<option value="${esc(x.name)}" data-plate="${esc(x.plate||'')}" ${String(x.name)===current?'selected':''}>${esc(x.plate||'—')} - ${esc(x.name||'')}</option>`).join('');
    d.onchange=()=>{try{saveDraft();}catch(_){ }};
  }
  async function patchDelivery(){await loadMaster(); factoryDropdown(); driverCombined(); dedupeButtons(); badge();}

  const baseForm=window.formData;
  if(typeof baseForm==='function') window.formData=function(){const r=baseForm(); const d=$('fDriver'); const opt=d?.selectedOptions?.[0]; r.driver=String(d?.value||'').trim().toUpperCase(); r.police=String(opt?.dataset?.plate||'').trim().toUpperCase(); r.factory=String($('fFactory')?.value||'').trim().toUpperCase(); return r;};

  const baseValidate=window.validateIncident;
  if(typeof baseValidate==='function') window.validateIncident=function(){let m=baseValidate()||[]; m=m.filter(x=>!/No Polisi harus dipilih dari Database Ekspedisi/i.test(String(x))); if(TYPE==='delivery'){const d=$('fDriver'); const plate=d?.selectedOptions?.[0]?.dataset?.plate||''; if(!d?.value)m.push('Driver / No Polisi'); if(!plate)m.push('No Polisi pada database driver'); if(!String($('fFactory')?.value||'').trim())m.push('Pabrik Asal');} return [...new Set(m)];};

  const baseOpen=window.openInput;
  if(typeof baseOpen==='function') window.openInput=async function(...args){const r=await baseOpen(...args); setTimeout(()=>patchDelivery(),50); setTimeout(()=>patchDelivery(),300); return r;};
  const baseEdit=window.editIncident;
  if(typeof baseEdit==='function') window.editIncident=async function(...args){const r=await baseEdit(...args); setTimeout(()=>patchDelivery(),80); setTimeout(()=>patchDelivery(),350); return r;};

  function hideLegacyVehicle(){
    const vf=$('lgVehicleForm'); if(vf)vf.classList.add('hidden');
    const vl=$('lgVehicleList'); if(vl){vl.classList.add('hidden'); const t=vl.previousElementSibling; if(t&&/No Polisi/i.test(t.textContent||''))t.classList.add('hidden');}
  }
  async function renderAdmin78(){
    const modal=$('logisticsModal'); if(!modal)return;
    await loadMaster(); hideLegacyVehicle();
    const form=$('lgDriverForm');
    if(form&&!$('lgDriverPlate')){
      const phone=$('lgDriverPhone')?.closest('.field');
      if(phone) phone.insertAdjacentHTML('beforebegin','<div class="field"><label>No Polisi *</label><input id="lgDriverPlate" placeholder="B 9013 PDE"></div><div class="field"><label>Jenis Armada</label><input id="lgDriverVehicleType" placeholder="CDE / CDD / WB (opsional)"></div>');
    }
    const save=$('lgDriverSave'); if(save)save.onclick=async()=>{const m=$('lgDriverMsg'); try{await rpc('logistics_driver_vehicle_save',{p_id:Number($('lgDriverId')?.value)||null,p_rdc:(ACCESS?.rdc_name||SCOPE||'Jakarta'),p_vendor_id:Number($('lgDriverVendor')?.value),p_driver_name:$('lgDriverName')?.value,p_plate_no:$('lgDriverPlate')?.value,p_phone:$('lgDriverPhone')?.value,p_vehicle_type:$('lgDriverVehicleType')?.value,p_active:true}); if(m){m.style.color='#067647';m.textContent='✓ Driver / No Polisi tersimpan.';} ['lgDriverId','lgDriverName','lgDriverPlate','lgDriverPhone','lgDriverVehicleType'].forEach(id=>{if($(id))$(id).value='';}); await loadMaster(); renderDriverList78();}catch(e){if(m){m.style.color='#b42318';m.textContent=String(e.message||e);}}};
    renderDriverList78();
  }
  function renderDriverList78(){
    const box=$('lgDriverList'); if(!box)return;
    const rows=MASTER78.drivers||[];
    box.innerHTML=rows.length?`<div class="tablewrap"><table><thead><tr><th>No Polisi</th><th>Driver</th><th>Vendor</th><th>Armada</th><th>No HP</th><th>Aksi</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.plate||'—')}</b></td><td>${esc(x.name||'')}</td><td>${esc(x.vendor_name||'')}</td><td>${esc(x.vehicle_type||'—')}</td><td>${esc(x.phone||'—')}</td><td>${String(ACCESS?.breakage_role||ACCESS?.role||'').toLowerCase()==='spv'?`<button class="mini" onclick="window.lgEdit78(${Number(x.id)})">Edit</button>`:''}${ACCESS?.is_master?` <button class="mini" onclick="window.lgDelete('DRIVER',${Number(x.id)})">Delete</button>`:''}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Belum ada data driver.</div>';
  }
  window.lgEdit78=id=>{const x=(MASTER78.drivers||[]).find(r=>Number(r.id)===Number(id)); if(!x)return; if($('lgDriverId'))$('lgDriverId').value=x.id; if($('lgDriverVendor'))$('lgDriverVendor').value=x.vendor_id; if($('lgDriverName'))$('lgDriverName').value=x.name||''; if($('lgDriverPlate'))$('lgDriverPlate').value=x.plate||''; if($('lgDriverPhone'))$('lgDriverPhone').value=x.phone||''; if($('lgDriverVehicleType'))$('lgDriverVehicleType').value=x.vehicle_type||'';};

  document.addEventListener('click',e=>{const t=e.target; if(t?.id==='logisticsBtn'||/Database Ekspedisi/i.test(t?.textContent||'')){setTimeout(renderAdmin78,100);setTimeout(renderAdmin78,500);} if(t?.dataset?.type==='delivery')setTimeout(()=>patchDelivery(),80);});
  dedupeButtons(); badge(); [100,500,1200,2500].forEach(ms=>setTimeout(()=>{dedupeButtons();badge();hideLegacyVehicle();},ms));
})();
