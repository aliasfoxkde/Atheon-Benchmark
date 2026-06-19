/**
 * Jest Configuration
 * Configuration for comprehensive testing framework
 */

module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          jsx: 'react',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/__tests__/**/*.spec.ts',
    '**/__tests__/**/*.spec.tsx',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/out/',
    '/e2e/',
  ],
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/out/**',
    '!**/__tests__/**',
    '!**/dist/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  verbose: true,
  testTimeout: 10000,
  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/__tests__/(unit|components|lib)/**/*.test.{ts,tsx}'],
      testEnvironment: 'jsdom',
    },
    {
      displayName: 'smoke',
      testMatch: ['**/__tests__/smoke/**/*.test.{ts,tsx}'],
      testEnvironment: 'jsdom',
    },
    {
      displayName: 'regression',
      testMatch: ['**/__tests__/regression/**/*.test.{ts,tsx}'],
      testEnvironment: 'jsdom',
    },
  ],
};