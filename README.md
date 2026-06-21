# Atheon Benchmark

Community-driven AI benchmark platform for comparing Claude performance with and without Atheon MCP integration across different hardware configurations.

**🌐 Live Dashboard**: https://atheon-benchmark-dashboard.pages.dev/

[![Deploy Status](https://github.com/aliasfoxkde/Atheon-Benchmark/actions/workflows/deploy.yml/badge.svg)](https://github.com/aliasfoxkde/Atheon-Benchmark/actions/workflows/deploy.yml)
[![Test Status](https://github.com/aliasfoxkde/Atheon-Benchmark/actions/workflows/test.yml/badge.svg)](https://github.com/aliasfoxkde/Atheon-Benchmark/actions/workflows/test.yml)

## 🚀 Overview

Atheon Benchmark is a comprehensive benchmarking system that allows you to:

- **Run benchmarks locally** on your system using our CLI tool
- **Upload results to GitHub** for community sharing
- **Compare performance** across different hardware configurations
- **View analytics** through our modern web dashboard
- **Pattern analysis** using 185 Atheon patterns across 16 categories

The system tests Claude AI performance across different configurations:

- **Vanilla Claude**: Direct API calls (baseline)
- **MCP Integration**: Claude with generic MCP tool support
- **Atheon Integration**: Claude with Atheon pattern matching and quality gates (185 patterns)

## ✨ Features

### Local Benchmark Runner
- **🖥️ Multi-Platform**: Runs on Windows, Linux, and macOS
- **🔍 System Detection**: Automatic CPU, RAM, and OS detection
- **📊 Multiple Scenarios**: Tests vanilla Claude, Atheon MCP, and pattern matching
- **📤 GitHub Integration**: Seamless result upload to GitHub
- **💾 JSON Format**: Structured output for analysis

### Web Dashboard
- **🌐 Real-time Updates**: Fetches results from GitHub repository
- **🔍 System Comparison**: Side-by-side performance comparison
- **🎯 Advanced Filtering**: Filter by hardware, OS, date range
- **📈 Statistics**: Comprehensive performance analytics
- **📱 PWA Support**: Offline viewing capabilities
- **🌍 Community Data**: View and compare results from other users

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

- **For Local Runner**: Go 1.21+ (or download pre-built binary)
- **For Web Dashboard**: Node.js 18+ and npm
- **GitHub Account**: For storing and viewing benchmark results
- **Claude API Key** (optional): For AI benchmarking features

### Quick Start

#### 1. Run Local Benchmarks

```bash
# Download the runner
wget https://github.com/your-org/Atheon-Benchmark/releases/latest/download/attheon-benchmark-linux-amd64
chmod +x attheon-benchmark-linux-amd64

# Set up GitHub credentials
export GITHUB_TOKEN="your_github_token"
export GITHUB_REPO="your-org/attheon-benchmark-results"

# Run benchmarks
./attheon-benchmark-linux-amd64 run
```

#### 2. View Results Online

Visit the web dashboard: **https://atheon-benchmark-dashboard.pages.dev/**

- **Results Page**: https://atheon-benchmark-dashboard.pages.dev/results
- **Benchmark Page**: https://atheon-benchmark-dashboard.pages.dev/benchmark

Or run locally:
```bash
# Clone and setup dashboard
git clone https://github.com/aliasfoxkde/Atheon-Benchmark.git
cd Atheon-Benchmark/dashboard
npm install
npm run dev
# Visit http://localhost:3000/results
```

## 📦 Installation

### Local Benchmark Runner

#### From Binary

```bash
# Download for your platform
wget https://github.com/your-org/Atheon-Benchmark/releases/latest/download/attheon-benchmark-linux-amd64

# Make executable
chmod +x attheon-benchmark-linux-amd64

# Run system info
./attheon-benchmark-linux-amd64 system-info
```

#### From Source

```bash
# Clone repository
git clone https://github.com/your-org/Atheon-Benchmark.git
cd Atheon-Benchmark/runner

# Build
go build -o attheon-benchmark main.go

# Run
./attheon-benchmark system-info
```

### Web Dashboard

```bash
# Clone repository
git clone https://github.com/your-org/Atheon-Benchmark.git
cd Atheon-Benchmark/dashboard

# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npm run build
```

## 📖 Usage

### 1. Set Up GitHub Repository

Create a GitHub repository to store benchmark results:

```bash
# Using GitHub CLI
gh repo create attheon-benchmark-results --public --description "Atheon Benchmark Results Storage"

# Or create manually at https://github.com/new
```

### 2. Configure GitHub Token

Generate a GitHub personal access token:
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Copy the token

```bash
# Set environment variables
export GITHUB_TOKEN="your_token_here"
export GITHUB_REPO="your-username/attheon-benchmark-results"
```

### 3. Run Benchmarks

```bash
# Display system information
./attheon-benchmark system-info

# Run benchmarks and upload to GitHub
./attheon-benchmark run

# Run without upload
./attheon-benchmark run --upload=false --output my-results.json

# Run with custom test cases
./attheon-benchmark run --test-cases 20

# Run with Claude API key
./attheon-benchmark run --claude-api-key $ANTHROPIC_API_KEY
```

### 4. Upload Existing Results

```bash
# Upload previously generated results
./attheon-benchmark upload \
  --file my-results.json \
  --github-token $GITHUB_TOKEN \
  --github-repo your-org/attheon-benchmark-results
```

### 5. View Results Online

Visit the web dashboard to view and compare results:
- **Live Dashboard**: https://atheon-benchmark-dashboard.pages.dev
- **Results Page**: https://atheon-benchmark-dashboard.pages.dev/results
- **GitHub Repository**: https://github.com/aliasfoxkde/atheon-benchmark-results

## 🏗️ Development

### Project Structure

```
atheon-benchmark/
├── runner/                         # Local benchmark runner (Go)
│   ├── main.go                     # Main CLI application
│   ├── go.mod                      # Go module dependencies
│   └── README.md                   # Runner documentation
├── dashboard/                      # Web dashboard (Next.js)
│   ├── app/                        # App router pages
│   ├── components/                 # React components
│   ├── lib/                        # Core library
│   │   ├── github/                 # GitHub results fetcher
│   │   ├── claude/                 # Claude API integration
│   │   ├── benchmark/              # Benchmark engine
│   │   └── atheon/                # Atheon integration
│   └── public/                     # Static assets
├── benchmarks/                     # Go-based benchmarks
├── docs/                           # Documentation
│   ├── ARCHITECTURE.md             # System architecture
│   ├── API.md                      # API documentation
│   └── DEPLOYMENT.md               # Deployment guide
└── README.md                       # Main documentation
```

### Building for Production

```bash
# Build runner
cd runner
go build -o attheon-benchmark main.go

# Build dashboard
cd ../dashboard
npm run build
```

### Running Tests

```bash
# Test runner
cd runner
go test

# Test dashboard
cd dashboard
npm test
```

## 🚀 Deployment

### Local Benchmark Runner

The runner is distributed as pre-built binaries:

```bash
# Build for different platforms
cd runner
GOOS=linux GOARCH=amd64 go build -o attheon-benchmark-linux-amd64 main.go
GOOS=windows GOARCH=amd64 go build -o attheon-benchmark-windows-amd64.exe main.go
GOOS=darwin GOARCH=amd64 go build -o attheon-benchmark-darwin-amd64 main.go

# Create GitHub release with binaries
gh release create v1.0.0 ./atheon-benchmark-*
```

### Web Dashboard

#### Cloudflare Pages (Recommended)

```bash
cd dashboard

# Deploy to production
npm run deploy

# Deploy to staging
npm run deploy:staging

# Deploy without rebuilding
npm run deploy:skip-build
```

#### Traditional Hosting

```bash
cd dashboard

# Build
npm run build

# Serve standalone server
PORT=3001 node .next/standalone/server.js
```

### GitHub Repository Setup

1. **Create Results Repository**
   ```bash
   gh repo create attheon-benchmark-results --public
   ```

2. **Configure Dashboard**
   ```typescript
   // dashboard/lib/github/results.ts
   export const DEFAULT_GITHUB_CONFIG: GitHubResultsConfig = {
     owner: 'your-username',
     repo: 'atheon-benchmark-results',
     branch: 'main',
   };
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

- 🐛 Bug Reports: [GitHub Issues](https://github.com/aliasfoxkde/Atheon-Benchmark/issues)
- 📖 Documentation: [Full Documentation](https://github.com/aliasfoxkde/Atheon-Benchmark/blob/main/docs/README.md)
- 💬 Discussions: [GitHub Discussions](https://github.com/aliasfoxkde/Atheon-Benchmark/discussions)

## 🔗 Links

- **Dashboard**: [https://atheon-benchmark-dashboard.pages.dev](https://atheon-benchmark-dashboard.pages.dev)
- **GitHub**: [https://github.com/aliasfoxkde/Atheon-Benchmark](https://github.com/aliasfoxkde/Atheon-Benchmark)
- **Atheon**: [https://github.com/HoraDomu/Atheon](https://github.com/HoraDomu/Atheon)
- **Results Repo**: [https://github.com/aliasfoxkde/atheon-benchmark-results](https://github.com/aliasfoxkde/atheon-benchmark-results)

---

Made with ❤️ by the AI benchmarking community