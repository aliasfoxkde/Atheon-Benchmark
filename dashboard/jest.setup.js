/**
 * Jest Setup File
 * Global configuration and mocks for tests
 */

// Mock window and browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock navigator
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    userAgent: 'test-user-agent',
    onLine: true,
    serviceWorker: {
      register: jest.fn(),
      ready: Promise.resolve({
        active: {
          state: 'activated'
        }
      })
    }
  },
});

// Mock Performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    getEntriesByType: jest.fn(() => []),
    now: jest.fn(() => Date.now()),
  },
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Suppress console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch API if needed
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
    text: () => Promise.resolve(''),
  })
);

// Set up global test utilities
global.testUtils = {
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  createMockPerformanceData: () => ({
    pageLoadTime: 2000,
    firstContentfulPaint: 800,
    largestContentfulPaint: 1200,
    firstInputDelay: 50,
    cumulativeLayoutShift: 0.1,
    timeToInteractive: 1500,
  }),
  createMockBenchmarkReport: () => ({
    system_id: 'test-system',
    system_info: {
      hostname: 'test-machine',
      cpu: 'Intel Core i7',
      ram: '16GB',
      os: 'linux',
      arch: 'amd64',
      go_version: '1.21',
      timestamp: '2026-06-19T12:00:00Z'
    },
    benchmarks: [],
    summary: {
      total_tests: 100,
      passed: 95,
      failed: 5,
      avg_duration_ms: 2000,
      total_tokens: 10000
    },
    submitted_at: '2026-06-19T12:00:00Z'
  }),
};

console.log('✅ Jest test environment initialized');