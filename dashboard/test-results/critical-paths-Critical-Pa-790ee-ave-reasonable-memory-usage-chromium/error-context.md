# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-paths.spec.ts >> Critical Path Smoke Tests >> Performance Smoke Tests >> should have reasonable memory usage
- Location: __tests__/e2e/critical-paths.spec.ts:279:9

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  180 |       // Service worker should be accessible
  181 |       expect(response.status()).toBe(200);
  182 |     });
  183 | 
  184 |     test('should serve favicon', async ({ page }) => {
  185 |       const response = await page.request.get('/favicon.ico');
  186 | 
  187 |       expect(response.status()).toBe(200);
  188 |     });
  189 |   });
  190 | 
  191 |   test.describe('API Integration Smoke Tests', () => {
  192 |     test('should handle GitHub API integration', async ({ page }) => {
  193 |       await page.goto('/results');
  194 | 
  195 |       // Wait for page to load
  196 |       await page.waitForLoadState('networkidle');
  197 | 
  198 |       // Check that page doesn't show critical API errors
  199 |       const apiErrors = await page.locator('text=/API error|GitHub error/').count();
  200 |       expect(apiErrors).toBe(0);
  201 |     });
  202 | 
  203 |     test('should use cached data when available', async ({ page }) => {
  204 |       // First visit to populate cache
  205 |       await page.goto('/results');
  206 |       await page.waitForLoadState('networkidle');
  207 | 
  208 |       // Second visit should use cache
  209 |       const startTime = Date.now();
  210 |       await page.goto('/results');
  211 |       await page.waitForLoadState('networkidle');
  212 |       const loadTime = Date.now() - startTime;
  213 | 
  214 |       // Cached load should be reasonably fast (< 3 seconds)
  215 |       expect(loadTime).toBeLessThan(3000);
  216 |     });
  217 |   });
  218 | 
  219 |   test.describe('Responsive Design Smoke Tests', () => {
  220 |     test('should work on mobile viewport', async ({ page }) => {
  221 |       await page.setViewportSize({ width: 375, height: 667 });
  222 |       await page.goto('/');
  223 | 
  224 |       await page.waitForLoadState('networkidle');
  225 | 
  226 |       // Check for mobile-friendly elements
  227 |       const content = await page.content();
  228 |       expect(content.length).toBeGreaterThan(1000);
  229 | 
  230 |       // Check for viewport meta tag
  231 |       const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
  232 |       expect(viewport).toContain('width=device-width');
  233 |     });
  234 | 
  235 |     test('should work on tablet viewport', async ({ page }) => {
  236 |       await page.setViewportSize({ width: 768, height: 1024 });
  237 |       await page.goto('/');
  238 | 
  239 |       await page.waitForLoadState('networkidle');
  240 | 
  241 |       // Check for responsive elements
  242 |       const content = await page.content();
  243 |       expect(content.length).toBeGreaterThan(1000);
  244 |     });
  245 | 
  246 |     test('should work on desktop viewport', async ({ page }) => {
  247 |       await page.setViewportSize({ width: 1920, height: 1080 });
  248 |       await page.goto('/');
  249 | 
  250 |       await page.waitForLoadState('networkidle');
  251 | 
  252 |       // Check for desktop elements
  253 |       const content = await page.content();
  254 |       expect(content.length).toBeGreaterThan(1000);
  255 |     });
  256 |   });
  257 | 
  258 |   test.describe('Performance Smoke Tests', () => {
  259 |     test('should load main page quickly', async ({ page }) => {
  260 |       const startTime = Date.now();
  261 |       await page.goto('/');
  262 |       await page.waitForLoadState('networkidle');
  263 |       const loadTime = Date.now() - startTime;
  264 | 
  265 |       // Page should load in less than 5 seconds
  266 |       expect(loadTime).toBeLessThan(5000);
  267 |     });
  268 | 
  269 |     test('should load results page quickly', async ({ page }) => {
  270 |       const startTime = Date.now();
  271 |       await page.goto('/results');
  272 |       await page.waitForLoadState('networkidle');
  273 |       const loadTime = Date.now() - startTime;
  274 | 
  275 |       // Page should load in less than 5 seconds
  276 |       expect(loadTime).toBeLessThan(5000);
  277 |     });
  278 | 
  279 |     test('should have reasonable memory usage', async ({ page }) => {
> 280 |       await page.goto('/');
      |                  ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  281 | 
  282 |       // Get page metrics
  283 |       const metrics = await page.metrics();
  284 | 
  285 |       // Check for reasonable memory usage
  286 |       expect(metrics).toBeDefined();
  287 |     });
  288 |   });
  289 | 
  290 |   test.describe('Error Handling Smoke Tests', () => {
  291 |     test('should handle 404 pages gracefully', async ({ page }) => {
  292 |       const response = await page.request.get('/non-existent-page');
  293 | 
  294 |       expect(response.status()).toBe(404);
  295 |     });
  296 | 
  297 |     test('should handle invalid API data gracefully', async ({ page }) => {
  298 |       // Navigate to results page
  299 |       await page.goto('/results');
  300 |       await page.waitForLoadState('networkidle');
  301 | 
  302 |       // Page should not crash even with invalid data
  303 |       const content = await page.content();
  304 |       expect(content).toBeTruthy();
  305 |     });
  306 |   });
  307 | });
```