// SLS Breakage Input v64 — active scope only Delivery & Storage breakage.
(function(){
  const BUILD='BUILD v64';
  const activeType=t=>['delivery','warehouse'].includes(String(t||'').toLowerCase());
  const setBuild=()=>{const el=document.getElementById('slsBuildBadge');if(el)el.textContent=BUILD};

  function applyLabels(){
    const tabs=document.getElementById('typeTabs');
    if(tabs){
      tabs.style.gridTemplateColumns='repeat(2,1fr)';
      const rec=tabs.querySelector('[data-type="receiving"]');if(rec)rec.remove();
      const del=tabs.querySelector('[data-type="delivery"]');if(del)del.textContent='Pecah Kiriman';
      const wh=tabs.querySelector('[data-type="warehouse"]');if(wh)wh.textContent='Pecah Penyimpanan';
      const hint=tabs.parentElement?.querySelector('.hint');if(hint)hint.innerHTML='<b>Fokus input:</b> Pecah Kiriman dan Pecah Penyimpanan. Pecah penerimaan langsung diretur ke pabrik dan direkap pabrik sebagai pecah pengiriman. Force majeure diselesaikan melalui BA ke management dan stock adjustment sesuai approval.';
    }
    const hero=document.querySelector('.hero p');if(hero)hero.textContent='Admin RDC mencatat Pecah Kiriman atau Pecah Penyimpanan sebagai Draft. SPV RDC review/approve. Master melakukan review dan monitoring. Receiving diretur ke pabrik; force majeure melalui BA management.';
    const cType=document.getElementById('cType');if(cType){[...cType.options].forEach(o=>{if(o.value==='receiving')o.remove()});if(cType.value==='receiving')cType.value='delivery';const wh=[...cType.options].find(o=>o.value==='warehouse');if(wh)wh.textContent='Penyimpanan'}
  }

  const baseRenderConditional=renderConditional;
  renderConditional=function(t){if(!activeType(t))t='delivery';const out=baseRenderConditional(t);applyLabels();return out};
  window.renderConditional=renderConditional;

  const baseOpenInput=openInput;
  openInput=function(){TYPE=activeType(TYPE)?TYPE:'delivery';const out=baseOpenInput.apply(this,arguments);setTimeout(()=>{if(!activeType(TYPE)){TYPE='delivery';renderConditional('delivery')}applyLabels();setBuild()},0);return out};
  window.openInput=openInput;
  $('newBtn').onclick=()=>openInput();$('navInput').onclick=()=>openInput();

  const baseValidate=validateIncident;
  validateIncident=function(){const m=baseValidate?baseValidate():[];if(!activeType(TYPE))m.push('Jenis kejadian hanya Pecah Kiriman atau Pecah Penyimpanan');return m};
  window.validateIncident=validateIncident;

  if(typeof editIncident==='function'){
    const baseEdit=editIncident;
    editIncident=function(id){const r=(INCIDENTS||[]).find(x=>Number(x.incident_id)===Number(id));if(r&&!activeType(r.incident_type)){alert('Incident Receiving lama tidak lagi diedit melalui Breakage Monitoring SLS. Receiving diretur ke pabrik.');return}return baseEdit(id)};
    window.editIncident=editIncident;
  }

  const baseRenderHistory=renderHistory;
  renderHistory=function(){
    INCIDENTS=(INCIDENTS||[]).filter(r=>activeType(r.incident_type));
    const out=baseRenderHistory();
    document.querySelectorAll('#historyBody tr').forEach(tr=>{const td=tr.children?.[2];if(!td)return;const raw=String(td.textContent||'').trim().toLowerCase();if(raw==='delivery')td.textContent='Pecah Kiriman';else if(raw==='warehouse')td.textContent='Pecah Penyimpanan'});
    setBuild();return out;
  };
  window.renderHistory=renderHistory;

  if(typeof loadHistory==='function'){
    const baseLoad=loadHistory;
    loadHistory=async function(){const out=await baseLoad.apply(this,arguments);INCIDENTS=(INCIDENTS||[]).filter(r=>activeType(r.incident_type));renderHistory();applyLabels();setBuild();return out};
    window.loadHistory=loadHistory;
  }

  if(typeof viewIncident==='function'){
    const baseView=viewIncident;
    viewIncident=async function(id){const r=(INCIDENTS||[]).find(x=>Number(x.incident_id)===Number(id));if(r&&!activeType(r.incident_type))return;const out=await baseView(id);applyLabels();document.querySelectorAll('#reviewDetails .field').forEach(f=>{const l=f.querySelector('label');if(l?.textContent==='Jenis'){const d=f.querySelector('div');if(d){if(d.textContent==='delivery')d.textContent='Pecah Kiriman';if(d.textContent==='warehouse')d.textContent='Pecah Penyimpanan'}}});return out};
    window.viewIncident=viewIncident;
  }

  applyLabels();setBuild();setTimeout(()=>{applyLabels();setBuild()},300);
  window.__SLS_BREAKAGE_INPUT_FOCUS='v64-delivery-storage';
})();

