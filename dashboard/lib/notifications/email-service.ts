import { logger } from '../logging';
/**
 * Email Notification Service
 * Handles email notifications for benchmark events
 *
 * SECURITY: This service proxies to server-side routes (Cloudflare Workers)
 * to avoid exposing API keys in the browser.
 *
 * In production, email sending should be handled by:
 * 1. Cloudflare Worker route that owns the SendGrid/Resend secret
 * 2. The client only sends recipient + template data, never the API key
 */

export type EmailTemplate =
  | 'benchmark_complete'
  | 'benchmark_failed'
  | 'new_result_available'
  | 'weekly_digest'
  | 'account_created';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailOptions {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  template: EmailTemplate;
  templateData?: Record<string, any>;
  replyTo?: string;
}

export interface EmailConfig {
  provider: 'sendgrid' | 'resend' | 'smtp' | 'mock';
  // SECURITY: apiKey is now handled server-side only
  // Client should call /api/email/send which proxies to the provider
  apiKey?: never; // Explicitly not allowed in browser
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  // Server-side proxy endpoint
  proxyEndpoint?: string;
}

const EMAIL_PROXY_ENDPOINT = '/api/email/send';

/**
 * Email Service Client
 * SECURITY: No secrets stored in browser localStorage
 */
export class EmailService {
  private config: EmailConfig | null;
  private proxyEndpoint: string;

  constructor() {
    this.config = null;
    this.proxyEndpoint = EMAIL_PROXY_ENDPOINT;
  }

  /**
   * Configure email service - only stores non-sensitive config
   * SECURITY: API keys must be provided server-side via environment
   */
  configure(config: Omit<EmailConfig, 'apiKey'>): void {
    this.config = { ...config, apiKey: undefined };
    this.proxyEndpoint = config.proxyEndpoint || EMAIL_PROXY_ENDPOINT;
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return this.config !== null && this.config.provider !== 'mock';
  }

  /**
   * Send an email via server-side proxy
   * SECURITY: Never sends API key to browser
   */
  async send(options: EmailOptions): Promise<{ success: boolean; message?: string }> {
    if (!this.isConfigured()) {
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const response = await fetch(this.proxyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: options.to,
          subject: options.subject,
          template: options.template,
          templateData: options.templateData,
          replyTo: options.replyTo,
          provider: this.config?.provider,
        }),
      });

      if (!response.ok) {
        return { success: false, message: `HTTP ${response.status}` };
      }

      return { success: true };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * @deprecated Use server-side proxy instead
   */
  sendDeprecated(options: EmailOptions): Promise<{ success: boolean; message?: string }> {
    logger.warn('EmailService.send() should be called via /api/email/send proxy in production');
    return this.send(options);
  }
}

// Singleton instance
let emailService: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
}

/**
 * Convenience methods for common email operations
 */
export async function notifyBenchmarkComplete(
  to: EmailRecipient | EmailRecipient[],
  benchmarkId: string,
  resultsUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return getEmailService().send({
    to,
    subject: '✅ Your Benchmark Run is Complete',
    template: 'benchmark_complete',
    templateData: { benchmarkId, resultsUrl },
  });
}

export async function notifyBenchmarkFailed(
  to: EmailRecipient | EmailRecipient[],
  benchmarkId: string,
  error: string,
  logsUrl?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return getEmailService().send({
    to,
    subject: '❌ Benchmark Run Failed',
    template: 'benchmark_failed',
    templateData: { benchmarkId, error, logsUrl },
  });
}

export async function notifyNewResults(
  to: EmailRecipient | EmailRecipient[],
  systemName: string,
  resultsUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return getEmailService().send({
    to,
    subject: '🆕 New Benchmark Results Available',
    template: 'new_result_available',
    templateData: { systemName, resultsUrl },
  });
}