/**
 * Real-time Benchmark Streaming Endpoint
 * Server-Sent Events (SSE) for live benchmark progress updates
 */

import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const benchmarkId = request.nextUrl.searchParams.get('benchmark_id');

  if (!benchmarkId) {
    return new Response('Benchmark ID required', { status: 400 });
  }

  // Create a readable stream for SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = JSON.stringify({
        type: 'connected',
        benchmark_id: benchmarkId,
        timestamp: new Date().toISOString(),
      });

      controller.enqueue(encoder.encode(`data: ${data}\n\n`));

      // Simulate benchmark progress
      let progress = 0;
      const totalTests = 10;
      const interval = setInterval(() => {
        progress += 1;

        const progressData = JSON.stringify({
          type: 'progress',
          benchmark_id: benchmarkId,
          data: {
            current_test: progress,
            total_tests: totalTests,
            progress: Math.round((progress / totalTests) * 100),
            timestamp: new Date().toISOString(),
          },
        });

        controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));

        // Send test completion events
        if (progress <= totalTests) {
          const testData = JSON.stringify({
            type: 'test_completed',
            benchmark_id: benchmarkId,
            data: {
              test_id: `test-${progress}`,
              test_name: `Test ${progress}`,
              duration_ms: Math.random() * 3000 + 1000,
              passed: Math.random() > 0.1,
              timestamp: new Date().toISOString(),
            },
          });

          controller.enqueue(encoder.encode(`data: ${testData}\n\n`));
        }

        // Complete the benchmark
        if (progress >= totalTests) {
          clearInterval(interval);

          const completeData = JSON.stringify({
            type: 'completed',
            benchmark_id: benchmarkId,
            data: {
              total_tests: totalTests,
              completed_tests: totalTests,
              failed_tests: Math.round(Math.random() * 2),
              avg_duration_ms: 2340,
              timestamp: new Date().toISOString(),
            },
          });

          controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));
          controller.close();
        }
      }, 2000); // Send update every 2 seconds

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}