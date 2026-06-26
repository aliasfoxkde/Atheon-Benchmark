# Research: Atheon-Benchmark Improvements

## Date: 2026-06-25

## Identified Gaps

### 1. Benchmark System Gaps
- **Zero external project comparison**: The runner only benchmarks Atheon against itself, not competitors (gitleaks, trufflehog, semgrep)
- **Generated test data is trivially matchable**: AWS-style literal patterns that always match
- **Statistical bugs in run.go**: MeanAllocationsPerOp = len/len = 1, successRate always 100%
- **Missing context.Context**: pattern_matching.go benchmarks don't pass context

### 2. UI/UX Gaps
- **PWA install prompt missing**: manifest.json and sw.js exist but no install flow
- **WebSocket infrastructure unused**: lib/websocket/client.ts, lib/collaboration/realtime.ts are dead code
- **i18n half-built**: lib/i18n/index.ts exists but no additional locales

### 3. Data Gaps
- **No real historical data**: localStorage only, no global aggregation
- **Version comparison broken**: stores ns_per_op=0 placeholders
- **No anomaly detection**: no flagging of runs >2σ from baseline

### 4. Technical Debt
- **bundle_download_test.go**: SetBundleDownloadURL undefined
- **context_cancel_test.go**: scanLines signature mismatch
- **cmd/atheon/main.go**: DownloadBundle called with ctx but signature takes none

## Constraints
- Must use existing patterns (don't create new pattern files)
- Dashboard must pass TypeScript checks
- External benchmarks must work with build tags
- PWA must respect user privacy (no tracking)

## Solutions Researched
1. **External benchmarks**: Create external.go with build tags for conditional compilation
2. **Statistical fixes**: Fix MeanAllocationsPerOp, successRate calculations
3. **Context params**: Add context.Context to ScanString calls in benchmarks
4. **PWA install prompt**: Create component that handles beforeinstallprompt event
