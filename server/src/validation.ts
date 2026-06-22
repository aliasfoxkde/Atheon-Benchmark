/**
 * Zod schemas for API request validation
 */

import { z } from 'zod';

// Benchmark schemas
export const createBenchmarkSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  configuration_id: z.string().uuid().optional(),
  config: z.record(z.unknown()).optional(),
});

export type CreateBenchmarkInput = z.infer<typeof createBenchmarkSchema>;

// Configuration schemas
export const createConfigurationSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  config: z.record(z.unknown()),
  is_public: z.boolean().optional(),
});

export type CreateConfigurationInput = z.infer<typeof createConfigurationSchema>;

// Test case schemas
export const createTestCaseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  category: z.enum(['security', 'performance', 'reliability', 'accuracy', 'compliance']),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
  input_prompt: z.string().min(1).max(10000),
  expected_output: z.string().max(10000).optional(),
  validation_rules: z.record(z.unknown()).optional(),
});

export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>;

// Validate function helper
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(body);
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') };
    }
    return { success: false, error: 'Validation failed' };
  }
}
