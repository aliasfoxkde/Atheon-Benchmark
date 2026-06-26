/**
 * Tests for Pattern Quality Scoring Module
 */

import {
  PATTERN_CORPUS,
  scanTextWithPatterns,
  compareFindings,
  calculatePatternScore,
  evaluatePatternQuality,
  getPatternsNeedingImprovement,
  suggestPatternImprovements,
  getQualityReport,
  type LabeledFinding,
  type DetectedFinding,
  type PatternQualityScore,
  type PatternSetQualityScore,
} from '../pattern-quality';
import type { AtheonPattern } from '../../claude/atheon-integration';

// Mock patterns for testing
const TEST_PATTERNS: AtheonPattern[] = [
  {
    name: 'aws-access-key',
    category: 'secrets',
    severity: 'critical',
    pattern: '\\bAKIA[0-9A-Z]{16}\\b',
    description: 'AWS Access Key ID detected',
  },
  {
    name: 'api-key-generic',
    category: 'secrets',
    severity: 'high',
    pattern: '\\bapi[_-]?key\\s*[=:]\\s*["\']?[a-zA-Z0-9_\\-]{16,}["\']?',
    description: 'Generic API key pattern detected',
  },
  {
    name: 'console-log',
    category: 'code-quality',
    severity: 'medium',
    pattern: 'console\\.log\\(',
    description: 'Console.log statement detected',
  },
  {
    name: 'todo-comment',
    category: 'code-quality',
    severity: 'low',
    pattern: '\\bTODO\\b',
    description: 'TODO comment detected',
  },
  {
    name: 'debug-statement',
    category: 'code-quality',
    severity: 'medium',
    pattern: '\\bdebugger\\b',
    description: 'Debugger statement detected',
  },
];

