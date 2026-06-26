/**
 * Internationalization (i18n) Utilities
 * Basic i18n support for Atheon Benchmark Dashboard
 *
 * Note: Full next-intl integration requires significant setup.
 * This module provides basic translation infrastructure that can be
 * extended when full i18n is needed.
 */

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'es', 'fr', 'de', 'ja', 'zh'];
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

// Spanish translations
const es: TranslationKeys = {
  // Navigation
  'nav.home': 'Inicio',
  'nav.benchmark': 'Benchmark',
  'nav.results': 'Resultados',
  'nav.status': 'Estado',
  'nav.docs': 'Documentación',

  // Home page
  'home.title': 'Atheon Benchmark',
  'home.subtitle': 'Plataforma de Benchmark de IA Comunitaria',
  'home.description': 'Ejecute benchmarks localmente en su sistema, suba resultados a GitHub y compare rendimiento entre diferentes configuraciones de hardware.',
  'home.viewResults': 'Ver Resultados',
  'home.downloadRunner': 'Descargar Runner',

  // Benchmark page
  'benchmark.title': 'Ejecutar Benchmark',
  'benchmark.start': 'Iniciar Benchmark',
  'benchmark.running': 'Ejecutando...',
  'benchmark.complete': 'Completado',

  // Results page
  'results.title': 'Resultados del Benchmark',
  'results.noResults': 'No hay resultados disponibles',
  'results.download': 'Descargar resultados',

  // Status page
  'status.title': 'Estado de la API',
  'status.allOperational': 'Todos los Sistemas Operativos',
  'status.partialOutage': 'Interrupción Parcial',
  'status.disruption': 'Interrupción del Servicio',

  // Common
  'common.loading': 'Cargando...',
  'common.error': 'Ocurrió un error',
  'common.retry': 'Reintentar',
  'common.close': 'Cerrar',
  'common.save': 'Guardar',
  'common.cancel': 'Cancelar',
};

// French translations
const fr: TranslationKeys = {
  // Navigation
  'nav.home': 'Accueil',
  'nav.benchmark': 'Benchmark',
  'nav.results': 'Résultats',
  'nav.status': 'Statut',
  'nav.docs': 'Documentation',

  // Home page
  'home.title': 'Atheon Benchmark',
  'home.subtitle': 'Plateforme de Benchmark IA Communautaire',
  'home.description': 'Exécutez des benchmarks localement sur votre système, téléchargez les résultats sur GitHub et comparez les performances entre différentes configurations matérielles.',
  'home.viewResults': 'Voir les Résultats',
  'home.downloadRunner': 'Télécharger le Runner',

  // Benchmark page
  'benchmark.title': 'Exécuter un Benchmark',
  'benchmark.start': 'Démarrer le Benchmark',
  'benchmark.running': 'En cours...',
  'benchmark.complete': 'Terminé',

  // Results page
  'results.title': 'Résultats du Benchmark',
  'results.noResults': 'Aucun résultat disponible',
  'results.download': 'Télécharger les résultats',

  // Status page
  'status.title': 'État de l\'API',
  'status.allOperational': 'Tous les Systèmes Opérationnels',
  'status.partialOutage': 'Panne Partielle',
  'status.disruption': 'Interruption de Service',

  // Common
  'common.loading': 'Chargement...',
  'common.error': 'Une erreur est survenue',
  'common.retry': 'Réessayer',
  'common.close': 'Fermer',
  'common.save': 'Enregistrer',
  'common.cancel': 'Annuler',
};

