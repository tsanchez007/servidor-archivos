const fs = require('fs');
const path = require('path');
const BASE = 'C:\\Users\\taulio\\Documents\\GitHub\\servidor-archivos';
const PUBLIC = path.join(BASE, 'public');
// ─── 1. PERMISOS.JSON helper (server additions) ───────────────────────────────
const newServer = `const express=require("express");const path=require("path");const fs=require("fs");const crypto=require("crypto");const app=express();const PORT=3000;const BASE_DIR="C:\\\\Users\\\\taulio\\\\Documents\\\\GitHub\\\\clau";const DB_FILE=path.join(__dirname,"links.json");const PERMS_FILE=path.join(__dirname,"perms.json");const ADMIN_PASSWORD="admin123";if(fs.existsSync(BASE_DIR)===false)fs.mkdirSync(BASE_DIR,{recursive:true});function loadLinks(){if(fs.existsSync(DB_FILE)===false)return{};return JSON.parse(fs.readFileSync(DB_FILE,"utf8"));}function saveLinks(l){fs.writeFileSync(DB_FILE,JSON.stringify(l,null,2));}function loadPerms(){if(fs.existsSync(PERMS_FILE)===false)return{};return JSON.parse(fs.readFileSync(PERMS_FILE,"utf8"));}function savePerms(p){fs.writeFileSync(PERMS_FILE,JSON.stringify(p,null,2));}function auth(req){return(req.query.password||(req.body&&req.body.password))===ADMIN_PASSWORD;}app.use(express.json());app.use(express.static(path.join(__dirname,"public")));app.post("/api/login",(req,res)=>{res.json({ok:req.body.password===ADMIN_PASSWORD});});app.get("/api/clients",(req,res)=>{if(auth(req)===false)return res.status(401).json({});const clients=fs.readdirSync(BASE_DIR).filter(n=>fs.statSync(path.join(BASE_DIR,n)).isDirectory()).map(name=>{const dir=path.join(BASE_DIR,name);const files=fs.readdirSync(dir).filter(f=>fs.statSync(path.join(dir,f)).isFile());return{name,fileCount:files.length};});res.json(clients);});app.post("/api/clients",(req,res)=>{if(auth(req)===false)return res.status(401).json({});const name=req.body.name;if(!name)return res.status(400).json({error:"Nombre invalido"});const dir=path.join(BASE_DIR,name);if(fs.existsSync(dir))return res.status(409).json({error:"Ya existe"});fs.mkdirSync(dir);res.json({ok:true,name});});app.delete("/api/clients/:name",(req,res)=>{if(auth(req)===false)return res.status(401).json({});const dir=path.join(BASE_DIR,req.params.name);if(fs.existsSync(dir)===false)return res.status(404).json({});fs.rmSync(dir,{recursive:true});res.json({ok:true});});app.get("/api/clients/:name/files",(req,res)=>{if(auth(req)===false)return res.status(401).json({});const dir=path.join(BASE_DIR,req.params.name);if(fs.existsSync(dir)===false)return res.status(404).json({});const files=fs.readdirSync(dir).filter(f=>fs.statSync(path.join(dir,f)).isFile()).map(name=>{const s=fs.statSync(path.join(dir,name));return{name,size:s.size};});res.json(files);});app.post("/api/create-link",(req,res)=>{if(auth(req)===false)return res.status(401).json({});const client=req.body.client;const filename=req.body.filename;const label=req.body.label;const expiresIn=req.body.expiresIn;const fp=path.join(BASE_DIR,client,filename);if(fs.existsSync(fp)===false)return res.status(404).json({error:"No encontrado"});const token=crypto.randomBytes(16).toString("hex");const links=loadLinks();links[token]={client,filename,label:label||filename,created:new Date().toISOString(),expiresAt:expiresIn?new Date(Date.now()+expiresIn*1000).toISOString():null,downloads:0};saveLinks(links);res.json({token,url:"/d/"+token});});app.get("/api/links",(req,res)=>{if(auth(req)===false)return res.status(401).json({});const client=req.query.client;const links=loadLinks();if(client){const f={};Object.entries(links).forEach(function(e){if(e[1].client===client)f[e[0]]=e[1];});return res.json(f);}res.json(links);});app.delete("/api/links/:token",(req,res)=>{if(auth(req)===false)return res.status(401).json({});const l=loadLinks();delete l[req.params.token];saveLinks(l);res.json({ok:true});});app.get("/d/:token",(req,res)=>{res.sendFile(path.join(__dirname,"public","download.html"));});app.get("/api/link/:token",(req,res)=>{const l=loadLinks();const link=l[req.params.token];if(link===undefined)return res.status(404).json({error:"Link no valido"});if(link.expiresAt&&new Date()>new Date(link.expiresAt))return res.status(410).json({error:"Expirado"});const fp=path.join(BASE_DIR,link.client,link.filename);const s=fs.existsSync(fp)?fs.statSync(fp):null;res.json({label:link.label,filename:link.filename,size:s?s.size:0,downloads:link.downloads,expiresAt:link.expiresAt});});app.get("/api/download/:token",(req,res)=>{const l=loadLinks();const link=l[req.params.token];if(link===undefined)return res.status(404).send("No valido");if(link.expiresAt&&new Date()>new Date(link.expiresAt))return res.status(410).send("Expirado");const fp=path.join(BASE_DIR,link.client,link.filename);if(fs.existsSync(fp)===false)return res.status(404).send("No encontrado");link.downloads++;saveLinks(l);res.download(fp,link.filename);});
/* PERMISOS */
app.get("/api/perms/:client",(req,res)=>{if(auth(req)===false)return res.status(401).json({});const p=loadPerms();res.json(p[req.params.client]||{});});
app.post("/api/perms/:client",(req,res)=>{if(auth(req)===false)return res.status(401).json({});const p=loadPerms();p[req.params.client]=req.body.perms;savePerms(p);res.json({ok:true});});
/* PORTAL CLIENTE - archivos con permisos */
app.get("/api/portal/:client",(req,res)=>{const client=req.params.client;const dir=path.join(BASE_DIR,client);if(fs.existsSync(dir)===false)return res.status(404).json({error:"No encontrado"});const p=loadPerms();const clientPerms=p[client]||{};const files=fs.readdirSync(dir).filter(f=>fs.statSync(path.join(dir,f)).isFile()).map(name=>{const s=fs.statSync(path.join(dir,name));return{name,size:s.size,canDownload:clientPerms[name]===true};});res.json({client,files});});
app.get("/api/portal-file/:client/:filename",(req,res)=>{const fp=path.join(BASE_DIR,req.params.client,req.params.filename);if(fs.existsSync(fp)===false)return res.status(404).send("No encontrado");res.sendFile(fp);});
app.get("/api/portal-download/:client/:filename",(req,res)=>{const client=req.params.client;const filename=req.params.filename;const p=loadPerms();const clientPerms=p[client]||{};if(clientPerms[filename]!==true)return res.status(403).send("Sin permiso");const fp=path.join(BASE_DIR,client,filename);if(fs.existsSync(fp)===false)return res.status(404).send("No encontrado");res.download(fp,filename);});
app.get("/p/:client",(req,res)=>{res.sendFile(path.join(__dirname,"public","portal.html"));});
app.listen(PORT,function(){console.log("Servidor en http://localhost:"+PORT);});`;
// ─── 2. ADMIN-PERMISOS.HTML ───────────────────────────────────────────────────
const permisosHtml = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Permisos — Mi Nube</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
 --bg:#0a0a0f;--surface:#111118;--border:#22222e;--border2:#2a2a38;
 --accent:#6c63ff;--accent2:#a78bfa;--text:#e8e8f0;--muted:#6b6b80;
 --red:#ff6584;--green:#4ade80;
}
body{background:var(--bg);color:var(--text);font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh}
#login{display:flex;align-items:center;justify-content:center;min-height:100vh;
 background:radial-gradient(ellipse 60% 60% at 50% 40%,rgba(108,99,255,.12) 0%,transparent 70%)}
