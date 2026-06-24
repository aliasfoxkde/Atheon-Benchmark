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
- [x] W4: Remove silent test failure in deploy.yml
- [x] W5: Update cloudflare/pages-action to v2
- [x] W6: Remove dead comment-deployment step in benchmark.yml
- [x] W7: Use variable for GitHub repo in ci.yml
- [x] W8: Fix artifact name conflict in ci.yml
- [x] W9: Fix fragile build verification in test.yml
- [x] W10: Add concurrency groups to all workflows
- [x] W11: Add timeout-minutes to all jobs

## Phase 3: Remove Simulated/Fake Code
- [x] S1: Deprecate SimpleBenchmarkRunner (random results) - documented as testing-only
- [x] S2: Real Go runner via Cloudflare Workers or external runner
- [x] S3: executeBenchmark endpoint implemented in server
- [x] S4: Fail fast on missing API key in vanilla.ts
- [x] S5: Remove hardcoded dev paths - H2 fixed (bundle path uses env var)
- [x] S6: Web Vitals via real browser APIs when available
- [x] S7: Cloudflare Web Analytics configured via environment

## Phase 4: Hardcoded Values & Constants
- [x] H1: ATHEON_BINARY_PATH env var in binary-scanner.ts
- [x] H2: ATHEON_BUNDLE_PATH env var in atheon-integration.ts
- [x] H3: Dashboard URL via NEXT_PUBLIC_DASHBOARD_URL env var
- [x] H4: CORS origins via ALLOWED_ORIGINS env var
- [x] H6: MAX_RETRIES extracted as configurable constant
- [x] H7: Statistical constants (p50, p95, etc.) extracted in measurements.ts
- [x] H8: Cache keys extracted as CACHE_KEYS constant

## Phase 5: Documentation Fixes
- [x] D1: Delete or fix docs/PLAN.md, docs/PROGRESS.md, docs/TASKS.md
- [x] D2: Update IMPLEMENTATION_SUMMARY.md pattern count
- [x] D3: Fix ATHEON_PATTERNS.md contradictions
- [x] D4: Fix README architecture section
- [x] D5: Fix broken links in README
- [x] D6: Fix conflicting deploy directories in DEPLOYMENT.md
- [x] D7: Update Node version in DEPLOYMENT.md
- [x] D8: Fix API.md references to non-existent modules
- [x] D9: Archive or delete stale docs (BENCHMARK_PLAN.md, etc.)
- [x] D10: Clean up planning/ directory

## Phase 6: Dependencies & Scripts
- [x] D1: Fix lucide-react version - using ^1.21.0 which is latest
- [x] D2: Add server/package-lock.json
- [x] D3: Update wrangler to ^4.0.0
- [x] D4: Update vitest to ^2.0.0
- [x] D5: Update @types/node to ^22
- [x] M1: Add format/format:check to dashboard
- [x] M2: Add clean script
- [x] M3: Add lint to server
- [x] M6: Add db scripts
- [x] M7: Add audit script

## Phase 7: Test Coverage Improvements
- [x] T1: Improve database.ts coverage (now 100%)
- [x] T2: Improve measurements.ts coverage (now 99%)
- [x] T3: Improve atheon-integration.ts coverage
- [x] T4: Add tests for build-time.ts

**ALL PHASES COMPLETE** ✓

---

## Status Summary

- **Total Items**: 73+
- **Completed**: 73+
- **Remaining**: 0

**Test Status**: 910 tests passing, 0 lint errors

---

## Phase 8: Fresh Audit Fixes (2026-06-23)

### Critical
- [x] A1: Replace Math.random() UUID with crypto.randomUUID() in binary-scanner.ts

### High
- [x] A2: Make MCP_SERVER_URL configurable via NEXT_PUBLIC_MCP_SERVER_URL env var
- [x] A3: Make allowedOrigins configurable via ALLOWED_ORIGINS env var

### Medium (Future)
- [ ] A4: Add error boundaries to page components
- [ ] A5: Add input validation to user-facing form fields
- [ ] A6: Standardize error handling in API calls

### Low (Future)
- [ ] A7: Replace console.log with proper logging infrastructure
- [ ] A8: Add type interfaces for `any` types in MCP integration

**Phase 8 Status**: Critical/High items complete, Medium/Low are improvements

---

## Phase 9: Deep Architectural & Security Audit (2026-06-23)

### Critical (Enterprise Readiness)
- [x] A9-1: Fix allowedOrigins undefined bug in healthCheck (runtime ReferenceError)
- [x] A9-2: Add checkAuth() middleware to server API endpoints
- [x] A9-3: Add checkRateLimit() middleware (100 req/min per IP)

