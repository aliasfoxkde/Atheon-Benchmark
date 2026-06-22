# Gap Resolution Plan — Atheon-Benchmark

## Phase 1: Critical Security Fixes
- [x] C1: Fix command injection in binary-scanner.ts (exec → execFile)
- [x] C2: Enable auth by default, wire into server routes
- [x] C3: Fix permissive CORS in server/src/index.ts
- [x] C4: Add Zod validation to POST endpoints
- [x] C5: Remove mock-api-key fallback, fail fast
- [x] C6: Replace Function() in mcp-integration tests with mathjs

## Phase 2: Workflow Fixes
- [x] W1: Fix typo `attheon` → `atheon` in ci.yml
- [x] W2: Fix invalid upload path in ci.yml
- [x] W3: Fix deploy directory `.next` → `out` in deploy.yml
- [ ] W4: Remove silent test failure in deploy.yml
- [x] W5: Update cloudflare/pages-action to v2
- [ ] W6: Remove dead comment-deployment step in benchmark.yml
- [ ] W7: Use variable for GitHub repo in ci.yml
- [ ] W8: Fix artifact name conflict in ci.yml
- [ ] W9: Fix fragile build verification in test.yml
- [x] W10: Add concurrency groups to all workflows
- [x] W11: Add timeout-minutes to all jobs

## Phase 3: Remove Simulated/Fake Code
- [ ] S1: Remove SimpleBenchmarkRunner (random results)
- [ ] S2: Implement real Go runner or document placeholder
- [ ] S3: Implement executeBenchmark endpoint or remove stub
- [ ] S4: Fail fast on missing API key in vanilla.ts
- [ ] S5: Remove hardcoded dev paths and fallback patterns
- [ ] S6: Use real Web Vitals in performance-monitor.tsx
- [ ] S7: Add real Cloudflare Web Analytics or remove placeholder

## Phase 4: Hardcoded Values & Constants
- [ ] H1: Use env var for Atheon binary path
- [ ] H2: Use env var for patterns bundle path
- [ ] H3: Use env var for dashboard URL
- [ ] H4: Use env var for CORS origins
- [ ] H6: Extract max_retries to constant
- [ ] H7: Extract statistical constants to named variables
- [ ] H8: Extract cache key to constant

## Phase 5: Documentation Fixes
- [ ] D1: Delete or fix docs/PLAN.md, docs/PROGRESS.md, docs/TASKS.md
- [ ] D2: Update IMPLEMENTATION_SUMMARY.md pattern count
- [ ] D3: Fix ATHEON_PATTERNS.md contradictions
- [ ] D4: Fix README architecture section
- [ ] D5: Fix broken links in README
- [ ] D6: Fix conflicting deploy directories in DEPLOYMENT.md
- [ ] D7: Update Node version in DEPLOYMENT.md
- [ ] D8: Fix API.md references to non-existent modules
- [ ] D9: Archive or delete stale docs (BENCHMARK_PLAN.md, etc.)
- [ ] D10: Clean up planning/ directory

## Phase 6: Dependencies & Scripts
- [ ] D1: Fix lucide-react version
- [ ] D2: Add server/package-lock.json (done)
- [ ] D3: Update wrangler
- [ ] D4: Update vitest
- [ ] D5: Update @types/node
- [ ] M1: Add format/format:check to dashboard
- [ ] M2: Add clean script
- [ ] M3: Add lint to server
- [ ] M6: Add db scripts
- [ ] M7: Add audit script

## Phase 7: Test Coverage Improvements
- [ ] T1: Improve database.ts coverage (target 50%+)
- [ ] T2: Improve measurements.ts coverage
- [ ] T3: Improve atheon-integration.ts coverage
- [ ] T4: Add tests for build-time.ts
