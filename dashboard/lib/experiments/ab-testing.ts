/**
 * A/B Testing Framework
 * Framework for running experiments and comparing variant performance
 */

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived';

export interface ExperimentVariant {
  id: string;
  name: string;
  description?: string;
  weight: number; // 0-100, probability of being selected
  config: Record<string, any>;
  metrics: VariantMetrics;
}

export interface VariantMetrics {
  impressions: number;
  conversions: number;
  value: number;
}

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  status: ExperimentStatus;
  variants: ExperimentVariant[];
  targetMetric: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
  userId?: string;
  assignedAt: Date;
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  controlVariantId?: string;
  controlConversionRate?: number;
  treatmentConversionRate?: number;
  lift?: number;
  confidence: number;
  sampleSize: number;
  isSignificant: boolean;
  recommendation: 'implement' | 'reject' | 'continue';
}

const EXPERIMENT_STORAGE_KEY = 'atheon-experiments';
const ASSIGNMENT_STORAGE_KEY = 'atheon-experiment-assignments';

/**
 * A/B Testing Engine
 */
export class ABTestingEngine {
  private experiments: Map<string, Experiment> = new Map();
  private assignments: Map<string, ExperimentAssignment[]> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    const expStored = localStorage.getItem(EXPERIMENT_STORAGE_KEY);
    if (expStored) {
      try {
        const data = JSON.parse(expStored);
        Object.values(data).forEach((e: any) => {
          this.experiments.set(e.id, {
            ...e,
            startDate: e.startDate ? new Date(e.startDate) : undefined,
            endDate: e.endDate ? new Date(e.endDate) : undefined,
            createdAt: new Date(e.createdAt),
            updatedAt: new Date(e.updatedAt),
          });
        });
      } catch {
        console.error('[ABTesting] Failed to load experiments');
      }
    }

