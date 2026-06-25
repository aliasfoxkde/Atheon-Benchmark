/**
 * Webhook Registration API
 * Register webhooks for receiving notifications about benchmark events
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const WebhookRegistrationSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(['benchmark.completed', 'benchmark.failed', 'system.registered'])),
  secret: z.string().min(16).optional(),
  name: z.string().optional(),
  description: z.string().optional(),
});

// In-memory store for registered webhooks
const registeredWebhooks: Map<string, {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  name?: string;
  description?: string;
  createdAt: Date;
  lastTriggered?: Date;
  failureCount: number;
}> = new Map();

// Supported events
export const SUPPORTED_EVENTS = [
  'benchmark.completed',
  'benchmark.failed',
  'system.registered',
] as const;

export type WebhookEvent = typeof SUPPORTED_EVENTS[number];

/**
 * Generate a webhook ID
 */
function generateWebhookId(): string {
  return `wh_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * POST /api/webhooks/register
 * Register a new webhook endpoint
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

    const body = await request.json();
    const parsed = WebhookRegistrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid webhook configuration',
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const config = parsed.data;
    const webhookId = generateWebhookId();

    const webhook = {
      id: webhookId,
      url: config.url,
      events: config.events,
      secret: config.secret,
      name: config.name,
      description: config.description,
      createdAt: new Date(),
      failureCount: 0,
    };

    registeredWebhooks.set(webhookId, webhook);

    console.log(`[Webhook] Registered new webhook: ${webhookId} for events: ${config.events.join(', ')}`);

    return NextResponse.json({
      success: true,
      webhook_id: webhookId,
      message: 'Webhook registered successfully',
      webhook: {
        id: webhookId,
        url: config.url,
        events: config.events,
        name: config.name,
        created_at: webhook.createdAt.toISOString(),
      },
    }, { status: 201 });

  } catch (error) {
    console.error('[Webhook] Error registering webhook:', error);

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
 * GET /api/webhooks/register
 * List all registered webhooks (admin only)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const adminKey = searchParams.get('admin_key');

  // Verify admin access
  if (process.env.NODE_ENV === 'production' && adminKey !== process.env.WEBHOOK_ADMIN_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const webhooks = Array.from(registeredWebhooks.values()).map(w => ({
    id: w.id,
    url: w.url,
    events: w.events,
    name: w.name,
    description: w.description,
    created_at: w.createdAt.toISOString(),
    last_triggered: w.lastTriggered?.toISOString(),
    failure_count: w.failureCount,
  }));

  return NextResponse.json({
    count: webhooks.length,
    webhooks,
  });
}

/**
 * DELETE /api/webhooks/register
 * Delete a registered webhook
 */
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const webhookId = searchParams.get('id');
  const adminKey = searchParams.get('admin_key');

  if (process.env.NODE_ENV === 'production' && adminKey !== process.env.WEBHOOK_ADMIN_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!webhookId) {
    return NextResponse.json(
      { error: 'Webhook ID is required' },
      { status: 400 }
    );
  }

  const deleted = registeredWebhooks.delete(webhookId);

  if (!deleted) {
    return NextResponse.json(
      { error: 'Webhook not found' },
      { status: 404 }
    );
  }

  console.log(`[Webhook] Deleted webhook: ${webhookId}`);

  return NextResponse.json({
    success: true,
    message: `Webhook ${webhookId} deleted successfully`,
  });
}

/**
 * POST /api/webhooks/register/test
 * Send a test event to a registered webhook
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhook_id, test_event } = body;

    if (!webhook_id) {
      return NextResponse.json(
        { error: 'webhook_id is required' },
        { status: 400 }
      );
    }

    const webhook = registeredWebhooks.get(webhook_id);

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    const eventType = test_event || 'benchmark.completed';
    const testPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: 'This is a test webhook payload',
      },
    };

    // Verify the webhook URL is reachable
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': eventType,
          'X-Webhook-ID': webhook_id,
        },
        body: JSON.stringify(testPayload),
      });

      if (!response.ok) {
        webhook.failureCount++;
        return NextResponse.json({
          success: false,
          message: `Webhook returned error: ${response.status}`,
          status_code: response.status,
        }, { status: 502 });
      }

      webhook.lastTriggered = new Date();

      return NextResponse.json({
        success: true,
        message: 'Test event sent successfully',
        response_status: response.status,
      });

    } catch (error) {
      webhook.failureCount++;
      return NextResponse.json({
        success: false,
        message: `Failed to reach webhook URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }, { status: 502 });

    }

  } catch (error) {
    console.error('[Webhook] Error testing webhook:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
