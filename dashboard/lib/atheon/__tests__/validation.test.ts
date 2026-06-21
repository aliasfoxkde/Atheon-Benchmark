/**
 * Atheon Validation Unit Tests
 * Tests for the AtheonValidation class
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  AtheonValidation,
  createAtheonValidation,
  VALIDATION_CATEGORIES,
  VALIDATION_PRESETS,
  ValidationResult,
  ValidationError
} from '../validation';

describe('AtheonValidation', () => {
  let validation: AtheonValidation;

  beforeEach(() => {
    validation = new AtheonValidation();
  });

  describe('Constructor', () => {
    it('should create instance', () => {
      expect(validation).toBeDefined();
    });

    it('should initialize default rules', () => {
      const rules = validation.getRules();
      expect(rules.length).toBeGreaterThan(0);
    });
  });

  describe('validate', () => {
    it('should return valid for clean content', () => {
      const result = validation.validate('This is clean content');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return score of 100 for perfect content', () => {
      const result = validation.validate('clean content');
      expect(result.score).toBe(100);
    });

    it('should detect hardcoded secrets', () => {
      const result = validation.validate('API_KEY = "abcdef1234567890abcdef1234567890"');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect console.log', () => {
      const result = validation.validate('console.log("test")');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect debugger statements', () => {
      const result = validation.validate('debugger;');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect TODO comments', () => {
      const result = validation.validate('// TODO: implement this');
      // TODO is a warning/info, doesn't make invalid
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect var usage', () => {
      const result = validation.validate('var x = 5;');
      // var is info severity
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect synchronous file operations', () => {
      const result = validation.validate('fs.readFileSync("file.txt")');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should include metadata when provided', () => {
      const result = validation.validate('content', { file: 'test.ts', author: 'me' });
      expect(result.metadata.file).toBe('test.ts');
      expect(result.metadata.author).toBe('me');
    });

    it('should default metadata to empty object', () => {
      const result = validation.validate('content');
      expect(result.metadata).toEqual({});
    });

    it('should calculate score based on issues', () => {
      const result = validation.validate('var x = 5; console.log("test"); debugger;');
      expect(result.score).toBeLessThan(100);
    });

    it('should cap score at 0', () => {
      // Generate many errors
      const content = Array(20).fill('console.log("x") debugger; var x;').join('\n');
      const result = validation.validate(content);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateMultiple', () => {
    it('should validate multiple files', () => {
      const files = new Map([
        ['file1.ts', 'clean content'],
        ['file2.ts', 'console.log("debug")'],
      ]);
      const results = validation.validateMultiple(files);
      expect(results.size).toBe(2);
    });

    it('should include file metadata in each result', () => {
      const files = new Map([
        ['myfile.ts', 'content'],
      ]);
      const results = validation.validateMultiple(files);
      const result = results.get('myfile.ts');
      expect(result?.metadata.file).toBe('myfile.ts');
    });

    it('should handle empty map', () => {
      const results = validation.validateMultiple(new Map());
      expect(results.size).toBe(0);
    });
  });

  describe('getStatistics', () => {
    it('should compute stats across results', () => {
      const results: ValidationResult[] = [
        { valid: true, errors: [], warnings: [], score: 100, metadata: {} },
        { valid: false, errors: [{ code: 'e', message: 'm', severity: 'error' }], warnings: [], score: 90, metadata: {} },
      ];
      const stats = validation.getStatistics(results);
      expect(stats.total).toBe(2);
      expect(stats.valid).toBe(1);
      expect(stats.invalid).toBe(1);
      expect(stats.total_errors).toBe(1);
    });

    it('should compute average score', () => {
      const results: ValidationResult[] = [
        { valid: true, errors: [], warnings: [], score: 80, metadata: {} },
        { valid: true, errors: [], warnings: [], score: 100, metadata: {} },
      ];
      const stats = validation.getStatistics(results);
      expect(stats.avg_score).toBe(90);
    });

    it('should handle empty array', () => {
      const stats = validation.getStatistics([]);
      expect(stats.total).toBe(0);
      expect(stats.valid).toBe(0);
      expect(stats.avg_score).toBe(0);
    });
  });

  describe('Rule Management', () => {
    it('should add custom rule', () => {
      validation.addRule({
        id: 'custom-rule',
        name: 'Custom Rule',
        category: 'custom',
        severity: 'warning',
        check: (content: string) => !content.includes('forbidden'),
        message: 'Custom forbidden word',
      });
      const result = validation.validate('forbidden word here');
      expect(result.warnings.some(w => w.code === 'custom-rule')).toBe(true);
    });

    it('should remove rule', () => {
      validation.removeRule('no-console-log');
      const result = validation.validate('console.log("test")');
      // Console log should not trigger after removal
      const hasConsoleLog = result.warnings.some(w => w.code === 'no-console-log');
      expect(hasConsoleLog).toBe(false);
    });

    it('should disable rule', () => {
      validation.setRuleEnabled('no-console-log', false);
      const result = validation.validate('console.log("test")');
      const hasConsoleLog = result.warnings.some(w => w.code === 'no-console-log');
      expect(hasConsoleLog).toBe(false);
    });

    it('should re-enable rule', () => {
      validation.setRuleEnabled('no-console-log', false);
      validation.setRuleEnabled('no-console-log', true);
      const result = validation.validate('console.log("test")');
      const hasConsoleLog = result.warnings.some(w => w.code === 'no-console-log');
      expect(hasConsoleLog).toBe(true);
    });

    it('should handle disabling non-existent rule', () => {
      // Should not throw
      validation.setRuleEnabled('nonexistent', false);
    });

    it('should get rules by category', () => {
      const security = validation.getRulesByCategory('security');
      expect(Array.isArray(security)).toBe(true);
      expect(security.every(r => r.category === 'security')).toBe(true);
    });

    it('should get categories', () => {
      const categories = validation.getCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('security');
      expect(categories).toContain('code-quality');
    });
  });

  describe('combineWithQualityGates', () => {
    it('should combine results', () => {
      const validationResult: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        score: 100,
        metadata: {},
      };

      const qualityGate = {
        passed: true,
        findings: [
          {
            pattern: 'aws-key',
            category: 'secrets',
            severity: 'critical' as const,
            line: 1,
            column: 1,
            message: 'AWS key found',
            matchedText: 'AKIA...',
          },
        ],
        summary: { total: 1, by_category: {}, by_severity: { critical: 1 }, critical_count: 1, high_count: 0, medium_count: 0, low_count: 0 },
        violations: [],
        timestamp: new Date(),
        execution_time_ms: 100,
      };

      const combined = validation.combineWithQualityGates(validationResult, qualityGate);
      expect(combined.errors.length).toBe(1);
      expect(combined.valid).toBe(false);
      expect(combined.metadata.quality_gate_passed).toBe(true);
      expect(combined.metadata.quality_gate_findings).toBe(1);
    });

    it('should mark invalid when quality gate fails', () => {
      const validationResult: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        score: 100,
        metadata: {},
      };

      const qualityGate = {
        passed: false,
        findings: [],
        summary: { total: 0, by_category: {}, by_severity: {}, critical_count: 0, high_count: 0, medium_count: 0, low_count: 0 },
        violations: [],
        timestamp: new Date(),
        execution_time_ms: 100,
      };

      const combined = validation.combineWithQualityGates(validationResult, qualityGate);
      expect(combined.valid).toBe(false);
    });

    it('should convert medium severity findings to warnings', () => {
      const validationResult: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        score: 100,
        metadata: {},
      };

      const qualityGate = {
        passed: true,
        findings: [
          {
            pattern: 'console-log',
            category: 'code-quality',
            severity: 'medium' as const,
            line: 1,
            column: 1,
            message: 'Console.log',
            matchedText: 'console.log',
          },
        ],
        summary: { total: 1, by_category: {}, by_severity: { medium: 1 }, critical_count: 0, high_count: 0, medium_count: 1, low_count: 0 },
        violations: [],
        timestamp: new Date(),
        execution_time_ms: 100,
      };

      const combined = validation.combineWithQualityGates(validationResult, qualityGate);
      expect(combined.warnings.length).toBe(1);
      expect(combined.errors.length).toBe(0);
    });
  });

  describe('generateReport', () => {
    it('should generate a report', () => {
      const results = new Map<string, ValidationResult>();
      results.set('file1.ts', {
        valid: false,
        errors: [{ code: 'e1', message: 'Error 1', severity: 'error' }],
        warnings: [],
        score: 80,
        metadata: {},
      });

      const report = validation.generateReport(results);
      expect(report).toContain('Atheon Validation Report');
      expect(report).toContain('file1.ts');
    });

    it('should include suggestions in report', () => {
      const results = new Map<string, ValidationResult>();
      results.set('file1.ts', {
        valid: false,
        errors: [{
          code: 'e1',
          message: 'Error',
          severity: 'error',
          suggestion: 'Fix this way',
        }],
        warnings: [],
        score: 80,
        metadata: {},
      });

      const report = validation.generateReport(results);
      expect(report).toContain('Fix this way');
    });

    it('should skip files with no issues', () => {
      const results = new Map<string, ValidationResult>();
      results.set('clean.ts', {
        valid: true,
        errors: [],
        warnings: [],
        score: 100,
        metadata: {},
      });

      const report = validation.generateReport(results);
      // Should still include summary but not detail for clean files
      expect(report).toContain('Summary');
    });
  });
});

describe('createAtheonValidation', () => {
  it('should create AtheonValidation instance', () => {
    const v = createAtheonValidation();
    expect(v).toBeInstanceOf(AtheonValidation);
  });
});

describe('VALIDATION_CATEGORIES', () => {
  it('should be non-empty array', () => {
    expect(Array.isArray(VALIDATION_CATEGORIES)).toBe(true);
    expect(VALIDATION_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('should include security', () => {
    expect(VALIDATION_CATEGORIES).toContain('security');
  });

  it('should include code-quality', () => {
    expect(VALIDATION_CATEGORIES).toContain('code-quality');
  });
});

describe('VALIDATION_PRESETS', () => {
  it('should include strict preset', () => {
    expect(VALIDATION_PRESETS['strict']).toBeDefined();
    expect(VALIDATION_PRESETS['strict']).toContain('no-hardcoded-secrets');
  });

  it('should include code-quality preset', () => {
    expect(VALIDATION_PRESETS['code-quality']).toBeDefined();
    expect(VALIDATION_PRESETS['code-quality']).toContain('no-console-log');
  });

  it('should include comprehensive preset', () => {
    expect(VALIDATION_PRESETS['comprehensive']).toBeDefined();
    expect(VALIDATION_PRESETS['comprehensive'].length).toBe(VALIDATION_CATEGORIES.length);
  });
});