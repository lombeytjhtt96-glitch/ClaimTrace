#!/bin/bash
# ClaimTrace - Dual Service Startup Script (Linux / WSL)
echo "========================================================"
echo " Starting ClaimTrace Ecosystem (Healthkathon BPJS 2026)"
echo "========================================================"

echo "Starting Backend (FastAPI on port 8000)..."
(cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000) &
BACKEND_PID=$!

echo "Starting Frontend (Vite on port 3000)..."
(cd app && npx vite --host 0.0.0.0 --port 3000) &
FRONTEND_PID=$!

echo ""
echo "ClaimTrace services are running:"
echo " - Frontend Web:    http://localhost:3000"
echo " - Backend API:     http://localhost:8000"
echo " - Swagger Docs:    http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both services."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
