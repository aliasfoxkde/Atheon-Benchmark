# Progress Log

## 2026-06-21

### CI/CD Improvements
- Fixed `.github/workflows/test.yml` to call `npm run test:ci` instead of `npm test`
- Added `codecov/codecov-action@v4` upload step for coverage reports
- Changed Node.js version from 18 to 20 (matches Next.js 16 requirements)
- Removed `continue-on-error` from ESLint and TypeScript check steps
- Fixed `test:ci` script to not override jest.config.js coverage globs

### Coverage Configuration
- `test:ci` script now uses jest.config.js defaults (includes components/ and app/)
- jest.config.js properly excludes: binary-scanner.ts, index files, build-time.ts

### Documentation
- Updated RESEARCH.md with current project state
- This PROGRESS.md created to satisfy scaffolding requirements

## 2026-06-20 (Prior Session)

### Test Coverage Achieved
- 844 tests passing
- 84.07% statement coverage (lib/ only measured)
- Created component tests for charts, accessible-button, theme-toggle
- Created page smoke tests for home, benchmark, results pages
- Fixed health-monitor component tests

### E2E Test Fixes
- Fixed `describe` → `test.describe` syntax errors in critical-paths.spec.ts
- All 6 remaining `describe` blocks converted to `test.describe`

### Bug Fixes
- Fixed R-squared NaN due to numerical instability with large timestamps
- Fixed correlation NaN with same issue
- Fixed forwardRef component type assertion (object not function)

### Gap Investigated: Pattern Loading
- go.mod correctly references `github.com/aliasfoxkde/Atheon` (which is the local `/nas/Temp/repos/Atheon`)
- The dashboard does NOT load patterns from the bundled patterns.bundle file
- Instead, it uses 7 hardcoded patterns in `lib/claude/atheon-integration.ts` (ATHEON_PATTERNS array)
- The bundled patterns.bundle contains 185 patterns from the community YAML files
- Fix would require: load patterns from bundle at runtime or build time, rather than hardcoding

### Actual Issue Fixed
- Added `loadPatternsFromBundle()` to binary-scanner.ts
- Pattern bundle is gzip+json with 185 patterns from community YAML files
- `loadAtheonPatterns()` and `initializeAtheonPatterns()` handle async loading with caching
- Falls back to 7 hardcoded patterns if bundle unavailable
- All 846 tests passing after changes

### Security Fix
- Added input validation to `calculate` tool in mcp-integration.ts
- Validates expression contains only safe chars: `/^[\d+\-*/().%\s]+$/`
- Mitigates arbitrary code execution risk via Function() constructor

### MCP Test Improvements
- Added `createMockMCPServer()` helper function
- Added timeout/AbortError test for MCP tool execution
- Added multi-iteration tool chain test
