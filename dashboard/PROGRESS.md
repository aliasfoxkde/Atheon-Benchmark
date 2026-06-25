# Progress

## 2026-06-25

### Features Added
- **Real-time Data Refresh**: Auto-refresh polling every 60 seconds on results page
- **System Comparison Tool**: Side-by-side comparison modal for 2+ systems with visual rankings
- **Shareable URLs**: Encode selected systems and filters in URL for sharing views
- **Keyboard Shortcuts**: 'r'=refresh, 'f'=filters, 'c'=copy URL, '?'=help, 'h'=home, 'Esc'=close
- **Mobile Navigation**: Bottom navigation bar for mobile users (Home, Benchmark, Results, Status)

### Fixes
- **Chart Dark Mode**: All chart components now properly adapt to dark/light theme
  - SpiderChart
  - PerformanceBarChart
  - TrendLineChart
  - PerformanceChart

### Accessibility
- Skip-to-content link for keyboard navigation (WCAG compliance)
- Aria-labels on header, footer, and interactive elements
- main#main-content id for skip link target

### Deployment
- Dashboard deployed to: https://88e621db.atheon-benchmark-dashboard.pages.dev

## 2026-06-23

- Fixed SQL injection in batchInsertBenchmarkResults
- Fixed timing attack in checkAuth
- Fixed rate limiting bypass (KV-based)
- Fixed organization isolation bypass
