/**
 * Binary Scanner Unit Tests
 * Tests for Atheon binary scanner and pattern loading
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { loadPatternsFromBundle, BundlePattern, createAtheonScanner, AtheonBinaryScanner, DEFAULT_ATHEON_CONFIG } from '../binary-scanner';
import { unlink } from 'fs/promises';
import { join } from 'path';

describe('loadPatternsFromBundle', () => {
  const testDir = '/tmp/atheon-test-bundles';

  afterEach(async () => {
    try {
      await unlink(join(testDir, 'nonexistent-bundle.gz'));
    } catch {}
  });

  it('should return empty array when bundle file does not exist', async () => {
    const patterns = await loadPatternsFromBundle('/nonexistent/path/bundle.gz');
    expect(patterns).toEqual([]);
  });

  it('should return empty array for paths that cannot be read', async () => {
    // Test with clearly invalid path
    const patterns = await loadPatternsFromBundle('/definitely/not/a/real/path/bundle.gz');
    expect(patterns).toEqual([]);
  });
});

describe('AtheonBinaryScanner', () => {
  describe('constructor', () => {
    it('should use default config when none provided', () => {
      const scanner = new AtheonBinaryScanner();
      expect(scanner).toBeInstanceOf(AtheonBinaryScanner);
    });

    it('should accept partial config and fill defaults', () => {
      const scanner = new AtheonBinaryScanner({
        categories: ['secrets'],
      });
      expect(scanner).toBeInstanceOf(AtheonBinaryScanner);
    });

    it('should accept custom timeout', () => {
      const scanner = new AtheonBinaryScanner({
        timeout: 5000,
      });
      expect(scanner).toBeInstanceOf(AtheonBinaryScanner);
    });
  });

  describe('scanContent', () => {
    it('should throw error when Atheon binary is not available', async () => {
      const scanner = new AtheonBinaryScanner({
        binaryPath: '/nonexistent/atheon',
        timeout: 1000,
      });

      await expect(
        scanner.scanContent('const password = "secret";')
      ).rejects.toThrow();
    });
  });

  describe('scanDirectory', () => {
    it('should throw error for non-existent directory', async () => {
      const scanner = new AtheonBinaryScanner({
        binaryPath: '/nonexistent/atheon',
        timeout: 1000,
      });

      await expect(
        scanner.scanDirectory('/nonexistent/directory')
      ).rejects.toThrow();
    });
  });

  describe('listCategories', () => {
    it('should return default categories when binary not available', async () => {
      const scanner = new AtheonBinaryScanner({
        binaryPath: '/nonexistent/atheon',
        timeout: 1000,
      });

      const categories = await scanner.listCategories();
      expect(Array.isArray(categories)).toBe(true);
    });
  });

  describe('listPatterns', () => {
    it('should return empty array when binary not available', async () => {
      const scanner = new AtheonBinaryScanner({
        binaryPath: '/nonexistent/atheon',
        timeout: 1000,
      });

      const patterns = await scanner.listPatterns();
      expect(Array.isArray(patterns)).toBe(true);
    });
  });
});

describe('createAtheonScanner', () => {
  it('should create scanner with default config', () => {
    const scanner = createAtheonScanner();
    expect(scanner).toBeInstanceOf(AtheonBinaryScanner);
  });

  it('should create scanner with custom config', () => {
    const scanner = createAtheonScanner({
      categories: ['secrets', 'security'],
      timeout: 5000,
    });
    expect(scanner).toBeInstanceOf(AtheonBinaryScanner);
  });
});

describe('DEFAULT_ATHEON_CONFIG', () => {
  it('should have required properties', () => {
    expect(DEFAULT_ATHEON_CONFIG.binaryPath).toBeDefined();
    expect(DEFAULT_ATHEON_CONFIG.categories).toContain('secrets');
    expect(DEFAULT_ATHEON_CONFIG.severity).toContain('critical');
    expect(DEFAULT_ATHEON_CONFIG.timeout).toBeGreaterThan(0);
  });

  it('should have valid category list', () => {
    expect(Array.isArray(DEFAULT_ATHEON_CONFIG.categories)).toBe(true);
    expect(DEFAULT_ATHEON_CONFIG.categories.length).toBeGreaterThan(0);
  });

  it('should have valid severity levels', () => {
    const validSeverities = ['critical', 'high', 'medium', 'low'];
    expect(DEFAULT_ATHEON_CONFIG.severity.every(s => validSeverities.includes(s))).toBe(true);
  });
});

describe('BundlePattern interface', () => {
  it('should accept valid pattern object', () => {
    const pattern: BundlePattern = {
      name: 'test-pattern',
      category: 'secrets',
      match: 'password.*',
      enabled: true,
    };

    expect(pattern.name).toBe('test-pattern');
    expect(pattern.category).toBe('secrets');
    expect(pattern.enabled).toBe(true);
  });

  it('should allow disabled pattern', () => {
    const pattern: BundlePattern = {
      name: 'disabled-pattern',
      category: 'code-quality',
      match: 'console\\.log',
      enabled: false,
    };

    expect(pattern.enabled).toBe(false);
  });
});
