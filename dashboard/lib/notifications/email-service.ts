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
    console.warn('EmailService.send() should be called via /api/email/send proxy in production');
    return this.send(options);
  }
   */
  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config) {
      // Try to send via API endpoint
      return this.sendViaAPI(options);
    }

    switch (this.config.provider) {
      case 'mock':
        return this.sendMock(options);

      case 'sendgrid':
        return this.sendViaSendGrid(options);

      case 'resend':
        return this.sendViaResend(options);

      default:
        return { success: false, error: 'Unknown email provider' };
    }
  }

  /**
   * Send via backend API
   */
  private async sendViaAPI(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch('/api/v1/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, messageId: data.messageId };
      }

      return { success: false, error: `API error: ${response.status}` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  /**
   * Send via SendGrid API
   */
  private async sendViaSendGrid(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config?.apiKey) {
      return { success: false, error: 'SendGrid API key not configured' };
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const content = this.renderTemplate(options.template, options.templateData);

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: recipients.map(r => ({ to: [r] })),
          from: { email: this.config.fromEmail, name: this.config.fromName },
          reply_to: options.replyTo || this.config.replyTo,
          subject: options.subject,
          content: [{ type: 'text/html', value: content }],
        }),
      });

      if (response.ok) {
        const messageId = response.headers.get('X-Message-Id') || undefined;
        return { success: true, messageId };
      }

      return { success: false, error: `SendGrid error: ${response.status}` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  /**
   * Send via Resend API
   */
  private async sendViaResend(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config?.apiKey) {
      return { success: false, error: 'Resend API key not configured' };
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const content = this.renderTemplate(options.template, options.templateData);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${this.config.fromName || 'Atheon'} <${this.config.fromEmail}>`,
          to: recipients.map(r => r.email),
          reply_to: options.replyTo || this.config.replyTo,
          subject: options.subject,
          html: content,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, messageId: data.id };
      }

      return { success: false, error: `Resend error: ${response.status}` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  /**
   * Mock send for testing
   */
  private sendMock(options: EmailOptions): { success: boolean; messageId: string } {
    console.log('[EmailService] Mock email sent:', options);
    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  /**
   * Render email template
   */
  private renderTemplate(template: EmailTemplate, data?: Record<string, any>): string {
    const templates: Record<EmailTemplate, string> = {
      benchmark_complete: this.getBenchmarkCompleteTemplate(data),
      benchmark_failed: this.getBenchmarkFailedTemplate(data),
      new_result_available: this.getNewResultTemplate(data),
      weekly_digest: this.getWeeklyDigestTemplate(data),
      account_created: this.getAccountCreatedTemplate(data),
    };

    return templates[template];
  }

  private getBenchmarkCompleteTemplate(data?: Record<string, any>): string {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">✅ Benchmark Complete</h1>
        <p>Your benchmark run has completed successfully.</p>
        ${data?.benchmarkId ? `<p><strong>Benchmark ID:</strong> ${data.benchmarkId}</p>` : ''}
        ${data?.resultsUrl ? `<p><a href="${data.resultsUrl}">View Results</a></p>` : ''}
        <p style="color: #666; font-size: 12px;">Powered by Atheon Benchmark</p>
      </div>
    `;
  }

  private getBenchmarkFailedTemplate(data?: Record<string, any>): string {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">❌ Benchmark Failed</h1>
        <p>Your benchmark run encountered an error.</p>
        ${data?.error ? `<p><strong>Error:</strong> ${data.error}</p>` : ''}
        ${data?.logsUrl ? `<p><a href="${data.logsUrl}">View Logs</a></p>` : ''}
        <p style="color: #666; font-size: 12px;">Powered by Atheon Benchmark</p>
      </div>
    `;
  }

  private getNewResultTemplate(data?: Record<string, any>): string {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">🆕 New Benchmark Results</h1>
        <p>New benchmark results are available for review.</p>
        ${data?.systemName ? `<p><strong>System:</strong> ${data.systemName}</p>` : ''}
        ${data?.resultsUrl ? `<p><a href="${data.resultsUrl}">View Results</a></p>` : ''}
        <p style="color: #666; font-size: 12px;">Powered by Atheon Benchmark</p>
      </div>
    `;
  }

  private getWeeklyDigestTemplate(data?: Record<string, any>): string {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">📊 Weekly Benchmark Digest</h1>
        <p>Here's your weekly benchmark summary.</p>
        ${data?.totalBenchmarks ? `<p><strong>Total Benchmarks:</strong> ${data.totalBenchmarks}</p>` : ''}
        ${data?.avgPassRate ? `<p><strong>Average Pass Rate:</strong> ${data.avgPassRate}%</p>` : ''}
        ${data?.topSystems ? `<p><strong>Top Systems:</strong></p><ul>${data.topSystems.map((s: string) => `<li>${s}</li>`).join('')}</ul>` : ''}
        ${data?.dashboardUrl ? `<p><a href="${data.dashboardUrl}">View Dashboard</a></p>` : ''}
        <p style="color: #666; font-size: 12px;">Powered by Atheon Benchmark</p>
      </div>
    `;
  }

  private getAccountCreatedTemplate(data?: Record<string, any>): string {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">👋 Welcome to Atheon Benchmark</h1>
        <p>Your account has been created successfully.</p>
        ${data?.email ? `<p><strong>Email:</strong> ${data.email}</p>` : ''}
        ${data?.gettingStartedUrl ? `<p><a href="${data.gettingStartedUrl}">Get Started</a></p>` : ''}
        <p style="color: #666; font-size: 12px;">Powered by Atheon Benchmark</p>
      </div>
    `;
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