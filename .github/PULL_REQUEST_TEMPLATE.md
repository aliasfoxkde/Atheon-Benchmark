## Pull Request Checklist

<!-- Remove any items that don't apply to your PR -->

### Description
- [ ] I have read the [CONTRIBUTING.md](../CONTRIBUTING.md) guidelines
- [ ] My PR follows the project's naming conventions
- [ ] I have described what my PR does and why it should be accepted

### Type of Change
What kind of change does this PR introduce?

- [ ] **Bug fix** (non-breaking change that fixes an issue)
- [ ] **New feature** (non-breaking change that adds functionality)
- [ ] **Breaking change** (fix or feature that would cause existing functionality to not work as expected)
- [ ] **Documentation update** (changes to documentation only)
- [ ] **Refactoring** (no functional changes, no API changes)
- [ ] **Performance improvement** (improves speed or efficiency)
- [ ] **Test coverage** (adds or improves test coverage)

### Testing
- [ ] Unit tests pass locally (`npm run test:unit`)
- [ ] Integration tests pass (if applicable)
- [ ] I have tested my changes manually

### Code Quality
- [ ] My code follows the style guidelines (ESLint + Prettier)
- [ ] I have performed self-review of my code
- [ ] I have commented complex code where necessary
- [ ] I have made corresponding changes to documentation

### Related Issues
<!-- Link any related issues using GitHub keywords: "Fixes #123", "Closes #456" -->

Fixes #
Related to #
Addresses #

### Additional Context
<!-- Add any other context about the PR here -->

### Screenshots (if applicable)
<!-- For UI changes, include before/after screenshots or GIFs -->

---

## PR Title Convention

Please use conventional commit format for your PR title:

```
<type>(<scope>): <description>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, no code change
- `refactor` - Code restructuring
- `perf` - Performance improvement
- `test` - Adding tests
- `chore` - Maintenance tasks

**Examples:**
- `feat(dashboard): add dark mode toggle`
- `fix(server): resolve rate limiting bypass`
- `docs(api): update endpoint documentation`
- `refactor(claude): extract response parser`

---

## For Maintainers

### Review Checklist
- [ ] Code follows project conventions
- [ ] Tests are comprehensive and passing
- [ ] Documentation updated if needed
- [ ] No breaking changes without good reason
- [ ] Security implications considered
