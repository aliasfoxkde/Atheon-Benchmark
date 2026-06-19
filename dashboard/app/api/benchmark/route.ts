/**
 * Benchmark Execution API Endpoint
 * Working implementation for benchmark execution with database persistence and security
 */

import { NextRequest, NextResponse } from 'next/server';
import { benchmarkRunner } from '@/lib/benchmark/runner';
import { createDatabase } from '@/lib/storage/database';
import { createSecurityManager, DEFAULT_SECURITY_CONFIG } from '@/lib/security/auth';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Initialize services
const db = createDatabase();
const security = createSecurityManager(DEFAULT_SECURITY_CONFIG);

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

export async function POST(request: NextRequest) {
  try {
    // Security checks
    const origin = request.headers.get('origin');
    if (!security.validateOrigin(origin)) {
      return NextResponse.json({
        success: false,
        error: 'Origin not allowed',
      }, { status: 403 });
    }

    // Rate limiting
    const clientId = security.getClientIdentifier(request);
    const rateLimit = security.checkRateLimit(clientId);
    if (!rateLimit.allowed) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        resetTime: rateLimit.resetTime,
      }, { status: 429 });
    }

    const body: BenchmarkRequest = await request.json();

    // Input validation
    if (!security.validateInput(body.name) || !security.validateInput(body.scenario)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
      }, { status: 400 });
    }
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

    // Save benchmark to database
    await db.saveBenchmark(benchmark);

    // Start benchmark execution asynchronously
    executeBenchmark(benchmarkId, name, scenario, config);

    return NextResponse.json({
      success: true,
      benchmark_id: benchmarkId,
      message: 'Benchmark started successfully',
      benchmark,
    }, {
      headers: security.createSecurityHeaders(),
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start benchmark',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Security checks
  const origin = request.headers.get('origin');
  if (!security.validateOrigin(origin)) {
    return NextResponse.json({
      success: false,
      error: 'Origin not allowed',
    }, { status: 403, headers: security.createSecurityHeaders() });
  }

  // Rate limiting
  const clientId = security.getClientIdentifier(request);
  const rateLimit = security.checkRateLimit(clientId);
  if (!rateLimit.allowed) {
    return NextResponse.json({
      success: false,
      error: 'Rate limit exceeded',
      resetTime: rateLimit.resetTime,
    }, { status: 429, headers: security.createSecurityHeaders() });
  }

  const { searchParams } = new URL(request.url);
  const benchmarkId = searchParams.get('id');

  if (benchmarkId) {
    const benchmark = await db.getBenchmark(benchmarkId);
    if (!benchmark) {
      return NextResponse.json({
        success: false,
        error: 'Benchmark not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      benchmark,
    }, { headers: security.createSecurityHeaders() });
  }

  // Return all benchmarks
  const benchmarks = await db.getAllBenchmarks(50);
  return NextResponse.json({
    success: true,
    benchmarks,
  }, { headers: security.createSecurityHeaders() });
}

async function executeBenchmark(
  benchmarkId: string,
  name: string,
  scenario: string,
  config: any
): Promise<void> {
  try {
    const benchmark = await db.getBenchmark(benchmarkId);
    if (!benchmark) return;

    // Run the benchmark
    const result = await benchmarkRunner.runBenchmark({
      name,
      scenario,
      testCases: config.test_cases || 10,
    });

    // Update benchmark with results
    const updatedBenchmark = {
      ...benchmark,
      status: result.status,
      completed_at: new Date().toISOString(),
      progress: 100,
      completed_tests: result.summary.total_tests,
      results: result.results,
      summary: result.summary,
      errors: result.errors || [],
    };

    // Save updated benchmark to database
    await db.updateBenchmarkStatus(
      benchmarkId,
      result.status,
      100,
      result.summary.total_tests,
      result.summary
    );

    // Save individual results to database
    for (const resultItem of result.results) {
      await db.saveResult({
        id: resultItem.id,
        benchmark_id: benchmarkId,
        name: resultItem.name,
        configuration: resultItem.configuration,
        duration_ms: resultItem.duration_ms,
        tokens_used: resultItem.tokens_used,
        passed: resultItem.passed,
        output: resultItem.output,
        timestamp: resultItem.timestamp,
        error: resultItem.passed ? undefined : 'Test failed',
      });
    }

  } catch (error) {
    console.error('Benchmark execution failed:', error);

    // Update benchmark status to failed
    await db.updateBenchmarkStatus(benchmarkId, 'failed');
  }
}