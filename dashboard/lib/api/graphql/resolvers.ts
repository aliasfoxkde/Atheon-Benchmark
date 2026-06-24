/**
 * GraphQL API Implementation for Atheon Benchmark
 * Provides a flexible query interface for benchmark data
 */

import { z } from 'zod';

// GraphQL Types
export const typeDefs = `
  scalar DateTime
  scalar JSON

  type Benchmark {
    id: ID!
    name: String!
    description: String
    status: BenchmarkStatus!
    config: JSON!
    results: [BenchmarkResult!]
    createdAt: DateTime!
    updatedAt: DateTime!
    organizationId: ID
  }

  type BenchmarkResult {
    id: ID!
    benchmarkId: ID!
    variant: String!
    model: String!
    metrics: Metrics!
    qualityScore: Float
    executionTimeMs: Int!
    tokensUsed: Int
    errors: [String!]
    createdAt: DateTime!
  }

  type Metrics {
    latencyMs: Int
    tokensPerSecond: Float
    firstTokenMs: Int
    totalTokens: Int
    promptTokens: Int
    completionTokens: Int
    success: Boolean!
    error: String
  }

  type Query {
    benchmark(id: ID!): Benchmark
    benchmarks(
      limit: Int = 50
      offset: Int = 0
      status: BenchmarkStatus
      organizationId: ID
    ): BenchmarkConnection!

    benchmarkResult(id: ID!): BenchmarkResult
    benchmarkResults(
      benchmarkId: ID!
      variant: String
    ): [BenchmarkResult!]!

    compareBenchmarks(ids: [ID!]!): ComparisonResult!

    health: HealthStatus!
  }

  type Mutation {
    createBenchmark(input: CreateBenchmarkInput!): Benchmark!
    updateBenchmark(id: ID!, input: UpdateBenchmarkInput!): Benchmark!
    deleteBenchmark(id: ID!): Boolean!

    runBenchmark(id: ID!): Benchmark!
    cancelBenchmark(id: ID!): Benchmark!

    createBenchmarkResult(input: CreateResultInput!): BenchmarkResult!
    deleteBenchmarkResult(id: ID!): Boolean!
  }

  input CreateBenchmarkInput {
    name: String!
    description: String
    config: JSON!
    organizationId: ID
  }

  input UpdateBenchmarkInput {
    name: String
    description: String
    config: JSON
  }

  input CreateResultInput {
    benchmarkId: ID!
    variant: String!
    model: String!
    metrics: MetricsInput!
    qualityScore: Float
    executionTimeMs: Int!
    tokensUsed: Int
    errors: [String!]
  }

  input MetricsInput {
    latencyMs: Int
    tokensPerSecond: Float
    firstTokenMs: Int
    totalTokens: Int
    promptTokens: Int
    completionTokens: Int
    success: Boolean!
    error: String
  }

  enum BenchmarkStatus {
    PENDING
    RUNNING
    COMPLETED
    FAILED
    CANCELLED
  }

  type BenchmarkConnection {
    items: [Benchmark!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  type ComparisonResult {
    benchmarks: [Benchmark!]!
    summary: ComparisonSummary!
  }

  type ComparisonSummary {
    totalBenchmarks: Int!
    avgQualityScore: Float
    avgExecutionTimeMs: Float
    bestModel: String
    fastestModel: String
  }

  type HealthStatus {
    status: String!
    version: String!
    timestamp: DateTime!
    dependencies: HealthDependencyStatus!
  }

  type HealthDependencyStatus {
    database: String!
    storage: String!
    cache: String!
  }
`;

// Zod Schemas for validation
export const CreateBenchmarkInputSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  config: z.record(z.any()),
  organizationId: z.string().optional(),
});

export const UpdateBenchmarkInputSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  config: z.record(z.any()).optional(),
});

export const CreateResultInputSchema = z.object({
  benchmarkId: z.string().min(1),
  variant: z.string().min(1),
  model: z.string().min(1),
  metrics: z.object({
    latencyMs: z.number().optional(),
    tokensPerSecond: z.number().optional(),
    firstTokenMs: z.number().optional(),
    totalTokens: z.number().optional(),
    promptTokens: z.number().optional(),
    completionTokens: z.number().optional(),
    success: z.boolean(),
    error: z.string().optional(),
  }),
  qualityScore: z.number().min(0).max(1).optional(),
  executionTimeMs: z.number().min(0),
  tokensUsed: z.number().optional(),
  errors: z.array(z.string()).optional(),
});

export const BenchmarkResultSchema = z.object({
  id: z.string(),
  benchmarkId: z.string(),
  variant: z.string(),
  model: z.string(),
  metrics: z.object({
    latencyMs: z.number().optional(),
    tokensPerSecond: z.number().optional(),
    firstTokenMs: z.number().optional(),
    totalTokens: z.number().optional(),
    promptTokens: z.number().optional(),
    completionTokens: z.number().optional(),
    success: z.boolean(),
    error: z.string().optional(),
  }),
  qualityScore: z.number().optional(),
  executionTimeMs: z.number(),
  tokensUsed: z.number().optional(),
  errors: z.array(z.string()).optional(),
  createdAt: z.date(),
});

// In-memory store for demo (replace with D1/KV in production)
const benchmarks = new Map<string, any>();
const results = new Map<string, any[]>();

