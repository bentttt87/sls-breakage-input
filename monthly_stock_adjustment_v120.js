// SLS Breakage Input v120 — monthly Stock Adjustment with cutoff 21-20 and inline photo appendix.
(function(){
  'use strict';
  if(window.__SLS_MONTHLY_STOCK_ADJ_V120__) return;
  window.__SLS_MONTHLY_STOCK_ADJ_V120__=true;

  const $=id=>document.getElementById(id);
  const up=v=>String(v??'').trim().toUpperCase();
  const MONTHS=['JANUARI','FEBRUARI','MARET','APRIL','MEI','JUNI','JULI','AGUSTUS','SEPTEMBER','OKTOBER','NOVEMBER','DESEMBER'];
  const RDC_CODE={Jakarta:'JKT',Semarang:'SMG',Surabaya:'SBY',Denpasar:'DPS',Palembang:'PLG'};
  const PRINTABLE_STATUS=new Set(['APPROVED_SPV','MASTER_REVIEW','FINAL','CLOSED']);
  const DEFAULT_SIGNATORY={Jakarta:{spv:'Adi Mawardi',senior:''}};

  function isSpv(){try{return !!ACCESS?.can_submit_approve&&!ACCESS?.is_master}catch(_){return false}}
  function rdc(){try{return String(ACCESS?.rdc_name||'').trim()}catch(_){return ''}}
  function ym(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
  function monthLabel(p){const [y,m]=String(p||'').split('-').map(Number);return (MONTHS[m-1]||'')+' '+y}
  function prevMonth(p){const [y,m]=p.split('-').map(Number),d=new Date(y,m-2,1);return ym(d)}
  function cutoffRange(p){const [y,m]=p.split('-').map(Number);const end=y+'-'+String(m).padStart(2,'0')+'-20';const d=new Date(y,m-2,21);const start=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-21';return {start,end}}
  function fmtId(v){return String(v||'').replace(/-/g,'/')}
  function currentReportMonth(){const d=new Date(); if(d.getDate()<=20)return ym(d);d.setMonth(d.getMonth()+1);return ym(d)}
  function romanMonth(m){return ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][m-1]||String(m)}
  function signKey(){return 'sls_breakage_signatory_v120_'+(RDC_CODE[rdc()]||up(rdc())||'RDC')}
  function savedSignatory(){try{return {...(DEFAULT_SIGNATORY[rdc()]||{}),...JSON.parse(localStorage.getItem(signKey())||'{}')}}catch(_){return DEFAULT_SIGNATORY[rdc()]||{}}}
  function saveSignatory(v){try{localStorage.setItem(signKey(),JSON.stringify(v))}catch(_){}}

  function style(){
    if($('monthlyAdjStyle119'))return;
    const s=document.createElement('style');s.id='monthlyAdjStyle119';
    s.textContent=`
      #monthlyAdjModal119 .modal{width:min(760px,100%)}
      #monthlyAdjModal119 .adj-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      #monthlyAdjModal119 .adj-field label{display:block;font-size:11px;font-weight:850;color:#52647a;margin-bottom:5px}
      #monthlyAdjModal119 .adj-field input,#monthlyAdjModal119 .adj-field select,#monthlyAdjModal119 .adj-field textarea{width:100%;box-sizing:border-box;border:1px solid #cbd9e7;border-radius:9px;padding:10px;font:inherit;background:#fff}
      #monthlyAdjModal119 .adj-field textarea{min-height:76px;resize:vertical}
      #monthlyAdjModal119 .adj-span2{grid-column:1/-1}
      #monthlyAdjModal119 .adj-note{font-size:12px;line-height:1.45;color:#61758d;background:#f6f9fc;border:1px solid #dce7f1;padding:9px 11px;border-radius:9px}
      #monthlyAdjModal119 .adj-ok{color:#067647}.adj-err119{color:#b42318}
      #monthlyPhotoBrief119{margin-top:7px;padding:8px 9px;border-radius:8px;background:#fff8e7;border:1px solid #efd48f;color:#6b5215;font-size:11px;line-height:1.4}
      @media(max-width:640px){#monthlyAdjModal119 .adj-grid{grid-template-columns:1fr}.adj-span2{grid-column:auto}}
    `;document.head.appendChild(s);
  }

  function ensurePhotoBrief(){
    const note=$('photoNote');if(!note||$('monthlyPhotoBrief119'))return;
    note.insertAdjacentHTML('afterend','<div id="monthlyPhotoBrief119"><b>Ketentuan foto rekap bulanan:</b> upload foto berurutan sesuai box/motif. Qty 1 BOX = Foto 1; Qty 2 BOX = Foto 1–2; Qty 3 BOX = Foto 1–3, dst sampai maksimum 5 foto.</div>');
  }

  function ensureUi(){
    style();ensurePhotoBrief();
    const actions=document.querySelector('.actions');if(!actions)return;
    $('monthlyStockAdjBtn118')?.remove();$('monthlyAdjModal118')?.remove();
    let b=$('monthlyStockAdjBtn119');
    if(!b){
      b=document.createElement('button');b.id='monthlyStockAdjBtn119';b.type='button';b.className='secondary';b.textContent='🖨 Stock Adjustment Bulanan';
      const ref=$('refreshBtn');if(ref?.parentNode===actions)ref.insertAdjacentElement('afterend',b);else actions.appendChild(b);
      b.onclick=openModal;
    }
    b.classList.toggle('hidden',!isSpv());

    if(!$('monthlyAdjModal119')){
      document.body.insertAdjacentHTML('beforeend',`
      <div id="monthlyAdjModal119" class="overlay" aria-hidden="true">
        <div class="modal">
          <div class="modal-head"><div><h2>Print Stock Adjustment Bulanan</h2><div class="small" style="opacity:.82">Cut-off tanggal 20 · foto langsung di lampiran</div></div><div class="grow"></div><button class="close" id="monthlyAdjClose119" type="button">✕</button></div>
          <div class="modal-body">
            <div class="adj-note"><b>Periode:</b> tanggal 21 bulan sebelumnya s.d. tanggal 20 bulan laporan. Contoh Oktober 2026 = 21 Sep–20 Okt 2026.</div>
            <div class="adj-grid" style="margin-top:11px">
              <div class="adj-field"><label>Bulan Laporan *</label><input id="monthlyAdjPeriod119" type="month"></div>
              <div class="adj-field"><label>Tanggal Dokumen *</label><input id="monthlyAdjDate119" type="date"></div>
              <div class="adj-field"><label>Plant</label><input id="monthlyAdjPlant119"></div>
              <div class="adj-field"><label>Nomor Stock Adjustment</label><input id="monthlyAdjNo119"></div>
              <div class="adj-field"><label>Status Retur ke Pabrik</label><select id="monthlyAdjReturn119"><option value="">Tidak dicantumkan</option><option value="SRKI">Sudah dikembalikan ke SRKI</option><option value="RCI">Sudah dikembalikan ke RCI</option><option value="SRKI & RCI">Sudah dikembalikan ke SRKI & RCI</option></select></div>
              <div class="adj-field"><label>Motif / Keterangan Standar</label><input id="monthlyAdjMotif119" value="Motif Standard"></div>
              <div class="adj-field"><label>Nama SPV / Inventory Control *</label><input id="monthlyAdjSpv120" placeholder="Sesuai branch"></div>
              <div class="adj-field"><label>Nama Senior Staff Warehouse</label><input id="monthlyAdjSenior119" placeholder="Sesuai branch"></div>
              <div class="adj-field adj-span2"><label>Keterangan Tambahan</label><textarea id="monthlyAdjExtra119" placeholder="Opsional"></textarea></div>
            </div>
            <div id="monthlyAdjRange119" class="small" style="margin-top:9px;color:#52647a"></div>
            <div id="monthlyAdjMsg119" class="small" style="margin-top:7px"></div>
          </div>
          <div class="modal-foot"><button class="secondary" id="monthlyAdjCancel119" type="button">Batal</button><button class="primary" id="monthlyAdjPrint119" type="button">🖨 Buat Rekap + Foto</button></div>
        </div>
      </div>`);
      $('monthlyAdjClose119').onclick=closeModal;$('monthlyAdjCancel119').onclick=closeModal;$('monthlyAdjPrint119').onclick=buildReport;
      $('monthlyAdjPeriod119').onchange=syncPeriod;
    }
    const badge=$('buildBadge');if(badge)badge.textContent='v120';
  }

  function syncPeriod(){
    const p=$('monthlyAdjPeriod119')?.value;if(!/^\d{4}-\d{2}$/.test(p))return;
    const [y,m]=p.split('-').map(Number),r=cutoffRange(p);
    $('monthlyAdjNo119').value='ADJ/'+(RDC_CODE[rdc()]||'RDC')+'/'+romanMonth(m)+'/'+y;
    $('monthlyAdjRange119').textContent='Cut-off '+fmtId(r.start)+' s.d. '+fmtId(r.end)+' · label '+monthLabel(p);
  }
  function openModal(){
    if(!isSpv())return;ensureUi();
    const p=currentReportMonth(),sg=savedSignatory();
    $('monthlyAdjPeriod119').value=p;$('monthlyAdjDate119').value=new Date().toISOString().slice(0,10);
    $('monthlyAdjPlant119').value='RDC '+(RDC_CODE[rdc()]||up(rdc()).slice(0,3));
    $('monthlyAdjReturn119').value='';$('monthlyAdjExtra119').value='';
    $('monthlyAdjSpv120').value=sg.spv||'';$('monthlyAdjSenior119').value=sg.senior||'';
    $('monthlyAdjMsg119').textContent='';syncPeriod();
    const modal=$('monthlyAdjModal119');modal.classList.add('show');modal.setAttribute('aria-hidden','false');
  }
  function closeModal(){const modal=$('monthlyAdjModal119');if(!modal)return;modal.classList.remove('show');modal.setAttribute('aria-hidden','true')}

  function groupRows(rows){
    const map=new Map([['Roman|BOX',0],['Roman|PCS',0],['Roman Granit|BOX',0],['Roman Granit|PCS',0]]);
    rows.forEach(x=>{const grp=(up(x.product_kind||x.product_type)==='GRANIT')?'Roman Granit':'Roman';const u=up(x.uom)==='PCS'?'PCS':'BOX';const key=grp+'|'+u;map.set(key,(map.get(key)||0)+Number(x.qty_box||0))});
    return [...map.entries()].map(([key,out])=>{const [material,uom]=key.split('|');return {material,kw:'1',uom,in_qty:0,out_qty:out}});
  }

  async function buildReport(){
    const msg=$('monthlyAdjMsg119'),btn=$('monthlyAdjPrint119'),p=$('monthlyAdjPeriod119').value,docDate=$('monthlyAdjDate119').value;
    const spv=$('monthlyAdjSpv120').value.trim(),senior=$('monthlyAdjSenior119').value.trim();
    if(!/^\d{4}-\d{2}$/.test(p)||!docDate||!spv){msg.className='small adj-err119';msg.textContent='Bulan laporan, tanggal dokumen, dan nama SPV wajib diisi.';return}
    btn.disabled=true;msg.className='small';msg.textContent='Mengambil data cut-off dan foto evidence…';
    try{
      const prev=prevMonth(p),range=cutoffRange(p);
      const [a,b]=await Promise.all([
        rpc('breakage_incident_list',{p_period:prev,p_rdc:rdc()}),
        rpc('breakage_incident_list',{p_period:p,p_rdc:rdc()})
      ]);
      const seen=new Set(),all=[...(a||[]),...(b||[])].filter(x=>{
        const id=String(x.incident_id);if(seen.has(id))return false;seen.add(id);
        const dt=String(x.occurrence_date||'');return dt>=range.start&&dt<=range.end;
      });
      const approved=all.filter(x=>PRINTABLE_STATUS.has(up(x.status))).sort((x,y)=>String(x.occurrence_date).localeCompare(String(y.occurrence_date))||Number(x.incident_id)-Number(y.incident_id));
      if(!approved.length)throw new Error('Belum ada incident terverifikasi pada cut-off '+fmtId(range.start)+' s.d. '+fmtId(range.end)+'.');
      const rows=groupRows(approved),box=rows.filter(x=>x.uom==='BOX').reduce((s,x)=>s+Number(x.out_qty||0),0),pcs=rows.filter(x=>x.uom==='PCS').reduce((s,x)=>s+Number(x.out_qty||0),0);
      const ket=['Barang pecah RDC '+rdc(),$('monthlyAdjReturn119').value?('Sudah dikembalikan ke '+$('monthlyAdjReturn119').value):'','Periode '+monthLabel(p),'Cut-off '+fmtId(range.start)+' s.d. '+fmtId(range.end),$('monthlyAdjMotif119').value.trim()||'Motif Standard',$('monthlyAdjExtra119').value.trim(),'(List dan foto terlampir)'].filter(Boolean).join('\n');
      saveSignatory({spv,senior});
      const payload={
        version:'v120',generated_at:new Date().toISOString(),rdc:rdc(),period:p,period_label:monthLabel(p),cutoff_start:range.start,cutoff_end:range.end,
        plant:$('monthlyAdjPlant119').value.trim()||('RDC '+(RDC_CODE[rdc()]||rdc())),document_no:$('monthlyAdjNo119').value.trim(),document_date:docDate,
        rows,total_box:box,total_pcs:pcs,keterangan:ket,signatory:{spv,senior},approved_incident_count:approved.length,
        incidents:approved.map(x=>({
          incident_id:x.incident_id,incident_no:x.incident_no,occurrence_date:x.occurrence_date,incident_type:x.incident_type,
          item_code:x.item_code,ceramic_series:x.ceramic_series,product_kind:x.product_kind,product_type:x.product_type,product_size:x.product_size,
          qty_box:Number(x.qty_box||0),uom:x.uom||'BOX',no_ba:x.no_ba,factory:x.factory,status:x.status,cause:x.cause,cause_detail:x.cause_detail,
          motif_type:x.motif_type||'Motif Standard',photo_paths:Array.isArray(x.photo_paths)?x.photo_paths:[]
        }))
      };
      const key='sls_monthly_stock_adj_v120_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);localStorage.setItem(key,JSON.stringify(payload));
      msg.className='small adj-ok';msg.textContent='Rekap siap: '+approved.length+' item. Membuka lampiran dengan foto…';
      const w=window.open('/stock_adjustment_print_v120.html?k='+encodeURIComponent(key),'_blank');if(!w)throw new Error('Popup diblokir browser. Izinkan popup lalu coba lagi.');
    }catch(e){msg.className='small adj-err119';msg.textContent='Gagal: '+String(e?.message||e)}
    finally{btn.disabled=false}
  }

  try{const prev=window.showApp||showApp;window.showApp=function(){const r=prev.apply(this,arguments);setTimeout(ensureUi,0);return r};showApp=window.showApp}catch(_){}
  document.addEventListener('click',()=>setTimeout(()=>{ensureUi();ensurePhotoBrief()},0),true);
  [80,250,700,1500,3000].forEach(ms=>setTimeout(()=>{ensureUi();ensurePhotoBrief()},ms));
})();