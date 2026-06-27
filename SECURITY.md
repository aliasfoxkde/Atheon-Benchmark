# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within Atheon-Benchmark, please follow our responsible disclosure process.

### For Security Vulnerabilities

**Please DO NOT file a public GitHub issue for security vulnerabilities.**

Instead, please report vulnerabilities to:

1. **GitHub Security Advisories** (Preferred)
   - Go to the [Advisories page](https://github.com/aliasfoxkde/Atheon-Benchmark/security/advisories)
   - Click "Report a vulnerability"
   - Fill out the vulnerability report form

2. **Email** (Alternative)
   - Send an email to the repository maintainer
   - Subject line: `[SECURITY] Atheon-Benchmark vulnerability report`

### What to Include in a Report

Please include as much of the following as possible:

- Type of vulnerability (e.g., SQL injection, XSS, etc.)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact assessment - how might this vulnerability be exploited?

### Response Timeline

- **Initial Response**: Within 48 hours
- **Assessment**: Within 7 days
- **Fix Timeline**: Depends on severity (see below)

### Severity Classification

| Severity | Description | Fix Timeline |
|----------|-------------|--------------|
| Critical | Remote code execution, complete system compromise | 7 days |
| High | Significant security breach, data exposure | 14 days |
| Medium | Moderate security impact, limited scope | 30 days |
| Low | Minimal security impact, easily exploitable | Next release |

### Security Updates

Security updates will be released as:
- **Patch releases** for critical/high severity issues
- Listed in the [CHANGELOG](CHANGELOG.md) under "Security Fixes"

### Security Best Practices

When using Atheon-Benchmark in production:

1. **API Keys**: Never commit API keys to version control
   - Use environment variables
   - Use Cloudflare's secret management for Workers

2. **Rate Limiting**: Enable rate limiting on API endpoints
   - Default limits are configured in the Workers backend

3. **CORS**: Configure CORS origins appropriately for your domain

4. **Dependencies**: Keep dependencies updated
   - Run `npm audit` regularly
   - Subscribe to Dependabot security alerts

5. **Reporting**: Enable GitHub security alerts for your fork

## Security-Related Configuration

See [docs/SECURITY_CONFIG.md](docs/SECURITY_CONFIG.md) for production security configuration guidelines.
