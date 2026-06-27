# Contributing to Atheon-Benchmark

Thank you for your interest in contributing to Atheon-Benchmark! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. Please be respectful and constructive in all interactions.

## Getting Started

1. **Fork the Repository**
   ```bash
   git clone https://github.com/aliasfoxkde/Atheon-Benchmark.git
   cd Atheon-Benchmark
   ```

2. **Install Dependencies**
   ```bash
   # Dashboard dependencies
   cd dashboard && npm install

   # Server dependencies
   cd ../server && npm install

   # Go runner dependencies
   cd ../runner && go mod download
   ```

3. **Set Up Environment Variables**
   ```bash
   # Copy example environment files
   cd dashboard
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

## Development Setup

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 10+ (comes with Node.js)
- **Go** 1.21+ (for runner)
- **Wrangler** 4.x (`npm install -g wrangler`)
- **Git** 2.40+

### Dashboard Development

```bash
cd dashboard
npm run dev
```

The dashboard will be available at http://localhost:3000

### Server Development

```bash
cd server
npm run dev
```

Uses `wrangler dev` for local Cloudflare Workers emulation.

### Running Tests

```bash
# Dashboard
cd dashboard
npm run test          # Run all tests
npm run test:watch   # Watch mode
npm run test:ci      # CI mode (headless)
npm run test:e2e     # Playwright e2e tests

# Server
cd server
npm run test

# All components
cd dashboard
npm run test:all     # Unit + integration + e2e
```

### Building for Production

```bash
cd dashboard
npm run build        # Builds Next.js static export to /out
npm run export       # Alias for build

cd ../server
npm run build        # Compiles TypeScript
npm run deploy       # Deploys to Cloudflare
```

## Project Structure

```
atheon-benchmark/
├── dashboard/           # Next.js 16 frontend (Cloudflare Pages)
│   ├── app/            # App Router pages
│   ├── components/     # React components
│   ├── lib/            # Utilities and integrations
│   ├── public/         # Static assets
│   └── scripts/        # Build and deployment scripts
│
├── server/             # Cloudflare Workers API
│   ├── src/            # TypeScript source
│   └── wrangler.toml   # Cloudflare config
│
├── runner/             # Go CLI benchmark runner
│   └── main.go
│
├── sdk/                # Language SDKs
│   ├── go/             # Go SDK
│   └── python/         # Python SDK
│
├── schemas/            # Database schemas
├── benchmarks/         # Benchmark scenarios and test data
└── docs/              # Documentation
```

## Development Workflow

### Branch Naming

Use descriptive branch names:

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

**Examples:**
```bash
git checkout -b feature/dark-mode-support
git checkout -b fix/rate-limiting-bypass
git checkout -b docs/api-documentation
```

### Commit Messages

This project uses **Conventional Commits**. Format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Restructuring
- `perf` - Performance
- `test` - Tests
- `chore` - Maintenance

**Examples:**
```bash
git commit -m "feat(dashboard): add dark mode toggle"
git commit -m "fix(server): resolve SQL injection vulnerability"
git commit -m "docs(api): update endpoint documentation"
```

### Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Your Changes**
   - Write code
   - Add/update tests
   - Update documentation

3. **Run Quality Checks**
   ```bash
   npm run lint       # ESLint
   npm run format     # Prettier
   npm run test       # Tests
   npm run build      # Build verification
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/my-feature
   # Create PR via GitHub UI
   ```

5. **PR Requirements**
   - Use the PR template
   - Link any related issues
   - Ensure all checks pass
   - Request review from maintainers

### Code Review

All PRs require review before merging. Reviewers will check:

- [ ] Code quality and style
- [ ] Test coverage
- [ ] Documentation updates
- [ ] Security implications
- [ ] Breaking changes

## Code Style

### ESLint + Prettier

This project uses ESLint for linting and Prettier for formatting.

```bash
# Check formatting
npm run format:check

# Fix formatting issues
npm run format

# Run ESLint
npm run lint
```

### TypeScript

- Use strict TypeScript
- Avoid `any` type - use proper interfaces
- Export types for public APIs
- Document complex types with JSDoc

### React Components

- Use functional components with hooks
- Follow existing naming conventions
- Co-locate tests with components
- Use proper ARIA attributes for accessibility

### Git Commit Hooks

Pre-commit hooks are configured to run:
- Conventional commit validation
- ESLint
- Prettier formatting

Install hooks:
```bash
npm run prepare   # or: npx husky install
```

## Testing

### Test Structure

```
dashboard/
├── components/
│   └── __tests__/           # Component tests
├── app/
│   └── __tests__/           # Page tests
└── lib/
    └── __tests__/           # Utility tests
```

### Writing Tests

**Component Tests (Jest + React Testing Library):**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../my-component';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const onClick = jest.fn();
    render(<MyComponent onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

**Unit Tests:**
```typescript
import { myFunction } from '../my-module';

describe('myFunction', () => {
  it('performs expected calculation', () => {
    const result = myFunction(10, 5);
    expect(result).toBe(15);
  });
});
```

### Running Specific Tests

```bash
# Run specific test file
npm run test -- my-component.test.tsx

# Run tests matching pattern
npm run test -- --testNamePattern="renders"

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e           # Headless
npm run test:e2e:headed    # Visible browser
```

## Submitting Changes

### Before Submitting

1. [ ] Code follows style guidelines
2. [ ] Tests added/updated and passing
3. [ ] Documentation updated
4. [ ] No console.log or debug code
5. [ ] Commit messages follow conventions

### Submitting

1. Push to your fork
2. Create pull request
3. Fill out PR template completely
4. Link related issues
5. Wait for review

### After Review

- Address feedback promptly
- Don't force-push to reviewed branches
- Re-request review after significant changes

## Documentation

### Where to Document

| Type | Location |
|------|----------|
| README updates | Root `README.md` |
| API documentation | `docs/API.md` |
| Architecture | `docs/ARCHITECTURE.md` |
| Deployment guide | `docs/DEPLOYMENT.md` |
| Dashboard docs | `dashboard/docs/` |
| Server docs | `server/docs/` |

### Documentation Standards

- Use clear, concise language
- Include code examples where appropriate
- Keep documentation up-to-date
- Add JSDoc comments to exported functions

## Questions?

- Open an issue for bugs/feature requests
- Check existing issues before creating new ones
- Read the [README](README.md) for project overview

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
