/**
 * Logging Utility
 * Centralized logging with environment-based log levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const CURRENT_LEVEL = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;

export const logger = {
  debug: (...args: unknown[]) => {
    if (CURRENT_LEVEL <= LogLevel.DEBUG) {
      console.debug('[DEBUG]', ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (CURRENT_LEVEL <= LogLevel.INFO) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (CURRENT_LEVEL <= LogLevel.WARN) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (CURRENT_LEVEL <= LogLevel.ERROR) {
      console.error('[ERROR]', ...args);
    }
  },
};
