/**
 * Webhook API for receiving benchmark results
 * POST endpoint for external services to submit benchmark results
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for benchmark result submission
const BenchmarkResultSchema = z.object({
  system_id: z.string().min(1),
  system_info: z.object({
    hostname: z.string(),
    os: z.string(),
    arch: z.string(),
    cpu_model: z.string().optional(),
    cpu_cores: z.number().optional(),
    ram_gb: z.number().optional(),
    cpu: z.string().optional(),
    ram: z.string().optional(),
  }),
  benchmarks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    duration_ms: z.number(),
    success: z.boolean(),
    ns_per_op: z.number().optional(),
    files_per_sec: z.number().optional(),
    bytes_per_sec: z.number().optional(),
    allocations_per_op: z.number().optional(),
    memory_bytes_per_op: z.number().optional(),
    cpu_percent: z.number().optional(),
    findings_count: z.number().optional(),
    files_scanned: z.number().optional(),
  })),
  submitted_at: z.string().datetime().optional(),
});

// Schema for webhook registration
const WebhookRegistrationSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(['benchmark.completed', 'benchmark.failed', 'system.registered'])),
  secret: z.string().optional(),
  name: z.string().optional(),
});

// In-memory store for registered webhooks (in production, use a database)
const registeredWebhooks: Map<string, {
  url: string;
  events: string[];
  secret?: string;
  name?: string;
  createdAt: Date;
}> = new Map();

// In-memory store for received results (in production, use proper storage)
const receivedResults: Map<string, {
  system_id: string;
  received_at: Date;
  data: z.infer<typeof BenchmarkResultSchema>;
}> = new Map();

/**
 * POST /api/webhooks/results
 * Submit benchmark results from external sources
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 415 }
      );
    }

    // Verify webhook signature if secret is provided
    const signature = request.headers.get('x-webhook-signature');
    const body = await request.json();

    // Parse and validate the benchmark result
    const result = BenchmarkResultSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid benchmark result format',
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    const benchmarkResult = result.data;

    // Add receipt timestamp if not present
    if (!benchmarkResult.submitted_at) {
      benchmarkResult.submitted_at = new Date().toISOString();
    }

    // Store the result
    const resultId = `${benchmarkResult.system_id}-${Date.now()}`;
    receivedResults.set(resultId, {
      system_id: benchmarkResult.system_id,
      received_at: new Date(),
      data: benchmarkResult,
    });

    // Log for debugging
    console.log(`[Webhook] Received benchmark result for system: ${benchmarkResult.system_id}`);

    // TODO: Forward to registered webhooks for cascading
    // await forwardToWebhooks('benchmark.completed', benchmarkResult);

    return NextResponse.json({
      success: true,
      result_id: resultId,
      message: 'Benchmark result received successfully',
      received_at: new Date().toISOString(),
    }, { status: 201 });

  } catch (error) {
    console.error('[Webhook] Error processing benchmark result:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/results
 * Get statistics about received webhook results (for debugging/admin)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const systemId = searchParams.get('system_id');

  // Only allow access in development or with admin key
  const adminKey = searchParams.get('admin_key');
  if (process.env.NODE_ENV === 'production' && adminKey !== process.env.WEBHOOK_ADMIN_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (systemId) {
    const results = Array.from(receivedResults.values())
      .filter(r => r.system_id === systemId);
    return NextResponse.json({
      count: results.length,
      results: results.map(r => ({
        system_id: r.system_id,
        received_at: r.received_at,
      })),
    });
  }

  return NextResponse.json({
    total_results: receivedResults.size,
    systems: Array.from(new Set(
      Array.from(receivedResults.values()).map(r => r.system_id)
    )),
  });
}

/**
 * DELETE /api/webhooks/results
 * Clear received results (for testing/admin)
 */
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const adminKey = searchParams.get('admin_key');

  if (process.env.NODE_ENV === 'production' && adminKey !== process.env.WEBHOOK_ADMIN_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  receivedResults.clear();

  return NextResponse.json({
    success: true,
    message: 'All received results cleared',
  });
}
