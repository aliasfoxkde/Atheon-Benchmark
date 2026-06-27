/**
 * Cloudflare R2 Storage Client
 * Provides storage abstraction for benchmark artifacts using R2 when available
 * Falls back to local storage / IndexedDB for development
 */

export interface StorageFile {
  key: string;
  content: ArrayBuffer | string;
  contentType: string;
  size: number;
  uploadedAt: Date;
  metadata?: Record<string, string>;
}

export interface StorageClient {
  upload(key: string, content: ArrayBuffer | string, options?: UploadOptions): Promise<StorageFile>;
  download(key: string): Promise<StorageFile | null>;
  delete(key: string): Promise<boolean>;
  list(prefix?: string): Promise<StorageFile[]>;
  exists(key: string): Promise<boolean>;
  getUrl(key: string): Promise<string>;
  /** Release a URL previously obtained from getUrl to prevent memory leaks */
  revokeUrl(url: string): void;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl?: string;
}

const R2_STORAGE_PREFIX = 'atheon-r2-';

/**
 * R2 Storage Client for Cloudflare
 */
export class R2StorageClient implements StorageClient {
  private config: R2Config;
  private baseUrl: string;

  constructor(config: R2Config) {
    this.config = config;
    this.baseUrl = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}`;
  }

  /**
   * Generate authorization signature for R2 API
   */
  private async generateAuth(method: string, path: string, date: string, contentType: string = ''): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${method}\n${path}\n${date}\n${contentType}`);

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.config.secretAccessKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, data);
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return `${this.config.accessKeyId}:${signatureHex}`;
  }

  async upload(key: string, content: ArrayBuffer | string, options?: UploadOptions): Promise<StorageFile> {
    const date = new Date().toUTCString();
    const path = `/${key}`;
    const contentType = options?.contentType || 'application/octet-stream';

    const auth = await this.generateAuth('PUT', path, date, contentType);

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `AWS ${auth}`,
        'x-amz-date': date,
        'Content-Type': contentType,
        'Cache-Control': options?.cacheControl || 'max-age=31536000',
        ...Object.fromEntries(
          Object.entries(options?.metadata || {}).map(([k, v]) => [`x-amz-meta-${k}`, v])
        ),
      },
      body: content,
    });

    if (!response.ok) {
      throw new Error(`R2 upload failed: ${response.status} ${response.statusText}`);
    }

    return {
      key,
      content,
      contentType,
      size: typeof content === 'string' ? new TextEncoder().encode(content).length : content.byteLength,
      uploadedAt: new Date(),
      metadata: options?.metadata,
    };
  }

  async download(key: string): Promise<StorageFile | null> {
    const date = new Date().toUTCString();
    const path = `/${key}`;

    const auth = await this.generateAuth('GET', path, date);

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: {
        'Authorization': `AWS ${auth}`,
        'x-amz-date': date,
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`R2 download failed: ${response.status}`);
    }

    const content = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';

    return {
      key,
      content,
      contentType,
      size: content.byteLength,
      uploadedAt: new Date(),
    };
  }

  async delete(key: string): Promise<boolean> {
    const date = new Date().toUTCString();
    const path = `/${key}`;

    const auth = await this.generateAuth('DELETE', path, date);

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `AWS ${auth}`,
        'x-amz-date': date,
      },
    });

    return response.ok || response.status === 404;
  }

  async list(prefix: string = ''): Promise<StorageFile[]> {
    const date = new Date().toUTCString();
    const path = `/?prefix=${encodeURIComponent(prefix)}`;

    const auth = await this.generateAuth('GET', path, date);

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: {
        'Authorization': `AWS ${auth}`,
        'x-amz-date': date,
      },
    });

    if (!response.ok) {
      throw new Error(`R2 list failed: ${response.status}`);
    }

    const xml = await response.text();
    // Parse S3-style XML listing
    const files: StorageFile[] = [];
    const regex = /<Contents>[\s\S]*?<Key>(.*?)<\/Key>[\s\S]*?<Size>(.*?)<\/Size>[\s\S]*?<LastModified>(.*?)<\/LastModified>[\s\S]*?<\/Contents>/g;
    let match;

    while ((match = regex.exec(xml)) !== null) {
      files.push({
        key: match[1],
        content: '',
        contentType: '',
        size: parseInt(match[2], 10),
        uploadedAt: new Date(match[3]),
      });
    }

    return files;
  }

  async exists(key: string): Promise<boolean> {
    const file = await this.download(key);
    return file !== null;
  }

  async getUrl(key: string): Promise<string> {
    if (this.config.publicUrl) {
      return `${this.config.publicUrl}/${key}`;
    }
    // Generate presigned URL (simplified - real implementation would use presigning)
    return `${this.baseUrl}/${key}`;
  }

  revokeUrl(url: string): void {
    // R2 URLs are pre-signed and self-expiring, no revocation needed
  }
}

