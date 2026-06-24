/**
 * Cloudflare Workers entry point for Atheon Benchmark Dashboard API
 * This worker handles API requests for benchmark execution, results retrieval, and configuration management
 */

import { Env } from './types';
import { validateBody, createBenchmarkSchema, createConfigurationSchema, createTestCaseSchema } from './validation';

export interface Env {
  // D1 Database binding
  DB: D1Database;

  // R2 Storage binding
  STORAGE: R2Bucket;

  // KV Cache binding
  CACHE: KVNamespace;

  // Environment variables
  ENVIRONMENT: string;
  APP_NAME: string;
  APP_VERSION: string;
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

      // API routes (require authentication)
      if (path.startsWith('/api/')) {
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

// Rate limit store (in-memory for single instance, use KV for distributed)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
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
  await env.CACHE.put(key, JSON.stringify(entry), { expirationTtl: 86400 * 30 }); // 30 days
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

  if (!token || token !== apiKey) {
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

  return null;
}

async function checkRateLimit(request: Request, env: Env): Promise<Response | null> {
  const clientIP = request.headers.get('CF-Connecting-IP') ||
                   request.headers.get('X-Forwarded-For')?.split(',')[0] ||
                   'unknown';
  const now = Date.now();
  const key = `ratelimit:${clientIP}`;

  const current = rateLimitMap.get(key);
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + (RATE_LIMIT_WINDOW * 1000) });
    return null;
  }

  if (current.count >= RATE_LIMIT_MAX) {
    const { ip, userAgent } = getClientInfo(request);
    await auditLog(env, {
      type: 'rate_limit',
      endpoint: new URL(request.url).pathname,
      ip,
      userAgent,
      details: `Rate limit exceeded: ${current.count}/${RATE_LIMIT_MAX} requests`
    });
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded', retryAfter: Math.ceil((current.resetTime - now) / 1000) }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((current.resetTime - now) / 1000)),
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(current.resetTime),
          ...getSecurityHeaders(),
        }
      }
    );
  }

  current.count++;
  return null;
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
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

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
    if (pathLower === '/api/benchmarks' && method === 'POST') {
      const result = validateBody(createBenchmarkSchema, body);
      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
    } else if (pathLower === '/api/configurations' && method === 'POST') {
      const result = validateBody(createConfigurationSchema, body);
      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
    } else if (pathLower === '/api/test-cases' && method === 'POST') {
      const result = validateBody(createTestCaseSchema, body);
      if (!result.success) {
        return new Response(JSON.stringify({ error: result.error }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
    }
  }

  // Route handling
  let response: Response;
  switch (true) {
    // Benchmark endpoints
    case path === '/api/benchmarks' && method === 'GET':
      response = await getBenchmarks(env, url, corsHeaders);
      break;
    case path === '/api/benchmarks' && method === 'POST':
      response = await createBenchmark(env, body, corsHeaders);
      break;
    case path.match(/^\/api\/benchmarks\/[^/]+$/) && method === 'GET':
      response = await getBenchmark(env, path.split('/').pop()!, corsHeaders);
      break;
    case path.match(/^\/api\/benchmarks\/[^/]+$/) && method === 'DELETE':
      response = await deleteBenchmark(env, path.split('/').pop()!, corsHeaders);
      break;

    // Benchmark execution endpoint
    case path.match(/^\/api\/benchmarks\/[^/]+\/execute$/) && method === 'POST':
      response = await executeBenchmark(env, path.split('/')[3], body, corsHeaders);
      break;

    // Results endpoints
    case path === '/api/results' && method === 'GET':
      response = await getResults(env, url, corsHeaders);
      break;
    case path.match(/^\/api\/results\/[^/]+$/) && method === 'GET':
      response = await getResult(env, path.split('/').pop()!, corsHeaders);
      break;

    // Configuration endpoints
    case path === '/api/configurations' && method === 'GET':
      response = await getConfigurations(env, corsHeaders);
      break;
    case path === '/api/configurations' && method === 'POST':
      response = await createConfiguration(env, body, corsHeaders);
      break;
    case path.match(/^\/api\/configurations\/[^/]+$/) && method === 'GET':
      response = await getConfiguration(env, path.split('/').pop()!, corsHeaders);
      break;

    // Test cases endpoints
    case path === '/api/test-cases' && method === 'GET':
      response = await getTestCases(env, url, corsHeaders);
      break;
    case path === '/api/test-cases' && method === 'POST':
      response = await createTestCase(env, body, corsHeaders);
      break;

    default:
      response = new Response(
        JSON.stringify({ error: 'Not Found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
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
async function invalidateBenchmarksCache(env: Env): Promise<void> {
  try {
    // List all cached benchmark pages and invalidate them
    // Since KV doesn't support prefix listing, we invalidate known keys
    const knownKeys = [
      'benchmarks:page=1&limit=10&status=',
      'benchmarks:page=1&limit=10&status=pending',
      'benchmarks:page=1&limit=10&status=running',
      'benchmarks:page=1&limit=10&status=completed',
      'benchmarks:page=1&limit=10&status=failed',
    ];
    // Invalidate with a short TTL to force refresh
    for (const key of knownKeys) {
      await env.CACHE.delete(key);
    }
  } catch (error) {
    // Log but don't fail the request if cache invalidation fails
    console.error('Failed to invalidate benchmarks cache:', error);
  }
}

async function getBenchmarks(env: Env, url: URL, headers: Record<string, string>): Promise<Response> {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const status = url.searchParams.get('status');
  const offset = (page - 1) * limit;

  // KV cache key based on query params (1 minute TTL)
  const cacheKey = `benchmarks:page=${page}&limit=${limit}&status=${status || ''}`;
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Cache-Hit': 'true', ...headers }
    });
  }

  let query = 'SELECT * FROM benchmarks';
  const params: any[] = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    const results = await env.DB.prepare(query).bind(...params).all();
    const countResult = await env.DB.prepare('SELECT COUNT(*) as count FROM benchmarks').first<{ count: number }>();

    const responseData = {
      data: results.results,
      total: countResult?.count || 0,
      page,
      limit,
      has_more: (countResult?.count || 0) > page * limit
    };

    // Cache for 1 minute
    await env.CACHE.put(cacheKey, JSON.stringify(responseData), { expirationTtl: 60 });

    return new Response(
      JSON.stringify(responseData),
      { headers: { 'Content-Type': 'application/json', 'X-Cache-Hit': 'false', ...headers } }
    );
  } catch (error) {
    throw new Error(`Failed to fetch benchmarks: ${error}`);
  }
}

async function createBenchmark(env: Env, body: unknown, headers: Record<string, string>): Promise<Response> {
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
    await env.DB.prepare(`
      INSERT INTO benchmarks (id, name, description, configuration_id, metadata)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, name, description || '', configuration_id || 'default-config', JSON.stringify(config || {})).run();

    // Invalidate benchmarks list cache
    await invalidateBenchmarksCache(env);

    return new Response(
      JSON.stringify({ id, name, description, configuration_id, status: 'pending' }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...headers }
      }
    );
  } catch (error) {
    throw new Error(`Failed to create benchmark: ${error}`);
  }
}

async function getBenchmark(env: Env, id: string, headers: Record<string, string>): Promise<Response> {
  try {
    const result = await env.DB.prepare('SELECT * FROM benchmarks WHERE id = ?').bind(id).first();

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

async function deleteBenchmark(env: Env, id: string, headers: Record<string, string>): Promise<Response> {
  try {
    await env.DB.prepare('DELETE FROM benchmarks WHERE id = ?').bind(id).run();
    // Invalidate benchmarks cache
    await invalidateBenchmarksCache(env);
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
  }>
): Promise<void> {
  if (results.length === 0) return;

  const values = results.map(r =>
    `('${r.id}', '${r.benchmark_id}', '${r.test_case_id}', '${r.test_name}', ${r.started_at}, ${r.completed_at}, '${r.status}', ${r.duration_ms}, ${r.tokens_used}, ${r.passed ? 1 : 0})`
  ).join(',');

  await env.DB.prepare(`INSERT INTO benchmark_results VALUES ${values}`).run();
}

async function executeBenchmark(env: Env, benchmarkId: string, body: unknown, headers: Record<string, string>): Promise<Response> {
  // This is a placeholder for benchmark execution
  // In a full implementation, this would trigger the actual benchmark execution process
  return new Response(
    JSON.stringify({
      message: 'Benchmark execution triggered',
      benchmark_id: benchmarkId,
      status: 'triggered'
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

async function getResults(env: Env, url: URL, headers: Record<string, string>): Promise<Response> {
  const benchmarkId = url.searchParams.get('benchmark_id');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM benchmark_results';
  const params: any[] = [];

  if (benchmarkId) {
    query += ' WHERE benchmark_id = ?';
    params.push(benchmarkId);
  }

  query += ' ORDER BY started_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    const results = await env.DB.prepare(query).bind(...params).all();

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

async function getResult(env: Env, id: string, headers: Record<string, string>): Promise<Response> {
  try {
    const result = await env.DB.prepare('SELECT * FROM benchmark_results WHERE id = ?').bind(id).first();

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

async function getConfigurations(env: Env, headers: Record<string, string>): Promise<Response> {
  const cacheKey = 'configs:list';

  // Check KV cache (5 minute TTL)
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Cache-Hit': 'true', ...headers }
    });
  }

  try {
    const results = await env.DB.prepare('SELECT * FROM configurations ORDER BY created_at DESC').all();

    const responseData = JSON.stringify({ data: results.results });

    // Cache for 5 minutes
    await env.CACHE.put(cacheKey, responseData, { expirationTtl: 300 });

    return new Response(
      responseData,
      { headers: { 'Content-Type': 'application/json', 'X-Cache-Hit': 'false', ...headers } }
    );
  } catch (error) {
    throw new Error(`Failed to fetch configurations: ${error}`);
  }
}

async function createConfiguration(env: Env, body: unknown, headers: Record<string, string>): Promise<Response> {
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
    await env.DB.prepare(`
      INSERT INTO configurations (id, name, description, is_public, config)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, name, description || '', is_public || false, JSON.stringify(config)).run();

    // Invalidate configurations cache
    await env.CACHE.delete('configs:list');

    return new Response(
      JSON.stringify({ id, name, description, is_public, config }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...headers }
      }
    );
  } catch (error) {
    throw new Error(`Failed to create configuration: ${error}`);
  }
}

async function getConfiguration(env: Env, id: string, headers: Record<string, string>): Promise<Response> {
  try {
    const result = await env.DB.prepare('SELECT * FROM configurations WHERE id = ?').bind(id).first();

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
    const results = await env.DB.prepare(query).bind(...params).all();

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