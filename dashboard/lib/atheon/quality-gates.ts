/**
 * Atheon Quality Gates Integration
 * This module integrates Atheon pattern matching for quality gates and validation
 */

import {
  AtheonFinding,
  AtheonPattern,
  ATHEON_PATTERNS,
  ATHEON_CATEGORIES,
} from '../claude/atheon-integration';

export interface QualityGateConfig {
  enabled: boolean;
  strict: boolean;
  categories?: string[];
  severity?: ('critical' | 'high' | 'medium' | 'low')[];
  allowed_findings?: number;
  timeout_ms?: number;
}

export interface QualityGateResult {
  passed: boolean;
  findings: AtheonFinding[];
  summary: FindingSummary;
  violations: Violation[];
  timestamp: Date;
  execution_time_ms: number;
}

export interface FindingSummary {
  total: number;
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
}

export interface Violation {
  rule: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  location: {
    file?: string;
    line?: number;
    column?: number;
  };
}

export interface AtheonValidationRule {
  id: string;
  name: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  pattern: RegExp;
  message: string;
  enabled: boolean;
}

/**
 * Atheon Quality Gates Manager
 */
export class AtheonQualityGates {
  private config: QualityGateConfig;
  private patterns: Map<string, AtheonValidationRule>;
  private scanHistory: Map<string, QualityGateResult> = new Map();

  constructor(config: Partial<QualityGateConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      strict: config.strict ?? false,
      categories: config.categories || [...ATHEON_CATEGORIES] as string[],
      severity: config.severity || ['critical', 'high', 'medium'],
      allowed_findings: config.allowed_findings ?? 5,
      timeout_ms: config.timeout_ms ?? 10000,
    };

