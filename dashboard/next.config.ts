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
        ],
      },
    ];
  },
};

export default nextConfig;
