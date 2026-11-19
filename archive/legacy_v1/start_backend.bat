@echo off
echo ========================================================
echo  ClaimTrace Backend - FastAPI Server (Healthkathon 2026)
echo  Tim TINEERENSE - MAN 1 Surakarta
echo ========================================================
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
