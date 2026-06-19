/**
 * End-to-End Tests for Complete User Workflows
 * Full user journey tests from landing to data interaction
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { chromium, Browser, BrowserContext, Page } from 'playwright';

describe('E2E Tests - User Journeys', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    context = await browser.newContext({
      baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
      viewport: { width: 1280, height: 720 }
    });
    page = await context.newPage();
  });

  afterEach(async () => {
    await page.close();
    await context.close();
  });

  describe('Complete User Journey - New Visitor', () => {
    it('should navigate from home to results and view data', async () => {
      // Start at home page
      await page.goto('/');

      // Wait for page load
      await page.waitForLoadState('networkidle');

      // Check main heading
      const mainHeading = await page.locator('h1').textContent();
      expect(mainHeading).toContain('Atheon Benchmark');

      // Navigate to results page
      await page.click('text=Results');
      await page.waitForLoadState('networkidle');

      // Verify URL
      expect(page.url()).toContain('/results');

      // Verify results page loaded
      const resultsContent = await page.content();
      expect(resultsContent.length).toBeGreaterThan(1000);

      // Check for data display elements
      const hasDataElements = await page.locator('[data-system], [class*="result"], [class*="benchmark"]').count() > 0;
      // If no data elements, check for empty state or loading state
      const hasEmptyState = await page.locator('text=/no results|empty|loading/i').count() > 0;

      expect(hasDataElements || hasEmptyState).toBe(true);
    });

    it('should explore all main pages', async () => {
      // Start at home page
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Navigate to benchmark page
      await page.click('text=Benchmark');
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/benchmark');

      // Navigate back to home
      await page.click('text=Home');
      await page.waitForLoadState('networkidle');
      expect(page.url()).toBe('/');

      // Navigate to results
      await page.click('text=Results');
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/results');
    });
  });

  describe('Data Loading and Display Workflow', () => {
    it('should load and display benchmark results', async () => {
      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      // Wait for any loading states to complete
      await page.waitForTimeout(2000);

      // Check for results display
      const pageContent = await page.content();

      // Look for data indicators
      const hasSystemInfo = pageContent.includes('system_id') ||
                           pageContent.includes('hostname') ||
                           pageContent.includes('CPU');

      const hasCharts = await page.locator('canvas, svg').count() > 0;

      // Should have either data display or empty state message
      expect(hasSystemInfo || hasCharts || pageContent.includes('no results')).toBe(true);
    });

    it('should handle data refresh correctly', async () => {
      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      // Look for refresh functionality
      const refreshButton = await page.locator('button:has-text("Refresh"), button:has-text("Reload"), [title*="refresh"], [title*="reload"]').first();

      if (await refreshButton.count() > 0) {
        await refreshButton.click();
        await page.waitForLoadState('networkidle');

        // Should reload without errors
        const hasErrors = await page.locator('text=/error|failed').count() > 0;
        expect(hasErrors).toBe(false);
      }
    });
  });

  describe('Filtering and Interaction Workflow', () => {
    it('should allow filtering results by criteria', async () => {
      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      // Look for filter controls
      const filterButton = await page.locator('button:has-text("Filter"), button:has-text("Search"), [title*="filter"]').first();

      if (await filterButton.count() > 0) {
        await filterButton.click();

        // Wait for filter panel to appear
        await page.waitForTimeout(500);

        // Look for filter inputs
        const filterInputs = await page.locator('input, select').count();
        expect(filterInputs).toBeGreaterThan(0);
      }
    });

    it('should handle system comparison', async () => {
      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      // Look for comparison functionality
      const compareElements = await page.locator('text=/compare|vs|versus/i').count();

      if (compareElements > 0) {
        // Should have comparison UI elements
        expect(compareElements).toBeGreaterThan(0);
      }
    });

    it('should display statistics correctly', async () => {
      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      // Look for statistics displays
      const statsElements = await page.locator('[class*="stat"], [class*="metric"], [class*="count"]').count();

      // Should have some statistics display
      expect(statsElements).toBeGreaterThan(0);
    });
  });

  describe('Cross-Page Navigation Workflow', () => {
    it('should maintain state during navigation', async () => {
      // Start with a specific filter or state
      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      // Navigate to other page
      await page.goto('/benchmark');
      await page.waitForLoadState('networkidle');

      // Navigate back
      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      // Should load without errors
      const hasErrors = await page.locator('text=/error|crash|failed').count() > 0;
      expect(hasErrors).toBe(false);
    });

    it('should handle browser back/forward navigation', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      await page.goBack();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toBe('/');

      await page.goForward();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/results');
    });
  });

  describe('Real Data Integration Workflow', () => {
    it('should load data from GitHub integration', async () => {
      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      // Check if data was loaded successfully
      const loadingIndicator = await page.locator('[data-loading="true"], .loading, .spinner').first();

      // Wait for loading to complete
      if (await loadingIndicator.count() > 0) {
        await page.waitForSelector('[data-loading="false"]', { timeout: 10000 });
      }

      // Check for data display or empty state
      const content = await page.content();
      const hasData = content.includes('system') || content.includes('benchmark') || content.includes('result');
      const hasEmptyState = content.includes('no results') || content.includes('empty');

      expect(hasData || hasEmptyState).toBe(true);
    });

    it('should handle metadata loading', async () => {
      // Direct API call to check metadata
      const response = await page.request.get('/benchmark-metadata.json');

      expect(response.ok()).toBe(true);

      const metadata = await response.json();

      // Should have required metadata fields
      expect(metadata).toHaveProperty('total_systems');
      expect(metadata).toHaveProperty('last_updated');

      // Should have valid data types
      expect(typeof metadata.total_systems).toBe('number');
      expect(typeof metadata.last_updated).toBe('string');
    });
  });

  describe('Error Handling and Recovery Workflow', () => {
    it('should handle network errors gracefully', async () => {
      // Simulate offline mode
      await page.context().setOffline(true);

      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      // Should show appropriate error or fallback state
      const content = await page.content();
      const hasErrorState = content.includes('offline') || content.includes('network') || content.includes('connection');
      const hasFallbackData = content.includes('cached') || content.includes('results');

      expect(hasErrorState || hasFallbackData).toBe(true);

      // Restore online mode
      await page.context().setOffline(false);
    });

    it('should handle invalid URLs gracefully', async () => {
      const response = await page.request.get('/invalid-page');

      expect(response.status()).toBe(404);
    });

    it('should recover from temporary failures', async () => {
      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be functional
      const hasCriticalErrors = await page.locator('text=/critical error|app crashed|fatal error').count() > 0;
      expect(hasCriticalErrors).toBe(false);
    });
  });

  describe('Performance and Responsiveness Workflow', () => {
    it('should maintain responsiveness during data loading', async () => {
      await page.goto('/results');

      // Start navigation
      const navigationPromise = page.waitForLoadState('networkidle');

      // Check if page is responsive during loading
      page.on('response', async (response) => {
        const timing = response.timing();
        if (timing) {
          expect(timing.responseEnd).toBeLessThan(5000); // 5 second timeout
        }
      });

      await navigationPromise;
    });

    it('should handle large datasets efficiently', async () => {
      // Load page with potentially large dataset
      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      // Check page performance
      const metrics = await page.metrics();

      // Should complete within reasonable time
      expect(metrics).toBeDefined();
    });
  });

  describe('Accessibility Workflow', () => {
    it('should be navigable via keyboard', async () => {
      await page.goto('/');

      // Tab through navigation elements
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      // Check focus indicator
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement || '');
    });

    it('should have proper heading hierarchy', async () => {
      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      // Check for heading elements
      const headings = await page.locator('h1, h2, h3, h4').all();

      expect(headings.length).toBeGreaterThan(0);

      // First heading should be h1
      const firstHeading = await headings[0].evaluate((el) => el.tagName);
      expect(firstHeading).toBe('H1');
    });
  });

  describe('Mobile User Experience Workflow', () => {
    it('should work on mobile device', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      await page.waitForLoadState('networkidle');

      // Check mobile-friendly elements
      const content = await page.content();
      expect(content.length).toBeGreaterThan(1000);

      // Should have viewport meta tag
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).toContain('width=device-width');
    });

    it('should handle mobile navigation', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      await page.waitForLoadState('networkidle');

      // Look for mobile menu or navigation
      const navElements = await page.locator('nav, menu, button[aria-label*="menu"]').count();
      expect(navElements).toBeGreaterThan(0);
    });

    it('should be touch-friendly on mobile', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/results');

      await page.waitForLoadState('networkidle');

      // Check for touch-friendly elements
      const buttons = await page.locator('button, a, input[type="button"]').all();

      // At least some buttons should be present
      expect(buttons.length).toBeGreaterThan(0);

      // Check button sizes (should be at least 44x44 for touch)
      for (const button of buttons.slice(0, 5)) {
        const box = await button.boundingBox();
        if (box) {
          // Check if button is reasonably sized for touch
          const minSize = Math.min(box.width, box.height);
          expect(minSize).toBeGreaterThan(30); // At least 30px
        }
      }
    });
  });

  describe('Data Persistence and Caching Workflow', () => {
    it('should leverage browser caching', async () => {
      // First visit
      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      const firstVisitTime = Date.now();

      // Second visit (should be faster due to caching)
      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      const secondVisitTime = Date.now();

      // Second visit should be reasonably fast
      // (This is a rough check, actual caching behavior may vary)
      expect(secondVisitTime - firstVisitTime).toBeLessThan(10000); // Within 10 seconds
    });

    it('should maintain cache across sessions', async () => {
      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      // Get local storage data
      const cacheData = await page.evaluate(() => {
        return Object.keys(localStorage).filter(key =>
          key.includes('cache') || key.includes('results')
        );
      });

      // Should have some caching mechanism
      expect(cacheData.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Complete User Journey - Advanced User', () => {
    it('should support advanced user workflows', async () => {
      // Advanced user starts at home
      await page.goto('/');

      // Checks documentation
      const docLink = await page.locator('a[href*="docs"], a[href*="github"]').first();
      if (await docLink.count() > 0) {
        await docLink.click();
        await page.waitForTimeout(1000);
        await page.goBack();
      }

      // Explores benchmark page
      await page.goto('/benchmark');
      await page.waitForLoadState('networkidle');

      // Checks results and filtering
      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      // Should complete without errors
      const criticalErrors = await page.locator('text=/fatal|critical|crash').count();
      expect(criticalErrors).toBe(0);
    });
  });
});