import { Readable } from 'stream';

/**
 * Represents a file to be stored
 */
export interface StorageFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  encoding?: string;
}

/**
 * Result of storing a file
 */
export interface StorageResult {
  success: boolean;
  fileId?: string;
  path?: string;
  url?: string;
  size?: number;
  checksum?: string;
  metadata?: Record<string, unknown>;
  error?: string;
  message?: string;
}

/**
 * Result of retrieving a file
 */
export interface FileRetrievalResult {
  success: boolean;
  buffer?: Buffer;
  stream?: Readable;
  metadata?: {
    filename: string;
    mimeType: string;
    size: number;
    originalName: string;
    encoding?: string;
  };
  error?: string;
}

/**
 * Storage provider configuration
 */
export interface StorageConfig {
  type: 'database' | 'filesystem' | 's3' | 'azure' | 'gcs';
  basePath?: string;
  bucket?: string;
  region?: string;
  credentials?: Record<string, unknown>;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
}

/**
 * Interface for storage providers
 */
export interface IStorageProvider {
  /**
   * Store a file
   */
  store(file: StorageFile, fileId: string): Promise<StorageResult>;

  /**
   * Retrieve a file
   */
  retrieve(fileId: string): Promise<FileRetrievalResult>;

  /**
   * Delete a file
   */
  delete(fileId: string): Promise<StorageResult>;

  /**
   * Check if a file exists
   */
  exists(fileId: string): Promise<boolean>;

  /**
   * Get file metadata without downloading content
   */
  getMetadata(fileId: string): Promise<Record<string, unknown> | null>;

  /**
   * Get storage statistics
   */
  getStats(): Promise<Record<string, unknown>>;
}

/**
 * Storage service configuration from environment
 */
export interface StorageServiceConfig {
  useDatabase: boolean;
  filesDestination: string;
  imagesDestination: string;
  maxFileSize: number;
  maxImageSize: number;
  allowedFileExtensions: string[];
  allowedImageExtensions: string[];
}
