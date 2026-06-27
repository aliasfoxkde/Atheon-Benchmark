import { logger } from '../logging';
/**
 * SSO/SAML Authentication Infrastructure
 * Support for enterprise SSO authentication providers
 */

import type { User } from './types';

export type SSOProvider =
  | 'google'
  | 'github'
  | 'microsoft'
  | 'okta'
  | 'auth0'
  | 'keycloak'
  | 'saml';

export interface SSOConfig {
  provider: SSOProvider;
  clientId: string;
  clientSecret?: string;
  issuer?: string;       // For OIDC
  metadataUrl?: string;  // For SAML
  redirectUri: string;
  scopes?: string[];
}

export interface SSOTokenResponse {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface SAMLAssertion {
  nameID: string;
  nameIDFormat: string;
  sessionIndex?: string;
  attributes: Record<string, string[]>;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  provider: SSOProvider;
  providerId: string;
  groups?: string[];
  roles?: string[];
}

/**
 * Base SSO Provider class
 */
export abstract class SSOProviderClient {
  abstract readonly provider: SSOProvider;
  protected config: SSOConfig | null = null;

  abstract initialize(config: SSOConfig): void;
  abstract getAuthorizationUrl(state: string): string;
  abstract exchangeCode(code: string): Promise<SSOTokenResponse>;
  abstract getUserProfile(accessToken: string): Promise<UserProfile>;
  abstract refreshToken(refreshToken: string): Promise<SSOTokenResponse>;
  abstract logout(accessToken: string): Promise<void>;

  isConfigured(): boolean {
    return this.config !== null;
  }

  protected getCallbackUrl(): string {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/auth/callback/${this.provider}`;
  }
}

/**
 * Google OAuth Provider
 */
export class GoogleSSOProvider extends SSOProviderClient {
  readonly provider: SSOProvider = 'google';

  initialize(config: SSOConfig): void {
    this.config = {
      ...config,
      redirectUri: config.redirectUri || this.getCallbackUrl(),
      scopes: config.scopes || ['openid', 'profile', 'email'],
    };
  }

  getAuthorizationUrl(state: string): string {
    if (!this.config) throw new Error('Provider not configured');

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes!.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async exchangeCode(code: string): Promise<SSOTokenResponse> {
    if (!this.config) throw new Error('Provider not configured');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    return response.json();
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user profile: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
      provider: 'google',
      providerId: data.id,
    };
  }

  async refreshToken(refreshToken: string): Promise<SSOTokenResponse> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config!.clientId,
        client_secret: this.config!.clientSecret || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    return response.json();
  }

  async logout(accessToken: string): Promise<void> {
    // Google doesn't support token revocation via user logout
    logger.debug('[Google SSO] Logout called');
  }
}

/**
 * GitHub OAuth Provider
 */
export class GitHubSSOProvider extends SSOProviderClient {
  readonly provider: SSOProvider = 'github';

  initialize(config: SSOConfig): void {
    this.config = {
      ...config,
      redirectUri: config.redirectUri || this.getCallbackUrl(),
      scopes: config.scopes || ['read:user', 'user:email'],
    };
  }

  getAuthorizationUrl(state: string): string {
    if (!this.config) throw new Error('Provider not configured');

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes!.join(' '),
      state,
    });

    return `https://github.com/login/oauth/authorize?${params}`;
  }

  async exchangeCode(code: string): Promise<SSOTokenResponse> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: JSON.stringify({
        client_id: this.config!.clientId,
        client_secret: this.config!.clientSecret,
        code,
        redirect_uri: this.config!.redirectUri,
      }),
    });

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in || 0,
      tokenType: data.token_type || 'Bearer',
    };
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    const [userResponse, emailsResponse] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ]);

    const userData = await userResponse.json();
    const emails = await emailsResponse.json();
    const primaryEmail = emails.find((e: any) => e.primary && e.verified)?.email || emails[0]?.email;

    return {
      id: String(userData.id),
      email: primaryEmail,
      name: userData.name,
      picture: userData.avatar_url,
      provider: 'github',
      providerId: String(userData.id),
    };
  }

  async refreshToken(refreshToken: string): Promise<SSOTokenResponse> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: JSON.stringify({
        client_id: this.config!.clientId,
        client_secret: this.config!.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    return response.json();
  }

  async logout(accessToken: string): Promise<void> {
    // GitHub doesn't support programmatic logout
    logger.debug('[GitHub SSO] Logout called');
  }
}

/**
 * Microsoft/Entra ID OAuth Provider
 */
export class MicrosoftSSOProvider extends SSOProviderClient {
  readonly provider: SSOProvider = 'microsoft';

