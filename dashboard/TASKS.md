# Tasks

## Security Fixes (Completed)
- [x] Fix SQL injection (server)
- [x] Fix timing attack (server)
- [x] Fix rate limiting (server)
- [x] Fix organization isolation (server)

## Dashboard Improvements (Completed)
- [x] Fix CORS validation (dashboard) - CORS properly configured for GitHub API
- [x] Fix CPU limit (dashboard) - Added proper resource handling
- [x] Create missing PWA files - Manifest and service worker complete

## Accessibility (Completed)
- [x] Add skip-to-content link for keyboard navigation (WCAG compliance)
- [x] Add aria-labels to header brand div for screen readers
- [x] Add unique aria-labels to footer GitHub links
- [x] Add main#main-content id for skip link target

## Chart Dark Mode (Completed)
- [x] Fix SpiderChart dark mode support
- [x] Fix PerformanceBarChart dark mode support
- [x] Fix TrendLineChart dark mode support
- [x] Fix PerformanceChart dark mode support

## Mobile Experience (Completed)
- [x] Add mobile bottom navigation bar (Home, Benchmark, Results, Status)

## Keyboard Shortcuts (Completed)
- [x] Add keyboard shortcuts hook
- [x] Add shortcuts help modal
- [x] Implement 'r' to refresh, 'f' for filters, '?' for help, 'h' for home, 'c' to copy URL

## Real-time Data (Completed)
- [x] Add auto-refresh polling to results page (60s interval)
- [x] Add "new results available" toast notification

## System Comparison (Completed)
- [x] Add side-by-side comparison modal for 2+ systems
- [x] Visual diff highlighting winner/loser for each metric
- [x] Rank display with trophy for best

## Shareable URLs (Completed)
- [x] Generate URLs with encoded comparison state
- [x] Add copy-to-clipboard button
- [x] Support 'c' keyboard shortcut to copy

## Future Improvements (Backlog)
- [ ] Create UI flow for submitting benchmark results
- [ ] GitHub PR creation integration for result submission
- [ ] Add API documentation page
- [ ] Update README with new features
- [ ] Add more benchmark test types
- [ ] Implement benchmark scheduling/automation

## Benchmark Features (Completed 2026-06-25)
- [x] Add benchmark trending over time
- [x] Add pattern category breakdown in results
- [x] Add version comparison (v1 vs v2)
- [x] Add memory usage tracking per benchmark run
- [x] Add CSV/JSON export for benchmark results
