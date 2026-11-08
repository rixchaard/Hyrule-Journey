@echo off
cd /d "%~dp0"
node launcher.js --stop
if errorlevel 1 pause