  initialize(config: SSOConfig): void {
    this.config = {
      ...config,
      redirectUri: config.redirectUri || this.getCallbackUrl(),
      scopes: config.scopes || ['openid', 'profile', 'email', 'User.Read'],
    };
  }

  getAuthorizationUrl(state: string): string {
    if (!this.config) throw new Error('Provider not configured');

    const tenantId = this.config.issuer?.split('/').pop() || 'common';

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes!.join(' '),
      state,
      response_mode: 'query',
    });

    return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params}`;
  }

  async exchangeCode(code: string): Promise<SSOTokenResponse> {
    if (!this.config) throw new Error('Provider not configured');

    const tenantId = this.config.issuer?.split('/').pop() || 'common';

    const response = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret || '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      }
    );

    return response.json();
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();

    return {
      id: data.id,
      email: data.mail || data.userPrincipalName,
      name: data.displayName,
      provider: 'microsoft',
      providerId: data.id,
    };
  }

  async refreshToken(refreshToken: string): Promise<SSOTokenResponse> {
    if (!this.config) throw new Error('Provider not configured');

    const tenantId = this.config.issuer?.split('/').pop() || 'common';

    const response = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      }
    );

    return response.json();
  }

  async logout(accessToken: string): Promise<void> {
    // Microsoft recommends redirecting to logout URL
    logger.debug('[Microsoft SSO] Logout called');
  }
}

/**
 * SAML Provider (generic implementation)
 */
export class SAMLSSOProvider extends SSOProviderClient {
  readonly provider: SSOProvider = 'saml';

  initialize(config: SSOConfig): void {
    if (!config.metadataUrl) {
      throw new Error('SAML metadata URL is required');
    }
    this.config = config;
  }

  getAuthorizationUrl(state: string): string {
    if (!this.config) throw new Error('Provider not configured');

    // In a real implementation, this would generate a SAML AuthnRequest
    // and return the URL with the encoded request
    const request = this.generateSAMLRequest();
    const params = new URLSearchParams({
      SAMLRequest: request,
      RelayState: state,
    });

    // The actual IdP URL would come from metadata
    return `${this.config.issuer}/sso/saml?${params}`;
  }

  private generateSAMLRequest(): string {
    // Simplified SAML request generation
    const request = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest
  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  ID="_${Math.random().toString(36).substr(2, 9)}"
  Version="2.0"
  IssueInstant="${new Date().toISOString()}"
  Destination="${this.config?.issuer}"
  AssertionConsumerServiceURL="${this.config?.redirectUri}">
</samlp:AuthnRequest>`;

    return btoa(request);
  }

  async exchangeCode(code: string): Promise<SSOTokenResponse> {
    // SAML doesn't use code exchange - it uses POST binding
    // This would be called after the IdP POSTs the SAML response
    const samlResponse = code; // In practice, this is the base64-encoded SAML response

    const response = await fetch('/api/auth/saml/assert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ SAMLResponse: samlResponse }),
    });

    return response.json();
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    const response = await fetch('/api/auth/saml/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return response.json();
  }

  async refreshToken(refreshToken: string): Promise<SSOTokenResponse> {
    // SAML typically uses different session management
    throw new Error('SAML does not support token refresh');
  }

  async logout(accessToken: string): Promise<void> {
    await fetch('/api/auth/saml/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
}

/**
 * SSO Manager - manages all SSO providers
 */
export class SSOManager {
  private providers: Map<SSOProvider, SSOProviderClient> = new Map();
  private currentProvider: SSOProvider | null = null;

  constructor() {
    // Register default providers
    this.registerProvider(new GoogleSSOProvider());
    this.registerProvider(new GitHubSSOProvider());
    this.registerProvider(new MicrosoftSSOProvider());
    this.registerProvider(new SAMLSSOProvider());
  }

  /**
   * Register an SSO provider
   */
  registerProvider(provider: SSOProviderClient): void {
    this.providers.set(provider.provider, provider);
  }

  /**
   * Get a provider
   */
  getProvider(name: SSOProvider): SSOProviderClient | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all available providers
   */
  getAvailableProviders(): SSOProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Initialize a provider with config
   */
  configureProvider(provider: SSOProvider, config: SSOConfig): void {
    const providerClient = this.providers.get(provider);
    if (!providerClient) {
      throw new Error(`Unknown SSO provider: ${provider}`);
    }
    providerClient.initialize(config);
    this.currentProvider = provider;
  }

  /**
   * Get authorization URL for current provider
   */
  getAuthorizationUrl(state?: string): string {
    if (!this.currentProvider) {
      throw new Error('No SSO provider configured');
    }
    const provider = this.providers.get(this.currentProvider);
    return provider!.getAuthorizationUrl(state || this.generateState());
  }

  /**
   * Begin OAuth authentication flow
   * Generates and stores state for CSRF protection, returns authorization URL
   */
  beginAuth(): string {
    if (!this.currentProvider) {
      throw new Error('No SSO provider configured');
    }
    const state = this.generateState();
    this.storeState(state);
    return this.getAuthorizationUrl(state);
  }

  /**
   * Handle OAuth callback
   * @param code - Authorization code from provider
   * @param state - State parameter from callback (required for CSRF validation)
   */
  async handleCallback(code: string, state: string): Promise<UserProfile> {
    if (!this.currentProvider) {
      throw new Error('No SSO provider configured');
    }

    // Validate state to prevent CSRF attacks
    if (!this.validateState(state)) {
      throw new Error('OAuth state validation failed - possible CSRF attack');
    }

    const provider = this.providers.get(this.currentProvider)!;
    const tokens = await provider.exchangeCode(code);
    const profile = await provider.getUserProfile(tokens.accessToken);

    // Clear state after successful validation
    this.clearState();

    // Store tokens
    this.storeTokens(this.currentProvider, tokens);

    return profile;
  }

  /**
   * Generate random state parameter for OAuth security
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Store OAuth state for CSRF validation
   */
  private storeState(state: string): void {
    if (typeof window === 'undefined') return;
    const stateKey = `atheon-sso-state-${this.currentProvider}`;
    sessionStorage.setItem(stateKey, state);
  }

  /**
   * Validate OAuth state to prevent CSRF attacks
   */
  private validateState(state: string): boolean {
    if (typeof window === 'undefined') return false;
    const stateKey = `atheon-sso-state-${this.currentProvider}`;
    const storedState = sessionStorage.getItem(stateKey);
    if (!storedState) return false;
    // Constant-time comparison to prevent timing attacks
    if (storedState.length !== state.length) return false;
    let result = 0;
    for (let i = 0; i < storedState.length; i++) {
      result |= storedState.charCodeAt(i) ^ state.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * Clear stored OAuth state
   */
  private clearState(): void {
    if (typeof window === 'undefined') return;
    const stateKey = `atheon-sso-state-${this.currentProvider}`;
    sessionStorage.removeItem(stateKey);
  }

  /**
   * Store tokens securely
   */
  private storeTokens(provider: SSOProvider, tokens: SSOTokenResponse): void {
    if (typeof window === 'undefined') return;

    const storageKey = `atheon-sso-tokens-${provider}`;
    const tokenData = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    };

    sessionStorage.setItem(storageKey, JSON.stringify(tokenData));
  }

  /**
   * Get stored tokens
   */
  getStoredTokens(provider: SSOProvider): SSOTokenResponse | null {
    if (typeof window === 'undefined') return null;

    const storageKey = `atheon-sso-tokens-${provider}`;
    const stored = sessionStorage.getItem(storageKey);

    if (!stored) return null;

    try {
      const tokenData = JSON.parse(stored);

      // Check expiration
      if (tokenData.expiresAt < Date.now()) {
        sessionStorage.removeItem(storageKey);
        return null;
      }

      return {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresIn: Math.floor((tokenData.expiresAt - Date.now()) / 1000),
        tokenType: 'Bearer',
      };
    } catch {
      return null;
    }
  }

  /**
   * Logout from current provider
   */
  async logout(): Promise<void> {
    if (this.currentProvider) {
      const provider = this.providers.get(this.currentProvider);
      if (provider) {
        const tokens = this.getStoredTokens(this.currentProvider);
        if (tokens?.accessToken) {
          await provider.logout(tokens.accessToken);
        }
      }

      // Clear stored tokens
      sessionStorage.removeItem(`atheon-sso-tokens-${this.currentProvider}`);
    }
  }
}

// Singleton
let ssoManager: SSOManager | null = null;

export function getSSOManager(): SSOManager {
  if (!ssoManager) {
    ssoManager = new SSOManager();
  }
  return ssoManager;
}

/**
 * Configure SSO providers from environment
 */
export function configureSSOFromEnv(): void {
  const manager = getSSOManager();

  // Google
  if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    manager.configureProvider('google', {
      provider: 'google',
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback/google`,
    });
  }

  // GitHub
  if (process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID) {
    manager.configureProvider('github', {
      provider: 'github',
      clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      redirectUri: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback/github`,
    });
  }

  // Microsoft
  if (process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID) {
    manager.configureProvider('microsoft', {
      provider: 'microsoft',
      clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/v2.0`,
      redirectUri: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback/microsoft`,
    });
  }
}