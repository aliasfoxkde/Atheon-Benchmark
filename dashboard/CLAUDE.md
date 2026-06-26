# Claude Code Configuration

## Scope

This file is the canonical Claude instruction root for this repository.
Use repository-relative paths only.

## Working Rules

1. Verify current working directory with `pwd` before write operations.
2. Keep changes minimal and targeted.
3. Run validation commands before claiming completion.
4. Treat `CLAUDE.md` and `.claude/` as protected config (requires explicit unlock for edits).

## Project Documentation Contract

For any project task, reference and update docs in `./docs`:

- `./docs/PLAN.md`
- `./docs/TASKS.md`
- `./docs/PROGRESS.md`
- `./docs/CHANGELOG_RECENT.md` (or `./CHANGELOG.md` when appropriate)
- `./AGENTS.md`
- `./CLAUDE.md`

For memory/context artifacts, prefer project-local locations under:

- `./docs/memories/` (if present)
- `./docs/temp/`
- `./data/` (runtime/system data)

Do not require absolute user-home paths in instructions unless unavoidable for system integration.

## Validation Commands

```bash
pwd
git status
make doctor
uv run pytest tests/ -q
uv run ruff check src/ tests/
```

## Canonical Launch

Use repository launcher for deterministic context:

```bash
./scripts/claude-canonical
```
