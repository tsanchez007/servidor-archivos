@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════
echo    ☁  Mi Nube – Exportar para migración
echo ═══════════════════════════════════════════
echo.

:: ── Rutas ────────────────────────────────────────────────────
set PROYECTO=%USERPROFILE%\Documents\GitHub\servidor-archivos
set CLIENTES=%USERPROFILE%\Documents\GitHub\clau
set ESCRITORIO=%USERPROFILE%\Desktop

:: Fecha y hora para el nombre del ZIP
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set DT=%%I
set FECHA=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%_%DT:~8,2%-%DT:~10,2%

set ZIP_NAME=MiNube_migracion_%FECHA%.zip
set ZIP_PATH=%ESCRITORIO%\%ZIP_NAME%
set TEMP_DIR=%TEMP%\minube_export_%FECHA%

:: ── Verificar que el proyecto existe ─────────────────────────
if not exist "%PROYECTO%" (
    echo [ERROR] No se encontro el proyecto en:
    echo   %PROYECTO%
    echo.
    echo Asegurate de haber instalado Mi Nube primero.
    pause
    exit /b 1
)

echo [▶] Preparando archivos...

:: ── Crear carpeta temporal ───────────────────────────────────
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%\servidor-archivos"

:: ── Copiar proyecto (sin node_modules) ──────────────────────
echo [▶] Copiando proyecto...
xcopy /E /I /Y /EXCLUDE:migrar_excluir.txt "%PROYECTO%\" "%TEMP_DIR%\servidor-archivos\" >nul 2>&1

:: Crear lista de exclusiones temporalmente
echo node_modules\ > "%TEMP%\excluir_temp.txt"
echo .git\ >> "%TEMP%\excluir_temp.txt"
echo *.log >> "%TEMP%\excluir_temp.txt"

xcopy /E /I /Y "%PROYECTO%\" "%TEMP_DIR%\servidor-archivos\" /EXCLUDE:%TEMP%\excluir_temp.txt >nul

:: ── Copiar carpeta de clientes ───────────────────────────────
if exist "%CLIENTES%" (
    echo [▶] Copiando archivos de clientes...
    xcopy /E /I /Y "%CLIENTES%\" "%TEMP_DIR%\servidor-archivos\clientes\" >nul
    echo [OK] Clientes copiados
) else (
    echo [!] No se encontro carpeta de clientes
    mkdir "%TEMP_DIR%\servidor-archivos\clientes"
)

:: ── Actualizar ruta en server.js para portabilidad ──────────
echo [▶] Actualizando rutas para portabilidad...
powershell -Command "(Get-Content '%TEMP_DIR%\servidor-archivos\server.js') -replace 'path.join\(os.homedir\(\),\"Documents\",\"GitHub\",\"clau\"\)', 'path.join\(__dirname,\"clientes\"\)' | Set-Content '%TEMP_DIR%\servidor-archivos\server.js'"

:: ── Copiar scripts de instalación ───────────────────────────
set SCRIPT_DIR=%~dp0
if exist "%SCRIPT_DIR%instalar.sh"  copy "%SCRIPT_DIR%instalar.sh"  "%TEMP_DIR%\servidor-archivos\" >nul
if exist "%SCRIPT_DIR%instalar.bat" copy "%SCRIPT_DIR%instalar.bat" "%TEMP_DIR%\servidor-archivos\" >nul
if exist "%SCRIPT_DIR%LEEME.md"     copy "%SCRIPT_DIR%LEEME.md"     "%TEMP_DIR%\servidor-archivos\" >nul
if exist "%SCRIPT_DIR%migrar.sh"    copy "%SCRIPT_DIR%migrar.sh"    "%TEMP_DIR%\servidor-archivos\" >nul
if exist "%SCRIPT_DIR%migrar.bat"   copy "%SCRIPT_DIR%migrar.bat"   "%TEMP_DIR%\servidor-archivos\" >nul

:: ── Crear ZIP con PowerShell ─────────────────────────────────
echo [▶] Creando ZIP...
powershell -Command "Compress-Archive -Path '%TEMP_DIR%\servidor-archivos' -DestinationPath '%ZIP_PATH%' -Force"

:: ── Limpiar temporal ─────────────────────────────────────────
rmdir /s /q "%TEMP_DIR%"
del "%TEMP%\excluir_temp.txt" >nul 2>&1

:: ── Resultado ────────────────────────────────────────────────
echo.
echo ═══════════════════════════════════════════
echo    ✅ ZIP creado exitosamente
echo ═══════════════════════════════════════════
echo.
echo   Archivo: %ZIP_NAME%
echo   Ubicacion: %ZIP_PATH%
echo.
echo   Como instalar en la nueva computadora:
echo   1. Pasa el ZIP por USB, WhatsApp o Drive
echo   2. Descomprimelo donde quieras
echo   3. Abre CMD dentro de la carpeta
echo   4. Ejecuta: instalar.bat
echo.

:: Abrir el Escritorio para ver el ZIP
explorer "%ESCRITORIO%"
pause
