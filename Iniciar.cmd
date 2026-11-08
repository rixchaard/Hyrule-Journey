@echo off
title Jornada de Hyrule
cd /d "%~dp0"
if not exist "%~dp0launcher.js" (
 echo Extraia todos os arquivos do ZIP antes de iniciar.
 pause
 exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
 echo Instale o Node.js LTS de https://nodejs.org/ e abra este arquivo novamente.
 pause
 exit /b 1
)
node "%~dp0launcher.js"
if errorlevel 1 (
 echo.
 echo O aplicativo nao iniciou. Copie a mensagem acima para suporte.
) else (
 echo.
 echo Pronto. Se o navegador nao abriu, use "Abrir no navegador" nesta pasta.
)
echo.
pause
