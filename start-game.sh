#!/bin/bash

# Kingdom of Chaos - Game Startup Script
echo "🏰 Starting Kingdom of Chaos..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ All prerequisites are installed!"

# Start PostgreSQL database
echo "🐘 Starting PostgreSQL database..."
cd backend
npm run db:up

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Start backend
echo "🚀 Starting backend server..."
npm run start:dev &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Start frontend
echo "🎨 Starting frontend application..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "🎉 Kingdom of Chaos is starting up!"
echo ""

# Get local IP address for network access
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo "📱 Frontend:"
echo "   Local:   http://localhost:3000"
if [ ! -z "$LOCAL_IP" ]; then
    echo "   Network: http://$LOCAL_IP:3000"
fi
echo "🔧 Backend API: http://localhost:3001/api"
echo "🐘 Database: localhost:5432"
echo ""
echo "🎮 Access URLs:"
echo "   🏠 Local:   http://localhost:3000"
if [ ! -z "$LOCAL_IP" ]; then
    echo "   🌐 Network: http://$LOCAL_IP:3000 (for other devices)"
fi
echo ""
echo "Press Ctrl+C to stop all services..."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping Kingdom of Chaos..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    cd ../backend
    npm run db:down
    echo "👋 Kingdom of Chaos stopped successfully!"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for processes
wait 