/**
 * Local Storage fallback using IndexedDB
 */
export class LocalStorageClient implements StorageClient {
  private dbName: string;
  private storeName: string;
  private createdUrls: string[] = [];

  constructor(dbName: string = 'atheon-storage', storeName: string = 'files') {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async upload(key: string, content: ArrayBuffer | string, options?: UploadOptions): Promise<StorageFile> {
    const db = await this.openDB();
    const size = typeof content === 'string' ? new TextEncoder().encode(content).length : content.byteLength;

    const file: StorageFile = {
      key,
      content,
      contentType: options?.contentType || 'application/octet-stream',
      size,
      uploadedAt: new Date(),
      metadata: options?.metadata,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.put(file);

      tx.oncomplete = () => resolve(file);
      tx.onerror = () => reject(tx.error);
    });
  }

  async download(key: string): Promise<StorageFile | null> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<boolean> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.delete(key);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async list(prefix: string = ''): Promise<StorageFile[]> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const files = request.result.filter((f: StorageFile) => f.key.startsWith(prefix));
        resolve(files);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async exists(key: string): Promise<boolean> {
    const file = await this.download(key);
    return file !== null;
  }

  async getUrl(key: string): Promise<string> {
    // For local storage, we can't generate a URL
    // Return a data URL for small content or throw
    const file = await this.download(key);
    if (!file) throw new Error('File not found');

    if (typeof file.content === 'string') {
      return `data:${file.contentType};base64,${btoa(file.content)}`;
    }

    const blob = new Blob([file.content], { type: file.contentType });
    const url = URL.createObjectURL(blob);
    this.createdUrls.push(url);
    return url;
  }

  revokeUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      this.createdUrls = this.createdUrls.filter(u => u !== url);
    }
  }
}

/**
 * Create appropriate storage client based on environment
 */
export function createStorageClient(): StorageClient {
  // Check if R2 credentials are available
  const r2Config: R2Config | null = (() => {
    const accountId = process.env.CF_ACCOUNT_ID || (typeof window !== 'undefined' ? (window as any).__env?.CF_ACCOUNT_ID : undefined);
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || (typeof window !== 'undefined' ? (window as any).__env?.R2_ACCESS_KEY_ID : undefined);
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET || (typeof window !== 'undefined' ? (window as any).__env?.R2_BUCKET : undefined);
    const publicUrl = process.env.R2_PUBLIC_URL || (typeof window !== 'undefined' ? (window as any).__env?.R2_PUBLIC_URL : undefined);

    if (accountId && accessKeyId && secretAccessKey && bucket) {
      return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
    }
    return null;
  })();

  if (r2Config) {
    return new R2StorageClient(r2Config);
  }

  // Fallback to local storage
  return new LocalStorageClient();
}

// Singleton instance
let storageClient: StorageClient | null = null;

export function getStorageClient(): StorageClient {
  if (!storageClient) {
    storageClient = createStorageClient();
  }
  return storageClient;
}

/**
 * Benchmark artifact storage helpers
 */
export class BenchmarkArtifactStorage {
  private client: StorageClient;

  constructor(client?: StorageClient) {
    this.client = client || getStorageClient();
  }

  /**
   * Store a benchmark result artifact
   */
  async storeResult(benchmarkId: string, result: any): Promise<StorageFile> {
    const key = `benchmarks/${benchmarkId}/${Date.now()}.json`;
    const content = JSON.stringify(result, null, 2);

    return this.client.upload(key, content, {
      contentType: 'application/json',
      metadata: {
        benchmarkId,
        type: 'benchmark-result',
      },
      cacheControl: 'max-age=604800', // 7 days
    });
  }

  /**
   * Store benchmark logs
   */
  async storeLogs(benchmarkId: string, logs: string[]): Promise<StorageFile> {
    const key = `benchmarks/${benchmarkId}/logs/${Date.now()}.txt`;
    const content = logs.join('\n');

    return this.client.upload(key, content, {
      contentType: 'text/plain',
      metadata: {
        benchmarkId,
        type: 'benchmark-logs',
      },
    });
  }

  /**
   * Store benchmark performance trace
   */
  async storeTrace(benchmarkId: string, trace: any): Promise<StorageFile> {
    const key = `benchmarks/${benchmarkId}/trace/${Date.now()}.json`;
    const content = JSON.stringify(trace);

    return this.client.upload(key, content, {
      contentType: 'application/json',
      metadata: {
        benchmarkId,
        type: 'performance-trace',
      },
    });
  }

  /**
   * List all artifacts for a benchmark
   */
  async listArtifacts(benchmarkId: string): Promise<StorageFile[]> {
    return this.client.list(`benchmarks/${benchmarkId}/`);
  }

  /**
   * Get artifact URL for sharing
   */
  async getArtifactUrl(key: string): Promise<string> {
    return this.client.getUrl(key);
  }
}