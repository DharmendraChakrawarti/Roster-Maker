#!/bin/bash
set -e

echo "========================================="
echo "   🚀 Starting SmartRoster Application   "
echo "========================================="

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Start Spring Boot Backend in background
echo "Starting Spring Boot Backend on http://localhost:8080..."
cd "$DIR/smartroster-backend"
mvn spring-boot:run &
BACKEND_PID=$!

# Start Angular Frontend
echo "Starting Angular Frontend on http://localhost:4200..."
cd "$DIR/smartroster-frontend"
npm start &
FRONTEND_PID=$!

trap "echo 'Stopping all services...'; kill $BACKEND_PID $FRONTEND_PID" EXIT INT TERM

wait
