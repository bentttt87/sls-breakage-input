// SLS Breakage Input v129 — material code search on main incident history.
(function(){
  'use strict';
  if(window.__SLS_HISTORY_MATERIAL_SEARCH_V129__) return;
  window.__SLS_HISTORY_MATERIAL_SEARCH_V129__=true;

  const $m=id=>document.getElementById(id);
  const norm=v=>String(v??'').trim().toUpperCase();

  function ensureStyle(){
    if($m('historyMaterialSearchStyle129'))return;
    const s=document.createElement('style');
    s.id='historyMaterialSearchStyle129';
    s.textContent=`
      .history-search129{display:flex;align-items:center;gap:6px;min-width:260px;max-width:390px}
      .history-search129 .searchbox129{position:relative;flex:1}
      .history-search129 input{width:100%;height:36px;box-sizing:border-box;border:1px solid #b9cadd;border-radius:9px;padding:0 34px 0 34px;background:#fff;font:inherit;font-size:12px;color:#153454;outline:none}
      .history-search129 input:focus{border-color:#1672c4;box-shadow:0 0 0 2px rgba(22,114,196,.12)}
      .history-search129 .icon129{position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:14px;pointer-events:none}
      .history-search129 .clear129{position:absolute;right:5px;top:50%;transform:translateY(-50%);width:25px;height:25px;border:0;border-radius:6px;background:transparent;color:#6f8297;font-size:16px;cursor:pointer;display:none}
      .history-search129 .clear129:hover{background:#edf3f9}
      .history-search-count129{font-size:10px;color:#61758d;white-space:nowrap}
      @media(max-width:720px){
        .panel-head:has(#historyMaterialSearch129){flex-wrap:wrap;gap:8px}
        .history-search129{order:3;min-width:100%;max-width:none;width:100%}
        .history-search-count129{display:none}
      }
    `;
    document.head.appendChild(s);
  }

  function visibleRows(){
    const body=$m('historyBody');
    return body?[...body.querySelectorAll('tr')]:[];
  }

  function applySearch(){
    const input=$m('historyMaterialSearch129');
    const count=$m('historyMaterialSearchCount129');
    if(!input)return;

    const q=norm(input.value);
    const rows=visibleRows();
    const data=Array.isArray(INCIDENTS)?INCIDENTS:[];
    let shown=0;

    rows.forEach((tr,i)=>{
      const r=data[i];
      if(!r){tr.style.display='';return}
      const hay=[r.item_code,r.ceramic_series].map(norm).join(' ');
      const ok=!q||hay.includes(q);
      tr.style.display=ok?'':'none';
      if(ok)shown++;
    });

    const clear=$m('historyMaterialSearchClear129');
    if(clear)clear.style.display=q?'block':'none';
    if(count)count.textContent=q?(shown+' / '+data.length+' data'):('Total '+data.length+' data');
  }

  function clearSearch(){
    const input=$m('historyMaterialSearch129');
    if(!input)return;
    input.value='';
    applySearch();
    input.focus();
  }

  function ensureUi(){
    ensureStyle();
    const panelHead=document.querySelector('.panel .panel-head');
    if(!panelHead||$m('historyMaterialSearchWrap129'))return;

    const wrap=document.createElement('div');
    wrap.id='historyMaterialSearchWrap129';
    wrap.className='history-search129';
    wrap.innerHTML=`
      <div class="searchbox129">
        <span class="icon129">⌕</span>
        <input id="historyMaterialSearch129" type="search" autocomplete="off" inputmode="search"
          placeholder="Cari No / Kode Material…" aria-label="Cari nomor atau kode material">
        <button id="historyMaterialSearchClear129" class="clear129" type="button" aria-label="Hapus pencarian">×</button>
      </div>
      <span id="historyMaterialSearchCount129" class="history-search-count129"></span>
    `;

    const grow=panelHead.querySelector('.grow');
    if(grow)panelHead.insertBefore(wrap,grow);
    else panelHead.appendChild(wrap);

    $m('historyMaterialSearch129').addEventListener('input',applySearch);
    $m('historyMaterialSearchClear129').addEventListener('click',clearSearch);
    applySearch();
  }

  try{
    const base=window.renderHistory||renderHistory;
    const wrapped=function(){
      const result=base.apply(this,arguments);
      setTimeout(()=>{ensureUi();applySearch();},0);
      return result;
    };
    window.renderHistory=wrapped;
    renderHistory=wrapped;
  }catch(_){}

  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&String(e.key||'').toLowerCase()==='f'&&$m('historyMaterialSearch129')){
      e.preventDefault();
      $m('historyMaterialSearch129').focus();
      $m('historyMaterialSearch129').select();
    }
  });

  [80,250,700,1500].forEach(ms=>setTimeout(()=>{
    ensureUi();applySearch();
    const b=$m('buildBadge');if(b)b.textContent='v129';
  },ms));

  window.applyHistoryMaterialSearchV129=applySearch;
})();