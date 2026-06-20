/**
 * Jest Setup File
 * Global configuration and mocks for tests
 */

// Import jest-dom matchers
require('@testing-library/jest-dom');

// Mock window and browser APIs

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
const mockNavigationTiming = {
  fetchStart: 100,
  domInteractive: 800,
  domContentLoadedEventEnd: 1200,
  loadEventEnd: 2000,
  domComplete: 1800,
  responseStart: 300,
  requestStart: 200,
  connectEnd: 150,
  startTime: 0,
  duration: 2000,
  name: 'navigation',
  entryType: 'navigation',
};

const mockPaintTiming = [
  { name: 'first-contentful-paint', startTime: 800, entryType: 'paint' }
];

const mockLCP = [
  { startTime: 1200, size: 5000, entryType: 'largest-contentful-paint', name: 'largest-contentful-paint' }
];

const performanceMock = {
  getEntriesByType: jest.fn((type) => {
    console.log(`[Performance Mock] getEntriesByType called with: ${type}`);
    if (type === 'navigation') return [mockNavigationTiming];
    if (type === 'paint') return mockPaintTiming;
    if (type === 'largest-contentful-paint') return mockLCP;
    return [];
  }),
  now: jest.fn(() => Date.now()),
  timing: mockNavigationTiming,
};

Object.defineProperty(window, 'performance', {
  writable: true,
  value: performanceMock,
});

// Also set performance on global to ensure it's available in all contexts
global.performance = performanceMock;

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