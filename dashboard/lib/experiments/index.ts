/**
 * Experiments Module - A/B testing framework
 * @description Framework for running benchmark comparison experiments
 */
export { ABTestingEngine, getABTesting, createBenchmarkComparisonExperiment } from './ab-testing';
export type {
  ExperimentStatus,
  ExperimentVariant,
  VariantMetrics,
  Experiment,
  ExperimentAssignment,
  ExperimentResult,
} from './ab-testing';
