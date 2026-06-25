/**
 * Pattern Quality Scoring with Labeled Corpus
 * Evaluates pattern effectiveness using a known dataset with expected findings
 */

import { AtheonPattern } from '../claude/atheon-integration';

/**
 * Labeled finding - expected detection in test corpus
 */
export interface LabeledFinding {
  pattern_id: string;
  line: number;
  column: number;
  matched_text: string;
  category?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Test corpus entry - a file with known findings
 */
export interface CorpusEntry {
  id: string;
  name: string;
  content: string;
  language: string;
  expected_findings: LabeledFinding[];
  description?: string;
  source?: string;
}

/**
 * Actual finding from pattern scan
 */
export interface DetectedFinding {
  pattern_id: string;
  line: number;
  column: number;
  matched_text: string;
}

/**
 * Quality score for a single pattern
 */
export interface PatternQualityScore {
  pattern_id: string;
  pattern: string;
  category: string;
  precision: number;      // True positives / (True positives + False positives)
  recall: number;        // True positives / (True positives + False negatives)
  f1_score: number;      // Harmonic mean of precision and recall
  true_positives: number;
  false_positives: number;
  false_negatives: number;
  true_negatives: number;
  total_expected: number;
  total_detected: number;
}

/**
 * Overall quality score for a pattern set
 */
export interface PatternSetQualityScore {
  overall_precision: number;
  overall_recall: number;
  overall_f1: number;
  pattern_scores: PatternQualityScore[];
  corpus_size: number;
  total_expected_findings: number;
  total_detected_findings: number;
  accuracy: number;
}

/**
 * Detection result comparison
 */
export interface DetectionComparison {
  true_positives: DetectedFinding[];  // Found and expected
  false_positives: DetectedFinding[]; // Found but not expected
  false_negatives: LabeledFinding[];  // Expected but not found
}

/**
 * Labeled corpus for pattern quality testing
 */
export const PATTERN_CORPUS: CorpusEntry[] = [
  {
    id: 'corpus-secret-001',
    name: 'AWS Credentials',
    language: 'typescript',
    description: 'Should detect AWS access key pattern',
    content: `// Configuration file
const config = {
  accessKey: 'AKIA_REDACTED_00000000000000000000',
  secretKey: 'REDACTED_SECRET_KEY_REDACTED_EXAMPLE_KEY'
};

export default config;`,
    expected_findings: [
      { pattern_id: 'aws-access-key', line: 4, column: 14, matched_text: 'AKIAIOSFODNN7EXAMPLE' },
    ],
  },
  {
    id: 'corpus-secret-002',
    name: 'Generic API Key',
    language: 'javascript',
    description: 'Should detect generic API key pattern',
    content: `// API configuration
const apiConfig = {
  api_key: 'sk_test_example_key_for_pattern_detection_testing',
  endpoint: 'https://api.example.com'
};`,
    expected_findings: [
      { pattern_id: 'api-key-generic', line: 4, column: 10, matched_text: 'api_key: \'sk_test_example_key_for_pattern_detection_testing\'' },
    ],
  },
  {
    id: 'corpus-quality-001',
    name: 'Console Log Statements',
    language: 'typescript',
    description: 'Should detect console.log statements',
    content: `function processData(data: any) {
  console.log('Processing started');
  const result = data.map(x => x * 2);
  console.log('Result:', result);
  return result;
}`,
    expected_findings: [
      { pattern_id: 'console-log', line: 2, column: 2, matched_text: 'console.log' },
      { pattern_id: 'console-log', line: 5, column: 2, matched_text: 'console.log' },
    ],
  },
  {
    id: 'corpus-quality-002',
    name: 'TODO Comments',
    language: 'python',
    description: 'Should detect TODO comments',
    content: `# TODO: Implement error handling
def process_items(items):
    # TODO: Add validation
    # FIXME: Handle empty list case
    return [x for x in items if x is not None]`,
    expected_findings: [
      { pattern_id: 'todo-comment', line: 1, column: 1, matched_text: 'TODO' },
      { pattern_id: 'todo-comment', line: 3, column: 4, matched_text: 'TODO' },
    ],
  },
  {
    id: 'corpus-quality-003',
    name: 'Debug Statements',
    language: 'javascript',
    description: 'Should detect debugger statements',
    content: `function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price;
    debugger; // Breakpoint for debugging
  }
  return total;
}`,
    expected_findings: [
      { pattern_id: 'debug-statement', line: 5, column: 2, matched_text: 'debugger' },
    ],
  },
  {
    id: 'corpus-secret-003',
    name: 'Private Key Detection',
    language: 'python',
    description: 'Should detect private key patterns',
    content: `-----BEGIN RSA PRIVATE KEY-----
MIIBOgIBAAJBALRiMLAHudeSA2F+0TaLQV4tHfV4x2LRmVmKKF8yJjvBDXPF
j0E3q42r3F3i0iKjHvZq3q7x0Vvz9qXaZ1r0qECAwEAAQJAQCmPOqLrT6X2J
-----END RSA PRIVATE KEY-----`,
    expected_findings: [
      { pattern_id: 'private-key', line: 1, column: 1, matched_text: '-----BEGIN RSA PRIVATE KEY-----' },
    ],
  },
  {
    id: 'corpus-devops-001',
    name: 'Test Skip Detection',
    language: 'javascript',
    description: 'Should detect skipped tests',
    content: `describe('MathUtils', () => {
  describe.skip('complex calculation', () => {
    it.skip('should handle edge cases', () => {
      expect(1 + 1).toBe(2);
    });
  });
});`,
    expected_findings: [
      { pattern_id: 'test-skip', line: 2, column: 14, matched_text: 'describe.skip' },
      { pattern_id: 'test-skip', line: 3, column: 6, matched_text: 'it.skip' },
    ],
  },
  {
    id: 'corpus-ai-001',
    name: 'AI Detection Pattern',
    language: 'markdown',
    description: 'Should detect AI-generated content markers',
    content: `# Generated Report

This document was created using artificial intelligence and machine learning algorithms to analyze the provided data and generate insights.

AI-generated summary: The analysis shows significant trends.`,
    expected_findings: [
      { pattern_id: 'ai-generated', line: 4, column: 1, matched_text: 'AI' },
      { pattern_id: 'ai-generated', line: 5, column: 1, matched_text: 'artificial intelligence' },
    ],
  },
  {
    id: 'corpus-negative-001',
    name: 'Clean Code (Negative Test)',
    language: 'typescript',
    description: 'Should NOT detect any secrets or issues',
    content: `// Valid application code
interface User {
  id: string;
  name: string;
}

function getUserById(users: User[], id: string): User | undefined {
  return users.find(user => user.id === id);
}

export { User, getUserById };`,
    expected_findings: [], // No findings expected
  },
  {
    id: 'corpus-negative-002',
    name: 'Clean Configuration (Negative Test)',
    language: 'json',
    description: 'Should NOT detect any secrets',
    content: `{
  "app_name": "My Application",
  "version": "1.0.0",
  "features": ["auth", "database", "ui"],
  "max_connections": 100
}`,
    expected_findings: [], // No findings expected
  },
  {
    id: 'corpus-false-positive-001',
    name: 'False Positive Test - Placeholder',
    language: 'text',
    description: 'Contains text that might trigger false positives',
    content: `Example key: AKIA_REDACTED_00000000000000000000
This is just an example, not a real key.
Pattern should not match "REDACTED" alone.`,
    expected_findings: [
      // AWS key should still match - it's a real pattern
    ],
  },
];

/**
 * Scan text and return findings for patterns
 */
export function scanTextWithPatterns(
  content: string,
  patterns: AtheonPattern[]
): DetectedFinding[] {
  const findings: DetectedFinding[] = [];
  const lines = content.split('\n');

  for (const pattern of patterns) {
    try {
      const regex = new RegExp(pattern.pattern, 'gi');

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        regex.lastIndex = 0; // Reset regex state

        let match;
        while ((match = regex.exec(line)) !== null) {
          findings.push({
            pattern_id: pattern.name,
            line: lineIdx + 1,
            column: match.index + 1,
            matched_text: match[0],
          });
        }
      }
    } catch (error) {
      console.warn(`Invalid pattern regex for ${pattern.name}:`, error);
    }
  }

