@echo off
echo ========================================================
echo  Menjalankan Seluruh Ekosistem ClaimTrace Prototype
echo  Healthkathon BPJS Kesehatan 2026 - Tim TINEERENSE
echo ========================================================
start "ClaimTrace Backend (FastAPI)" cmd /k "start_backend.bat"
start "ClaimTrace Frontend (Next.js)" cmd /k "start_frontend.bat"
echo.
echo Layanan sedang berjalan:
echo - Backend API & Docs: http://127.0.0.1:8000/docs
echo - Frontend Dashboard: http://localhost:3000
echo.
