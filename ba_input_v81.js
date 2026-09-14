// SLS Breakage Input v81 — direct BA print, BA metadata, same-SJ item flow.
(function(){
  'use strict';
  const get=id=>document.getElementById(id);
  let LAST_BA=null;
  const up=v=>String(v??'').trim().toUpperCase();
  const same=(a,b)=>up(a)===up(b);
  const esc2=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const currentType=()=>{try{return String(TYPE||'').toLowerCase()}catch(_){return ''}};
  const incidentRows=()=>{try{return Array.isArray(INCIDENTS)?INCIDENTS:[]}catch(_){return []}};

  function setBuild(){const b=get('buildBadge');if(b)b.textContent='v81';}
  function ensureBaFields(){
    if(currentType()!=='delivery')return;
    const customer=get('fCustomer');if(!customer)return;
    if(!get('fReceiver')){
      const fld=customer.closest('.field');
      if(fld)fld.insertAdjacentHTML('afterend','<div class="field"><label>Nama Penerima BA *</label><input id="fReceiver" placeholder="Nama penerima / PIC penerima"></div><div class="field"><label>Saksi Pemeriksa *</label><input id="fWitness" placeholder="Nama saksi pemeriksa"></div>');
    }
    try{bindDraftInputs();}catch(_){ }
  }
  function applyDraftBaFields(){try{const d=JSON.parse(localStorage.getItem(draftKey())||'{}');if(get('fReceiver')&&d.receiver)get('fReceiver').value=d.receiver;if(get('fWitness')&&d.witness)get('fWitness').value=d.witness;}catch(_){ }}

  const baseRenderConditional=renderConditional;
  renderConditional=function(t){const r=baseRenderConditional.apply(this,arguments);ensureBaFields();setTimeout(()=>{ensureBaFields();applyDraftBaFields();},0);return r;};

  const baseFormData=formData;
  formData=function(){const d=baseFormData.apply(this,arguments)||{};d.receiver=up(get('fReceiver')?.value||'');d.witness=up(get('fWitness')?.value||'');return d;};

  const baseValidate=validateIncident;
  validateIncident=function(){const m=baseValidate.apply(this,arguments)||[];if(currentType()==='delivery'){if(!up(get('fReceiver')?.value))m.push('Nama Penerima BA');if(!up(get('fWitness')?.value))m.push('Saksi Pemeriksa');}return [...new Set(m)];};

  function snapshotForm(){let d={};try{d=formData()||{};}catch(_){ }let c='';try{c=CAUSE||''}catch(_){ }return {rdc:(typeof effectiveScope==='function'?effectiveScope():get('fRdc')?.value)||'',date:d.date||get('fDate')?.value||'',item:d.item||get('fItem')?.value||'',series:get('fSeries')?.value||'',qty:Number(d.qty||get('fQty')?.value||0),uom:'BOX',sj:d.sj||get('fSj')?.value||'',factory:d.factory||get('fFactory')?.value||'',customer:d.customer||get('fCustomer')?.value||'',receiver:d.receiver||get('fReceiver')?.value||'',transporter:d.transporter||get('fTransporter')?.value||'',driver:d.driver||get('fDriver')?.value||'',police:d.police||get('fPolice')?.value||get('fDriver')?.selectedOptions?.[0]?.dataset?.plate||'',witness:d.witness||get('fWitness')?.value||'',cause:c,detail:get('fCauseDetail')?.value||''};}

  const baseRpc=rpc;
  rpc=async function(fn,params={}){
    let snap=null;
    if((fn==='breakage_incident_create_v45'||fn==='breakage_incident_update_draft_v45')&&params?.p_payload){snap=snapshotForm();params={...params,p_payload:{...params.p_payload,ba_receiver_name:up(get('fReceiver')?.value||snap.receiver),ba_witness_name:up(get('fWitness')?.value||snap.witness),factory:up(get('fFactory')?.value||snap.factory)}};}
    if(fn==='breakage_incident_spv_correct_v61'&&String(params?.p_action||'').toUpperCase()==='REVISE'){params={...params,p_changes:{...(params.p_changes||{}),ba_receiver_name:up(get('cReceiver')?.value||''),ba_witness_name:up(get('cWitness')?.value||'')}};}
    const res=await baseRpc(fn,params);
    if(fn==='breakage_incident_create_v45'&&snap&&String(params?.p_payload?.incident_type||'').toLowerCase()==='delivery'){LAST_BA={...snap,incident_id:res?.incident_id,incident_no:res?.incident_no,no_ba:res?.no_ba,status:res?.status||'DRAFT'};setTimeout(()=>showBaSuccess(LAST_BA),1050);}
    return res;
  };

  function groupMatch(r,s){return String(r.incident_type||'').toLowerCase()==='delivery'&&same(r.rdc,s.rdc)&&same(r.occurrence_date,s.date)&&same(r.no_sj,s.sj)&&same(r.customer,s.customer)&&same(r.transporter,s.transporter)&&same(r.vehicle_no,s.police);}
  function makePrintGroup(seed){const items=incidentRows().filter(r=>groupMatch(r,seed));if(!items.some(r=>Number(r.incident_id)===Number(seed.incident_id))){items.push({incident_id:seed.incident_id,incident_no:seed.incident_no,rdc:seed.rdc,occurrence_date:seed.date,incident_type:'delivery',item_code:seed.item,ceramic_series:seed.series,qty_box:seed.qty,uom:'BOX',no_ba:seed.no_ba,no_sj:seed.sj,factory:seed.factory,customer:seed.customer,transporter:seed.transporter,driver_name:seed.driver,vehicle_no:seed.police,ba_receiver_name:seed.receiver,ba_witness_name:seed.witness,cause:seed.cause,cause_detail:seed.detail,status:seed.status||'DRAFT'});}items.sort((a,b)=>Number(a.incident_id||0)-Number(b.incident_id||0));return {rdc:seed.rdc,occurrence_date:seed.date,no_sj:seed.sj,factory:seed.factory,customer:seed.customer,receiver_name:seed.receiver||items.find(x=>x.ba_receiver_name)?.ba_receiver_name||'',transporter:seed.transporter,driver_name:seed.driver,vehicle_no:seed.police,witness_name:seed.witness||items.find(x=>x.ba_witness_name)?.ba_witness_name||'',items};}
  function openPrint(seed){const g=makePrintGroup(seed);const key='sls_ba_print_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);localStorage.setItem(key,JSON.stringify(g));const w=window.open('/ba_print.html?k='+encodeURIComponent(key),'_blank');if(!w)alert('Popup diblokir browser. Izinkan popup untuk mencetak BA.');}

  function ensureSuccessModal(){if(get('baSuccessModal'))return;document.body.insertAdjacentHTML('beforeend','<div id="baSuccessModal" class="overlay"><div class="modal" style="width:min(620px,100%)"><div class="modal-head"><div><h2>Breakage Kiriman Tersimpan</h2><div class="small" style="opacity:.85">BA siap dicetak atau ditambah item lain untuk SJ yang sama</div></div><div class="grow"></div><button class="close" id="baSuccessClose">✕</button></div><div class="modal-body"><div class="hint" id="baSuccessInfo"></div><div class="form-grid" style="margin-top:10px"><div class="field"><label>No BA Sistem</label><div id="baSuccessNo">—</div></div><div class="field"><label>No Surat Jalan</label><div id="baSuccessSj">—</div></div><div class="field"><label>Item terakhir</label><div id="baSuccessItem">—</div></div><div class="field"><label>Jumlah item BA/SJ</label><div id="baSuccessCount">—</div></div></div></div><div class="modal-foot" style="flex-wrap:wrap"><button class="secondary" id="baAddSame">＋ Tambah Item ke BA/SJ Sama</button><button class="primary" id="baPrintNow">🖨 Print BA</button><button class="secondary" id="baDone">Selesai</button></div></div></div>');get('baSuccessClose').onclick=()=>get('baSuccessModal').classList.remove('show');get('baDone').onclick=()=>get('baSuccessModal').classList.remove('show');get('baPrintNow').onclick=()=>LAST_BA&&openPrint(LAST_BA);get('baAddSame').onclick=()=>LAST_BA&&addSameShipment(LAST_BA);}
  async function showBaSuccess(seed){ensureSuccessModal();try{if(typeof loadHistory==='function'){try{PERIOD=String(seed.date||'').slice(0,7)||PERIOD}catch(_){ }await loadHistory();}}catch(_){ }LAST_BA=seed;const g=makePrintGroup(seed);get('baSuccessNo').textContent=seed.no_ba||'—';get('baSuccessSj').textContent=seed.sj||'—';get('baSuccessItem').textContent=[seed.item,seed.series].filter(Boolean).join(' / ')||'—';get('baSuccessCount').textContent=String(g.items.length);get('baSuccessInfo').innerHTML='<b>Draft berhasil disimpan.</b> Anda dapat langsung mencetak BA, atau tambahkan item lain untuk No SJ yang sama. Saat dicetak ulang, seluruh item dengan data pengiriman yang sama akan digabung menjadi satu BA.';get('baSuccessModal').classList.add('show');}
  async function addSameShipment(seed){get('baSuccessModal')?.classList.remove('show');try{await openInput();}catch(_){try{openInput();}catch(__){ }}const fill=()=>{try{renderConditional('delivery')}catch(_){ }ensureBaFields();if(get('fDate'))get('fDate').value=seed.date||'';if(get('fSj'))get('fSj').value=seed.sj||'';if(get('fFactory'))get('fFactory').value=seed.factory||'';if(get('fCustomer'))get('fCustomer').value=seed.customer||'';if(get('fReceiver'))get('fReceiver').value=seed.receiver||'';if(get('fWitness'))get('fWitness').value=seed.witness||'';if(get('fTransporter')){get('fTransporter').value=seed.transporter||'';get('fTransporter').dispatchEvent(new Event('change',{bubbles:true}));}setTimeout(()=>{if(get('fDriver')){get('fDriver').value=seed.driver||'';get('fDriver').dispatchEvent(new Event('change',{bubbles:true}));}if(get('fPolice'))get('fPolice').value=seed.police||'';if(get('fCauseDetail'))get('fCauseDetail').value=seed.detail||'';try{saveDraft();}catch(_){ }},80);if(get('fItem'))get('fItem').value='';if(get('fSeries'))get('fSeries').value='';if(get('fQty'))get('fQty').value='';try{CAUSE=seed.cause||'Perjalanan';document.querySelectorAll('#causeTabs button').forEach(b=>b.classList.toggle('active',b.dataset.cause===CAUSE));}catch(_){ }};[60,260,700].forEach(ms=>setTimeout(fill,ms));}

  const baseOpenInput=openInput;
  openInput=async function(){const r=await baseOpenInput.apply(this,arguments);ensureBaFields();setTimeout(()=>{ensureBaFields();applyDraftBaFields();},80);return r;};
  const baseEditIncident=editIncident;
  editIncident=async function(id){const row=incidentRows().find(x=>Number(x.incident_id)===Number(id));const r=await baseEditIncident.apply(this,arguments);setTimeout(()=>{ensureBaFields();if(get('fReceiver'))get('fReceiver').value=row?.ba_receiver_name||'';if(get('fWitness'))get('fWitness').value=row?.ba_witness_name||'';},120);return r;};window.editIncident=editIncident;

  const baseView=viewIncident;
  viewIncident=async function(id){const row=incidentRows().find(x=>Number(x.incident_id)===Number(id));const r=await baseView.apply(this,arguments);setTimeout(()=>{if(row&&String(row.incident_type).toLowerCase()==='delivery'&&get('reviewDetails')){if(!get('reviewBaMeta'))get('reviewDetails').insertAdjacentHTML('beforeend','<div class="field" id="reviewBaMeta"><label>Nama Penerima BA</label><div>'+esc2(row.ba_receiver_name||'—')+'</div></div><div class="field" id="reviewBaWitness"><label>Saksi Pemeriksa</label><div>'+esc2(row.ba_witness_name||'—')+'</div></div>');}},80);return r;};window.viewIncident=viewIncident;

  const baseCorrectionHtml=correctionHtml;
  correctionHtml=function(r){let html=baseCorrectionHtml.apply(this,arguments);if(String(r?.incident_type||'').toLowerCase()==='delivery'){html=html.replace('</div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">','<div class="field"><label>Nama Penerima BA</label><input id="cReceiver" value="'+esc2(r.ba_receiver_name||'')+'"></div><div class="field"><label>Saksi Pemeriksa</label><input id="cWitness" value="'+esc2(r.ba_witness_name||'')+'"></div></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">');}return html;};

  const baseRenderHistory=renderHistory;
  renderHistory=function(){const r=baseRenderHistory.apply(this,arguments);const trs=[...(get('historyBody')?.querySelectorAll('tr')||[])];incidentRows().slice(0,60).forEach((x,i)=>{if(String(x.incident_type||'').toLowerCase()!=='delivery'||!trs[i])return;const td=trs[i].lastElementChild;if(!td||td.querySelector('[data-print-ba]'))return;const b=document.createElement('button');b.className='mini';b.dataset.printBa='1';b.textContent='🖨 Print BA';b.onclick=()=>openPrint({rdc:x.rdc,date:x.occurrence_date,item:x.item_code,series:x.ceramic_series,qty:x.qty_box,sj:x.no_sj,factory:x.factory,customer:x.customer,receiver:x.ba_receiver_name,transporter:x.transporter,driver:x.driver_name,police:x.vehicle_no,witness:x.ba_witness_name,cause:x.cause,detail:x.cause_detail,incident_id:x.incident_id,incident_no:x.incident_no,no_ba:x.no_ba,status:x.status});td.appendChild(b);});return r;};

  ensureSuccessModal();setBuild();[100,350,900].forEach(ms=>setTimeout(()=>{setBuild();ensureBaFields();},ms));
})();