    const assignStored = localStorage.getItem(ASSIGNMENT_STORAGE_KEY);
    if (assignStored) {
      try {
        const data = JSON.parse(assignStored);
        Object.entries(data).forEach(([userId, assignments]) => {
          this.assignments.set(userId, (assignments as any[]).map((a: any) => ({
            ...a,
            assignedAt: new Date(a.assignedAt),
          })));
        });
      } catch {
        console.error('[ABTesting] Failed to load assignments');
      }
    }
  }

  private saveExperiments(): void {
    if (typeof window === 'undefined') return;

    const data: Record<string, Experiment> = {};
    this.experiments.forEach((exp, id) => {
      data[id] = exp;
    });
    localStorage.setItem(EXPERIMENT_STORAGE_KEY, JSON.stringify(data));
  }

  private saveAssignments(): void {
    if (typeof window === 'undefined') return;

    const data: Record<string, ExperimentAssignment[]> = {};
    this.assignments.forEach((assigns, userId) => {
      data[userId] = assigns;
    });
    localStorage.setItem(ASSIGNMENT_STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Create a new experiment
   */
  createExperiment(experiment: Omit<Experiment, 'createdAt' | 'updatedAt' | 'status'>): Experiment {
    const now = new Date();
    const newExp: Experiment = {
      ...experiment,
      id: experiment.id || `exp-${Date.now()}`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    // Normalize variant weights to sum to 100
    const totalWeight = newExp.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100 && totalWeight > 0) {
      newExp.variants.forEach(v => {
        v.weight = (v.weight / totalWeight) * 100;
      });
    }

    this.experiments.set(newExp.id, newExp);
    this.saveExperiments();
    return newExp;
  }

  /**
   * Start an experiment
   */
  startExperiment(id: string): boolean {
    const exp = this.experiments.get(id);
    if (!exp) return false;

    exp.status = 'running';
    exp.startDate = new Date();
    exp.updatedAt = new Date();
    this.saveExperiments();
    return true;
  }

  /**
   * Pause an experiment
   */
  pauseExperiment(id: string): boolean {
    const exp = this.experiments.get(id);
    if (!exp) return false;

    exp.status = 'paused';
    exp.updatedAt = new Date();
    this.saveExperiments();
    return true;
  }

  /**
   * Complete an experiment
   */
  completeExperiment(id: string): boolean {
    const exp = this.experiments.get(id);
    if (!exp) return false;

    exp.status = 'completed';
    exp.endDate = new Date();
    exp.updatedAt = new Date();
    this.saveExperiments();
    return true;
  }

  /**
   * Get active experiments
   */
  getActiveExperiments(): Experiment[] {
    return Array.from(this.experiments.values()).filter(e => e.status === 'running');
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Get experiment by ID
   */
  getExperiment(id: string): Experiment | undefined {
    return this.experiments.get(id);
  }

  /**
   * Assign user to experiment variant
   */
  assignVariant(experimentId: string, userId: string): ExperimentAssignment | null {
    const exp = this.experiments.get(experimentId);
    if (!exp || exp.status !== 'running') return null;

    // Check if user already has assignment
    const existing = this.getAssignment(experimentId, userId);
    if (existing) return existing;

    // Select variant based on weights
    const random = Math.random() * 100;
    let cumulative = 0;
    let selectedVariant = exp.variants[0];

    for (const variant of exp.variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        selectedVariant = variant;
        break;
      }
    }

    const assignment: ExperimentAssignment = {
      experimentId,
      variantId: selectedVariant.id,
      userId,
      assignedAt: new Date(),
    };

    // Store assignment
    const userAssignments = this.assignments.get(userId) || [];
    userAssignments.push(assignment);
    this.assignments.set(userId, userAssignments);
    this.saveAssignments();

    // Increment impression
    selectedVariant.metrics.impressions++;

    return assignment;
  }

  /**
   * Get user's assignment for an experiment
   */
  getAssignment(experimentId: string, userId: string): ExperimentAssignment | undefined {
    const userAssignments = this.assignments.get(userId);
    return userAssignments?.find(a => a.experimentId === experimentId);
  }

  /**
   * Record a conversion event
   */
  recordConversion(experimentId: string, variantId: string, value: number = 1): boolean {
    const exp = this.experiments.get(experimentId);
    if (!exp) return false;

    const variant = exp.variants.find(v => v.id === variantId);
    if (!variant) return false;

    variant.metrics.conversions++;
    variant.metrics.value += value;
    exp.updatedAt = new Date();
    this.saveExperiments();
    return true;
  }

  /**
   * Calculate experiment results
   */
  calculateResults(experimentId: string): ExperimentResult | null {
    const exp = this.experiments.get(experimentId);
    if (!exp || exp.status !== 'completed') return null;

    const control = exp.variants[0];
    if (!control) return null;

    const controlRate = control.metrics.impressions > 0
      ? control.metrics.conversions / control.metrics.impressions
      : 0;

    const results: ExperimentResult[] = [];

    exp.variants.slice(1).forEach(variant => {
      const treatmentRate = variant.metrics.impressions > 0
        ? variant.metrics.conversions / variant.metrics.impressions
        : 0;

      const lift = controlRate > 0
        ? ((treatmentRate - controlRate) / controlRate) * 100
        : 0;

      // Calculate statistical significance using z-test approximation
      const n1 = control.metrics.impressions;
      const n2 = variant.metrics.impressions;
      const p1 = controlRate;
      const p2 = treatmentRate;

      const pooledP = (control.metrics.conversions + variant.metrics.conversions) /
        (n1 + n2);
      const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
      const z = se > 0 ? (p2 - p1) / se : 0;

      // Approximate confidence (simplified)
      const confidence = Math.min(99.9, Math.abs(z) * 30);
      const isSignificant = confidence >= 95 && Math.abs(lift) > 5;

      results.push({
        experimentId,
        variantId: variant.id,
        controlVariantId: control.id,
        controlConversionRate: controlRate * 100,
        treatmentConversionRate: treatmentRate * 100,
        lift,
        confidence,
        sampleSize: n1 + n2,
        isSignificant,
        recommendation: isSignificant
          ? lift > 0 ? 'implement' : 'reject'
          : 'continue',
      });
    });

    return results[0] || null;
  }

  /**
   * Delete experiment
   */
  deleteExperiment(id: string): boolean {
    return this.experiments.delete(id);
  }
}

// Singleton
let abTesting: ABTestingEngine | null = null;

export function getABTesting(): ABTestingEngine {
  if (!abTesting) {
    abTesting = new ABTestingEngine();
  }
  return abTesting;
}

/**
 * Example: Create benchmark comparison experiment
 */
export function createBenchmarkComparisonExperiment(
  name: string,
  controlConfig: Record<string, any>,
  treatmentConfig: Record<string, any>
): Experiment {
  return getABTesting().createExperiment({
    name,
    description: 'Compare benchmark performance between two configurations',
    variants: [
      {
        id: 'control',
        name: 'Control',
        description: 'Baseline configuration',
        weight: 50,
        config: controlConfig,
        metrics: { impressions: 0, conversions: 0, value: 0 },
      },
      {
        id: 'treatment',
        name: 'Treatment',
        description: 'New configuration',
        weight: 50,
        config: treatmentConfig,
        metrics: { impressions: 0, conversions: 0, value: 0 },
      },
    ],
    targetMetric: 'pass_rate',
    metadata: {
      type: 'benchmark_comparison',
    },
  });
}