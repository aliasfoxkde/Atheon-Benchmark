// Experiments Module - A/B testing framework
export { ABTestingEngine, getABTesting, createBenchmarkComparisonExperiment } from './ab-testing';
export type {
  ExperimentStatus,
  ExperimentVariant,
  VariantMetrics,
  Experiment,
  ExperimentAssignment,
  ExperimentResult,
} from './ab-testing';
