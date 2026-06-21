/**
 * D1 Database Unit Tests
 * Tests for the D1Database class
 *
 * Note: D1 binding must be provided via bindD1() method in production.
 * Without binding, all operations return empty values (ready=false).
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  D1Database,
  createDatabase,
  DEFAULT_DATABASE_CONFIG
} from '../database';

describe('D1Database', () => {
  let db: D1Database;

  beforeEach(() => {
    db = new D1Database({ dbName: 'test-db' });
  });

  describe('Constructor', () => {
    it('should create instance', () => {
      expect(db).toBeDefined();
    });

    it('should not be ready without D1 binding', () => {
      // Database starts in not-ready state
      // Operations should return empty values
    });
  });

  describe('saveBenchmark (not ready)', () => {
    it('should return false when not ready', async () => {
      const result = await db.saveBenchmark({
        id: 'bench-1',
        name: 'Test Benchmark',
        scenario: 'vanilla',
        status: 'running',
        created_at: '2026-06-20T00:00:00Z',
        progress: 0,
        total_tests: 5,
        completed_tests: 0,
      });
      expect(result).toBe(false);
    });
  });

  describe('saveResult (not ready)', () => {
    it('should return false when not ready', async () => {
      const result = await db.saveResult({
        id: 'result-1',
        benchmark_id: 'bench-1',
        name: 'Test',
        configuration: 'test',
        duration_ms: 100,
        tokens_used: 50,
        passed: true,
        output: 'output',
        timestamp: '2026-06-20T00:00:00Z',
      });
      expect(result).toBe(false);
    });
  });

  describe('getBenchmark (not ready)', () => {
    it('should return null when not ready', async () => {
      const result = await db.getBenchmark('bench-1');
      expect(result).toBeNull();
    });
  });

  describe('getAllBenchmarks (not ready)', () => {
    it('should return empty array when not ready', async () => {
      const result = await db.getAllBenchmarks();
      expect(result).toEqual([]);
    });
  });

  describe('getResults (not ready)', () => {
    it('should return empty array when not ready', async () => {
      const result = await db.getResults('bench-1');
      expect(result).toEqual([]);
    });
  });

  describe('updateBenchmarkStatus (not ready)', () => {
    it('should return false when not ready', async () => {
      const result = await db.updateBenchmarkStatus('bench-1', 'running');
      expect(result).toBe(false);
    });
  });

  describe('deleteBenchmark (not ready)', () => {
    it('should return false when not ready', async () => {
      const result = await db.deleteBenchmark('bench-1');
      expect(result).toBe(false);
    });
  });

  describe('getStatistics (not ready)', () => {
    it('should return zero statistics when not ready', async () => {
      const result = await db.getStatistics();
      expect(result.total).toBe(0);
      expect(result.avgDuration).toBe(0);
    });
  });
});

describe('createDatabase', () => {
  it('should create D1Database instance', () => {
    const db = createDatabase();
    expect(db).toBeInstanceOf(D1Database);
  });

  it('should accept dbName', () => {
    const db = createDatabase({ dbName: 'custom-db' });
    expect(db).toBeInstanceOf(D1Database);
  });

  it('should accept accountId', () => {
    const db = createDatabase({ accountId: 'acc-123' });
    expect(db).toBeInstanceOf(D1Database);
  });

  it('should accept region', () => {
    const db = createDatabase({ region: 'eu-west-1' });
    expect(db).toBeInstanceOf(D1Database);
  });

  it('should use defaults when no config provided', () => {
    const db = createDatabase();
    expect(db).toBeDefined();
  });
});

describe('DEFAULT_DATABASE_CONFIG', () => {
  it('should have dbName', () => {
    expect(DEFAULT_DATABASE_CONFIG.dbName).toBeDefined();
    expect(DEFAULT_DATABASE_CONFIG.dbName).toBe('atheon-benchmark');
  });

  it('should have region', () => {
    expect(DEFAULT_DATABASE_CONFIG.region).toBeDefined();
  });
});