.box{background:var(--surface);border:1px solid var(--border2);border-radius:18px;
 padding:42px 36px;width:340px;box-shadow:0 24px 64px rgba(0,0,0,.5)}
.box h1{font-size:1.5rem;font-weight:800;letter-spacing:-.03em;margin-bottom:4px}
.box .sub{color:var(--muted);font-size:.83rem;margin-bottom:22px}
input,select{width:100%;background:rgba(255,255,255,.04);border:1px solid var(--border2);
 border-radius:9px;padding:11px 13px;color:var(--text);font-size:.88rem;
 outline:none;margin-bottom:11px;transition:border .2s}
input:focus{border-color:var(--accent)}
.btn{background:var(--accent);border:none;border-radius:9px;padding:12px;
 color:#fff;font-size:.9rem;font-weight:700;cursor:pointer;width:100%;
 transition:background .2s,transform .1s}
.btn:hover{background:#7c75ff}.btn:active{transform:scale(.98)}
.btn-sm{width:auto;padding:7px 14px;font-size:.76rem}
.btn-out{background:transparent;color:var(--accent);border:1px solid var(--accent)}
.btn-out:hover{background:var(--accent);color:#fff}
.btn-red{background:transparent;color:var(--red);border:1px solid var(--red);width:auto;padding:7px 14px;font-size:.76rem}
.btn-red:hover{background:var(--red);color:#fff}
.btn-green{background:transparent;color:var(--green);border:1px solid var(--green);width:auto;padding:7px 14px;font-size:.76rem}
.btn-green:hover{background:var(--green);color:#051a0a}
.err{color:var(--red);font-size:.76rem;margin-top:6px;min-height:18px}
#app{display:none;max-width:860px;margin:0 auto;padding:28px 20px}
.topbar{display:flex;align-items:center;gap:14px;margin-bottom:24px;flex-wrap:wrap}
.topbar h1{font-size:1.3rem;font-weight:800;letter-spacing:-.02em;flex:1}
.card{background:var(--surface);border:1px solid var(--border);border-radius:14px;margin-bottom:18px;overflow:hidden}
.ch{padding:13px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;
 justify-content:space-between;font-size:.82rem;font-weight:700;gap:8px;flex-wrap:wrap}
.cb{padding:18px}
select{margin-bottom:0}
.fi-row{display:flex;align-items:center;gap:12px;padding:11px 14px;
 border-radius:10px;margin-bottom:6px;background:rgba(255,255,255,.025);
 border:1px solid var(--border);transition:border .15s}
.fi-row:hover{border-color:var(--border2)}
.fi-icon{font-size:1.2rem;width:26px;text-align:center;flex-shrink:0}
.fi-name{flex:1;font-size:.83rem;font-weight:600;word-break:break-all}
.fi-size{font-size:.68rem;color:var(--muted);flex-shrink:0}
/* Toggle */
.tog{position:relative;width:44px;height:24px;flex-shrink:0}
.tog input{opacity:0;width:0;height:0}
.tslider{position:absolute;inset:0;background:#333;border-radius:24px;
 cursor:pointer;transition:background .2s}
.tslider:before{content:'';position:absolute;width:18px;height:18px;
 left:3px;top:3px;background:#fff;border-radius:50%;transition:transform .2s}
.tog input:checked+.tslider{background:var(--green)}
.tog input:checked+.tslider:before{transform:translateX(20px)}
.empty{color:var(--muted);font-size:.83rem;text-align:center;padding:24px}
.portal-url{background:var(--bg);border:1px solid var(--border2);border-radius:8px;
 padding:9px 13px;font-size:.72rem;color:var(--accent);word-break:break-all;
 font-family:monospace;cursor:pointer;margin-top:10px;transition:border .15s}
.portal-url:hover{border-color:var(--accent)}
/* Save bar */
#savebar{position:fixed;bottom:0;left:0;right:0;background:var(--surface);
 border-top:1px solid var(--accent);padding:12px 20px;
 display:none;align-items:center;justify-content:space-between;
 box-shadow:0 -8px 32px rgba(108,99,255,.2);z-index:100}
#savebar.show{display:flex}
#savebar p{font-size:.83rem;color:var(--accent2)}
#toast{position:fixed;bottom:70px;right:22px;background:var(--green);
 color:#051a0a;padding:11px 18px;border-radius:9px;font-size:.82rem;
 font-weight:700;transform:translateY(70px);opacity:0;
 transition:all .3s cubic-bezier(.34,1.56,.64,1);z-index:9999}
#toast.show{transform:translateY(0);opacity:1}
</style>
</head>
<body>
<div id="login">
 <div class="box">
 <h1> Permisos</h1>
 <p class="sub">Panel de control de acceso</p>
 <input type="password" id="pwd" placeholder="Contraseña" autocomplete="current-password">
 <button class="btn" id="btnlogin">Entrar</button>
 <p class="err" id="lerr"></p>
 </div>
</div>
<div id="app">
 <div class="topbar">
 <h1> Permisos de descarga</h1>
 <a href="/admin.html" class="btn btn-sm btn-out">← Admin</a>
 </div>
 <div class="card">
 <div class="ch">
 <span> Cliente</span>
 </div>
 <div class="cb">
 <select id="clientSel"><option value="">— Selecciona cliente —</option></select>
 </div>
 </div>
 <div id="clientPanel" style="display:none">
 <div class="card">
 <div class="ch">
 <span id="panelTitle">Archivos</span>
 <div style="display:flex;gap:8px">
 <button class="btn btn-green btn-sm" id="btnAll"> Habilitar todos</button>
 <button class="btn btn-red btn-sm" id="btnNone"> Bloquear todos</button>
 </div>
 </div>
 <div class="cb">
 <div id="fileList"><p class="empty">Cargando...</p></div>
 <div id="portalWrap" style="display:none">
 <p style="font-size:.72rem;color:var(--muted);margin-top:14px;margin-bottom:4px"> URL del portal del cliente:</p>
 <div class="portal-url" id="portalUrl"></div>
 </div>
 </div>
 </div>
 </div>
</div>
<div id="savebar">
 <p> Cambios pendientes sin guardar</p>
 <button class="btn btn-sm" id="btnSave"> Guardar cambios</button>
</div>
<div id="toast"></div>
<script>
var pwd, curClient, perms = {}, dirty = false;
function $(id){ return document.getElementById(id); }
function toast(msg){
 var t=$('toast'); t.textContent=msg; t.className='show';
 clearTimeout(t._t); t._t=setTimeout(function(){ t.className=''; },2600);
}
function api(url,opts){ return fetch(url,opts).then(function(r){return r.json();}); }
function fmtSize(b){
 if(b<1024)return b+' B';
 if(b<1048576)return (b/1024).toFixed(1)+' KB';
 if(b<1073741824)return (b/1048576).toFixed(1)+' MB';
 return (b/1073741824).toFixed(2)+' GB';
}
function fileIcon(name){
 var ext=(name.split('.').pop()||'').toLowerCase();
 return {pdf:' ',zip:' ',rar:' ',jpg:' ',jpeg:' ',png:' ',gif:' ',webp:' ',
 mp4:' ',mov:' ',avi:' ',mp3:' ',wav:' ',doc:' ',docx:' ',
 xls:' ',xlsx:' ',ppt:' ',pptx:' ',txt:' '}[ext]||' ';
}
$('btnlogin').addEventListener('click',function(){
 var p=$('pwd').value; if(!p)return;
 api('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:p})})
 .then(function(d){
 if(d.ok){ pwd=p; $('login').style.display='none'; $('app').style.display='block'; loadClients(); }
 else $('lerr').textContent='Contraseña incorrecta';
 });
});
$('pwd').addEventListener('keydown',function(e){ if(e.key==='Enter')$('btnlogin').click(); });
function loadClients(){
 api('/api/clients?password='+pwd).then(function(clients){
 var sel=$('clientSel');
 sel.innerHTML='<option value="">— Selecciona cliente —</option>';
 if(!Array.isArray(clients))return;
 clients.forEach(function(c){
 var o=document.createElement('option'); o.value=c.name; o.textContent=c.name+' ('+c.fileCount+' archivos)';
 sel.appendChild(o);
 });
 });
}
$('clientSel').addEventListener('change',function(){
 var name=this.value;
 if(!name){ $('clientPanel').style.display='none'; return; }
 curClient=name;
 $('clientPanel').style.display='block';
 $('panelTitle').textContent='Archivos de '+name;
 var url=location.origin+'/p/'+name;
 $('portalUrl').textContent=url;
 $('portalUrl').onclick=function(){ navigator.clipboard.writeText(url); toast(' URL copiada'); };
 $('portalWrap').style.display='block';
 loadFiles();
});
function loadFiles(){
 Promise.all([
 api('/api/clients/'+curClient+'/files?password='+pwd),
 api('/api/perms/'+curClient+'?password='+pwd)
 ]).then(function(res){
 var files=res[0]; perms=res[1]||{};
 var el=$('fileList');
 if(!Array.isArray(files)||!files.length){
 el.innerHTML='<p class="empty">Sin archivos en esta carpeta</p>'; return;
 }
 el.innerHTML=files.map(function(f){
 var checked=perms[f.name]===true?'checked':'';
 return '<div class="fi-row">'
 +'<span class="fi-icon">'+fileIcon(f.name)+'</span>'
 +'<span class="fi-name">'+f.name+'</span>'
 +'<span class="fi-size">'+fmtSize(f.size)+'</span>'
 +'<label class="tog"><input type="checkbox" data-file="'+f.name+'" '+checked+'><span class="tslider"></span></label>'
 +'</div>';
 }).join('');
 el.querySelectorAll('input[type=checkbox]').forEach(function(cb){
 cb.addEventListener('change',function(){
 perms[cb.dataset.file]=cb.checked;
 dirty=true; $('savebar').className='show';
 });
 });
 dirty=false; $('savebar').className='';
 });
}
$('btnAll').addEventListener('click',function(){
 document.querySelectorAll('#fileList input[type=checkbox]').forEach(function(cb){
 cb.checked=true; perms[cb.dataset.file]=true;
 });
 dirty=true; $('savebar').className='show';
});
$('btnNone').addEventListener('click',function(){
 document.querySelectorAll('#fileList input[type=checkbox]').forEach(function(cb){
 cb.checked=false; perms[cb.dataset.file]=false;
 });
 dirty=true; $('savebar').className='show';
});
$('btnSave').addEventListener('click',function(){
 api('/api/perms/'+curClient,{
 method:'POST',
 headers:{'Content-Type':'application/json'},
 body:JSON.stringify({password:pwd,perms:perms})
 }).then(function(d){
 if(d.ok){ dirty=false; $('savebar').className=''; toast(' Permisos guardados'); }
 });
});
</script>
</body>
</html>`;
// ─── 3. PORTAL.HTML ────────────────────────────────────────────────────────────
const portalHtml = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mi Nube — Portal</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
 --bg:#07080d;--surface:#0e0f17;--surface2:#13141f;--border:#1e1f2e;
 --accent:#818cf8;--accent2:#c4b5fd;--text:#eef0f8;--muted:#555771;
 --green:#34d399;--red:#f87171;--amber:#fbbf24;
}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',system-ui,sans-serif;min-height:100vh;overflow-x:hidden}
/* BG mesh */
body::before{content:'';position:fixed;inset:0;
 background:radial-gradient(ellipse 80% 50% at 20% 10%,rgba(129,140,248,.06) 0%,transparent 60%),
 radial-gradient(ellipse 60% 40% at 80% 80%,rgba(196,181,253,.04) 0%,transparent 60%);
 pointer-events:none;z-index:0}
/* HEADER */
header{position:relative;z-index:1;padding:28px 32px 0;display:flex;align-items:center;gap:14px}
.logo-ring{width:44px;height:44px;border-radius:13px;
 background:linear-gradient(135deg,var(--accent),var(--accent2));
 display:flex;align-items:center;justify-content:center;font-size:1.3rem;
 box-shadow:0 0 24px rgba(129,140,248,.3)}
.htext h1{font-size:1.05rem;font-weight:700;letter-spacing:-.02em}
.htext p{font-size:.72rem;color:var(--muted)}
/* MAIN */
main{position:relative;z-index:1;max-width:1100px;margin:0 auto;padding:32px 20px 80px}
.section-label{font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;
 color:var(--muted);margin-bottom:14px;font-family:'DM Mono',monospace}
/* GRID */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
/* CARD */
.fcard{background:var(--surface);border:1px solid var(--border);
 border-radius:16px;overflow:hidden;cursor:pointer;
 transition:border-color .2s,transform .2s,box-shadow .2s;position:relative}
.fcard:hover{border-color:rgba(129,140,248,.4);transform:translateY(-3px);
 box-shadow:0 12px 40px rgba(0,0,0,.4)}
.fcard.locked{opacity:.75}
/* PREVIEW AREA */
.prev{height:160px;background:var(--surface2);display:flex;align-items:center;
 justify-content:center;overflow:hidden;position:relative}
.prev img{width:100%;height:100%;object-fit:cover;transition:transform .3s}
.fcard:hover .prev img{transform:scale(1.04)}
.prev video{width:100%;height:100%;object-fit:cover}
.prev .big-icon{font-size:3rem;opacity:.5}
.prev-pdf{width:100%;height:100%;border:none}
/* INFO */
.finfo{padding:12px 14px}
.fname{font-size:.82rem;font-weight:600;white-space:nowrap;overflow:hidden;
 text-overflow:ellipsis;margin-bottom:4px}
.fmeta{display:flex;align-items:center;justify-content:space-between;gap:6px}
.fsize{font-size:.67rem;color:var(--muted);font-family:'DM Mono',monospace}
.dl-btn{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:7px;
 font-size:.7rem;font-weight:600;border:none;cursor:pointer;transition:all .15s;text-decoration:none}
.dl-btn.yes{background:rgba(52,211,153,.12);color:var(--green);border:1px solid rgba(52,211,153,.3)}
.dl-btn.yes:hover{background:rgba(52,211,153,.22);border-color:var(--green)}
.dl-btn.no{background:rgba(248,113,113,.08);color:var(--red);border:1px solid rgba(248,113,113,.2);cursor:default}
/* MODAL */
#modal{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;padding:20px}
#modal.open{display:flex}
.modal-bg{position:absolute;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(8px)}
.modal-box{position:relative;z-index:1;background:var(--surface);border:1px solid var(--border);
 border-radius:20px;width:100%;max-width:860px;max-height:90vh;overflow:hidden;
 display:flex;flex-direction:column;box-shadow:0 40px 100px rgba(0,0,0,.7)}
.modal-head{padding:16px 20px;border-bottom:1px solid var(--border);
 display:flex;align-items:center;gap:12px}
.modal-head .icon{font-size:1.4rem}
.modal-head h2{flex:1;font-size:.95rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.modal-close{background:rgba(255,255,255,.06);border:none;width:32px;height:32px;
 border-radius:8px;color:var(--text);font-size:1.1rem;cursor:pointer;
 display:flex;align-items:center;justify-content:center;transition:background .15s}
.modal-close:hover{background:rgba(255,255,255,.12)}
.modal-body{flex:1;overflow:auto;display:flex;align-items:center;justify-content:center;background:var(--bg);min-height:300px}
.modal-body img{max-width:100%;max-height:75vh;object-fit:contain;display:block}
.modal-body video{max-width:100%;max-height:75vh}
.modal-body iframe{width:100%;height:70vh;border:none}
.modal-body .no-prev{color:var(--muted);font-size:.85rem;text-align:center;padding:40px}
.modal-foot{padding:14px 20px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.modal-foot .meta{font-size:.72rem;color:var(--muted);font-family:'DM Mono',monospace}
.dl-btn-lg{display:flex;align-items:center;gap:8px;padding:10px 20px;border-radius:10px;
 font-size:.85rem;font-weight:700;border:none;cursor:pointer;text-decoration:none;transition:all .2s}
.dl-btn-lg.yes{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;box-shadow:0 4px 20px rgba(129,140,248,.35)}
.dl-btn-lg.yes:hover{box-shadow:0 6px 28px rgba(129,140,248,.5);transform:translateY(-1px)}
.dl-btn-lg.no{background:rgba(248,113,113,.1);color:var(--red);border:1px solid rgba(248,113,113,.3);cursor:default}
/* Loading / empty */
.loading{display:flex;align-items:center;justify-content:center;height:60vh;color:var(--muted);flex-direction:column;gap:12px}
.spinner{width:32px;height:32px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.empty-state{text-align:center;padding:60px 20px;color:var(--muted)}
.empty-state .big{font-size:3rem;margin-bottom:12px}
</style>
</head>
<body>
<header>
 <div class="logo-ring"> </div>
 <div class="htext">
 <h1 id="clientName">Mi Nube</h1>
 <p id="clientSub">Portal de archivos</p>
 </div>
</header>
<main>
 <div id="loadingState" class="loading">
 <div class="spinner"></div>
 <span>Cargando archivos...</span>
 </div>
 <div id="content" style="display:none">
 <p class="section-label" id="fileCount"></p>
 <div class="grid" id="grid"></div>
 </div>
 <div id="emptyState" class="empty-state" style="display:none">
 <div class="big"> </div>
 <p>No hay archivos disponibles aún</p>
 </div>
</main>
<!-- MODAL -->
<div id="modal">
 <div class="modal-bg" id="modalBg"></div>
 <div class="modal-box">
 <div class="modal-head">
 <span class="icon" id="mIcon"> </span>
 <h2 id="mTitle"></h2>
 <button class="modal-close" id="modalClose">✕</button>
 </div>
 <div class="modal-body" id="mBody"></div>
 <div class="modal-foot">
 <span class="meta" id="mMeta"></span>
 <a id="mDlBtn" class="dl-btn-lg no" href="#"> Sin permiso de descarga</a>
 </div>
 </div>
</div>
<script>
var client = location.pathname.split('/').pop();
var files = [];
function fmtSize(b){
 if(!b)return '';
 if(b<1024)return b+' B';
 if(b<1048576)return (b/1024).toFixed(1)+' KB';
 if(b<1073741824)return (b/1048576).toFixed(1)+' MB';
 return (b/1073741824).toFixed(2)+' GB';
}
function fileType(name){
 var ext=(name.split('.').pop()||'').toLowerCase();
 if(['jpg','jpeg','png','gif','webp','bmp','svg'].includes(ext))return 'image';
 if(['mp4','mov','avi','webm','mkv'].includes(ext))return 'video';
 if(ext==='pdf')return 'pdf';
 if(['mp3','wav','ogg','aac','flac'].includes(ext))return 'audio';
 return 'other';
}
function fileIcon(name){
 var t=fileType(name);
 return {image:' ',video:' ',pdf:' ',audio:' ',other:' '}[t];
}
function fileUrl(name){
 return '/api/portal-file/'+encodeURIComponent(client)+'/'+encodeURIComponent(name);
}
function dlUrl(name){
 return '/api/portal-download/'+encodeURIComponent(client)+'/'+encodeURIComponent(name);
}
function buildPreview(f){
 var t=fileType(f.name);
 var url=fileUrl(f.name);
 if(t==='image')return '<img src="'+url+'" alt="'+f.name+'" loading="lazy">';
 if(t==='video')return '<video src="'+url+'" muted preload="metadata"></video>';
 if(t==='pdf')return '<div class="big-icon"> </div>';
 if(t==='audio')return '<div class="big-icon"> </div>';
 return '<div class="big-icon">'+fileIcon(f.name)+'</div>';
}
function renderGrid(data){
 files=data.files||[];
 document.getElementById('clientName').textContent=data.client;
 document.getElementById('clientSub').textContent='Portal de archivos privado';
 document.title='Mi Nube — '+data.client;
 if(!files.length){
 document.getElementById('loadingState').style.display='none';
 document.getElementById('emptyState').style.display='block';
 return;
 }
 document.getElementById('fileCount').textContent=files.length+' archivo'+(files.length===1?'':'s');
 var grid=document.getElementById('grid');
 grid.innerHTML=files.map(function(f,i){
 return '<div class="fcard'+(f.canDownload?'':' locked')+'" data-i="'+i+'">'
 +'<div class="prev">'+buildPreview(f)+'</div>'
 +'<div class="finfo">'
 +'<div class="fname" title="'+f.name+'">'+f.name+'</div>'
 +'<div class="fmeta">'
 +'<span class="fsize">'+fmtSize(f.size)+'</span>'
 +(f.canDownload
 ?'<a class="dl-btn yes" href="'+dlUrl(f.name)+'" download onclick="event.stopPropagation()"> Descargar</a>'
 :'<span class="dl-btn no"> Solo vista</span>')
 +'</div></div></div>';
 }).join('');
 grid.querySelectorAll('.fcard').forEach(function(el){
 el.addEventListener('click',function(){ openModal(parseInt(el.dataset.i)); });
 });
 document.getElementById('loadingState').style.display='none';
 document.getElementById('content').style.display='block';
}
function openModal(i){
 var f=files[i];
 var t=fileType(f.name);
 var url=fileUrl(f.name);
 document.getElementById('mIcon').textContent=fileIcon(f.name);
 document.getElementById('mTitle').textContent=f.name;
 document.getElementById('mMeta').textContent=fmtSize(f.size);
 var body=document.getElementById('mBody');
 if(t==='image'){
 body.innerHTML='<img src="'+url+'" alt="'+f.name+'">';
 } else if(t==='video'){
 body.innerHTML='<video src="'+url+'" controls autoplay style="max-width:100%;max-height:75vh"></video>';
 } else if(t==='pdf'){
 body.innerHTML='<iframe src="'+url+'" title="'+f.name+'"></iframe>';
 } else if(t==='audio'){
 body.innerHTML='<div style="padding:40px;text-align:center"><div style="font-size:4rem;margin-bottom:16px"> </div><audio src="'+url+'" controls style="width:100%;max-width:400px"></audio></div>';
 } else {
 body.innerHTML='<div class="no-prev"><div style="font-size:3rem;margin-bottom:12px"> </div><p>Vista previa no disponible para este tipo de archivo</p></div>';
 }
 var dlBtn=document.getElementById('mDlBtn');
 if(f.canDownload){
 dlBtn.className='dl-btn-lg yes';
 dlBtn.textContent=' Descargar archivo';
 dlBtn.href=dlUrl(f.name);
 dlBtn.setAttribute('download','');
 } else {
 dlBtn.className='dl-btn-lg no';
 dlBtn.textContent=' Sin permiso de descarga';
 dlBtn.href='#';
 dlBtn.removeAttribute('download');
 dlBtn.onclick=function(e){ e.preventDefault(); };
 }
 document.getElementById('modal').className='open';
 document.body.style.overflow='hidden';
}
function closeModal(){
 document.getElementById('modal').className='';
 document.body.style.overflow='';
 var b=document.getElementById('mBody');
 b.innerHTML=''; // stop video/audio
}
document.getElementById('modalClose').addEventListener('click',closeModal);
document.getElementById('modalBg').addEventListener('click',closeModal);
document.addEventListener('keydown',function(e){ if(e.key==='Escape')closeModal(); });
// Load
fetch('/api/portal/'+encodeURIComponent(client))
 .then(function(r){ return r.json(); })
 .then(renderGrid)
 .catch(function(){
 document.getElementById('loadingState').style.display='none';
 document.getElementById('emptyState').style.display='block';
 });
</script>
</body>
</html>`;
// ─── WRITE FILES ──────────────────────────────────────────────────────────────
console.log('Escribiendo server.js...');
fs.writeFileSync(path.join(BASE, 'server.js'), newServer, 'utf8');
console.log(' server.js actualizado');
console.log('Escribiendo admin-permisos.html...');
fs.writeFileSync(path.join(PUBLIC, 'admin-permisos.html'), permisosHtml, 'utf8');
console.log(' admin-permisos.html creado');
console.log('Escribiendo portal.html...');
fs.writeFileSync(path.join(PUBLIC, 'portal.html'), portalHtml, 'utf8');
console.log(' portal.html creado');
console.log('');
console.log('==================================================');
console.log(' LISTO. Ejecuta: node server.js');
console.log(' Admin permisos: http://localhost:3000/admin-permisos.html');
console.log(' Portal cliente: http://localhost:3000/p/NOMBRE-CLIENTE');
console.log('==================================================');