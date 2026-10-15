@echo off
cd /d "%~dp0"
set "GIT_BASH=%ProgramFiles%\Git\bin\bash.exe"
if not exist "%GIT_BASH%" set "GIT_BASH=%LocalAppData%\Programs\Git\bin\bash.exe"
if not exist "%GIT_BASH%" (
    echo Install Git for Windows in its default location and start Docker Desktop.
    echo Or open Git Bash in this folder and run: bash start.sh
    pause
    exit /b 1
)
"%GIT_BASH%" start.sh
if errorlevel 1 pause
