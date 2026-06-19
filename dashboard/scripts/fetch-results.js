#!/usr/bin/env node

/**
 * Build-time Results Fetcher Script
 * Fetches GitHub benchmark results during build for static export
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const GITHUB_OWNER = 'aliasfoxkde';
const GITHUB_REPO = 'atheon-benchmark-results'; // lowercase for API compatibility
const GITHUB_API_BASE = 'api.github.com';
const RESULTS_PATH = 'results';

/**
 * Fetch data from GitHub API
 */
function fetchGitHub(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: GITHUB_API_BASE,
      path: `/${path}`, // Add leading slash
      method: 'GET',
      headers: {
        'User-Agent': 'Atheon-Benchmark-Build',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    // Add token if available
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const protocol = https;

    const req = protocol.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        } else {
          console.error(`GitHub API error: ${res.statusCode} ${res.statusMessage}`);
          console.error(`Response body: ${data.substring(0, 200)}`);
          reject(new Error(`GitHub API error: ${res.statusCode} ${res.statusMessage}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Fetch all benchmark results recursively
 */
async function fetchAllResults(path = `repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${RESULTS_PATH}`) {
  try {
    console.log(`📥 Fetching ${path}...`);
    const data = await fetchGitHub(path);

    if (!Array.isArray(data)) {
      return [];
    }

    const results = [];

    for (const item of data) {
      if (item.type === 'dir') {
        // Use the API URL from the item for recursive calls
        const apiPath = item.url.replace('https://api.github.com/', '');
        const dirResults = await fetchAllResults(apiPath);
        results.push(...dirResults);
      } else if (item.type === 'file' && item.name.endsWith('.json')) {
        try {
          // Use the API URL from the item for file content
          const apiPath = item.url.replace('https://api.github.com/', '');
          const fileData = await fetchGitHub(apiPath);
          if (fileData.content) {
            const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
            const parsed = JSON.parse(content);
            results.push(parsed);
            console.log(`✅ Loaded ${item.name}`);
          }
        } catch (error) {
          console.warn(`⚠️  Failed to load ${item.name}: ${error.message}`);
        }
      }
    }

    return results;
  } catch (error) {
    console.error(`❌ Failed to fetch ${path}:`, error.message);
    return [];
  }
}

async function main() {
  console.log('🚀 Fetching benchmark results for build...');

  try {
    const results = await fetchAllResults();

    // Sort by submission date (newest first)
    results.sort((a, b) =>
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );

    console.log(`📊 Total results fetched: ${results.length}`);

    // Create public directory
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write results to file
    const resultsFile = path.join(publicDir, 'benchmark-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

    console.log(`✅ Saved results to ${resultsFile}`);
    console.log(`📈 ${results.length} benchmark reports ready for deployment`);

    // Create metadata file
    const metadata = {
      total_systems: results.length,
      last_updated: new Date().toISOString(),
      systems_by_os: {},
      date_range: {
        oldest: results.length > 0 ? results[results.length - 1].submitted_at : null,
        newest: results.length > 0 ? results[0].submitted_at : null
      }
    };

    // Count systems by OS
    results.forEach(result => {
      const os = result.system_info?.os || 'unknown';
      metadata.systems_by_os[os] = (metadata.systems_by_os[os] || 0) + 1;
    });

    const metadataFile = path.join(publicDir, 'benchmark-metadata.json');
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    console.log(`✅ Saved metadata to ${metadataFile}`);

  } catch (error) {
    console.error('❌ Failed to fetch results:', error);

    // Create empty results file as fallback
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const emptyResults = [];
    fs.writeFileSync(path.join(publicDir, 'benchmark-results.json'), JSON.stringify(emptyResults, null, 2));
    console.log('⚠️  Created empty results file as fallback');
  }
}

main();