# Atheon Benchmark Dashboard - Deployment Guide

## Overview

The Atheon Benchmark Dashboard is a production-ready Next.js 16 PWA with CSR-First (Client-Side Rendering First) strategy, designed for deployment on Cloudflare infrastructure. This guide covers deployment to various environments.

## Architecture

### Frontend
- **Framework**: Next.js 16.2.9 with App Router
- **Rendering**: CSR-First with Server-Side Rendering support
- **Styling**: Tailwind CSS v4 with custom design system
- **PWA**: Full Progressive Web App support with service worker
- **Components**: shadcn/ui for professional UI components

### Backend & Infrastructure
- **API**: Next.js API routes with edge runtime support
- **Database**: Cloudflare D1 for structured data
- **Storage**: Cloudflare R2 for artifacts and exports
- **Caching**: Cloudflare KV for sessions and rate limiting
- **Deployment**: Cloudflare Pages for global distribution

## Prerequisites

### Development Environment
```bash
# Node.js 18+ and npm
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 8.0.0 or higher

# Git for version control
git --version
```

### Cloudflare Setup
```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login

# Verify authentication
wrangler whoami
```

## Local Development

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/your-org/Atheon-Benchmark.git
cd Atheon-Benchmark/dashboard

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### 2. Configure Environment
```bash
# .env.local
ANTHROPIC_API_KEY=your_api_key_here
ANTHROPIC_BASE_URL=https://api.anthropic.com
NEXT_PUBLIC_APP_NAME=Atheon Benchmark Dashboard
NEXT_PUBLIC_APP_DESCRIPTION=Comprehensive AI benchmark system
```

### 3. Run Development Server
```bash
# Start development server on 0.0.0.0:3000
npm run dev

# Access at http://localhost:3000 or http://0.0.0.0:3000
```

## Production Deployment

### Option 1: Cloudflare Pages (Recommended)

#### 1. Build for Production
```bash
# Create production build
npm run build

# Test production build locally
npm run start:standalone
```

#### 2. Deploy to Cloudflare Pages
```bash
# Deploy to production
npm run deploy

# Deploy to staging
npm run deploy:staging

# Deploy without rebuilding
npm run deploy:skip-build
```

#### 3. Configure Cloudflare Resources
```bash
# Create D1 Database
wrangler d1 create attheon-benchmark-db

# Create R2 Storage Bucket
wrangler r2 bucket create attheon-benchmark-storage

# Create KV Namespace
wrangler kv namespace create attheon-benchmark-cache
```

#### 4. Update Environment Variables
Add the IDs from step 3 to your `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "atheon-benchmark-db"
database_id = "your-database-id"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "atheon-benchmark-storage"

[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
```

### Option 2: Docker Deployment

#### 1. Build Docker Image
```bash
# Build image
docker build -t ateon-benchmark-dashboard .

# Tag for registry
docker tag attheon-benchmark-dashboard:latest your-registry/attheon-benchmark-dashboard:latest
```

#### 2. Run Container
```bash
# Run container
docker run -d \
  --name attheon-dashboard \
  -p 3000:3000 \
  -e ANTHROPIC_API_KEY=your_key \
  your-registry/attheon-benchmark-dashboard:latest
```

### Option 3: Traditional Node.js Deployment

#### 1. Build and Prepare
```bash
# Create production build
npm run build

# The standalone output is in .next/standalone/
```

#### 2. Deploy to Server
```bash
# Copy files to server
scp -r .next/standalone user@server:/var/www/attheon-dashboard/

# SSH into server
ssh user@server

# Navigate to deployment directory
cd /var/www/attheon-dashboard/

# Install production dependencies (if needed)
npm install --production

# Start server
PORT=3001 node server.js

# Or use PM2 for process management
pm2 start server.js --name attheon-dashboard
```

## Performance Optimization

### CDN Configuration
- Enable Cloudflare CDN for static assets
- Configure caching headers for optimal performance
- Use image optimization for faster loading

### Service Worker Strategy
The app uses CSR-First with multiple caching strategies:
- **Static Assets**: Cache-first (1 year)
- **API Calls**: Network-first (5 minutes)
- **Pages**: Stale-while-revalidate (24 hours)
- **Benchmark Results**: Cache-first (7 days)

### Database Optimization
- Use D1 database indexes for faster queries
- Implement connection pooling for API routes
- Cache frequently accessed data in KV storage

## Monitoring & Analytics

### Cloudflare Analytics
```bash
# View analytics
wrangler pages deployment list --project-name=attheon-benchmark-dashboard
```

### Error Tracking
- Integrate Sentry for error tracking
- Set up uptime monitoring
- Configure alerts for failures

### Performance Monitoring
```bash
# Check performance
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/
```

## Security Best Practices

### 1. Environment Variables
- Never commit `.env.local` files
- Use environment-specific configurations
- Rotate API keys regularly

### 2. CORS Configuration
```typescript
// lib/security/auth.ts
const allowedOrigins = [
  'https://your-domain.com',
  'https://www.your-domain.com'
];
```

### 3. Rate Limiting
```typescript
// Default rate limit: 100 requests per minute
const rateLimit = {
  requests: 100,
  window: 60
};
```

### 4. Content Security
- Enable HTTP headers for security
- Configure CSP headers
- Implement input validation

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### 2. API Route Errors
- Check if API routes are properly configured
- Verify environment variables are set
- Check browser console for errors

#### 3. Service Worker Issues
```bash
# Clear service worker cache
# In browser DevTools > Application > Service Workers
# Click "Unregister" and reload
```

#### 4. Database Connection Issues
```bash
# Verify D1 database configuration
wrangler d1 list

# Test database connection
wrangler d1 execute attheon-benchmark-db --command="SELECT 1"
```

## Continuous Deployment

### GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: cloudflare/wrangler-action@v2
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy .next --project-name=attheon-benchmark-dashboard
```

## Backup and Recovery

### Database Backups
```bash
# Export D1 database
wrangler d1 export attheon-benchmark-db --output=backup.sql

# Import D1 database
wrangler d1 import attheon-benchmark-db --input=backup.sql
```

### Configuration Backups
```bash
# Backup configuration files
tar -czf config-backup.tar.gz \
  wrangler.toml \
  .env.production \
  next.config.ts
```

## Scaling Considerations

### Horizontal Scaling
- Use Cloudflare Pages for global distribution
- Deploy multiple instances behind load balancer
- Configure CDN caching rules

### Vertical Scaling
- Increase Worker CPU limits
- Upgrade database tier
- Add more KV namespaces

## Cost Optimization

### Cloudflare Pricing
- Pages: Free for personal projects
- Workers: 100k requests/day free
- D1: 5M rows/read per day free
- R2: 10GB storage free
- KV: 100k reads/day free

### Optimization Tips
- Enable caching where possible
- Use static generation for static content
- Optimize image sizes
- Minimize API calls

## Support and Maintenance

### Regular Maintenance
```bash
# Update dependencies monthly
npm update

# Check for security vulnerabilities
npm audit

# Rebuild and deploy
npm run build
npm run deploy
```

### Monitoring
- Set up uptime monitoring
- Configure error alerts
- Review performance metrics

### Documentation
- Keep deployment documentation updated
- Document custom configurations
- Maintain change logs

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [PWA Documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Atheon Documentation](https://github.com/HoraDomu/Atheon)

---

**Last Updated**: 2026-06-19
**Version**: 1.0.0
**Maintained By**: Atheon Benchmark Team
