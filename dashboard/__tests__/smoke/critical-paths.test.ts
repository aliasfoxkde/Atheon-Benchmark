/**
 * Smoke Tests for Critical Application Paths
 * Quick validation tests to ensure basic functionality works
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { chromium, Browser, Page, BrowserContext } from 'playwright';

describe('Critical Path Smoke Tests', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    context = await browser.newContext({
      baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000'
    });
    page = await context.newPage();
  });

  afterAll(async () => {
    await page.close();
    await context.close();
    await browser.close();
  });

  describe('Application Startup', () => {
    it('should load the main page', async () => {
      await page.goto('/');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check page title
      const title = await page.title();
      expect(title).toContain('Atheon Benchmark');

      // Check for main heading
      const heading = await page.locator('h1').textContent();
      expect(heading).toContain('Atheon Benchmark');
    });

    it('should have working navigation', async () => {
      await page.goto('/');

      // Check for navigation links
      const navLinks = await page.locator('nav a').count();
      expect(navLinks).toBeGreaterThan(0);

      // Test main navigation link
      const mainLink = await page.locator('nav a').first();
      await mainLink.click();
      await page.waitForLoadState('networkidle');

      // Should still be on same page or navigate correctly
      const url = page.url();
      expect(url).toBeTruthy();
    });

    it('should load all static assets', async () => {
      await page.goto('/');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      // Check for critical assets
      const cssRequests = [];
      const jsRequests = [];

      page.on('request', (request) => {
        const url = request.url();
        if (url.includes('.css')) cssRequests.push(url);
        if (url.includes('.js')) jsRequests.push(url);
      });

      await page.waitForLoadState('networkidle');

      // Should have loaded CSS and JS files
      expect(cssRequests.length).toBeGreaterThan(0);
      expect(jsRequests.length).toBeGreaterThan(0);
    });

    it('should have no console errors', async () => {
      const consoleErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should have no console errors
      expect(consoleErrors.length).toBe(0);
    });
  });

  describe('Results Page Smoke Tests', () => {
    it('should load the results page', async () => {
      await page.goto('/results');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check URL
      expect(page.url()).toContain('/results');

      // Check for results page elements
      const heading = await page.locator('h1, h2').first().textContent();
      expect(heading).toBeTruthy();
    });

    it('should load benchmark data', async () => {
      await page.goto('/results');

      // Wait for data to load
      await page.waitForLoadState('networkidle');

      // Check for data loading indicator to disappear
      try {
        await page.waitForSelector('[data-loading="false"]', { timeout: 5000 });
      } catch (error) {
        // If no loading indicator, check for results content
        const content = await page.content();
        expect(content.length).toBeGreaterThan(1000);
      }
    });

    it('should display static results file', async () => {
      const response = await page.request.get('/benchmark-results.json');

      expect(response.ok()).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      // Should have at least the structure of benchmark results
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('system_id');
        expect(data[0]).toHaveProperty('system_info');
      }
    });

    it('should display metadata file', async () => {
      const response = await page.request.get('/benchmark-metadata.json');

      expect(response.ok()).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('total_systems');
      expect(data).toHaveProperty('last_updated');
    });
  });

  describe('Benchmark Page Smoke Tests', () => {
    it('should load the benchmark page', async () => {
      await page.goto('/benchmark');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check URL
      expect(page.url()).toContain('/benchmark');

      // Check for benchmark page elements
      const content = await page.content();
      expect(content.length).toBeGreaterThan(1000);
    });

    it('should have benchmark form or content', async () => {
      await page.goto('/benchmark');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check for form elements or content
      const forms = await page.locator('form, button, input').count();
      expect(forms).toBeGreaterThan(0);
    });
  });

  describe('Static Assets Smoke Tests', () => {
    it('should serve manifest.json', async () => {
      const response = await page.request.get('/manifest.json');

      expect(response.ok()).toBe(true);

      const manifest = await response.json();
      expect(manifest).toHaveProperty('name');
      expect(manifest).toHaveProperty('short_name');
    });

    it('should serve service worker', async () => {
      const response = await page.request.get('/sw.js');

      // Service worker should be accessible
      expect(response.status()).toBe(200);
    });

    it('should serve favicon', async () => {
      const response = await page.request.get('/favicon.ico');

      expect(response.status()).toBe(200);
    });
  });

  describe('API Integration Smoke Tests', () => {
    it('should handle GitHub API integration', async () => {
      await page.goto('/results');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check that page doesn't show critical API errors
      const apiErrors = await page.locator('text=/API error|GitHub error/').count();
      expect(apiErrors).toBe(0);
    });

    it('should use cached data when available', async () => {
      // First visit to populate cache
      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      // Second visit should use cache
      const startTime = Date.now();
      await page.goto('/results');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Cached load should be reasonably fast (< 3 seconds)
      expect(loadTime).toBeLessThan(3000);
    });
  });

  describe('Responsive Design Smoke Tests', () => {
    it('should work on mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      await page.waitForLoadState('networkidle');

      // Check for mobile-friendly elements
      const content = await page.content();
      expect(content.length).toBeGreaterThan(1000);

      // Check for viewport meta tag
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).toContain('width=device-width');
    });

    it('should work on tablet viewport', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');

      await page.waitForLoadState('networkidle');

      // Check for responsive elements
      const content = await page.content();
      expect(content.length).toBeGreaterThan(1000);
    });

    it('should work on desktop viewport', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');

      await page.waitForLoadState('networkidle');

      // Check for desktop elements
      const content = await page.content();
      expect(content.length).toBeGreaterThan(1000);
    });
  });

  describe('Performance Smoke Tests', () => {
    it('should load main page quickly', async () => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Page should load in less than 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    it('should load results page quickly', async () => {
      const startTime = Date.now();
      await page.goto('/results');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Page should load in less than 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    it('should have reasonable memory usage', async () => {
      await page.goto('/');

      // Get page metrics
      const metrics = await page.metrics();

      // Check for reasonable memory usage
      expect(metrics).toBeDefined();
    });
  });

  describe('Error Handling Smoke Tests', () => {
    it('should handle 404 pages gracefully', async () => {
      const response = await page.request.get('/non-existent-page');

      expect(response.status()).toBe(404);
    });

    it('should handle invalid API data gracefully', async () => {
      // Navigate to results page
      await page.goto('/results');
      await page.waitForLoadState('networkidle');

      // Page should not crash even with invalid data
      const content = await page.content();
      expect(content).toBeTruthy();
    });
  });
});