/**
 * Cloudflare Workers entry point for Atheon Benchmark Dashboard API
 * This worker handles API requests for benchmark execution, results retrieval, and configuration management
 */

import { Env } from './types';
import { validateBody, createBenchmarkSchema, createConfigurationSchema, createTestCaseSchema } from './validation';
import { generateRefreshToken, validateRefreshToken, getRefreshTokenKey, RefreshToken } from './auth';

/**
 * Constant-time string comparison to prevent timing attacks
 * Uses crypto.timingSafeEqual when available, falls back to manual comparison
 */
function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to maintain constant time for length mismatch
    // but return false immediately since lengths differ
    let result = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0 && a.length === b.length;
  }

  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const aBytes = encoder.encode(a);
      const bBytes = encoder.encode(b);
      // timingSafeEqual requires both ArrayBuffer views to have the same byte length
      // We already checked length above, so this is safe
      return globalThis.crypto.subtle.timingSafeEqual(aBytes, bBytes);
    } catch {
      // Fall back to manual comparison if timingSafeEqual fails
    }
  }

  // Fallback: constant-time manual comparison
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export interface Env {
  // D1 Database binding
  DB: D1Database;

  // R2 Storage binding
  STORAGE: R2Bucket;

  // KV Cache binding
  CACHE: KVNamespace;

  // KV namespace for refresh tokens
  REFRESH_TOKENS?: KVNamespace;

  // Environment variables
  ENVIRONMENT: string;
  APP_NAME: string;
  APP_VERSION: string;
  DEFAULT_ORGANIZATION?: string;
}

// OpenTelemetry-compatible structured logging
function logSpan(operation: string, attrs: Record<string, string | number>, duration?: number) {
  const span = {
    trace: {
      operation_name: operation,
      service_name: 'atheon-benchmark-worker',
      start_time_ms: Date.now() - (duration || 0),
      duration_ms: duration || 0,
      attributes: attrs,
    }
  };
  console.log(JSON.stringify(span));
}

// Deprecation headers for API v1
const DEPRECATION_HEADERS = {
  'Deprecation': 'true',
  'Sunset': 'Mon, 01 Jan 2027 00:00:00 GMT',
  'X-API-Version': 'v1-deprecated'
};

function getApiV1Headers(baseHeaders: Record<string, string>): Record<string, string> {
  return { ...baseHeaders, 'X-API-Version': 'v1' };
}

function createDeprecationRedirect(newPath: string): Response {
  return new Response(
    JSON.stringify({
      warning: 'This endpoint is deprecated. Use ' + newPath,
      redirect: newPath
    }),
    {
      status: 301,
      headers: {
        'Content-Type': 'application/json',
        'Location': newPath,
        ...DEPRECATION_HEADERS
      }
    }
  );
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // CORS headers - use environment variable or restrict to known origins
      const allowedOrigins = (env.ENVIRONMENT === 'production')
        ? (env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : ['https://atheon-benchmark.com', 'https://www.atheon-benchmark.com'])
        : ['http://localhost:3000', 'http://127.0.0.1:3000'];
      const origin = request.headers.get('Origin');
      const corsHeaders: Record<string, string> = {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };
      if (origin && allowedOrigins.includes(origin)) {
        corsHeaders['Access-Control-Allow-Origin'] = origin;
      }

      // Combine CORS headers with security headers
      const securityHeaders = getSecurityHeaders();
      const responseHeaders = { ...securityHeaders, ...corsHeaders };

      // Handle OPTIONS requests for CORS
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: responseHeaders });
      }

      // Health check endpoint (no auth required)
      if (path === '/health') {
        return healthCheck(env, responseHeaders);
      }

      // Handle deprecated /api/ routes (redirect to /api/v1/)
      if (path.startsWith('/api/') && !path.startsWith('/api/v1/')) {
        return handleDeprecatedApiRequest(request, env, responseHeaders);
      }

      // API v1 routes (require authentication)
      if (path.startsWith('/api/v1/')) {
        // Check API key authentication
        const authError = await checkAuth(request, env);
        if (authError) {
          return authError;
        }

        // Check rate limit
        const rateLimitError = await checkRateLimit(request, env);
        if (rateLimitError) {
          return rateLimitError;
        }

        return handleApiRequest(request, env, ctx, responseHeaders);
      }

      // 404 for unknown routes
      return new Response('Not Found', { status: 404, headers: responseHeaders });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logSpan('error', { error: err.message, path: new URL(request.url).pathname });
      console.error('Error handling request:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...responseHeaders
          }
        }
      );
    }
  },
};

