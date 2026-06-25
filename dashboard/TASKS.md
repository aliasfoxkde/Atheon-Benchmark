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
- [x] Implement 'r' to refresh, 'f' for filters, '?' for help, 'h' for home

## Real-time Data (In Progress)
- [ ] Add auto-refresh polling to results page (60s interval)
- [ ] Add "new results available" toast notification

## System Comparison (Pending)
- [ ] Add side-by-side comparison feature for 2+ systems
- [ ] Visual diff highlighting winner/loser for each metric

## Shareable URLs (Pending)
- [ ] Generate URLs with encoded comparison state
- [ ] Add copy-to-clipboard button

## Benchmark Submission (Pending)
- [ ] Create UI flow for submitting benchmark results
- [ ] GitHub PR creation integration for result submission

## Documentation (Pending)
- [ ] Add API documentation page
- [ ] Update README with new features
