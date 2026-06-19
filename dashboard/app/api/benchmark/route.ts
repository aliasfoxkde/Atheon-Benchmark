/**
 * Benchmark Execution API Endpoint
 * Working implementation for benchmark execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { benchmarkRunner } from '@/lib/benchmark/runner';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface BenchmarkRequest {
  name: string;
  scenario: string;
  config: {
    model?: string;
    timeout?: number;
    parallel_tests?: number;
    test_cases?: number;
  };
}

// In-memory storage for benchmarks
const benchmarks = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const body: BenchmarkRequest = await request.json();
    const { name, scenario, config } = body;

    if (!name || !scenario) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name and scenario are required',
      }, { status: 400 });
    }

    // Create benchmark execution
    const benchmarkId = `bench-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const benchmark = {
      id: benchmarkId,
      name,
      scenario,
      status: 'running',
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      progress: 0,
      total_tests: config.test_cases || 10,
      completed_tests: 0,
      results: [],
      errors: [],
    };

    benchmarks.set(benchmarkId, benchmark);

    // Start benchmark execution asynchronously
    executeBenchmark(benchmarkId, name, scenario, config);

    return NextResponse.json({
      success: true,
      benchmark_id: benchmarkId,
      message: 'Benchmark started successfully',
      benchmark,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start benchmark',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const benchmarkId = searchParams.get('id');

  if (benchmarkId) {
    const benchmark = benchmarks.get(benchmarkId);
    if (!benchmark) {
      return NextResponse.json({
        success: false,
        error: 'Benchmark not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      benchmark,
    });
  }

  // Return all benchmarks
  return NextResponse.json({
    success: true,
    benchmarks: Array.from(benchmarks.values()),
  });
}

async function executeBenchmark(
  benchmarkId: string,
  name: string,
  scenario: string,
  config: any
): Promise<void> {
  try {
    const benchmark = benchmarks.get(benchmarkId);
    if (!benchmark) return;

    // Run the benchmark
    const result = await benchmarkRunner.runBenchmark({
      name,
      scenario,
      testCases: config.test_cases || 10,
    });

    // Update benchmark with results
    benchmark.status = result.status;
    benchmark.completed_at = new Date().toISOString();
    benchmark.progress = 100;
    benchmark.completed_tests = result.summary.total_tests;
    benchmark.results = result.results;
    benchmark.summary = result.summary;

    if (result.errors.length > 0) {
      benchmark.errors = result.errors;
    }

    benchmarks.set(benchmarkId, benchmark);

  } catch (error) {
    const benchmark = benchmarks.get(benchmarkId);
    if (!benchmark) return;

    benchmark.status = 'failed';
    benchmark.completed_at = new Date().toISOString();
    benchmark.errors.push(error instanceof Error ? error.message : 'Unknown error');

    benchmarks.set(benchmarkId, benchmark);
  }
}