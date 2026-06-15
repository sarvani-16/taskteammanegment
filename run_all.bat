@echo off
echo ===================================================
echo               Starting TeamFlow System
echo ===================================================

echo [1/4] Launching Spring Boot Core Services (Port 8001)...
start "Spring Boot Core Services" cmd /k "cd backend\coreservices && mvnw.cmd spring-boot:run"

echo [2/4] Launching Node.js Task Microservice (Port 8002)...
start "Node.js Task Microservice" cmd /k "cd backend\taskservices && npm start"

echo [3/4] Launching FastAPI Gateway (Port 8000)...
start "FastAPI Gateway" cmd /k "cd backend\gateway && venv\Scripts\python run.py"

echo [4/4] Launching React Frontend (Vite dev server)...
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo ---------------------------------------------------
echo All services are starting up.
echo Please review individual terminal windows for logs.
echo ===================================================
pause
