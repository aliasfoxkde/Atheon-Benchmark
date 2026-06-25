# Changelog

## [1.0.0] - 2026-06-25

### Added
- Benchmark trending component with sparkline visualization
- Pattern category breakdown component
- Version comparison component (v1 vs v2)
- CSV/JSON export functionality
- External benchmark comparison tool (gitleaks, trufflehog, semgrep)
- PWA install prompt component

### Fixed
- Statistical bugs in run.go (MeanAllocationsPerOp, successRate)
- context.Context parameters in pattern matching benchmarks
- SetBundleDownloadURL for test mocking in Atheon core

### Changed
- Dashboard deployed to Cloudflare Pages

## [0.9.0] - 2026-06-21
- 846 tests passing
- Pattern loading from bundle (185 patterns)
- MCP integration tests enhanced
