/**
 * Internationalization (i18n) Utilities
 * Basic i18n support for Atheon Benchmark Dashboard
 *
 * Note: Full next-intl integration requires significant setup.
 * This module provides basic translation infrastructure that can be
 * extended when full i18n is needed.
 */

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

export const SUPPORTED_LOCALES: Locale[] = ['en'];
export const DEFAULT_LOCALE: Locale = 'en';

export interface TranslationKeys {
  // Navigation
  'nav.home': string;
  'nav.benchmark': string;
  'nav.results': string;
  'nav.status': string;
  'nav.docs': string;

  // Home page
  'home.title': string;
  'home.subtitle': string;
  'home.description': string;
  'home.viewResults': string;
  'home.downloadRunner': string;

  // Benchmark page
  'benchmark.title': string;
  'benchmark.start': string;
  'benchmark.running': string;
  'benchmark.complete': string;

  // Results page
  'results.title': string;
  'results.noResults': string;
  'results.download': string;

  // Status page
  'status.title': string;
  'status.allOperational': string;
  'status.partialOutage': string;
  'status.disruption': string;

  // Common
  'common.loading': string;
  'common.error': string;
  'common.retry': string;
  'common.close': string;
  'common.save': string;
  'common.cancel': string;
}

export type TranslationKey = keyof TranslationKeys;

// English translations
const en: TranslationKeys = {
  // Navigation
  'nav.home': 'Home',
  'nav.benchmark': 'Benchmark',
  'nav.results': 'Results',
  'nav.status': 'Status',
  'nav.docs': 'Documentation',

  // Home page
  'home.title': 'Atheon Benchmark',
  'home.subtitle': 'Community AI Benchmark Platform',
  'home.description': 'Run benchmarks locally on your system, upload results to GitHub, and compare performance across different hardware configurations.',
  'home.viewResults': 'View Benchmark Results',
  'home.downloadRunner': 'Download Runner',

  // Benchmark page
  'benchmark.title': 'Run Benchmark',
  'benchmark.start': 'Start Benchmark',
  'benchmark.running': 'Running...',
  'benchmark.complete': 'Complete',

  // Results page
  'results.title': 'Benchmark Results',
  'results.noResults': 'No results available',
  'results.download': 'Download results',

  // Status page
  'status.title': 'API Status',
  'status.allOperational': 'All Systems Operational',
  'status.partialOutage': 'Partial Outage',
  'status.disruption': 'Service Disruption',

  // Common
  'common.loading': 'Loading...',
  'common.error': 'An error occurred',
  'common.retry': 'Retry',
  'common.close': 'Close',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
};

// Spanish translations (partial)
const es: Partial<TranslationKeys> = {
  // Navigation
  'nav.home': 'Inicio',
  'nav.benchmark': 'Benchmark',
  'nav.results': 'Resultados',
  'nav.status': 'Estado',
  'nav.docs': 'Documentación',

  // Common
  'common.loading': 'Cargando...',
  'common.error': 'Ocurrió un error',
  'common.retry': 'Reintentar',
  'common.close': 'Cerrar',
  'common.save': 'Guardar',
  'common.cancel': 'Cancelar',
};

// French translations (partial)
const fr: Partial<TranslationKeys> = {
  // Navigation
  'nav.home': 'Accueil',
  'nav.benchmark': 'Benchmark',
  'nav.results': 'Résultats',
  'nav.status': 'Statut',
  'nav.docs': 'Documentation',

  // Common
  'common.loading': 'Chargement...',
  'common.error': 'Une erreur est survenue',
  'common.retry': 'Réessayer',
  'common.close': 'Fermer',
  'common.save': 'Enregistrer',
  'common.cancel': 'Annuler',
};

// German translations (partial)
const de: Partial<TranslationKeys> = {
  // Navigation
  'nav.home': 'Startseite',
  'nav.benchmark': 'Benchmark',
  'nav.results': 'Ergebnisse',
  'nav.status': 'Status',
  'nav.docs': 'Dokumentation',

  // Common
  'common.loading': 'Laden...',
  'common.error': 'Ein Fehler ist aufgetreten',
  'common.retry': 'Wiederholen',
  'common.close': 'Schließen',
  'common.save': 'Speichern',
  'common.cancel': 'Abbrechen',
};

// Japanese translations (partial)
const ja: Partial<TranslationKeys> = {
  // Navigation
  'nav.home': 'ホーム',
  'nav.benchmark': 'ベンチマーク',
  'nav.results': '結果',
  'nav.status': 'ステータス',
  'nav.docs': 'ドキュメント',

  // Common
  'common.loading': '読み込み中...',
  'common.error': 'エラーが発生しました',
  'common.retry': '再試行',
  'common.close': '閉じる',
  'common.save': '保存',
  'common.cancel': 'キャンセル',
};

// Chinese translations (partial)
const zh: Partial<TranslationKeys> = {
  // Navigation
  'nav.home': '首页',
  'nav.benchmark': '基准测试',
  'nav.results': '结果',
  'nav.status': '状态',
  'nav.docs': '文档',

  // Common
  'common.loading': '加载中...',
  'common.error': '发生错误',
  'common.retry': '重试',
  'common.close': '关闭',
  'common.save': '保存',
  'common.cancel': '取消',
};

const translations: Record<Locale, Partial<TranslationKeys>> = {
  en,
  es,
  fr,
  de,
  ja,
  zh,
};

/**
 * Get the current locale from the browser
 */
export function getBrowserLocale(): Locale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const browserLang = navigator.language.split('-')[0];
  const locale = browserLang as Locale;

  if (SUPPORTED_LOCALES.includes(locale)) {
    return locale;
  }

  return DEFAULT_LOCALE;
}

/**
 * Get stored locale preference
 */
export function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = localStorage.getItem('atheon-locale');
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }

  return null;
}

/**
 * Store locale preference
 */
export function setStoredLocale(locale: Locale): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem('atheon-locale', locale);
}

/**
 * Get translation for a key
 */
export function t(key: TranslationKey, locale: Locale = DEFAULT_LOCALE): string {
  const translation = translations[locale]?.[key];
  return translation || translations.en[key] || key;
}

/**
 * Get translation with variable interpolation
 */
export function tv(key: TranslationKey, params: Record<string, string | number>, locale: Locale = DEFAULT_LOCALE): string {
  let translation = t(key, locale);

  Object.entries(params).forEach(([paramKey, value]) => {
    translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
  });

  return translation;
}

/**
 * useTranslation hook for React components
 */
export function useTranslation(locale: Locale = DEFAULT_LOCALE) {
  return {
    t: (key: TranslationKey) => t(key, locale),
    tv: (key: TranslationKey, params: Record<string, string | number>) => tv(key, params, locale),
    locale,
  };
}

/**
 * Language display names
 */
export const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  zh: '中文',
};