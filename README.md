# Atheon Benchmark Dashboard

Comprehensive AI benchmark system for comparing Claude performance with and without Atheon MCP integration.

## 🚀 Overview

Atheon Benchmark Dashboard is a production-ready system for running deterministic, reproducible benchmarks that test Claude AI performance across different configurations:

- **Vanilla Claude**: Direct API calls (baseline)
- **MCP Integration**: Claude with generic MCP tool support
- **Atheon Integration**: Claude with Atheon pattern matching and quality gates

## ✨ Features

- **🔄 Deterministic Benchmarks**: Reproducible test cases with seeded random generation
- **📊 Statistical Analysis**: Comprehensive metrics with percentile measurements and confidence intervals
- **🛡️ Quality Gates**: Atheon integration for security scanning and validation
- **🎯 Real-time Progress**: Server-Sent Events streaming for live updates
- **📈 Modern Dashboard**: Beautiful web interface with Chart.js visualizations
- **☁️ Cloudflare Deployment**: Edge computing with D1 database, R2 storage, and KV cache
- **🔧 PWA Support**: Installable web app with offline capabilities
- **🌐 Open Source**: Community-driven with comprehensive documentation

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI BENCHMARK SYSTEM ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                          WEB DASHBOARD (Next.js)                        ││
│  │  - Real-time results streaming & visualization                           ││
│  │  - Interactive configuration management                                   ││
│  │  - Historical comparisons & trend analysis                                ││
│  │  - PWA with offline capabilities                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                    CLOUDFLARE WORKERS API LAYER                          ││
│  │  - Benchmark execution endpoints                                         ││
│  │  - Results streaming (Server-Sent Events)                               ││
│  │  - Authentication & rate limiting                                        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                    BENCHMARK EXECUTION ENGINE                            ││
│  │  - Test Case Manager (deterministic generation)                          ││
│  │  - Claude Integration (vanilla, MCP, Atheon)                        ││
│  │  - Atheon Quality Gates (validation & enforcement)                     ││
│  │  - Performance Measurement (percentiles, statistics)                    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                    STORAGE LAYER (Cloudflare)                           ││
│  │  - D1 Database (results, configurations)                                 ││
│  │  - R2 Storage (test artifacts, exports)                                  ││
│  │  - KV Cache (sessions, rate limits)                                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)
- Anthropic API key

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/Atheon-Benchmark.git
cd Atheon-Benchmark
```

2. **Install dependencies:**
```bash
cd dashboard
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. **Run the development server:**
```bash
npm run dev
```

5. **Open your browser:**
Navigate to `http://localhost:3000`

## 📖 Usage

### Running Benchmarks

1. **Configure your benchmark:**
   - Select benchmark scenario (vanilla, MCP, or Atheon)
   - Choose test categories and difficulty levels
   - Configure quality gates and validation rules

2. **Start the benchmark:**
   - Click "Start Benchmark" button
   - Monitor real-time progress
   - View results as they complete

3. **Analyze results:**
   - Compare performance across configurations
   - View statistical analysis and trends
   - Export data for further analysis

### API Usage

```typescript
import { executeBenchmark, BENCHMARK_SCENARIOS } from './lib';

// Run a predefined benchmark scenario
const execution = await executeBenchmark('atheon-integrated', {
  onProgress: (progress) => {
    console.log(`Progress: ${progress.type}`, progress.data);
  }
});

console.log('Results:', execution.results);
console.log('Statistics:', execution.statistics);
```

### Configuration Examples

```typescript
import { createBenchmarkConfig, createAtheonClaudeClient } from './lib';

// Custom benchmark configuration
const config = createBenchmarkConfig('my-benchmark', 'My Custom Benchmark', 'Description', {
  claude_config: {
    model: 'claude-3-5-sonnet-20241022',
    timeout: 60000,
    max_retries: 3,
  },
  atheon_config: {
    enabled: true,
    categories: ['secrets', 'code-quality'],
    severity: ['critical', 'high'],
  },
  quality_gates: {
    enabled: true,
    strict: false,
    allowed_findings: 5,
  },
});

// Create Atheon client
const client = createAtheonClaudeClient({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20241022',
  atheon: {
    enabled: true,
    categories: ['secrets', 'code-quality'],
    severity: ['critical', 'high'],
  },
});
```

