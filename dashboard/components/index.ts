/**
 * Component Exports
 * Barrel file for clean imports
 */

// Layout Components
export { ErrorBoundary, ErrorBoundaryWrapper } from './error-boundary';
export { HealthMonitor } from './health-monitor';
export { MobileNav } from './mobile-nav';
export { ThemeProvider, useTheme } from './theme-provider';
export { ThemeToggle } from './theme-toggle';

// UI Components
export { AccessibleButton } from './accessible-button';
export { EmptyState } from './empty-state';

// Feature Components
export { BenchmarkExport } from './benchmark-export';
export { BenchmarkTrending } from './benchmark-trending';
export { KeyboardShortcutsModal } from './keyboard-shortcuts-modal';
export { KeyboardShortcutsProvider } from './keyboard-shortcuts-provider';
export { OnboardingTour } from './onboarding-tour';
export { PatternBreakdown } from './pattern-breakdown';
export { PerformanceMonitor } from './performance-monitor';
export { PWAInstallPrompt } from './pwa-install-prompt';
export { SystemComparisonModal } from './system-comparison-modal';
export { VersionComparison } from './version-comparison';

// Charts
export { PerformanceChart } from './charts/PerformanceChart';
export { PerformanceBarChart } from './charts/performance-bar-chart';
export { SpiderChart } from './charts/spider-chart';
export { TrendLineChart } from './charts/trend-line-chart';
