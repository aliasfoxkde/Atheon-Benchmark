/**
 * Atheon Validation Utilities
 * Additional validation utilities for code quality and security
 */

import { AtheonFinding } from '../claude/atheon-integration';
import { QualityGateResult } from './quality-gates';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  score: number; // 0-100
  metadata: Record<string, any>;
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  location?: {
    file?: string;
    line?: number;
    column?: number;
  };
  suggestion?: string;
}

export interface AtheonContentValidationRule {
  id: string;
  name: string;
  category: string;
  severity: 'error' | 'warning' | 'info';
  check: (content: string) => boolean;
  message: string;
  suggestion?: string;
  enabled: boolean;
}

/**
 * Atheon Validation Manager
 */
export class AtheonValidation {
  private rules: Map<string, AtheonContentValidationRule> = new Map();

  constructor() {
    this.initializeRules();
  }

  /**
   * Initialize validation rules
   */
  private initializeRules(): void {
    // Security validation rules
    this.addRule({
      id: 'no-hardcoded-secrets',
      name: 'No Hardcoded Secrets',
      category: 'security',
      severity: 'error',
      check: (content: string) => !/(API_KEY|SECRET|PASSWORD|TOKEN)\s*[=:]\s*["\']?[a-zA-Z0-9]{16,}/i.test(content),
      message: 'Potential hardcoded secrets detected',
      suggestion: 'Use environment variables or secure credential management',
    });

    this.addRule({
      id: 'no-sql-injection',
      name: 'No SQL Injection',
      category: 'security',
      severity: 'error',
      check: (content: string) => !/(execute|query)\s*\(\s*["\'].*\$\{.*\}.*"\]/.test(content),
      message: 'Potential SQL injection vulnerability',
      suggestion: 'Use parameterized queries or prepared statements',
    });

    this.addRule({
      id: 'no-xss-vulnerability',
      name: 'No XSS Vulnerability',
      category: 'security',
      severity: 'error',
      check: (content: string) => !/(innerHTML|dangerouslySetInnerHTML)\s*=.*\+/.test(content),
      message: 'Potential XSS vulnerability',
      suggestion: 'Use proper sanitization and DOMPurify',
    });

    // Code quality rules
    this.addRule({
      id: 'no-console-log',
      name: 'No Console Log',
      category: 'code-quality',
      severity: 'warning',
      check: (content: string) => !/console\.log\(/.test(content),
      message: 'Console.log statements should be removed',
      suggestion: 'Use proper logging framework',
    });

    this.addRule({
      id: 'no-debugger',
      name: 'No Debugger',
      category: 'code-quality',
      severity: 'warning',
      check: (content: string) => !/\bdebugger\b/.test(content),
      message: 'Debugger statement detected',
      suggestion: 'Remove debugger statements before production',
    });

    this.addRule({
      id: 'no-todo-comments',
      name: 'No TODO Comments',
      category: 'code-quality',
      severity: 'info',
      check: (content: string) => !/\bTODO\b/i.test(content),
      message: 'TODO comments detected',
      suggestion: 'Track tasks in project management system',
    });

    // Performance rules
    this.addRule({
      id: 'no-sync-operations',
      name: 'No Synchronous Operations',
      category: 'performance',
      severity: 'warning',
      check: (content: string) => !/\.(readFileSync|writeFileSync|execSync)\(/.test(content),
      message: 'Synchronous file operations detected',
      suggestion: 'Use async operations for better performance',
    });

    // Best practices rules
    this.addRule({
      id: 'use-const-let',
      name: 'Use const/let',
      category: 'best-practices',
      severity: 'info',
      check: (content: string) => !/\bvar\s+/.test(content),
      message: 'var usage detected',
      suggestion: 'Use const or let instead of var',
    });

    this.addRule({
      id: 'handle-errors',
      name: 'Handle Errors',
      category: 'best-practices',
      severity: 'warning',
      check: (content: string) => {
        const functionCount = (content.match(/\b(function|=>|\s+\w+\s*\()/g) || []).length;
        const tryCount = (content.match(/\btry\s*\{/g) || []).length;
        return functionCount <= 10 || tryCount > 0;
      },
      message: 'Missing error handling',
      suggestion: 'Add try-catch blocks for error handling',
    });
  }

  /**
   * Add custom validation rule
   */
  addRule(rule: Omit<AtheonContentValidationRule, 'enabled'>): void {
    this.rules.set(rule.id, { ...rule, enabled: true });
  }

  /**
   * Remove validation rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Enable/disable rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Validate content
   */
  validate(content: string, metadata?: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    for (const [ruleId, rule] of this.rules.entries()) {
      if (!rule.enabled) continue;

      try {
        const passed = rule.check(content);
        if (!passed) {
          const error: ValidationError = {
            code: ruleId,
            message: rule.message,
            severity: rule.severity,
            suggestion: rule.suggestion,
          };

          switch (rule.severity) {
            case 'error':
              errors.push(error);
              break;
            case 'warning':
              warnings.push(error);
              break;
            case 'info':
              warnings.push(error);
              break;
          }
        }
      } catch (error) {
        console.error(`Validation rule ${ruleId} failed:`, error);
      }
    }

    const score = this.calculateScore(errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score,
      metadata: metadata || {},
    };
  }

  /**
   * Validate multiple files
   */
  validateMultiple(files: Map<string, string>): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();

    for (const [fileName, content] of files.entries()) {
      try {
        const result = this.validate(content, { file: fileName });
        results.set(fileName, result);
      } catch (error) {
        console.error(`Failed to validate file ${fileName}:`, error);
      }
    }

    return results;
  }

  /**
   * Calculate validation score
   */
  private calculateScore(errors: ValidationError[], warnings: ValidationError[]): number {
    const errorWeight = 10;
    const warningWeight = 2;

    const penalty = (errors.length * errorWeight) + (warnings.length * warningWeight);
    const score = Math.max(0, 100 - penalty);

    return score;
  }

  /**
   * Get validation statistics
   */
  getStatistics(results: ValidationResult[]): {
    total: number;
    valid: number;
    invalid: number;
    avg_score: number;
    total_errors: number;
    total_warnings: number;
  } {
    const total = results.length;
    const valid = results.filter(r => r.valid).length;
    const invalid = total - valid;
    const avgScore = total > 0
      ? results.reduce((sum, r) => sum + r.score, 0) / total
      : 0;
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    return {
      total,
      valid,
      invalid,
      avg_score: avgScore,
      total_errors: totalErrors,
      total_warnings: totalWarnings,
    };
  }

  /**
   * Get all rules
   */
  getRules(): AtheonContentValidationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: string): AtheonContentValidationRule[] {
    return Array.from(this.rules.values()).filter(r => r.category === category);
  }

  /**
   * Get categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    for (const rule of this.rules.values()) {
      categories.add(rule.category);
    }
    return Array.from(categories);
  }

  /**
   * Combine quality gate results with validation
   */
  combineWithQualityGates(
    validation: ValidationResult,
    qualityGate: QualityGateResult
  ): ValidationResult {
    const combinedErrors = [...validation.errors];
    const combinedWarnings = [...validation.warnings];

    // Convert quality gate findings to validation errors
    for (const finding of qualityGate.findings) {
      if (finding.severity === 'critical' || finding.severity === 'high') {
        combinedErrors.push({
          code: finding.pattern,
          message: finding.message,
          severity: 'error',
          location: {
            line: finding.line,
            column: finding.column,
          },
        });
      } else {
        combinedWarnings.push({
          code: finding.pattern,
          message: finding.message,
          severity: 'warning',
          location: {
            line: finding.line,
            column: finding.column,
          },
        });
      }
    }

    const score = this.calculateScore(combinedErrors, combinedWarnings);

    return {
      valid: combinedErrors.length === 0 && qualityGate.passed,
      errors: combinedErrors,
      warnings: combinedWarnings,
      score,
      metadata: {
        ...validation.metadata,
        quality_gate_passed: qualityGate.passed,
        quality_gate_findings: qualityGate.summary.total,
      },
    };
  }

  /**
   * Generate validation report
   */
  generateReport(results: Map<string, ValidationResult>): string {
    const report: string[] = [];
    const stats = this.getStatistics(Array.from(results.values()));

    report.push('=== Atheon Validation Report ===');
    report.push(`Generated at: ${new Date().toISOString()}`);
    report.push('');

    report.push('Summary:');
    report.push(`  Total Files: ${stats.total}`);
    report.push(`  Valid: ${stats.valid}`);
    report.push(`  Invalid: ${stats.invalid}`);
    report.push(`  Average Score: ${stats.avg_score.toFixed(1)}/100`);
    report.push(`  Total Errors: ${stats.total_errors}`);
    report.push(`  Total Warnings: ${stats.total_warnings}`);
    report.push('');

    report.push('Files with Issues:');
    for (const [fileName, result] of results.entries()) {
      if (!result.valid || result.errors.length > 0 || result.warnings.length > 0) {
        report.push(`  ${fileName}:`);
        report.push(`    Score: ${result.score}/100`);
        report.push(`    Valid: ${result.valid}`);
        report.push(`    Errors: ${result.errors.length}`);
        report.push(`    Warnings: ${result.warnings.length}`);

        if (result.errors.length > 0) {
          report.push('    Errors:');
          for (const error of result.errors) {
            report.push(`      - ${error.code}: ${error.message}`);
            if (error.suggestion) {
              report.push(`        Suggestion: ${error.suggestion}`);
            }
          }
        }

        if (result.warnings.length > 0) {
          report.push('    Warnings:');
          for (const warning of result.warnings) {
            report.push(`      - ${warning.code}: ${warning.message}`);
          }
        }

        report.push('');
      }
    }

    return report.join('\n');
  }
}

/**
 * Factory function to create validation managers
 */
export function createAtheonValidation(): AtheonValidation {
  return new AtheonValidation();
}

/**
 * Default validation categories
 */
export const VALIDATION_CATEGORIES = [
  'security',
  'code-quality',
  'performance',
  'best-practices',
] as const;

/**
 * Validation presets
 */
export const VALIDATION_PRESETS: Record<string, string[]> = {
  'strict': ['no-hardcoded-secrets', 'no-sql-injection', 'no-xss-vulnerability'],
  'code-quality': ['no-console-log', 'no-debugger', 'use-const-let'],
  'comprehensive': [...VALIDATION_CATEGORIES],
};