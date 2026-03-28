#!/bin/bash
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

clear
echo ""
echo "═══════════════════════════════════════════"
echo "   ☁  MI NUBE – Instalador automático"
echo "═══════════════════════════════════════════"
echo ""

OS="$(uname -s)"

# ── Función error con reintento ───────────────────────────────
error_reintento() {
  echo ""
  echo -e "${RED}${BOLD}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${RED}${BOLD}║  ERROR: $1${NC}"
  echo -e "${RED}${BOLD}╚══════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${RED}${BOLD}MOTIVO: $2${NC}"
  echo ""
  echo "  1) REINTENTAR"
  echo "  2) SALIR"
  echo ""
  printf "Elige (1/2): "
  read RETRY
  if [ "$RETRY" = "1" ]; then
    return 0
  else
    echo ""
    echo -e "${RED}${BOLD}INSTALACIÓN CANCELADA.${NC}"
    echo ""
    exit 1
  fi
}

# ── Verificar internet ────────────────────────────────────────
while true; do
  echo -e "${YELLOW}▶ Verificando conexión a internet...${NC}"
  if curl -s --max-time 5 https://www.google.com > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Conexión OK${NC}"
    break
  else
    error_reintento "SIN CONEXIÓN A INTERNET" "SE REQUIERE INTERNET PARA INSTALAR. CONECTATE A UNA RED E INTENTA DE NUEVO." && continue
  fi
done
echo ""

