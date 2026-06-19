#!/bin/bash

# Cloudflare Pages Deployment Script for Atheon Benchmark Dashboard
# This script handles deployment to Cloudflare Pages with proper configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Atheon Benchmark Dashboard - Cloudflare Pages Deployment${NC}"

# Configuration
PROJECT_NAME="atheon-benchmark-dashboard"
BUILD_DIR=".next"
STATIC_DIR="out"
CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID:-""}

# Check if we have the necessary tools
command -v wrangler >/dev/null 2>&1 || {
    echo -e "${RED}❌ wrangler CLI is not installed. Installing...${NC}"
    npm install -g wrangler
}

command -v npm >/dev/null 2>&1 || {
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
}

# Parse arguments
ENVIRONMENT=${1:-"production"}
SKIP_BUILD=${2:-"false"}

echo -e "${YELLOW}📦 Environment: ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}🏗️  Skip Build: ${SKIP_BUILD}${NC}"

# Install dependencies
echo -e "${YELLOW}📚 Installing dependencies...${NC}"
npm install

# Build the project (unless skipped)
if [ "$SKIP_BUILD" != "true" ]; then
    echo -e "${YELLOW}🔨 Building Next.js application...${NC}"
    npm run build
fi

# For static export, the out directory already contains everything we need
if [ -d "$STATIC_DIR" ]; then
    echo -e "${YELLOW}📁 Static files ready in ${STATIC_DIR}/${NC}"
    echo -e "${YELLOW}📁 Build output verified:${NC}"
    ls -la "$STATIC_DIR/" | head -10
else
    echo -e "${RED}❌ Static export directory not found: ${STATIC_DIR}${NC}"
    echo -e "${YELLOW}💡 Make sure to run 'npm run build' first${NC}"
    exit 1
fi

echo -e "${YELLOW}🌐 Deploying to Cloudflare Pages...${NC}"

# Deploy using wrangler
if [ -n "$CLOUDFLARE_ACCOUNT_ID" ]; then
    # Use wrangler with account ID
    wrangler pages deploy "$STATIC_DIR" \
        --project-name="$PROJECT_NAME" \
        --compatibility-date="2024-01-01" \
        --compatibility-flags="nodejs_compat" \
        --env="$ENVIRONMENT"
else
    # Use wrangler without account ID (will prompt for login)
    wrangler pages deploy "$STATIC_DIR" \
        --project-name="$PROJECT_NAME" \
        --compatibility-date="2024-01-01" \
        --compatibility-flags="nodejs_compat" \
        --env="$ENVIRONMENT"
fi

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🎉 Your Atheon Benchmark Dashboard is now live on Cloudflare Pages${NC}"
