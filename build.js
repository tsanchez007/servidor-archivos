const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

// ─── admin.html ────────────────────────────────────────────────────────────────
const adminHtml = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mi Nube – Admin</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0a0a0f;--surface:#111118;--border:#22222e;--border2:#2a2a38;
  --accent:#6c63ff;--accent2:#a78bfa;--text:#e8e8f0;--muted:#6b6b80;
  --red:#ff6584;--green:#4ade80;
}
body{background:var(--bg);color:var(--text);font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh}

/* ── LOGIN ── */
#login{display:flex;align-items:center;justify-content:center;min-height:100vh;
  background:radial-gradient(ellipse 60% 60% at 50% 40%,rgba(108,99,255,.12) 0%,transparent 70%)}
.box{background:var(--surface);border:1px solid var(--border2);border-radius:18px;
  padding:42px 36px;width:340px;box-shadow:0 24px 64px rgba(0,0,0,.5)}
.box h1{font-size:1.5rem;font-weight:800;letter-spacing:-.03em;margin-bottom:4px}
.box .sub{color:var(--muted);font-size:.83rem;margin-bottom:22px}
input,select{width:100%;background:rgba(255,255,255,.04);border:1px solid var(--border2);
  border-radius:9px;padding:11px 13px;color:var(--text);font-size:.88rem;
  outline:none;margin-bottom:11px;transition:border .2s}
input:focus,select:focus{border-color:var(--accent)}
.btn{background:var(--accent);border:none;border-radius:9px;padding:12px;
  color:#fff;font-size:.9rem;font-weight:700;cursor:pointer;width:100%;
  transition:background .2s,transform .1s}
