// SLS Breakage Input v127 — SPV direct Edit/Delete access from full history list.
(function(){
  'use strict';
  if(window.__SLS_SPV_LIST_ACTIONS_V127__) return;
  window.__SLS_SPV_LIST_ACTIONS_V127__=true;
  const $x=id=>document.getElementById(id);
  const up=v=>String(v??'').trim().toUpperCase();
  const isSpv=()=>!!ACCESS?.can_submit_approve&&!ACCESS?.is_master;
  const editableStatus=s=>['DRAFT','WAITING_SPV','RETURNED_ADMIN','APPROVED_SPV'].includes(up(s));
  const isCurrentPeriod=()=>String(PERIOD||'')===String(currentPeriod());

  async function openEdit(id){
    const row=(Array.isArray(INCIDENTS)?INCIDENTS:[]).find(x=>Number(x.incident_id)===Number(id));
    if(!row)return;
    if(!isCurrentPeriod()){alert('Edit transaksi hanya dapat dilakukan pada periode bulan berjalan. Foto evidence tetap dapat diedit dari Detail & Foto.');return}
    if(!editableStatus(row.status)){alert('Status '+String(row.status||'')+' sudah tidak dapat direvisi oleh SPV.');return}
    const reason=prompt('Alasan revisi BA / incident (wajib):','Koreksi data BA oleh SPV');
    if(!String(reason||'').trim())return;
    await window.viewIncident(id);
    const note=$x('reviewNote');if(note)note.value=String(reason).trim();
    const revise=$x('spvReviseBtn');
    if(revise&&!revise.classList.contains('hidden')) revise.click();
  }

  async function deleteRow(id){
    const row=(Array.isArray(INCIDENTS)?INCIDENTS:[]).find(x=>Number(x.incident_id)===Number(id));
    if(!row)return;
    if(!isCurrentPeriod()){alert('Delete transaksi hanya dapat dilakukan pada periode bulan berjalan.');return}
    if(!editableStatus(row.status)){alert('Status '+String(row.status||'')+' sudah tidak dapat dihapus oleh SPV.');return}
    const reason=prompt('Alasan penghapusan BA / incident (wajib):','Salah input BA');
    if(!String(reason||'').trim())return;
    if(!confirm('Hapus '+String(row.no_ba||row.incident_no||'incident')+'? Data akan di-soft delete dan audit trail tetap tersimpan.'))return;
    try{
      await rpc('breakage_incident_spv_correct_v61',{
        p_incident_id:Number(id),
        p_action:'DELETE',
        p_reason:String(reason).trim(),
        p_changes:{}
      });
      await loadHistory();
    }catch(e){
      alert('Hapus gagal: '+cleanErr(e?.message||e));
    }
  }

  function decorate(){
    if(!isSpv())return;
    const body=$x('historyBody');if(!body)return;
    const trs=[...body.querySelectorAll('tr')];
    const rows=Array.isArray(INCIDENTS)?INCIDENTS:[];
    rows.forEach((r,i)=>{
      const tr=trs[i],td=tr?.lastElementChild;
      if(!td||td.querySelector('[data-spv-list-actions-v127]'))return;
      const wrap=document.createElement('div');
      wrap.dataset.spvListActionsV127='1';
      wrap.style.cssText='display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;margin-top:5px';
      const edit=document.createElement('button');
      edit.className='mini';edit.type='button';edit.textContent='✎ Edit';
      edit.disabled=!isCurrentPeriod()||!editableStatus(r.status);
      edit.title=edit.disabled?'Transaksi hanya dapat diedit pada periode berjalan dan status yang masih terbuka':'Edit data BA / incident';
      edit.onclick=()=>openEdit(r.incident_id);
      const del=document.createElement('button');
      del.className='mini';del.type='button';del.textContent='🗑 Delete';
      del.style.color='#b42318';del.style.borderColor='#e5aaa4';
      del.disabled=!isCurrentPeriod()||!editableStatus(r.status);
      del.title=del.disabled?'Transaksi hanya dapat dihapus pada periode berjalan dan status yang masih terbuka':'Hapus BA / incident';
      del.onclick=()=>deleteRow(r.incident_id);
      wrap.append(edit,del);td.appendChild(wrap);
    });
  }

  try{
    const base=window.renderHistory||renderHistory;
    const wrapped=function(){
      const r=base.apply(this,arguments);
      setTimeout(decorate,0);
      return r;
    };
    window.renderHistory=wrapped;renderHistory=wrapped;
  }catch(_){}

  window.spvListEditV127=openEdit;
  window.spvListDeleteV127=deleteRow;
  [120,450,1000,1800].forEach(ms=>setTimeout(()=>{decorate();const b=$x('buildBadge');if(b)b.textContent='v127';},ms));
})();