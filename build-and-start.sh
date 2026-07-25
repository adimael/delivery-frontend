#!/bin/bash

# Install dependencies
npm install
cd backend
npm install
cd ..

# Build frontend for production
npm run build

# Start backend server
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Serve the built frontend
npx serve -s dist -l 8080 &
FRONTEND_PID=$!

# Function to kill background processes on exit
cleanup() {
  echo "Stopping servers..."
  kill $BACKEND_PID $FRONTEND_PID
  exit 0
}

# Trap exit signals
trap cleanup EXIT INT TERM

echo "Application is running!"
echo "Frontend: http://136.248.76.187:8080"
echo "Backend API: http://136.248.76.187:3001"

# Wait for processes to complete
wait $BACKEND_PID $FRONTEND_PID