# ── Detectar discos ───────────────────────────────────────────
seleccionar_disco() {
  while true; do
    echo -e "${YELLOW}▶ Analizando discos disponibles...${NC}"
    echo ""
    DISCOS=()
    DISCOS_NOMBRES=()
    IDX=0
    while IFS= read -r line; do
      MOUNT=$(echo "$line" | awk '{print $NF}')
      LIBRE_KB=$(df -k "$MOUNT" 2>/dev/null | tail -1 | awk '{print $4}')
      LIBRE_GB=$(echo "scale=1; $LIBRE_KB / 1048576" | bc 2>/dev/null || echo "?")
      if [[ "$MOUNT" == "/" || "$MOUNT" == /Volumes/* ]]; then
        IDX=$((IDX + 1))
        DISCOS+=("$MOUNT")
        if [ "$MOUNT" = "/" ]; then
          LABEL="Disco principal (Macintosh HD)"
        else
          LABEL="$(basename $MOUNT)"
        fi
        DISCOS_NOMBRES+=("$LABEL")
        echo "  $IDX) $LABEL — ${LIBRE_GB} GB libres"
      fi
    done < <(df -H | grep -E "^/dev/" | sort -k9)

    echo ""
    printf "Elige el disco (1"
    [ ${#DISCOS[@]} -gt 1 ] && printf "-%d" ${#DISCOS[@]}
    printf "): "
    read DISCO_OPCION

    if ! [[ "$DISCO_OPCION" =~ ^[0-9]+$ ]] || [ "$DISCO_OPCION" -lt 1 ] || [ "$DISCO_OPCION" -gt ${#DISCOS[@]} ]; then
      error_reintento "OPCIÓN INVÁLIDA" "DEBES INGRESAR UN NÚMERO ENTRE 1 Y ${#DISCOS[@]}." && continue
    fi

    DISCO_ELEGIDO="${DISCOS[$((DISCO_OPCION-1))]}"
    DISCO_NOMBRE="${DISCOS_NOMBRES[$((DISCO_OPCION-1))]}"

    # Verificar espacio
    LIBRE_KB=$(df -k "$DISCO_ELEGIDO" | tail -1 | awk '{print $4}')
    REQUERIDO_KB=2097152
    if [ "$LIBRE_KB" -lt "$REQUERIDO_KB" ]; then
      LIBRE_GB=$(echo "scale=1; $LIBRE_KB / 1048576" | bc)
      error_reintento "ESPACIO INSUFICIENTE EN $DISCO_NOMBRE" "SE NECESITAN AL MENOS 2 GB LIBRES. TIENES SOLO ${LIBRE_GB} GB. ELIGE OTRO DISCO O LIBERA ESPACIO." && continue
    fi

    echo -e "${GREEN}✅ Disco seleccionado: $DISCO_NOMBRE${NC}"
    break
  done
}

seleccionar_disco

# ── Elegir carpeta ────────────────────────────────────────────
seleccionar_carpeta() {
  while true; do
    if [ "$DISCO_ELEGIDO" = "/" ]; then
      BASE="$HOME"
    else
      BASE="$DISCO_ELEGIDO"
    fi

    echo ""
    echo "¿En qué carpeta instalar MI NUBE?"
    echo ""
    echo "  1) $BASE/Desktop/MI-NUBE"
    echo "  2) $BASE/Documents/MI-NUBE"
    echo "  3) $BASE/Downloads/MI-NUBE"
    echo "  4) Ruta personalizada"
    echo ""
    printf "Elige (1/2/3/4): "
    read FOLDER_OPCION

    case $FOLDER_OPCION in
      1) DEST="$BASE/Desktop/MI-NUBE" ;;
      2) DEST="$BASE/Documents/MI-NUBE" ;;
      3) DEST="$BASE/Downloads/MI-NUBE" ;;
      4)
        printf "Ingresa la ruta completa: "
        read DEST
        ;;
      *)
        error_reintento "OPCIÓN INVÁLIDA" "DEBES INGRESAR UN NÚMERO ENTRE 1 Y 4." && continue
        ;;
    esac

    mkdir -p "$DEST" 2>/dev/null && break || \
      error_reintento "ERROR CREANDO CARPETA" "NO SE PUDO CREAR $DEST. VERIFICA QUE TIENES PERMISOS EN ESA UBICACIÓN." && continue
  done
}

seleccionar_carpeta
echo ""
echo -e "${YELLOW}▶ Instalando en: $DEST${NC}"
echo ""

# ── Instalar Homebrew ─────────────────────────────────────────
if [ "$OS" = "Darwin" ]; then
  while true; do
    if ! command -v brew &>/dev/null; then
      echo -e "${YELLOW}▶ Instalando Homebrew...${NC}"
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" && break || \
        error_reintento "ERROR INSTALANDO HOMEBREW" "NO SE PUDO INSTALAR HOMEBREW. VERIFICA CONEXIÓN A INTERNET Y ESPACIO EN DISCO." && continue
      if [ -f "/opt/homebrew/bin/brew" ]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
      fi
    else
      echo -e "${GREEN}✅ Homebrew ya instalado${NC}"
      break
    fi
  done
fi

# ── Instalar Node.js ──────────────────────────────────────────
while true; do
  if ! command -v node &>/dev/null; then
    echo -e "${YELLOW}▶ Instalando Node.js...${NC}"
    brew install node && break || \
      error_reintento "ERROR INSTALANDO NODE.JS" "NO SE PUDO INSTALAR NODE.JS. INTENTA CORRER 'brew install node' MANUALMENTE." && continue
  else
    echo -e "${GREEN}✅ Node.js ya instalado: $(node -v)${NC}"
    break
  fi
done

# ── Instalar cloudflared ──────────────────────────────────────
while true; do
  if ! command -v cloudflared &>/dev/null; then
    echo -e "${YELLOW}▶ Instalando cloudflared...${NC}"
    brew install cloudflared && break || \
      error_reintento "ERROR INSTALANDO CLOUDFLARED" "NO SE PUDO INSTALAR CLOUDFLARED. INTENTA CORRER 'brew install cloudflared' MANUALMENTE." && continue
  else
    echo -e "${GREEN}✅ cloudflared ya instalado${NC}"
    break
  fi
done

# ── Copiar archivos ───────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
while true; do
  echo -e "${YELLOW}▶ Copiando archivos...${NC}"
  cp -r "$SCRIPT_DIR/." "$DEST/" && break || \
    error_reintento "ERROR COPIANDO ARCHIVOS" "NO SE PUDIERON COPIAR LOS ARCHIVOS A $DEST. VERIFICA PERMISOS Y ESPACIO DISPONIBLE." && continue
done

# ── npm install ───────────────────────────────────────────────
while true; do
  echo -e "${YELLOW}▶ Instalando dependencias npm...${NC}"
  cd "$DEST" && npm install && break || \
    error_reintento "ERROR EN NPM INSTALL" "NO SE PUDIERON INSTALAR LAS DEPENDENCIAS. VERIFICA TU CONEXIÓN A INTERNET." && continue
done

mkdir -p "$DEST/clientes"

# ── Crear start.sh ────────────────────────────────────────────
cat > "$DEST/start.sh" << 'STARTEOF'
#!/bin/bash
echo "☁ Iniciando Mi Nube..."
cd "$(dirname "$0")"
while true; do
  node server.js
  echo "⚠ Servidor caído, reiniciando en 1 segundo..."
  sleep 1
done
STARTEOF
chmod +x "$DEST/start.sh"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ INSTALACIÓN COMPLETADA${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Instalado en: $DEST${NC}"
echo ""

# ── Crear acceso directo en escritorio ───────────────────────
SHORTCUT="$HOME/Desktop/MI NUBE.app"
mkdir -p "$SHORTCUT/Contents/MacOS"
mkdir -p "$SHORTCUT/Contents/Resources"

# Copiar ícono si existe
ICON_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/mi_nube.icns"
if [ -f "$ICON_SRC" ]; then
  cp "$ICON_SRC" "$SHORTCUT/Contents/Resources/AppIcon.icns"
fi

# Info.plist
cat > "$SHORTCUT/Contents/Info.plist" << 'PLISTEOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key><string>MI NUBE</string>
  <key>CFBundleIdentifier</key><string>com.minube.launcher</string>
  <key>CFBundleName</key><string>MI NUBE</string>
  <key>CFBundleVersion</key><string>1.0</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
</dict>
</plist>
PLISTEOF

# Script que arranca servidor y abre navegador
cat > "$SHORTCUT/Contents/MacOS/MI NUBE" << LAUNCHEOF
#!/bin/bash
cd "$DEST"
open "http://localhost:3000/admin.html"
osascript -e "tell application \"Terminal\" to activate"
./start.sh
LAUNCHEOF

chmod +x "$SHORTCUT/Contents/MacOS/MI NUBE"
echo -e "${GREEN}✅ Acceso directo creado en el Escritorio${NC}"

echo "☁ Iniciando servidor..."
open "http://localhost:3000/admin.html"
cd "$DEST" && ./start.sh
