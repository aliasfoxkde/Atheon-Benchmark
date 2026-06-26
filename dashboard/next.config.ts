import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Turbopack (default in Next.js 16)
  turbopack: {},

  // Enable experimental features for PWA
  experimental: {
    optimizeCss: true,
  },

  // Use static export for Cloudflare Pages
  output: 'export',

  // Configure image optimization for Cloudflare
  images: {
    unoptimized: true, // Required for Cloudflare Pages
  },

  // Environment variables for Cloudflare
  env: {
    NEXT_PUBLIC_APP_NAME: 'Atheon Benchmark Dashboard',
    NEXT_PUBLIC_APP_DESCRIPTION: 'Comprehensive AI benchmark system comparing Claude performance with and without Atheon MCP integration',
  },

  // Headers for PWA and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.github.com https://api.anthropic.com https://*.pages.dev",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
