# Atheon Benchmark API Documentation

Complete API reference for the Atheon Benchmark Dashboard and related services.

## 🌐 Dashboard API

### Static Data Endpoints

The dashboard serves static JSON files for benchmark data:

#### Get All Benchmark Results

```http
GET /benchmark-results.json
```

**Response**:
```json
[
  {
    "system_id": "SWARMONE-2026-06-19",
    "system_info": {
      "hostname": "SWARMONE",
      "cpu": "amd64 CPU",
      "ram": "32231392 kB",
      "os": "linux/amd64",
      "arch": "amd64",
      "go_version": "go1.24.4"
    },
    "benchmarks": [
      {
        "id": "benchmark-1",
        "name": "Test Case 1",
        "duration_ms": 1234,
        "tokens_used": 100,
        "passed": true,
        "output": "Test passed",
        "timestamp": "2026-06-19T12:00:00Z"
      }
    ],
    "summary": {
      "total_tests": 100,
      "passed": 95,
      "failed": 5,
      "avg_duration_ms": 2345,
      "total_tokens": 10000
    },
    "submitted_at": "2026-06-19T12:00:00Z"
  }
]
```

#### Get Benchmark Metadata

```http
GET /benchmark-metadata.json
```

**Response**:
```json
{
  "total_systems": 1,
  "last_updated": "2026-06-19T19:38:13.883Z",
  "systems_by_os": {
    "linux/amd64": 1
  },
  "date_range": {
    "oldest": "2026-06-19T12:00:00Z",
    "newest": "2026-06-19T12:00:00Z"
  }
}
```

### PWA Manifest

```http
GET /manifest.json
```

**Response**:
```json
{
  "name": "Atheon Benchmark Dashboard",
  "short_name": "Atheon Benchmark",
  "description": "Comprehensive AI benchmark system",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 🔧 GitHub API Integration

### Results Fetcher API

The dashboard integrates with GitHub to fetch benchmark results:

#### Configuration

```typescript
interface GitHubResultsConfig {
  owner: string;      // GitHub username/organization
  repo: string;       // Repository name
  token?: string;     // Optional personal access token
  branch?: string;    // Default branch (default: "main")
}
```

#### Usage Example

```typescript
import { createGitHubResultsFetcher } from '@/lib/github/results';

const fetcher = createGitHubResultsFetcher({
  owner: 'aliasfoxkde',
  repo: 'atheon-benchmark-results',
  token: process.env.GITHUB_TOKEN
});

const results = await fetcher.fetchAllResults();
```

#### Caching

```typescript
import { createCachedGitHubResultsFetcher } from '@/lib/github/cache';

const cachedFetcher = createCachedGitHubResultsFetcher({
  owner: 'aliasfoxkde',
  repo: 'atheon-benchmark-results'
});

// Results are cached for 5 minutes
const results = await cachedFetcher.fetchAllResults();

// Get cache statistics
const stats = cachedFetcher.getCachedStatistics();
console.log(`Total systems: ${stats.total_systems}`);
console.log(`Is cached: ${stats.is_cached}`);
```

## 📊 Results Processing API

### Filter Interface

```typescript
interface ResultsFilter {
  hostname?: string;    // Filter by hostname
  os?: string;          // Filter by OS
  cpu?: string;         // Filter by CPU
  arch?: string;        // Filter by architecture
  dateFrom?: string;    // Filter by date range (ISO format)
  dateTo?: string;      // Filter by date range (ISO format)
  minTests?: number;    // Minimum number of tests
}
```

#### Usage

```typescript
import { filterResults } from '@/lib/github/results';

const filtered = filterResults(results, {
  os: 'linux',
  minTests: 50,
  dateFrom: '2026-01-01T00:00:00Z'
});
```

### Statistics API

```typescript
interface ResultsStatistics {
  total_systems: number;
  total_benchmarks: number;
  avg_duration_ms: number;
  success_rate: number;
  systems_by_os: Record<string, number>;
  systems_by_arch: Record<string, number>;
  date_range: {
    oldest: string;
    newest: string;
  };
}
```

#### Usage

```typescript
import { getResultsStatistics } from '@/lib/github/results';

const stats = getResultsStatistics(results);
console.log(`Success rate: ${stats.success_rate}%`);
console.log(`Systems by OS:`, stats.systems_by_os);
```

### Comparison API

```typescript
interface SystemComparison {
  system_id: string;
  system_info: SystemInfo;
  avg_duration_ms: number;
  total_tests: number;
  success_rate: number;
  total_tokens: number;
  submitted_at: string;
}
```

#### Usage

```typescript
import { compareSystems } from '@/lib/github/results';

const comparisons = compareSystems(results);

// Sort by success rate
comparisons.sort((a, b) => b.success_rate - a.success_rate);

// Find best performing system
const bestSystem = comparisons[0];
console.log(`Best system: ${bestSystem.system_id}`);
console.log(`Success rate: ${bestSystem.success_rate}%`);
```

## 🎯 Atheon Integration API

### Pattern Matching

```typescript
import { AtheonPatternMatcher } from '@/lib/atheon/patterns';

const matcher = new AtheonPatternMatcher();

// Scan code for patterns
const results = await matcher.scan(codeString);

// Get pattern statistics
const stats = matcher.getStatistics();
console.log(`Patterns detected: ${stats.totalPatterns}`);
console.log(`High severity: ${stats.highSeverity}`);
```

### Quality Gates

```typescript
import { AtheonQualityGate } from '@/lib/atheon/quality-gates';

const qualityGate = new AtheonQualityGate({
  maxHighSeverity: 0,
  maxMediumSeverity: 5,
  requiredCategories: ['security', 'performance']
});

const result = await qualityGate.validate(generatedCode);

