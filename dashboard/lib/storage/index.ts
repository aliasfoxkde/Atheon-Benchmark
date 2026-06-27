/**
 * Storage Module - Database and R2 storage utilities
 * @description D1 database and R2 object storage operations
 */
export { D1Database, createDatabase, DEFAULT_DATABASE_CONFIG } from './database';
export { R2StorageClient, LocalStorageClient, createStorageClient, getStorageClient, BenchmarkArtifactStorage } from './r2-client';
export type { StorageFile, StorageClient, UploadOptions, R2Config } from './r2-client';
