# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-paths.spec.ts >> Critical Path Smoke Tests >> Application Startup >> should have no console errors
- Location: __tests__/e2e/critical-paths.spec.ts:65:9

# Error details

```
Error: page.goto: NS_ERROR_CONNECTION_REFUSED
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Page snapshot

```yaml
- article "Unable to connect" [ref=e3]:
  - img "Illustration of a fox looking at disconnected network cables." [ref=e5]
  - generic [ref=e7]:
    - heading "Unable to connect" [level=1] [ref=e8]
    - paragraph [ref=e9]:
      - text: Nightly can’t connect to the server at
      - strong [ref=e10]: localhost:3000
    - generic [ref=e11]:
      - heading "What can you do about it?" [level=3] [ref=e12]
      - list [ref=e13]:
        - listitem [ref=e14]: The site could be temporarily unavailable or too busy. Try again in a few moments.
        - listitem [ref=e15]: If you are unable to load any pages, check your computer’s network connection.
        - listitem [ref=e16]: If your computer or network is protected by a firewall or proxy, make sure that Nightly is permitted to access the web.
    - button "Try Again" [ref=e19]:
      - generic [ref=e21]:
        - generic: Try Again
```

# Test source

```ts
  1   | /**
  2   |  * Smoke Tests for Critical Application Paths
  3   |  * Quick validation tests to ensure basic functionality works
  4   |  */
  5   | 
  6   | import { test, expect } from '@playwright/test';
  7   | 
  8   | test.describe('Critical Path Smoke Tests', () => {
  9   |   test.describe('Application Startup', () => {
  10  |     test('should load the main page', async ({ page }) => {
  11  |       await page.goto('/');
  12  | 
  13  |       // Wait for page to load
  14  |       await page.waitForLoadState('networkidle');
  15  | 
  16  |       // Check page title
  17  |       const title = await page.title();
  18  |       expect(title).toContain('Atheon Benchmark');
  19  | 
  20  |       // Check for main heading
  21  |       const heading = await page.locator('h1').textContent();
  22  |       expect(heading).toContain('Atheon Benchmark');
  23  |     });
  24  | 
  25  |     test('should have working navigation', async ({ page }) => {
  26  |       await page.goto('/');
  27  | 
  28  |       // Check for navigation links
  29  |       const navLinks = await page.locator('nav a').count();
  30  |       expect(navLinks).toBeGreaterThan(0);
  31  | 
  32  |       // Test main navigation link
  33  |       const mainLink = await page.locator('nav a').first();
  34  |       await mainLink.click();
  35  |       await page.waitForLoadState('networkidle');
  36  | 
  37  |       // Should still be on same page or navigate correctly
  38  |       const url = page.url();
  39  |       expect(url).toBeTruthy();
  40  |     });
  41  | 
  42  |     test('should load all static assets', async ({ page }) => {
  43  |       await page.goto('/');
  44  | 
  45  |       // Wait for page to be fully loaded
  46  |       await page.waitForLoadState('networkidle');
  47  | 
  48  |       // Check for critical assets
  49  |       const cssRequests = [];
  50  |       const jsRequests = [];
  51  | 
  52  |       page.on('request', (request) => {
  53  |         const url = request.url();
  54  |         if (url.includes('.css')) cssRequests.push(url);
  55  |         if (url.includes('.js')) jsRequests.push(url);
  56  |       });
  57  | 
  58  |       await page.waitForLoadState('networkidle');
  59  | 
  60  |       // Should have loaded CSS and JS files
  61  |       expect(cssRequests.length).toBeGreaterThan(0);
  62  |       expect(jsRequests.length).toBeGreaterThan(0);
  63  |     });
  64  | 
  65  |     test('should have no console errors', async ({ page }) => {
  66  |       const consoleErrors: string[] = [];
  67  | 
  68  |       page.on('console', (msg) => {
  69  |         if (msg.type() === 'error') {
  70  |           consoleErrors.push(msg.text());
  71  |         }
  72  |       });
  73  | 
> 74  |       await page.goto('/');
      |                  ^ Error: page.goto: NS_ERROR_CONNECTION_REFUSED
  75  |       await page.waitForLoadState('networkidle');
  76  | 
  77  |       // Should have no console errors
  78  |       expect(consoleErrors.length).toBe(0);
  79  |     });
  80  |   });
  81  | 
  82  |   test.describe('Results Page Smoke Tests', () => {
  83  |     test('should load the results page', async ({ page }) => {
  84  |       await page.goto('/results');
  85  | 
  86  |       // Wait for page to load
  87  |       await page.waitForLoadState('networkidle');
  88  | 
  89  |       // Check URL
  90  |       expect(page.url()).toContain('/results');
  91  | 
  92  |       // Check for results page elements
  93  |       const heading = await page.locator('h1, h2').first().textContent();
  94  |       expect(heading).toBeTruthy();
  95  |     });
  96  | 
  97  |     test('should load benchmark data', async ({ page }) => {
  98  |       await page.goto('/results');
  99  | 
  100 |       // Wait for data to load
  101 |       await page.waitForLoadState('networkidle');
  102 | 
  103 |       // Check for data loading indicator to disappear
  104 |       try {
  105 |         await page.waitForSelector('[data-loading="false"]', { timeout: 5000 });
  106 |       } catch (error) {
  107 |         // If no loading indicator, check for results content
  108 |         const content = await page.content();
  109 |         expect(content.length).toBeGreaterThan(1000);
  110 |       }
  111 |     });
  112 | 
  113 |     test('should display static results file', async ({ page }) => {
  114 |       const response = await page.request.get('/benchmark-results.json');
  115 | 
  116 |       expect(response.ok()).toBe(true);
  117 | 
  118 |       const data = await response.json();
  119 |       expect(Array.isArray(data)).toBe(true);
  120 | 
  121 |       // Should have at least the structure of benchmark results
  122 |       if (data.length > 0) {
  123 |         expect(data[0]).toHaveProperty('system_id');
  124 |         expect(data[0]).toHaveProperty('system_info');
  125 |       }
  126 |     });
  127 | 
  128 |     test('should display metadata file', async ({ page }) => {
  129 |       const response = await page.request.get('/benchmark-metadata.json');
  130 | 
  131 |       expect(response.ok()).toBe(true);
  132 | 
  133 |       const data = await response.json();
  134 |       expect(data).toHaveProperty('total_systems');
  135 |       expect(data).toHaveProperty('last_updated');
  136 |     });
  137 |   });
  138 | 
  139 |   test.describe('Benchmark Page Smoke Tests', () => {
  140 |     test('should load the benchmark page', async ({ page }) => {
  141 |       await page.goto('/benchmark');
  142 | 
  143 |       // Wait for page to load
  144 |       await page.waitForLoadState('networkidle');
  145 | 
  146 |       // Check URL
  147 |       expect(page.url()).toContain('/benchmark');
  148 | 
  149 |       // Check for benchmark page elements
  150 |       const content = await page.content();
  151 |       expect(content.length).toBeGreaterThan(1000);
  152 |     });
  153 | 
  154 |     test('should have benchmark form or content', async ({ page }) => {
  155 |       await page.goto('/benchmark');
  156 | 
  157 |       // Wait for page to load
  158 |       await page.waitForLoadState('networkidle');
  159 | 
  160 |       // Check for form elements or content
  161 |       const forms = await page.locator('form, button, input').count();
  162 |       expect(forms).toBeGreaterThan(0);
  163 |     });
  164 |   });
  165 | 
  166 |   test.describe('Static Assets Smoke Tests', () => {
  167 |     test('should serve manifest.json', async ({ page }) => {
  168 |       const response = await page.request.get('/manifest.json');
  169 | 
  170 |       expect(response.ok()).toBe(true);
  171 | 
  172 |       const manifest = await response.json();
  173 |       expect(manifest).toHaveProperty('name');
  174 |       expect(manifest).toHaveProperty('short_name');
```