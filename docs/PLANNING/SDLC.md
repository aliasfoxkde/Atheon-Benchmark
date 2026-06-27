# Software Development Lifecycle (SDLC)

## Overview

This document describes the SDLC for Atheon-Benchmark, covering all phases from concept to deployment and maintenance.

---

## Phase 1: Planning & Requirements

### 1.1 Idea Initiation

- **Source**: User feedback, feature requests, bug reports, roadmapping
- **Process**:
  1. Submit issue using [Bug Report](../.github/ISSUE_TEMPLATE/bug_report.yml) or [Feature Request](../.github/ISSUE_TEMPLATE/feature_request.yml) templates
  2. Discussion with maintainers to refine requirements
  3. Prioritization based on impact and complexity

### 1.2 Requirements Analysis

- **TASKS.md**: Contains all tasks with status tracking
- **PLAN.md**: Contains implementation phases and milestones
- **Research**: Documented in [RESEARCH.md](../RESEARCH.md)

### 1.3 Planning Gates

| Gate | Criteria | Owner |
|------|----------|-------|
| Issue triaged | Labels applied, priority set | Maintainer |
| Requirements approved | Technical feasibility confirmed | Lead |
| Task breakdown | All tasks added to TASKS.md | Assignee |

---

## Phase 2: Development

### 2.1 Branching Strategy

```
main (production)
  └── develop (staging)
       ├── feature/description
       ├── fix/description
       ├── docs/description
       └── refactor/description
```

**Branch Naming Convention:**
```bash
# Feature branches
git checkout -b feature/dark-mode-support
git checkout -b feature/benchmark-export-csv

# Bug fixes
git checkout -b fix/rate-limiting-issue
git checkout -b fix/login-redirect-bug

# Documentation
git checkout -b docs/api-documentation
git checkout -b docs/readme-update

# Refactoring
git checkout -b refactor/error-handling
git checkout -b refactor/typescript-strict-mode
```

### 2.2 Development Workflow

1. **Create Branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Develop**
   - Write code following style guidelines
   - Add/update tests
   - Update documentation

3. **Commit** (Conventional Commits)
   ```bash
   git add .
   git commit -m "feat(dashboard): add new feature"
   ```

4. **Push**
   ```bash
   git push -u origin feature/my-feature
   ```

5. **Create Pull Request**
   - Use [PR Template](../.github/PULL_REQUEST_TEMPLATE.md)
   - Link related issues
   - Request review

### 2.3 Code Standards

| Standard | Tool | Config |
|----------|------|--------|
| Linting | ESLint | `eslint.config.mjs` |
| Formatting | Prettier | `.prettierrc` |
| Editor | EditorConfig | `.editorconfig` |
| TypeScript | TypeScript | `tsconfig.json` (strict mode) |

### 2.4 Git Hooks

Pre-commit hooks enforce:
- [x] Conventional commit format validation
- [x] Prettier formatting (auto-fix)
- [x] No versioned files (`_v1`, `_new`, `_backup`)
- [x] No sensitive data committed

Install hooks:
```bash
bash scripts/enable-hooks.sh
```

---

## Phase 3: Testing

### 3.1 Test Types

| Type | Command | Purpose |
|------|---------|---------|
| Unit | `npm run test` | Component/function tests |
| Integration | `npm run test:smoke` | API integration tests |
| E2E | `npm run test:e2e` | Full browser tests |
| Coverage | `npm run test:coverage` | Coverage report |

### 3.2 Test Requirements

- **Minimum coverage**: 80% for new code
- **Critical paths**: 100% coverage required
- **All tests must pass** before merge

### 3.3 Test Execution

```bash
# Run all tests
npm run test:all

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- my-component.test.tsx

# E2E tests
npm run test:e2e          # Headless
npm run test:e2e:headed  # Visible browser
```

---

## Phase 4: Code Review

### 4.1 Review Process

1. **PR Created** → CI pipeline runs
2. **Automated Checks**:
   - [ ] Lint passes
   - [ ] TypeScript compiles
   - [ ] Tests pass
   - [ ] Build succeeds
3. **Manual Review**:
   - Code quality
   - Test coverage
   - Documentation
   - Security implications

### 4.2 Review Checklist

