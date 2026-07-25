@echo off
echo Starting ADR application...

REM Start backend server
cd backend
start "Backend Server" cmd /k "npm start"
cd ..

REM Start frontend development server
start "Frontend Server" cmd /k "npm run dev"

echo Servers started. Check the new command windows for logs.
pause