/**
 * Next.js Pages Smoke Tests
 * Verifies pages can be imported and export default components
 */

import { describe, it, expect } from '@jest/globals';

describe('Home Page', () => {
  it('should export default function', async () => {
    const page = await import('../page');
    expect(page.default).toBeDefined();
    expect(typeof page.default).toBe('function');
  });
});

describe('Benchmark Page', () => {
  it('should export default function', async () => {
    const page = await import('../benchmark/page');
    expect(page.default).toBeDefined();
    expect(typeof page.default).toBe('function');
  });
});

describe('Results Page', () => {
  it('should export default function', async () => {
    const page = await import('../results/page');
    expect(page.default).toBeDefined();
    expect(typeof page.default).toBe('function');
  });
});
