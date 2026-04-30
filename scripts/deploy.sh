#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Smart Learn Deployment"
echo "========================="

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not installed. Run: curl -fsSL https://get.docker.com | sh"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git not installed."; exit 1; }

# Clone or pull
REPO_DIR="smart_learn"
REPO_URL="https://github.com/Jacksang/smart_learn.git"

if [ -d "$REPO_DIR" ]; then
    echo "📦 Pulling latest changes..."
    cd "$REPO_DIR"
    git pull origin main
else
    echo "📦 Cloning repository..."
    git clone "$REPO_URL"
    cd "$REPO_DIR"
fi

# Create .env if missing
if [ ! -f .env ]; then
    echo "⚠️  No .env file found."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "📝 Created .env from .env.example — EDIT IT with your secrets!"
        echo "   nano .env"
        exit 1
    else
        echo "❌ No .env.example found. Create .env manually."
        exit 1
    fi
fi

# Deploy
echo "🐳 Building and starting containers..."
docker compose up -d --build

# Verify
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

if curl -sf http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy!"
else
    echo "⚠️  Backend health check failed — check logs: docker compose logs backend"
fi

if curl -sf http://localhost/ > /dev/null 2>&1; then
    echo "✅ Frontend is serving!"
else
    echo "⚠️  Frontend check failed — check logs: docker compose logs frontend"
fi

echo ""
echo "🎉 Deployment complete!"
echo "📍 Frontend: http://localhost"
echo "📍 API:      http://localhost/api/health"
echo ""
echo "📋 Useful commands:"
echo "   make logs     — View all logs"
echo "   make down     — Stop all services"
echo "   make restart  — Restart all services"