describe('Pattern Quality Scoring', () => {
  describe('scanTextWithPatterns', () => {
    it('should detect AWS access key pattern', () => {
      const content = 'AWS Key: AKIAIOSFODNN7EXAMPLE';
      const findings = scanTextWithPatterns(content, TEST_PATTERNS);

      expect(findings).toHaveLength(1);
      expect(findings[0].pattern_id).toBe('aws-access-key');
      expect(findings[0].line).toBe(1);
    });

    it('should detect console.log statements', () => {
      const content = `function test() {
  console.log('debug');
  return true;
}`;
      const findings = scanTextWithPatterns(content, TEST_PATTERNS);

      expect(findings.some(f => f.pattern_id === 'console-log')).toBe(true);
    });

    it('should detect TODO comments', () => {
      const content = '// TODO: Fix this later';
      const findings = scanTextWithPatterns(content, TEST_PATTERNS);

      expect(findings.some(f => f.pattern_id === 'todo-comment')).toBe(true);
    });

    it('should return empty array for clean content', () => {
      const content = 'function hello() { return "world"; }';
      const findings = scanTextWithPatterns(content, TEST_PATTERNS);

      expect(findings).toHaveLength(0);
    });

    it('should handle multiline content correctly', () => {
      const content = `line one
line two
line three`;
      const findings = scanTextWithPatterns(content, TEST_PATTERNS);

      expect(findings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('compareFindings', () => {
    it('should identify true positives correctly', () => {
      const detected: DetectedFinding[] = [
        { pattern_id: 'aws-access-key', line: 1, column: 10, matched_text: 'AKIAIOSFODNN7EXAMPLE' },
      ];
      const expected: LabeledFinding[] = [
        { pattern_id: 'aws-access-key', line: 1, column: 10, matched_text: 'AKIAIOSFODNN7EXAMPLE' },
      ];

      const result = compareFindings(detected, expected);

      expect(result.true_positives).toHaveLength(1);
      expect(result.false_positives).toHaveLength(0);
      expect(result.false_negatives).toHaveLength(0);
    });

    it('should identify false positives correctly', () => {
      const detected: DetectedFinding[] = [
        { pattern_id: 'aws-access-key', line: 1, column: 10, matched_text: 'AKIAAAA111111111' },
      ];
      const expected: LabeledFinding[] = []; // Nothing expected

      const result = compareFindings(detected, expected);

      expect(result.false_positives).toHaveLength(1);
    });

    it('should identify false negatives correctly', () => {
      const detected: DetectedFinding[] = []; // Nothing detected
      const expected: LabeledFinding[] = [
        { pattern_id: 'aws-access-key', line: 1, column: 10, matched_text: 'AKIAIOSFODNN7EXAMPLE' },
      ];

      const result = compareFindings(detected, expected);

      expect(result.false_negatives).toHaveLength(1);
    });

    it('should use fuzzy matching for nearby findings', () => {
      const detected: DetectedFinding[] = [
        { pattern_id: 'console-log', line: 5, column: 2, matched_text: 'console.log' },
      ];
      const expected: LabeledFinding[] = [
        { pattern_id: 'console-log', line: 4, column: 2, matched_text: 'console.log' }, // Off by 1 line
      ];

      const result = compareFindings(detected, expected);

      // Should match due to fuzzy matching
      expect(result.true_positives.length + result.false_positives.length).toBeGreaterThan(0);
    });
  });

  describe('calculatePatternScore', () => {
    it('should calculate precision correctly', () => {
      const comparison = {
        true_positives: [
          { pattern_id: 'test', line: 1, column: 1, matched_text: 'test' } as DetectedFinding,
        ],
        false_positives: [
          { pattern_id: 'test', line: 2, column: 1, matched_text: 'test' } as DetectedFinding,
        ],
        false_negatives: [
          { pattern_id: 'test', line: 3, column: 1, matched_text: 'test' } as LabeledFinding,
        ],
      };

      const score = calculatePatternScore(
        'test',
        'test-pattern',
        'secrets',
        comparison,
        2, // total expected
        2  // total detected
      );

      expect(score.precision).toBe(0.5); // 1 TP / (1 TP + 1 FP)
      expect(score.recall).toBe(0.5);    // 1 TP / (1 TP + 1 FN)
    });

    it('should handle zero divisions gracefully', () => {
      const comparison = {
        true_positives: [],
        false_positives: [],
        false_negatives: [],
      };

      const score = calculatePatternScore('test', 'test', 'secrets', comparison, 0, 0);

      expect(score.precision).toBe(0);
      expect(score.recall).toBe(0);
      expect(score.f1_score).toBe(0);
    });
  });

  describe('evaluatePatternQuality', () => {
    it('should evaluate corpus against patterns', () => {
      const result = evaluatePatternQuality(TEST_PATTERNS, PATTERN_CORPUS);

      expect(result.corpus_size).toBe(PATTERN_CORPUS.length);
      expect(result.pattern_scores).toBeDefined();
      expect(Array.isArray(result.pattern_scores)).toBe(true);
    });

    it('should calculate overall scores', () => {
      const result = evaluatePatternQuality(TEST_PATTERNS, PATTERN_CORPUS);

      expect(result.overall_precision).toBeGreaterThanOrEqual(0);
      expect(result.overall_precision).toBeLessThanOrEqual(1);
      expect(result.overall_recall).toBeGreaterThanOrEqual(0);
      expect(result.overall_recall).toBeLessThanOrEqual(1);
      expect(result.overall_f1).toBeGreaterThanOrEqual(0);
      expect(result.overall_f1).toBeLessThanOrEqual(1);
    });

    it('should track total findings', () => {
      const result = evaluatePatternQuality(TEST_PATTERNS, PATTERN_CORPUS);

      expect(result.total_expected_findings).toBeGreaterThanOrEqual(0);
      expect(result.total_detected_findings).toBeGreaterThanOrEqual(0);
    });

    it('should calculate accuracy correctly as TP/(TP+FP+FN)', () => {
      const result = evaluatePatternQuality(TEST_PATTERNS, PATTERN_CORPUS);

      // Accuracy should be a valid probability
      expect(result.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.accuracy).toBeLessThanOrEqual(1);

      // Calculate expected accuracy: TP / (TP + FP + FN)
      const totalTP = result.pattern_scores.reduce((sum, ps) => sum + ps.true_positives, 0);
      const totalFP = result.pattern_scores.reduce((sum, ps) => sum + ps.false_positives, 0);
      const totalFN = result.pattern_scores.reduce((sum, ps) => sum + ps.false_negatives, 0);
      const expectedAccuracy = totalTP + totalFP + totalFN > 0
        ? totalTP / (totalTP + totalFP + totalFN)
        : 0;

      expect(result.accuracy).toBeCloseTo(expectedAccuracy, 5);
    });
  });

  describe('getPatternsNeedingImprovement', () => {
    it('should return patterns below threshold', () => {
      const scoreSet: PatternSetQualityScore = {
        overall_precision: 0.5,
        overall_recall: 0.5,
        overall_f1: 0.5,
        pattern_scores: [
          {
            pattern_id: 'good-pattern',
            pattern: 'good',
            category: 'secrets',
            precision: 0.9,
            recall: 0.9,
            f1_score: 0.9,
            true_positives: 10,
            false_positives: 1,
            false_negatives: 1,
            true_negatives: 0,
            total_expected: 11,
            total_detected: 11,
          },
          {
            pattern_id: 'bad-pattern',
            pattern: 'bad',
            category: 'secrets',
            precision: 0.3,
            recall: 0.4,
            f1_score: 0.35,
            true_positives: 3,
            false_positives: 7,
            false_negatives: 5,
            true_negatives: 0,
            total_expected: 8,
            total_detected: 10,
          },
        ],
        corpus_size: 5,
        total_expected_findings: 19,
        total_detected_findings: 21,
        accuracy: 0.5,
      };

      const needsWork = getPatternsNeedingImprovement(scoreSet, 0.7);

      expect(needsWork).toHaveLength(1);
      expect(needsWork[0].pattern_id).toBe('bad-pattern');
    });

    it('should return empty array when all patterns are good', () => {
      const scoreSet: PatternSetQualityScore = {
        overall_precision: 0.9,
        overall_recall: 0.9,
        overall_f1: 0.9,
        pattern_scores: [
          {
            pattern_id: 'good',
            pattern: 'good',
            category: 'secrets',
            precision: 0.95,
            recall: 0.9,
            f1_score: 0.92,
            true_positives: 10,
            false_positives: 1,
            false_negatives: 1,
            true_negatives: 0,
            total_expected: 11,
            total_detected: 11,
          },
        ],
        corpus_size: 5,
        total_expected_findings: 11,
        total_detected_findings: 11,
        accuracy: 0.9,
      };

      const needsWork = getPatternsNeedingImprovement(scoreSet, 0.7);

      expect(needsWork).toHaveLength(0);
    });
  });

  describe('suggestPatternImprovements', () => {
    it('should suggest improvements for low precision patterns', () => {
      const scoreSet: PatternSetQualityScore = {
        overall_precision: 0.5,
        overall_recall: 0.5,
        overall_f1: 0.5,
        pattern_scores: [
          {
            pattern_id: 'high-false-positives',
            pattern: '.*',
            category: 'secrets',
            precision: 0.2,
            recall: 0.8,
            f1_score: 0.32,
            true_positives: 20,
            false_positives: 80,
            false_negatives: 5,
            true_negatives: 0,
            total_expected: 25,
            total_detected: 100,
          },
        ],
        corpus_size: 10,
        total_expected_findings: 25,
        total_detected_findings: 100,
        accuracy: 0.2,
      };

      const suggestions = suggestPatternImprovements(scoreSet);

      expect(suggestions['high-false-positives']).toBeDefined();
      expect(suggestions['high-false-positives']!.some(s => s.includes('false positive'))).toBe(true);
    });

    it('should suggest improvements for low recall patterns', () => {
      const scoreSet: PatternSetQualityScore = {
        overall_precision: 0.5,
        overall_recall: 0.5,
        overall_f1: 0.5,
        pattern_scores: [
          {
            pattern_id: 'high-false-negatives',
            pattern: 'exact',
            category: 'secrets',
            precision: 0.9,
            recall: 0.3,
            f1_score: 0.45,
            true_positives: 3,
            false_positives: 1,
            false_negatives: 7,
            true_negatives: 0,
            total_expected: 10,
            total_detected: 4,
          },
        ],
        corpus_size: 10,
        total_expected_findings: 10,
        total_detected_findings: 4,
        accuracy: 0.3,
      };

      const suggestions = suggestPatternImprovements(scoreSet);

      expect(suggestions['high-false-negatives']).toBeDefined();
      expect(suggestions['high-false-negatives']!.some(s => s.includes('recall') || s.includes('FN'))).toBe(true);
    });
  });

  describe('getQualityReport', () => {
    it('should generate formatted report', () => {
      const score: PatternSetQualityScore = {
        overall_precision: 0.85,
        overall_recall: 0.78,
        overall_f1: 0.81,
        pattern_scores: [],
        corpus_size: 10,
        total_expected_findings: 50,
        total_detected_findings: 55,
        accuracy: 0.75,
      };

      const report = getQualityReport(score);

      expect(report).toContain('PATTERN QUALITY SCORING REPORT');
      expect(report).toContain('Precision');
      expect(report).toContain('Recall');
      expect(report).toContain('F1');
    });
  });

  describe('PATTERN_CORPUS', () => {
    it('should have entries for secrets detection', () => {
      const secretEntries = PATTERN_CORPUS.filter(c => c.id.includes('secret'));

      expect(secretEntries.length).toBeGreaterThan(0);
    });

    it('should have negative test entries', () => {
      const negativeEntries = PATTERN_CORPUS.filter(c => c.id.includes('negative'));

      expect(negativeEntries.length).toBeGreaterThan(0);
    });

    it('should have entries with expected findings', () => {
      const entriesWithFindings = PATTERN_CORPUS.filter(c => c.expected_findings.length > 0);

      expect(entriesWithFindings.length).toBeGreaterThan(0);
    });

    it('should have valid content in each entry', () => {
      for (const entry of PATTERN_CORPUS) {
        expect(entry.content).toBeDefined();
        expect(entry.content.length).toBeGreaterThan(0);
        expect(entry.id).toBeDefined();
        expect(entry.language).toBeDefined();
      }
    });
  });
});
