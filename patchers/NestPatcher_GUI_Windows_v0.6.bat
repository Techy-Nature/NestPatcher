@echo off
rem Double-click me to open the NestPatcher control panel in your web browser.
rem Keep this black window open while you use it.
setlocal
cd /d "%~dp0"
set "PY=py -3"
%PY% --version >nul 2>nul || set "PY=python"
%PY% --version >nul 2>nul || (echo Python 3 is not installed. Run in PowerShell:  winget install Python.Python.3.12 & pause & exit /b 1)
%PY% "%~dp0NestPatcher_TiTS_GUI_v0.6.py" %*
pause
