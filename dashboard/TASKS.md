# Dashboard Tasks

## Completed (2026-06-27)

### SDLC & Documentation Infrastructure
- [x] Create .github/CODEOWNERS file
- [x] Create SECURITY.md policy document
- [x] Create PULL_REQUEST_TEMPLATE.md
- [x] Create ISSUE_TEMPLATE directory with bug/feature forms
- [x] Create CONTRIBUTING.md guide
- [x] Add .editorconfig for consistent editor settings
- [x] Add .prettierrc and .prettierignore
- [x] Create pre-commit hooks for lint/format/commits
- [x] Create docs/PLANNING folder with SDLC docs
- [x] Create components/index.ts barrel file

### CI/CD Improvements
- [x] Update anchore/sbom-action to v0.17.0
- [x] Update wrangler to v4
- [x] Add concurrency group to test.yml
- [x] Fix || true suppression in security-scan

### Code Quality Fixes
- [x] Fix chart dark mode - use useTheme hook (4 charts)
- [x] Fix duplicate chart components consolidation
- [x] Fix silent error swallowing in 3 files (binary-scanner, websocket, vanilla)
- [x] Add tests for 5 un-tested components

### Verification
- **Build**: 7 pages passing
- **Tests**: 941 passing
- **Deploy**: https://fe4e263e.atheon-benchmark-dashboard.pages.dev

## Previous Work (2026-06-26)

### Security Fixes
- [x] Fix SQL injection (server)
- [x] Fix timing attack (server)
- [x] Fix rate limiting (server)
- [x] Fix organization isolation (server)

### Dashboard Improvements
- [x] Fix CORS validation
- [x] Fix CPU limit
- [x] Create missing PWA files

### Accessibility
- [x] Add skip-to-content link
- [x] Add aria-labels to header
- [x] Add aria-labels to footer links
- [x] Add main#main-content id

### Chart Dark Mode
- [x] Fix SpiderChart dark mode
- [x] Fix PerformanceBarChart dark mode
- [x] Fix TrendLineChart dark mode
- [x] Fix PerformanceChart dark mode

### Mobile Experience
- [x] Add mobile bottom navigation bar

### Keyboard Shortcuts
- [x] Add keyboard shortcuts hook
- [x] Add shortcuts help modal
- [x] Implement shortcuts

### Real-time Data
- [x] Add auto-refresh polling
- [x] Add "new results available" toast

### System Comparison
- [x] Side-by-side comparison modal
- [x] Visual diff highlighting
- [x] Rank display with trophy

### Shareable URLs
- [x] Generate URLs with encoded state
- [x] Copy-to-clipboard button
- [x] 'c' keyboard shortcut

### Module Exports
- [x] Complete lib/*/index.ts files (12 modules)

## Deferred Items

These items require architecture changes or upstream fixes:
- CSP headers (static export limitation)
- SAML SSO eval() (needs full rewrite)
- Multi-cloud stub (needs real SDK)
- Chart.js CVE (transitive via wrangler)
- Code splitting (would break build)
- Additional test coverage (ongoing)
