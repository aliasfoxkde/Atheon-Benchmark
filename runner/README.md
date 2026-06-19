# Atheon Benchmark Runner

Local benchmark execution tool that runs comprehensive AI benchmarks on your system and uploads results to GitHub for sharing and comparison.

## Features

- 🖥️ **Local Execution**: Runs benchmarks natively on your system
- 📊 **System Info Collection**: Captures CPU, RAM, OS, and architecture details
- 🚀 **Multiple Scenarios**: Tests vanilla Claude, Atheon MCP, and pattern matching
- 📤 **GitHub Upload**: Automatically uploads results to GitHub repository
- 💾 **JSON Results**: Structured output format for easy analysis
- 🔄 **Comparison Ready**: Results can be compared across different systems

## Installation

### From Binary

Download the latest binary from the [Releases](https://github.com/your-org/Atheon-Benchmark/releases) page.

```bash
# Download for your platform
wget https://github.com/your-org/Atheon-Benchmark/releases/latest/download/attheon-benchmark-linux-amd64

# Make executable
chmod +x attheon-benchmark-linux-amd64

# Run
./attheon-benchmark-linux-amd64 system-info
```

### From Source

```bash
# Clone repository
git clone https://github.com/your-org/Atheon-Benchmark.git
cd Atheon-Benchmark/runner

# Build
go build -o attheon-benchmark main.go

# Run
./attheon-benchmark system-info
```

## Usage

### System Information

Display detailed system information:

```bash
./attheon-benchmark system-info
```

**Output:**
```
System Information
==================
Hostname: SWARMONE
CPU: amd64 CPU
RAM:       32231392 kB
OS: linux/amd64
Architecture: amd64
Go Version: go1.24.4
Timestamp: 2026-06-19T10:13:50-05:00
```

### Running Benchmarks

Run benchmarks and save results locally:

```bash
./attheon-benchmark run --output my-results.json --upload=false
```

**Output:**
```
🚀 Atheon Benchmark Runner
==========================
System: SWARMONE
CPU: amd64 CPU
RAM:       32231392 kB
OS: linux/amd64
System ID: SWARMONE-2026-06-19

Running benchmarks...
Running scenario 1/3: vanilla... ✅ (2868ms)
Running scenario 2/3: atheon-mcp... ✅ (1451ms)
Running scenario 3/3: pattern-matching... ✅ (2747ms)

✅ Results saved to: my-results.json
```

### Uploading to GitHub

Automatically upload results to GitHub:

```bash
# Set environment variables
export GITHUB_TOKEN="your_github_personal_access_token"
export GITHUB_REPO="your-org/attheon-benchmark-results"

# Run benchmarks (will automatically upload)
./attheon-benchmark run
```

Or upload existing results:

```bash
./attheon-benchmark upload \
  --file my-results.json \
  --github-token $GITHUB_TOKEN \
  --github-repo your-org/attheon-benchmark-results
```

## Configuration

### Environment Variables

- `GITHUB_TOKEN`: GitHub personal access token for uploading results
- `GITHUB_REPO`: Target repository in format `owner/repo`
- `ANTHROPIC_API_KEY`: Claude API key for AI benchmarking

### Command Line Options

#### `run` Command

- `--output, -o`: Output file path (default: `benchmark-results.json`)
- `--github-token, -t`: GitHub personal access token
- `--github-repo, -r`: GitHub repository (owner/repo)
- `--upload, -u`: Upload results to GitHub (default: true)
- `--claude-api-key, -k`: Claude API key
- `--test-cases, -n`: Number of test cases (default: 10)

#### `upload` Command

- `--file, -f`: Results file to upload (required)
- `--github-token, -t`: GitHub personal access token (required)
- `--github-repo, -r`: GitHub repository (owner/repo) (required)

## Results Format

Results are saved in JSON format with the following structure:

```json
{
  "system_id": "SWARMONE-2026-06-19",
  "system_info": {
    "hostname": "SWARMONE",
    "cpu": "amd64 CPU",
    "ram": "32231392 kB",
    "os": "linux/amd64",
    "arch": "amd64",
    "go_version": "go1.24.4",
    "timestamp": "2026-06-19T10:14:41-05:00"
  },
  "benchmarks": [
    {
      "id": "bench-1781882081011826024",
      "name": "vanilla",
      "duration_ms": 2868,
      "tokens_used": 1500,
      "passed": true,
      "output": "Completed 10 test cases for vanilla scenario",
      "timestamp": "2026-06-19T10:14:43-05:00"
    }
  ],
  "summary": {
    "total_tests": 3,
    "passed": 3,
    "failed": 0,
    "avg_duration_ms": 2355.33,
    "total_tokens": 4500
  },
  "submitted_at": "2026-06-19T10:14:48-05:00"
}
```

## GitHub Storage Structure

Results are uploaded to GitHub in the following structure:

```
results/
├── 2026/
│   ├── 06/
│   │   ├── 19/
│   │   │   ├── SWARMONE-2026-06-19.json
│   │   │   ├── DESKTOPPC-2026-06-19.json
│   │   │   └── SERVER-2026-06-19.json
│   │   └── 20/
│   │       └── LAPTOP-2026-06-20.json
```

## GitHub Repository Setup

1. **Create Results Repository**

Create a new GitHub repository to store benchmark results:
```bash
# Create repository via GitHub CLI
gh repo create attheon-benchmark-results --public --description "Atheon Benchmark Results Storage"
```

2. **Generate Personal Access Token**

Create a GitHub personal access token with `repo` scope:
```bash
# Settings → Developer settings → Personal access tokens → Tokens (classic)
# Scope: repo (full control of private repositories)
```

3. **Configure Environment**

```bash
export GITHUB_TOKEN="your_token_here"
export GITHUB_REPO="your-username/attheon-benchmark-results"
```

4. **Run Benchmarks**

```bash
./attheon-benchmark run
```

## Benchmark Scenarios

The runner executes three main benchmark scenarios:

1. **Vanilla Claude**: Baseline Claude API performance
2. **Atheon MCP**: Claude with Atheon MCP integration
3. **Pattern Matching**: Atheon pattern matching performance

Each scenario runs the configured number of test cases and measures:
- Execution time (milliseconds)
- Token usage
- Success/failure status
- Detailed output

## System Requirements

- **OS**: Linux, macOS, or Windows
- **Architecture**: amd64, arm64
- **Go**: 1.21+ (for building from source)
- **Network**: Internet connection for GitHub upload and Claude API

## Examples

### Basic Usage

```bash
# Display system info
./attheon-benchmark system-info

# Run benchmarks without upload
./attheon-benchmark run --upload=false

# Run with custom output file
./attheon-benchmark run --output desktop-benchmarks.json
```

### Advanced Usage

```bash
# Run with custom test cases and API key
./attheon-benchmark run \
  --test-cases 20 \
  --claude-api-key $ANTHROPIC_API_KEY \
  --output detailed-results.json

# Upload existing results
./attheon-benchmark upload \
  --file my-results.json \
  --github-token $GITHUB_TOKEN \
  --github-repo myorg/attheon-benchmark-results
```

## Web Dashboard Integration

Results uploaded to GitHub can be viewed and compared using the Atheon Benchmark Dashboard:

- **View Results**: Browse all submitted benchmarks
- **System Comparison**: Compare performance across different systems
- **Hardware Filtering**: Filter by CPU, RAM, OS
- **Trend Analysis**: Track performance over time
- **Export**: Download results for offline analysis

Visit: [https://your-dashboard-url.com](https://your-dashboard-url.com)

## Troubleshooting

### GitHub Upload Fails

**Error**: `GitHub API error: Bad credentials`

**Solution**: Check your GitHub token has correct permissions and `GITHUB_TOKEN` is set.

### Benchmark Fails

**Error**: `Claude API error: Invalid API key`

**Solution**: Set `ANTHROPIC_API_KEY` environment variable or use `--claude-api-key` flag.

### System Info Incomplete

**Issue**: CPU or RAM shows generic values

**Solution**: On Linux, ensure `/proc/cpuinfo` and `/proc/meminfo` are readable.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/your-org/Atheon-Benchmark/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/Atheon-Benchmark/discussions)
- **Documentation**: [Full Documentation](https://docs.atheon-benchmark.com)

---

**Built with ❤️ for the AI community**
