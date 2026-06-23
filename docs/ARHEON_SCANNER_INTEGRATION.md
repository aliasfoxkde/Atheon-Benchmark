# Arheon-Scanner Integration Guide

Reference guide for integrating components from Arheon-Scanner into Atheon-Benchmark.

## Overview

Arheon-Scanner (Atheon-GitHub-Scanner) and Atheon-Benchmark share architectural patterns and can leverage shared components for consistency and reduced duplication.

---

## E1: Shared Components

### 1. Pattern Matching Engine

**Location:** `/nas/Temp/repos/Atheon-GitHub-Scanner/agents/`

**Referenceable Files:**
- `comprehensive_universal_scanner.py` - Multi-ecosystem pattern detection ( NPM, PyPI, Go, Cargo, RubyGems)
- `mass_repository_scanner.py` - GitHub API-based repository discovery
- `quality_audit_system.py` - Quality pattern analysis
- `vulnerability_integration.py` - Security vulnerability patterns
- `zero_day_detector.py` - Advanced threat pattern detection

**Pattern Structure:**
```yaml
pattern_id: unique-pattern-id
name: Descriptive Pattern Name
category: pattern-category
severity: [high|medium|low]
description: Clear explanation of what the pattern detects
examples:
  - language: javascript|typescript|python|go
    code: |
      # Example code
    expected: true
remediation:
  steps:
    - Step 1
  best_practice: Best practice
references:
  - title: Reference
    url: https://example.com
```

**Import Guidance:** Do not extract - reference via path imports. The pattern format is YAML-based and can be shared via a common pattern schema.

---

### 2. Report Generation System

**Location:** `/nas/Temp/repos/Atheon-GitHub-Scanner/agents/`

**Components:**
- `daemon_runner.py` - Daemon orchestration with scheduled reporting
- `cross_repo_integrator.py` - Cross-repository analysis and reporting
- `self_improvement_agent.py` - Automated improvement detection

**Security Patterns Applied:**
- Path sanitization with `sanitize_path()` function (daemon_runner.py:22-42)
- Bearer token authentication
- Rate limiting on API endpoints
- CORS origin validation

**Reference:** `/nas/Temp/repos/Atheon-GitHub-Scanner/docs/security_pattern_implementation_guide.md`

---

### 3. Web Dashboard Components

**Location:** `/nas/Temp/repos/Atheon-GitHub-Scanner/web-app/`

**Referenceable Components:**

| Component | Path | Purpose |
|-----------|------|---------|
| App.jsx | `web-app/src/App.jsx` | PWA install prompt, offline banner, routing |
| Charts.jsx | `web-app/src/components/Charts.jsx` | Data visualization with Chart.js |
| ErrorBoundary.jsx | `web-app/src/components/ErrorBoundary.jsx` | React error boundaries |
| Toast.jsx | `web-app/src/components/Toast.jsx` | Notification system |
| SecurityRadarChart.jsx | `web-app/src/components/SecurityRadarChart.jsx` | Security metrics visualization |
| Skeleton.jsx | `web-app/src/components/Skeleton.jsx` | Loading states |

**Service Layer:**
- `realScannerData.js` - API client with caching (60s TTL), abort signal support, fallback data

**Import Pattern:**
```javascript
// From web-app/src/services/realScannerData.js
import { loadRealScannerData, getAllRepositories, checkApiHealth } from '@atheon-scanner/web-app/services';
```

---

## E2: Shared Infrastructure

### 1. Cloudflare Worker Patterns

**Location:** `/nas/Temp/repos/Atheon-GitHub-Scanner/cloudflare-worker/worker.js`

**Security Patterns Applied:**
- CORS origin allowlist via `WORKER_ORIGINS` env var
- Bearer token authentication via `API_TOKEN` env var
- In-memory rate limiting (100 req/min per client IP)
- Input validation on all query parameters
- POST body validation before processing

**Reference Pattern:**
```javascript
// CORS with configurable origins
const ALLOWED_ORIGINS = (env.WORKER_ORIGINS || 'https://your-dashboard.example.com').split(',');

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const isAllowed = ALLOWED_ORIGINS.some(allowed =>
    allowed.trim() === origin || allowed.trim() === '*'
  );
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0] || '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Rate limiting
const RATE_LIMIT = 100;
const RATE_WINDOW = 60000;

function checkRateLimit(clientId) {
  const now = Date.now();
  const record = rateLimitStore.get(clientId) || { count: 0, resetAt: now + RATE_WINDOW };
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + RATE_WINDOW;
  }
  record.count++;
  rateLimitStore.set(clientId, record);
  return record.count <= RATE_LIMIT;
}

// Auth check
function requireAuth(request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  const expectedToken = env.API_TOKEN || '';
  return { authorized: !expectedToken || token === expectedToken };
}
```

