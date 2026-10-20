// SLS Breakage Input v124 — SPV photo editor for Accounting evidence marking.
(function(){
  'use strict';
  const $v=id=>document.getElementById(id);
  const up=v=>String(v??'').trim().toUpperCase();
  const isSpv=()=>!!ACCESS?.can_submit_approve && !ACCESS?.is_master;
  const escv=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const E={
    row:null,index:-1,path:'',canvas:null,ctx:null,original:null,undo:[],tool:'pencil',
    color:'#e11d48',size:6,drawing:false,start:null,shapeBase:null,cropBase:null,cropRect:null
  };

  function ensureStyle(){
    if($v('spvPhotoEditorStyle124'))return;
    const s=document.createElement('style');s.id='spvPhotoEditorStyle124';
    s.textContent=`
      #reviewPhotos.spv-photo-grid124{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
      .spv-photo-card124{border:1px solid #d7e1ec;border-radius:10px;padding:7px;background:#fff;min-width:0}
      .spv-photo-card124>a{display:block;border-radius:7px;overflow:hidden;background:#f6f8fb}
      .spv-photo-card124>a img{display:block;width:100%;height:135px;object-fit:contain;background:#f6f8fb}
      .spv-photo-actions124{display:flex;gap:6px;margin-top:6px}
      .spv-photo-actions124 button{flex:1;border-radius:7px;border:1px solid #aebfd1;background:#fff;padding:7px 6px;font-size:10px;font-weight:800;color:#18456f}
      .spv-photo-actions124 button.danger124{color:#b42318;border-color:#e3aaa4}
      #spvPhotoEditModal124 .modal{width:min(980px,100%);max-height:96vh}
      #spvPhotoEditModal124 .modal-body{overflow:auto}
      .pe-toolbar124{display:flex;flex-wrap:wrap;gap:7px;align-items:center;background:#f5f8fc;border:1px solid #d7e3ef;border-radius:10px;padding:8px}
      .pe-toolbar124 button,.pe-toolbar124 select,.pe-toolbar124 input[type=color]{height:36px;border:1px solid #b8c8da;border-radius:8px;background:#fff;font:inherit}
      .pe-toolbar124 button{padding:0 10px;font-size:11px;font-weight:800;color:#244d73}
      .pe-toolbar124 button.active124{background:#0b67b9;color:#fff;border-color:#0b67b9}
      .pe-toolbar124 label{font-size:10px;font-weight:800;color:#52647a;display:flex;align-items:center;gap:4px}
      .pe-canvas-wrap124{margin-top:9px;background:#20252b;border-radius:10px;padding:8px;display:flex;justify-content:center;align-items:center;overflow:auto;min-height:240px}
      #spvPhotoCanvas124{max-width:100%;height:auto;touch-action:none;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.25)}
      .pe-note124{margin-top:8px;font-size:10px;color:#65758a;line-height:1.45}
      @media(max-width:640px){
        #reviewPhotos.spv-photo-grid124{grid-template-columns:1fr 1fr}
        .spv-photo-card124>a img{height:120px}
        .pe-toolbar124 button{padding:0 7px;font-size:10px}
      }
    `;document.head.appendChild(s);
  }

  function ensureModal(){
    ensureStyle();
    if($v('spvPhotoEditModal124'))return;
    document.body.insertAdjacentHTML('beforeend',`
      <div id="spvPhotoEditModal124" class="overlay" aria-hidden="true">
        <div class="modal">
          <div class="modal-head">
            <div><h2 style="margin:0">Edit Foto Evidence</h2><div class="small" style="opacity:.82">Tandai bagian pecah untuk Accounting</div></div>
            <div class="grow"></div><button class="close" id="spvPhotoEditClose124" type="button">✕</button>
          </div>
          <div class="modal-body">
            <div class="pe-toolbar124">
              <button type="button" data-pe-tool="pencil" class="active124">✎ Pencil</button>
              <button type="button" data-pe-tool="rect">▭ Kotak</button>
              <button type="button" data-pe-tool="circle">◯ Lingkaran</button>
              <button type="button" data-pe-tool="arrow">➜ Panah</button>
              <button type="button" data-pe-tool="crop">⌗ Crop</button>
              <label>Size <select id="spvPhotoSize124"><option value="2">2</option><option value="4">4</option><option value="6" selected>6</option><option value="10">10</option><option value="14">14</option></select></label>
              <label>Colour <input id="spvPhotoColor124" type="color" value="#e11d48"></label>
              <button type="button" id="spvPhotoApplyCrop124">Apply Crop</button>
              <button type="button" id="spvPhotoUndo124">↶ Undo</button>
              <button type="button" id="spvPhotoReset124">Reset</button>
            </div>
            <div class="pe-canvas-wrap124"><canvas id="spvPhotoCanvas124"></canvas></div>
            <div class="pe-note124"><b>Kontrol evidence:</b> hasil edit menjadi foto aktif pada incident. Foto original tidak dimusnahkan dan tetap tercatat pada audit trail/storage untuk traceability.</div>
            <div id="spvPhotoEditMsg124" class="small" style="margin-top:8px;color:#b42318"></div>
          </div>
          <div class="modal-foot">
            <button class="secondary" id="spvPhotoEditCancel124" type="button">Batal</button>
            <button class="primary" id="spvPhotoEditSave124" type="button">Simpan Foto Edit</button>
          </div>
        </div>
      </div>
    `);
    E.canvas=$v('spvPhotoCanvas124');E.ctx=E.canvas.getContext('2d');

    document.querySelectorAll('[data-pe-tool]').forEach(b=>b.onclick=()=>{
      E.tool=b.dataset.peTool;E.cropRect=null;
      document.querySelectorAll('[data-pe-tool]').forEach(x=>x.classList.toggle('active124',x===b));
    });
    $v('spvPhotoSize124').onchange=e=>E.size=Number(e.target.value)||6;
    $v('spvPhotoColor124').oninput=e=>E.color=e.target.value||'#e11d48';
    $v('spvPhotoUndo124').onclick=undo;
    $v('spvPhotoReset124').onclick=resetOriginal;
    $v('spvPhotoApplyCrop124').onclick=applyCrop;
    $v('spvPhotoEditClose124').onclick=closeEditor;
    $v('spvPhotoEditCancel124').onclick=closeEditor;
    $v('spvPhotoEditSave124').onclick=saveEditedPhoto;

    E.canvas.addEventListener('pointerdown',pointerDown);
    E.canvas.addEventListener('pointermove',pointerMove);
    E.canvas.addEventListener('pointerup',pointerUp);
    E.canvas.addEventListener('pointercancel',pointerUp);
  }

  function point(ev){
    const r=E.canvas.getBoundingClientRect();
    return {x:(ev.clientX-r.left)*E.canvas.width/r.width,y:(ev.clientY-r.top)*E.canvas.height/r.height};
  }
  function copyCanvas(src){
    const c=document.createElement('canvas');c.width=src.width;c.height=src.height;c.getContext('2d').drawImage(src,0,0);return c;
  }
  function restoreFrom(src){
    E.canvas.width=src.width;E.canvas.height=src.height;E.ctx=E.canvas.getContext('2d');E.ctx.drawImage(src,0,0);
  }
  function pushUndo(){
    E.undo.push(copyCanvas(E.canvas));if(E.undo.length>8)E.undo.shift();
  }
  function undo(){
    const c=E.undo.pop();if(c){restoreFrom(c);E.cropRect=null;}
  }
  function resetOriginal(){
    if(!E.original)return;pushUndo();restoreFrom(E.original);E.cropRect=null;
  }
  function drawShape(ctx,tool,a,b){
    ctx.save();ctx.strokeStyle=E.color;ctx.fillStyle=E.color;ctx.lineWidth=E.size;ctx.lineCap='round';ctx.lineJoin='round';
    const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),w=Math.abs(b.x-a.x),h=Math.abs(b.y-a.y);
    if(tool==='rect')ctx.strokeRect(x,y,w,h);
    else if(tool==='circle'){ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);ctx.stroke();}
    else if(tool==='arrow'){
      const ang=Math.atan2(b.y-a.y,b.x-a.x),head=Math.max(12,E.size*3.2);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-head*Math.cos(ang-Math.PI/6),b.y-head*Math.sin(ang-Math.PI/6));
      ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-head*Math.cos(ang+Math.PI/6),b.y-head*Math.sin(ang+Math.PI/6));ctx.stroke();
    }
    ctx.restore();
  }
  function pointerDown(ev){
    if(!E.row)return;ev.preventDefault();E.canvas.setPointerCapture?.(ev.pointerId);E.drawing=true;E.start=point(ev);
    if(E.tool==='pencil'){pushUndo();E.ctx.save();E.ctx.strokeStyle=E.color;E.ctx.lineWidth=E.size;E.ctx.lineCap='round';E.ctx.lineJoin='round';E.ctx.beginPath();E.ctx.moveTo(E.start.x,E.start.y);}
    else if(['rect','circle','arrow'].includes(E.tool)){pushUndo();E.shapeBase=copyCanvas(E.canvas);}
    else if(E.tool==='crop'){E.cropBase=copyCanvas(E.canvas);E.cropRect=null;}
  }
  function pointerMove(ev){
    if(!E.drawing)return;ev.preventDefault();const p=point(ev);
    if(E.tool==='pencil'){E.ctx.lineTo(p.x,p.y);E.ctx.stroke();}
    else if(['rect','circle','arrow'].includes(E.tool)){
      restoreFrom(E.shapeBase);drawShape(E.ctx,E.tool,E.start,p);
    }else if(E.tool==='crop'){
      restoreFrom(E.cropBase);const x=Math.min(E.start.x,p.x),y=Math.min(E.start.y,p.y),w=Math.abs(p.x-E.start.x),h=Math.abs(p.y-E.start.y);
      E.ctx.save();E.ctx.strokeStyle='#00a3ff';E.ctx.lineWidth=Math.max(2,E.canvas.width/600);E.ctx.setLineDash([10,7]);E.ctx.strokeRect(x,y,w,h);E.ctx.restore();
      E.cropRect={x,y,w,h};
    }
  }
  function pointerUp(ev){
    if(!E.drawing)return;ev.preventDefault();E.drawing=false;
    if(E.tool==='pencil'){E.ctx.closePath();E.ctx.restore();}
    else if(E.tool==='crop'&&E.cropBase){
      restoreFrom(E.cropBase);
      if(E.cropRect){
        const r=E.cropRect;E.ctx.save();E.ctx.strokeStyle='#00a3ff';E.ctx.lineWidth=Math.max(2,E.canvas.width/600);E.ctx.setLineDash([10,7]);E.ctx.strokeRect(r.x,r.y,r.w,r.h);E.ctx.restore();
      }
    }
  }
  function applyCrop(){
    if(!E.cropRect||!E.cropBase){$v('spvPhotoEditMsg124').textContent='Pilih tool Crop lalu tarik area yang ingin dipertahankan.';return}
    const r=E.cropRect;if(r.w<20||r.h<20){$v('spvPhotoEditMsg124').textContent='Area crop terlalu kecil.';return}
    pushUndo();
    const out=document.createElement('canvas');out.width=Math.round(r.w);out.height=Math.round(r.h);
    out.getContext('2d').drawImage(E.cropBase,r.x,r.y,r.w,r.h,0,0,out.width,out.height);
    restoreFrom(out);E.cropRect=null;E.cropBase=null;$v('spvPhotoEditMsg124').textContent='';
  }

  async function blobForPath(path){
    if(typeof evidenceBlob==='function')return await evidenceBlob(path);
    const res=await fetch(SUPABASE_URL+'/storage/v1/object/authenticated/breakage-evidence/'+String(path).split('/').map(encodeURIComponent).join('/'),{headers:{apikey:PUBLIC_ANON,Authorization:'Bearer '+auth()}});
    if(!res.ok)throw new Error('Foto tidak dapat dibuka');return await res.blob();
  }
  async function openEditor(row,index,path){
    if(!isSpv())return;ensureModal();
    E.row=row;E.index=index;E.path=path;E.undo=[];E.cropRect=null;E.cropBase=null;E.shapeBase=null;
    $v('spvPhotoEditMsg124').textContent='Memuat foto…';$v('spvPhotoEditModal124').classList.add('show');$v('spvPhotoEditModal124').setAttribute('aria-hidden','false');
    try{
      const blob=await blobForPath(path),url=URL.createObjectURL(blob),img=new Image();
      await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url});
      const scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));
      E.canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));E.canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));E.ctx=E.canvas.getContext('2d');
      E.ctx.drawImage(img,0,0,E.canvas.width,E.canvas.height);URL.revokeObjectURL(url);
      E.original=copyCanvas(E.canvas);$v('spvPhotoEditMsg124').textContent='';
    }catch(e){$v('spvPhotoEditMsg124').textContent='Gagal membuka foto: '+cleanErr(e?.message||e)}
  }
  function closeEditor(){
    $v('spvPhotoEditModal124')?.classList.remove('show');$v('spvPhotoEditModal124')?.setAttribute('aria-hidden','true');
    E.row=null;E.index=-1;E.path='';E.undo=[];E.original=null;E.cropRect=null;E.cropBase=null;
  }
  function canvasBlob(){
    return new Promise((resolve,reject)=>E.canvas.toBlob(b=>b?resolve(b):reject(new Error('Gagal membuat foto hasil edit')),'image/jpeg',0.86));
  }
  async function uploadEdited(blob,row,index){
    let file=new File([blob],'spv_edit.jpg',{type:'image/jpeg',lastModified:Date.now()});
    if(typeof compressEvidenceFile==='function')file=await compressEvidenceFile(file);
    const safe=String(row.rdc||ACCESS?.rdc_name||'RDC').replace(/[^A-Za-z0-9_-]/g,'_');
    const path=safe+'/spv_edit_'+Number(row.incident_id)+'_'+crypto.randomUUID()+'/'+Date.now()+'_'+(index+1)+'.jpg';
    const res=await fetch(SUPABASE_URL+'/storage/v1/object/breakage-evidence/'+path.split('/').map(encodeURIComponent).join('/'),{
      method:'POST',headers:{apikey:PUBLIC_ANON,Authorization:'Bearer '+auth(),'Content-Type':'image/jpeg','x-upsert':'false'},body:file
    });
    if(!res.ok)throw new Error('Upload foto edit gagal: '+cleanErr(await res.text()));
    return path;
  }
  async function saveEditedPhoto(){
    if(!E.row||E.index<0)return;
    const btn=$v('spvPhotoEditSave124');btn.disabled=true;$v('spvPhotoEditMsg124').textContent='Menyimpan foto hasil edit…';
    const id=Number(E.row.incident_id);
    try{
      if(E.cropRect&&E.cropBase){restoreFrom(E.cropBase);E.cropRect=null;E.cropBase=null;}
      const blob=await canvasBlob(),newPath=await uploadEdited(blob,E.row,E.index),paths=(Array.isArray(E.row.photo_paths)?[...E.row.photo_paths]:[]);
      paths[E.index]=newPath;
      const reason=String($v('reviewNote')?.value||'').trim()||'Edit/annotasi foto oleh SPV untuk penandaan area pecah Accounting';
      await rpc('breakage_incident_spv_photo_update_v124',{p_incident_id:id,p_photo_paths:paths,p_action:'EDIT',p_reason:reason});
      closeEditor();await loadHistory();await window.viewIncident(id);
    }catch(e){$v('spvPhotoEditMsg124').textContent='Gagal: '+cleanErr(e?.message||e)}
    finally{btn.disabled=false}
  }
  async function deletePhoto(row,index){
    if(!isSpv())return;
    const paths=Array.isArray(row.photo_paths)?[...row.photo_paths]:[];
    if(paths.length<=1){alert('Minimal 1 foto evidence wajib tersisa. Foto terakhir tidak dapat dihapus.');return}
    if(!confirm('Hapus Foto '+(index+1)+' dari incident ini? Foto original tetap tersimpan untuk audit trail.'))return;
    const id=Number(row.incident_id);paths.splice(index,1);
    const msg=$v('reviewMsg');if(msg)msg.textContent='Menghapus foto dari incident…';
    try{
      const reason=String($v('reviewNote')?.value||'').trim()||'Hapus foto evidence oleh SPV untuk koreksi lampiran Accounting';
      await rpc('breakage_incident_spv_photo_update_v124',{p_incident_id:id,p_photo_paths:paths,p_action:'DELETE',p_reason:reason});
      await loadHistory();await window.viewIncident(id);
    }catch(e){if(msg)msg.textContent='Hapus foto gagal: '+cleanErr(e?.message||e)}
  }

  function canEditPhoto(row){
    const st=up(row?.status);return isSpv()&&['DRAFT','WAITING_SPV','RETURNED_ADMIN','APPROVED_SPV'].includes(st);
  }
  function decorate(row){
    const box=$v('reviewPhotos');if(!box||!row)return;
    box.classList.add('spv-photo-grid124');
    if(!canEditPhoto(row))return;
    const paths=Array.isArray(row.photo_paths)?row.photo_paths.filter(Boolean):[];
    const items=[...box.children];
    items.forEach((node,i)=>{
      if(i>=paths.length||node.closest?.('.spv-photo-card124'))return;
      const card=document.createElement('div');card.className='spv-photo-card124';
      node.replaceWith(card);card.appendChild(node);
      const actions=document.createElement('div');actions.className='spv-photo-actions124';
      actions.innerHTML='<button type="button">✎ Edit Foto</button><button type="button" class="danger124">Hapus Foto</button>';
      actions.children[0].onclick=()=>openEditor(row,i,paths[i]);
      actions.children[1].onclick=()=>deletePhoto(row,i);
      card.appendChild(actions);
    });
    const rule=$v('evidenceRule');if(rule)rule.insertAdjacentHTML('beforeend','<br><b>SPV Foto:</b> Edit untuk crop/penandaan Accounting; hapus diperbolehkan selama minimal 1 foto tersisa.');
  }

  ensureModal();

  try{
    const baseView=window.viewIncident||viewIncident;
    const wrapped=async function(id){
      const result=await baseView.apply(this,arguments);
      const row=(Array.isArray(INCIDENTS)?INCIDENTS:[]).find(x=>Number(x.incident_id)===Number(id));
      setTimeout(()=>decorate(row),0);
      return result;
    };
    window.viewIncident=wrapped;viewIncident=wrapped;
  }catch(_){}

  try{
    const baseCorrection=window.correctionHtml||correctionHtml;
    const wrappedCorrection=function(r){
      return String(baseCorrection.apply(this,arguments)).replace(
        'No BA dan foto tidak diubah di sini. Jika foto salah, Kembalikan ke Admin.',
        'No BA tidak diubah di sini. Foto dapat diedit, ditandai, atau dihapus oleh SPV melalui bagian Foto Bukti.'
      );
    };
    window.correctionHtml=wrappedCorrection;correctionHtml=wrappedCorrection;
  }catch(_){}

  [100,400,1000].forEach(ms=>setTimeout(()=>{ensureModal();const b=$v('buildBadge');if(b)b.textContent='v124';},ms));
  window.__SLS_SPV_PHOTO_EDITOR='v124';
})();