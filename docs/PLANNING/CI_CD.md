# CI/CD Pipeline Documentation

## Overview

Atheon-Benchmark uses GitHub Actions for continuous integration and deployment.

## Workflows

### 1. ci.yml - Main CI Pipeline

**File**: `.github/workflows/ci.yml`

**Triggers**:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Jobs**:

```
┌─────────────────────────────────────────────────────────────┐
│                        CI Pipeline                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                  │
│  │  lint   │───▶│  test   │───▶│  build  │                  │
│  └─────────┘    └─────────┘    └─────────┘                  │
│       │             │             │                         │
│       └─────────────┴─────────────┴───────┐                 │
│                                           │                 │
│                     ┌─────────────────────┴───┐              │
│                     │                         │              │
│              ┌──────▼──────┐          ┌──────▼──────┐      │
│              │deploy-staging│          │deploy-prod  │      │
│              │ (develop)   │          │ (main only) │      │
│              └─────────────┘          └─────────────┘      │
│                                           │                 │
│                                           ▼                 │
│                                    ┌──────────────┐         │
│                                    │  smoke-test  │         │
│                                    └──────────────┘         │
│                                                             │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────┐       │
│  │dependency-   │  │    sbom    │  │security-scan │       │
│  │review        │  │(main only) │  │              │       │
│  └──────────────┘  └────────────┘  └──────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Job Details**:

| Job | Timeout | Description |
|-----|---------|-------------|
| lint | 10m | ESLint + TypeScript check |
| test | 15m | Jest unit tests + coverage |
| build | 15m | Next.js static export |
| deploy-staging | 10m | Deploy to staging (develop) |
| deploy-production | 15m | Deploy to production (main) |
| dependency-review | 10m | GitHub dependency review |
| sbom | 10m | Generate SPDX SBOM (main only) |
| security-scan | 10m | Atheon scan + secrets check |

### 2. deploy.yml - Dedicated Deploy

**File**: `.github/workflows/deploy.yml`

**Triggers**:
- Push to `main` when `dashboard/**` changes
- Manual dispatch

**Jobs**:

| Job | Description |
|-----|-------------|
| deploy | Build + deploy to Cloudflare Pages |
| test-deployment | Smoke test the deployment |

### 3. test.yml - Test Workflow

**File**: `.github/workflows/test.yml`

**Triggers**:
- Push to `main` or `develop` when `dashboard/**` changes
- Pull requests when `dashboard/**` changes

**Jobs**:
- lint
- test
- build-test

### 4. benchmark.yml - Scheduled Benchmarks

**File**: `.github/workflows/benchmark.yml`

**Triggers**:
- Scheduled: Daily at 02:00 UTC
- Manual dispatch

**Jobs**:
- run-benchmark
- compare-results
- notify-results

## Environment Variables

### Required Secrets

| Secret | Description |
|--------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key for benchmarks |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `CODECOV_TOKEN` | Codecov upload token |

### Optional

| Variable | Description |
|----------|-------------|
| `SNYK_TOKEN` | Snyk security scanning |

## Cloudflare Deployment

### Pages

```yaml
- name: Deploy to Cloudflare Pages
  uses: cloudflare/pages-action@v2
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    projectName: atheon-benchmark-dashboard
    directory: dashboard/out
    gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### Workers

```bash
cd server
npx wrangler deploy --env production
```

## Caching

### Dependencies

```yaml
- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

### Build

```yaml
- name: Cache Next.js build
  uses: actions/cache@v4
  with:
    path: |
      .next/cache
      dashboard/node_modules
    key: ${{ runner.os }}-nextjs-${{ hashFiles('dashboard/package-lock.json') }}
```

## Notifications

### Failure Notification

On pipeline failure:
1. GitHub PR comment (if PR)
2. GitHub Actions summary
3. Email (if configured)

### Success Notification

On successful production deploy:
1. GitHub Actions summary
2. Cloudflare Analytics

## Rollback

### Automatic

GitHub Actions keeps deployment history. To rollback:

```bash
# Via Cloudflare CLI
npx wrangler pages deployment rollback <deployment-id>

# Via Dashboard
# Settings → Deployments → Actions → Rollback
```

### Manual

```bash
git revert <commit-sha>
git push origin main
```

## Monitoring

| Tool | Purpose |
|------|---------|
| GitHub Actions | CI/CD logs |
| Cloudflare Analytics | Traffic, performance |
| Codecov | Test coverage tracking |
| Snyk/GitHub | Dependency vulnerabilities |

## Troubleshooting

### Build Failures

1. Check Actions logs for specific error
2. Run `npm run build` locally
3. Verify environment variables

### Deployment Failures

1. Check Cloudflare Pages dashboard
2. Verify `wrangler.toml` configuration
3. Check for build output size limits

### Test Failures

1. Run tests locally with coverage
2. Check for flaky tests
3. Verify test environment setup

## Security Considerations

1. **Secrets**: Never log secrets, use GitHub encrypted secrets
2. **API Tokens**: Rotate regularly
3. **Dependencies**: Keep updated via Dependabot
4. **SBOM**: Generated for supply chain visibility
5. **Scanning**: Run security scans on every PR
