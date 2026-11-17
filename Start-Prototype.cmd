@echo off
cd /d "%~dp0"
echo Opening THE NINTH RITE prototype. Keep this window running.
echo Open the local URL shown below.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-Prototype.ps1"
pause
