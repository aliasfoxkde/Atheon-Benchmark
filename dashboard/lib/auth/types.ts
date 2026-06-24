/**
 * Authentication Types
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: 'user' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthProvider {
  id: string;
  name: string;
  type: 'oauth' | 'saml' | 'password';
}
