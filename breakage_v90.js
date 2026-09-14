// SLS Breakage Input v90 — stable form rules + Excel/Foto export for Admin/Operator Warehouse/SPV.
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const up=v=>String(v??'').trim().toUpperCase();
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const xesc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[m]));
  const typeNow=()=>{try{return String(TYPE||'').toLowerCase()}catch(_){return 'delivery'}};
  const currentRdc=()=>{try{return (typeof effectiveScope==='function'?effectiveScope():ACCESS?.rdc_name)||''}catch(_){return ''}};
  const canExport=()=>{try{return !!ACCESS?.can_input || !!ACCESS?.can_submit_approve}catch(_){return false}};

  // -------------------- Stable form rules --------------------
  function ensureSeries(){
    let el=$('fSeries');
    if(!el){
      const item=$('fItem'), field=item?.closest('.field');
      if(field){
        field.insertAdjacentHTML('afterend','<div class="field" id="seriesField90"><label>Jenis Series Keramik *</label><input id="fSeries" placeholder="Contoh: S49P"></div>');
        el=$('fSeries');
      }
    }
    if(el){
      try{const d=JSON.parse(localStorage.getItem(draftKey())||'{}');if(!el.value&&d.series)el.value=up(d.series)}catch(_){ }
      el.oninput=()=>{el.value=up(el.value);try{saveDraft()}catch(_){ }};
    }
  }
  function ensureFactoryDelivery(){
    if(typeNow()!=='delivery')return;
    let el=$('fFactory');
    if(!el){
      const sj=$('fSj')?.closest('.field');
      if(sj){sj.insertAdjacentHTML('afterend','<div class="field" id="factoryField90"><label>Pabrik Asal *</label><select id="fFactory"><option value="">Pilih Pabrik Asal</option><option value="SRKI">SRKI</option><option value="RCI">RCI</option></select></div>');el=$('fFactory');}
    }
    if(el&&el.tagName!=='SELECT'){
      const old=up(el.value), s=document.createElement('select');s.id='fFactory';s.innerHTML='<option value="">Pilih Pabrik Asal</option><option value="SRKI">SRKI</option><option value="RCI">RCI</option>';s.value=old;el.replaceWith(s);el=s;
    }
    if(el){
      if(![...el.options].some(o=>o.value==='SRKI'))el.innerHTML='<option value="">Pilih Pabrik Asal</option><option value="SRKI">SRKI</option><option value="RCI">RCI</option>';
      try{const d=JSON.parse(localStorage.getItem(draftKey())||'{}');if(!el.value&&['SRKI','RCI'].includes(up(d.factory)))el.value=up(d.factory)}catch(_){ }
      el.onchange=()=>{try{saveDraft()}catch(_){ }};
    }
  }
  function removeWarehouseFactory(){
    if(typeNow()!=='warehouse')return;
    const f=$('fFactory')?.closest('.field');if(f)f.remove();
    document.querySelectorAll('#factoryField87,#factoryField90').forEach(x=>x.remove());
  }
  function normalizeForm(){
    ensureSeries();
    if(typeNow()==='delivery')ensureFactoryDelivery(); else removeWarehouseFactory();
    try{bindDraftInputs()}catch(_){ }
    const badge=$('buildBadge');if(badge)badge.textContent='v90';
  }

  // Replace the stacked validator with one canonical rule-set.
  window.validateIncident=function(){
    normalizeForm();
    let d={};try{d=formData()||{}}catch(_){ }
    const m=[]; const t=typeNow();
    let n=0;try{n=(EXISTING_PHOTO_PATHS?.length||0)+(PHOTOS?.length||0)}catch(_){ }
    if(!['delivery','warehouse'].includes(t))m.push('Jenis Kejadian');
    if(!d.date&&!$('fDate')?.value)m.push('Tanggal');
    if(!up(d.item||$('fItem')?.value))m.push('Kode Item');
    if(!up($('fSeries')?.value))m.push('Jenis Series Keramik');
    if(!(Number(d.qty||$('fQty')?.value)>0))m.push('Jumlah');
    if(n<1)m.push('Foto minimal 1');if(n>5)m.push('Foto maksimal 5');
    if(t==='delivery'){
      const factory=up($('fFactory')?.value||'');
      const driver=$('fDriver'), plate=up(driver?.selectedOptions?.[0]?.dataset?.plate||d.police||'');
      if(!up(d.sj||$('fSj')?.value))m.push('No SJ');
      if(!['SRKI','RCI'].includes(factory))m.push('Pabrik Asal');
      if(!up(d.customer||$('fCustomer')?.value))m.push('Customer');
      if(!up(d.transporter||$('fTransporter')?.value))m.push('Vendor Transport');
      if(!up(d.driver||driver?.value)||!plate)m.push('Driver / No Polisi');
      if(!$('fReceiver')?.value?.trim())m.push('Nama Penerima BA');
      if(!$('fWitness')?.value?.trim())m.push('Saksi Pemeriksa');
      let c='';try{c=String(CAUSE||'')}catch(_){ }
      if(!['Perjalanan','Susunan','Packaging / Pallet','Lainnya'].includes(c))m.push('Penyebab');
      if(c==='Lainnya'&&!String($('fCauseDetail')?.value||'').trim())m.push('Keterangan penyebab');
    }else{
      const wh=$('fWhEvent')?.value||d.wh||'';
      if(!['Pecah Dalam Pallet','Misshandling'].includes(wh))m.push('Kejadian Gudang');
      if(wh==='Misshandling'&&!up($('fRelated')?.value||d.related))m.push('Nama terkait');
      // Pabrik Asal intentionally NOT required for Pecah Gudang; backend stores factory=null.
    }
    return [...new Set(m)];
  };

  try{
    const baseForm=window.formData;
    if(typeof baseForm==='function')window.formData=function(){
      const r=baseForm.apply(this,arguments)||{};
      r.series=up($('fSeries')?.value||'');
      if(typeNow()==='delivery')r.factory=up($('fFactory')?.value||''); else r.factory='';
      const d=$('fDriver'),opt=d?.selectedOptions?.[0];
      if(typeNow()==='delivery'&&d){r.driver=up(d.value);r.police=up(opt?.dataset?.plate||r.police||'');}
      return r;
    };
  }catch(_){ }

  try{const baseRender=window.renderConditional;if(typeof baseRender==='function')window.renderConditional=function(){const r=baseRender.apply(this,arguments);setTimeout(normalizeForm,0);setTimeout(normalizeForm,120);return r;};}catch(_){ }
  try{const baseOpen=window.openInput;if(typeof baseOpen==='function')window.openInput=async function(){const r=await baseOpen.apply(this,arguments);setTimeout(normalizeForm,0);setTimeout(normalizeForm,200);return r;};}catch(_){ }
  try{const baseEdit=window.editIncident;if(typeof baseEdit==='function')window.editIncident=async function(){const r=await baseEdit.apply(this,arguments);setTimeout(normalizeForm,0);setTimeout(normalizeForm,220);return r;};}catch(_){ }
  const modal=$('incidentModal');if(modal)new MutationObserver(()=>setTimeout(normalizeForm,0)).observe(modal,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target?.dataset?.type)setTimeout(normalizeForm,0)},true);

  // -------------------- XLSX + photo ZIP export --------------------
  const enc=new TextEncoder();
  function concat(parts){let len=0;parts.forEach(p=>len+=p.length);const out=new Uint8Array(len);let o=0;parts.forEach(p=>{out.set(p,o);o+=p.length});return out}
  const CRC_TABLE=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);t[n]=c>>>0}return t})();
  function crc32(bytes){let c=0xffffffff;for(let i=0;i<bytes.length;i++)c=CRC_TABLE[(c^bytes[i])&255]^(c>>>8);return (c^0xffffffff)>>>0}
  function le16(n){return new Uint8Array([n&255,(n>>>8)&255])}
  function le32(n){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255])}
  function dosNow(){const d=new Date(),y=Math.max(1980,d.getFullYear());return {time:(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),date:((y-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate()}}
  function zipBytes(files){
    const locals=[],centrals=[];let offset=0;const dt=dosNow();
    files.forEach(f=>{const name=enc.encode(f.name.replace(/\\/g,'/')),data=f.data instanceof Uint8Array?f.data:enc.encode(String(f.data||'')),crc=crc32(data);
      const local=concat([le32(0x04034b50),le16(20),le16(0),le16(0),le16(dt.time),le16(dt.date),le32(crc),le32(data.length),le32(data.length),le16(name.length),le16(0),name,data]);locals.push(local);
      const central=concat([le32(0x02014b50),le16(20),le16(20),le16(0),le16(0),le16(dt.time),le16(dt.date),le32(crc),le32(data.length),le32(data.length),le16(name.length),le16(0),le16(0),le16(0),le16(0),le32(0),le32(offset),name]);centrals.push(central);offset+=local.length;
    });
    const cdir=concat(centrals),body=concat(locals);const end=concat([le32(0x06054b50),le16(0),le16(0),le16(files.length),le16(files.length),le32(cdir.length),le32(body.length),le16(0)]);return concat([body,cdir,end]);
  }
  function colName(n){let s='';while(n>0){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)}return s}
  function cell(v,r,c,style=0){const ref=colName(c)+r;if(typeof v==='number'&&isFinite(v))return `<c r="${ref}"${style?` s="${style}"`:''}><v>${v}</v></c>`;return `<c r="${ref}" t="inlineStr"${style?` s="${style}"`:''}><is><t xml:space="preserve">${xesc(v==null?'':v)}</t></is></c>`}
  function makeXlsx(rows,headers){
    let sheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>';
    sheet+='<row r="1">'+headers.map((h,i)=>cell(h,1,i+1,1)).join('')+'</row>';
    rows.forEach((row,ri)=>{sheet+=`<row r="${ri+2}">`+headers.map((h,ci)=>cell(row[h],ri+2,ci+1,0)).join('')+'</row>'});sheet+='</sheetData><autoFilter ref="A1:'+colName(headers.length)+(rows.length+1)+'"/></worksheet>';
    const files=[
      {name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'},
      {name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
      {name:'xl/workbook.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Rekap Breakage" sheetId="1" r:id="rId1"/></sheets></workbook>'},
      {name:'xl/_rels/workbook.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
      {name:'xl/styles.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9EAF7"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'},
      {name:'xl/worksheets/sheet1.xml',data:sheet}
    ];return zipBytes(files);
  }
  function safe(s){return String(s||'').replace(/[\\/:*?"<>|]+/g,'_').replace(/\s+/g,'_').slice(0,80)||'NA'}
  async function fetchPhoto(path){
    try{if(typeof refreshSession==='function')await refreshSession().catch(()=>false)}catch(_){ }
    const url=`${SUPABASE_URL}/storage/v1/object/authenticated/breakage-evidence/${String(path).split('/').map(encodeURIComponent).join('/')}`;
    const r=await fetch(url,{headers:{apikey:PUBLIC_ANON,Authorization:`Bearer ${auth()}`},cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);return new Uint8Array(await r.arrayBuffer());
  }
  function headers(){return ['Incident No','Tanggal','Jenis','RDC','Item','Series','Qty BOX','No BA','No SJ','Pabrik Asal','Customer','Vendor Transport','Driver','No Polisi','Penyebab','Detail Penyebab','Kejadian Gudang','Nama Terkait','Pelapor','Status','Foto 1','Foto 2','Foto 3','Foto 4','Foto 5','Catatan SPV']}
  function typeLabel90(t){return String(t).toLowerCase()==='delivery'?'Kiriman':String(t).toLowerCase()==='warehouse'?'Gudang':String(t||'')}
  function ensureExportUi(){
    if(!canExport())return;
    const actions=document.querySelector('.actions');if(actions&&!$('exportBreakageBtn')){
      const anchor=$('baPickerBtn')||$('logisticsBtn')||$('refreshBtn');
      const html='<button class="secondary" id="exportBreakageBtn">⬇ Excel + Foto</button>';
      if(anchor)anchor.insertAdjacentHTML('afterend',html);else actions.insertAdjacentHTML('beforeend',html);
    }
    if(!$('exportBreakageModal'))document.body.insertAdjacentHTML('beforeend',`<div id="exportBreakageModal" class="overlay"><div class="modal" style="width:min(680px,100%)"><div class="modal-head"><div><h2>Download Rekap Breakage</h2><div class="small" style="opacity:.85">Excel + seluruh lampiran foto dalam satu ZIP</div></div><div class="grow"></div><button class="close" id="exportClose90">✕</button></div><div class="modal-body"><div class="hint"><b>Scope:</b> <span id="exportScope90"></span><br>Admin/Operator Warehouse dan SPV hanya dapat mengekspor data RDC sendiri.</div><div class="form-grid" style="margin-top:10px"><div class="field"><label>Periode</label><input id="exportPeriod90" type="month"></div><div class="field"><label>Jenis</label><select id="exportType90"><option value="ALL">Semua</option><option value="delivery">Kiriman</option><option value="warehouse">Gudang</option></select></div></div><div id="exportProgress90" class="hint" style="margin-top:10px">Siap mengekspor.</div></div><div class="modal-foot"><button class="secondary" id="exportCloseBtn90">Batal</button><button class="primary" id="exportRun90">⬇ Download ZIP</button></div></div></div>`);
    if($('exportBreakageBtn'))$('exportBreakageBtn').onclick=()=>{ensureExportUi();$('exportPeriod90').value=PERIOD||new Date().toISOString().slice(0,7);$('exportScope90').textContent=currentRdc()||'RDC';$('exportProgress90').textContent='Siap mengekspor.';$('exportBreakageModal').classList.add('show')};
    const close=()=>$('exportBreakageModal')?.classList.remove('show');if($('exportClose90'))$('exportClose90').onclick=close;if($('exportCloseBtn90'))$('exportCloseBtn90').onclick=close;if($('exportRun90'))$('exportRun90').onclick=runExport;
  }
  async function runExport(){
    const btn=$('exportRun90'),prog=$('exportProgress90'),period=$('exportPeriod90').value||PERIOD,type=$('exportType90').value||'ALL',rdc=currentRdc();
    if(!period||!rdc){prog.textContent='Periode atau RDC belum tersedia.';return}btn.disabled=true;
    try{
      prog.textContent='Memuat data incident…';let rows=await rpc('breakage_incident_list',{p_period:period,p_rdc:rdc})||[];if(type!=='ALL')rows=rows.filter(x=>String(x.incident_type).toLowerCase()===type);
      if(!rows.length){prog.textContent='Tidak ada incident pada filter tersebut.';return}
      const photoFiles=[],excelRows=[],fails=[];let totalPhotos=rows.reduce((n,r)=>n+(Array.isArray(r.photo_paths)?r.photo_paths.length:0),0),done=0;
      for(const r of rows){
        const paths=Array.isArray(r.photo_paths)?r.photo_paths:[],names=[];
        for(let i=0;i<paths.length;i++){
          const ext=(String(paths[i]).match(/\.(jpe?g|png|webp)$/i)?.[1]||'jpg').toLowerCase().replace('jpeg','jpg');const name=`Foto/${safe(r.incident_no)}/${String(i+1).padStart(2,'0')}.${ext}`;names.push(name);done++;prog.textContent=`Mengunduh foto ${done} dari ${totalPhotos}…`;
          try{photoFiles.push({name,data:await fetchPhoto(paths[i])})}catch(e){fails.push(`${r.incident_no} | ${paths[i]} | ${e.message||e}`)}
        }
        excelRows.push({'Incident No':r.incident_no||'','Tanggal':r.occurrence_date||'','Jenis':typeLabel90(r.incident_type),'RDC':r.rdc||'','Item':r.item_code||'','Series':r.ceramic_series||'','Qty BOX':Number(r.qty_box||0),'No BA':r.no_ba||'','No SJ':r.no_sj||'','Pabrik Asal':r.factory||'','Customer':r.customer||'','Vendor Transport':r.transporter||'','Driver':r.driver_name||'','No Polisi':r.vehicle_no||'','Penyebab':r.cause||'','Detail Penyebab':r.cause_detail||'','Kejadian Gudang':r.warehouse_event||'','Nama Terkait':r.related_person||'','Pelapor':r.reported_by||'','Status':r.status||'','Foto 1':names[0]||'','Foto 2':names[1]||'','Foto 3':names[2]||'','Foto 4':names[3]||'','Foto 5':names[4]||'','Catatan SPV':r.spv_note||''});
      }
      prog.textContent='Membuat file Excel…';const xlsx=makeXlsx(excelRows,headers()),base=`Rekap_Breakage_${safe(rdc)}_${period}`;const bundle=[{name:base+'.xlsx',data:xlsx},...photoFiles];
      if(fails.length)bundle.push({name:'Foto_Gagal_Diunduh.txt',data:'Beberapa foto tidak dapat diunduh:\r\n'+fails.join('\r\n')});
      bundle.push({name:'README.txt',data:`SLS Breakage Export\r\nRDC: ${rdc}\r\nPeriode: ${period}\r\nJumlah incident: ${rows.length}\r\nJumlah foto: ${photoFiles.length}\r\nDibuat: ${new Date().toLocaleString('id-ID')}\r\n`});
      prog.textContent='Membuat ZIP…';const zip=zipBytes(bundle),blob=new Blob([zip],{type:'application/zip'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=base+'_Excel_dan_Foto.zip';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);prog.textContent=`Selesai: ${rows.length} incident, ${photoFiles.length} foto${fails.length?`, ${fails.length} foto gagal (lihat file log)`:''}.`;
    }catch(e){prog.textContent='Export gagal: '+(typeof cleanErr==='function'?cleanErr(e.message):String(e.message||e));}
    finally{btn.disabled=false}
  }

  [50,180,500,1200].forEach(ms=>setTimeout(()=>{normalizeForm();ensureExportUi();const b=$('buildBadge');if(b)b.textContent='v90'},ms));
})();
