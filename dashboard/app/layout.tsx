import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { PerformanceMonitor } from "@/components/performance-monitor";
import { HealthMonitor } from "@/components/health-monitor";
import { ErrorBoundaryWrapper } from "@/components/error-boundary";
import { MobileNav } from "@/components/mobile-nav";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atheon Benchmark Dashboard",
  description: "Comprehensive AI benchmark system comparing Claude performance with and without Atheon MCP integration",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Atheon Benchmark",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Atheon Benchmark Dashboard",
    title: "Atheon Benchmark Dashboard",
    description: "Comprehensive AI benchmark system comparing Claude performance with and without Atheon MCP integration",
  },
  twitter: {
    card: "summary",
    title: "Atheon Benchmark Dashboard",
    description: "Comprehensive AI benchmark system comparing Claude performance with and without Atheon MCP integration",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // WCAG: Allow users to zoom - do not restrict userScalable
  // maximumScale and userScalable removed to comply with accessibility standards
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Theme initialization script - runs BEFORE React hydration to prevent FOUC
const themeInitScript = `
(function() {
  var stored = localStorage.getItem('theme');
  var theme = stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system';
  var resolved;
  if (theme === 'dark') {
    resolved = 'dark';
  } else if (theme === 'light') {
    resolved = 'light';
  } else {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  var html = document.documentElement;
  html.classList.remove('light', 'dark');
  html.classList.add(resolved);
  // Also set a data attribute for CSS selectors
  html.setAttribute('data-theme', resolved);
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-black text-zinc-900 dark:text-zinc-50 transition-colors duration-200">
        {/* Skip to main content link for keyboard accessibility */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none">
          Skip to main content
        </a>
        <ThemeProvider>
          <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
              <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3" aria-label="Atheon Benchmark Dashboard">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Atheon Benchmark</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Community AI Benchmark Platform</p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </header>
            <main id="main-content" className="flex-1 pb-16 md:pb-0">
              <ErrorBoundaryWrapper>
                {children}
              </ErrorBoundaryWrapper>
            </main>
            <MobileNav />
            <PWAInstallPrompt />
            <PerformanceMonitor />
            <HealthMonitor />
            <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 py-6 hidden md:block">
              <div className="container mx-auto px-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
                <p>© 2026 Atheon Benchmark. Built with ❤️ for the AI community.</p>
                <p className="mt-2">
                  Powered by <a href="https://github.com/HoraDomu/Atheon" target="_blank" rel="noopener noreferrer" aria-label="Atheon project on GitHub" className="text-blue-600 dark:text-blue-400 hover:underline">Atheon</a> •
                  <a href="https://github.com/HoraDomu/Atheon" target="_blank" rel="noopener noreferrer" aria-label="View source code on GitHub" className="text-blue-600 dark:text-blue-400 hover:underline ml-2">GitHub</a>
                </p>
              </div>
            </footer>
          </div>
        </ThemeProvider>
        <Script
          id="service-worker-registration"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Service Worker registered with scope:', registration.scope);
                      // Register for periodic background sync if supported
                      if ('periodicSync' in registration) {
                        navigator.permissions.query({name: 'periodic-background-sync'}).then(function(status) {
                          if (status.state === 'granted') {
                            registration.periodicSync.register('periodic-benchmark-sync', {
                              minInterval: 60 * 60 * 1000 // 1 hour minimum
                            }).then(function() {
                              console.log('Periodic background sync registered');
                            }).catch(function(err) {
                              console.log('Periodic background sync registration failed:', err);
                            });
                          }
                        });
                      }
                      // Listen for messages from service worker
                      navigator.serviceWorker.addEventListener('message', function(event) {
                        if (event.data) {
                          switch (event.data.type) {
                            case 'PERIODIC_SYNC_COMPLETE':
                              console.log('Background sync completed, refreshing data...');
                              window.dispatchEvent(new CustomEvent('sw-data-updated', {detail: event.data}));
                              break;
                            case 'SW_UPDATE_AVAILABLE':
                              console.log('Service worker update available:', event.data);
                              window.dispatchEvent(new CustomEvent('sw-update-available', {detail: event.data}));
                              break;
                          }
                        }
                      });
                      // Check for updates periodically (every 6 hours)
                      setInterval(function() {
                        registration.update();
                      }, 6 * 60 * 60 * 1000);
                    },
                    function(err) {
                      console.log('Service Worker registration failed:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
