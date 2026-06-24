/**
 * Authentication and Security Module
 * Basic authentication and rate limiting for API endpoints
 */

export interface AuthConfig {
  enabled: boolean;
  apiKey?: string;
  rateLimit?: {
    requests: number;
    window: number; // seconds
  };
  allowedOrigins?: string[];
}

export interface RateLimitInfo {
  count: number;
  resetTime: number;
}

/**
 * Simple authentication and rate limiting manager
 */
export class SecurityManager {
  private config: AuthConfig;
  private rateLimitMap: Map<string, RateLimitInfo> = new Map();

  constructor(config: Partial<AuthConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true, // Enabled by default
      apiKey: config.apiKey || process.env.API_KEY,
      rateLimit: config.rateLimit || {
        requests: 100,
        window: 60, // 100 requests per minute
      },
      allowedOrigins: config.allowedOrigins || process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    };
  }

  /**
   * Check authentication credentials
   */
  checkAuth(request: Request): boolean {
    if (!this.config.enabled) return true;

    const authHeader = request.headers.get('authorization');
    const apiKey = request.headers.get('x-api-key');

    // Check API key from headers
    if (this.config.apiKey && (apiKey === this.config.apiKey || this.extractBearerToken(authHeader) === this.config.apiKey)) {
      return true;
    }

    return false;
  }

  /**
   * Extract bearer token from authorization header
   */
  private extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    }

    return null;
  }

  /**
   * Check rate limits
   */
  checkRateLimit(identifier: string): { allowed: boolean; resetTime?: number } {
    if (!this.config.enabled || !this.config.rateLimit) {
      return { allowed: true };
    }

    const now = Date.now();
    const window = this.config.rateLimit.window * 1000;
    const limitInfo = this.rateLimitMap.get(identifier);

    // Reset if window expired
    if (!limitInfo || now > limitInfo.resetTime) {
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + window,
      });
      return { allowed: true };
    }

    // Check if limit exceeded
    if (limitInfo.count >= this.config.rateLimit.requests) {
      return {
        allowed: false,
        resetTime: limitInfo.resetTime,
      };
    }

    // Increment counter
    limitInfo.count++;
    return { allowed: true };
  }

  /**
   * Get client identifier for rate limiting
   */
  getClientIdentifier(request: Request): string {
    // Use API key if provided
    const apiKey = request.headers.get('x-api-key');
    if (apiKey) return `key:${apiKey}`;

    // Extract real IP from Cloudflare/forwarded headers
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const xRealIp = request.headers.get('x-real-ip');

    const ip = cfConnectingIp || (xForwardedFor?.split(',')[0]) || xRealIp || 'unknown';
    return `ip:${ip}`;
  }

  /**
   * Validate CORS origin
   * SECURITY: Uses anchored regex to prevent bypass via crafted origins like
   * 'evil.com.https://legitimate.com' which could match '*.legitimate.com'
   */
  validateOrigin(origin: string | null): boolean {
    if (!origin) return true; // Allow same-origin requests

    if (!this.config.allowedOrigins || this.config.allowedOrigins.length === 0) {
      return true; // Allow all origins if not configured
    }

    return this.config.allowedOrigins.some(allowed => {
      // Exact match (most common case)
      if (origin === allowed) return true;

      // For wildcard patterns, use anchored regex to prevent bypass
      if (allowed.includes('*')) {
        // Escape regex special characters except *, then anchor the match
        const pattern = '^' + allowed.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace('*', '.*') + '$';
        try {
          return new RegExp(pattern).test(origin);
        } catch {
          return false;
        }
      }

      return false;
    });
  }

  /**
   * Create security headers
   */
  createSecurityHeaders(): HeadersInit {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
  }

  /**
   * Validate request input
   */
  validateInput(data: any, maxLength: number = 10000): boolean {
    if (typeof data === 'string') {
      return data.length <= maxLength && !this.containsMaliciousPatterns(data);
    }

    if (typeof data === 'object' && data !== null) {
      return JSON.stringify(data).length <= maxLength;
    }

    return true;
  }

  /**
   * Check for malicious patterns in input
   */
  private containsMaliciousPatterns(input: string): boolean {
    const maliciousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers like onclick=
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    return maliciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize error messages
   */
  sanitizeError(error: Error): string {
    // Remove potentially sensitive information from errors
    return error.message
      .replace(/\/[^\s]*\/[^\s]*/g, '[PATH]') // Remove file paths
      .replace(/at\s+.*/g, 'at [STACK]') // Remove stack traces
      .replace(/password.*/gi, '[REDACTED]') // Remove passwords
      .substring(0, 200); // Limit length
  }
}

/**
 * Create security manager instance
 */
export function createSecurityManager(config?: Partial<AuthConfig>): SecurityManager {
  return new SecurityManager(config);
}

/**
 * Default security configuration
 */
export const DEFAULT_SECURITY_CONFIG: AuthConfig = {
  enabled: false, // Disabled by default
  rateLimit: {
    requests: 100,
    window: 60,
  },
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
};