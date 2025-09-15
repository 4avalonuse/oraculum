@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM === 0) Check diretório ===
if not exist "index.html" (
  echo [ERRO] Rode este .bat dentro de C:\4Avalon\projetos\oraculum\
  pause
  exit /b 1
)

REM === 1) npm init se faltar ===
if not exist "package.json" (
  echo [1] npm init -y
  call npm init -y
)

REM === 2) Instalar deps ===
echo [2] Instalando tailwindcss + postcss + autoprefixer
call npm i -D tailwindcss postcss autoprefixer

REM === 3) tailwind init + postcss ===
echo [3] npx tailwindcss init -p
call npx --yes tailwindcss@latest init -p

REM === 4) tailwind.config.js (garante content correto)
>tailwind.config.js (
  echo module.exports = {
  echo   content: ["./index.html","./src/**/*.{js,html}"],
  echo   theme: { extend: {} },
  echo   plugins: [],
  echo };
)

REM === 5) CSS de entrada
if not exist "src\styles" mkdir "src\styles"
powershell -NoProfile -Command ^
  "$css='@tailwind base;`n@tailwind components;`n@tailwind utilities;';" ^
  "Set-Content -Encoding UTF8 'src/styles/tailwind.css' $css"

REM === 6) Build CSS minificado
if not exist "assets" mkdir assets
echo [6] Gerando assets/app.css
call npx tailwindcss -i ./src/styles/tailwind.css -o ./assets/app.css --minify

REM === 7) Editar index.html: trocar CDN por <link>
if not exist "index.html.bak" copy /y index.html index.html.bak >nul
powershell -NoProfile -Command ^
  "$p='index.html';" ^
  "$h=Get-Content $p -Raw;" ^
  "$h=$h -replace '<script src=""https://cdn\.tailwindcss\.com""></script>','<link rel=""stylesheet"" href=""./assets/app.css"">';" ^
  "if($h -notmatch 'assets/app\.css'){ " ^
  "  $h=$h -replace '(<title>[^<]*</title>\s*)','`$1`n  <link rel=""stylesheet"" href=""./assets/app.css"">`n';" ^
  "}" ^
  "$h=$h -replace '(<script type=""module"" src=""\./src/main\.js""></script>)','<script src=""https://cdn.jsdelivr.net/npm/chart.js""></script>`n  <script src=""https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns""></script>`n  `$1';" ^
  "Set-Content -Encoding UTF8 $p $h;"

echo.
echo [OK] Tailwind pronto. Recarregue: http://localhost/oraculum/
echo Se algo quebrar, restaure index.html de index.html.bak
pause