**API Endpoints:**
- `/api/stats` - Statistics overview
- `/api/repositories` - Paginated repository list with filtering
- `/api/languages` - Language distribution
- `/api/patterns` - Pattern analysis data
- `/api/ecosystems` - Ecosystem comparison
- `/api/health` - Health check
- `/api/refresh` - Authenticated data refresh

---

### 2. Docker Configurations

**Location:** `/nas/Temp/repos/Atheon-GitHub-Scanner/docker/docker-compose.yml`

**Pattern:** Multi-service scanner architecture with resource limits

```yaml
services:
  rubygems-scanner:
    build:
      context: ..
      dockerfile: docker/scanners/Dockerfile.ruby
    volumes:
      - ../agents:/scan:ro
      - ../data:/scan/data
    environment:
      - SCAN_COUNT=50
      - OUTPUT_DIR=/scan/data
      - TEMP_DIR=/tmp/atheon-scanner
    mem_limit: 2g
    cpus: 2
    networks:
      - scanner-network

networks:
  scanner-network:
    driver: bridge
```

**Shared Patterns:**
- Read-only volume mounts for source code
- Separate output directories
- Configurable scan counts via environment
- Resource limits (mem_limit, cpus)
- Shared network for inter-service communication

---

### 3. CI/CD Workflows

**Status:** No `.github/workflows/` directory present in Arheon-Scanner.

**Alternative Automation:**
- `agents/deploy_automation.sh` - Deployment automation script
- `agents/master_setup.sh` - Master setup script
- `agents/setup.sh` - Initial setup

---

## Security Patterns Applied

### Already Implemented in Arheon-Scanner

| Pattern | Location | Description |
|---------|----------|-------------|
| Path Sanitization | `daemon_runner.py:22-42` | Prevents path traversal with `sanitize_path()` |
| Command Injection Prevention | Multiple scanner files | Package names validated before shell commands |
| CORS Configuration | `worker.js` | Origin allowlist via environment variable |
| Rate Limiting | `worker.js` | In-memory rate limit store |
| Bearer Token Auth | `worker.js` | `API_TOKEN` environment variable |
| Input Validation | `worker.js` | Query param and POST body validation |

### For Atheon-Benchmark Reference

1. **Path Traversal Prevention:**
   ```python
   def sanitize_path(path: str, base_dir: str = None) -> str:
       path = path.replace('\x00', '')
       path = re.sub(r'\.\.[/\\]', '', path)
       abs_path = os.path.abspath(path)
       if base_dir:
           base_abs = os.path.abspath(base_dir)
           if not abs_path.startswith(base_abs):
               return base_abs
       return abs_path
   ```

2. **Bearer Token Authentication:**
   ```javascript
   function requireAuth(request) {
     const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
     const expectedToken = env.API_TOKEN || '';
     return { authorized: !expectedToken || token === expectedToken };
   }
   ```

3. **Rate Limiting:**
   ```javascript
   const RATE_LIMIT = 100;
   const RATE_WINDOW = 60000;
   // Use CF-Connecting-IP for client identification
   const clientId = request.headers.get('CF-Connecting-IP') || 'unknown';
   ```

---

## Import/Reference Guidance

### Do NOT Extract (Reference Only)
- Pattern matching engine code in `agents/`
- Cloudflare Worker implementation
- Docker compose patterns

### Can Reference
- Security pattern implementations
- API endpoint patterns
- Service architecture
- Configuration management

### File Path References

| Component | Arheon-Scanner Path | Use |
|-----------|---------------------|-----|
| Worker Pattern | `/nas/Temp/repos/Atheon-GitHub-Scanner/cloudflare-worker/worker.js` | Security pattern reference |
| Docker Compose | `/nas/Temp/repos/Atheon-GitHub-Scanner/docker/docker-compose.yml` | Service architecture |
| Daemon Runner | `/nas/Temp/repos/Atheon-GitHub-Scanner/agents/daemon_runner.py` | Path sanitization, repo management |
| Web Services | `/nas/Temp/repos/Atheon-GitHub-Scanner/web-app/src/services/realScannerData.js` | API client patterns |
| React Components | `/nas/Temp/repos/Atheon-GitHub-Scanner/web-app/src/components/*.jsx` | UI component patterns |

---

## Version Information

- **Created:** 2026-06-22
- **Source Repository:** Atheon-GitHub-Scanner (Arheon-Scanner)
- **Target Repository:** Atheon-Benchmark
