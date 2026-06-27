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
- [x] Fix silent error swallowing in 3 files
- [x] Clean up unused lib/github exports

### Test Coverage Improvements
- [x] Add tests for empty-state
- [x] Add tests for error-boundary
- [x] Add tests for keyboard-shortcuts-provider
- [x] Add tests for mobile-nav
- [x] Add tests for version-comparison
- [x] Add tests for theme-provider
- [x] Add tests for benchmark-trending
- [x] Add tests for system-comparison-modal
- [x] Add tests for pwa-install-prompt
- [x] Add tests for onboarding-tour
- [x] Add tests for benchmark-export
- [x] Add tests for keyboard-shortcuts-modal
- [x] Add tests for pattern-breakdown

### Verification
- **Build**: 7 pages passing
- **Tests**: 1075 passing (134 new tests added across 13 components)
- **Deploy**: https://b26cbb2b.atheon-benchmark-dashboard.pages.dev

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

### Module Exports
- [x] Complete lib/*/index.ts files (12 modules)

## Deferred Items

These items require architecture changes or upstream fixes:
- CSP headers (static export limitation)
- SAML SSO eval() (needs full rewrite)
- Multi-cloud stub (needs real SDK)
- Chart.js CVE (transitive via wrangler)
- Code splitting (would break build)

## Known Unused Code (Future Expansion)

The following modules are unused but kept for future expansion:
- lib/api/ - GraphQL resolvers (planned)
- lib/atheon/ - Atheon integration (planned)
- lib/auth/ - Auth providers (planned)
- lib/benchmark/ - Benchmark runner (planned)
- lib/claude/ - Claude clients (planned)
- lib/cloud/ - Multi-cloud (stub)
- lib/collaboration/ - Real-time collab (planned)
- lib/experiments/ - A/B testing (planned)
- lib/i18n/ - Internationalization (planned)
- lib/monitoring/ - Analytics (planned)
- lib/notifications/ - Email service (planned)
- lib/prompts/ - Prompt management (planned)
- lib/reports/ - PDF generation (planned)
- lib/security/ - Security utils (planned)
- lib/storage/ - D1/R2 clients (planned)
- lib/websocket/ - WebSocket (planned)