### High (Architectural Gaps)
- [x] A9-4: Add OpenTelemetry distributed tracing for Workers
- [x] A9-5: Implement circuit breaker pattern for Claude API calls
- [x] A9-6: Add D1 batch insert for benchmark results
- [x] A9-7: Implement multi-tenancy with organization_id scoping

### Medium (Operational Maturity)
- [x] A9-8: Generate SBOM (Software Bill of Materials)
- [x] A9-9: Add dependency-review-action to CI
- [x] A9-10: Add KV caching for frequently-read configurations
- [x] A9-11: Add security headers to Worker responses (CSP, HSTS)

### Low (Future Enhancements)
- [x] A9-12: Add API versioning strategy (/api/v1/)
- [x] A9-13: Implement refresh token rotation
- [x] A9-14: Add audit logging for security events

**Phase 9 Status**: 14/14 COMPLETE ✓, token storage

---

## Phase 10: Critical Security Vulnerability Fixes (2026-06-23)

### Critical (Vulnerabilities from Deep Analysis)
- [x] S1: Fix SQL injection in batchInsertBenchmarkResults (server/src/index.ts:708-752) - converted string interpolation to parameterized queries
- [x] S2: Fix timing attack vulnerability in checkAuth (server/src/index.ts:253) - replaced string equality with timingSafeEqualStrings()
- [x] S3: Fix in-memory rate limiting bypass (server/src/index.ts:225-226) - replaced Map-based rate limiting with KV-based distributed rate limiting

### High (Security & Compliance)
- [x] S4: Fix organization isolation bypass (server/src/index.ts:318-335) - production now uses authenticated context instead of header
- [x] S5: Fix CORS origin validation bypass (dashboard/lib/security/auth.ts:125-147) - use anchored regex to prevent bypass
- [x] S6: Fix refresh token rotation race condition (server/src/index.ts:1077-1091) - store new token before deleting old
- [x] S7: Extend audit log retention to 90 days (server/src/index.ts:265) - changed from 30 to 90 days for SOC 2 compliance

### Medium (Configuration & Assets)
- [x] S8: Fix dashboard CPU limit too restrictive (dashboard/wrangler.toml:67) - increased from 50ms to 30000ms
- [x] S9: Create missing PWA files - added offline.html, /icons/badge.svg, fixed manifest.json

### Supply Chain (Monitoring Only)
- [ ] S10: Vulnerable dependencies (undici, ws, esbuild) - transitive via wrangler, miniflare, jest. Fix requires upstream Cloudflare updates

**Phase 10 Status**: 9/10 complete, S10 pending upstream fix

---

## Phase 11: Additional Gap Analysis Fixes (2026-06-23)

### High Priority
- [x] P1: Add retry logic with exponential backoff to Claude API calls (dashboard/lib/claude/vanilla.ts)
- [x] P2: Fix viewport WCAG compliance (dashboard/app/layout.tsx) - remove userScalable: false
- [x] P3: Fix results table colSpan mismatch (dashboard/app/results/page.tsx) - 8 to 7 columns
- [x] P4: Fix service worker registration (dashboard/app/layout.tsx) - use Script component with afterInteractive

### Medium Priority
- [x] P5: Add LICENSE file (MIT) to repository root
- [x] P6: Implement GDPR right-to-deletion endpoint (DELETE /api/v1/users/{id}/delete)
- [x] P7: Implement GDPR data export endpoint (GET /api/v1/users/{id}/export)
- [x] P8: Implement executeBenchmark endpoint with validation instead of placeholder

### Future Enhancements (Not Implemented)
- [ ] F1: Full R2 storage layer implementation
- [ ] F2: WebSocket support (vs SSE only)
- [ ] F3: GraphQL API
- [ ] F4: Python/Go SDK
- [ ] F5: CSV/Parquet export
- [ ] F6: PDF report generation
- [ ] F7: Email notifications
- [ ] F8: A/B testing framework
- [ ] F9: Prompt versioning/management
- [ ] F10: Multi-cloud support
- [ ] F11: Real-time collaboration
- [ ] F12: SSO/SAML authentication
- [ ] F13: i18n implementation (next-intl)
- [ ] F14: Interactive onboarding tour
- [ ] F15: API status page
- [ ] F16: Periodic background sync for PWA
- [ ] F17: Service worker update notifications
- [x] F18: aria-labels on all icon-only buttons

**Phase 11 Status**: 9/25 complete, 16 future enhancements marked for later
