/* SLS Breakage Input v140 — native Excel-style freeze for History.
   No duplicate floating panel. The real history header sticks below the blue header. */
(function(){
'use strict';
if(window.__SLS_NATIVE_FREEZE_140__)return;
window.__SLS_NATIVE_FREEZE_140__=true;
const styles=String.raw`
#slsFreezeBar139,.sls-freeze-bar{display:none!important}
.app .panel:has(#historyBody){overflow:clip!important}
.app .panel:has(#historyBody) .tablewrap{overflow:visible!important}
.app .panel:has(#historyBody) .panel-head{
position:sticky!important;top:var(--sls-sticky-top,76px)!important;z-index:35!important;
display:flex!important;flex-wrap:wrap!important;align-items:center!important;
gap:9px!important;min-height:64px;padding:11px 14px!important;
background:#fff!important;opacity:1!important;
border-bottom:2px solid #cbdcec!important;box-shadow:0 6px 15px rgba(13,50,92,.11)!important}
.app .panel:has(#historyBody) .panel-head h3{
order:1;font-size:18px!important;line-height:1.3;font-weight:850;white-space:nowrap;margin:0}
.app .panel:has(#historyBody) .panel-head .grow{display:none!important}
#slsNativeRdc140{order:2;display:flex;align-items:center;gap:6px;min-width:0;white-space:nowrap}
#slsNativeRdc140 label{font-size:12px;color:#5d7490;font-weight:750}
#slsNativeRdc140 select,#slsNativeRdc140 span{
max-width:160px;min-height:40px;border:1px solid #c4d6e8;background:#f6fafe;
border-radius:8px;padding:9px 10px;color:#174676;font-size:13px;font-weight:800}
#slsNativeRdc140 select{cursor:pointer}
.app .panel:has(#historyBody) .panel-head #period{
order:3;flex:0 0 auto;max-width:185px;min-height:40px!important;
background:#f6fafe!important;color:#163c68;border:1px solid #bfd2e8!important;
font-size:13px!important;font-weight:800;margin:0!important}
#slsNativeStats140{order:4;display:flex;gap:6px;align-items:center}
#slsNativeStats140 span{
display:inline-flex;align-items:center;gap:4px;min-height:40px;padding:0 10px;
border:1px solid #dfebf4;border-radius:8px;background:#f3f8fd;
font-size:12px;color:#57728b;box-sizing:border-box;white-space:nowrap}
#slsNativeStats140 b{font-size:16px;color:#184c80}
#slsNativeStats140 .qty{border-color:#c7e4da;background:#ecf9f4}
#slsNativeStats140 .qty b{color:#087c67}
.app .panel:has(#historyBody) .panel-head .history-search129{
order:5;flex:1 1 200px;min-width:125px!important;max-width:none!important;margin:0!important}
.app .panel:has(#historyBody) .panel-head .history-search129 input{min-height:40px;font-size:13px}
.app .panel:has(#historyBody) .panel-head .history-search-count129{font-size:11px}
#slsNativeRefresh140{order:6;border:1px solid #a9c5e5;background:#fff;
border-radius:8px;min-height:40px;padding:8px 11px;white-space:nowrap;
font-size:13px;font-weight:800;color:#095395;cursor:pointer}
#slsNativeRefresh140:hover{background:#edf6ff}
.app .panel:has(#historyBody) #historyBody tr{
scroll-margin-top:calc(var(--sls-sticky-top,76px) + 110px)}
@media(max-width:1250px){
.app .panel:has(#historyBody) .panel-head h3{font-size:16px!important}
#slsNativeStats140 .qty{display:none}
}
@media(max-width:800px){
.app .panel:has(#historyBody) .panel-head{padding:9px!important;gap:7px!important}
.app .panel:has(#historyBody) .panel-head h3{flex:1 1 auto}
#slsNativeRdc140{order:3;flex:1 1 110px}
#slsNativeRdc140 label{display:none}
#slsNativeRdc140 select{max-width:none;width:100%;min-width:0}
.app .panel:has(#historyBody) .panel-head #period{
order:4;flex:1 1 125px;max-width:none;min-width:0}
#slsNativeRefresh140{order:2;padding:7px 10px}
#slsNativeStats140{order:5}
.app .panel:has(#historyBody) .panel-head .history-search129{
order:6;flex:1 1 100%;min-width:0!important}
}
@media(max-width:480px){#slsNativeStats140{display:none}
.app .panel:has(#historyBody) .panel-head h3{font-size:15px!important}
#slsNativeRdc140{flex-basis:100px}}
`;
function init(){
const app=document.getElementById('app');
const top=document.querySelector('.app .topbar');
const panel=document.querySelector('.app .panel:has(#historyBody)');
const head=panel?.querySelector('.panel-head');
const period=document.getElementById('period');
if(!app||!top||!head||!period)return;
const s=document.createElement('style');s.id='slsNativeFreezeStyle140';s.textContent=styles;
document.head.appendChild(s);
const rdc=document.createElement('div');rdc.id='slsNativeRdc140';
rdc.innerHTML='<label for="slsNativeRdcSelect140">RDC</label><span id="slsNativeRdcLabel140">—</span>';
head.appendChild(rdc);
const stats=document.createElement('div');stats.id='slsNativeStats140';
stats.innerHTML='<span>Insiden <b id="slsNativeCount140">—</b></span><span class="qty">Pecah <b id="slsNativeQty140">—</b> BOX</span>';
head.appendChild(stats);
const refresh=document.createElement('button');
refresh.id='slsNativeRefresh140';refresh.type='button';refresh.textContent='↻ Perbarui';
refresh.addEventListener('click',()=>document.getElementById('refreshBtn')?.click());
head.appendChild(refresh);
let select=null;const label=document.getElementById('slsNativeRdcLabel140');
function updateRdc(){
 const original=document.getElementById('scope');
 const isMaster=!!original&&document.getElementById('masterScope')?.classList.contains('show');
 if(isMaster){
  if(!select){
   select=document.createElement('select');select.id='slsNativeRdcSelect140';
   select.setAttribute('aria-label','Pilih RDC');
   select.addEventListener('change',()=>{
    const src=document.getElementById('scope');if(!src)return;
    src.value=select.value;src.dispatchEvent(new Event('change',{bubbles:true}));
   });
   label.replaceWith(select);
  }
  const signature=Array.from(original.options).map(x=>x.value+'~'+x.text).join('|');
  if(select.dataset.signature!==signature){
   select.replaceChildren(...Array.from(original.options).map(o=>new Option(o.text,o.value)));
   select.dataset.signature=signature;
  }
  if(select.value!==original.value)select.value=original.value;
 }else{
  if(select){select.replaceWith(label);select=null}
  label.textContent=document.getElementById('rdcCard')?.textContent||'—';
 }
}
function updateStats(){
 const srcCount=document.getElementById('countCard'),srcQty=document.getElementById('qtyCard');
 const count=document.getElementById('slsNativeCount140'),qty=document.getElementById('slsNativeQty140');
 if(count)count.textContent=srcCount?.textContent||'—';
 if(qty)qty.textContent=srcQty?.textContent||'—';
}
function updateTop(){
 const bottom=Math.round(top.getBoundingClientRect().bottom);
 document.documentElement.style.setProperty('--sls-sticky-top',Math.max(0,bottom)+'px');
}
top.addEventListener('transitionend',updateTop);
window.addEventListener('resize',updateTop);
if(typeof ResizeObserver!=='undefined'){new ResizeObserver(updateTop).observe(top)}
document.getElementById('scope')?.addEventListener('change',updateRdc);
for(const id of ['countCard','qtyCard','rdcCard']){
 const el=document.getElementById(id);
 if(el)new MutationObserver(()=>{updateStats();updateRdc()}).observe(el,{childList:true,subtree:true,characterData:true});
}
const scopeBox=document.getElementById('masterScope');
if(scopeBox)new MutationObserver(updateRdc).observe(scopeBox,{attributes:true,attributeFilter:['class']});
updateTop();updateRdc();updateStats();
for(const t of [200,700,1500])setTimeout(()=>{updateTop();updateRdc();updateStats()},t);
const badge=document.getElementById('buildBadge');if(badge){
 const setBadge=()=>{if(badge.textContent!=='v140')badge.textContent='v140'};
 new MutationObserver(setBadge).observe(badge,{childList:true,subtree:true,characterData:true});
 setBadge();
}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();