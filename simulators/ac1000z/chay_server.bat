@echo off
chcp 65001 >nul
title Server AC1000Z (ZTE ZXHN F671Y)
echo ===================================================
echo   DANG CHAY GIA LAP AC1000Z (ZTE F671Y)
echo   Firmware: V9.0.11P2N53B ^| Hardware: V9.0
echo   URL: http://localhost:8098
echo   Tai khoan: admin / admin
echo ===================================================
python src\server.py 8098
pause