.btn:hover{background:#7c75ff}
.btn:active{transform:scale(.98)}
.btn-sm{width:auto;padding:6px 13px;font-size:.76rem}
.btn-out{background:transparent;color:var(--accent);border:1px solid var(--accent)}
.btn-out:hover{background:var(--accent);color:#fff}
.btn-red{background:transparent;color:var(--red);border:1px solid var(--red)}
.btn-red:hover{background:var(--red);color:#fff}
.err{color:var(--red);font-size:.76rem;margin-top:6px;min-height:18px}

/* ── APP SHELL ── */
#app{display:none;min-height:100vh}

/* ── SIDEBAR ── */
.side{position:fixed;top:0;left:0;width:258px;height:100vh;
  background:var(--surface);border-right:1px solid var(--border);
  overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:0}
.side::-webkit-scrollbar{width:4px}
.side::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
.logo{display:flex;align-items:center;gap:10px;margin-bottom:18px}
.logo-icon{width:34px;height:34px;border-radius:9px;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  display:flex;align-items:center;justify-content:center;font-size:1.1rem}
.logo-text h2{font-size:.95rem;font-weight:800;letter-spacing:-.02em}
.logo-text span{font-size:.68rem;color:var(--muted)}

.snew{background:rgba(108,99,255,.08);border:1px dashed rgba(108,99,255,.3);
  border-radius:10px;padding:14px;margin-bottom:16px}
.snew h3{font-size:.76rem;color:var(--muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:.06em}
.st{font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px}

.ci{display:flex;align-items:center;gap:9px;padding:9px 10px;
  border-radius:9px;cursor:pointer;margin-bottom:2px;transition:background .15s;border:1px solid transparent}
.ci:hover{background:rgba(255,255,255,.04)}
.ci.on{background:rgba(108,99,255,.15);border-color:rgba(108,99,255,.4)}
.av{width:31px;height:31px;border-radius:8px;flex-shrink:0;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  display:flex;align-items:center;justify-content:center;
  font-weight:800;color:#fff;font-size:.82rem}
.cn{font-size:.83rem;font-weight:600}
.cc{font-size:.67rem;color:var(--muted)}

/* ── MAIN ── */
.main{margin-left:258px;padding:26px}
.noc{display:flex;flex-direction:column;align-items:center;justify-content:center;
  height:70vh;color:var(--muted);gap:10px;text-align:center}
.noc .big{font-size:2.8rem}
.noc p{font-size:.9rem}

.topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.topbar h2{font-size:1.15rem;font-weight:800;letter-spacing:-.02em}
.path{background:rgba(255,255,255,.03);border:1px solid var(--border);
  border-radius:8px;padding:9px 13px;font-size:.71rem;color:var(--muted);
  margin-bottom:16px;word-break:break-all;font-family:monospace}

.card{background:var(--surface);border:1px solid var(--border);border-radius:13px;margin-bottom:18px}
.ch{padding:13px 17px;border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;
  font-size:.81rem;font-weight:700;letter-spacing:.01em}
.cb{padding:16px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}

/* Files */
.fi{display:flex;align-items:center;gap:9px;padding:9px 10px;
  border-radius:8px;cursor:pointer;transition:background .15s;border:1px solid transparent}
.fi:hover{background:rgba(255,255,255,.04)}
.fi.on{background:rgba(108,99,255,.15);border-color:rgba(108,99,255,.4)}
.fic{font-size:1.15rem;flex-shrink:0}
.fn{font-size:.82rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}
.fs{font-size:.67rem;color:var(--muted)}

/* Links */
.li{background:rgba(255,255,255,.025);border:1px solid var(--border);
  border-radius:9px;padding:12px;margin-bottom:8px;transition:border .15s}
.li:hover{border-color:var(--border2)}
.ll{font-size:.83rem;font-weight:700;margin-bottom:2px}
.lf{font-size:.69rem;color:var(--muted);margin-bottom:7px}
.lu{background:var(--bg);border:1px solid var(--border2);border-radius:6px;
  padding:7px 10px;font-size:.68rem;color:var(--accent);
  word-break:break-all;margin-bottom:7px;cursor:pointer;transition:border .15s}
.lu:hover{border-color:var(--accent)}
.lmeta{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.badge{border-radius:20px;padding:3px 10px;font-size:.65rem;
  border:1px solid var(--border2);color:var(--muted)}
.badge.ok{color:var(--green);border-color:var(--green)}
.badge.ex{color:var(--red);border-color:var(--red)}
.la{display:flex;gap:6px}

.empty{color:var(--muted);font-size:.82rem;text-align:center;padding:24px 0}
label{display:block;font-size:.71rem;color:var(--muted);
  text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}
.sel-file{background:rgba(108,99,255,.1);border:1px solid rgba(108,99,255,.4);
  border-radius:7px;padding:8px 12px;font-size:.79rem;color:var(--accent);margin-bottom:12px}

/* Toast */
#toast{position:fixed;bottom:22px;right:22px;background:var(--green);
  color:#051a0a;padding:11px 18px;border-radius:9px;font-size:.82rem;
  font-weight:700;transform:translateY(70px);opacity:0;
  transition:all .3s cubic-bezier(.34,1.56,.64,1);z-index:9999}
#toast.show{transform:translateY(0);opacity:1}
#toast.err{background:var(--red);color:#fff}
</style>
</head>
<body>

<!-- LOGIN -->
<div id="login">
  <div class="box">
    <h1>☁ Mi Nube</h1>
    <p class="sub">Panel de administración</p>
    <input type="password" id="pwd" placeholder="Contraseña" autocomplete="current-password">
    <button class="btn" id="btnlogin">Entrar</button>
    <p class="err" id="lerr"></p>
  </div>
</div>

<!-- APP -->
<div id="app">
  <!-- SIDEBAR -->
  <div class="side">
    <div class="logo">
      <div class="logo-icon">☁</div>
      <div class="logo-text">
        <h2>Mi Nube</h2>
        <span id="hlabel"></span>
      </div>
    </div>

    <div class="snew">
      <h3>+ Nuevo cliente</h3>
      <input type="text" id="ncn" placeholder="Nombre del cliente">
      <button class="btn" id="btnnc">Crear carpeta</button>
      <p class="err" id="cerr"></p>
    </div>

    <div class="st">Clientes</div>
    <div id="clist"></div>
  </div>

  <!-- MAIN -->
  <div class="main">
    <!-- No client selected -->
    <div class="noc" id="noc">
      <div class="big">☁</div>
      <p>Selecciona un cliente para comenzar</p>
    </div>

    <!-- Client panel -->
    <div id="cpanel" style="display:none">
      <div class="topbar">
        <h2 id="ctitle"></h2>
        <button class="btn btn-sm btn-red" id="btndel">Eliminar cliente</button>
      </div>
      <div class="path" id="cpath"></div>

      <div class="grid2">
        <!-- Archivos -->
        <div>
          <div class="card">
            <div class="ch">
              <span>📁 Archivos</span>
              <button class="btn btn-sm btn-out" id="btnrf">↺ Actualizar</button>
            </div>
            <div class="cb">
              <div id="flist"><p class="empty">Cargando...</p></div>
            </div>
          </div>

          <!-- Generar link -->
          <div class="card">
            <div class="ch">🔗 Generar link</div>
            <div class="cb">
              <div id="nosel" class="empty" style="padding:12px 0">Selecciona un archivo de arriba</div>
              <div id="lform" style="display:none">
                <div class="sel-file">📄 <span id="selname"></span></div>
                <label>Nombre del link</label>
                <input type="text" id="llabel" placeholder="ej: Propuesta Mayo 2025">
                <label>Expiración</label>
                <select id="lexp">
                  <option value="">Sin expiración</option>
                  <option value="3600">1 hora</option>
                  <option value="86400">24 horas</option>
                  <option value="604800">7 días</option>
                  <option value="2592000">30 días</option>
                </select>
                <button class="btn" id="btngl">⚡ Generar y copiar link</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Links activos -->
        <div>
          <div class="card" style="height:fit-content">
            <div class="ch">
              <span>✅ Links activos</span>
              <button class="btn btn-sm btn-out" id="btnrl">↺ Actualizar</button>
            </div>
            <div class="cb">
              <div id="llist"><p class="empty">Sin links</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div id="toast"></div>

<script>
var pwd, cur, sel, base = location.origin;
function $(id){ return document.getElementById(id); }

function toast(msg, isErr) {
  var t = $('toast');
  t.textContent = msg;
  t.className = isErr ? 'err show' : 'show';
  clearTimeout(t._t);
  t._t = setTimeout(function(){ t.className = ''; }, 2800);
}

function api(url, opts) {
  return fetch(url, opts).then(function(r){ return r.json(); });
}

function fmtSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
  if (b < 1073741824) return (b/1048576).toFixed(1) + ' MB';
  return (b/1073741824).toFixed(2) + ' GB';
}

function fileIcon(name) {
  var ext = (name.split('.').pop() || '').toLowerCase();
  return {pdf:'📄',zip:'🗜️',rar:'🗜️',jpg:'🖼️',jpeg:'🖼️',png:'🖼️',gif:'🖼️',
    mp4:'🎬',mov:'🎬',mp3:'🎵',wav:'🎵',doc:'📝',docx:'📝',
    xls:'📊',xlsx:'📊',ppt:'📋',pptx:'📋',txt:'📃'}[ext] || '📁';
}

// ── LOGIN ──────────────────────────────────────────────────────────
$('btnlogin').addEventListener('click', function(){
  var p = $('pwd').value;
  if (!p) return;
  api('/api/login', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({password: p})
  }).then(function(d){
    if (d.ok) {
      pwd = p;
      $('login').style.display = 'none';
      $('app').style.display = 'block';
      $('hlabel').textContent = base;
      loadClients();
    } else {
      $('lerr').textContent = 'Contraseña incorrecta';
    }
  });
});
$('pwd').addEventListener('keydown', function(e){
  if (e.key === 'Enter') $('btnlogin').click();
});

// ── CLIENTS ───────────────────────────────────────────────────────
function loadClients() {
  api('/api/clients?password=' + pwd).then(function(clients){
    var el = $('clist');
    if (!Array.isArray(clients) || !clients.length) {
      el.innerHTML = '<p class="empty" style="padding:10px">Sin clientes aún</p>';
      return;
    }
    el.innerHTML = clients.map(function(c){
      return '<div class="ci' + (cur===c.name?' on':'') + '" data-name="' + c.name + '">'
        + '<div class="av">' + c.name[0].toUpperCase() + '</div>'
        + '<div><div class="cn">' + c.name + '</div>'
        + '<div class="cc">' + c.fileCount + ' archivo' + (c.fileCount===1?'':'s') + '</div></div>'
        + '</div>';
    }).join('');
    el.querySelectorAll('.ci').forEach(function(el){
      el.addEventListener('click', function(){ selectClient(el.dataset.name); });
    });
  });
}

$('btnnc').addEventListener('click', function(){
  var name = $('ncn').value.trim();
  if (!name) return;
  api('/api/clients', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({password: pwd, name: name})
  }).then(function(d){
    if (d.ok) {
      $('ncn').value = '';
      $('cerr').textContent = '';
      toast('✅ Cliente "' + name + '" creado');
      loadClients();
      selectClient(name);
    } else {
      $('cerr').textContent = d.error || 'Error';
    }
  });
});

function selectClient(name) {
  cur = name; sel = null;
  $('noc').style.display = 'none';
  $('cpanel').style.display = 'block';
  $('ctitle').textContent = name;
  $('cpath').textContent = (serverBaseDir ? serverBaseDir + '/' : '') + name + '/';
  $('nosel').style.display = 'block';
  $('lform').style.display = 'none';
  loadClients();
  loadFiles();
  loadLinks();
}

$('btndel').addEventListener('click', function(){
  if (!confirm('¿Eliminar cliente "' + cur + '" y todos sus archivos?')) return;
  fetch('/api/clients/' + cur + '?password=' + pwd, {method:'DELETE'})
    .then(function(){
      cur = null;
      $('noc').style.display = 'flex';
      $('cpanel').style.display = 'none';
      loadClients();
      toast('🗑️ Cliente eliminado');
    });
});

// ── FILES ─────────────────────────────────────────────────────────
$('btnrf').addEventListener('click', loadFiles);

function loadFiles() {
  if (!cur) return;
  api('/api/clients/' + cur + '/files?password=' + pwd).then(function(files){
    var el = $('flist');
    if (!Array.isArray(files) || !files.length) {
      el.innerHTML = '<p class="empty">Sin archivos<br><small style="font-size:.7rem">Pega archivos en la carpeta del cliente</small></p>';
      return;
    }
    el.innerHTML = files.map(function(f){
      return '<div class="fi' + (sel===f.name?' on':'') + '" data-name="' + f.name.replace(/"/g,'&quot;') + '">'
        + '<span class="fic">' + fileIcon(f.name) + '</span>'
        + '<div><div class="fn" title="' + f.name + '">' + f.name + '</div>'
        + '<div class="fs">' + fmtSize(f.size) + '</div></div>'
        + '</div>';
    }).join('');
    el.querySelectorAll('.fi').forEach(function(el){
      el.addEventListener('click', function(){ selectFile(el.dataset.name); });
    });
  });
}

function selectFile(name) {
  sel = name;
  $('selname').textContent = name;
  $('nosel').style.display = 'none';
  $('lform').style.display = 'block';
  $('llabel').value = name.replace(/\.[^.]+$/, '');
  loadFiles();
}

// ── CREATE LINK ───────────────────────────────────────────────────
$('btngl').addEventListener('click', function(){
  if (!sel || !cur) return;
  var label = $('llabel').value || sel;
  var exp = $('lexp').value;
  api('/api/create-link', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({password:pwd, client:cur, filename:sel, label:label,
      expiresIn: exp ? parseInt(exp) : null})
  }).then(function(d){
    if (d.url) {
      navigator.clipboard.writeText(base + d.url).catch(function(){});
      toast('🔗 Link copiado al portapapeles');
      loadLinks();
    }
  });
});

// ── LINKS ─────────────────────────────────────────────────────────
$('btnrl').addEventListener('click', loadLinks);

function loadLinks() {
  if (!cur) return;
  api('/api/links?password=' + pwd + '&client=' + cur).then(function(links){
    var el = $('llist');
    var entries = Object.entries(links);
    if (!entries.length) {
      el.innerHTML = '<p class="empty">Sin links generados</p>';
      return;
    }
    el.innerHTML = entries.reverse().map(function(e){
      var token = e[0], link = e[1];
      var url = base + '/d/' + token;
      var expired = link.expiresAt && new Date() > new Date(link.expiresAt);
      var expLabel = link.expiresAt
        ? (expired ? 'Expirado' : 'Expira ' + new Date(link.expiresAt).toLocaleDateString('es'))
        : 'Sin expiración';
      return '<div class="li">'
        + '<div class="ll">' + link.label + '</div>'
        + '<div class="lf">📄 ' + link.filename + '</div>'
        + '<div class="lu" data-url="' + url + '">' + url + '</div>'
        + '<div class="lmeta">'
        + '<span class="badge ' + (expired?'ex':'ok') + '">' + (expired?'❌ Expirado':'✅ Activo') + '</span>'
        + '<span class="badge">' + link.downloads + ' descarga' + (link.downloads===1?'':'s') + '</span>'
        + '<span class="badge">' + expLabel + '</span>'
        + '</div>'
        + '<div class="la">'
        + '<button class="btn btn-sm btn-out" data-url="' + url + '">📋 Copiar</button>'
        + '<button class="btn btn-sm btn-red" data-token="' + token + '">🗑️ Eliminar</button>'
        + '</div></div>';
    }).join('');

    el.querySelectorAll('.lu').forEach(function(e){
      e.addEventListener('click', function(){ copyUrl(e.dataset.url); });
    });
    el.querySelectorAll('.btn-out[data-url]').forEach(function(e){
      e.addEventListener('click', function(){ copyUrl(e.dataset.url); });
    });
    el.querySelectorAll('.btn-red[data-token]').forEach(function(e){
      e.addEventListener('click', function(){ delLink(e.dataset.token); });
    });
  });
}

function copyUrl(url) {
  navigator.clipboard.writeText(url).catch(function(){});
  toast('📋 URL copiada');
}

function delLink(token) {
  if (!confirm('¿Eliminar este link?')) return;
  fetch('/api/links/' + token + '?password=' + pwd, {method:'DELETE'})
    .then(function(){ loadLinks(); toast('🗑️ Link eliminado'); });
}
</script>
</body>
</html>`;

// ─── download.html ─────────────────────────────────────────────────────────────
const downloadHtml = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Descarga – Mi Nube</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0f;color:#e8e8f0;font-family:'Segoe UI',system-ui,sans-serif;
  min-height:100vh;display:flex;align-items:center;justify-content:center;
  background-image:radial-gradient(ellipse 50% 50% at 50% 30%,rgba(108,99,255,.1) 0%,transparent 70%)}
.card{background:#111118;border:1px solid #2a2a38;border-radius:20px;
  padding:44px 40px;width:420px;max-width:calc(100vw - 32px);text-align:center;
  box-shadow:0 32px 80px rgba(0,0,0,.6)}
.icon{font-size:3.2rem;margin-bottom:16px;display:block}
h1{font-size:1.4rem;font-weight:800;letter-spacing:-.03em;margin-bottom:8px}
.meta{color:#6b6b80;font-size:.83rem;margin-bottom:6px}
.size{color:#a78bfa;font-size:.83rem;margin-bottom:24px;font-weight:600}
.btn-dl{display:inline-flex;align-items:center;gap:10px;
  background:linear-gradient(135deg,#6c63ff,#a78bfa);
  border:none;border-radius:12px;padding:15px 32px;
  color:#fff;font-size:1rem;font-weight:700;cursor:pointer;
  text-decoration:none;transition:transform .15s,box-shadow .15s;
  box-shadow:0 8px 32px rgba(108,99,255,.4)}
.btn-dl:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(108,99,255,.55)}
.btn-dl:active{transform:translateY(0)}
.divider{border:none;border-top:1px solid #22222e;margin:24px 0}
.info{font-size:.75rem;color:#6b6b80;line-height:1.7}
.info span{color:#e8e8f0;font-weight:600}
.badge-exp{display:inline-block;padding:3px 11px;border-radius:20px;
  font-size:.72rem;font-weight:600;margin-top:8px}
.badge-ok{background:rgba(74,222,128,.12);color:#4ade80;border:1px solid #4ade80}
.badge-ex{background:rgba(255,101,132,.12);color:#ff6584;border:1px solid #ff6584}

/* States */
#state-loading{display:block}
#state-ready{display:none}
#state-expired{display:none}
#state-error{display:none}

.err-icon{font-size:3rem;margin-bottom:14px}
.err-title{font-size:1.2rem;font-weight:700;margin-bottom:8px}
.err-msg{color:#6b6b80;font-size:.85rem}
</style>
</head>
<body>
<div class="card">

  <!-- Loading -->
  <div id="state-loading">
    <span class="icon">⏳</span>
    <h1>Cargando...</h1>
    <p class="meta">Verificando enlace</p>
  </div>

  <!-- Ready -->
  <div id="state-ready">
    <span class="icon" id="dl-icon">📄</span>
    <h1 id="dl-label">Archivo</h1>
    <p class="meta" id="dl-filename"></p>
    <p class="size" id="dl-size"></p>
    <a class="btn-dl" id="dl-btn" href="#">
      ⬇ Descargar archivo
    </a>
    <hr class="divider">
    <div class="info">
      <div>Descargas: <span id="dl-count">0</span></div>
      <div id="dl-exp-wrap"></div>
    </div>
  </div>

  <!-- Expired -->
  <div id="state-expired">
    <div class="err-icon">⏰</div>
    <div class="err-title">Enlace expirado</div>
    <p class="err-msg">Este enlace de descarga ya no es válido.<br>Solicita uno nuevo al remitente.</p>
  </div>

  <!-- Error -->
  <div id="state-error">
    <div class="err-icon">❌</div>
    <div class="err-title">Enlace no válido</div>
    <p class="err-msg">Este enlace no existe o fue eliminado.</p>
  </div>

</div>

<script>
function $(id){ return document.getElementById(id); }

function show(state) {
  ['loading','ready','expired','error'].forEach(function(s){
    $('state-' + s).style.display = s === state ? 'block' : 'none';
  });
}

function fmtSize(b) {
  if (!b) return '';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
  if (b < 1073741824) return (b/1048576).toFixed(1) + ' MB';
  return (b/1073741824).toFixed(2) + ' GB';
}

function fileIcon(name) {
  var ext = (name.split('.').pop() || '').toLowerCase();
  return {pdf:'📄',zip:'🗜️',rar:'🗜️',jpg:'🖼️',jpeg:'🖼️',png:'🖼️',gif:'🖼️',
    mp4:'🎬',mov:'🎬',mp3:'🎵',wav:'🎵',doc:'📝',docx:'📝',
    xls:'📊',xlsx:'📊',ppt:'📋',pptx:'📋',txt:'📃'}[ext] || '📁';
}

var token = location.pathname.split('/').pop();

fetch('/api/link/' + token)
  .then(function(r){
    if (r.status === 410) { show('expired'); return null; }
    if (!r.ok) { show('error'); return null; }
    return r.json();
  })
  .then(function(data){
    if (!data) return;
    $('dl-icon').textContent = fileIcon(data.filename);
    $('dl-label').textContent = data.label || data.filename;
    $('dl-filename').textContent = data.filename;
    $('dl-size').textContent = fmtSize(data.size);
    $('dl-count').textContent = data.downloads;
    $('dl-btn').href = '/api/download/' + token;
    if (data.expiresAt) {
      var d = new Date(data.expiresAt);
      var expired = new Date() > d;
      $('dl-exp-wrap').innerHTML = expired
        ? '<span class="badge-exp badge-ex">⏰ Expirado</span>'
        : 'Expira: <span>' + d.toLocaleDateString('es') + ' ' + d.toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}) + '</span>';
    }
    show('ready');
  })
  .catch(function(){ show('error'); });
</script>
</body>
</html>`;

// ─── Write files ───────────────────────────────────────────────────────────────
fs.writeFileSync(path.join(publicDir, 'admin.html'), adminHtml, 'utf8');
fs.writeFileSync(path.join(publicDir, 'download.html'), downloadHtml, 'utf8');
console.log('✅ admin.html creado');
console.log('✅ download.html creado');
console.log('');
console.log('Ahora ejecuta: node server.js');
