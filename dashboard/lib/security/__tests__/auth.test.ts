/**
 * Security/Authentication Unit Tests
 * Tests for the SecurityManager class
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  SecurityManager,
  createSecurityManager,
  DEFAULT_SECURITY_CONFIG,
  AuthConfig
} from '../auth';

/**
 * Minimal Request polyfill for jsdom test environment.
 * jsdom does not expose the Fetch API Request global by default.
 */
class MockRequest {
  private _headers: Record<string, string>;

  constructor(_url: string, init: { headers?: Record<string, string> } = {}) {
    this._headers = init.headers || {};
  }

  headers = {
    get: (name: string): string | null => {
      const lower = name.toLowerCase();
      for (const k of Object.keys(this._headers)) {
        if (k.toLowerCase() === lower) {
          return this._headers[k];
        }
      }
      return null;
    },
  };
}

describe('SecurityManager', () => {
  let manager: SecurityManager;

  beforeEach(() => {
    manager = new SecurityManager();
  });

  describe('Constructor', () => {
    it('should create with default config', () => {
      expect(manager).toBeDefined();
    });

    it('should be enabled by default', () => {
      // When enabled without valid key, checkAuth returns false
      const request = new MockRequest('http://localhost', {
        headers: { 'x-api-key': 'wrong' }
      });
      expect(manager.checkAuth(request)).toBe(false);
    });

    it('should accept custom config', () => {
      const m = new SecurityManager({
        enabled: true,
        apiKey: 'my-key',
        rateLimit: { requests: 10, window: 60 }
      });
      expect(m).toBeDefined();
    });

    it('should use env API_KEY when not provided', () => {
      const original = process.env.API_KEY;
      process.env.API_KEY = 'env-key';
      const m = new SecurityManager({ enabled: true });
      // Should use env-key - verify via checkAuth
      const request = new MockRequest('http://localhost', {
        headers: { 'x-api-key': 'env-key' }
      });
      expect(m.checkAuth(request)).toBe(true);
      process.env.API_KEY = original;
    });
  });

  describe('checkAuth', () => {
    it('should return true when disabled', () => {
      const m = new SecurityManager({ enabled: false });
      const request = new MockRequest('http://localhost');
      expect(m.checkAuth(request)).toBe(true);
    });

    it('should validate x-api-key header when enabled', () => {
      const m = new SecurityManager({ enabled: true, apiKey: 'secret-key' });
      const request = new MockRequest('http://localhost', {
        headers: { 'x-api-key': 'secret-key' }
      });
      expect(m.checkAuth(request)).toBe(true);
    });

    it('should reject wrong x-api-key when enabled', () => {
      const m = new SecurityManager({ enabled: true, apiKey: 'secret-key' });
      const request = new MockRequest('http://localhost', {
        headers: { 'x-api-key': 'wrong-key' }
      });
      expect(m.checkAuth(request)).toBe(false);
    });

    it('should validate Bearer token in authorization header', () => {
      const m = new SecurityManager({ enabled: true, apiKey: 'bearer-key' });
      const request = new MockRequest('http://localhost', {
        headers: { 'authorization': 'Bearer bearer-key' }
      });
      expect(m.checkAuth(request)).toBe(true);
    });

    it('should reject non-Bearer authorization', () => {
      const m = new SecurityManager({ enabled: true, apiKey: 'bearer-key' });
      const request = new MockRequest('http://localhost', {
        headers: { 'authorization': 'Basic dXNlcjpwYXNz' }
      });
      expect(m.checkAuth(request)).toBe(false);
    });

    it('should reject when no credentials provided', () => {
      const m = new SecurityManager({ enabled: true, apiKey: 'key' });
      const request = new MockRequest('http://localhost');
      expect(m.checkAuth(request)).toBe(false);
    });
  });

  describe('checkRateLimit', () => {
    it('should return allowed when disabled', () => {
      const m = new SecurityManager({ enabled: false });
      const result = m.checkRateLimit('client-1');
      expect(result.allowed).toBe(true);
    });

    it('should allow first request', () => {
      const m = new SecurityManager({
        enabled: true,
        rateLimit: { requests: 5, window: 60 }
      });
      const result = m.checkRateLimit('client-1');
      expect(result.allowed).toBe(true);
    });

    it('should block after limit exceeded', () => {
      const m = new SecurityManager({
        enabled: true,
        rateLimit: { requests: 2, window: 60 }
      });
      m.checkRateLimit('client-1');
      m.checkRateLimit('client-1');
      const result = m.checkRateLimit('client-1');
      expect(result.allowed).toBe(false);
      expect(result.resetTime).toBeDefined();
    });

    it('should reset after window expires', () => {
      const m = new SecurityManager({
        enabled: true,
        rateLimit: { requests: 1, window: 1 } // 1 second window
      });
      m.checkRateLimit('client-1');
      const blocked = m.checkRateLimit('client-1');
      expect(blocked.allowed).toBe(false);

      // Wait for window to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const afterReset = m.checkRateLimit('client-1');
          expect(afterReset.allowed).toBe(true);
          resolve();
        }, 1100);
      });
    });

    it('should track different identifiers separately', () => {
      const m = new SecurityManager({
        enabled: true,
        rateLimit: { requests: 1, window: 60 }
      });
      m.checkRateLimit('client-1');
      const result1 = m.checkRateLimit('client-1');
      const result2 = m.checkRateLimit('client-2');
      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('getClientIdentifier', () => {
    it('should use x-api-key when present', () => {
      const request = new MockRequest('http://localhost', {
        headers: { 'x-api-key': 'test-key' }
      });
      const id = manager.getClientIdentifier(request);
      expect(id).toBe('key:test-key');
    });

    it('should fall back to IP when no x-api-key', () => {
      const request = new MockRequest('http://localhost');
      const id = manager.getClientIdentifier(request);
      expect(id).toMatch(/^ip:/);
    });
  });

  describe('validateOrigin', () => {
    it('should allow null origin', () => {
      expect(manager.validateOrigin(null)).toBe(true);
    });

    it('should allow origins in allowed list', () => {
      const m = new SecurityManager({
        allowedOrigins: ['http://localhost:3000', 'http://example.com']
      });
      expect(m.validateOrigin('http://localhost:3000')).toBe(true);
      expect(m.validateOrigin('http://example.com')).toBe(true);
    });

    it('should reject origins not in allowed list', () => {
      const m = new SecurityManager({
        allowedOrigins: ['http://localhost:3000']
      });
      expect(m.validateOrigin('http://evil.com')).toBe(false);
    });

    it('should allow all when no allowed origins configured', () => {
      const m = new SecurityManager({ allowedOrigins: [] });
      expect(m.validateOrigin('http://anywhere.com')).toBe(true);
    });

    it('should support wildcard patterns', () => {
      const m = new SecurityManager({
        allowedOrigins: ['http://*.example.com']
      });
      expect(m.validateOrigin('http://app.example.com')).toBe(true);
      expect(m.validateOrigin('http://other.com')).toBe(false);
    });
  });

  describe('createSecurityHeaders', () => {
    it('should return security headers', () => {
      const headers = manager.createSecurityHeaders();
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('validateInput', () => {
    it('should validate short strings', () => {
      expect(manager.validateInput('short text')).toBe(true);
    });

    it('should reject overly long strings', () => {
      const longText = 'a'.repeat(20000);
      expect(manager.validateInput(longText, 1000)).toBe(false);
    });

    it('should detect script tags', () => {
      expect(manager.validateInput('<script>alert("x")</script>')).toBe(false);
    });

    it('should detect javascript: protocol', () => {
      expect(manager.validateInput('javascript:alert(1)')).toBe(false);
    });

    it('should detect event handlers', () => {
      expect(manager.validateInput('<div onclick="hack()">')).toBe(false);
    });

    it('should detect iframe tags', () => {
      expect(manager.validateInput('<iframe src="evil.com"></iframe>')).toBe(false);
    });

    it('should detect object tags', () => {
      expect(manager.validateInput('<object data="evil"></object>')).toBe(false);
    });

    it('should detect embed tags', () => {
      expect(manager.validateInput('<embed src="evil"></embed>')).toBe(false);
    });

    it('should validate objects by JSON length', () => {
      const small = { a: 1, b: 2 };
      expect(manager.validateInput(small, 100)).toBe(true);
    });

    it('should reject objects that exceed max length when JSONified', () => {
      const big = { data: 'x'.repeat(100) };
      expect(manager.validateInput(big, 50)).toBe(false);
    });

    it('should allow other types', () => {
      expect(manager.validateInput(42)).toBe(true);
      expect(manager.validateInput(null)).toBe(true);
      expect(manager.validateInput(undefined)).toBe(true);
    });
  });

  describe('sanitizeError', () => {
    it('should remove file paths from error messages', () => {
      const error = new Error('Failed loading /home/user/secret/file.txt due to error');
      const sanitized = manager.sanitizeError(error);
      expect(sanitized).not.toContain('/home/user');
      expect(sanitized).not.toContain('secret');
    });

    it('should remove stack traces', () => {
      const error = new Error('Error at Object.<anonymous> (/path/to/file.ts:10:5)');
      const sanitized = manager.sanitizeError(error);
      expect(sanitized).not.toContain('Object.<anonymous>');
    });

    it('should redact passwords', () => {
      const error = new Error('Login failed password=hunter2');
      const sanitized = manager.sanitizeError(error);
      expect(sanitized).toContain('[REDACTED]');
      expect(sanitized).not.toContain('hunter2');
    });

    it('should limit length to 200 chars', () => {
      const long = 'a'.repeat(500);
      const error = new Error(long);
      const sanitized = manager.sanitizeError(error);
      expect(sanitized.length).toBeLessThanOrEqual(200);
    });
  });
});

describe('createSecurityManager', () => {
  it('should create SecurityManager instance', () => {
    const m = createSecurityManager();
    expect(m).toBeInstanceOf(SecurityManager);
  });

  it('should accept config', () => {
    const m = createSecurityManager({ enabled: true });
    expect(m).toBeInstanceOf(SecurityManager);
  });
});

describe('DEFAULT_SECURITY_CONFIG', () => {
  it('should be disabled by default', () => {
    expect(DEFAULT_SECURITY_CONFIG.enabled).toBe(false);
  });

  it('should have rate limit config', () => {
    expect(DEFAULT_SECURITY_CONFIG.rateLimit).toBeDefined();
    expect(DEFAULT_SECURITY_CONFIG.rateLimit?.requests).toBeGreaterThan(0);
  });

  it('should have allowed origins', () => {
    expect(DEFAULT_SECURITY_CONFIG.allowedOrigins).toBeDefined();
    expect(Array.isArray(DEFAULT_SECURITY_CONFIG.allowedOrigins)).toBe(true);
  });
});