// Handle deprecated /api/ routes - redirect to /api/v1/
async function handleDeprecatedApiRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const path = new URL(request.url).pathname;

  // Redirect deprecated routes to /api/v1/ equivalents
  switch (true) {
    case path === '/api/benchmarks' && request.method === 'GET':
      return createDeprecationRedirect('/api/v1/benchmarks');
    case path === '/api/benchmarks' && request.method === 'POST':
      return createDeprecationRedirect('/api/v1/benchmarks');
    case path.match(/^\/api\/benchmarks\/[^/]+$/) && request.method === 'GET':
      return createDeprecationRedirect('/api/v1/benchmarks/' + path.split('/')[3]);
    case path.match(/^\/api\/benchmarks\/[^/]+$/) && request.method === 'DELETE':
      return createDeprecationRedirect('/api/v1/benchmarks/' + path.split('/')[3]);
    case path.match(/^\/api\/benchmarks\/[^/]+\/execute$/) && request.method === 'POST':
      return createDeprecationRedirect('/api/v1/benchmarks/' + path.split('/')[3] + '/execute');
    case path === '/api/results' && request.method === 'GET':
      return createDeprecationRedirect('/api/v1/results');
    case path.match(/^\/api\/results\/[^/]+$/) && request.method === 'GET':
      return createDeprecationRedirect('/api/v1/results/' + path.split('/')[3]);
    case path === '/api/configurations' && request.method === 'GET':
      return createDeprecationRedirect('/api/v1/configurations');
    case path === '/api/configurations' && request.method === 'POST':
      return createDeprecationRedirect('/api/v1/configurations');
    case path.match(/^\/api\/configurations\/[^/]+$/) && request.method === 'GET':
      return createDeprecationRedirect('/api/v1/configurations/' + path.split('/')[3]);
    case path === '/api/test-cases' && request.method === 'GET':
      return createDeprecationRedirect('/api/v1/test-cases');
    case path === '/api/test-cases' && request.method === 'POST':
      return createDeprecationRedirect('/api/v1/test-cases');
    default:
      return new Response(
        JSON.stringify({ error: 'Not Found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
  }
}

// Rate limit configuration (KV-based for distributed deployments)
const RATE_LIMIT_WINDOW = 60; // seconds
const RATE_LIMIT_MAX = 100; // requests per window

function getClientInfo(request: Request): { ip: string; userAgent: string } {
  const ip = request.headers.get('CF-Connecting-IP') ||
             request.headers.get('X-Forwarded-For')?.split(',')[0] ||
             'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  return { ip, userAgent };
}

function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  };
}

// Audit event types
type AuditEventType = 'auth_failure' | 'rate_limit' | 'unauthorized' | 'api_error';

interface AuditEvent {
  type: AuditEventType;
  endpoint: string;
  ip: string;
  userAgent: string;
  details?: string;
}

async function auditLog(env: Env, event: AuditEvent): Promise<void> {
  const entry = {
    ...event,
    timestamp: new Date().toISOString(),
  };
  const key = `audit:${Date.now()}:${Math.random()}`;
  const cachePutStart = Date.now();
  // 90 days retention for SOC 2 compliance (requires 90+ days audit trail)
  await env.CACHE.put(key, JSON.stringify(entry), { expirationTtl: 86400 * 90 });
  logSpan('kv.operation', { operation: 'put', key: 'audit' }, Date.now() - cachePutStart);
}

async function checkAuth(request: Request, env: Env): Promise<Response | null> {
  // Skip auth in development
  if (env.ENVIRONMENT !== 'production') {
    return null;
  }

  const apiKey = env.API_KEY;
  if (!apiKey) {
    // No API key configured - reject all requests
    return new Response(
      JSON.stringify({ error: 'Server not configured for production' }),
      { status: 503, headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() } }
    );
  }

  const authHeader = request.headers.get('Authorization');
  const keyHeader = request.headers.get('X-API-Key');
  const token = authHeader?.replace('Bearer ', '') || keyHeader;

  if (!token || !timingSafeEqualStrings(token, apiKey)) {
    const { ip, userAgent } = getClientInfo(request);
    await auditLog(env, {
      type: 'auth_failure',
      endpoint: new URL(request.url).pathname,
      ip,
      userAgent,
      details: 'Invalid or missing API key'
    });
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() } }
    );
  }

  // Validate organization context
  const orgId = getOrganizationId(request, env);
  if (!orgId) {
    return new Response(
      JSON.stringify({ error: 'Organization context required' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() } }
    );
  }

  return null;
}

/**
 * Extract organization ID from authenticated context
 * SECURITY: In production, organization is derived from authenticated credentials,
 * NOT from the X-Organization-ID header which can be spoofed.
 * X-Organization-ID header is only allowed in development/non-production environments.
 */