// Resolver implementations
export const resolvers = {
  Query: {
    benchmark: (_: any, { id }: { id: string }) => {
      return benchmarks.get(id) || null;
    },

    benchmarks: (
      _: any,
      { limit = 50, offset = 0, status, organizationId }: any
    ) => {
      let items = Array.from(benchmarks.values());

      if (status) {
        items = items.filter((b) => b.status === status);
      }
      if (organizationId) {
        items = items.filter((b) => b.organizationId === organizationId);
      }

      // Sort by createdAt descending
      items.sort((a, b) => b.createdAt - a.createdAt);

      const totalCount = items.length;
      const paginatedItems = items.slice(offset, offset + limit);

      return {
        items: paginatedItems,
        totalCount,
        hasMore: offset + limit < totalCount,
      };
    },

    benchmarkResult: (_: any, { id }: { id: string }) => {
      for (const resultList of results.values()) {
        const found = resultList.find((r) => r.id === id);
        if (found) return found;
      }
      return null;
    },

    benchmarkResults: (_: any, { benchmarkId, variant }: any) => {
      const resultList = results.get(benchmarkId) || [];
      if (variant) {
        return resultList.filter((r) => r.variant === variant);
      }
      return resultList;
    },

    compareBenchmarks: (_: any, { ids }: { ids: string[] }) => {
      const benchmarkList = ids.map((id) => benchmarks.get(id)).filter(Boolean);
      const allResults = benchmarkList.flatMap((b) => results.get(b.id) || []);

      const avgQualityScore =
        allResults.reduce((sum, r) => sum + (r.qualityScore || 0), 0) /
        (allResults.length || 1);

      const avgExecutionTimeMs =
        allResults.reduce((sum, r) => sum + r.executionTimeMs, 0) /
        (allResults.length || 1);

      const modelTimes: Record<string, number[]> = {};
      allResults.forEach((r) => {
        if (!modelTimes[r.model]) modelTimes[r.model] = [];
        modelTimes[r.model].push(r.executionTimeMs);
      });

      const modelAvgs = Object.entries(modelTimes).map(([model, times]) => ({
        model,
        avg: times.reduce((a, b) => a + b, 0) / times.length,
      }));

      const fastestModel = modelAvgs.sort((a, b) => a.avg - b.avg)[0]?.model;

      return {
        benchmarks: benchmarkList,
        summary: {
          totalBenchmarks: benchmarkList.length,
          avgQualityScore,
          avgExecutionTimeMs,
          bestModel: allResults.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))[0]
            ?.model,
          fastestModel,
        },
      };
    },

    health: () => ({
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date(),
      dependencies: {
        database: 'healthy',
        storage: 'healthy',
        cache: 'healthy',
      },
    }),
  },

  Mutation: {
    createBenchmark: (_: any, { input }: { input: any }) => {
      const validated = CreateBenchmarkInputSchema.parse(input);
      const id = `bench_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const benchmark = {
        id,
        ...validated,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      };

      benchmarks.set(id, benchmark);
      results.set(id, []);

      return benchmark;
    },

    updateBenchmark: (_: any, { id, input }: { id: string; input: any }) => {
      const validated = UpdateBenchmarkInputSchema.parse(input);
      const existing = benchmarks.get(id);

      if (!existing) {
        throw new Error(`Benchmark ${id} not found`);
      }

      const updated = {
        ...existing,
        ...validated,
        updatedAt: new Date(),
      };

      benchmarks.set(id, updated);
      return updated;
    },

    deleteBenchmark: (_: any, { id }: { id: string }) => {
      benchmarks.delete(id);
      results.delete(id);
      return true;
    },

    runBenchmark: (_: any, { id }: { id: string }) => {
      const benchmark = benchmarks.get(id);
      if (!benchmark) {
        throw new Error(`Benchmark ${id} not found`);
      }

      benchmark.status = 'RUNNING';
      benchmark.updatedAt = new Date();
      benchmarks.set(id, benchmark);

      return benchmark;
    },

    cancelBenchmark: (_: any, { id }: { id: string }) => {
      const benchmark = benchmarks.get(id);
      if (!benchmark) {
        throw new Error(`Benchmark ${id} not found`);
      }

      benchmark.status = 'CANCELLED';
      benchmark.updatedAt = new Date();
      benchmarks.set(id, benchmark);

      return benchmark;
    },

    createBenchmarkResult: (_: any, { input }: { input: any }) => {
      const validated = CreateResultInputSchema.parse(input);
      const id = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const result = {
        id,
        ...validated,
        createdAt: new Date(),
      };

      const existing = results.get(validated.benchmarkId) || [];
      existing.push(result);
      results.set(validated.benchmarkId, existing);

      // Update benchmark status
      const benchmark = benchmarks.get(validated.benchmarkId);
      if (benchmark) {
        benchmark.status = 'COMPLETED';
        benchmark.updatedAt = new Date();
        benchmarks.set(benchmark.id, benchmark);
      }

      return result;
    },

    deleteBenchmarkResult: (_: any, { id }: { id: string }) => {
      for (const [benchmarkId, resultList] of results.entries()) {
        const index = resultList.findIndex((r) => r.id === id);
        if (index !== -1) {
          resultList.splice(index, 1);
          results.set(benchmarkId, resultList);
          return true;
        }
      }
      return false;
    },
  },

  Benchmark: {
    results: (parent: any) => {
      return results.get(parent.id) || [];
    },
  },
};

// GraphQL Execution helper
export async function executeGraphQL(
  query: string,
  variables?: Record<string, any>
): Promise<any> {
  const { graphql } = await import('graphql');
  const { makeExecutableSchema } = await import('@graphql-tools/schema');

  // For demo purposes, using simple schema
  // In production, this would use the actual schema with D1/KV
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  return graphql({
    schema,
    source: query,
    variableValues: variables,
  });
}

// REST-to-GraphQL bridge for HTTP endpoints
export async function handleGraphQLRequest(request: Request): Promise<Response> {
  const body = await request.json();
  const { query, variables } = body;

  if (!query) {
    return new Response(JSON.stringify({ error: 'No query provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await executeGraphQL(query, variables);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ errors: [{ message: error.message }] }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}