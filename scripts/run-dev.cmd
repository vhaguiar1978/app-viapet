@echo off
cd /d "%~dp0.."
set NODE_OPTIONS=--use-system-ca
"C:\Program Files\nodejs\node.exe" node_modules\next\dist\bin\next dev --hostname 0.0.0.0 --port 3000
