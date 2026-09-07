// SLS Breakage Input v64 — active scope only Delivery & Storage breakage.
(function(){
  const BUILD='BUILD v64';
  const activeType=t=>['delivery','warehouse'].includes(String(t||'').toLowerCase());
  const setBuild=()=>{const el=document.getElementById('slsBuildBadge');if(el)el.textContent=BUILD};

  function applyLabels(){
    const tabs=document.getElementById('typeTabs');
    if(tabs){
      const rec=tabs.querySelector('[data-type="receiving"]');if(rec)rec.remove();
      const del=tabs.querySelector('[data-type="delivery"]');if(del)del.textContent='Pecah Kiriman';
      const wh=tabs.querySelector('[data-type="warehouse"]');if(wh)wh.textContent='Pecah Penyimpanan';
      const hint=tabs.parentElement?.querySelector('.hint');if(hint)hint.innerHTML='<b>Fokus input:</b> Pecah Kiriman dan Pecah Penyimpanan. Pecah penerimaan langsung diretur ke pabrik dan direkap pabrik sebagai pecah pengiriman. Force majeure diselesaikan melalui BA ke management dan stock adjustment sesuai approval.';
    }
    const hero=document.querySelector('.hero p');if(hero)hero.textContent='Admin RDC mencatat Pecah Kiriman atau Pecah Penyimpanan sebagai Draft. SPV RDC review/approve. Master melakukan review dan monitoring. Receiving diretur ke pabrik; force majeure melalui BA management.';
    const cType=document.getElementById('cType');if(cType){[...cType.options].forEach(o=>{if(o.value==='receiving')o.remove()});if(cType.value==='receiving')cType.value='delivery'}
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
  renderHistory=function(){INCIDENTS=(INCIDENTS||[]).filter(r=>activeType(r.incident_type));const out=baseRenderHistory();document.querySelectorAll('#historyBody tr').forEach(tr=>{tr.innerHTML=tr.innerHTML.replace(/delivery/gi,'Pecah Kiriman').replace(/warehouse/gi,'Pecah Penyimpanan')});setBuild();return out};
  window.renderHistory=renderHistory;

  if(typeof loadHistory==='function'){
    const baseLoad=loadHistory;
    loadHistory=async function(){const out=await baseLoad.apply(this,arguments);INCIDENTS=(INCIDENTS||[]).filter(r=>activeType(r.incident_type));renderHistory();applyLabels();setBuild();return out};
    window.loadHistory=loadHistory;
  }

  if(typeof viewIncident==='function'){
    const baseView=viewIncident;
    viewIncident=async function(id){const r=(INCIDENTS||[]).find(x=>Number(x.incident_id)===Number(id));if(r&&!activeType(r.incident_type))return;const out=await baseView(id);applyLabels();return out};
    window.viewIncident=viewIncident;
  }

  applyLabels();setBuild();setTimeout(()=>{applyLabels();setBuild()},300);
  window.__SLS_BREAKAGE_INPUT_FOCUS='v64-delivery-storage';
})();