function getOrganizationId(request: Request, env: Env): string | null {
  // In production, organization must come from authenticated context
  // For now, we use the global API key's organization (single-tenant default)
  // TODO: Implement per-org API keys or JWT-based organization claims for proper multi-tenancy
  if (env.ENVIRONMENT === 'production') {
    // Production: Derive org from authenticated context, not from header
    // Currently using global API key so org is DEFAULT_ORGANIZATION
    return env.DEFAULT_ORGANIZATION || 'default';
  }

  // Development: Allow X-Organization-ID header for testing
  const orgHeader = request.headers.get('X-Organization-ID');
  return orgHeader || env.DEFAULT_ORGANIZATION || 'default';
}

async function checkRateLimit(request: Request, env: Env): Promise<Response | null> {
  const clientIP = request.headers.get('CF-Connecting-IP') ||
                   request.headers.get('X-Forwarded-For')?.split(',')[0] ||
                   'unknown';
  const now = Date.now();
  const key = `ratelimit:${clientIP}`;

  try {
    // Get current rate limit state from KV
    const stored = await env.CACHE.get(key, 'json') as { count: number; resetTime: number } | null;

    if (!stored || now > stored.resetTime) {
      // New window - reset counter
      const newState = { count: 1, resetTime: now + (RATE_LIMIT_WINDOW * 1000) };
      await env.CACHE.put(key, JSON.stringify(newState), { expirationTtl: RATE_LIMIT_WINDOW });
      return null;
    }

    if (stored.count >= RATE_LIMIT_MAX) {
      const { ip, userAgent } = getClientInfo(request);
      await auditLog(env, {
        type: 'rate_limit',
        endpoint: new URL(request.url).pathname,
        ip,
        userAgent,
        details: `Rate limit exceeded: ${stored.count}/${RATE_LIMIT_MAX} requests`
      });
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', retryAfter: Math.ceil((stored.resetTime - now) / 1000) }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((stored.resetTime - now) / 1000)),
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(stored.resetTime),
            ...getSecurityHeaders(),
          }
        }
      );
    }

    // Increment counter - note: there is a race condition here in distributed
    // environments but acceptable for rate limiting purposes
    stored.count++;
    await env.CACHE.put(key, JSON.stringify(stored), { expirationTtl: RATE_LIMIT_WINDOW });
    return null;
  } catch (error) {
    // If KV fails, allow the request (fail open) but log the error
    console.error('Rate limit KV error:', error);
    return null;
  }
}

