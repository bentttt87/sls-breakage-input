// SLS Breakage Input runtime hardening v47
// Keeps active Supabase Auth sessions fresh and makes RPC / evidence upload resilient.
(function(){
  const PATCH_VERSION='v47-auth-storage-20260906';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  function saveSession(){
    if(SESSION) sessionStorage.setItem('sls_breakage_input_session',JSON.stringify(SESSION));
  }
  function jwtExp(token){
    try{
      const p=JSON.parse(atob(String(token).split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      return Number(p.exp||0);
    }catch(_e){return 0}
  }
  function expiresSoon(){
    const exp=Number(SESSION?.expires_at||jwtExp(SESSION?.access_token));
    return !exp || exp-Math.floor(Date.now()/1000)<120;
  }
  async function refreshSession(force=false){
    if(!SESSION?.refresh_token) return false;
    if(!force&&!expiresSoon()) return true;
    const r=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{
      method:'POST',cache:'no-store',signal:AbortSignal.timeout(20000),
      headers:{apikey:PUBLIC_ANON,'Content-Type':'application/json'},
      body:JSON.stringify({refresh_token:SESSION.refresh_token})
    });
    if(!r.ok){
      const t=await r.text().catch(()=>String(r.status));
      if(force) throw new Error('Sesi login perlu diperbarui: '+cleanErr(t));
      return false;
    }
    const n=await r.json();
    SESSION={...SESSION,...n};
    if(!SESSION.expires_at&&n.expires_in) SESSION.expires_at=Math.floor(Date.now()/1000)+Number(n.expires_in);
    saveSession();
    return true;
  }
  window.slsRefreshBreakageSession=refreshSession;

  async function authedFetch(url,opts={},networkRetries=2){
    await refreshSession(false).catch(()=>false);
    let lastErr,refreshed=false;
    for(let attempt=0;attempt<=networkRetries;attempt++){
      try{
        const headers={...(opts.headers||{}),apikey:PUBLIC_ANON,Authorization:`Bearer ${auth()}`};
        const r=await fetch(url,{...opts,cache:'no-store',signal:opts.signal||AbortSignal.timeout(25000),headers});
        if((r.status===401||r.status===403)&&SESSION?.refresh_token&&!refreshed){
          const body=await r.clone().text().catch(()=> '');
          if(r.status===401||/jwt|token|unauthori|accessdenied|row-level security/i.test(body)){
            refreshed=true;
            if(await refreshSession(true).catch(()=>false)){continue}
          }
        }
        return r;
      }catch(e){
        lastErr=e;
        if(attempt===networkRetries) throw e;
        await sleep(500*(attempt+1));
      }
    }
    throw lastErr||new Error('Koneksi gagal');
  }

  rpc=async function(fn,params={}){
    const r=await authedFetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(params)
    },2);
    if(!r.ok) throw new Error(await r.text());
    return r.json();
  };

  loadHistory=async function(){
    const s=effectiveScope();
    if(ACCESS?.is_master) $('rdcCard').textContent=s||'Pilih RDC';
    $('historyBody').innerHTML='<tr><td colspan="9"><div class="empty">Memuat riwayat…</div></td></tr>';
    try{
      if(ACCESS?.is_master&&!s){INCIDENTS=[];renderHistory();return;}
      INCIDENTS=await rpc('breakage_incident_list',{p_period:PERIOD,p_rdc:s})||[];
      renderHistory();
    }catch(e){
      const msg=cleanErr(e?.message||String(e));
      const sessionProblem=/jwt|token|session|unauthor/i.test(msg);
      $('historyBody').innerHTML=`<tr><td colspan="9"><div class="empty">${sessionProblem?'Sesi login perlu diperbarui.':'Data belum berhasil dimuat.'}<br><span class="smallnote">${esc(msg)}</span><br><button class="secondary" style="margin-top:10px" onclick="loadHistory()">↻ Coba Lagi</button></div></td></tr>`;
    }
  };

  uploadEvidence=async function(files,rdc){
    if(!SESSION?.access_token) throw new Error('Sesi login tidak aktif. Silakan login kembali.');
    await refreshSession(false);
    const batch='draft_'+crypto.randomUUID(),paths=[];
    for(let i=0;i<files.length;i++){
      const f=files[i];
      if(!['image/jpeg','image/png'].includes(f.type)) throw new Error(`Foto ${i+1}: format harus JPG atau PNG.`);
      const ext=f.type==='image/png'?'png':'jpg';
      const safe=String(rdc).replace(/[^A-Za-z0-9_-]/g,'_');
      const path=`${safe}/${batch}/${Date.now()}_${i+1}.${ext}`;
      const encoded=path.split('/').map(encodeURIComponent).join('/');
      const r=await authedFetch(`${SUPABASE_URL}/storage/v1/object/breakage-evidence/${encoded}`,{
        method:'POST',headers:{'Content-Type':f.type,'x-upsert':'false'},body:f
      },2);
      if(!r.ok){
        const raw=await r.text();
        // With a UUID path, 409 after a retry means the first upload most likely succeeded.
        if(r.status!==409) throw new Error(`Upload foto ${i+1} gagal (HTTP ${r.status}): ${cleanErr(raw)}`);
      }
      paths.push(path);
    }
    return paths;
  };

  evidenceBlob=async function(path){
    if(typeof path!=='string'||!path||path.startsWith('/')||path.split('/').includes('..')) throw new Error('Path evidence tidak valid');
    const encoded=path.split('/').map(encodeURIComponent).join('/');
    const r=await authedFetch(`${SUPABASE_URL}/storage/v1/object/authenticated/breakage-evidence/${encoded}`,{method:'GET'},2);
    if(!r.ok) throw new Error('Foto tidak dapat dibuka: '+cleanErr(await r.text()));
    const blob=await r.blob();
    if(!['image/jpeg','image/png'].includes(blob.type)) throw new Error('Format evidence bukan JPEG/PNG');
    return blob;
  };

  // Rebind handlers that referenced the previous implementations.
  $('refreshBtn').onclick=()=>loadHistory();
  $('period').onchange=async e=>{PERIOD=e.target.value;$('periodLabel').textContent=monthName(PERIOD);await loadHistory()};
  $('scope').onchange=async e=>{SCOPE=e.target.value;if(ACCESS?.is_master)$('rdcCard').textContent=SCOPE;await loadHistory()};

  // If a persisted session exists, refresh it quietly so storage/RPC calls do not use an expired JWT.
  setTimeout(async()=>{
    if(!SESSION?.refresh_token) return;
    try{
      await refreshSession(false);
      if(!ACCESS) ACCESS=await rpc('breakage_my_access_v44',{});
      if(ACCESS&&$('app').style.display!=='none') await loadHistory();
    }catch(_e){}
  },100);

  window.__SLS_BREAKAGE_INPUT_PATCH=PATCH_VERSION;
})();
