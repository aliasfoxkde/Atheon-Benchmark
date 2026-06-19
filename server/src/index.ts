/**
 * Cloudflare Workers entry point for Atheon Benchmark Dashboard API
 * This worker handles API requests for benchmark execution, results retrieval, and configuration management
 */

import { Env } from './types';

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

      // CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      // Handle OPTIONS requests for CORS
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      // Health check endpoint
      if (path === '/health') {
        return healthCheck(env);
      }

      // API routes
      if (path.startsWith('/api/')) {
        return handleApiRequest(request, env, ctx, corsHeaders);
      }

      // 404 for unknown routes
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Error handling request:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
  },
};

async function healthCheck(env: Env): Promise<Response> {
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
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
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

  // Parse body for POST/PUT requests
  let body: any = null;
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
  }

  // Route handling
  switch (true) {
    // Benchmark endpoints
    case path === '/api/benchmarks' && method === 'GET':
      return getBenchmarks(env, url, corsHeaders);
    case path === '/api/benchmarks' && method === 'POST':
      return createBenchmark(env, body, corsHeaders);
    case path.match(/^\/api\/benchmarks\/[^/]+$/) && method === 'GET':
      return getBenchmark(env, path.split('/').pop()!, corsHeaders);
    case path.match(/^\/api\/benchmarks\/[^/]+$/) && method === 'DELETE':
      return deleteBenchmark(env, path.split('/').pop()!, corsHeaders);

    // Benchmark execution endpoint
    case path.match(/^\/api\/benchmarks\/[^/]+\/execute$/) && method === 'POST':
      return executeBenchmark(env, path.split('/')[3], body, corsHeaders);

    // Results endpoints
    case path === '/api/results' && method === 'GET':
      return getResults(env, url, corsHeaders);
    case path.match(/^\/api\/results\/[^/]+$/) && method === 'GET':
      return getResult(env, path.split('/').pop()!, corsHeaders);

    // Configuration endpoints
    case path === '/api/configurations' && method === 'GET':
      return getConfigurations(env, corsHeaders);
    case path === '/api/configurations' && method === 'POST':
      return createConfiguration(env, body, corsHeaders);
    case path.match(/^\/api\/configurations\/[^/]+$/) && method === 'GET':
      return getConfiguration(env, path.split('/').pop()!, corsHeaders);

    // Test cases endpoints
    case path === '/api/test-cases' && method === 'GET':
      return getTestCases(env, url, corsHeaders);
    case path === '/api/test-cases' && method === 'POST':
      return createTestCase(env, body, corsHeaders);

    default:
      return new Response(
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
}

// ============================================
// BENCHMARK ENDPOINTS
// ============================================

async function getBenchmarks(env: Env, url: URL, headers: Record<string, string>): Promise<Response> {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const status = url.searchParams.get('status');
  const offset = (page - 1) * limit;

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

    return new Response(
      JSON.stringify({
        data: results.results,
        total: countResult?.count || 0,
        page,
        limit,
        has_more: (countResult?.count || 0) > page * limit
      }),
      { headers: { 'Content-Type': 'application/json', ...headers } }
    );
  } catch (error) {
    throw new Error(`Failed to fetch benchmarks: ${error}`);
  }
}

async function createBenchmark(env: Env, body: any, headers: Record<string, string>): Promise<Response> {
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
    return new Response(null, { status: 204, headers });
  } catch (error) {
    throw new Error(`Failed to delete benchmark: ${error}`);
  }
}

async function executeBenchmark(env: Env, benchmarkId: string, body: any, headers: Record<string, string>): Promise<Response> {
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
  try {
    const results = await env.DB.prepare('SELECT * FROM configurations ORDER BY created_at DESC').all();

    return new Response(
      JSON.stringify({ data: results.results }),
      { headers: { 'Content-Type': 'application/json', ...headers } }
    );
  } catch (error) {
    throw new Error(`Failed to fetch configurations: ${error}`);
  }
}

async function createConfiguration(env: Env, body: any, headers: Record<string, string>): Promise<Response> {
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

async function createTestCase(env: Env, body: any, headers: Record<string, string>): Promise<Response> {
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