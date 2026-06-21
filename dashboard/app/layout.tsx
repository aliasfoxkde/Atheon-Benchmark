import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { PerformanceMonitor } from "@/components/performance-monitor";
import { HealthMonitor } from "@/components/health-monitor";
import { ErrorBoundaryWrapper } from "@/components/error-boundary";

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
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

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
      <body className="min-h-full flex flex-col bg-white dark:bg-black text-zinc-900 dark:text-zinc-50 transition-colors duration-200">
        <ThemeProvider>
          <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
              <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
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
            <main className="flex-1">
              <ErrorBoundaryWrapper>
                {children}
              </ErrorBoundaryWrapper>
            </main>
            <PerformanceMonitor />
            <HealthMonitor />
            <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 py-6">
              <div className="container mx-auto px-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
                <p>© 2026 Atheon Benchmark. Built with ❤️ for the AI community.</p>
                <p className="mt-2">
                  Powered by <a href="https://github.com/HoraDomu/Atheon" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Atheon</a> •
                  <a href="https://github.com/HoraDomu/Atheon" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-2">GitHub</a>
                </p>
              </div>
            </footer>
          </div>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Service Worker registered with scope:', registration.scope);
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
        {/* Cloudflare Web Analytics */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Cloudflare Web Analytics
                // Add your Cloudflare Web Analytics script here
                // Visit https://dash.cloudflare.com/[account-id]/web-analytics
                console.log('Cloudflare Web Analytics placeholder - configure in production');
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