async function healthCheck(env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    // Test database connection
    const dbResult = await env.DB.prepare('SELECT 1 as test').first<{ test: number }>();

    return new Response(
      JSON.stringify({
        status: 'healthy',
        environment: env.ENVIRONMENT,
        app_name: env.APP_NAME,
        app_version: env.APP_VERSION,
        database: dbResult?.test === 1 ? 'connected' : 'error',
        timestamp: new Date().toISOString()
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
}

async function handleApiRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const start = Date.now();
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const { ip } = getClientInfo(request);

  // Extract organization context
  const organizationId = getOrganizationId(request, env);

  // Add API version header to all v1 responses
  const apiV1Headers = getApiV1Headers(corsHeaders);

  logSpan('api.request', { method, path, ip, organization_id: organizationId });

  // Parse and validate body for POST/PUT requests
  let body: unknown = null;
  if (method === 'POST' || method === 'PUT') {
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Validate body based on endpoint
    const pathLower = path.toLowerCase();
    if (pathLower === '/api/v1/benchmarks' && method === 'POST') {
      const result = validateBody(createBenchmarkSchema, body);
      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), { status: 400, headers: { 'Content-Type': 'application/json', ...apiV1Headers } });
      }
    } else if (pathLower === '/api/v1/configurations' && method === 'POST') {
      const result = validateBody(createConfigurationSchema, body);
      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), { status: 400, headers: { 'Content-Type': 'application/json', ...apiV1Headers } });
      }
    } else if (pathLower === '/api/v1/test-cases' && method === 'POST') {
      const result = validateBody(createTestCaseSchema, body);
      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), { status: 400, headers: { 'Content-Type': 'application/json', ...apiV1Headers } });
      }
    }
  }

  // Route handling
  let response: Response;
  switch (true) {
    // Benchmark endpoints
    case path === '/api/v1/benchmarks' && method === 'GET':
      response = await getBenchmarks(env, url, apiV1Headers, organizationId);
      break;
    case path === '/api/v1/benchmarks' && method === 'POST':
      response = await createBenchmark(env, body, apiV1Headers, organizationId);
      break;
    case path.match(/^\/api\/v1\/benchmarks\/[^/]+$/) && method === 'GET':
      response = await getBenchmark(env, path.split('/').pop()!, apiV1Headers, organizationId);
      break;
    case path.match(/^\/api\/v1\/benchmarks\/[^/]+$/) && method === 'DELETE':
      response = await deleteBenchmark(env, path.split('/').pop()!, apiV1Headers, organizationId);
      break;

    // Benchmark execution endpoint
    case path.match(/^\/api\/v1\/benchmarks\/[^/]+\/execute$/) && method === 'POST':
      response = await executeBenchmark(env, path.split('/')[3], body, apiV1Headers, organizationId);
      break;

    // Results endpoints
    case path === '/api/v1/results' && method === 'GET':
      response = await getResults(env, url, apiV1Headers, organizationId);
      break;
    case path.match(/^\/api\/v1\/results\/[^/]+$/) && method === 'GET':
      response = await getResult(env, path.split('/').pop()!, apiV1Headers, organizationId);
      break;

    // Configuration endpoints
    case path === '/api/v1/configurations' && method === 'GET':
      response = await getConfigurations(env, apiV1Headers, organizationId);
      break;
    case path === '/api/v1/configurations' && method === 'POST':
      response = await createConfiguration(env, body, apiV1Headers, organizationId);
      break;
    case path.match(/^\/api\/v1\/configurations\/[^/]+$/) && method === 'GET':
      response = await getConfiguration(env, path.split('/').pop()!, apiV1Headers, organizationId);
      break;

    // Test cases endpoints
    case path === '/api/v1/test-cases' && method === 'GET':
      response = await getTestCases(env, url, apiV1Headers);
      break;
    case path === '/api/v1/test-cases' && method === 'POST':
      response = await createTestCase(env, body, apiV1Headers);
      break;

    // Auth endpoints
    case path === '/api/v1/auth/refresh' && method === 'POST':
      response = await refreshToken(env, body, apiV1Headers);
      break;

    // GDPR: User data export endpoint
    case path.match(/^\/api\/v1\/users\/[^/]+\/export$/) && method === 'GET':
      response = await exportUserData(env, path.split('/')[3], apiV1Headers);
      break;

    // GDPR: User data deletion endpoint
    case path.match(/^\/api\/v1\/users\/[^/]+\/delete$/) && method === 'DELETE':
      response = await deleteUser(env, path.split('/')[3], apiV1Headers);
      break;

    default:
      response = new Response(
        JSON.stringify({ error: 'Not Found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...apiV1Headers
          }
        }
      );
  }

  // Audit log 401/403 responses
  if (response.status === 401 || response.status === 403) {
    const { ip, userAgent } = getClientInfo(request);
    await auditLog(env, {
      type: response.status === 401 ? 'unauthorized' : 'unauthorized',
      endpoint: path,
      ip,
      userAgent,
      details: `HTTP ${response.status} response`
    });
  }

  return response;
}

// ============================================
// BENCHMARK ENDPOINTS
// ============================================

// Cache invalidation helper for benchmarks list
async function invalidateBenchmarksCache(env: Env, organizationId: string): Promise<void> {
  try {
    // List all cached benchmark pages and invalidate them
    // Since KV doesn't support prefix listing, we invalidate known keys
    const knownKeys = [
      `benchmarks:org=${organizationId}:page=1&limit=10&status=`,
      `benchmarks:org=${organizationId}:page=1&limit=10&status=pending`,
      `benchmarks:org=${organizationId}:page=1&limit=10&status=running`,
      `benchmarks:org=${organizationId}:page=1&limit=10&status=completed`,
      `benchmarks:org=${organizationId}:page=1&limit=10&status=failed`,
    ];
    // Invalidate with a short TTL to force refresh
    for (const key of knownKeys) {
      const deleteStart = Date.now();
      await env.CACHE.delete(key);
      logSpan('kv.operation', { operation: 'delete', key }, Date.now() - deleteStart);
    }
  } catch (error) {
    // Log but don't fail the request if cache invalidation fails
    console.error('Failed to invalidate benchmarks cache:', error);
  }
}

