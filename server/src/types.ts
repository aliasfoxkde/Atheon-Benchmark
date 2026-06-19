/**
 * Type definitions for Cloudflare Workers environment
 */

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

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

// ============================================
// WORKER-PECIFIC TYPES
// ============================================

export interface WorkerRequest extends Request {
  env: Env;
  ctx: ExecutionContext;
}

export interface WorkerResponse extends Response {
  waitUntil(): Promise<void>;
}

// ============================================
// D1 DATABASE TYPES
// ============================================

export interface D1Result<T = any> {
  success: boolean;
  meta: {
    duration: number;
    last_row_id: number;
    changes: number;
    served_by: string;
  };
  results?: T[];
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(): Promise<T | null>;
  all<T = any>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

// ============================================
// R2 STORAGE TYPES
// ============================================

export interface R2Object {
  key: string;
  size: number;
  uploaded: Date;
  httpMetadata: {
    contentType?: string;
    cacheControlExcluded?: boolean;
    cacheControl?: string;
  };
  customMetadata?: Record<string, string>;
  range?: {
    offset: number;
    length?: number;
  };
}

export interface R2ListOptions {
  limit?: number;
  cursor?: string;
  prefix?: string;
  startAfter?: string;
  include?: Array<'httpMetadata' | 'customMetadata'>;
}

export interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
}

// ============================================
// KV NAMESPACE TYPES
// ============================================

export interface KVGetOptions {
  type?: 'text' | 'json' | 'arrayBuffer' | 'stream';
  cacheTtl?: number;
}

export interface KVPutOptions {
  expiration?: number;
  expirationTtl?: number;
  metadata?: Record<string, any>;
}

// ============================================
// UTILITY TYPES
// ============================================

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
  timestamp: string;
}

// ============================================
// BENCHMARK-SPECIFIC TYPES
// ============================================

export interface BenchmarkExecutionRequest {
  benchmark_id: string;
  test_cases?: string[];
  config?: {
    timeout?: number;
    max_retries?: number;
    parallel_tests?: number;
    claude_model?: string;
    mcp_config?: {
      enabled: boolean;
      servers: string[];
    };
    atheon_config?: {
      enabled: boolean;
      categories: string[];
    };
  };
}

export interface BenchmarkProgressUpdate {
  type: 'started' | 'progress' | 'completed' | 'failed';
  benchmark_id: string;
  current_test?: number;
  total_tests?: number;
  result?: any;
  error?: string;
  timestamp: string;
}

export interface StreamMessage {
  event: string;
  data: any;
  id?: string;
  retry?: number;
}