**For Contributors:**
- [ ] PR description complete
- [ ] All checks passing
- [ ] No merge conflicts
- [ ] Tests added/updated
- [ ] Documentation updated

**For Reviewers:**
- [ ] Code is readable and maintainable
- [ ] No security vulnerabilities
- [ ] No performance issues
- [ ] Tests are comprehensive
- [ ] Follows project conventions

### 4.3 Approval Requirements

| PR Type | Approvals Required |
|----------|-------------------|
| Documentation | 1 |
| Bug fixes | 1 |
| Features | 1 |
| Security changes | 2 |

---

## Phase 5: Deployment

### 5.1 Deployment Environments

| Environment | Trigger | URL |
|-------------|---------|-----|
| Local | `npm run dev` | http://localhost:3000 |
| Preview | PR opened | https://{branch}.atheon-benchmark.pages.dev |
| Staging | Push to `develop` | staging.atheon-benchmark.pages.dev |
| Production | Push to `main` | atheon-benchmark-dashboard.pages.dev |

### 5.2 CI/CD Pipeline

```
push → lint → test → build → deploy
                  ↓
            (on main)
                  ↓
         deploy-production → smoke-test
```

**Workflows:**
- [.github/workflows/ci.yml](ci.yml) - Main CI pipeline
- [.github/workflows/deploy.yml](deploy.yml) - Deployment
- [.github/workflows/test.yml](test.yml) - Test workflow
- [.github/workflows/benchmark.yml](benchmark.yml) - Benchmark runner

### 5.3 Deployment Process

**Dashboard (Next.js → Cloudflare Pages):**
```bash
cd dashboard
npm run build
npx wrangler pages deploy out --project-name=atheon-benchmark-dashboard
```

**Server (Cloudflare Workers):**
```bash
cd server
npm run deploy
```

### 5.4 Post-Deployment Verification

1. **Smoke Tests**
   - Home page loads
   - Benchmark page functional
   - Results page displays data
   - No console errors

2. **Monitoring**
   - Cloudflare Analytics dashboard
   - Error tracking
   - Performance metrics

---

## Phase 6: Maintenance

### 6.1 Monitoring

| Metric | Tool | Alert |
|--------|------|-------|
| Uptime | Cloudflare | PagerDuty |
| Errors | Console + Sentry | Email |
| Performance | Lighthouse CI | GitHub PR |
| Dependencies | Dependabot | GitHub PR |

### 6.2 Updates

| Type | Frequency | Process |
|------|-----------|---------|
| Security patches | As needed | Auto-merge Dependabot |
| Minor updates | Weekly | Review + merge |
| Major updates | Monthly | Planning + release notes |

### 6.3 Issue Resolution

1. **Bug Reports** → Triage within 48h
2. **Security Issues** → See [SECURITY.md](../SECURITY.md)
3. **Feature Requests** → Prioritized against roadmap

---

## Phase 7: Retirement

### 7.1 Deprecation Process

1. Announce deprecation in CHANGELOG
2. Mark code with `@deprecated` JSDoc
3. Remove after 2 releases
4. Update documentation

### 7.2 Feature Flags

For large changes:
```typescript
// lib/experiments/flags.ts
export const FEATURE_FLAGS = {
  NEW_DASHBOARD: process.env.NEXT_PUBLIC_FLAG_NEW_DASHBOARD === 'true',
  ADVANCED_CHARTS: process.env.NEXT_PUBLIC_FLAG_ADVANCED_CHARTS === 'true',
} as const;
```

---

## Appendix: Quick Reference

### Common Commands

```bash
# Setup
npm install
bash scripts/enable-hooks.sh

# Development
npm run dev          # Dashboard
cd server && npm run dev  # API

# Testing
npm run test         # Unit tests
npm run test:e2e     # E2E tests
npm run test:all     # All tests

# Build & Deploy
npm run build        # Build dashboard
npm run deploy       # Deploy (production)
```

### File Locations

| Purpose | Path |
|---------|------|
| Dashboard | `/dashboard/` |
| Server | `/server/` |
| Runner | `/runner/` |
| Documentation | `/docs/` |
| GitHub Actions | `/.github/workflows/` |

### Contacts

| Role | Responsibility |
|------|----------------|
| Maintainer | @aliasfoxkde |
| Security | See [SECURITY.md](../SECURITY.md) |
