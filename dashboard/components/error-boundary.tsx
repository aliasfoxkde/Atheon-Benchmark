/**
 * Error Boundary Component
 * Catches React errors and displays a fallback UI
 *
 * Sentry Integration:
 * Install: npm install @sentry/react
 * Add to layout or instrument manually with:
 *   import * as Sentry from '@sentry/react';
 *   Sentry.captureException(error, { extra: errorInfo });
 */

'use client';

import { Component, ReactNode } from 'react';
import { logger } from '@/lib/logging';

interface Props {
  children: ReactNode;
  /**
   * Optional Sentry integration flag
   * When Sentry is installed and configured, set this to true to enable error reporting
   */
  enableSentry?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });

    // Sentry integration point - uncomment when @sentry/react is installed:
    // if (this.props.enableSentry && typeof window !== 'undefined') {
    //   import('@sentry/react').then((Sentry) => {
    //     Sentry.captureException(error, {
    //       contexts: { react: { componentStack: errorInfo.componentStack } }
    //     });
    //   }).catch(() => {/* Sentry not available */});
    // }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[200px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Something went wrong
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component to use ErrorBoundary in layouts
 */
export function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
