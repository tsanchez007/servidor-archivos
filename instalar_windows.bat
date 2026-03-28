@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════
echo    ☁  Mi Nube – Instalador para Windows
echo ═══════════════════════════════════════════
echo.

:: ── Verificar si se ejecuta como Administrador ──────────────
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Ejecuta este script como Administrador.
    echo Clic derecho en el archivo ^> "Ejecutar como administrador"
    pause
    exit /b 1
)

:: ── Instalar Chocolatey si no existe ────────────────────────
where choco >nul 2>&1
if %errorLevel% neq 0 (
    echo [▶] Instalando Chocolatey...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    call refreshenv
) else (
    echo [OK] Chocolatey ya instalado
)

:: ── Instalar Node.js ─────────────────────────────────────────
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [▶] Instalando Node.js...
    choco install nodejs-lts -y
    call refreshenv
) else (
    echo [OK] Node.js ya instalado
)

:: ── Instalar ngrok ───────────────────────────────────────────
where ngrok >nul 2>&1
if %errorLevel% neq 0 (
    echo [▶] Instalando ngrok...
    choco install ngrok -y
    call refreshenv
) else (
    echo [OK] ngrok ya instalado
)

:: ── Preparar carpetas ────────────────────────────────────────
set DEST=%USERPROFILE%\Documents\GitHub\servidor-archivos
set CLAU=%USERPROFILE%\Documents\GitHub\clau

if not exist "%DEST%" mkdir "%DEST%"
if not exist "%CLAU%" mkdir "%CLAU%"

:: ── Copiar archivos del proyecto ─────────────────────────────
echo [▶] Copiando archivos del proyecto...
set SCRIPT_DIR=%~dp0
xcopy /E /I /Y "%SCRIPT_DIR%." "%DEST%\"

:: ── Instalar dependencias npm ────────────────────────────────
echo [▶] Instalando dependencias npm...
cd /d "%DEST%"
call npm install

:: ── Crear script de inicio para Windows ─────────────────────
echo @echo off > "%DEST%\start.bat"
echo echo ☁ Iniciando Mi Nube... >> "%DEST%\start.bat"
echo cd /d "%DEST%" >> "%DEST%\start.bat"
echo :loop >> "%DEST%\start.bat"
echo node server.js >> "%DEST%\start.bat"
echo echo Servidor caido, reiniciando... >> "%DEST%\start.bat"
echo timeout /t 1 /nobreak ^>nul >> "%DEST%\start.bat"
echo goto loop >> "%DEST%\start.bat"

echo.
echo ═══════════════════════════════════════════
echo    ✅ Instalación completada
echo ═══════════════════════════════════════════
echo.
echo   Para iniciar el servidor ejecuta:
echo   %DEST%\start.bat
echo.
echo   Luego abre en el navegador:
echo   http://localhost:3000
echo.
echo   Contraseña por defecto: admin123
echo.
pause
