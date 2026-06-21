# Implementation Plan

## Phase 1: CI/CD Integration (Completed)
- [x] Fix test.yml to call `test:ci` with coverage
- [x] Add codecov upload step
- [x] Upgrade Node 18 → 20
- [x] Remove continue-on-error from critical steps
- [x] Fix test:ci script coverage glob mismatch

## Phase 2: Coverage Gap Fix (In Progress)
- [x] Create RESEARCH.md and PROGRESS.md
- [ ] Exclude untestable files from coverage (index.ts, build-time.ts, binary-scanner.ts)
- [ ] Verify test:ci passes with coverage thresholds

## Phase 3: MCP Integration Tests
- [ ] Add missing MCP edge case tests (timeouts, AbortError, multi-iteration chains)
- [ ] Create shared MCP mock helper

## Phase 4: Documentation
- [ ] Update ARCHITECTURE.md with current state
- [ ] Update TESTING.md with coverage results
- [ ] Update README with benchmark integration details

## Phase 5: Atheon Pattern Loading (NEW - High Priority)
- [ ] Investigate patterns.bundle format (gzip+json, 185 patterns)
- [ ] Add bundle loading to binary-scanner.ts or atheon-integration.ts
- [ ] Replace hardcoded ATHEON_PATTERNS with loaded patterns from bundle
- [ ] Verify pattern loading works at build/runtime

## Phase 6: Atheon Bundler Analysis
- [ ] Analyze bundler directory structure in Atheon-Enhanced
- [ ] Identify improvement opportunities
