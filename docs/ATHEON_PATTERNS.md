# Atheon Pattern System Guide

Comprehensive guide to the Atheon pattern matching system with dynamic pattern loading.

## 🎯 Overview

Atheon is a sophisticated pattern matching engine that provides static analysis and quality enforcement for code. The benchmark system integrates Atheon's dynamic pattern loading to validate and compare code quality across different AI configurations.

## 📊 Pattern Categories

The 152 patterns are organized into 19 categories:

### Core Categories
- **Security** (25+ patterns): SQL injection, XSS, CSRF, authentication bypass
- **Performance** (15+ patterns): N+1 queries, memory leaks, inefficient algorithms
- **Code Quality** (25+ patterns): Code duplication, complexity, anti-patterns
- **Web Development** (20+ patterns): TypeScript issues, React anti-patterns
- **API Integration** (10+ patterns): API design, error handling, security

### Specialized Categories
- **Accessibility** (8+ patterns): WCAG compliance, semantic HTML, ARIA attributes
- **Healthcare** (5+ patterns): HIPAA compliance, patient data handling
- **Finance** (5+ patterns): PCI-DSS compliance, financial calculations
- **PII** (5+ patterns): Personal data identification and protection
- **Secrets** (5+ patterns): API keys, credentials, tokens

### Infrastructure Categories
- **Cloud-Native** (8+ patterns): Docker, Kubernetes, serverless
- **PWA** (5+ patterns): Service workers, manifest, offline support
- **DevOps** (10+ patterns): CI/CD, infrastructure, monitoring
- **Data Visualization** (5+ patterns): Chart accessibility, color schemes

### Emerging Categories
- **AI Detection** (5+ patterns): AI-generated code detection
- **Django** (5+ patterns): Django-specific patterns
- **Node.js** (5+ patterns): Node.js security and performance
- **React** (5+ patterns): React best practices and anti-patterns

## 🔍 Pattern Structure

Each Atheon pattern follows a standardized structure:

```yaml
pattern_id: unique-pattern-id
name: Descriptive Pattern Name
category: pattern-category
severity: [high|medium|low]
description: Clear explanation of what the pattern detects
examples:
  - language: [javascript|typescript|python|go|etc]
    code: |
      # Example code that triggers the pattern
    expected: true
    description: Why this pattern matches
 Remedation:
  steps:
    - Step 1: How to fix the issue
    - Step 2: Additional recommendations
  best_practice: Best practice to follow instead
references:
  - title: Reference documentation
    url: https://example.com/docs
```

## 🎓 Pattern Usage

### Basic Pattern Matching

```typescript
import { AtheonScanner } from '@atheon/scanner';

const scanner = new AtheonScanner();
const results = await scanner.scanCode(codeString);

console.log(`Found ${results.length} pattern matches:`);
results.forEach(match => {
  console.log(`- ${match.patternId}: ${match.severity} severity`);
  console.log(`  Line ${match.lineNumber}: ${match.message}`);
});
```

### Category-Specific Scanning

```typescript
// Scan only security patterns
const securityResults = await scanner.scanCode(codeString, {
  categories: ['security', 'web-security']
});

// Scan only high-severity patterns
const criticalResults = await scanner.scanCode(codeString, {
  severity: ['high']
});
```

### Custom Pattern Configuration

```typescript
const customScanner = new AtheonScanner({
  enableCategories: [
    'security',
    'performance',
    'code-quality'
  ],
  excludePatterns: [
    'deprecated-function', // Ignore deprecation warnings
  ],
  customRules: {
    // Add custom severity mappings
    'sql-injection': 'critical',
    'xss': 'critical'
  }
});
```

## 📈 Pattern Statistics

### Pattern Categories

Patterns are organized into the following categories (loaded dynamically from bundle):

| Category | Description |
|----------|-------------|
| Security | SQL injection, XSS, CSRF, authentication bypass |
| Performance | N+1 queries, memory leaks, inefficient algorithms |
| Code Quality | Code duplication, complexity, anti-patterns |
| Secrets | API keys, credentials, tokens |
| DevOps | CI/CD, infrastructure, monitoring |
| AI Detection | AI-generated code detection |
| Healthcare | HIPAA compliance, patient data handling |
| Finance | PCI-DSS compliance, financial calculations |
| PII | Personal data identification and protection |
| Frameworks | Framework-specific patterns |

**Total**: Dynamic - patterns loaded from bundle

## 🔧 Pattern Development

### Creating New Patterns

1. **Choose the Right Category**
   - Select appropriate category from the 19 available
   - Consider severity level carefully
   - Check for existing similar patterns

2. **Define Pattern Structure**
   ```yaml
   pattern_id: my-custom-pattern
   name: My Custom Pattern
   category: code-quality
   severity: medium
   description: Detects a specific code quality issue
   examples:
     - language: typescript
       code: |
         function badExample() {
           // Bad code here
         }
       expected: true
       description: This should trigger the pattern
   ```

3. **Test Thoroughly**
   ```bash
   # Test the pattern
   atheon scan --pattern my-custom-pattern test-file.ts

   # Test with multiple examples
   atheon validate --pattern my-custom-pattern
   ```

4. **Contribute to Community**
   ```bash
   # Submit pattern for review
   atheon submit --pattern my-custom-pattern
   ```

