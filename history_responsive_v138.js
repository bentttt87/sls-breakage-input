/* Breakage Input v138 — no sideways scrolling, compact responsive incident cards. */
(function(){
  'use strict';
  if(window.__SLS_HISTORY_LAYOUT_V138__)return;
  window.__SLS_HISTORY_LAYOUT_V138__=true;
  const style=document.createElement('style');
  style.id='historyResponsiveStyleV138';
  style.textContent=`
    html,body,.app,.wrap{max-width:100%;overflow-x:clip}
    .wrap{width:min(100%,1440px)}
    .panel:has(#historyBody){min-width:0;width:100%;overflow:hidden}
    .panel:has(#historyBody) .panel-head{min-width:0;display:flex;align-items:center;flex-wrap:wrap;gap:10px;padding:16px 18px}
    .panel:has(#historyBody) .panel-head h3{font-size:19px;font-weight:850;white-space:nowrap}
    .panel:has(#historyBody) .panel-head .grow{flex:1 1 auto;min-width:10px}
    .panel:has(#historyBody) .panel-head select{font-size:15px;min-height:42px;max-width:100%}
    .panel:has(#historyBody) .tablewrap{overflow-x:hidden;overflow-y:visible;max-width:100%;padding:8px 12px 12px}
    .panel:has(#historyBody) table{display:block;border-collapse:separate;border-spacing:0;width:100%;max-width:100%;min-width:0;white-space:normal;table-layout:auto;font-size:14px}
    .panel:has(#historyBody) thead{display:none}
    .panel:has(#historyBody) tbody{display:block;width:100%;min-width:0}
    #historyBody tr{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:11px 18px;
      width:100%;min-width:0;padding:17px 18px;margin:7px 0 13px;background:#fff;
      border:1px solid #d8e4f0;border-left:5px solid #1b68b2;border-radius:13px;
      box-shadow:0 3px 12px rgba(10,39,75,.045);align-items:start}
    #historyBody tr:nth-child(even){background:#fafdff}
    #historyBody td{display:flex;flex-direction:column;min-width:0;max-width:100%;height:auto;white-space:normal;
      border:0;padding:0;font-size:14px;line-height:1.45;font-weight:650;color:#1b3657;overflow-wrap:anywhere;word-break:normal;gap:4px}
    #historyBody td::before{content:attr(data-field);display:block;font-size:11px;color:#66809d;
      letter-spacing:.35px;text-transform:uppercase;font-weight:850;line-height:1.35}
    #historyBody td:first-child{font-weight:900;color:#0c4e8c}
    #historyBody td:nth-child(8){color:#193d68;font-weight:800}
    #historyBody td:nth-child(10){align-items:flex-start}
    #historyBody .badge{font-size:12px;padding:5px 10px;line-height:1.5;white-space:normal}
    #historyBody .smallnote{max-width:100%;font-size:12px;line-height:1.5}
    #historyBody td:nth-child(11){grid-column:1/-1;display:flex;flex-direction:row;align-items:center;
      flex-wrap:wrap;gap:8px;border-top:1px solid #e6eef6;padding-top:12px;margin-top:2px}
    #historyBody td:nth-child(11)::before{flex:0 0 auto;margin-right:10px;align-self:center}
    #historyBody td:nth-child(11) .mini,#historyBody td:nth-child(11) button{margin:0;
      font-size:13px;min-height:36px;padding:7px 11px;border-radius:8px;font-weight:800}
    #historyBody td:nth-child(11) button:disabled{opacity:.47;cursor:not-allowed}
    #historyBody td:nth-child(11) [data-spv-print-v83]{color:#087352;border:1px solid #8ecfbc;background:#edf9f3}
    #historyBody td:nth-child(11) [data-motif-v120],#historyBody td:nth-child(11) [data-spv-list-actions-v127]{
      display:inline-flex!important;align-items:center;flex-wrap:wrap;gap:8px!important;margin:0!important;justify-content:flex-start!important}
    #historyBody td:nth-child(11) select{min-width:145px!important;max-width:200px!important;min-height:36px;
      font-size:13px!important;padding:7px 9px!important;border-radius:8px}
    #historyBody td[colspan]{grid-column:1/-1}
    #historyBody td[colspan]::before{content:none}
    #historyBody .empty{font-size:14px;padding:12px 8px}
    .history-search129{min-width:235px;max-width:360px}
    .history-search129 input{font-size:14px;min-height:40px}
    .history-search-count129{font-size:12px}
    @media(max-width:1130px){
      #historyBody tr{grid-template-columns:repeat(3,minmax(0,1fr))}
      .panel:has(#historyBody) .panel-head h3{font-size:17px}
    }
    @media(max-width:690px){
      .panel:has(#historyBody) .panel-head{padding:13px 12px}
      .panel:has(#historyBody) .tablewrap{padding:5px 9px 11px}
      #historyBody tr{grid-template-columns:repeat(2,minmax(0,1fr));gap:11px 12px;padding:13px 12px;margin-bottom:10px}
      #historyBody td{font-size:13px}
      #historyBody td:nth-child(8){grid-column:1/-1}
      #historyBody td:nth-child(11){gap:7px}
      #historyBody td:nth-child(11)::before{flex-basis:100%;margin-right:0}
      #historyBody td:nth-child(11) .mini,#historyBody td:nth-child(11) button{min-height:39px;font-size:12px;padding:7px 10px}
      .history-search129{min-width:100%;max-width:100%;width:100%}
    }
    @media(max-width:390px){
      #historyBody td:nth-child(11) [data-motif-v120]{width:100%}
    }
  `;
  document.head.appendChild(style);
  const labels=['Nomor Insiden','Tanggal','Jenis Kejadian','Kode Item','Series / Batch','Size','Qty','No BA','Pelapor','Status','Tindakan'];
  let pending=false;
  function labelCards(){
    pending=false;
    const body=document.getElementById('historyBody');
    if(!body)return;
    for(const tr of body.querySelectorAll('tr')){
      [...tr.children].forEach((td,i)=>{
        if(td.tagName!=='TD')return;
        const name=td.hasAttribute('colspan')?'':(labels[i]||'');
        if(name&&td.getAttribute('data-field')!==name)td.setAttribute('data-field',name);
      });
    }
  }
  function schedule(){if(pending)return;pending=true;requestAnimationFrame(labelCards)}
  const bind=()=>{
    const body=document.getElementById('historyBody');
    if(!body)return;
    schedule();
    const obs=new MutationObserver(schedule);
    obs.observe(body,{childList:true,subtree:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();
