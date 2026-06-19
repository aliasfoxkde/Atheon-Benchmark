# Atheon Benchmark Dashboard

Comprehensive AI benchmark system comparing Claude performance with and without Atheon MCP integration. Built with Next.js 16, TypeScript, and modern PWA technologies.

## 🚀 Features

- **CSR-First PWA**: Client-Side Rendering First strategy for optimal scalability
- **Real-time Benchmarking**: Live streaming of benchmark execution results
- **Atheon Integration**: Quality gates and pattern matching validation
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS v4
- **Offline Support**: Full PWA capabilities with service worker caching
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Cloudflare Ready**: Configured for deployment on Cloudflare infrastructure

## 🛠️ Tech Stack

### Frontend
- **Next.js 16.2.9**: React framework with App Router
- **React 19.2.4**: UI library
- **TypeScript 5**: Type safety
- **Tailwind CSS v4**: Modern styling
- **shadcn/ui**: Professional UI components

### Backend & Infrastructure
- **Cloudflare Workers**: Edge computing
- **Cloudflare D1**: Database storage
- **Cloudflare R2**: Object storage
- **Cloudflare KV**: Caching and rate limiting

### Integration
- **Claude API**: AI benchmarking
- **Atheon Go**: Pattern matching
- **FastMCP 3.0**: MCP server integration

## 📋 Prerequisites

- Node.js 18+ and npm
- Modern web browser with PWA support
- Claude API key (for production use)
- Atheon Go binary (optional, for local testing)

## 🏃 Quick Start

### Development Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server on 0.0.0.0:3000
npm run dev

# Access at http://localhost:3000 or http://0.0.0.0:3000
```

### Production Build

```bash
# Create production build
npm run build

# Test production build locally
npm run start:standalone

# Or use Node.js directly
PORT=3001 node .next/standalone/server.js
```

## 🌐 Deployment

### Cloudflare Pages (Recommended)

```bash
# Deploy to production
npm run deploy

# Deploy to staging
npm run deploy:staging

# Deploy without rebuilding
npm run deploy:skip-build
```

### Docker Deployment

```bash
# Build and run with Docker
docker build -t attheon-benchmark-dashboard .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=your_key attheon-benchmark-dashboard
```

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions.

## 📁 Project Structure

```
atheon-benchmark-dashboard/
├── app/                      # Next.js App Router pages
│   ├── api/                 # API endpoints
│   ├── benchmark/           # Benchmark execution page
│   ├── results/             # Results browsing page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/              # React components
│   ├── ui/                 # shadcn/ui components
│   ├── benchmark/          # Benchmark-specific components
│   └── layout/             # Layout components
├── lib/                     # Core libraries
│   ├── claude/             # Claude API integration
│   ├── benchmark/          # Benchmark engine
│   ├── atheon/            # Atheon integration
│   ├── storage/           # Cloudflare storage clients
│   ├── security/          # Authentication & security
│   └── utils/             # Utility functions
├── public/                 # Static assets
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   └── icons/             # PWA icons
├── docs/                  # Documentation
│   ├── DEPLOYMENT.md      # Deployment guide
│   └── ARCHITECTURE.md    # System architecture
└── scripts/               # Build and deployment scripts
```

## 🔧 Configuration

### Environment Variables

```bash
# .env.local
ANTHROPIC_API_KEY=your_api_key_here
ANTHROPIC_BASE_URL=https://api.anthropic.com
NEXT_PUBLIC_APP_NAME=Atheon Benchmark Dashboard
NEXT_PUBLIC_APP_DESCRIPTION=Comprehensive AI benchmark system
```

### Next.js Configuration

```typescript
// next.config.ts
export default {
  output: 'standalone',
  images: {
    unoptimized: true
  }
};
```

## 🧪 Testing

### Run Tests

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

### PWA Testing

```bash
# Test PWA functionality
npm run test:pwa

# Lighthouse CI
npm run lighthouse
```

## 📊 Features

### Benchmark Execution
- Configurable test scenarios
- Real-time progress streaming
- Statistical analysis with percentiles
- Multiple Claude model support

### Results Visualization
- Interactive charts and graphs
- Historical comparisons
- Export to CSV/JSON
- Share results via URL

### Atheon Integration
- Quality gates validation
- Security pattern detection
- Performance optimization
- Custom pattern matching

### PWA Features
- Offline functionality
- Install to home screen
- Background sync
- Push notifications

## 🔒 Security

- Input validation and sanitization
- CORS configuration
- Rate limiting (100 req/min)
- Security headers
- Environment variable protection

## 📈 Performance

- CSR-First rendering strategy
- Service worker caching
- Image optimization
- Code splitting
- Lazy loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Atheon Project**: Pattern matching engine
- **Claude API**: AI benchmarking platform
- **Next.js Team**: Excellent framework
- **Cloudflare**: Infrastructure support

## 📞 Support

- **Documentation**: See [docs/](./docs/)
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Atheon**: [https://github.com/HoraDomu/Atheon](https://github.com/HoraDomu/Atheon)

## 🔄 Version History

### v1.0.0 (2026-06-19)
- Initial production release
- CSR-First PWA implementation
- Cloudflare deployment support
- Atheon integration
- Real-time benchmark streaming

---

**Built with ❤️ for the AI community**
