# Commit Message Conventions

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Rules

1. **Subject line** must:
   - Use imperative mood ("add" not "added" or "adds")
   - Start with lowercase
   - No trailing period
   - Be ≤72 characters

2. **Body** should:
   - Wrap at 72 characters
   - Explain *what* and *why*, not *how*

3. **Footer** can reference issues:
   ```
   Fixes #123
   Closes #456
   Related to #789
   ```

## Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code restructuring |
| `perf` | Performance improvement |
| `test` | Adding tests |
| `chore` | Maintenance tasks |
| `revert` | Revert previous commit |

## Scopes

| Scope | Description |
|-------|-------------|
| `dashboard` | Next.js frontend |
| `server` | Cloudflare Workers API |
| `runner` | Go CLI benchmark runner |
| `sdk` | Client SDKs |
| `ci` | CI/CD pipeline |
| `deps` | Dependencies |
| `security` | Security-related |
| `auth` | Authentication |
| `api` | API endpoints |
| `ui` | User interface |
| `db` | Database |

## Examples

### Feature
```
feat(dashboard): add dark mode toggle

Users can now switch between light and dark themes.
The preference is saved to localStorage and persists across sessions.
```

### Bug Fix
```
fix(server): resolve rate limiting bypass

The rate limiter was not correctly tracking requests from authenticated users.
Added user ID to the rate limit key to properly scope limits per user.

Fixes #123
```

### Documentation
```
docs: update README with new deployment instructions

Added section on Cloudflare Pages deployment.
Clarified environment variable requirements.
```

### Refactoring
```
refactor(api): extract response parser utility

Moved response parsing logic from route handlers to a shared utility.
This reduces duplication and makes testing easier.
```

### Breaking Change
```
feat(auth)!: change API key format

The API key format has changed from `ak_xxx` to `atheon_xxx`.
Update your stored API keys to use the new format.

BREAKING CHANGE: Old API keys will no longer work.

Closes #456
```

## Validation

The commit-msg hook validates:
- Format matches `type(scope): description`
- First line ≤72 characters
- No trailing whitespace
- Type is valid

Install hooks:
```bash
bash scripts/enable-hooks.sh
```

## Auto-generated Commits

| Tool | Format |
|------|--------|
| Merge | `Merge branch 'feature/xyz'` |
| Squash | `type(scope): description` (from PR title) |
| Dependabot | `chore(deps): bump version` |
