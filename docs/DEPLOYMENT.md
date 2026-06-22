# Atheon Benchmark Deployment Guide

Complete guide for deploying the Atheon Benchmark Dashboard to production.

**🌐 Live Dashboard**: https://atheon-benchmark-dashboard.pages.dev/

## 🎯 Deployment Overview

The Atheon Benchmark Dashboard is deployed as a **static Next.js application** to Cloudflare Pages with:

- **Static HTML/CSS/JS**: Pre-rendered pages for instant loading
- **Build-time Data Fetching**: GitHub results fetched during build
- **Client-side Caching**: Browser localStorage for API results
- **PWA Support**: Service worker for offline capabilities

## Prerequisites

- Cloudflare account with Pages enabled
- GitHub account with GitHub CLI (optional)
- Node.js 18+ and npm
- GitHub personal access token (optional, for higher API rate limits)

## 🚀 Quick Deploy

### Automated Deployment

```bash
# Clone repository
git clone https://github.com/aliasfoxkde/Atheon-Benchmark.git
cd Atheon-Benchmark/dashboard

# Install dependencies
npm install

# Deploy to production
npm run deploy
```

This will:
1. **Fetch real benchmark data** from GitHub repository
2. **Build static files** with Next.js
3. **Deploy to Cloudflare Pages** at `https://atheon-benchmark-dashboard.pages.dev`

## 📁 Project Structure

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

## 🏗️ Build Process

### Development Build

```bash
cd dashboard
npm run dev
```

The development server:
- Runs on http://localhost:3000
- Supports hot reloading
- Uses GitHub API in real-time
- Falls back to cached data when API fails

### Production Build

```bash
cd dashboard
npm run build
```

The production build:
1. **Fetches Results**: Downloads latest benchmark data from GitHub
2. **Generates Static Files**: Creates optimized HTML/CSS/JS
3. **Creates PWA Assets**: Generates service worker and manifest
4. **Optimizes Assets**: Minifies and compresses files

Build output:
- `out/` - Static files for deployment
- `public/benchmark-results.json` - Benchmark data
- `public/benchmark-metadata.json` - Metadata and stats

## 🌐 Cloudflare Pages Deployment

### Manual Deployment

```bash
cd dashboard

# Build and deploy
npm run deploy

# Deploy to staging
npm run deploy:staging

# Deploy without rebuilding
npm run deploy:skip-build
```

### Automated Deployment Script

The deployment script (`scripts/deploy-cloudflare.sh`) handles:

1. **Dependencies**: Installs npm packages
2. **Build**: Runs Next.js production build
3. **Data Fetching**: Fetches latest benchmark results from GitHub
4. **Upload**: Uploads to Cloudflare Pages
5. **Cache Clearing**: Clears Cloudflare cache automatically

### Wrangler CLI

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy manually
wrangler pages deploy out --project-name=atheon-benchmark-dashboard
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
          directory: dashboard/out
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

## 🔧 Configuration

### GitHub Results Repository

The dashboard fetches benchmark results from a GitHub repository. Configure this in `dashboard/lib/github/results.ts`:

```typescript
export const DEFAULT_GITHUB_CONFIG: GitHubResultsConfig = {
  owner: 'aliasfoxkde',           // GitHub username
  repo: 'atheon-benchmark-results', // Results repository
  branch: 'main',                  // Default branch
  token: process.env.GITHUB_TOKEN  // Optional API token
};
```

### Build-time Data Fetching

The `scripts/fetch-results.js` script fetches data during build:

```javascript
// Configuration at top of file
const GITHUB_OWNER = 'aliasfoxkde';
const GITHUB_REPO = 'atheon-benchmark-results';
const RESULTS_PATH = 'results';
```

### Environment Variables

```bash
# Optional: GitHub token for higher API rate limits
export GITHUB_TOKEN="your_github_token"

# The build script automatically uses this if available
```

## 📊 Current Deployment Status

**Live Site**: https://atheon-benchmark-dashboard.pages.dev/

**Current Configuration**:
- **Framework**: Next.js 16.2.9 with static export
- **Hosting**: Cloudflare Pages
- **Data Source**: GitHub repository (aliasfoxkde/atheon-benchmark-results)
- **Build Type**: Static site with build-time data fetching
- **Caching**: Multi-layer caching (build-time + browser localStorage)

**Performance**:
- **Page Load**: < 2s average
- **Data Refresh**: On each build/deployment
- **Static Assets**: CDN-cached globally
- **PWA**: Offline capable

## 🔄 Continuous Deployment

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

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

      - name: Build and deploy
        run: |
          cd dashboard
          npm run build
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: atheon-benchmark-dashboard
          directory: dashboard/out
```

### Manual Deployment

```bash
# Deploy latest changes
git push origin main
# Then run: npm run deploy
```

## 🐛 Troubleshooting

### Build Issues

**Problem**: Build fails with "GitHub API rate limit exceeded"
```bash
# Solution: Add GitHub token
export GITHUB_TOKEN="your_token"
npm run build
```

**Problem**: Results page shows no data
```bash
# Solution: Check GitHub repository has results
curl https://api.github.com/repos/aliasfoxkde/atheon-benchmark-results/contents/results
```

### Deployment Issues

**Problem**: Deployment fails with "Unauthorized"
```bash
# Solution: Authenticate with Cloudflare
npx wrangler login
npm run deploy
```

**Problem**: Site not updating after deployment
```bash
# Solution: Clear browser cache and Cloudflare cache
npx wrangler pages cache clear --project-name=atheon-benchmark-dashboard
```

## 🧪 Testing Deployments

### Test Production Deployment

```bash
# Test main site
curl -I https://atheon-benchmark-dashboard.pages.dev/

# Test results data
curl https://atheon-benchmark-dashboard.pages.dev/benchmark-results.json | jq '.'

# Test metadata
curl https://atheon-benchmark-dashboard.pages.dev/benchmark-metadata.json | jq '.'
```

### Test Locally

```bash
cd dashboard
npm run build
npm run serve
# Visit http://localhost:8080
```

## 📈 Performance Monitoring

### Cloudflare Analytics

Access analytics at:
https://dash.cloudflare.com/[account-id]/pages/view/atheon-benchmark-dashboard/analytics

### Key Metrics

- **Page Load Time**: Should be < 2s
- **First Contentful Paint**: Should be < 1s
- **Time to Interactive**: Should be < 3s
- **Cache Hit Rate**: Should be > 80%

## 🔒 Security

### API Key Management

- Never commit API keys to the repository
- Use environment variables for sensitive data
- Rotate GitHub tokens regularly
- Use GitHub Secrets in CI/CD

### Static Site Security

The dashboard is static, which provides inherent security:
- No server-side code execution
- No database connections
- No user authentication required
- Read-only GitHub API access

## 🔄 Rollback Procedure

If deployment fails:

```bash
# List recent deployments
npx wrangler pages deployment list --project-name=atheon-benchmark-dashboard

# Rollback to previous deployment (manual process)
# Redeploy previous version or use Cloudflare dashboard
```

## 📚 Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [GitHub REST API](https://docs.github.com/en/rest)

---

**Need Help?** Open an issue at [GitHub Issues](https://github.com/aliasfoxkde/Atheon-Benchmark/issues)

**Last updated**: June 19, 2026