async function getBenchmarks(env: Env, url: URL, headers: Record<string, string>, organizationId: string): Promise<Response> {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const status = url.searchParams.get('status');
  const offset = (page - 1) * limit;

  // KV cache key based on query params (1 minute TTL)
  const cacheKey = `benchmarks:org=${organizationId}:page=${page}&limit=${limit}&status=${status || ''}`;
  const cacheGetStart = Date.now();
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    logSpan('kv.operation', { operation: 'get', key: cacheKey }, Date.now() - cacheGetStart);
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Cache-Hit': 'true', ...headers }
    });
  }

  let query = 'SELECT * FROM benchmarks WHERE organization_id = ?';
  const params: any[] = [organizationId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    const queryStart = Date.now();
    const results = await env.DB.prepare(query).bind(...params).all();
    const countResult = await env.DB.prepare('SELECT COUNT(*) as count FROM benchmarks WHERE organization_id = ?').bind(organizationId).first<{ count: number }>();
    logSpan('d1.query', { query_type: 'select', table: 'benchmarks' }, Date.now() - queryStart);

    const responseData = {
      data: results.results,
      total: countResult?.count || 0,
      page,
      limit,
      has_more: (countResult?.count || 0) > page * limit
    };

    // Cache for 1 minute
    const cachePutStart = Date.now();
    await env.CACHE.put(cacheKey, JSON.stringify(responseData), { expirationTtl: 60 });
    logSpan('kv.operation', { operation: 'put', key: cacheKey }, Date.now() - cachePutStart);

    return new Response(
      JSON.stringify(responseData),
      { headers: { 'Content-Type': 'application/json', 'X-Cache-Hit': 'false', ...headers } }
    );
  } catch (error) {
    throw new Error(`Failed to fetch benchmarks: ${error}`);
  }
}

