// SLS Breakage Input v76 — safe UI polish for Database Ekspedisi.
(function(){
  'use strict';
  function apply(){
    const main=document.getElementById('logisticsBtn');
    const extra=document.getElementById('logisticsMenuV73');
    const direct=document.getElementById('logisticsBtnDirectV74');
    if(main&&extra) extra.remove();
    if(main&&direct) direct.remove();

    const modal=document.getElementById('logisticsModal');
    if(!modal) return;

    if(!document.getElementById('logisticsPolishV76')){
      const st=document.createElement('style');
      st.id='logisticsPolishV76';
      st.textContent=`
        #logisticsModal .modal{width:min(760px,96vw)}
        #logisticsModal .modal-body{padding:14px 16px 20px}
        #logisticsModal #lgVendorForm,
        #logisticsModal #lgDriverForm,
        #logisticsModal #lgVehicleForm{padding:12px;border-radius:12px}
        #logisticsModal #lgVendorForm>div[style*="display:flex"],
        #logisticsModal #lgDriverForm>div[style*="display:flex"],
        #logisticsModal #lgVehicleForm>div[style*="display:flex"]{justify-content:flex-end!important;align-items:center;gap:8px!important;flex-wrap:wrap}
        #logisticsModal #lgVendorCancel,
        #logisticsModal #lgDriverCancel,
        #logisticsModal #lgVehicleCancel,
        #logisticsModal #lgVendorSave,
        #logisticsModal #lgDriverSave,
        #logisticsModal #lgVehicleSave{min-height:40px;padding:9px 14px;border-radius:9px;white-space:nowrap}
        #logisticsModal #lgVendorCancel,
        #logisticsModal #lgDriverCancel,
        #logisticsModal #lgVehicleCancel{min-width:104px}
        #logisticsModal #lgVendorSave,
        #logisticsModal #lgDriverSave,
        #logisticsModal #lgVehicleSave{min-width:136px}
        #logisticsModal .section-title{margin:14px 0 7px!important;padding-top:2px}
        #logisticsModal .tablewrap{border:1px solid #e3eaf2;border-radius:10px;overflow:auto}
        @media(max-width:600px){
          #logisticsModal .modal{width:100%;max-width:none}
          #logisticsModal #lgVendorForm>div[style*="display:flex"],
          #logisticsModal #lgDriverForm>div[style*="display:flex"],
          #logisticsModal #lgVehicleForm>div[style*="display:flex"]{display:grid!important;grid-template-columns:1fr 1fr}
          #logisticsModal #lgVendorCancel,
          #logisticsModal #lgDriverCancel,
          #logisticsModal #lgVehicleCancel,
          #logisticsModal #lgVendorSave,
          #logisticsModal #lgDriverSave,
          #logisticsModal #lgVehicleSave{width:100%;min-width:0}
        }
      `;
      document.head.appendChild(st);
    }

    const labels={lgVendorCancel:'Batal Edit',lgVendorSave:'Simpan Vendor',lgDriverCancel:'Batal Edit',lgDriverSave:'Simpan Driver',lgVehicleCancel:'Batal Edit',lgVehicleSave:'Simpan Kendaraan'};
    Object.entries(labels).forEach(([id,label])=>{const el=document.getElementById(id);if(el&&el.textContent!==label)el.textContent=label;});
  }

  apply();
  [100,300,800,1500,3000].forEach(ms=>setTimeout(apply,ms));
})();
