/**
 * Auth Module - SSO and authentication utilities
 * @description Enterprise SSO providers (Google, GitHub, Microsoft, SAML)
 */
export {
  GoogleSSOProvider,
  GitHubSSOProvider,
  MicrosoftSSOProvider,
  SAMLSSOProvider,
  SSOManager,
} from './sso';
export type {
  SSOProvider,
  SSOConfig,
  SSOTokenResponse,
} from './sso';
export type { User, Session, AuthProvider } from './types';
