/* SLS Breakage Input v141 — compact native freeze panes.
   Move the real controls into ONE in-flow sticky strip. No floating duplicate controls. */
(function(){
'use strict';
if(window.__SLS_COMPACT_FREEZE_141__)return;
window.__SLS_COMPACT_FREEZE_141__=true;
const CSS = `
#slsCompactFreeze141{
  position:sticky;top:var(--sls-freeze-top,64px);z-index:38;
  width:100%;box-sizing:border-box;display:flex;flex-wrap:nowrap;align-items:center;
  gap:9px;min-height:64px;padding:8px 10px;margin:12px 0 9px;
  background:#fff;border:1px solid #d0e0ef;border-radius:11px;
  box-shadow:0 5px 16px rgba(12,47,89,.08);
}
#slsCompactFreeze141 .master-scope{
  flex:0 0 auto;margin:0!important;padding:0 6px 0 0!important;
  border:0!important;background:transparent!important;gap:7px!important;
  white-space:nowrap;font-size:12px;font-weight:800;color:#264c73;
}
#slsCompactFreeze141 .master-scope select{
  min-height:40px;max-width:145px;padding:7px 8px!important;
  font-size:13px;border:1px solid #c3d5e8;border-radius:8px;
  background:#f7fbff;color:#143e69;
}
#slsCompactFreeze141 .quick{
  display:flex!important;flex:1 1 auto;min-width:0;gap:7px;margin:0!important;
}
#slsCompactFreeze141 .quick .qcard{
  display:flex;align-items:center;gap:7px;flex:1 1 0;min-width:0;
  min-height:42px;padding:6px 10px;border:1px solid #d8e5f2;
  border-radius:8px;background:#f7faff;
}
#slsCompactFreeze141 .quick .qcard:nth-child(3){
  background:#eef9f5;border-color:#cde9df;
}
#slsCompactFreeze141 .quick .qlabel{
  font-size:10px;font-weight:850;color:#647d98;white-space:nowrap;
}
#slsCompactFreeze141 .quick .qvalue{
  font-size:19px;font-weight:900;color:#183e6b;line-height:1.1;
  margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
#slsCompactFreeze141 .quick .qcard:nth-child(3) .qvalue{color:#077865}
#slsCompactFreeze141 .quick .sub{display:none}
#slsCompactFreeze141:has(#masterScope.show) .quick .qcard:first-child{display:none}
#slsCompactFreeze141 .actions{
  flex:0 1 auto;display:flex!important;align-items:center;gap:6px;
  min-width:0;margin:0!important;flex-wrap:nowrap;
}
#slsCompactFreeze141 .actions button{
  flex:0 0 auto;min-height:40px;padding:7px 9px;
  border-radius:8px;font-size:12px;line-height:1.3;
  font-weight:850;white-space:nowrap;
}
#slsCompactFreeze141 .actions button.hidden{display:none!important}
.app .panel:has(#historyBody){overflow:visible!important}
.app .panel:has(#historyBody) .panel-head{
  position:sticky!important;top:var(--sls-history-top,138px)!important;
  z-index:37!important;background:#fff!important;
  border-bottom:2px solid #d7e5f2!important;box-shadow:0 5px 13px rgba(11,45,83,.09)!important;
  display:flex!important;align-items:center!important;gap:9px!important;
  min-height:57px;padding:9px 13px!important;
}
.app .panel:has(#historyBody) .panel-head h3{
  font-size:18px!important;white-space:nowrap;font-weight:850;
}
.app .panel:has(#historyBody) .panel-head .history-search129{
  min-width:190px;max-width:360px;flex:1 1 220px;margin:0;
}
.app .panel:has(#historyBody) .panel-head .history-search129 input{
  min-height:39px;font-size:13px;
}
.app .panel:has(#historyBody) .panel-head #period{
  min-height:39px!important;max-width:190px;padding:8px 10px!important;
  font-size:13px!important;color:#183e6d;
}
.app .panel:has(#historyBody) .tablewrap{overflow-x:hidden!important}
.app .panel:has(#historyBody) #historyBody tr{
  scroll-margin-top:calc(var(--sls-history-top,138px) + 70px);
}
html{scroll-padding-top:var(--sls-scroll-pad,190px)}
@media(min-width:1300px){
  .app .wrap{max-width:1560px!important}
}
@media(max-width:1340px){
 #slsCompactFreeze141{flex-wrap:wrap;row-gap:6px}
 #slsCompactFreeze141 .master-scope{flex:0 0 auto}
 #slsCompactFreeze141 .quick{flex:1 1 300px}
 #slsCompactFreeze141 .actions{flex:1 1 100%;justify-content:flex-start}
}
@media(max-width:760px){
 #slsCompactFreeze141{padding:7px;gap:6px;min-height:0}
 #slsCompactFreeze141 .master-scope{
   flex:1 1 100%;justify-content:space-between;padding:0!important
 }
 #slsCompactFreeze141 .quick{flex:1 1 100%;gap:5px}
 #slsCompactFreeze141 .quick .qcard{padding:7px 6px;gap:4px;min-height:37px}
 #slsCompactFreeze141 .quick .qlabel{font-size:9px}
 #slsCompactFreeze141 .quick .qvalue{font-size:16px}
 #slsCompactFreeze141 .actions{flex:1 1 100%;gap:5px;flex-wrap:wrap}
 #slsCompactFreeze141 .actions button{font-size:11px;padding:7px;min-height:37px}
 .app .panel:has(#historyBody) .panel-head{gap:7px!important}
 .app .panel:has(#historyBody) .panel-head h3{font-size:16px!important}
 .app .panel:has(#historyBody) .panel-head .history-search129{order:3;flex:1 1 100%;min-width:0}
 .app .panel:has(#historyBody) .panel-head #period{max-width:180px}
}
`;
function initialize(){
 const wrap=document.querySelector('.app .wrap');
 const header=document.querySelector('.app .topbar');
 const scope=document.getElementById('masterScope');
 const quick=wrap?.querySelector('.quick');
 const actions=wrap?.querySelector('.actions');
 const panel=document.querySelector('.app .panel:has(#historyBody)');
 if(!wrap||!header||!scope||!quick||!actions||!panel)return;
 const css=document.createElement('style');css.id='slsCompactFreezeStyle141';css.textContent=CSS;
 document.head.appendChild(css);
 const strip=document.createElement('section');
 strip.id='slsCompactFreeze141';
 strip.setAttribute('aria-label','Filter, ringkasan dan tindakan tetap terlihat saat scroll');
 wrap.insertBefore(strip,scope);
 // Moving existing nodes retains all input/button listeners and any later dynamic actions.
 strip.append(scope,quick,actions);
 let last='';
 function layout(){
   const top=Math.max(0,Math.round(header.getBoundingClientRect().height));
   const stickyHeight=Math.ceil(strip.getBoundingClientRect().height);
   const historyTop=top+stickyHeight+4;
   const key=top+'|'+stickyHeight;
   if(key===last)return;
   last=key;
   document.documentElement.style.setProperty('--sls-freeze-top',top+'px');
   document.documentElement.style.setProperty('--sls-history-top',historyTop+'px');
   document.documentElement.style.setProperty('--sls-scroll-pad',(historyTop+78)+'px');
 }
 if('ResizeObserver' in window){
   const observer=new ResizeObserver(layout);
   observer.observe(header);
   observer.observe(strip);
 }
 window.addEventListener('resize',layout,{passive:true});
 layout();
 for(const t of [180,650,1500,2800])setTimeout(layout,t);
 const badge=document.getElementById('buildBadge');
 if(badge){
   let fixing=false;
   const version=()=>{
     if(fixing||badge.textContent==='v141')return;
     fixing=true;badge.textContent='v141';fixing=false;
   };
   new MutationObserver(version).observe(badge,{childList:true,characterData:true,subtree:true});
   version();
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
else initialize();
})();