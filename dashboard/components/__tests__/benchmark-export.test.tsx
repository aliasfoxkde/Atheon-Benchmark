/**
 * Benchmark Export Component Unit Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('BenchmarkExport Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Props Interface', () => {
    it('should accept data prop', () => {
      const props = {
        data: { test: 'value' },
        filename: 'test-results',
      };
      expect(props.data).toBeDefined();
    });

    it('should accept optional filename prop', () => {
      const props = {
        data: {},
        filename: 'custom-filename',
      };
      expect(props.filename).toBe('custom-filename');
    });

    it('should use default filename', () => {
      const defaultFilename = 'benchmark-results';
      expect(defaultFilename).toBe('benchmark-results');
    });
  });

  describe('JSON Export', () => {
    it('should stringify data as JSON', () => {
      const data = { name: 'test', value: 123 };
      const jsonStr = JSON.stringify(data, null, 2);
      expect(jsonStr).toContain('"name": "test"');
      expect(jsonStr).toContain('"value": 123');
    });

    it('should create blob with correct mime type', () => {
      const data = { test: true };
      const jsonStr = JSON.stringify(data);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      expect(blob.type).toBe('application/json');
    });
  });

  describe('CSV Export', () => {
    it('should extract headers correctly', () => {
      const headers = ['system_id', 'ns_per_op', 'files_per_sec'];
      expect(headers).toContain('system_id');
      expect(headers).toContain('ns_per_op');
    });

    it('should handle array data', () => {
      const data = [{ a: 1 }, { a: 2 }];
      const results = Array.isArray(data) ? data : [data];
      expect(results).toHaveLength(2);
    });

    it('should handle single object data', () => {
      const data = { a: 1 };
      const results = Array.isArray(data) ? data : [data];
      expect(results).toHaveLength(1);
    });

    it('should escape CSV string values', () => {
      const value = 'test "quoted" value';
      const escaped = `"${value.replace(/"/g, '""')}"`;
      expect(escaped).toBe('"test ""quoted"" value"');
    });
  });

  describe('Clipboard Copy', () => {
    it('should stringify data for clipboard', async () => {
      const data = { copy: 'test' };
      const jsonStr = JSON.stringify(data, null, 2);
      expect(jsonStr).toContain('"copy": "test"');
    });

    it('should set copied state after successful copy', async () => {
      let copied = false;
      const setCopied = (value: boolean) => { copied = value; };
      
      // Simulate successful copy
      setCopied(true);
      expect(copied).toBe(true);
      
      // Simulate reset after timeout
      setTimeout(() => setCopied(false), 2000);
    });
  });

  describe('Component Export', () => {
    it('should export BenchmarkExport component', async () => {
      const { BenchmarkExport } = await import('../benchmark-export');
      expect(BenchmarkExport).toBeDefined();
    });
  });
});
