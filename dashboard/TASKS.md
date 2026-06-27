# Dashboard Tasks

## In Progress (2026-06-27) - Comprehensive Refactor Branch

### Phase 1: Project Structure & Configuration Audit ✅
- [x] Verified next.config.ts, tsconfig.json, package.json consistency
- [x] Verified eslint.config.mjs, postcss.config.mjs configuration

### Phase 2: Layout & Navigation Components Audit ✅
- [x] Theme provider and toggle implemented correctly
- [x] Mobile nav with proper ARIA labels
- [x] Error boundary with Sentry integration points

### Phase 3: Chart Components Audit ✅
- [x] PerformanceChart: Add useCallback, error handling, loading state, aria-label
- [x] spider-chart: Add aria-hidden to SVG icons, role="img" to containers
- [x] performance-bar-chart: Add aria-hidden to SVG icons, role="img"  
- [x] trend-line-chart: Add aria-hidden to SVG icons, role="img"

### Phase 4: Modal & Overlay Components Audit ✅
- [x] useFocusTrap: Fix ref type to HTMLDivElement
- [x] onboarding-tour: Fix variable declaration order for useCallback
- [x] All modals have proper focus trapping

### Phase 5: Page Components Audit ✅
- [x] benchmark/page.tsx: Add proper error handling with user feedback
- [x] results/page.tsx: useCallback for loadResults to prevent stale closure
- [x] All pages have proper loading states

### Phase 8: PWA & Service Worker Audit ✅
- [x] manifest.json: Remove invalid 'features' field, fix duplicate display_override
- [x] pwa-install-prompt: Fix stale closure with isInstalledRef

### Phase 9: UI Components Consistency Audit ✅
- [x] Add BenchmarkProgressData type to replace any in benchmark client
- [x] pattern-breakdown: Add eslint-disable for intentional missing dep
- [x] benchmark-export: Add aria-labels to export buttons
- [x] benchmark-trending: Fix emoji icons with accessible labels

## Verification (Branch: feature/comprehensive-refactor)
- **Build**: 7 pages passing
- **Tests**: 1075 passing
- **Lint**: Clean

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

## Known Issues (Non-Blocking)

- **vanilla.test.ts timing precision**: Test occasionally fails due to Date.now() precision mismatch
- **Coverage thresholds**: Global coverage thresholds not met (planned expansion areas)

## Deferred Items (Require Architecture Changes)

- CSP headers (static export limitation - Next.js requires unsafe-inline/unsafe-eval)
- SAML SSO eval() (needs full rewrite)
- Multi-cloud stub (needs real SDK)
- Chart.js CVE (transitive via wrangler)
- Code splitting (would break static export build)
- TypeScript `any` types in test files (low priority)

## Future Expansion Modules (Unused but Available)

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
