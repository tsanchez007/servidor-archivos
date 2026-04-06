const express=require("express");const path=require("path");const fs=require("fs");const crypto=require("crypto");const os=require("os");const {spawn}=require("child_process");const http=require("http");const app=express();const PORT=3000;const BASE_DIR=path.join(__dirname,"clientes");const DB_FILE=path.join(__dirname,"links.json");const PERMS_FILE=path.join(__dirname,"perms.json");const ADMIN_PASSWORD="admin123";if(fs.existsSync(BASE_DIR)===false)fs.mkdirSync(BASE_DIR,{recursive:true});function loadLinks(){if(fs.existsSync(DB_FILE)===false)return{};return JSON.parse(fs.readFileSync(DB_FILE,"utf8"));}function saveLinks(l){fs.writeFileSync(DB_FILE,JSON.stringify(l,null,2));}function loadPerms(){if(fs.existsSync(PERMS_FILE)===false)return{};return JSON.parse(fs.readFileSync(PERMS_FILE,"utf8"));}function savePerms(p){fs.writeFileSync(PERMS_FILE,JSON.stringify(p,null,2));}function auth(req){return(req.query.password||(req.body&&req.body.password))===ADMIN_PASSWORD;}

// ── CLOUDFLARED ────────────────────────────────────────────────────
var tunnelUrl = null;
var tunnelReady = false;

function findCloudflaredBin() {
  // 1. Buscar en la carpeta del proyecto
  var local = path.join(__dirname, process.platform === "win32" ? "cloudflared.exe" : "cloudflared");
  if (fs.existsSync(local)) return local;
  // 2. Buscar en rutas comunes de Mac
  var macPaths = [
    "/opt/homebrew/bin/cloudflared",
    "/usr/local/bin/cloudflared"
  ];
  for (var i = 0; i < macPaths.length; i++) {
    if (fs.existsSync(macPaths[i])) return macPaths[i];
  }
  // 3. Intentar con el comando del sistema (en PATH)
  return "cloudflared";
}

function startNgrok() {
  if (tunnelReady) return;
  var bin = findCloudflaredBin();
  console.log("[cloudflared] Usando binario: " + bin);
  console.log("[cloudflared] Iniciando tunel en puerto " + PORT + "...");

  var proc = spawn(bin, ["tunnel", "--url", "http://localhost:" + PORT], {
    detached: false
  });

  proc.stdout.on("data", function(d) {
    var msg = d.toString().trim();
    if (msg) console.log("[cloudflared] " + msg);
  });

  proc.stderr.on("data", function(d) {
    var msg = d.toString();
    var match = msg.match(/https:\/\/[a-z0-9\-]+\.trycloudflare\.com/);
    if (match && !tunnelReady) {
      tunnelUrl = match[0];
      tunnelReady = true;
      console.log("[cloudflared] Tunel listo: " + tunnelUrl);
    }
  });

  proc.on("error", function(e) {
    console.error("[cloudflared] No se pudo iniciar: " + e.message);
  });

  proc.on("exit", function(code) {
    if (code !== 0 && code !== null) {
      console.error("[cloudflared] Proceso termino con codigo " + code);
    }
  });
}

// Endpoint: return current tunnel URL
app.get("/api/ngrok-url", function(req, res) {
  if (!auth(req)) return res.status(401).json({});
  res.json({ url: tunnelUrl, ready: tunnelReady });
});

// Endpoint: start tunnel on demand
app.post("/api/start-ngrok", function(req, res) {
  if (!auth(req)) return res.status(401).json({});
  if (tunnelReady) return res.json({ ok: true, already: true });
  startNgrok();
  res.json({ ok: true, started: true });
});

// ── CONFIG ────────────────────────────────────────────────────────
app.get("/api/config",(req,res)=>{if(auth(req)===false)return res.status(401).json({});res.json({baseDir:BASE_DIR});});

// ── MIDDLEWARE & STATIC ────────────────────────────────────────────
app.use(express.json());app.use(express.static(path.join(__dirname,"public")));

// ── AUTH ──────────────────────────────────────────────────────────
app.post("/api/login",(req,res)=>{res.json({ok:req.body.password===ADMIN_PASSWORD});});

// ── CLIENTS ───────────────────────────────────────────────────────
app.get("/api/clients",(req,res)=>{if(auth(req)===false)return res.status(401).json({});const clients=fs.readdirSync(BASE_DIR).filter(n=>fs.statSync(path.join(BASE_DIR,n)).isDirectory()).map(name=>{const dir=path.join(BASE_DIR,name);const files=fs.readdirSync(dir).filter(f=>fs.statSync(path.join(dir,f)).isFile());return{name,fileCount:files.length};});res.json(clients);});
app.post("/api/clients",(req,res)=>{if(auth(req)===false)return res.status(401).json({});const name=req.body.name;if(!name)return res.status(400).json({error:"Nombre invalido"});const dir=path.join(BASE_DIR,name);if(fs.existsSync(dir))return res.status(409).json({error:"Ya existe"});fs.mkdirSync(dir);res.json({ok:true,name});});
app.delete("/api/clients/:name",(req,res)=>{if(auth(req)===false)return res.status(401).json({});const dir=path.join(BASE_DIR,req.params.name);if(fs.existsSync(dir)===false)return res.status(404).json({});fs.rmSync(dir,{recursive:true});res.json({ok:true});});
app.get("/api/clients/:name/files",(req,res)=>{if(auth(req)===false)return res.status(401).json({});const dir=path.join(BASE_DIR,req.params.name);if(fs.existsSync(dir)===false)return res.status(404).json({});const files=fs.readdirSync(dir).filter(f=>fs.statSync(path.join(dir,f)).isFile()).map(name=>{const s=fs.statSync(path.join(dir,name));return{name,size:s.size};});res.json(files);});

