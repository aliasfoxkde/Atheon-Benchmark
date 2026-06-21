# Research: Atheon Benchmark Dashboard

## Project Overview

Atheon Benchmark is a community-driven AI benchmark platform for comparing Claude performance with and without Atheon MCP integration across different hardware configurations.

## Key Requirements

1. **Benchmark System**: Compare vanilla Claude vs MCP vs Atheon MCP integration
2. **Dashboard**: Next.js 16 PWA with real-time results streaming and visualization
3. **Storage**: GitHub-based results storage with caching
4. **Quality Gates**: Atheon pattern matching (152+ patterns) as quality enforcement
5. **Deployment**: Cloudflare Pages/Workers infrastructure

## Technical Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Testing**: Jest, Playwright, ts-jest
- **CI/CD**: GitHub Actions with coverage monitoring
- **Coverage Target**: 80%+ statement coverage

## Current State (as of 2026-06-20)

- 844 unit tests passing
- 84.07% statement coverage (lib/ only)
- Full coverage including components/app/ is ~61% branches, ~69% functions
- E2E tests require running dev server
- CI/CD workflow needs improvement (test:ci not called, Node 18 vs 20 mismatch)

## Identified Gaps

1. **CI/CD**: `test:ci` script not called in workflows, Node version mismatch
2. **Coverage**: Index files and entry points with 0% coverage drag down overall %
3. **MCP Tests**: Some edge cases not covered (timeouts, multi-iteration chains)
4. **Documentation**: Needs comprehensive updating

## Risks

- Binary-scanner.ts requires Node.js child_process - excluded from coverage
- E2E tests fail without running dev server (environmental issue, not code)
- Some low-level error paths difficult to unit test without mocking Node APIs

## Constraints

- Must maintain backward compatibility with existing test suite
- Cannot mock internal Node.js modules in Jest jsdom environment
- Coverage threshold must remain achievable (70% global minimum)
