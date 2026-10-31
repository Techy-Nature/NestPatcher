@echo off
rem Double-click me. Shows the NestPatcher menu in this window.
rem Keep me in the same folder as NestPatcher_TiTS_Windows_v1.9.py and nestmods.
setlocal
cd /d "%~dp0"
set "PY=py -3"
%PY% --version >nul 2>nul || set "PY=python"
%PY% --version >nul 2>nul || goto nopython
%PY% "%~dp0NestPatcher_TiTS_Windows_v1.9.py" --menu %*
echo.
pause
exit /b

:nopython
echo Python 3 is not installed (or not on PATH).
echo Open PowerShell and run:   winget install Python.Python.3.12
echo or install it from https://www.python.org/downloads/ and tick "Add python.exe to PATH".
echo Then double-click this file again.
pause
exit /b 1
