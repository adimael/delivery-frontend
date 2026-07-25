@echo off
echo Building and starting ADR application...

REM Install dependencies
call npm install
cd backend
call npm install
cd ..

REM Build frontend for production
call npm run build

REM Start backend server
cd backend
start "Backend Server" cmd /k "npm start"
cd ..

REM Serve the built frontend
start "Frontend Server" cmd /k "npx serve -s dist -l 8080"

echo Application is running!
echo Frontend: http://136.248.76.187:8080
echo Backend API: http://136.248.76.187:3001
pause