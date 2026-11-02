
/* SLS Breakage Input v139 - compact frozen controls while reviewing incidents.
   Mirrors the existing selectors; does not query or mutate database records. */
(function(){
  'use strict';
  if(window.__SLS_FREEZE_PANEL_V139__)return;
  window.__SLS_FREEZE_PANEL_V139__=true;
  function start(){
    const app=document.getElementById('app');
    const header=document.querySelector('.app .topbar');
    const quick=document.querySelector('.app .quick');
    const panel=document.querySelector('.app .panel:has(#historyBody)');
    if(!app||!header||!quick||!panel)return;
    const css=document.createElement('link');
    css.rel='stylesheet';
    css.href='/freeze_panel_v139.css?v=20261102-v139';
    document.head.appendChild(css);
    const bar=document.createElement('aside');
    bar.className='sls-freeze-bar';
    bar.id='slsFreezeBar139';
    bar.dataset.visible='false';
    bar.setAttribute('aria-label','Panel kontrol riwayat tetap terlihat');
    bar.innerHTML=[
      '<div class="sls-freeze-inner">',
      '<div class="sls-freeze-brand"><span class="sls-freeze-brand-dot"></span>Riwayat Insiden</div>',
      '<div class="sls-freeze-group" id="slsFreezeRdcGroup"><span class="sls-freeze-label">RDC</span><span id="slsFreezeRdcValue" class="sls-freeze-non-master">—</span></div>',
      '<div class="sls-freeze-group"><label class="sls-freeze-label" for="slsFreezePeriod">Bulan</label><select class="sls-freeze-select" id="slsFreezePeriod" aria-label="Pilih bulan riwayat"></select></div>',
      '<div class="sls-freeze-unit" data-kind="incidents">Insiden <strong id="slsFreezeCount">—</strong></div>',
      '<div class="sls-freeze-unit" data-kind="qty">Pecah <strong id="slsFreezeQty">—</strong> BOX</div>',
      '<div class="sls-freeze-find"><input id="slsFreezeSearch" type="search" aria-label="Cari nomor BA atau kode item" placeholder="Cari insiden / item / BA…"></div>',
      '<button class="sls-freeze-btn" id="slsFreezeRefresh" type="button">↻ Perbarui</button>',
      '<button class="sls-freeze-btn primary" id="slsFreezeNew" type="button" hidden>+ Input Baru</button>',
      '</div>'
    ].join('');
    app.appendChild(bar);
    const get=id=>document.getElementById(id);
    const period=get('slsFreezePeriod'), search=get('slsFreezeSearch');
    const rdcGroup=get('slsFreezeRdcGroup'), rdcValue=get('slsFreezeRdcValue');
    let rdcSelect=null;
    let listeningSearch=null;
    let frame=false;
    function mirrorOptions(source,target){
      if(!source||!target)return;
      const signature=Array.from(source.options).map(o=>o.value+'|'+o.textContent).join('~~');
      if(target.dataset.optionSignature!==signature){
        target.replaceChildren(...Array.from(source.options).map(o=>new Option(o.textContent,o.value)));
        target.dataset.optionSignature=signature;
      }
      if(target.value!==source.value)target.value=source.value;
    }
    function bindSourceSearch(){
      const source=get('historyMaterialSearch129');
      if(!source)return;
      if(listeningSearch!==source){
        source.addEventListener('input',function(){
          if(search.value!==source.value)search.value=source.value;
        });
        listeningSearch=source;
      }
      if(document.activeElement!==search&&search.value!==source.value)search.value=source.value;
    }
    function sync(){
      const nativeRdc=get('scope'),nativePeriod=get('period');
      const canSelect=!!nativeRdc&&!!get('masterScope')?.classList.contains('show');
      if(canSelect){
        if(!rdcSelect){
          rdcSelect=document.createElement('select');
          rdcSelect.id='slsFreezeRdc';
          rdcSelect.className='sls-freeze-select';
          rdcSelect.setAttribute('aria-label','Pilih RDC riwayat');
          rdcSelect.addEventListener('change',function(){
            if(!nativeRdc)return;
            nativeRdc.value=rdcSelect.value;
            nativeRdc.dispatchEvent(new Event('change',{bubbles:true}));
            sync();
          });
          rdcValue.replaceWith(rdcSelect);
        }
        mirrorOptions(nativeRdc,rdcSelect);
      }else{
        const display=get('rdcCard')?.textContent||'—';
        if(rdcSelect){
          rdcSelect.replaceWith(rdcValue);
          rdcSelect=null;
        }
        rdcValue.textContent=display;
      }
      mirrorOptions(nativePeriod,period);
      get('slsFreezeCount').textContent=get('countCard')?.textContent||'—';
      get('slsFreezeQty').textContent=get('qtyCard')?.textContent||'—';
      const newBtn=get('newBtn'),quickBtn=get('slsFreezeNew');
      quickBtn.hidden=!newBtn||newBtn.classList.contains('hidden');
      bindSourceSearch();
    }
    period.addEventListener('change',function(){
      const native=get('period');
      if(!native)return;
      native.value=period.value;
      native.dispatchEvent(new Event('change',{bubbles:true}));
      sync();
    });
    search.addEventListener('input',function(){
      const source=get('historyMaterialSearch129');
      if(source&&source.value!==search.value){
        source.value=search.value;
        source.dispatchEvent(new Event('input',{bubbles:true}));
      }
    });
    get('slsFreezeRefresh').addEventListener('click',function(){get('refreshBtn')?.click();});
    get('slsFreezeNew').addEventListener('click',function(){get('newBtn')?.click();});
    function position(){
      frame=false;
      const isLoggedIn=get('app')?.style.display==='block';
      const top=Math.max(0,Math.round(header.getBoundingClientRect().bottom));
      bar.style.top=top+'px';
      const visible=isLoggedIn && quick.getBoundingClientRect().bottom<top+16 && panel.getBoundingClientRect().bottom>top+25;
      const next=visible?'true':'false';
      if(bar.dataset.visible!==next){
        bar.dataset.visible=next;
        if(visible)sync();
      }
    }
    function schedule(){
      if(frame)return;
      frame=true;
      window.requestAnimationFrame(position);
    }
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule);
    get('scope')?.addEventListener('change',function(){sync();schedule()});
    get('period')?.addEventListener('change',function(){sync();schedule()});
    const observers=new MutationObserver(function(){sync();schedule()});
    for(const id of ['rdcCard','countCard','qtyCard','periodLabel','masterScope','period']){
      const node=get(id);
      if(node)observers.observe(node,{childList:true,subtree:true,attributes:id==='masterScope'});
    }
    const head=panel.querySelector('.panel-head');
    if(head)new MutationObserver(bindSourceSearch).observe(head,{childList:true,subtree:false});
    sync();
    position();
    // Access roles and the search box can initialize shortly after login.
    for(const delay of [200,700,1500,3000]){
      window.setTimeout(function(){sync();schedule();},delay);
    }
    const badge=get('buildBadge');
    if(badge)badge.textContent='v139';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
