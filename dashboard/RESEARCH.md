# Research: GAP Phase 4 Hardcoded Values Resolution

## Objective
Fix hardcoded values in the dashboard codebase per GAP_RESOLUTION_PLAN Phase 4 items H1-H8.

## Items to Address
- H1: Use env var for Atheon binary path (verify existing implementation)
- H2: Use env var for patterns bundle path (extract default to constant)
- H3: Use env var for dashboard URL
- H6: Extract max_retries to constant
- H7: Extract statistical constants to named variables
- H8: Extract cache key to constant

## Analysis
- H1: Already uses process.env.ATHEON_BINARY_PATH in binary-scanner.ts
- H2: Needs DEFAULT_ATHEON_BUNDLE_PATH constant + use env var
- H3: Dashboard URL not using env var
- H4: Done in server (CORS)
- H6: max_retries: 3 is hardcoded in configurations.ts
- H7: Statistical constants like 1.96, 0.05, 0.95 in measurements.ts
- H8: Cache keys appear to be constants already