  return findings;
}

/**
 * Compare detected findings against expected findings
 */
export function compareFindings(
  detected: DetectedFinding[],
  expected: LabeledFinding[],
  matchThreshold: number = 0.8
): DetectionComparison {
  // Simple line-based matching for now
  // In production, could use more sophisticated matching

  const expectedSet = new Set(
    expected.map(e => `${e.pattern_id}:${e.line}:${e.column}:${e.matched_text.substring(0, 10)}`)
  );

  const detectedSet = new Set(
    detected.map(d => `${d.pattern_id}:${d.line}:${d.column}:${d.matched_text.substring(0, 10)}`)
  );

  const truePositives: DetectedFinding[] = [];
  const falsePositives: DetectedFinding[] = [];
  const falseNegatives: LabeledFinding[] = [];

  // Check each detected finding
  for (const d of detected) {
    const key = `${d.pattern_id}:${d.line}:${d.column}:${d.matched_text.substring(0, 10)}`;
    if (expectedSet.has(key)) {
      truePositives.push(d);
    } else {
      // Check if there's a nearby expected finding (fuzzy matching)
      const nearbyExpected = expected.find(e =>
        e.pattern_id === d.pattern_id &&
        Math.abs(e.line - d.line) <= 1 &&
        e.matched_text.toLowerCase().includes(d.matched_text.substring(0, 5).toLowerCase())
      );
      if (nearbyExpected) {
        truePositives.push(d);
      } else {
        falsePositives.push(d);
      }
    }
  }

  // Check each expected finding
  for (const e of expected) {
    const key = `${e.pattern_id}:${e.line}:${e.column}:${e.matched_text.substring(0, 10)}`;
    if (!detectedSet.has(key)) {
      // Check if detected with fuzzy matching
      const matched = detected.find(d =>
        e.pattern_id === d.pattern_id &&
        Math.abs(e.line - d.line) <= 1 &&
        d.matched_text.toLowerCase().includes(e.matched_text.substring(0, 5).toLowerCase())
      );
      if (!matched) {
        falseNegatives.push(e);
      }
    }
  }

  return {
    true_positives: truePositives,
    false_positives: falsePositives,
    false_negatives: falseNegatives,
  };
}

