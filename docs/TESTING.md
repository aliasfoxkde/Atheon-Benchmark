# Atheon Benchmark Testing Guide

Comprehensive testing documentation for the Atheon Benchmark Dashboard system.

## 🧪 Testing Overview

The Atheon Benchmark system uses a multi-layered testing approach:

- **Unit Tests**: Component and function level testing
- **Smoke Tests**: Critical path validation
- **Sanity Tests**: Basic functionality verification
- **Regression Tests**: Prevent functionality breaks
- **E2E Tests**: Complete user workflow testing

## 🎯 Test Types

### 1. Unit Tests

**Purpose**: Test individual components and functions in isolation

**Location**: `__tests__/(unit|components|lib)/`

**Framework**: Jest with React Testing Library

**Coverage Target**: 70%+ across all metrics

**Running**:
```bash
npm run test:unit
```

**Example**:
```typescript
describe('GitHub Results Fetcher', () => {
  it('should fetch results from GitHub', async () => {
    const fetcher = new GitHubResultsFetcher(config);
    const results = await fetcher.fetchAllResults();
    expect(Array.isArray(results)).toBe(true);
  });
});
```

### 2. Smoke Tests

**Purpose**: Quick validation of critical application paths

**Location**: `__tests__/smoke/`

**Framework**: Playwright for browser automation

**Running**:
```bash
npm run test:smoke
```

**Test Coverage**:
- Main page loads correctly
- Results page displays data
- Benchmark page is accessible
- Static assets are accessible
- No console errors

### 3. Sanity Tests

**Purpose**: Basic functionality verification

**Location**: `__tests__/smoke/sanity.test.ts`

**Framework**: Jest

**Running**:
```bash
npm run test
```

**Test Coverage**:
- Environment configuration
- Module loading
- Data structure validation
- API integration basics
- Configuration validation

### 4. Regression Tests

**Purpose**: Prevent functionality breaks and ensure backward compatibility

**Location**: `__tests__/regression/`

**Framework**: Jest

**Running**:
```bash
npm run test:regression
```

**Test Coverage**:
- API functionality regression
- Data processing regression
- UI component regression
- Performance regression
- Configuration compatibility

### 5. E2E Tests

**Purpose**: Complete user workflow testing

**Location**: `__tests__/e2e/`

**Framework**: Playwright

**Running**:
```bash
npm run test:e2e
```

**Test Coverage**:
- Complete user journeys
- Cross-page navigation
- Data loading and display
- Filtering and interaction
- Error handling workflows

## 🚀 Running Tests

### Quick Test Commands

```bash
# Run all tests
npm run test:all

# Run unit tests only
npm run test:unit

# Run smoke tests only
npm run test:smoke

# Run regression tests only
npm run test:regression

# Run E2E tests only
npm run test:e2e

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Full test suite (including E2E)
npm run test:full
```

### Custom Test Execution

```bash
# Run specific test file
jest path/to/test.test.ts

# Run tests matching pattern
jest --testNamePattern="GitHub"

# Run tests in specific directory
jest __tests__/unit/

# Run tests with verbose output
jest --verbose
```

## 📊 Coverage Reports

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

### Coverage Thresholds

Current targets (with exclusions for UI components and untestable files):
- **Statements**: 65% (actual: 75%)
- **Branches**: 60% (actual: 62%)
- **Functions**: 65% (actual: 72%)
- **Lines**: 65% (actual: 75%)

Note: UI components (React) have lower coverage due to jsdom limitations.
Excluded from coverage: index.ts, build-time.ts, binary-scanner.ts

### Coverage Files

- `coverage/` - HTML coverage reports
- `coverage/lcov.info` - LCOV format for CI tools
- `coverage/junit.xml` - JUnit XML format

## 🔧 Test Configuration

### Jest Configuration

File: `jest.config.js`

**Key Settings**:
- TypeScript support with ts-jest
- jsdom environment for DOM testing
- Path mapping with `@/` alias
- Coverage collection from source files
- Project-based test organization

### Playwright Configuration

File: `playwright.config.ts`

**Key Settings**:
- Multiple browsers (Chromium, Firefox, WebKit)
- Mobile device testing
- Screenshot/video on failure
- HTML and JUnit reporting
- Automatic web server startup

## 📝 Test Structure

