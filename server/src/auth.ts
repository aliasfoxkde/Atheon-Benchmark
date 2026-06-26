/**
 * Refresh token infrastructure for authentication
 */

// Refresh token structure
export interface RefreshToken {
  tokenId: string;
  userId: string;
  organizationId: string;
  expiresAt: number; // Unix timestamp
  createdAt: number;
}

// Token generation
export function generateRefreshToken(userId: string, orgId: string): RefreshToken {
  return {
    tokenId: crypto.randomUUID(),
    userId,
    organizationId: orgId,
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    createdAt: Date.now(),
  };
}

// Token validation
export function validateRefreshToken(token: RefreshToken): boolean {
  return token.expiresAt > Date.now();
}

// Token storage key
export function getRefreshTokenKey(tokenId: string): string {
  return `refresh:${tokenId}`;
}