/**
 * Calculate quality score for a single pattern
 */
export function calculatePatternScore(
  patternId: string,
  pattern: string,
  category: string,
  comparison: DetectionComparison,
  totalExpected: number,
  totalDetected: number
): PatternQualityScore {
  const tp = comparison.true_positives.filter(f => f.pattern_id === patternId).length;
  const fp = comparison.false_positives.filter(f => f.pattern_id === patternId).length;
  const fn = comparison.false_negatives.filter(f => f.pattern_id === patternId).length;

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

  return {
    pattern_id: patternId,
    pattern,
    category,
    precision,
    recall,
    f1_score: f1,
    true_positives: tp,
    false_positives: fp,
    false_negatives: fn,
    true_negatives: 0, // Not tracked in current approach
    total_expected: totalExpected,
    total_detected: totalDetected,
  };
}

/**
 * Evaluate all patterns against the labeled corpus
 */
export function evaluatePatternQuality(
  patterns: AtheonPattern[],
  corpus: CorpusEntry[] = PATTERN_CORPUS
): PatternSetQualityScore {
  const allComparisons: DetectionComparison[] = [];
  let totalExpectedFindings = 0;
  let totalDetectedFindings = 0;

  // Run each corpus entry through the scanner
  for (const entry of corpus) {
    const detected = scanTextWithPatterns(entry.content, patterns);
    const comparison = compareFindings(detected, entry.expected_findings);

    allComparisons.push(comparison);
    totalExpectedFindings += entry.expected_findings.length;
    totalDetectedFindings += detected.length;
  }

  // Calculate scores per pattern
  const patternScores: PatternQualityScore[] = [];
  const patternMap = new Map(patterns.map(p => [p.name, p]));

  // Get unique pattern IDs from both detected and expected
  const patternIds = new Set<string>();
  for (const comp of allComparisons) {
    for (const f of comp.true_positives) patternIds.add(f.pattern_id);
    for (const f of comp.false_positives) patternIds.add(f.pattern_id);
    for (const f of comp.false_negatives) patternIds.add(f.pattern_id);
  }

  for (const patternId of Array.from(patternIds)) {
    const pattern = patternMap.get(patternId);
    const comparison: DetectionComparison = {
      true_positives: [],
      false_positives: [],
      false_negatives: [],
    };

    let expectedCount = 0;

    for (const comp of allComparisons) {
      comparison.true_positives.push(...comp.true_positives.filter(f => f.pattern_id === patternId));
      comparison.false_positives.push(...comp.false_positives.filter(f => f.pattern_id === patternId));
      comparison.false_negatives.push(...comp.false_negatives.filter(f => f.pattern_id === patternId));

      expectedCount += corpus
        .filter(c => c.expected_findings.some(e => e.pattern_id === patternId))
        .reduce((sum, c) => sum + c.expected_findings.filter(e => e.pattern_id === patternId).length, 0);
    }

    const detectedCount = comparison.true_positives.length + comparison.false_positives.length;

    patternScores.push(calculatePatternScore(
      patternId,
      pattern?.pattern || patternId,
      pattern?.category || 'unknown',
      comparison,
      expectedCount,
      detectedCount
    ));
  }

  // Calculate overall scores
  const totalTP = allComparisons.reduce((sum, c) => sum + c.true_positives.length, 0);
  const totalFP = allComparisons.reduce((sum, c) => sum + c.false_positives.length, 0);
  const totalFN = allComparisons.reduce((sum, c) => sum + c.false_negatives.length, 0);

  const overallPrecision = totalTP + totalFP > 0 ? totalTP / (totalTP + totalFP) : 0;
  const overallRecall = totalTP + totalFN > 0 ? totalTP / (totalTP + totalFN) : 0;
  const overallF1 = overallPrecision + overallRecall > 0
    ? 2 * (overallPrecision * overallRecall) / (overallPrecision + overallRecall)
    : 0;

  // Calculate accuracy
  const totalNegatives = corpus.reduce((sum, c) => {
    const lines = c.content.split('\n').length;
    const falsePositives = allComparisons.find(comp => {
      // This is a simplification
      return false;
    });
    return sum + lines * patterns.length; // Rough estimate
  }, 0);

  return {
    overall_precision: overallPrecision,
    overall_recall: overallRecall,
    overall_f1: overallF1,
    pattern_scores: patternScores.sort((a, b) => b.f1_score - a.f1_score),
    corpus_size: corpus.length,
    total_expected_findings: totalExpectedFindings,
    total_detected_findings: totalDetectedFindings,
    accuracy: totalExpectedFindings + totalDetectedFindings > 0
      ? totalTP / (totalExpectedFindings + totalDetectedFindings)
      : 0,
  };
}

