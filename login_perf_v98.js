// SLS Breakage Input v98 — login performance guard and feedback.
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let loginBusy=false;
  const baseRpc=window.rpc||rpc;

  // Product master must not call protected RPC before login.
  try{
    rpc=async function(fn,params={}){
      if(fn==='breakage_product_master_list_v94' && !SESSION?.access_token) return [];
      return baseRpc(fn,params);
    };
    window.rpc=rpc;
  }catch(_){ }

  async function fetchJson(url,opts={},timeoutMs=9000){
    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(),timeoutMs);
    try{
      const r=await fetch(url,{...opts,signal:ctrl.signal});
      if(!r.ok)throw new Error(await r.text()||('HTTP '+r.status));
      return await r.json();
    }finally{clearTimeout(timer)}
  }

  async function resolveEmail(username,pw){
    const payload={input_username:username,input_password:pw};
    let last;
    for(let i=0;i<2;i++){
      try{
        return await fetchJson(`${SUPABASE_URL}/rest/v1/rpc/get_login_email`,{
          method:'POST',cache:'no-store',headers:{apikey:PUBLIC_ANON,Authorization:`Bearer ${PUBLIC_ANON}`,'Content-Type':'application/json'},body:JSON.stringify(payload)
        },7000);
      }catch(e){last=e;if(i===0)await new Promise(r=>setTimeout(r,250));}
    }
    throw last;
  }

  async function fastSignIn(username,pw){
    username=String(username||'').trim().toLowerCase();
    if(!username||!pw)throw new Error('User ID dan password wajib.');
    const email=await resolveEmail(username,pw);
    if(!email)throw new Error('User ID atau password salah.');
    SESSION=await fetchJson(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{
      method:'POST',headers:{apikey:PUBLIC_ANON,'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})
    },10000).catch(()=>{throw new Error('Login gagal. Periksa User ID dan password.')});
    ACCESS=await baseRpc('breakage_my_access_v44',{});
    sessionStorage.setItem('sls_breakage_input_session',JSON.stringify(SESSION));
    sessionStorage.setItem('sls_breakage_input_username',username);
  }

  async function fastLogin(){
    if(loginBusy)return;
    const btn=$('loginBtn'),msg=$('loginMsg');
    const u=$('username')?.value?.trim()||'',pw=$('pw')?.value||'';
    loginBusy=true;
    if(btn){btn.disabled=true;btn.dataset.original=btn.dataset.original||btn.textContent;btn.textContent='Memproses login…';}
    if(msg){msg.style.color='#52708f';msg.textContent='Memverifikasi akun…';}
    const started=performance.now();
    try{
      await fastSignIn(u,pw);
      PERIOD=currentPeriod();
      SCOPE=ACCESS?.is_master?'Jakarta':ACCESS?.rdc_name;
      initPeriods();
      showApp();
      if(msg)msg.textContent='';
      // Riwayat tidak menahan perpindahan halaman setelah login berhasil.
      Promise.resolve().then(()=>loadHistory()).catch(()=>{});
      console.info('[SLS Login] ready in',Math.round(performance.now()-started),'ms');
    }catch(e){
      if(msg){msg.style.color='';msg.textContent=cleanErr(e.message);}
    }finally{
      loginBusy=false;
      if(btn){btn.disabled=false;btn.textContent=btn.dataset.original||'Masuk ke Breakage Input';}
    }
  }

  try{signIn=fastSignIn;window.signIn=fastSignIn;login=fastLogin;window.login=fastLogin;}catch(_){ }
  if($('loginBtn'))$('loginBtn').onclick=fastLogin;
  ['username','pw'].forEach(id=>{const x=$(id);if(x)x.onkeydown=e=>{if(e.key==='Enter')fastLogin()};});
  const b=$('buildBadge');if(b)b.textContent='v98';
})();