### Pattern Best Practices

✅ **Do:**
- Keep patterns focused on single issues
- Provide clear, actionable remediation steps
- Include real-world examples
- Consider false positives carefully
- Document references and standards

❌ **Don't:**
- Create overly broad patterns
- Ignore edge cases
- Skip documentation
- Forget to test with valid code
- Duplicate existing patterns

## 🎯 Integration with Benchmark System

### Quality Gates

The Atheon Benchmark uses patterns as quality gates:

```typescript
import { AtheonQualityGate } from '@/lib/atheon/quality-gates';

// Set up quality gate
const qualityGate = new AtheonQualityGate({
  maxHighSeverity: 0,      // No high-severity issues allowed
  maxMediumSeverity: 5,    // Maximum 5 medium-severity issues
  requiredCategories: ['security', 'performance'],
  excludedPatterns: ['deprecated-api']
});

// Validate generated code
const validationResult = await qualityGate.validate(generatedCode);

if (!validationResult.passed) {
  console.error('Code quality check failed:');
  validationResult.violations.forEach(v => {
    console.error(`- ${violation.pattern}: ${violation.message}`);
  });
}
```

### Benchmark Comparison

```typescript
// Compare pattern detection across different AI configurations
const comparison = await comparePatternDetection([
  { name: 'Vanilla Claude', code: vanillaGeneratedCode },
  { name: 'MCP Claude', code: mcpGeneratedCode },
  { name: 'Atheon Claude', code: atheonGeneratedCode }
]);

console.log('Pattern Detection Comparison:');
comparison.forEach(result => {
  console.log(`${result.name}: ${result.violations.length} violations`);
  console.log(`  High severity: ${result.severityCounts.high}`);
  console.log(`  Medium severity: ${result.severityCounts.medium}`);
  console.log(`  Low severity: ${result.severityCounts.low}`);
});
```

## 📚 Pattern Reference

### Security Patterns

**SQL Injection Pattern**
- **ID**: `sql-injection`
- **Severity**: Critical
- **Detects**: Direct SQL query construction with user input
- **Example**: `db.query("SELECT * FROM users WHERE id = " + userInput)`
- **Remediation**: Use parameterized queries

**XSS Pattern**
- **ID**: `xss`
- **Severity**: Critical
- **Detects**: Direct HTML/JavaScript injection with user input
- **Example**: `element.innerHTML = userInput`
- **Remediation**: Use textContent or sanitization

### Performance Patterns

**N+1 Query Pattern**
- **ID**: `n-plus-one-query`
- **Severity**: High
- **Detects**: Database queries inside loops
- **Example**:
  ```javascript
  for (const user of users) {
    const posts = db.query('SELECT * FROM posts WHERE user_id = ?', user.id);
  }
  ```
- **Remediation**: Use eager loading or batch queries

**Memory Leak Pattern**
- **ID**: `memory-leak-closure`
- **Severity**: High
- **Detects**: Potential memory leaks in closures
- **Remediation**: Proper cleanup and reference management

### Code Quality Patterns

**TypeScript Any Pattern**
- **ID**: `typescript-any`
- **Severity**: Medium
- **Detects**: Use of `any` type in TypeScript
- **Example**: `const data: any = fetchData();`
- **Remediation**: Use specific types or interfaces

## 🔍 Pattern Testing

### Test Framework

```typescript
import { PatternTester } from '@atheon/testing';

const tester = new PatternTester();

// Test single pattern
const result = await tester.testPattern('sql-injection', {
  shouldDetect: [
    'db.query("SELECT * FROM users WHERE id = " + id)',
    'const query = `SELECT * FROM users WHERE name = ${name}`'
  ],
  shouldNotDetect: [
    'db.query("SELECT * FROM users WHERE id = ?", [id])',
    'const query = db.format("SELECT * FROM users WHERE id = ?", {id})'
  ]
});

console.log(`Pattern test: ${result.passed ? 'PASSED' : 'FAILED'}`);
```

### Batch Testing

```bash
# Test all patterns
atheon test --all-patterns

# Test specific category
atheon test --category security

# Generate test report
atheon test --report json > pattern-tests.json
```

## 📈 Pattern Maintenance

### Regular Updates

- **Monthly**: Review and update patterns based on new security vulnerabilities
- **Quarterly**: Analyze false positives and refine pattern matching
- **Annually**: Review deprecated patterns and add new categories

### Performance Optimization

- Pattern caching for faster repeated scans
- Lazy loading of category-specific patterns
- Optimized regex for better performance

## 🔗 Resources

### Documentation
- [Atheon Main Documentation](https://github.com/HoraDomu/Atheon)
- [Pattern Contribution Guide](https://github.com/HoraDomu/Atheon/blob/main/CONTRIBUTING.md)
- [API Reference](https://github.com/HoraDomu/Atheon/blob/main/API.md)

### Community
- [Issue Tracker](https://github.com/HoraDomu/Atheon/issues)
- [Pattern Requests](https://github.com/HoraDomu/Atheon/discussions)
- [Security Advisory](https://github.com/HoraDomu/Atheon/security/advisories)

### Standards and References
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [CWE Dictionary](https://cwe.mitre.org/data/)

---

**Current Version**: Dynamic pattern loading
**Last Updated**: June 21, 2026
**Maintained By**: Atheon Community