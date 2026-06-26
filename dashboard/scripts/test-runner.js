#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs all test suites with proper reporting and coverage
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n🔄 ${description}...`, colors.cyan);
  try {
    execSync(command, {
      stdio: 'inherit',
      env: { ...process.env }
    });
    log(`✅ ${description} completed`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, colors.red);
    return false;
  }
}

function createTestReport(results) {
  const reportPath = path.join(__dirname, 'test-results');
  if (!fs.existsSync(reportPath)) {
    fs.mkdirSync(reportPath, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      duration: results.duration
    },
    suites: results.suites
  };

  fs.writeFileSync(
    path.join(reportPath, 'summary.json'),
    JSON.stringify(report, null, 2)
  );

  log(`📊 Test report saved to ${reportPath}/summary.json`, colors.blue);
}

async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';

  log('🧪 Atheon Benchmark Test Suite', colors.magenta);
  log('=====================================\n', colors.magenta);

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    suites: [],
    duration: 0
  };

  const startTime = Date.now();

  if (testType === 'all' || testType === 'unit') {
    log('\n📦 Running Unit Tests...', colors.cyan);
    const unitPassed = runCommand('npm run test:unit', 'Unit Tests');
    results.suites.push({ name: 'Unit Tests', passed: unitPassed });
    results.total++;
    if (unitPassed) results.passed++; else results.failed++;
  }

  if (testType === 'all' || testType === 'smoke') {
    log('\n💨 Running Smoke Tests...', colors.cyan);
    const smokePassed = runCommand('npm run test:smoke', 'Smoke Tests');
    results.suites.push({ name: 'Smoke Tests', passed: smokePassed });
    results.total++;
    if (smokePassed) results.passed++; else results.failed++;
  }

  if (testType === 'all' || testType === 'regression') {
    log('\n🔄 Running Regression Tests...', colors.cyan);
    const regressionPassed = runCommand('npm run test:regression', 'Regression Tests');
    results.suites.push({ name: 'Regression Tests', passed: regressionPassed });
    results.total++;
    if (regressionPassed) results.passed++; else results.failed++;
  }

  if (testType === 'all' || testType === 'e2e') {
    log('\n🌐 Running E2E Tests...', colors.cyan);
    const e2ePassed = runCommand('npm run test:e2e', 'E2E Tests');
    results.suites.push({ name: 'E2E Tests', passed: e2ePassed });
    results.total++;
    if (e2ePassed) results.passed++; else results.failed++;
  }

  if (testType === 'coverage' || testType === 'all') {
    log('\n📊 Running Coverage Analysis...', colors.cyan);
    const coveragePassed = runCommand('npm run test:coverage', 'Coverage Analysis');
    results.suites.push({ name: 'Coverage Analysis', passed: coveragePassed });
    results.total++;
    if (coveragePassed) results.passed++; else results.failed++;
  }

  results.duration = Date.now() - startTime;

  // Summary
  log('\n=====================================', colors.magenta);
  log('📋 Test Summary', colors.magenta);
  log('=====================================\n', colors.magenta);

  results.suites.forEach(suite => {
    const status = suite.passed ? '✅' : '❌';
    const color = suite.passed ? colors.green : colors.red;
    log(`${status} ${suite.name}`, color);
  });

  log(`\n⏱️  Total Duration: ${results.duration}ms`, colors.cyan);
  log(`📊 Total Tests: ${results.total}`, colors.blue);
  log(`✅ Passed: ${results.passed}`, colors.green);
  log(`❌ Failed: ${results.failed}`, colors.red);

  if (results.failed === 0) {
    log('\n🎉 All tests passed!', colors.green);
  } else {
    log('\n⚠️  Some tests failed. Please check the output above.', colors.yellow);
    process.exit(1);
  }

  // Create test report
  createTestReport(results);

  log('\n📄 Test reports generated in test-results/ directory', colors.blue);
}

main().catch(error => {
  log(`\n❌ Test runner failed: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});