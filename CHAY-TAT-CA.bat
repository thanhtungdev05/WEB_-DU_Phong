@echo off
chcp 65001 >nul
title HE THONG GIA LAP MANG FPT

set "ROOT=%~dp0"
cd /d "%ROOT%"

echo ====================================================================
echo    HE THONG GIA LAP MANG FPT - MASTER DISPATCHER (1 CONG 8080)
echo ====================================================================
echo.

set PY_CMD=python
where python >nul 2>nul
if %errorlevel% neq 0 (
    where py >nul 2>nul
    if %errorlevel%==0 (
        set PY_CMD=py
    ) else (
        echo [LOI] Khong tim thay Python tren may tinh!
        echo Vui long cai dat Python tu https://www.python.org/
        pause
        exit /b 1
    )
)

echo Dang khoi dong Master Dispatcher (Portal + toan bo thiet bi tren cong 8080)...
start "FTC Virtual Devices - Dispatcher 8080" cmd /k "cd /d "%ROOT%" && %PY_CMD% run_all.py"

echo.
echo ====================================================================
echo    DA BAT MASTER DISPATCHER TREN CONG 8080!
echo    Dang mo trinh duyet: http://localhost:8080
echo ====================================================================
echo.
timeout /t 2 >nul 2>nul || ping -n 3 127.0.0.1 >nul
start http://localhost:8080
