// SLS Breakage Input v112 — network retry + idempotent create protection.
(function(){
  'use strict';
  if(window.__SLS_BREAKAGE_NET_V112__) return;
  window.__SLS_BREAKAGE_NET_V112__=true;
  const rawFetch=window.fetch.bind(window);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const isSupabase=url=>String(url||'').includes('mfdckngkvjnemwgmkiiv.supabase.co');
  const isCreate94=url=>String(url||'').includes('/rest/v1/rpc/breakage_incident_create_v94');
  const isEvidenceUpload=(url,init)=>String(url||'').includes('/storage/v1/object/breakage-evidence/')&&String(init?.method||'GET').toUpperCase()==='POST';
  function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
  function reqIdFor(body){const key='sls_br_req_'+hash(body);let id='';try{id=sessionStorage.getItem(key)||'';}catch(_){ }if(!id){id=(crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`);try{sessionStorage.setItem(key,id);}catch(_){ }}return {id,key};}
  async function retryFetch(url,init,maxAttempts=3){let lastErr;for(let attempt=1;attempt<=maxAttempts;attempt++){try{const r=await rawFetch(url,init);if(r.ok||r.status<500||attempt===maxAttempts)return r;await sleep(350*attempt);}catch(e){lastErr=e;if(attempt===maxAttempts)throw e;await sleep(350*attempt);}}throw lastErr||new TypeError('Failed to fetch');}
  window.fetch=async function(input,init={}){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(!isSupabase(url)) return rawFetch(input,init);

    if(isCreate94(url)){
      let parsed=null,bodyText='';
      try{bodyText=typeof init.body==='string'?init.body:JSON.stringify(init.body||{});parsed=JSON.parse(bodyText);}catch(_){return rawFetch(input,init);}
      if(!parsed||!parsed.p_payload) return rawFetch(input,init);
      const token=reqIdFor(bodyText);
      const nextUrl=String(url).replace('/breakage_incident_create_v94','/breakage_incident_create_v112');
      const nextInit={...init,body:JSON.stringify({p_request_id:token.id,p_payload:parsed.p_payload})};
      try{
        const r=await retryFetch(nextUrl,nextInit,3);
        if(r.ok||r.status<500){try{sessionStorage.removeItem(token.key);}catch(_){ }}
        return r;
      }catch(e){throw e;}
    }

    if(isEvidenceUpload(url,init)){
      const headers=new Headers(init.headers||{});
      headers.set('x-upsert','true');
      const nextInit={...init,headers};
      return retryFetch(input,nextInit,3);
    }

    return rawFetch(input,init);
  };
})();