    this.patterns = this.initializePatterns();
  }

  /**
   * Initialize validation rules from Atheon patterns
   */
  private initializePatterns(): Map<string, AtheonValidationRule> {
    const rules = new Map<string, AtheonValidationRule>();

    for (const atheonPattern of ATHEON_PATTERNS) {
      const rule: AtheonValidationRule = {
        id: atheonPattern.name,
        name: atheonPattern.name,
        category: atheonPattern.category,
        severity: atheonPattern.severity,
        pattern: new RegExp(atheonPattern.pattern, 'gi'),
        message: atheonPattern.description,
        enabled: this.isPatternEnabled(atheonPattern),
      };

      rules.set(atheonPattern.name, rule);
    }

    return rules;
  }

  /**
   * Check if a pattern should be enabled based on configuration
   */
  private isPatternEnabled(pattern: AtheonPattern): boolean {
    // Check if category is enabled
    if (this.config.categories && !this.config.categories.includes(pattern.category)) {
      return false;
    }

    // Check if severity is enabled
    if (this.config.severity && !this.config.severity.includes(pattern.severity)) {
      return false;
    }

    return true;
  }

  /**
   * Scan text with quality gates
   */
  async scan(content: string, metadata?: Record<string, any>): Promise<QualityGateResult> {
    const startTime = Date.now();

    try {
      // Enforce timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Quality gate scan timeout')), this.config.timeout_ms)
      );

      const scanPromise = this.performScan(content, metadata);

      const findings = await Promise.race([scanPromise, timeoutPromise]);

      const summary = this.generateSummary(findings);
      const violations = this.generateViolations(findings);
      const passed = this.evaluateQualityGates(summary);

      const result: QualityGateResult = {
        passed,
        findings,
        summary,
        violations,
        timestamp: new Date(),
        execution_time_ms: Date.now() - startTime,
      };

      // Store in history
      const scanId = metadata?.id || `scan-${Date.now()}`;
      this.scanHistory.set(scanId, result);

      return result;

    } catch (error) {
      throw new Error(`Quality gate scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform the actual scan
   */
  private async performScan(content: string, metadata?: Record<string, any>): Promise<AtheonFinding[]> {
    const findings: AtheonFinding[] = [];
    const lines = content.split('\n');

    // Scan each line
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];

      // Check each enabled pattern
      for (const [patternName, rule] of this.patterns.entries()) {
        if (!rule.enabled) continue;

        // Reset regex for each line
        rule.pattern.lastIndex = 0;

        let match;
        while ((match = rule.pattern.exec(line)) !== null) {
          findings.push({
            pattern: rule.id,
            category: rule.category,
            severity: rule.severity,
            line: lineNum + 1,
            column: match.index + 1,
            message: rule.message,
            matchedText: match[0],
          });
        }
      }
    }

    return findings;
  }

  /**
   * Generate summary of findings
   */
  private generateSummary(findings: AtheonFinding[]): FindingSummary {
    const summary: FindingSummary = {
      total: findings.length,
      by_category: {} as Record<string, number>,
      by_severity: {} as Record<string, number>,
      critical_count: 0,
      high_count: 0,
      medium_count: 0,
      low_count: 0,
    };

    for (const finding of findings) {
      // Count by category
      summary.by_category[finding.category] = (summary.by_category[finding.category] || 0) + 1;

      // Count by severity
      summary.by_severity[finding.severity] = (summary.by_severity[finding.severity] || 0) + 1;

      // Count severity levels
      switch (finding.severity) {
        case 'critical':
          summary.critical_count++;
          break;
        case 'high':
          summary.high_count++;
          break;
        case 'medium':
          summary.medium_count++;
          break;
        case 'low':
          summary.low_count++;
          break;
      }
    }

    return summary;
  }

  /**
   * Generate violations from findings
   */
  private generateViolations(findings: AtheonFinding[]): Violation[] {
    return findings.map(finding => ({
      rule: finding.pattern,
      severity: finding.severity,
      message: finding.message,
      location: {
        line: finding.line,
        column: finding.column,
      },
    }));
  }

  /**
   * Evaluate if quality gates pass
   */
  private evaluateQualityGates(summary: FindingSummary): boolean {
    if (!this.config.enabled) return true;

    if (this.config.strict) {
      // Strict mode: no findings allowed
      return summary.total === 0;
    } else {
      // Lenient mode: allowed number of findings
      return summary.total <= (this.config.allowed_findings || 5);
    }
  }

  /**
   * Scan multiple files
   */
  async scanMultiple(files: Map<string, string>): Promise<Map<string, QualityGateResult>> {
    const results = new Map<string, QualityGateResult>();

    for (const [fileName, content] of files.entries()) {
      try {
        const result = await this.scan(content, { id: fileName, file: fileName });
        results.set(fileName, result);
      } catch (error) {
        console.error(`Failed to scan file ${fileName}:`, error);
      }
    }

    return results;
  }

  /**
   * Get scan history
   */
  getScanHistory(id?: string): QualityGateResult | Map<string, QualityGateResult> {
    if (id) {
      const result = this.scanHistory.get(id);
      if (!result) {
        throw new Error(`Scan history not found for ID: ${id}`);
      }
      return result;
    }
    return new Map(this.scanHistory);
  }

  /**
   * Clear scan history
   */
  clearScanHistory(id?: string): void {
    if (id) {
      this.scanHistory.delete(id);
    } else {
      this.scanHistory.clear();
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<QualityGateConfig>): void {
    this.config = { ...this.config, ...updates };

    // Reinitialize patterns with new configuration
    this.patterns = this.initializePatterns();
  }

  /**
   * Get current configuration
   */
  getConfig(): QualityGateConfig {
    return { ...this.config };
  }

  /**
   * Enable/disable specific patterns
   */
  setPatternEnabled(patternName: string, enabled: boolean): void {
    const rule = this.patterns.get(patternName);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Get all patterns
   */
  getPatterns(): AtheonValidationRule[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get patterns by category
   */
  getPatternsByCategory(category: string): AtheonValidationRule[] {
    return Array.from(this.patterns.values()).filter(p => p.category === category);
  }

  /**
   * Get patterns by severity
   */
  getPatternsBySeverity(severity: 'critical' | 'high' | 'medium' | 'low'): AtheonValidationRule[] {
    return Array.from(this.patterns.values()).filter(p => p.severity === severity);
  }

  /**
   * Generate quality gate report
   */
  generateReport(): string {
    const report: string[] = [];
    report.push('=== Atheon Quality Gates Report ===');
    report.push(`Generated at: ${new Date().toISOString()}`);
    report.push('');

    report.push('Configuration:');
    report.push(`  Enabled: ${this.config.enabled}`);
    report.push(`  Strict Mode: ${this.config.strict}`);
    report.push(`  Categories: ${this.config.categories?.join(', ') || 'All'}`);
    report.push(`  Severity Levels: ${this.config.severity?.join(', ') || 'All'}`);
    report.push(`  Allowed Findings: ${this.config.allowed_findings}`);
    report.push('');

    report.push('Available Patterns:');
    for (const category of ATHEON_CATEGORIES) {
      const patterns = this.getPatternsByCategory(category as string);
      report.push(`  ${category}: ${patterns.length} patterns`);
    }
    report.push('');

    if (this.scanHistory.size > 0) {
      report.push('Recent Scans:');
      for (const [id, result] of this.scanHistory.entries()) {
        report.push(`  ${id}:`);
        report.push(`    Passed: ${result.passed}`);
        report.push(`    Findings: ${result.summary.total}`);
        report.push(`    Critical: ${result.summary.critical_count}`);
        report.push(`    High: ${result.summary.high_count}`);
        report.push(`    Medium: ${result.summary.medium_count}`);
        report.push(`    Low: ${result.summary.low_count}`);
        report.push(`    Execution Time: ${result.execution_time_ms}ms`);
        report.push('');
      }
    }

    return report.join('\n');
  }

  /**
   * Export quality gate results as JSON
   */
  exportResults(scanId?: string): string {
    if (scanId) {
      const result = this.scanHistory.get(scanId);
      return result ? JSON.stringify(result, null, 2) : '{}';
    }

    return JSON.stringify(Object.fromEntries(this.scanHistory), null, 2);
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    total_scans: number;
    passed_scans: number;
    failed_scans: number;
    pass_rate: number;
    avg_findings_per_scan: number;
    total_findings: number;
  } {
    const results = Array.from(this.scanHistory.values());
    const totalScans = results.length;
    const passedScans = results.filter(r => r.passed).length;
    const failedScans = totalScans - passedScans;
    const totalFindings = results.reduce((sum, r) => sum + r.summary.total, 0);

    return {
      total_scans: totalScans,
      passed_scans: passedScans,
      failed_scans: failedScans,
      pass_rate: totalScans > 0 ? (passedScans / totalScans) * 100 : 0,
      avg_findings_per_scan: totalScans > 0 ? totalFindings / totalScans : 0,
      total_findings: totalFindings,
    };
  }
}

/**
 * Factory function to create quality gate managers
 */
export function createQualityGates(config?: Partial<QualityGateConfig>): AtheonQualityGates {
  return new AtheonQualityGates(config);
}

/**
 * Default quality gate configuration
 */
export const DEFAULT_QUALITY_GATE_CONFIG: QualityGateConfig = {
  enabled: true,
  strict: false,
  categories: ['secrets', 'code-quality', 'security'],
  severity: ['critical', 'high', 'medium'],
  allowed_findings: 5,
  timeout_ms: 10000,
};

/**
 * Predefined quality gate configurations
 */
export const QUALITY_GATE_PRESETS: Record<string, Partial<QualityGateConfig>> = {
  'strict-security': {
    enabled: true,
    strict: true,
    categories: ['secrets', 'security'],
    severity: ['critical', 'high'],
    allowed_findings: 0,
  },
  'code-quality': {
    enabled: true,
    strict: false,
    categories: ['code-quality'],
    severity: ['critical', 'high', 'medium'],
    allowed_findings: 10,
  },
  'comprehensive': {
    enabled: true,
    strict: false,
    categories: ['secrets', 'code-quality', 'security', 'devops'],
    severity: ['critical', 'high', 'medium', 'low'],
    allowed_findings: 20,
  },
  'development': {
    enabled: true,
    strict: false,
    categories: ['code-quality'],
    severity: ['high', 'medium'],
    allowed_findings: 50,
  },
};