if (!result.passed) {
  console.error('Quality gate failed:');
  result.violations.forEach(violation => {
    console.error(`- ${violation.pattern}: ${violation.message}`);
  });
}
```

## 📈 Monitoring API

### Performance Metrics

```typescript
import { collectPerformanceMetrics } from '@/lib/monitoring/analytics';

const metrics = collectPerformanceMetrics();
console.log(`Page load time: ${metrics.pageLoadTime}ms`);
console.log(`First contentful paint: ${metrics.firstContentfulPaint}ms`);
```

### Error Tracking

```typescript
import { ErrorTracker } from '@/lib/monitoring/analytics';

const errorTracker = new ErrorTracker();

// Get recent errors
const errors = errorTracker.getErrors();
console.log(`Total errors: ${errors.totalErrors}`);

// Export error data
const errorData = JSON.stringify(errors, null, 2);
```

## 🔐 Authentication & Security

### GitHub Token Management

```bash
# Set GitHub token for increased rate limits
export GITHUB_TOKEN="your_github_token"

# Use in application
const config = {
  owner: 'aliasfoxkde',
  repo: 'atheon-benchmark-results',
  token: process.env.GITHUB_TOKEN
};
```

### Rate Limits

- **Unauthenticated**: 60 requests per hour
- **Authenticated**: 5000 requests per hour
- **Cache Duration**: 5 minutes for data, 1 hour for metadata

## 🌍 Internationalization

### Supported Languages

```typescript
const supportedLanguages = [
  'en', // English (default)
  'es', // Spanish
  'fr', // French
  'de', // German
  'ja', // Japanese
  'zh', // Chinese
];
```

### Usage

```typescript
import { setLanguage, t } from '@/lib/i18n';

setLanguage('es');
console.log(t('dashboard.title')); // "Panel de control de Atheon Benchmark"
```

## 🧪 Testing API

### Pattern Testing

```typescript
import { testPattern } from '@/lib/atheon/testing';

const result = await testPattern('sql-injection', {
  code: 'db.query("SELECT * FROM users WHERE id = " + id)',
  expected: true
});

console.log(`Test result: ${result.passed ? 'PASSED' : 'FAILED'}`);
```

### Integration Testing

```typescript
import { testDashboardIntegration } from '@/lib/testing/dashboard';

const result = await testDashboardIntegration();
console.log(`Dashboard tests: ${result.passed ? 'PASSED' : 'FAILED'}`);
```

## 📚 Client-Side API

### Results Store

```typescript
import { useResultsStore } from '@/stores/results';

const {
  results,
  loading,
  error,
  filter,
  loadResults,
  updateFilter
} = useResultsStore();

// Load results
await loadResults();

// Update filter
updateFilter({ os: 'linux' });

// Access filtered results
const filtered = useResultsStore(state =>
  state.results.filter(result =>
    state.filter.os ? result.system_info.os.includes(state.filter.os) : true
  )
);
```

### Analytics Store

```typescript
import { useAnalyticsStore } from '@/stores/analytics';

const {
  metrics,
  errors,
  collectMetrics,
  exportData
} = useAnalyticsStore();

// Collect performance metrics
collectMetrics();

// Export analytics data
const data = exportData();
```

## 🔄 Webhook API (Future)

### Result Submission

```http
POST /api/results/submit
Content-Type: application/json

{
  "system_id": "SYSTEM-2026-06-19",
  "system_info": {
    "hostname": "test-system",
    "cpu": "Intel Core i7",
    "ram": "16GB",
    "os": "linux",
    "arch": "amd64"
  },
  "benchmarks": [...],
  "summary": {...}
}
```

### Webhook Configuration

```typescript
interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
}
```

## 📊 Response Formats

### Success Response

```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {...}
  }
}
```

## 🔄 Rate Limiting

### API Rate Limits

- **GitHub API**: 60-5000 requests per hour (depending on authentication)
- **Dashboard API**: No rate limiting (static site)
- **Cache Duration**: 5 minutes for data, 1 hour for metadata

### Rate Limit Headers

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4999
X-RateLimit-Reset: 1621555200
```

## 📚 SDK Examples

### JavaScript/TypeScript

```typescript
import { AtheonBenchmarkSDK } from '@atheon/benchmark-sdk';

const sdk = new AtheonBenchmarkSDK({
  dashboard: 'https://atheon-benchmark-dashboard.pages.dev',
  github: {
    owner: 'aliasfoxkde',
    repo: 'atheon-benchmark-results'
  }
});

// Get results
const results = await sdk.getResults();

// Submit results
await sdk.submitResults(benchmarkData);

// Compare systems
const comparison = await sdk.compareSystems(['system-1', 'system-2']);
```

### Python (Future)

```python
from atheon_benchmark import AtheonBenchmarkSDK

sdk = AtheonBenchmarkSDK(
    dashboard='https://atheon-benchmark-dashboard.pages.dev',
    github_owner='aliasfoxkde',
    github_repo='atheon-benchmark-results'
)

# Get results
results = sdk.get_results()

# Submit results
sdk.submit_results(benchmark_data)
```

## 🐛 Error Codes

| Code | Description | Solution |
|------|-------------|-----------|
| `GITHUB_API_ERROR` | GitHub API request failed | Check GitHub token and API rate limits |
| `INVALID_FILTER` | Invalid filter parameters | Verify filter values |
| `CACHE_ERROR` | Cache read/write failed | Check browser storage permissions |
| `NETWORK_ERROR` | Network request failed | Check internet connection |
| `PATTERN_ERROR` | Pattern matching failed | Verify pattern syntax |

---

**API Version**: 1.0.0
**Last Updated**: June 19, 2026
**Base URL**: https://atheon-benchmark-dashboard.pages.dev