/**
 * Get pattern quality report as formatted string
 */
export function getQualityReport(score: PatternSetQualityScore): string {
  const lines: string[] = [];

  lines.push('=' .repeat(60));
  lines.push('PATTERN QUALITY SCORING REPORT');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`Corpus Size: ${score.corpus_size} entries`);
  lines.push(`Total Expected Findings: ${score.total_expected_findings}`);
  lines.push(`Total Detected Findings: ${score.total_detected_findings}`);
  lines.push('');
  lines.push('OVERALL SCORES:');
  lines.push(`  Precision: ${(score.overall_precision * 100).toFixed(1)}%`);
  lines.push(`  Recall:    ${(score.overall_recall * 100).toFixed(1)}%`);
  lines.push(`  F1 Score:  ${(score.overall_f1 * 100).toFixed(1)}%`);
  lines.push(`  Accuracy:  ${(score.accuracy * 100).toFixed(1)}%`);
  lines.push('');
  lines.push('INDIVIDUAL PATTERN SCORES:');
  lines.push('-'.repeat(60));

  for (const ps of score.pattern_scores) {
    const status = ps.f1_score >= 0.9 ? '✓' : ps.f1_score >= 0.7 ? '~' : '✗';
    lines.push(`  ${status} ${ps.pattern_id} (${ps.category})`);
    lines.push(`      Precision: ${(ps.precision * 100).toFixed(0)}%  Recall: ${(ps.recall * 100).toFixed(0)}%  F1: ${(ps.f1_score * 100).toFixed(0)}%`);
    lines.push(`      TP: ${ps.true_positives}  FP: ${ps.false_positives}  FN: ${ps.false_negatives}`);
  }

  lines.push('');
  lines.push('='.repeat(60));

  return lines.join('\n');
}

/**
 * Get patterns that need improvement
 */
export function getPatternsNeedingImprovement(
  score: PatternSetQualityScore,
  minF1Score: number = 0.7
): PatternQualityScore[] {
  return score.pattern_scores.filter(ps => ps.f1_score < minF1Score);
}

/**
 * Suggest pattern improvements based on false positives/negatives
 */
export function suggestPatternImprovements(
  score: PatternSetQualityScore
): Record<string, string[]> {
  const suggestions: Record<string, string[]> = {};

  for (const ps of score.pattern_scores) {
    const patternSuggestions: string[] = [];

    if (ps.precision < 0.8) {
      patternSuggestions.push(
        `High false positives detected (${ps.false_positives} FPs). ` +
        'Consider making the pattern more specific.'
      );
    }

    if (ps.recall < 0.8) {
      patternSuggestions.push(
        `Low recall (${ps.false_negatives} FNs). ` +
        'Consider making the pattern more general or adding variations.'
      );
    }

    if (patternSuggestions.length > 0) {
      suggestions[ps.pattern_id] = patternSuggestions;
    }
  }

  return suggestions;
}
