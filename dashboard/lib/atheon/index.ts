/**
 * Atheon Integration - Main Export
 * This module exports all Atheon quality gates and validation functionality
 */

export {
  AtheonQualityGates,
  createQualityGates,
  DEFAULT_QUALITY_GATE_CONFIG,
  QUALITY_GATE_PRESETS,
  type QualityGateConfig,
  type QualityGateResult,
  type FindingSummary,
  type Violation,
  type AtheonValidationRule,
} from './quality-gates';

export {
  AtheonValidation,
  createAtheonValidation,
  VALIDATION_CATEGORIES,
  VALIDATION_PRESETS,
  type ValidationResult,
  type ValidationError,
  type AtheonContentValidationRule,
} from './validation';

// Re-export types from Claude integration for convenience
export {
  ATHEON_PATTERNS,
  ATHEON_CATEGORIES,
  DEFAULT_ATHEON_CONFIG,
  type AtheonPattern,
  type AtheonFinding,
} from '../claude/atheon-integration';