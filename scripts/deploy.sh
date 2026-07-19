#!/bin/bash

# PawonOS Deployment Script

set -e

echo "🚀 PawonOS Deployment Script"
echo "============================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with required variables:"
    echo "  POSTGRES_PASSWORD=your_secure_password"
    echo "  JWT_SECRET=your_jwt_secret"
    echo "  DOMAIN=your_domain.com"
    exit 1
fi

# Source environment variables
source .env

# Check required variables
if [ -z "$POSTGRES_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Please set POSTGRES_PASSWORD and JWT_SECRET in .env"
    exit 1
fi

echo "✅ Environment variables loaded"

# Build and deploy
echo "🔨 Building Docker images..."
docker compose -f docker-compose.prod.yml build

echo "🚀 Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services to start..."
sleep 10

# Check health
echo "🏥 Checking service health..."
if docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Services are running"
else
    echo "❌ Some services failed to start"
    docker compose -f docker-compose.prod.yml logs
    exit 1
fi

# Run database migrations
echo "🗄️ Running database migrations..."
docker compose -f docker-compose.prod.yml exec api npx prisma db push

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Services:"
echo "  - Web: http://localhost:3000"
echo "  - API: http://localhost:4000"
echo ""
echo "Default login:"
echo "  - Email: admin@pawonos.com"
echo "  - Password: admin123"
echo ""
echo "⚠️  Change the default password after first login!"