async function createBenchmark(env: Env, body: unknown, headers: Record<string, string>, organizationId: string): Promise<Response> {
  const id = crypto.randomUUID();
  const { name, description, configuration_id, config } = body;

  if (!name) {
    return new Response(
      JSON.stringify({ error: 'Name is required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...headers }
      }
    );
  }

  try {
    const queryStart = Date.now();
    await env.DB.prepare(`
      INSERT INTO benchmarks (id, name, description, configuration_id, organization_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, name, description || '', configuration_id || 'default-config', organizationId, JSON.stringify(config || {})).run();
    logSpan('d1.query', { query_type: 'insert', table: 'benchmarks' }, Date.now() - queryStart);

    // Invalidate benchmarks list cache
    await invalidateBenchmarksCache(env, organizationId);

    return new Response(
      JSON.stringify({ id, name, description, configuration_id, organization_id: organizationId, status: 'pending' }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...headers }
      }
    );
  } catch (error) {
    throw new Error(`Failed to create benchmark: ${error}`);
  }
}

async function getBenchmark(env: Env, id: string, headers: Record<string, string>, organizationId: string): Promise<Response> {
  try {
    const queryStart = Date.now();
    const result = await env.DB.prepare('SELECT * FROM benchmarks WHERE id = ? AND organization_id = ?').bind(id, organizationId).first();
    logSpan('d1.query', { query_type: 'select', table: 'benchmarks' }, Date.now() - queryStart);

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Benchmark not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...headers }
        }
      );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json', ...headers } }
    );
  } catch (error) {
    throw new Error(`Failed to fetch benchmark: ${error}`);
  }
}

async function deleteBenchmark(env: Env, id: string, headers: Record<string, string>, organizationId: string): Promise<Response> {
  try {
    const queryStart = Date.now();
    await env.DB.prepare('DELETE FROM benchmarks WHERE id = ? AND organization_id = ?').bind(id, organizationId).run();
    logSpan('d1.query', { query_type: 'delete', table: 'benchmarks' }, Date.now() - queryStart);
    // Invalidate benchmarks cache
    await invalidateBenchmarksCache(env, organizationId);
    return new Response(null, { status: 204, headers });
  } catch (error) {
    throw new Error(`Failed to delete benchmark: ${error}`);
  }
}

// Batch insert helper for benchmark results
async function batchInsertBenchmarkResults(
  env: Env,
  results: Array<{
    id: string;
    benchmark_id: string;
    test_case_id: string;
    test_name: string;
    started_at: number;
    completed_at: number;
    status: string;
    duration_ms: number;
    tokens_used: number;
    passed: boolean;
    organization_id: string;
  }>
): Promise<void> {
  if (results.length === 0) return;

  // Build parameterized query to prevent SQL injection
  const placeholders = results.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
  const query = `INSERT INTO benchmark_results (id, benchmark_id, test_case_id, test_name, organization_id, started_at, completed_at, status, duration_ms, tokens_used, passed) VALUES ${placeholders}`;

  // Flatten all values for binding - order must match placeholders
  const binds: (string | number)[] = [];
  for (const r of results) {
    binds.push(
      r.id,
      r.benchmark_id,
      r.test_case_id,
      r.test_name,
      r.organization_id,
      r.started_at,
      r.completed_at,
      r.status,
      r.duration_ms,
      r.tokens_used,
      r.passed ? 1 : 0
    );
  }

  const queryStart = Date.now();
  await env.DB.prepare(query).bind(...binds).run();
  logSpan('d1.query', { query_type: 'insert', table: 'benchmark_results', row_count: results.length }, Date.now() - queryStart);
}

async function executeBenchmark(env: Env, benchmarkId: string, body: unknown, headers: Record<string, string>, organizationId: string): Promise<Response> {
  // Validate benchmark exists and belongs to organization
  const queryStart = Date.now();
  const benchmark = await env.DB.prepare(
    'SELECT id, name, status, configuration_id FROM benchmarks WHERE id = ? AND organization_id = ?'
  ).bind(benchmarkId, organizationId).first();
  logSpan('d1.query', { query_type: 'select', table: 'benchmarks' }, Date.now() - queryStart);

  if (!benchmark) {
    return new Response(
      JSON.stringify({ error: 'Benchmark not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  }

  if (benchmark.status === 'running') {
    return new Response(
      JSON.stringify({ error: 'Benchmark is already running', benchmark_id: benchmarkId }),
      { status: 409, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  }

  // Update benchmark status to running
  const updateStart = Date.now();
  await env.DB.prepare(
    'UPDATE benchmarks SET status = ?, started_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind('running', Date.now(), benchmarkId).run();
  logSpan('d1.query', { query_type: 'update', table: 'benchmarks' }, Date.now() - updateStart);

  // Invalidate cache
  await invalidateBenchmarksCache(env, organizationId);

  // Note: Full distributed benchmark execution would require:
  // - Cloudflare Queue for async job processing
  // - Durable Objects for stateful benchmark coordination
  // - Separate Worker for actual benchmark runner
  // For now, this endpoint marks the benchmark as running and returns immediately
  // The dashboard is responsible for triggering the actual execution client-side

  return new Response(
    JSON.stringify({
      message: 'Benchmark execution started',
      benchmark_id: benchmarkId,
      benchmark_name: benchmark.name,
      organization_id: organizationId,
      status: 'running',
      execution_url: `/api/v1/benchmarks/${benchmarkId}/results`,
      estimated_duration_seconds: 300 // ~5 minutes estimated
    }),
    {
      status: 202,
      headers: { 'Content-Type': 'application/json', ...headers }
    }
  );
}

// ============================================
// RESULTS ENDPOINTS
// ============================================

async function getResults(env: Env, url: URL, headers: Record<string, string>, organizationId: string): Promise<Response> {
  const benchmarkId = url.searchParams.get('benchmark_id');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM benchmark_results WHERE organization_id = ?';
  const params: any[] = [organizationId];

  if (benchmarkId) {
    query += ' AND benchmark_id = ?';
    params.push(benchmarkId);
  }

  query += ' ORDER BY started_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    const queryStart = Date.now();
    const results = await env.DB.prepare(query).bind(...params).all();
    logSpan('d1.query', { query_type: 'select', table: 'benchmark_results' }, Date.now() - queryStart);

    return new Response(
      JSON.stringify({
        data: results.results,
        page,
        limit
      }),
      { headers: { 'Content-Type': 'application/json', ...headers } }
    );
  } catch (error) {
    throw new Error(`Failed to fetch results: ${error}`);
  }
}

async function getResult(env: Env, id: string, headers: Record<string, string>, organizationId: string): Promise<Response> {
  try {
    const queryStart = Date.now();
    const result = await env.DB.prepare('SELECT * FROM benchmark_results WHERE id = ? AND organization_id = ?').bind(id, organizationId).first();
    logSpan('d1.query', { query_type: 'select', table: 'benchmark_results' }, Date.now() - queryStart);

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Result not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...headers }
        }
      );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json', ...headers } }
    );
  } catch (error) {
    throw new Error(`Failed to fetch result: ${error}`);
  }
}

// ============================================
// CONFIGURATION ENDPOINTS
// ============================================

async function getConfigurations(env: Env, headers: Record<string, string>, organizationId: string): Promise<Response> {
  const cacheKey = `configs:org=${organizationId}:list`;

  // Check KV cache (5 minute TTL)
  const cacheGetStart = Date.now();
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    logSpan('kv.operation', { operation: 'get', key: cacheKey }, Date.now() - cacheGetStart);
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Cache-Hit': 'true', ...headers }
    });
  }

  try {
    const queryStart = Date.now();
    const results = await env.DB.prepare('SELECT * FROM configurations WHERE organization_id = ? ORDER BY created_at DESC').bind(organizationId).all();
    logSpan('d1.query', { query_type: 'select', table: 'configurations' }, Date.now() - queryStart);

    const responseData = JSON.stringify({ data: results.results });

    // Cache for 5 minutes
    const cachePutStart = Date.now();
    await env.CACHE.put(cacheKey, responseData, { expirationTtl: 300 });
    logSpan('kv.operation', { operation: 'put', key: cacheKey }, Date.now() - cachePutStart);

    return new Response(
      responseData,
      { headers: { 'Content-Type': 'application/json', 'X-Cache-Hit': 'false', ...headers } }
    );
  } catch (error) {
    throw new Error(`Failed to fetch configurations: ${error}`);
  }
}

async function createConfiguration(env: Env, body: unknown, headers: Record<string, string>, organizationId: string): Promise<Response> {
  const id = crypto.randomUUID();
  const { name, description, config, is_public } = body;

  if (!name || !config) {
    return new Response(
      JSON.stringify({ error: 'Name and config are required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...headers }
      }
    );
  }

  try {
    const queryStart = Date.now();
    await env.DB.prepare(`
      INSERT INTO configurations (id, name, description, organization_id, is_public, config)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, name, description || '', organizationId, is_public || false, JSON.stringify(config)).run();
    logSpan('d1.query', { query_type: 'insert', table: 'configurations' }, Date.now() - queryStart);

    // Invalidate configurations cache
    const deleteStart = Date.now();
    await env.CACHE.delete(`configs:org=${organizationId}:list`);
    logSpan('kv.operation', { operation: 'delete', key: 'configs:list' }, Date.now() - deleteStart);

    return new Response(
      JSON.stringify({ id, name, description, organization_id: organizationId, is_public, config }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...headers }
      }
    );
  } catch (error) {
    throw new Error(`Failed to create configuration: ${error}`);
  }
}

