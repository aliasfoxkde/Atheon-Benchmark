#!/bin/bash

# Atheon Benchmark - Quick Deployment Script
# This script helps deploy the benchmark system to Cloudflare

set -e

echo "🚀 Atheon Benchmark - Quick Deployment"
echo "=================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js installed: $(node --version)"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm"
    exit 1
fi

echo "✅ npm installed: $(npm --version)"

# Check for wrangler
if ! command -v wrangler &> /dev/null; then
    echo "⚠️  wrangler not found. Installing..."
    npm install -g wrangler
fi

echo "✅ wrangler installed"

# Check for Cloudflare authentication
echo ""
echo "🔐 Checking Cloudflare authentication..."
if wrangler whoami &> /dev/null; then
    echo "✅ Cloudflare authenticated"
else
    echo "❌ Not authenticated with Cloudflare"
    echo "Please run: wrangler login"
    exit 1
fi

# Navigate to dashboard
echo ""
echo "📂 Building dashboard..."
cd dashboard

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building Next.js application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Test the build locally
echo ""
echo "🧪 Testing application locally..."
echo "Starting dev server in background..."
npm run dev &
DEV_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Test the server
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Local server running successfully"
    echo "   Access at: http://localhost:3000"
    echo "   Benchmark page: http://localhost:3000/benchmark"
    echo "   Results page: http://localhost:3000/results"
else
    echo "❌ Local server failed to start"
    kill $DEV_PID 2>/dev/null || true
    exit 1
fi

# Test API endpoint
echo ""
echo "🧪 Testing API endpoint..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:3000/api/benchmark \
    -H "Content-Type: application/json" \
    -d '{"name":"Deploy Test","scenario":"vanilla","config":{"test_cases":2}}')

if echo "$TEST_RESPONSE" | grep -q "success"; then
    echo "✅ API endpoint working"
    BENCHMARK_ID=$(echo "$TEST_RESPONSE" | grep -o '"benchmark_id":"[^"]*' | cut -d'"' -f2)
    echo "   Test benchmark ID: $BENCHMARK_ID"
else
    echo "❌ API endpoint failed"
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
kill $DEV_PID 2>/dev/null || true

echo ""
echo "✅ Local testing complete!"

echo ""
echo "🚀 Deployment Options:"
echo ""
echo "Option 1: Deploy to Cloudflare Pages (Recommended)"
echo "  npm run deploy:production"
echo ""
echo "Option 2: Deploy Workers Backend"
echo "  cd server"
echo "  npm run deploy:production"
echo ""
echo "Option 3: Full Production Deployment"
echo "  # Deploy dashboard"
echo "  npm run deploy:production"
echo "  # Deploy server"
echo "  cd server && npm run deploy:production"
echo ""

echo "📝 For detailed deployment instructions, see docs/DEPLOYMENT.md"
echo ""
echo "🎉 Ready for production deployment!"