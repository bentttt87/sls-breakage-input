// SLS Breakage Input v87 — final form integrity guard. Prevents hidden/missing required delivery fields after legacy dynamic patches.
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const up=v=>String(v??'').trim().toUpperCase();
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let MASTER87={vendors:[],drivers:[]}, loading=false, scheduled=false;
  const isDelivery=()=>{try{return String(TYPE||'').toLowerCase()==='delivery'}catch(_){return false}};
  const rdc=()=>{try{return (ACCESS?.is_national?(SCOPE||'Jakarta'):ACCESS?.rdc_name)||'Jakarta'}catch(_){return 'Jakarta'}};
  function draft(){try{return JSON.parse(localStorage.getItem(draftKey())||'{}')||{}}catch(_){return {}}}
  async function loadMaster(){if(loading)return MASTER87;loading=true;try{MASTER87=await rpc('logistics_master_list',{p_rdc:rdc()})||MASTER87}catch(e){console.warn('v87 master',e)}finally{loading=false}return MASTER87}
  function vendors(){return (MASTER87.vendors||[]).filter(x=>x.active)}
  function vendorObj(name){return vendors().find(x=>up(x.name)===up(name))}
  function drivers(vendor){const v=vendorObj(vendor);return v?(MASTER87.drivers||[]).filter(x=>x.active&&Number(x.vendor_id)===Number(v.id)):[]}
  function fieldOf(id){return $(id)?.closest('.field')||null}
  function insertAfterField(refId,html){const f=fieldOf(refId);if(f)f.insertAdjacentHTML('afterend',html)}
  function visible(el){if(!el)return false;const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&el.getClientRects().length>0}
  function ensureFactory(){
    if(!isDelivery()||!$('conditional'))return;
    const d=draft();let old=$('fFactory'),current=up(old?.value||d.factory||'');
    if(!old){insertAfterField('fSj','<div class="field" id="factoryField87"><label>Pabrik Asal *</label><select id="fFactory"><option value="">Pilih Pabrik Asal</option><option value="SRKI">SRKI</option><option value="RCI">RCI</option></select><div class="smallnote" id="factoryHelp87">Wajib pilih SRKI atau RCI.</div></div>');old=$('fFactory')}
    if(old&&old.tagName!=='SELECT'){
      const s=document.createElement('select');s.id='fFactory';s.innerHTML='<option value="">Pilih Pabrik Asal</option><option value="SRKI">SRKI</option><option value="RCI">RCI</option>';old.replaceWith(s);old=s;
    }
    if(old){if(![...old.options].some(o=>o.value==='SRKI'))old.innerHTML='<option value="">Pilih Pabrik Asal</option><option value="SRKI">SRKI</option><option value="RCI">RCI</option>';if(['SRKI','RCI'].includes(current))old.value=current;old.onchange=()=>{clearFieldError('fFactory');try{saveDraft()}catch(_){}};}
  }
  function ensureVendorDriver(){
    if(!isDelivery())return;const d=draft();let v=$('fTransporter'),dr=$('fDriver');if(!v||!dr)return;
    const cv=v.value||d.transporter||'', cd=dr.value||d.driver||'', cp=dr.selectedOptions?.[0]?.dataset?.plate||d.police||'';
    if(v.tagName!=='SELECT'){const s=document.createElement('select');s.id='fTransporter';v.replaceWith(s);v=s}
    v.innerHTML='<option value="">Pilih Vendor Transport</option>'+vendors().map(x=>`<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('');if(vendorObj(cv))v.value=vendorObj(cv).name;
    const p=$('fPolice');if(p){const f=p.closest('.field');if(f)f.remove()}
    if(dr.tagName!=='SELECT'){const s=document.createElement('select');s.id='fDriver';dr.replaceWith(s);dr=s}
    const lab=fieldOf('fDriver')?.querySelector('label');if(lab)lab.textContent='Driver / No Polisi *';
    const fillDriver=(name,plate)=>{const rows=drivers(v.value);dr.innerHTML='<option value="">'+(v.value?(rows.length?'Pilih Driver / No Polisi':'Belum ada Driver / No Polisi untuk vendor ini'):'Pilih Vendor dahulu')+'</option>'+rows.map(x=>`<option value="${esc(x.name)}" data-plate="${esc(x.plate||'')}">${esc(x.plate||'—')} - ${esc(x.name||'')}</option>`).join('');const found=rows.find(x=>up(x.name)===up(name)&&(!plate||up(x.plate)===up(plate)));if(found)dr.value=found.name};
    fillDriver(cd,cp);
    v.onchange=()=>{fillDriver('','');clearFieldError('fTransporter');clearFieldError('fDriver');try{saveDraft()}catch(_){}};
    dr.onchange=()=>{clearFieldError('fDriver');try{saveDraft()}catch(_){}};
  }
  function clearFieldError(id){const f=fieldOf(id);if(!f)return;f.style.borderColor='';f.style.boxShadow='';const n=f.querySelector('.v87-error');if(n)n.remove()}
  function markField(id,msg){const el=$(id),f=fieldOf(id);if(!el||!f)return;f.style.borderColor='#d92d20';f.style.boxShadow='0 0 0 2px rgba(217,45,32,.08)';let n=f.querySelector('.v87-error');if(!n){n=document.createElement('div');n.className='smallnote v87-error';n.style.color='#b42318';n.style.marginTop='5px';f.appendChild(n)}n.textContent=msg}
  async function ensureAll(){if(!isDelivery())return;await loadMaster();ensureFactory();ensureVendorDriver();try{bindDraftInputs()}catch(_){ }setBadge()}
  function setBadge(){const b=$('buildBadge');if(b)b.textContent='v87'}
  function schedule(){if(scheduled)return;scheduled=true;setTimeout(async()=>{scheduled=false;await ensureAll()},20)}
  function preflight(){
    if(!isDelivery())return true;ensureFactory();ensureVendorDriver();['fFactory','fTransporter','fDriver'].forEach(clearFieldError);
    const f=up($('fFactory')?.value||''),v=$('fTransporter')?.value||'',d=$('fDriver'),name=d?.value||'',plate=d?.selectedOptions?.[0]?.dataset?.plate||'';let first=null;
    if(!['SRKI','RCI'].includes(f)){markField('fFactory','Pilih Pabrik Asal: SRKI atau RCI.');first=first||$('fFactory')}
    if(!vendorObj(v)){markField('fTransporter','Pilih Vendor dari Database Ekspedisi.');first=first||$('fTransporter')}
    if(!drivers(v).some(x=>up(x.name)===up(name)&&up(x.plate)===up(plate))){markField('fDriver','Pilih Driver / No Polisi yang terdaftar pada vendor.');first=first||$('fDriver')}
    if(first){first.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>first.focus(),250);const m=$('inputMsg');if(m)m.classList.add('hidden');return false}
    return true;
  }
  document.addEventListener('click',e=>{if(e.target?.id==='submitIncident'&&!preflight()){e.preventDefault();e.stopImmediatePropagation();}},true);
  const conditional=$('conditional');if(conditional)new MutationObserver(()=>schedule()).observe(conditional,{childList:true,subtree:true});
  document.addEventListener('change',e=>{if(['fFactory','fTransporter','fDriver'].includes(e.target?.id))schedule()},true);
  try{const baseOpen=openInput;openInput=async function(){const r=await baseOpen.apply(this,arguments);schedule();setTimeout(schedule,150);setTimeout(schedule,500);return r};window.openInput=openInput}catch(_){ }
  try{const baseRender=renderConditional;renderConditional=function(){const r=baseRender.apply(this,arguments);schedule();setTimeout(schedule,120);setTimeout(schedule,400);return r};window.renderConditional=renderConditional}catch(_){ }
  [50,180,500,1200,2500].forEach(ms=>setTimeout(()=>{schedule();setBadge()},ms));
})();