async function getConfiguration(env: Env, id: string, headers: Record<string, string>, organizationId: string): Promise<Response> {
  try {
    const queryStart = Date.now();
    const result = await env.DB.prepare('SELECT * FROM configurations WHERE id = ? AND organization_id = ?').bind(id, organizationId).first();
    logSpan('d1.query', { query_type: 'select', table: 'configurations' }, Date.now() - queryStart);

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Configuration not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...headers }
        }
      );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json', ...headers } }
    );
  } catch (error) {
    throw new Error(`Failed to fetch configuration: ${error}`);
  }
}

// ============================================
// TEST CASES ENDPOINTS
// ============================================

async function getTestCases(env: Env, url: URL, headers: Record<string, string>): Promise<Response> {
  const category = url.searchParams.get('category');
  const difficulty = url.searchParams.get('difficulty');

  let query = 'SELECT * FROM test_cases WHERE is_active = 1';
  const params: any[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (difficulty) {
    query += ' AND difficulty = ?';
    params.push(difficulty);
  }

  query += ' ORDER BY created_at DESC';

  try {
    const queryStart = Date.now();
    const results = await env.DB.prepare(query).bind(...params).all();
    logSpan('d1.query', { query_type: 'select', table: 'test_cases' }, Date.now() - queryStart);

    return new Response(
      JSON.stringify({ data: results.results }),
      { headers: { 'Content-Type': 'application/json', ...headers } }
    );
  } catch (error) {
    throw new Error(`Failed to fetch test cases: ${error}`);
  }
}

async function createTestCase(env: Env, body: unknown, headers: Record<string, string>): Promise<Response> {
  const id = crypto.randomUUID();
  const { name, description, category, difficulty, input_prompt, expected_output, validation_rules } = body;

  if (!name || !category || !difficulty || !input_prompt) {
    return new Response(
      JSON.stringify({ error: 'Name, category, difficulty, and input_prompt are required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...headers }
      }
    );
  }

  try {
    const queryStart = Date.now();
    await env.DB.prepare(`
      INSERT INTO test_cases (id, name, description, category, difficulty, input_prompt, expected_output, validation_rules)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      name,
      description || '',
      category,
      difficulty,
      input_prompt,
      expected_output || '',
      JSON.stringify(validation_rules || {})
    ).run();
    logSpan('d1.query', { query_type: 'insert', table: 'test_cases' }, Date.now() - queryStart);

    return new Response(
      JSON.stringify({ id, name, description, category, difficulty }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...headers }
      }
    );
  } catch (error) {
    throw new Error(`Failed to create test case: ${error}`);
  }
}

// ============================================
// AUTH ENDPOINTS
// ============================================

async function refreshToken(env: Env, body: unknown, headers: Record<string, string>): Promise<Response> {
  // Exchange refresh token for new access token
  // Implement token rotation (invalidate old token)
  const { refreshToken: tokenId } = body as { refreshToken?: string };

  if (!tokenId) {
    return new Response(
      JSON.stringify({ error: 'Refresh token is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  }

  // Check if REFRESH_TOKENS KV namespace is configured
  if (!env.REFRESH_TOKENS) {
    return new Response(
      JSON.stringify({ error: 'Refresh token system not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  }

  try {
    // Retrieve stored refresh token
    const tokenKey = getRefreshTokenKey(tokenId);
    const tokenData = await env.REFRESH_TOKENS.get(tokenKey);

    if (!tokenData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired refresh token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...headers } }
      );
    }

    const token: RefreshToken = JSON.parse(tokenData);

    // Validate token is not expired
    if (!validateRefreshToken(token)) {
      // Delete expired token
      await env.REFRESH_TOKENS.delete(tokenKey);
      return new Response(
        JSON.stringify({ error: 'Refresh token expired' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...headers } }
      );
    }

    // Token rotation: generate and store new token BEFORE invalidating old one
    // This prevents token loss if the new token storage fails
    const newRefreshToken = generateRefreshToken(token.userId, token.organizationId);

    // Store new refresh token first
    await env.REFRESH_TOKENS.put(
      getRefreshTokenKey(newRefreshToken.tokenId),
      JSON.stringify(newRefreshToken),
      { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
    );

    // Only after successful storage, invalidate old token
    await env.REFRESH_TOKENS.delete(tokenKey);

    // Return new tokens (access token would be generated in a full implementation)
    return new Response(
      JSON.stringify({
        message: 'Token refreshed successfully',
        expiresAt: newRefreshToken.expiresAt,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  } catch (error) {
    console.error('Token refresh error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to refresh token' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  }
}

// ============================================
// GDPR: DATA PORTABILITY & DELETION ENDPOINTS
// ============================================

/**
 * Export user data for GDPR Article 20 (Data Portability)
 */
async function exportUserData(env: Env, userId: string, headers: Record<string, string>): Promise<Response> {
  try {
    // Verify user exists
    const userQueryStart = Date.now();
    const user = await env.DB.prepare(
      'SELECT id, email, name, role, created_at, metadata FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...headers } }
      );
    }

    // Get user's benchmarks
    const benchmarksQueryStart = Date.now();
    const benchmarks = await env.DB.prepare(
      'SELECT * FROM benchmarks WHERE organization_id = (SELECT organization_id FROM users WHERE id = ?) LIMIT 100'
    ).bind(userId).all();
    logSpan('d1.query', { query_type: 'select', table: 'benchmarks', user_id: userId }, Date.now() - benchmarksQueryStart);

    // Get user's configurations
    const configurations = await env.DB.prepare(
      'SELECT * FROM configurations WHERE organization_id = (SELECT organization_id FROM users WHERE id = ?) LIMIT 100'
    ).bind(userId).all();

    // Return exported data
    const exportData = {
      exported_at: new Date().toISOString(),
      user,
      benchmarks: benchmarks.results,
      configurations: configurations.results,
      data_portability_request: true,
    };

    return new Response(
      JSON.stringify(exportData, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="user-data-${userId}.json"`,
          ...headers
        }
      }
    );
  } catch (error) {
    console.error('User data export error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to export user data' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  }
}

/**
 * Delete user data for GDPR Right to Erasure
 */
async function deleteUser(env: Env, userId: string, headers: Record<string, string>): Promise<Response> {
  try {
    // Verify user exists
    const user = await env.DB.prepare(
      'SELECT id, email FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...headers } }
      );
    }

    // Delete user's refresh tokens first (from KV)
    if (env.REFRESH_TOKENS) {
      // List and delete all tokens for this user
      // Note: This is a simplified approach; production would use a user-token index
      const tokenList = await env.REFRESH_TOKENS.list({ prefix: 'refresh:' });
      for (const key of tokenList.keys) {
        const tokenData = await env.REFRESH_TOKENS.get(key.name);
        if (tokenData) {
          const token = JSON.parse(tokenData);
          if (token.userId === userId) {
            await env.REFRESH_TOKENS.delete(key.name);
          }
        }
      }
    }

    // Delete user's benchmarks and related results
    await env.DB.prepare(
      'DELETE FROM benchmark_results WHERE benchmark_id IN (SELECT id FROM benchmarks WHERE organization_id = (SELECT organization_id FROM users WHERE id = ?))'
    ).bind(userId).run();

    await env.DB.prepare(
      'DELETE FROM benchmarks WHERE organization_id = (SELECT organization_id FROM users WHERE id = ?)'
    ).bind(userId).run();

    // Delete user's configurations
    await env.DB.prepare(
      'DELETE FROM configurations WHERE organization_id = (SELECT organization_id FROM users WHERE id = ?)'
    ).bind(userId).run();

    // Finally delete the user
    await env.DB.prepare(
      'DELETE FROM users WHERE id = ?'
    ).bind(userId).run();

    return new Response(
      JSON.stringify({
        message: 'User data deleted successfully',
        deleted_at: new Date().toISOString(),
        user_id: userId
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  } catch (error) {
    console.error('User deletion error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete user data' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  }
}