```
__tests__/
├── unit/                    # Unit tests
│   ├── github.test.ts      # GitHub API tests
│   ├── cache.test.ts       # Caching layer tests
│   └── monitoring.test.ts  # Monitoring tests
├── components/             # Component tests
│   ├── health-monitor.test.tsx
│   └── performance-monitor.test.tsx
├── smoke/                  # Smoke tests
│   ├── critical-paths.test.ts
│   └── sanity.test.ts
├── regression/             # Regression tests
│   └── api-functionality.test.ts
└── e2e/                    # E2E tests
    └── user-journeys.test.ts
```

## 🎯 Writing Tests

### Unit Test Template

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something specific', () => {
    // Arrange
    const input = { data: 'test' };

    // Act
    const result = processInput(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Component Test Template

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('expected text')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    render(<ComponentName />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(/* expected outcome */);
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test('user workflow description', async ({ page }) => {
  await page.goto('/');

  await page.click('text=Navigation');
  await expect(page).toHaveURL(/expected-path/);

  const element = page.locator('selector');
  await expect(element).toBeVisible();
});
```

## 🔍 Test Utilities

### Mock Data Generators

```typescript
// Located in jest.setup.js
global.testUtils = {
  createMockBenchmarkReport: () => ({
    system_id: 'test-system',
    system_info: { /* ... */ },
    benchmarks: [],
    summary: { /* ... */ },
    submitted_at: '2026-06-19T12:00:00Z'
  })
};
```

### API Mocking

```typescript
// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => mockData
  })
);
```

### Local Storage Mocking

```typescript
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;
```

## 🐛 Debugging Tests

### Jest Debugging

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test in debug mode
node --inspect-brk node_modules/.bin/jest path/to/test.test.ts
```

### Playwright Debugging

```bash
# Run E2E tests with UI
npm run test:e2e:headed

# Run specific test file
playwright test path/to/test.spec.ts --headed

# Debug mode
playwright test --debug
```

### Console Output

```javascript
// Add debugging in tests
console.log('Current state:', state);

// Use debugger statement
debugger; // Execution will pause here
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
- name: Run tests
  run: npm run test:ci

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

### Pre-commit Hooks

```json
// package.json
"husky": {
  "hooks": {
    "pre-commit": "npm run test:quick",
    "pre-push": "npm run test:full"
  }
}
```

## 📈 Performance Testing

### Load Testing

```typescript
describe('Performance Tests', () => {
  it('should process large datasets efficiently', () => {
    const startTime = performance.now();
    const results = processLargeDataset(mockLargeData);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(100);
  });
});
```

### Memory Testing

```typescript
it('should not leak memory', () => {
  const beforeMemory = (performance as any).memory.usedJSHeapSize;

  // Run operations multiple times
  for (let i = 0; i < 1000; i++) {
    processOperation(testData);
  }

  const afterMemory = (performance as any).memory.usedJSHeapSize;
  const memoryGrowth = afterMemory - beforeMemory;

  expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // 10MB
});
```

## 🎓 Best Practices

### Test Organization

- ✅ Group related tests in `describe` blocks
- ✅ Use descriptive test names
- ✅ Follow Arrange-Act-Assert pattern
- ✅ Keep tests focused and independent
- ✅ Mock external dependencies
- ❌ Avoid testing implementation details
- ❌ Don't test third-party libraries
- ❌ Avoid fragile selectors

### Test Data

- ✅ Use consistent mock data
- ✅ Create reusable test utilities
- ✅ Use factory functions for test data
- ❌ Don't hardcode test data in tests
- ❌ Avoid overly complex test scenarios

### Assertions

- ✅ Use specific assertions
- ✅ Test behavior over implementation
- ✅ Include helpful failure messages
- ❌ Avoid vague assertions
- ❌ Don't over-assert

## 🔗 Continuous Improvement

### Regular Test Maintenance

- **Weekly**: Review flaky tests
- **Monthly**: Update test coverage goals
- **Quarterly**: Refactor test utilities
- **Annually**: Review testing strategy

### Test Metrics

Track these metrics:
- Test coverage percentage
- Test execution time
- Flaky test rate
- False positive rate

---

**Current Test Coverage**: 75% statements, 62% branches, 72% functions, 75% lines
**Test Suite Status**: ✅ 846 tests passing
**Last Updated**: June 20, 2026