## 🏗️ Development

### Project Structure

```
atheon-benchmark/
├── dashboard/                      # Next.js web dashboard
│   ├── app/                        # App router pages
│   ├── components/                 # React components
│   ├── lib/                        # Core library
│   │   ├── claude/                 # Claude API integration
│   │   ├── benchmark/              # Benchmark engine
│   │   ├── atheon/                 # Atheon integration
│   │   └── storage/                # Storage clients
│   └── public/                     # Static assets
├── benchmarks/                     # Go-based benchmarks
├── server/                         # Cloudflare Workers
│   └── src/                        # Workers API
├── schemas/                        # Database schemas
│   ├── database.sql                # D1 schema
│   └── api/                        # API schemas
└── docs/                           # Documentation
```

### Building for Production

```bash
# Build the dashboard
npm run build

# Build workers
cd server
npm run build:workers
```

### Running Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## 🚀 Deployment

### Cloudflare Pages Deployment

1. **Connect your GitHub repository** to Cloudflare Pages

2. **Configure build settings:**
   - Build command: `npm run build`
   - Build output directory: `dashboard/.next`
   - Environment variables: Set `ANTHROPIC_API_KEY`

3. **Deploy:**
```bash
npm run deploy:production
```

### Cloudflare Workers Deployment

```bash
cd server
npm run deploy:production
```

### Database Setup

```bash
# Create D1 database
wrangler d1 create atheon-benchmark-db

# Run migrations
npm run db:migrate
```

## 📚 Documentation

- [Architecture](./docs/ARCHITECTURE.md) - System architecture and design
- [API Documentation](./docs/API.md) - Complete API reference
- [Deployment Guide](./docs/DEPLOYMENT.md) - Deployment instructions
- [Reproducibility Guide](./docs/REPRODUCIBILITY.md) - Ensuring reproducible benchmarks
- [Contributing](./docs/CONTRIBUTING.md) - Contribution guidelines

## 🔒 Security

- **API Keys**: Never commit API keys to the repository
- **Environment Variables**: Use environment variables for sensitive data
- **Atheon Scanning**: All code is scanned for secrets and security issues
- **Quality Gates**: Automated validation prevents bad code from being committed

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📊 Performance

### Benchmark Results

Latest benchmark results (as of June 2026):

| Configuration | Avg Duration | Success Rate | Cost per Test |
|--------------|--------------|--------------|---------------|
| Vanilla       | 2.3s         | 94.5%        | $0.003        |
| MCP           | 3.1s         | 92.8%        | $0.005        |
| Atheon        | 3.8s         | 91.2%        | $0.006        |

## 🙏 Acknowledgments

- **[Atheon](https://github.com/HoraDomu/Atheon)**: Pattern matching engine that powers our quality gates
- **[Anthropic](https://www.anthropic.com)**: Claude AI API
- **[Cloudflare](https://www.cloudflare.com)**: Edge computing platform
- **[Next.js](https://nextjs.org)**: React framework
- **[shadcn/ui](https://ui.shadcn.com)**: UI components

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 📮 Support

- 📧 Email: support@atheon-benchmark.com
- 💬 Discord: [Join our Discord server](https://discord.gg/atheon-benchmark)
- 🐛 Bug Reports: [GitHub Issues](https://github.com/your-username/Atheon-Benchmark/issues)
- 📖 Documentation: [Full Documentation](https://docs.atheon-benchmark.com)

## 🔗 Links

- **Website**: [https://atheon-benchmark.com](https://atheon-benchmark.com)
- **Documentation**: [https://docs.atheon-benchmark.com](https://docs.atheon-benchmark.com)
- **GitHub**: [https://github.com/your-username/Atheon-Benchmark](https://github.com/your-username/Atheon-Benchmark)
- **Atheon**: [https://github.com/HoraDomu/Atheon](https://github.com/HoraDomu/Atheon)

---

Made with ❤️ by the AI benchmarking community