// v66 — authoritative evidence rule: 1–5 photos per INCIDENT, independent of Qty BOX.
// This intentionally overrides the legacy v50 "1 photo per BOX" validator/UI after all earlier patches load.
(function(){
  const BUILD='BUILD v66';
  const setBuild=()=>{const el=document.getElementById('slsBuildBadge');if(el)el.textContent=BUILD};
  const evidenceCount=()=>Number((EXISTING_PHOTO_PATHS||[]).filter(Boolean).length)+Number((PHOTOS||[]).filter(Boolean).length);
  const upper=v=>String(v??'').trim().toUpperCase();

  function applyEvidenceUi(){
    const area=document.querySelector('.photo-area');if(!area)return;
    const title=area.querySelector('b');if(title)title.textContent='Evidence Foto 1–5 per incident *';
    const note=area.querySelector('.smallnote');
    if(note){
      const got=evidenceCount();
      note.innerHTML=`Rule aktif: minimal <b>1 foto</b> dan maksimal <b>5 foto</b> per incident, tidak bergantung Qty BOX. Saat ini <b>${got}</b> foto. Foto dikompres otomatis sebelum upload.`;
    }
  }

  // Full validator replacement so no legacy "1 foto per BOX" requirement can leak through.
  validateIncident=function(){
    const d=formData(),m=[],got=evidenceCount();
    if(!d.date)m.push('Tanggal');
    if(!d.item)m.push('Kode Item');
    if(!(Number(d.qty)>0))m.push('Qty');
    if(!d.reported)m.push('Reported By');
    if(got<1)m.push('Foto evidence minimal 1 per incident');
    if(got>5)m.push('Foto evidence maksimal 5 per incident');
    if(TYPE==='delivery'){
      if(!d.sj)m.push('No SJ');if(!d.customer)m.push('Customer');if(!d.transporter)m.push('Transporter');if(!d.driver)m.push('Driver');if(!d.police)m.push('No Polisi');
    }else if(TYPE==='warehouse'){
      if(d.wh==='Misshandling'&&!d.related)m.push('Nama terkait');
    }else{
      m.push('Jenis kejadian hanya Pecah Kiriman atau Pecah Penyimpanan');
    }
    if(CAUSE==='Lainnya'&&!d.detail)m.push('Keterangan penyebab');
    return m;
  };
  window.validateIncident=validateIncident;

  // Keep cumulative photo selection, but hard-cap total evidence at 5.
  if($('fPhotos'))$('fPhotos').onchange=e=>{
    const incoming=Array.from(e.target.files||[]);
    const bad=incoming.find(f=>!['image/jpeg','image/png'].includes(f.type));
    if(bad){alert('Format foto harus JPG atau PNG.');e.target.value='';return}
    const existing=(EXISTING_PHOTO_PATHS||[]).filter(Boolean).length;
    const fresh=(PHOTOS||[]).filter(Boolean).length;
    if(existing+fresh+incoming.length>5){alert(`Maksimal 5 foto per incident. Saat ini sudah ada ${existing+fresh} foto.`);e.target.value='';return}
    PHOTOS=[...(PHOTOS||[]),...incoming];e.target.value='';renderPhotos();applyEvidenceUi();setBuild();
  };

  if(typeof renderPhotos==='function'){
    const baseRenderPhotosV66=renderPhotos;
    renderPhotos=function(){const out=baseRenderPhotosV66.apply(this,arguments);applyEvidenceUi();setBuild();return out};
    window.renderPhotos=renderPhotos;
  }
  $('fQty')?.addEventListener('input',applyEvidenceUi);
  setTimeout(()=>{applyEvidenceUi();setBuild()},50);
  setTimeout(()=>{applyEvidenceUi();setBuild()},500);
  window.__SLS_BREAKAGE_EVIDENCE_RULE='v66-1-to-5-per-incident';
})();