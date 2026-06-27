import { logger } from '../logging';
/**
 * Atheon Binary Integration
 * Integration with actual Atheon Go binary for pattern matching
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGunzip } from 'zlib';

const exec = promisify(require('child_process').exec);
const execFile = promisify(require('child_process').execFile);

// Pattern definition from bundle
export interface BundlePattern {
  name: string;
  category: string;
  match: string;
  enabled: boolean;
}

// UUID generator using crypto
function uuidv4(): string {
  return crypto.randomUUID();
}

/**
 * Load patterns from gzip bundle file
 */
export async function loadPatternsFromBundle(bundlePath: string): Promise<BundlePattern[]> {
  try {
    // Check if file exists first
    await readFile(bundlePath);
  } catch {
    // Bundle doesn't exist - return empty array
    logger.warn(`Bundle file not found at ${bundlePath}`);
    return [];
  }

  try {
    // Read and decompress the bundle
    const chunks: Buffer[] = [];
    const decompressor = createGunzip();

    await pipeline(
      createReadStream(bundlePath),
      decompressor,
      async function* (source) {
        for await (const chunk of source) {
          chunks.push(chunk);
        }
      }
    );

    const jsonContent = Buffer.concat(chunks).toString('utf8');
    const patterns = JSON.parse(jsonContent) as BundlePattern[];

    return patterns.filter(p => p.enabled);
  } catch (error) {
    logger.warn(`Failed to load patterns from bundle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

export interface AtheonFinding {
  rule: string;
  file: string;
  line?: number;
  column?: number;
  content?: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface AtheonScanResult {
  findings: AtheonFinding[];
  scanTime: number;
  filesScanned: number;
  categories: string[];
  timestamp: Date;
}

export interface AtheonConfig {
  binaryPath: string;
  categories?: string[];
  severity?: ('critical' | 'high' | 'medium' | 'low')[];
  timeout?: number;
}

/**
 * Atheon Binary Scanner Class
 */
export class AtheonBinaryScanner {
  private config: Required<AtheonConfig>;
  private tempDir: string;

  constructor(config: Partial<AtheonConfig> = {}) {
    this.config = {
      binaryPath: config.binaryPath || process.env.ATHEON_BINARY_PATH || 'atheon',
      categories: config.categories || ['secrets', 'code-quality', 'security'],
      severity: config.severity || ['critical', 'high', 'medium'],
      timeout: config.timeout || 10000,
    };

    this.tempDir = process.env.ATHEON_TEMP_DIR || require('os').tmpdir();
  }

  /**
   * Scan code content using Atheon binary
   */
  async scanContent(content: string, filename?: string): Promise<AtheonScanResult> {
    const startTime = Date.now();
    const tempFile = filename || `scan-${uuidv4()}.txt`;
    const tempPath = join(this.tempDir, tempFile);

    try {
      // Create temp directory if it doesn't exist
      await exec(`mkdir -p ${this.tempDir}`);

      // Write content to temp file
      await writeFile(tempPath, content);

      // Run Atheon scan
      const result = await this.runAtheonScan(tempPath);

      const scanTime = Date.now() - startTime;

      // Clean up temp file
      await unlink(tempPath).catch((err) => logger.warn('Failed to clean up temp file:', tempPath, err));

      return {
        findings: result.findings,
        scanTime,
        filesScanned: 1,
        categories: this.config.categories,
        timestamp: new Date(),
      };

    } catch (error) {
      // Clean up on error
      await unlink(tempPath).catch((err) => logger.warn('Failed to clean up temp file:', tempPath, err));

      throw new Error(`Atheon scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Scan multiple files using Atheon binary
   */
  async scanDirectory(directory: string): Promise<AtheonScanResult> {
    const startTime = Date.now();

    try {
      const result = await this.runAtheonScan(directory);
      const scanTime = Date.now() - startTime;

      return {
        findings: result.findings,
        scanTime,
        filesScanned: result.filesScanned,
        categories: this.config.categories,
        timestamp: new Date(),
      };

    } catch (error) {
      throw new Error(`Atheon directory scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Run Atheon binary and parse results
   */
  private async runAtheonScan(path: string): Promise<{
    findings: AtheonFinding[];
    filesScanned: number;
  }> {
    const categories = this.config.categories.join(',');
    // Use execFile with array args to avoid shell injection
    const args = ['--json', '--categories=' + categories, path];

    try {
      const { stdout, stderr } = await execFile(this.config.binaryPath, args, {
        timeout: this.config.timeout,
      });

      // Parse JSON output
      const findings = JSON.parse(stdout || '[]');

      // Get files scanned count from stderr
      const filesScannedMatch = stderr.match(/scanned (\d+) file/);
      const filesScanned = filesScannedMatch ? parseInt(filesScannedMatch[1]) : 1;

      return {
        findings: Array.isArray(findings) ? findings.map(this.normalizeFinding) : [],
        filesScanned,
      };

    } catch (error: any) {
      // Handle timeout or other errors
      if (error.killed) {
        throw new Error('Atheon scan timeout exceeded');
      }

      // Try to parse partial output
      if (error.stdout) {
        try {
          const findings = JSON.parse(error.stdout);
          return {
            findings: Array.isArray(findings) ? findings.map(this.normalizeFinding) : [],
            filesScanned: 0,
          };
        } catch {
          // If parsing fails, return empty results
          return { findings: [], filesScanned: 0 };
        }
      }

      throw error;
    }
  }

  /**
   * Normalize finding format from Atheon output
   */
  private normalizeFinding(finding: any): AtheonFinding {
    return {
      rule: finding.rule || finding.type || 'unknown',
      file: finding.file || finding.path || 'unknown',
      line: finding.line || finding.line_number,
      column: finding.column || finding.col,
      content: finding.content || finding.match || '',
      category: this.categorizeFinding(finding.rule || finding.type),
      severity: this.normalizeSeverity(finding.severity),
    };
  }

  /**
   * Categorize finding based on rule name
   */
  private categorizeFinding(rule: string): string {
    const ruleLower = rule.toLowerCase();

    if (ruleLower.includes('key') || ruleLower.includes('secret') || ruleLower.includes('password')) {
      return 'secrets';
    }
    if (ruleLower.includes('sql') || ruleLower.includes('injection') || ruleLower.includes('xss')) {
      return 'security';
    }
    if (ruleLower.includes('var ') || ruleLower.includes('console') || ruleLower.includes('debugger')) {
      return 'code-quality';
    }

    return 'general';
  }

  /**
   * Normalize severity to standard values
   */
  private normalizeSeverity(severity: any): 'critical' | 'high' | 'medium' | 'low' {
    const severityLower = String(severity).toLowerCase();

    if (['critical', 'high', 'error'].includes(severityLower)) {
      return 'critical';
    }
    if (['medium', 'warning'].includes(severityLower)) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * List available categories in Atheon
   */
  async listCategories(): Promise<string[]> {
    try {
      const { stdout } = await exec(`${this.config.binaryPath} list categories`);
      return stdout.trim().split('\n').filter(Boolean);
    } catch {
      return this.config.categories; // Return default categories if listing fails
    }
  }

  /**
   * List available patterns in Atheon
   */
  async listPatterns(): Promise<string[]> {
    try {
      const { stdout } = await exec(`${this.config.binaryPath} list`);
      return stdout.trim().split('\n').filter(Boolean);
    } catch {
      return []; // Return empty array if listing fails
    }
  }
}

/**
 * Helper function to write temp files
 */
async function writeFile(path: string, content: string): Promise<void> {
  const { writeFile } = require('fs/promises');
  await writeFile(path, content, 'utf8');
}

/**
 * Create Atheon scanner instance
 */
export function createAtheonScanner(config?: Partial<AtheonConfig>): AtheonBinaryScanner {
  return new AtheonBinaryScanner(config);
}

/**
 * Default Atheon configuration for benchmarking
 */
export const DEFAULT_ATHEON_CONFIG: AtheonConfig = {
  binaryPath: process.env.ATHEON_BINARY_PATH || 'atheon',
  categories: ['secrets', 'code-quality', 'security'],
  severity: ['critical', 'high', 'medium'],
  timeout: 10000,
};