// ── LINKS ─────────────────────────────────────────────────────────
app.post("/api/create-link",(req,res)=>{if(auth(req)===false)return res.status(401).json({});const client=req.body.client;const filename=req.body.filename;const label=req.body.label;const expiresIn=req.body.expiresIn;const fp=path.join(BASE_DIR,client,filename);if(fs.existsSync(fp)===false)return res.status(404).json({error:"No encontrado"});const token=crypto.randomBytes(16).toString("hex");const links=loadLinks();links[token]={client,filename,label:label||filename,created:new Date().toISOString(),expiresAt:expiresIn?new Date(Date.now()+expiresIn*1000).toISOString():null,downloads:0};saveLinks(links);res.json({token,url:"/d/"+token});});
app.get("/api/links",(req,res)=>{if(auth(req)===false)return res.status(401).json({});const client=req.query.client;const links=loadLinks();if(client){const f={};Object.entries(links).forEach(function(e){if(e[1].client===client)f[e[0]]=e[1];});return res.json(f);}res.json(links);});
app.delete("/api/links/:token",(req,res)=>{if(auth(req)===false)return res.status(401).json({});const l=loadLinks();delete l[req.params.token];saveLinks(l);res.json({ok:true});});

// ── DOWNLOAD ROUTES ───────────────────────────────────────────────
app.get("/d/:token",(req,res)=>{res.sendFile(path.join(__dirname,"public","download.html"));});
app.get("/api/link/:token",(req,res)=>{const l=loadLinks();const link=l[req.params.token];if(link===undefined)return res.status(404).json({error:"Link no valido"});if(link.expiresAt&&new Date()>new Date(link.expiresAt))return res.status(410).json({error:"Expirado"});const fp=path.join(BASE_DIR,link.client,link.filename);const s=fs.existsSync(fp)?fs.statSync(fp):null;res.json({label:link.label,filename:link.filename,size:s?s.size:0,downloads:link.downloads,expiresAt:link.expiresAt});});
app.get("/api/download/:token",(req,res)=>{const l=loadLinks();const link=l[req.params.token];if(link===undefined)return res.status(404).send("No valido");if(link.expiresAt&&new Date()>new Date(link.expiresAt))return res.status(410).send("Expirado");const fp=path.join(BASE_DIR,link.client,link.filename);if(fs.existsSync(fp)===false)return res.status(404).send("No encontrado");link.downloads++;saveLinks(l);res.download(fp,link.filename);});

// ── PERMISOS ──────────────────────────────────────────────────────
app.get("/api/perms/:client",(req,res)=>{if(auth(req)===false)return res.status(401).json({});const p=loadPerms();res.json(p[req.params.client]||{});});
app.post("/api/perms/:client",(req,res)=>{if(auth(req)===false)return res.status(401).json({});const p=loadPerms();p[req.params.client]=req.body.perms;savePerms(p);res.json({ok:true});});

// ── PORTAL ────────────────────────────────────────────────────────
app.get("/api/portal/:client",(req,res)=>{const client=req.params.client;const dir=path.join(BASE_DIR,client);if(fs.existsSync(dir)===false)return res.status(404).json({error:"No encontrado"});const p=loadPerms();const clientPerms=p[client]||{};const files=fs.readdirSync(dir).filter(f=>fs.statSync(path.join(dir,f)).isFile()).map(name=>{const s=fs.statSync(path.join(dir,name));return{name,size:s.size,canDownload:clientPerms[name]===true};});res.json({client,files});});
app.get("/api/portal-file/:client/:filename",(req,res)=>{const fp=path.join(BASE_DIR,req.params.client,req.params.filename);if(!fs.existsSync(fp))return res.status(404).send("No encontrado");const stat=fs.statSync(fp);const total=stat.size;const range=req.headers.range;if(range){const[s,e]=range.replace(/bytes=/,"").split("-");const start=parseInt(s,10);const end=e?parseInt(e,10):total-1;const chunksize=(end-start)+1;const file=fs.createReadStream(fp,{start,end});res.writeHead(206,{"Content-Range":"bytes "+start+"-"+end+"/"+total,"Accept-Ranges":"bytes","Content-Length":chunksize});file.pipe(res);}else{res.writeHead(200,{"Content-Length":total,"Accept-Ranges":"bytes"});fs.createReadStream(fp).pipe(res);}});;
app.get("/api/portal-download/:client/:filename",(req,res)=>{const client=req.params.client;const filename=req.params.filename;const p=loadPerms();const clientPerms=p[client]||{};if(clientPerms[filename]!==true)return res.status(403).send("Sin permiso");const fp=path.join(BASE_DIR,client,filename);if(fs.existsSync(fp)===false)return res.status(404).send("No encontrado");res.download(fp,filename);});
app.get("/p/:client",(req,res)=>{res.sendFile(path.join(__dirname,"public","portal.html"));});

// ── START ─────────────────────────────────────────────────────────
app.listen(PORT, function(){
  console.log("Servidor en http://localhost:" + PORT);
  startNgrok();
});

// ── RESTART ───────────────────────────────────────────────────────
app.post("/api/restart",(req,res)=>{if(auth(req)===false)return res.status(401).json({});res.json({ok:true});setTimeout(function(){process.exit(0);},300);});
