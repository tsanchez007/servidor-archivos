#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Mi Nube – Script de migración (Mac / Linux)
#  Crea un ZIP completo con el proyecto + archivos de clientes
# ═══════════════════════════════════════════════════════════════

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "═══════════════════════════════════════════"
echo "   ☁  Mi Nube – Exportar para migración"
echo "═══════════════════════════════════════════"
echo ""

# ── Rutas ────────────────────────────────────────────────────
PROYECTO="$HOME/Documents/GitHub/servidor-archivos"
CLIENTES="$HOME/Documents/GitHub/clau"
ESCRITORIO="$HOME/Desktop"
FECHA=$(date +"%Y-%m-%d_%H-%M")
ZIP_NAME="MiNube_migracion_$FECHA.zip"
ZIP_PATH="$ESCRITORIO/$ZIP_NAME"
TEMP_DIR="/tmp/minube_export_$FECHA"

# ── Verificar que el proyecto existe ─────────────────────────
if [ ! -d "$PROYECTO" ]; then
  echo -e "${RED}[ERROR] No se encontró el proyecto en:${NC}"
  echo -e "  $PROYECTO"
  echo ""
  echo "Asegúrate de haber instalado Mi Nube primero."
  exit 1
fi

echo -e "${YELLOW}▶ Preparando archivos...${NC}"

# ── Crear carpeta temporal ───────────────────────────────────
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR/servidor-archivos"

# ── Copiar proyecto completo (sin node_modules) ──────────────
echo -e "${YELLOW}▶ Copiando proyecto...${NC}"
rsync -a \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  "$PROYECTO/" "$TEMP_DIR/servidor-archivos/"

# ── Copiar carpeta de clientes ───────────────────────────────
if [ -d "$CLIENTES" ]; then
  echo -e "${YELLOW}▶ Copiando archivos de clientes...${NC}"
  cp -r "$CLIENTES" "$TEMP_DIR/servidor-archivos/clientes"
  
  # Contar clientes y archivos
  NUM_CLIENTES=$(ls "$CLIENTES" 2>/dev/null | wc -l | tr -d ' ')
  NUM_ARCHIVOS=$(find "$CLIENTES" -type f 2>/dev/null | wc -l | tr -d ' ')
  echo -e "${GREEN}   ✅ $NUM_CLIENTES cliente(s), $NUM_ARCHIVOS archivo(s)${NC}"
else
  echo -e "${YELLOW}   ⚠ No se encontró carpeta de clientes (clau)${NC}"
  mkdir -p "$TEMP_DIR/servidor-archivos/clientes"
fi

# ── Actualizar BASE_DIR en server.js para que use carpeta relativa ──
echo -e "${YELLOW}▶ Actualizando rutas para portabilidad...${NC}"
sed -i '' 's|path.join(os.homedir(),"Documents","GitHub","clau")|path.join(__dirname,"clientes")|g' \
  "$TEMP_DIR/servidor-archivos/server.js" 2>/dev/null || true

# ── Copiar scripts de instalación al ZIP ────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ -f "$SCRIPT_DIR/instalar.sh" ] && cp "$SCRIPT_DIR/instalar.sh" "$TEMP_DIR/servidor-archivos/"
[ -f "$SCRIPT_DIR/instalar.bat" ] && cp "$SCRIPT_DIR/instalar.bat" "$TEMP_DIR/servidor-archivos/"
[ -f "$SCRIPT_DIR/LEEME.md" ] && cp "$SCRIPT_DIR/LEEME.md" "$TEMP_DIR/servidor-archivos/"
[ -f "$SCRIPT_DIR/migrar.sh" ] && cp "$SCRIPT_DIR/migrar.sh" "$TEMP_DIR/servidor-archivos/"
[ -f "$SCRIPT_DIR/migrar.bat" ] && cp "$SCRIPT_DIR/migrar.bat" "$TEMP_DIR/servidor-archivos/"

# ── Crear el ZIP ─────────────────────────────────────────────
echo -e "${YELLOW}▶ Creando ZIP...${NC}"
cd "$TEMP_DIR"
zip -r "$ZIP_PATH" "servidor-archivos/" -x "*.DS_Store" "*.Thumbs.db"

# ── Limpiar temporal ─────────────────────────────────────────
rm -rf "$TEMP_DIR"

# ── Resultado ────────────────────────────────────────────────
ZIP_SIZE=$(du -sh "$ZIP_PATH" | cut -f1)

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ ZIP creado exitosamente${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "  📦 Archivo: ${YELLOW}$ZIP_NAME${NC}"
echo -e "  📁 Ubicación: ${YELLOW}$ZIP_PATH${NC}"
echo -e "  💾 Tamaño: ${YELLOW}$ZIP_SIZE${NC}"
echo ""
echo -e "  ${BLUE}¿Cómo instalar en la nueva computadora?${NC}"
echo -e "  1. Pasa el ZIP por USB, WhatsApp o Drive"
echo -e "  2. Descomprímelo donde quieras"
echo -e "  3. Abre Terminal dentro de la carpeta"
echo -e "  4. Ejecuta: ${YELLOW}chmod +x instalar.sh && ./instalar.sh${NC}"
echo ""

# Abrir el Escritorio para ver el ZIP
open "$ESCRITORIO"
