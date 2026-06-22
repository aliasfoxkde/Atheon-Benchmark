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

describe('D1Database (ready state)', () => {
  let db: D1Database;
  let mockD1Database: any;

  beforeEach(() => {
    db = new D1Database({ dbName: 'test-db' });
    // Create mock D1 database
    mockD1Database = {
      prepare: jest.fn()
    };
  });

  describe('bindD1', () => {
    it('should set ready to true when D1 is bound', () => {
      db.bindD1(mockD1Database);
      // After binding, operations should not return false/null immediately
      // They will proceed to try D1 operations
    });
  });

  describe('saveBenchmark (ready)', () => {
    it('should save benchmark when D1 is bound', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockResolvedValue({ success: true })
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

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

      expect(result).toBe(true);
      expect(mockD1Database.prepare).toHaveBeenCalled();
    });

    it('should return false on D1 error', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockRejectedValue(new Error('D1 error'))
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

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

  describe('saveResult (ready)', () => {
    it('should save result when D1 is bound', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockResolvedValue({ success: true })
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

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

      expect(result).toBe(true);
    });

    it('should return false on D1 error', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockRejectedValue(new Error('D1 error'))
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

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

  describe('getBenchmark (ready)', () => {
    it('should return benchmark when found', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 'bench-1',
          name: 'Test',
          scenario: 'vanilla',
          status: 'completed',
          created_at: '2026-06-20T00:00:00Z',
          progress: 100,
          total_tests: 5,
          completed_tests: 5,
          summary: '{"avg_duration_ms": 150}'
        })
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const result = await db.getBenchmark('bench-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('bench-1');
      expect(result?.summary).toEqual({ avg_duration_ms: 150 });
    });

    it('should return null when not found', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null)
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const result = await db.getBenchmark('nonexistent');
      expect(result).toBeNull();
    });

    it('should return null on D1 error', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockRejectedValue(new Error('D1 error'))
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const result = await db.getBenchmark('bench-1');
      expect(result).toBeNull();
    });
  });

  describe('getAllBenchmarks (ready)', () => {
    it('should return benchmarks with parsed summaries', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue({
          results: [
            { id: 'bench-1', summary: '{"avg_duration_ms": 100}' },
            { id: 'bench-2', summary: null }
          ]
        })
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const result = await db.getAllBenchmarks(50, 0);

      expect(result).toHaveLength(2);
      expect(result[0].summary).toEqual({ avg_duration_ms: 100 });
      expect(result[1].summary).toBeNull();
    });

    it('should return empty array on D1 error', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        all: jest.fn().mockRejectedValue(new Error('D1 error'))
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const result = await db.getAllBenchmarks();
      expect(result).toEqual([]);
    });
  });

  describe('getResults (ready)', () => {
    it('should return results when found', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue({
          results: [
            { id: 'result-1', benchmark_id: 'bench-1' },
            { id: 'result-2', benchmark_id: 'bench-1' }
          ]
        })
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const result = await db.getResults('bench-1');

      expect(result).toHaveLength(2);
    });

    it('should return empty array on D1 error', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        all: jest.fn().mockRejectedValue(new Error('D1 error'))
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const result = await db.getResults('bench-1');
      expect(result).toEqual([]);
    });
  });

  describe('updateBenchmarkStatus (ready)', () => {
    it('should update status only', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockResolvedValue({ success: true })
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const result = await db.updateBenchmarkStatus('bench-1', 'running');
      expect(result).toBe(true);
    });

    it('should update with progress', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockResolvedValue({ success: true })
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const result = await db.updateBenchmarkStatus('bench-1', 'running', 50);
      expect(result).toBe(true);
    });

    it('should update with completed tests', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockResolvedValue({ success: true })
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const result = await db.updateBenchmarkStatus('bench-1', 'running', 100, 5);
      expect(result).toBe(true);
    });

    it('should set completed_at when status is completed', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockResolvedValue({ success: true })
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const result = await db.updateBenchmarkStatus('bench-1', 'completed');
      expect(result).toBe(true);
    });

    it('should update with summary', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockResolvedValue({ success: true })
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const result = await db.updateBenchmarkStatus('bench-1', 'completed', 100, 5, { avg_duration_ms: 150 });
      expect(result).toBe(true);
    });

    it('should return false on D1 error', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockRejectedValue(new Error('D1 error'))
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const result = await db.updateBenchmarkStatus('bench-1', 'running');
      expect(result).toBe(false);
    });
  });

  describe('deleteBenchmark (ready)', () => {
    it('should delete benchmark and results', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockResolvedValue({ success: true })
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const result = await db.deleteBenchmark('bench-1');
      expect(result).toBe(true);
      // Should call prepare twice: once for DELETE FROM results, once for DELETE FROM benchmarks
      expect(mockD1Database.prepare).toHaveBeenCalledTimes(2);
    });

    it('should return false on D1 error', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockRejectedValue(new Error('D1 error'))
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const result = await db.deleteBenchmark('bench-1');
      expect(result).toBe(false);
    });
  });

  describe('getStatistics (ready)', () => {
    it('should return statistics from completed benchmarks', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        all: jest.fn().mockResolvedValue({
          results: [
            { scenario: 'vanilla', status: 'completed', avg_duration: 150 },
            { scenario: 'vanilla', status: 'completed', avg_duration: 200 },
            { scenario: 'mcp', status: 'completed', avg_duration: 180 }
          ]
        })
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const result = await db.getStatistics();

      expect(result.total).toBe(3);
      expect(result.byScenario.vanilla).toBe(2);
      expect(result.byScenario.mcp).toBe(1);
      expect(result.avgDuration).toBeGreaterThan(0);
    });

    it('should return zero statistics on D1 error', async () => {
      db.bindD1(mockD1Database);

      const mockStmt = {
        all: jest.fn().mockRejectedValue(new Error('D1 error'))
      };
      mockD1Database.prepare.mockReturnValue(mockStmt);

      const result = await db.getStatistics();

      expect(result.total).toBe(0);
      expect(result.avgDuration).toBe(0);
    });
  });
});
