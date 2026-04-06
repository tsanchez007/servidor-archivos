#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Mi Nube – Instalador automático (Mac / Linux)
# ═══════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "═══════════════════════════════════════════"
echo "   ☁  Mi Nube – Instalador automático"
echo "═══════════════════════════════════════════"
echo ""

# ── Detectar OS ──────────────────────────────────────────────
OS="$(uname -s)"
echo -e "${YELLOW}Sistema detectado: $OS${NC}"

# ── Instalar Homebrew (solo Mac) ─────────────────────────────
if [ "$OS" = "Darwin" ]; then
  if ! command -v brew &>/dev/null; then
    echo -e "${YELLOW}▶ Instalando Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    # Agregar brew al PATH según arquitectura
    if [ -f "/opt/homebrew/bin/brew" ]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
      echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    fi
  else
    echo -e "${GREEN}✅ Homebrew ya instalado${NC}"
  fi
fi

# ── Instalar Node.js ─────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo -e "${YELLOW}▶ Instalando Node.js...${NC}"
  if [ "$OS" = "Darwin" ]; then
    brew install node
  else
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi
else
  echo -e "${GREEN}✅ Node.js ya instalado: $(node -v)${NC}"
fi

# ── Instalar ngrok ───────────────────────────────────────────
if ! command -v ngrok &>/dev/null; then
  echo -e "${YELLOW}▶ Instalando ngrok...${NC}"
  if [ "$OS" = "Darwin" ]; then
    brew install ngrok/ngrok/ngrok
  else
    curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
    sudo apt update && sudo apt install ngrok
  fi
else
  echo -e "${GREEN}✅ ngrok ya instalado${NC}"
fi

# ── Clonar o actualizar el proyecto ──────────────────────────
DEST="$HOME/Documents/GitHub/servidor-archivos"

if [ -d "$DEST" ]; then
  echo -e "${YELLOW}▶ Carpeta ya existe, actualizando dependencias...${NC}"
else
  echo -e "${YELLOW}▶ Creando carpeta del proyecto...${NC}"
  mkdir -p "$DEST"
fi

# ── Copiar archivos del proyecto ─────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${YELLOW}▶ Copiando archivos del proyecto...${NC}"
cp -r "$SCRIPT_DIR/." "$DEST/"

# ── Instalar dependencias npm ────────────────────────────────
echo -e "${YELLOW}▶ Instalando dependencias npm...${NC}"
cd "$DEST"
npm install

# ── Crear carpeta de clientes ────────────────────────────────
mkdir -p "$HOME/Documents/GitHub/clau"
echo -e "${GREEN}✅ Carpeta de clientes lista: $HOME/Documents/GitHub/clau${NC}"

# ── Crear script de inicio ───────────────────────────────────
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
echo -e "${GREEN}   ✅ Instalación completada${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "  Para iniciar el servidor ejecuta:"
echo -e "  ${YELLOW}$DEST/start.sh${NC}"
echo ""
echo -e "  Luego abre en el navegador:"
echo -e "  ${YELLOW}http://localhost:3000${NC}"
echo ""
echo -e "  Contraseña por defecto: ${YELLOW}admin123${NC}"
echo ""
