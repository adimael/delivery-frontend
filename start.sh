#!/bin/bash

# Start backend server
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Start frontend development server
npm run dev &
FRONTEND_PID=$!

# Function to kill background processes on exit
cleanup() {
  echo "Stopping servers..."
  kill $BACKEND_PID $FRONTEND_PID
  exit 0
}

# Trap exit signals
trap cleanup EXIT INT TERM

# Wait for processes to complete
wait $BACKEND_PID $FRONTEND_PID