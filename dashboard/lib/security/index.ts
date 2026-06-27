/**
 * Security Module - Auth, rate limiting, and security utilities
 * @description Centralized security functions for the dashboard
 */
export { SecurityManager, createSecurityManager, DEFAULT_SECURITY_CONFIG } from './auth';
export type { AuthConfig, RateLimitInfo } from './auth';
