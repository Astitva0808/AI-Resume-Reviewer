@echo off
echo Starting backend...
start cmd /k "cd backend && .\venv\Scripts\activate && uvicorn main:app --reload --port 5000"

echo Starting frontend...
start cmd /k "cd frontend && npm run dev"

echo Both servers launched. You can close this window.
pause


