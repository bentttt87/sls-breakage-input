// SLS Breakage Input v118 — monthly Stock Adjustment print for all SPV accounts.
(function(){
  'use strict';
  if(window.__SLS_MONTHLY_STOCK_ADJ_V118__) return;
  window.__SLS_MONTHLY_STOCK_ADJ_V118__=true;

  const $=id=>document.getElementById(id);
  const up=v=>String(v??'').trim().toUpperCase();
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const MONTHS=['JANUARI','FEBRUARI','MARET','APRIL','MEI','JUNI','JULI','AGUSTUS','SEPTEMBER','OKTOBER','NOVEMBER','DESEMBER'];
  const RDC_CODE={Jakarta:'JKT',Semarang:'SMG',Surabaya:'SBY',Denpasar:'DPS',Palembang:'PLG'};
  const PRINTABLE_STATUS=new Set(['APPROVED_SPV','MASTER_REVIEW','FINAL','CLOSED']);

  function isSpv(){
    try{return !!ACCESS?.can_submit_approve && !ACCESS?.is_master;}catch(_){return false}
  }
  function rdc(){
    try{return String(ACCESS?.rdc_name||'').trim();}catch(_){return ''}
  }
  function previousPeriod(){
    const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-1);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  }
  function monthLabel(p){
    const [y,m]=String(p||'').split('-').map(Number);
    return (MONTHS[m-1]||'')+' '+y;
  }
  function romanMonth(m){
    return ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][m-1]||String(m);
  }
  function fmtQty(n){
    const x=Number(n||0);
    return x.toLocaleString('id-ID',{maximumFractionDigits:2});
  }

  function style(){
    if($('monthlyAdjStyle118'))return;
    const s=document.createElement('style');
    s.id='monthlyAdjStyle118';
    s.textContent=`
      #monthlyAdjModal118 .modal{width:min(720px,100%)}
      #monthlyAdjModal118 .adj-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      #monthlyAdjModal118 .adj-field label{display:block;font-size:11px;font-weight:850;color:#52647a;margin-bottom:5px}
      #monthlyAdjModal118 .adj-field input,#monthlyAdjModal118 .adj-field select,#monthlyAdjModal118 .adj-field textarea{width:100%;box-sizing:border-box;border:1px solid #cbd9e7;border-radius:9px;padding:10px;font:inherit;background:#fff}
      #monthlyAdjModal118 .adj-field textarea{min-height:80px;resize:vertical}
      #monthlyAdjModal118 .adj-span2{grid-column:1/-1}
      #monthlyAdjModal118 .adj-note{font-size:12px;line-height:1.45;color:#61758d;background:#f6f9fc;border:1px solid #dce7f1;padding:9px 11px;border-radius:9px}
      #monthlyAdjModal118 .adj-ok{color:#067647}.adj-err118{color:#b42318}
      @media(max-width:640px){#monthlyAdjModal118 .adj-grid{grid-template-columns:1fr}.adj-span2{grid-column:auto}}
    `;
    document.head.appendChild(s);
  }

  function ensureUi(){
    style();
    const actions=document.querySelector('.actions');
    if(!actions)return;
    let b=$('monthlyStockAdjBtn118');
    if(!b){
      b=document.createElement('button');
      b.id='monthlyStockAdjBtn118';
      b.type='button';
      b.className='secondary';
      b.textContent='🖨 Stock Adjustment Bulanan';
      const ref=$('refreshBtn');
      if(ref?.parentNode===actions)ref.insertAdjacentElement('afterend',b);else actions.appendChild(b);
      b.onclick=openModal;
    }
    b.classList.toggle('hidden',!isSpv());

    if(!$('monthlyAdjModal118')){
      document.body.insertAdjacentHTML('beforeend',`
      <div id="monthlyAdjModal118" class="overlay" aria-hidden="true">
        <div class="modal">
          <div class="modal-head">
            <div><h2>Print Stock Adjustment Bulanan</h2><div class="small" style="opacity:.82">Khusus SPV RDC · sumber data Breakage Monitoring</div></div>
            <div class="grow"></div><button class="close" id="monthlyAdjClose118" type="button">✕</button>
          </div>
          <div class="modal-body">
            <div class="adj-note"><b>Data yang dicetak:</b> incident bulan terpilih yang sudah <b>disetujui SPV / masuk review Master / final</b>. Draft dan data yang dikembalikan tidak masuk agar Stock Adjustment tidak mendahului proses verifikasi.</div>
            <div class="adj-grid" style="margin-top:11px">
              <div class="adj-field"><label>Periode *</label><input id="monthlyAdjPeriod118" type="month"></div>
              <div class="adj-field"><label>Tanggal Dokumen *</label><input id="monthlyAdjDate118" type="date"></div>
              <div class="adj-field"><label>Plant</label><input id="monthlyAdjPlant118"></div>
              <div class="adj-field"><label>Nomor Stock Adjustment</label><input id="monthlyAdjNo118" placeholder="Boleh diedit sebelum print"></div>
              <div class="adj-field"><label>Status Retur ke Pabrik</label><select id="monthlyAdjReturn118"><option value="">Tidak dicantumkan</option><option value="SRKI">Sudah dikembalikan ke SRKI</option><option value="RCI">Sudah dikembalikan ke RCI</option><option value="SRKI & RCI">Sudah dikembalikan ke SRKI & RCI</option></select></div>
              <div class="adj-field"><label>Motif / Keterangan Standar</label><input id="monthlyAdjMotif118" value="Motif Standard"></div>
              <div class="adj-field adj-span2"><label>Keterangan Tambahan</label><textarea id="monthlyAdjExtra118" placeholder="Opsional. Contoh: Diterima tanggal ..., retur dilakukan tanggal ..., dll."></textarea></div>
            </div>
            <div id="monthlyAdjMsg118" class="small" style="margin-top:10px"></div>
          </div>
          <div class="modal-foot">
            <button class="secondary" id="monthlyAdjCancel118" type="button">Batal</button>
            <button class="primary" id="monthlyAdjPrint118" type="button">🖨 Buat Rekap & Print</button>
          </div>
        </div>
      </div>`);
      $('monthlyAdjClose118').onclick=closeModal;
      $('monthlyAdjCancel118').onclick=closeModal;
      $('monthlyAdjPrint118').onclick=buildReport;
    }
    const badge=$('buildBadge'); if(badge)badge.textContent='v118';
  }

  function openModal(){
    if(!isSpv())return;
    ensureUi();
    const p=(typeof PERIOD!=='undefined'&&/^\d{4}-\d{2}$/.test(PERIOD))?PERIOD:previousPeriod();
    const [y,m]=p.split('-').map(Number);
    $('monthlyAdjPeriod118').value=p;
    $('monthlyAdjDate118').value=new Date().toISOString().slice(0,10);
    $('monthlyAdjPlant118').value='RDC '+(RDC_CODE[rdc()]||up(rdc()).slice(0,3));
    $('monthlyAdjNo118').value='ADJ/'+(RDC_CODE[rdc()]||'RDC')+'/'+romanMonth(m)+'/'+y;
    $('monthlyAdjReturn118').value='';
    $('monthlyAdjExtra118').value='';
    $('monthlyAdjMsg118').textContent='';
    const modal=$('monthlyAdjModal118'); modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
  }
  function closeModal(){
    const modal=$('monthlyAdjModal118'); if(!modal)return;
    modal.classList.remove('show'); modal.setAttribute('aria-hidden','true');
  }

  function groupRows(rows){
    const map=new Map([
      ['Roman|BOX',0],['Roman|PCS',0],['Roman Granit|BOX',0],['Roman Granit|PCS',0]
    ]);
    rows.forEach(x=>{
      const grp=(up(x.product_kind||x.product_type)==='GRANIT')?'Roman Granit':'Roman';
      const u=up(x.uom)==='PCS'?'PCS':'BOX';
      const key=grp+'|'+u;
      map.set(key,(map.get(key)||0)+Number(x.qty_box||0));
    });
    return [...map.entries()].map(([key,out])=>{
      const [material,uom]=key.split('|');
      return {material,kw:'1',uom,in_qty:0,out_qty:out};
    });
  }

  async function buildReport(){
    const msg=$('monthlyAdjMsg118'),btn=$('monthlyAdjPrint118');
    const period=$('monthlyAdjPeriod118').value;
    const docDate=$('monthlyAdjDate118').value;
    if(!/^\d{4}-\d{2}$/.test(period)||!docDate){msg.className='small adj-err118';msg.textContent='Periode dan tanggal dokumen wajib diisi.';return}
    btn.disabled=true; msg.className='small'; msg.textContent='Mengambil data Breakage Monitoring…';
    try{
      const all=await rpc('breakage_incident_list',{p_period:period,p_rdc:rdc()})||[];
      const approved=all.filter(x=>PRINTABLE_STATUS.has(up(x.status)));
      if(!approved.length)throw new Error('Belum ada incident yang sudah disetujui SPV/final pada periode '+monthLabel(period)+'.');
      const rows=groupRows(approved);
      const box=rows.filter(x=>x.uom==='BOX').reduce((a,b)=>a+Number(b.out_qty||0),0);
      const pcs=rows.filter(x=>x.uom==='PCS').reduce((a,b)=>a+Number(b.out_qty||0),0);
      const factories=[...new Set(approved.map(x=>up(x.factory)).filter(Boolean))];
      const keterangan=[
        'Barang pecah RDC '+rdc(),
        $('monthlyAdjReturn118').value?('Sudah dikembalikan ke '+$('monthlyAdjReturn118').value):'',
        'Periode '+monthLabel(period),
        $('monthlyAdjMotif118').value.trim()||'Motif Standard',
        $('monthlyAdjExtra118').value.trim(),
        '(List dan foto terlampir)'
      ].filter(Boolean).join('\n');
      const payload={
        version:'v118',
        generated_at:new Date().toISOString(),
        rdc:rdc(), period, period_label:monthLabel(period),
        plant:$('monthlyAdjPlant118').value.trim()||('RDC '+(RDC_CODE[rdc()]||rdc())),
        document_no:$('monthlyAdjNo118').value.trim(),
        document_date:docDate,
        rows, total_box:box, total_pcs:pcs,
        keterangan,
        approved_incident_count:approved.length,
        approved_total_qty:approved.reduce((a,b)=>a+Number(b.qty_box||0),0),
        source_statuses:[...new Set(approved.map(x=>x.status))],
        factories,
        incidents:approved.map(x=>({
          incident_no:x.incident_no,occurrence_date:x.occurrence_date,incident_type:x.incident_type,
          item_code:x.item_code,ceramic_series:x.ceramic_series,product_kind:x.product_kind,
          product_type:x.product_type,product_size:x.product_size,qty_box:x.qty_box,uom:x.uom,
          no_ba:x.no_ba,factory:x.factory,status:x.status,photo_count:Array.isArray(x.photo_paths)?x.photo_paths.length:0
        }))
      };
      const key='sls_monthly_stock_adj_v118_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
      localStorage.setItem(key,JSON.stringify(payload));
      msg.className='small adj-ok';msg.textContent='Rekap siap: '+approved.length+' incident · '+fmtQty(box)+' BOX'+(pcs?(' · '+fmtQty(pcs)+' PCS'):'')+'. Membuka halaman print…';
      const w=window.open('/stock_adjustment_print_v118.html?k='+encodeURIComponent(key),'_blank');
      if(!w)throw new Error('Popup diblokir browser. Izinkan popup lalu coba lagi.');
    }catch(e){
      msg.className='small adj-err118';msg.textContent='Gagal: '+String(e?.message||e);
    }finally{btn.disabled=false}
  }

  try{
    const prev=window.showApp||showApp;
    window.showApp=function(){const r=prev.apply(this,arguments);setTimeout(ensureUi,0);return r};
    showApp=window.showApp;
  }catch(_){}
  document.addEventListener('click',()=>setTimeout(ensureUi,0),true);
  [80,250,700,1500,3000].forEach(ms=>setTimeout(ensureUi,ms));
})();