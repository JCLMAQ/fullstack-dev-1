import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { createReadStream, existsSync, promises as fs } from 'fs';
import { dirname, extname, join } from 'path';
import {
    FileRetrievalResult,
    IStorageProvider,
    StorageFile,
    StorageResult
} from '../interfaces/storage.interfaces';

@Injectable()
export class FilesystemStorageProvider implements IStorageProvider {

  constructor(
    private readonly basePath: string = process.env['FILES_STORAGE_DEST'] || './files'
  ) {}

  async store(file: StorageFile, fileId: string): Promise<StorageResult> {
    try {
      // Generate secure filename with file extension
      const extension = extname(file.originalName);
      const secureFilename = `${fileId}${extension}`;
      const fullPath = join(this.basePath, secureFilename);

      // Ensure directory exists
      await this.ensureDirectoryExists(dirname(fullPath));

      // Generate checksum for integrity
      const checksum = this.generateChecksum(file.buffer);

      // Write file to disk
      await fs.writeFile(fullPath, file.buffer);

      // Verify file was written correctly
      const stats = await fs.stat(fullPath);
      if (stats.size !== file.size) {
        throw new Error(`File size mismatch: expected ${file.size}, got ${stats.size}`);
      }

      return {
        success: true,
        fileId,
        path: fullPath,
        size: file.size,
        checksum,
        metadata: {
          storageType: 'filesystem',
          path: fullPath,
          checksum,
          processedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        fileId,
        size: file.size,
        error: `Filesystem storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async retrieve(fileId: string): Promise<FileRetrievalResult> {
    try {
      // Try different possible extensions to find the file
      const possibleFiles = await this.findFileWithId(fileId);

      if (possibleFiles.length === 0) {
        return {
          success: false,
          error: 'File not found on filesystem'
        };
      }

      const filePath = possibleFiles[0]; // Use first match
      const stats = await fs.stat(filePath);
      const buffer = await fs.readFile(filePath);

      // Extract metadata from filename and path
      const filename = join(filePath).split('/').pop() || fileId;
      const extension = extname(filename);

      return {
        success: true,
        buffer,
        stream: createReadStream(filePath),
        metadata: {
          filename,
          originalName: filename,
          mimeType: this.getMimeTypeFromExtension(extension),
          size: stats.size
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Filesystem retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async delete(fileId: string): Promise<StorageResult> {
    try {
      const possibleFiles = await this.findFileWithId(fileId);

      if (possibleFiles.length === 0) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      let deletedCount = 0;
      let totalSize = 0;

      for (const filePath of possibleFiles) {
        try {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
          await fs.unlink(filePath);
          deletedCount++;
        } catch (error) {
          console.warn(`Failed to delete ${filePath}:`, error);
        }
      }

      if (deletedCount > 0) {
        return {
          success: true,
          fileId,
          size: totalSize
        };
      } else {
        return {
          success: false,
          error: 'Failed to delete any files'
        };
      }
    } catch (error) {
      console.error(`Failed to delete file ${fileId}:`, error);
      return {
        success: false,
        error: `Filesystem deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async exists(fileId: string): Promise<boolean> {
    try {
      const possibleFiles = await this.findFileWithId(fileId);
      return possibleFiles.length > 0;
    } catch (error) {
      console.error(`Failed to check file existence ${fileId}:`, error);
      return false;
    }
  }

  async getMetadata(fileId: string): Promise<Record<string, unknown> | null> {
    try {
      const possibleFiles = await this.findFileWithId(fileId);

      if (possibleFiles.length === 0) {
        return null;
      }

      const filePath = possibleFiles[0];
      const stats = await fs.stat(filePath);
      const filename = join(filePath).split('/').pop() || fileId;
      const extension = extname(filename);

      return {
        size: stats.size,
        mimeType: this.getMimeTypeFromExtension(extension),
        filename,
        lastModified: stats.mtime
      };
    } catch (error) {
      console.error(`Failed to get metadata for file ${fileId}:`, error);
      return null;
    }
  }

  async getStats(): Promise<Record<string, unknown>> {
    try {
      const files = await this.getAllFiles();
      let totalSize = 0;

      for (const filePath of files) {
        try {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        } catch {
          // Skip files that can't be read
          continue;
        }
      }

      // Try to get free space (this is platform dependent)
      let freeSpace: number | undefined;
      try {
        const stats = await fs.statfs(this.basePath);
        freeSpace = stats.bavail * stats.bsize;
      } catch {
        // Free space detection not supported on this platform
      }

      return {
        totalFiles: files.length,
        totalSize,
        freeSpace
      };
    } catch (error) {
      console.error('Failed to get filesystem storage stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0
      };
    }
  }

  /**
   * Find all files that start with the given fileId
   */
  private async findFileWithId(fileId: string): Promise<string[]> {
    try {
      if (!existsSync(this.basePath)) {
        return [];
      }

      const files = await fs.readdir(this.basePath);
      const matchingFiles = files
        .filter(file => file.startsWith(fileId))
        .map(file => join(this.basePath, file));

      // Verify files exist and are readable
      const validFiles: string[] = [];
      for (const filePath of matchingFiles) {
        try {
          await fs.access(filePath, fs.constants.R_OK);
          validFiles.push(filePath);
        } catch {
          // File not readable, skip
        }
      }

      return validFiles;
    } catch (error) {
      console.error(`Error finding files with ID ${fileId}:`, error);
      return [];
    }
  }

  /**
   * Get all files in the storage directory
   */
  private async getAllFiles(): Promise<string[]> {
    try {
      if (!existsSync(this.basePath)) {
        return [];
      }

      const files = await fs.readdir(this.basePath);
      return files.map(file => join(this.basePath, file));
    } catch (error) {
      console.error('Error getting all files:', error);
      return [];
    }
  }

  /**
   * Ensure directory exists, create if necessary
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate SHA-256 checksum for file integrity verification
   */
  private generateChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.zip': 'application/zip',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Cleanup orphaned files (files without corresponding database records)
   */
  async cleanupOrphanedFiles(validFileIds: string[]): Promise<number> {
    try {
      const files = await fs.readdir(this.basePath);
      let cleanedCount = 0;

      for (const file of files) {
        const fileIdFromName = file.split('.')[0]; // Extract ID before extension

        if (!validFileIds.includes(fileIdFromName)) {
          try {
            await fs.unlink(join(this.basePath, file));
            cleanedCount++;
          } catch (error) {
            console.warn(`Failed to cleanup orphaned file ${file}:`, error);
          }
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error('Failed to cleanup orphaned files:', error);
      return 0;
    }
  }

  /**
   * Create backup of all files in the storage directory
   */
  async createBackup(backupPath: string): Promise<boolean> {
    try {
      await this.ensureDirectoryExists(backupPath);
      const files = await this.getAllFiles();

      for (const filePath of files) {
        const filename = join(filePath).split('/').pop();
        if (filename) {
          const backupFilePath = join(backupPath, filename);
          await fs.copyFile(filePath, backupFilePath);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return false;
    }
  }
}
