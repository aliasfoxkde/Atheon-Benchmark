# Atheon Benchmark Deployment Guide

This guide provides step-by-step instructions for deploying the Atheon Benchmark Dashboard to production.

## Prerequisites

- Cloudflare account with Workers and Pages enabled
- Domain name (optional)
- Anthropic API key
- GitHub account (for CI/CD)
- Node.js 18+ and npm

## Initial Setup

### 1. Repository Setup

```bash
# Clone the repository
git clone https://github.com/your-username/Atheon-Benchmark.git
cd Atheon-Benchmark

# Install dependencies
cd dashboard
npm install
```

### 2. Environment Configuration

Create `.env` file in the dashboard directory:

```bash
# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Cloudflare (optional for local development)
CLOUDFLARE_API_KEY=your_cloudflare_api_key
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Cloudflare Setup

### 1. Create D1 Database

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create atheon-benchmark-db

# Note the database ID from the output
```

Update `dashboard/wrangler.toml` with your database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "atheon-benchmark-db"
database_id = "your-database-id-here"
```

### 2. Create R2 Bucket

```bash
# Create R2 bucket
wrangler r2 bucket create atheon-benchmark-storage
```

Update `dashboard/wrangler.toml`:

```toml
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "atheon-benchmark-storage"
```

### 3. Create KV Namespace

```bash
# Create KV namespace
wrangler kv namespace create BENCHMARK_CACHE
```

Update `dashboard/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-id-here"
```

### 4. Run Database Migrations

```bash
# Apply database schema
wrangler d1 execute DB --file=../schemas/database.sql

# Or use the npm script
cd dashboard
npm run db:migrate
```

## Deployment Methods

### Method 1: Cloudflare Pages (Recommended)

#### 1. Connect GitHub Repository

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Workers & Pages
3. Click "Create application" → "Connect to Git"
4. Select your GitHub repository

#### 2. Configure Build Settings

```
Build command: npm run build
Build output directory: .next
Root directory: dashboard
```

#### 3. Set Environment Variables

Add these environment variables in Cloudflare Pages settings:

```
ANTHROPIC_API_KEY: your_api_key
NODE_ENV: production
```

#### 4. Deploy

```bash
# Trigger deployment from your repository
git push origin main

# Or manually deploy
cd dashboard
npm run build
npx wrangler pages deploy .next
```

### Method 2: Cloudflare Workers

#### 1. Build the Workers

```bash
cd server
npm run build:workers
```

#### 2. Deploy Workers

```bash
# Deploy to production
npm run deploy:production

# Deploy to staging
npm run deploy:staging
```

#### 3. Configure Custom Domain (Optional)

```bash
# Add custom domain
wrangler domains add your-domain.com
```

### Method 3: Docker Deployment

#### 1. Build Docker Image

```bash
# Build dashboard image
docker build -t atheon-benchmark-dashboard dashboard/

# Build server image
docker build -t atheon-benchmark-server server/
```

#### 2. Run Containers

```bash
# Run dashboard
docker run -d -p 3000:3000 \
  -e ANTHROPIC_API_KEY=your_key \
  --name atheon-dashboard \
  atheon-benchmark-dashboard

# Run server
docker run -d -p 8080:8080 \
  -e DATABASE_URL=your_db_url \
  --name atheon-server \
  atheon-benchmark-server
```

## CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd dashboard
          npm ci

      - name: Run tests
        run: |
          cd dashboard
          npm test

      - name: Build application
        run: |
          cd dashboard
          npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: atheon-benchmark
          directory: dashboard/.next
```

### Environment Secrets

Add these secrets to your GitHub repository:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `ANTHROPIC_API_KEY`

## Monitoring and Logging

### 1. Cloudflare Analytics

Access real-time analytics in the Cloudflare Dashboard:

- Request volume and response times
- Error rates and status codes
- Geographic distribution
- Browser and device statistics

### 2. Application Monitoring

Set up application-specific monitoring:

```bash
# Add monitoring integration
cd dashboard
npm install @sentry/nextjs

# Configure Sentry
npx @sentry/wizard@latest -i nextjs
```

### 3. Log Aggregation

Configure log forwarding:

```bash
# Install logging service
npm install winston cloudflare-winston-transport
```

## Performance Optimization

### 1. CDN Caching

Configure caching rules in Cloudflare:

```javascript
// dashboard/next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};
```

### 2. Image Optimization

Enable image optimization:

```javascript
// dashboard/next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
};
```

### 3. Database Optimization

Create indexes for common queries:

```sql
-- Add indexes to D1 database
CREATE INDEX IF NOT EXISTS idx_benchmarks_status ON benchmarks(status);
CREATE INDEX IF NOT EXISTS idx_benchmarks_created_at ON benchmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_benchmark_id ON benchmark_results(benchmark_id);
```

## Security Hardening

### 1. API Key Management

- Use environment variables for all sensitive data
- Rotate API keys regularly
- Implement key-specific rate limits
- Monitor API usage for anomalies

### 2. CORS Configuration

Configure CORS properly:

```javascript
// server/src/index.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://your-domain.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

### 3. Rate Limiting

Implement rate limiting in Workers:

```javascript
// server/src/middleware/rate-limit.ts
export async function rateLimit(request: Request, env: Env) {
  const key = await getClientIdentifier(request);
  const count = await env.CACHE.get(key);

  if (count && parseInt(count) > 100) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  await env.CACHE.put(key, (parseInt(count || '0') + 1).toString(), {
    expirationTtl: 3600,
  });
}
```

## Backup and Recovery

### 1. Database Backups

```bash
# Backup D1 database
wrangler d1 export DB --output=backup.sql

# Schedule regular backups
# Add to cron job or GitHub Actions
```

### 2. R2 Backup

```bash
# Enable R2 versioning
wrangler r2 bucket versioning enable STORAGE

# Configure lifecycle policies
wrangler r2 bucket lifecycle configure STORAGE
```

### 3. Disaster Recovery

Create disaster recovery plan:

```yaml
# Recovery steps
1. Restore database from backup
2. Redeploy Workers from git
3. Verify environment variables
4. Test critical functionality
5. Monitor for anomalies
```

## Troubleshooting

### Common Issues

#### 1. Build Failures

```bash
# Clear build cache
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

#### 2. Database Connection Issues

```bash
# Test database connection
wrangler d1 execute DB --command="SELECT 1"

# Check database ID in wrangler.toml
```

#### 3. API Rate Limits

```bash
# Check current rate limits
wrangler analytics --period=24h

# Implement exponential backoff
```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
export DEBUG=atheon:*
npm run dev
```

## Maintenance

### Regular Tasks

- **Weekly**: Review error logs and performance metrics
- **Monthly**: Update dependencies and run security audits
- **Quarterly**: Review and optimize database queries
- **Annually**: Review and update architecture documentation

### Update Process

```bash
# 1. Backup current deployment
wrangler backups create

# 2. Update dependencies
npm update

# 3. Run tests
npm test

# 4. Deploy to staging
npm run deploy:staging

# 5. Test staging deployment
# (Manual testing steps)

# 6. Deploy to production
npm run deploy:production

# 7. Verify production deployment
# (Monitoring and smoke tests)
```

## Rollback Procedures

### Quick Rollback

```bash
# Rollback to previous version
wrangler rollback --compatibility-date=2024-06-01
```

### Database Rollback

```bash
# Restore from backup
wrangler d1 import DB --input=backup.sql
```

### Complete Redeploy

```bash
# Full redeploy from clean state
git clean -fdx
npm install
npm run build
npm run deploy:production
```

## Support

For deployment issues:

- **Documentation**: [Full docs](https://docs.atheon-benchmark.com)
- **GitHub Issues**: [Report issues](https://github.com/your-username/Atheon-Benchmark/issues)
- **Discord**: [Community support](https://discord.gg/atheon-benchmark)

---

Last updated: June 19, 2026