@echo off
echo ========================================================
echo  Menjalankan Seluruh Ekosistem ClaimTrace Prototype
echo  Healthkathon BPJS Kesehatan 2026 - Tim TINEERENSE
echo ========================================================
start "ClaimTrace Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
start "ClaimTrace Frontend (Vite)" cmd /k "cd app && npm run dev"
echo.
echo Layanan sedang berjalan:
echo - Backend API & Docs: http://127.0.0.1:8000/docs
echo - Frontend Dashboard: http://localhost:3000
echo.
