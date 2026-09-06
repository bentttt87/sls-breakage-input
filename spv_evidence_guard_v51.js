// SLS Breakage Input v51 — SPV evidence completeness guard.
// Enforces 1 evidence photo per broken BOX at SPV approval, including legacy drafts.
(function(){
  const BUILD_LABEL='BUILD v51';

  function setBuild(){
    const el=document.getElementById('slsBuildBadge');
    if(el) el.textContent=BUILD_LABEL;
  }
  setBuild();

  // runtime_patch v50 still owns compression/session logic and calls ensureBuildBadge()
  // during history refresh. Re-assert v51 after every app render/history load so the
  // displayed build reflects the active SPV evidence guard instead of falling back to v50.
  if(typeof loadHistory==='function'){
    const baseLoadHistoryV51=loadHistory;
    loadHistory=async function(){
      try{return await baseLoadHistoryV51.apply(this,arguments)}
      finally{setBuild()}
    };
    window.loadHistory=loadHistory;
  }
  if(typeof showApp==='function'){
    const baseShowAppV51=showApp;
    showApp=function(){
      const out=baseShowAppV51.apply(this,arguments);
      setBuild();
      return out;
    };
    window.showApp=showApp;
  }

  function incidentById(id){return (INCIDENTS||[]).find(x=>Number(x.incident_id)===Number(id))}
  function requiredEvidence(r){const q=Number(r?.qty_box||0);return q>0?Math.max(1,Math.ceil(q)):1}
  function evidenceCount(r){return Array.isArray(r?.photo_paths)?r.photo_paths.filter(Boolean).length:0}
  function evidenceComplete(r){return evidenceCount(r)>=requiredEvidence(r)}

  function renderEvidenceRule(r){
    const details=$('reviewDetails');if(!details)return;
    let box=document.getElementById('reviewEvidenceRule');
    if(!box){
      box=document.createElement('div');box.id='reviewEvidenceRule';box.className='hint';box.style.cssText='grid-column:1/-1;margin-bottom:2px;font-weight:700';
      details.parentNode.insertBefore(box,details.nextSibling);
    }
    const req=requiredEvidence(r),got=evidenceCount(r),ok=got>=req;
    box.style.borderColor=ok?'#b7e2ca':'#ffc9c6';
    box.style.background=ok?'#e8f7ef':'#fff0ef';
    box.style.color=ok?'#067647':'#c42d26';
    box.innerHTML=ok
      ? `✓ Evidence lengkap: <b>${got}/${req} foto</b> untuk ${Number(r.qty_box||0)} BOX.`
      : `⚠ Evidence belum lengkap: <b>${got}/${req} foto</b>. Minimal 1 foto per BOX pecah. SPV hanya dapat <b>Return ke Admin</b> sampai evidence dilengkapi.`;
  }

  if(typeof viewIncident==='function'){
    const baseViewIncident=viewIncident;
    viewIncident=async function(id){
      await baseViewIncident(id);
      setBuild();
      const r=incidentById(id);if(!r)return;
      renderEvidenceRule(r);
      if(!evidenceComplete(r)){
        REVIEW_PHOTOS_READY=false;
        $('reviewChecked').checked=false;
        $('reviewChecked').disabled=true;
        const label=$('reviewChecked')?.closest('label');if(label)label.style.opacity='.55';
        $('reviewMsg').textContent=`Evidence ${evidenceCount(r)}/${requiredEvidence(r)}. Kembalikan ke Admin untuk melengkapi foto.`;
      }else{
        $('reviewChecked').disabled=false;
        const label=$('reviewChecked')?.closest('label');if(label)label.style.opacity='1';
      }
      syncReviewButtons();
    };
    window.viewIncident=viewIncident;
  }

  if(typeof submitSpvReview==='function'){
    const baseSubmitSpvReview=submitSpvReview;
    submitSpvReview=async function(decision){
      const r=incidentById(REVIEW_ID);
      if(decision==='APPROVE'&&r&&!evidenceComplete(r)){
        $('reviewMsg').textContent=`Approval ditahan: evidence baru ${evidenceCount(r)}/${requiredEvidence(r)} foto. Minimal 1 foto per BOX pecah.`;
        setBuild();
        return;
      }
      try{return await baseSubmitSpvReview(decision)}
      finally{setBuild()}
    };
    window.submitSpvReview=submitSpvReview;
    $('returnReview').onclick=()=>submitSpvReview('RETURN');
    $('approveReview').onclick=()=>submitSpvReview('APPROVE');
  }

  // Re-assert after runtime's delayed initialization as an additional safeguard.
  setTimeout(setBuild,200);
  setTimeout(setBuild,1000);
  window.__SLS_BREAKAGE_INPUT_EVIDENCE_GUARD='v51';
})();