// German translations
const de: TranslationKeys = {
  // Navigation
  'nav.home': 'Startseite',
  'nav.benchmark': 'Benchmark',
  'nav.results': 'Ergebnisse',
  'nav.status': 'Status',
  'nav.docs': 'Dokumentation',

  // Home page
  'home.title': 'Atheon Benchmark',
  'home.subtitle': 'Community-KI-Benchmark-Plattform',
  'home.description': 'Führen Sie Benchmarks lokal auf Ihrem System aus, laden Sie Ergebnisse auf GitHub hoch und vergleichen Sie die Leistung über verschiedene Hardware-Konfigurationen hinweg.',
  'home.viewResults': 'Ergebnisse anzeigen',
  'home.downloadRunner': 'Runner herunterladen',

  // Benchmark page
  'benchmark.title': 'Benchmark ausführen',
  'benchmark.start': 'Benchmark starten',
  'benchmark.running': 'Läuft...',
  'benchmark.complete': 'Abgeschlossen',

  // Results page
  'results.title': 'Benchmark-Ergebnisse',
  'results.noResults': 'Keine Ergebnisse verfügbar',
  'results.download': 'Ergebnisse herunterladen',

  // Status page
  'status.title': 'API-Status',
  'status.allOperational': 'Alle Systeme operativ',
  'status.partialOutage': 'Teilweise Störung',
  'status.disruption': 'Serviceunterbrechung',

  // Common
  'common.loading': 'Laden...',
  'common.error': 'Ein Fehler ist aufgetreten',
  'common.retry': 'Wiederholen',
  'common.close': 'Schließen',
  'common.save': 'Speichern',
  'common.cancel': 'Abbrechen',
};

// Japanese translations
const ja: TranslationKeys = {
  // Navigation
  'nav.home': 'ホーム',
  'nav.benchmark': 'ベンチマーク',
  'nav.results': '結果',
  'nav.status': 'ステータス',
  'nav.docs': 'ドキュメント',

  // Home page
  'home.title': 'Atheonベンチマーク',
  'home.subtitle': 'コミュニティAIベンチマークプラットフォーム',
  'home.description': 'ローカルでベンチマークを実行し、結果をGitHubにアップロードして、異なるハードウェア構成でのパフォーマンスを比較できます。',
  'home.viewResults': '結果を見る',
  'home.downloadRunner': 'ランナーをダウンロード',

  // Benchmark page
  'benchmark.title': 'ベンチマークを実行',
  'benchmark.start': 'ベンチマークを開始',
  'benchmark.running': '実行中...',
  'benchmark.complete': '完了',

  // Results page
  'results.title': 'ベンチマーク結果',
  'results.noResults': '結果がありません',
  'results.download': '結果をダウンロード',

  // Status page
  'status.title': 'APIステータス',
  'status.allOperational': '全システム稼働中',
  'status.partialOutage': '一部障害',
  'status.disruption': 'サービス中断',

  // Common
  'common.loading': '読み込み中...',
  'common.error': 'エラーが発生しました',
  'common.retry': '再試行',
  'common.close': '閉じる',
  'common.save': '保存',
  'common.cancel': 'キャンセル',
};

// Chinese translations
const zh: TranslationKeys = {
  // Navigation
  'nav.home': '首页',
  'nav.benchmark': '基准测试',
  'nav.results': '结果',
  'nav.status': '状态',
  'nav.docs': '文档',

  // Home page
  'home.title': 'Atheon基准测试',
  'home.subtitle': '社区AI基准测试平台',
  'home.description': '在本地系统上运行基准测试，将结果上传到GitHub，并比较不同硬件配置的性能。',
  'home.viewResults': '查看结果',
  'home.downloadRunner': '下载运行器',

  // Benchmark page
  'benchmark.title': '运行基准测试',
  'benchmark.start': '开始基准测试',
  'benchmark.running': '运行中...',
  'benchmark.complete': '完成',

  // Results page
  'results.title': '基准测试结果',
  'results.noResults': '暂无结果',
  'results.download': '下载结果',

  // Status page
  'status.title': 'API状态',
  'status.allOperational': '所有系统运行正常',
  'status.partialOutage': '部分中断',
  'status.disruption': '服务中断',

  // Common
  'common.loading': '加载中...',
  'common.error': '发生错误',
  'common.retry': '重试',
  'common.close': '关闭',
  'common.save': '保存',
  'common.cancel': '取消',
};

const translations: Record<Locale, TranslationKeys> = {
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