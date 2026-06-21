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

### Gap Identified
- Benchmarks use `github.com/aliasfoxkde/Atheon` (57 patterns), NOT Atheon-Enhanced (179 patterns)
- To use enhanced: change go.mod to reference `github.com/aliasfoxkde/Atheon-Enhanced`
