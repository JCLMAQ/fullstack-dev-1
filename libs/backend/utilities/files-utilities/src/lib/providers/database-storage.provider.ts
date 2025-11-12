import { PrismaClientService } from '@db/prisma-client';
import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  FileRetrievalResult,
  IStorageProvider,
  StorageFile,
  StorageResult
} from '../interfaces/storage.interfaces';

@Injectable()
export class DatabaseStorageProvider implements IStorageProvider {
  constructor(private readonly prisma: PrismaClientService) {}

  async store(file: StorageFile, fileId: string): Promise<StorageResult> {
    try {
      // Generate checksum for integrity
      const checksum = this.generateChecksum(file.buffer);

      // Store file binary data in database
      await this.prisma.file.update({
        where: { id: fileId },
        data: {
          binaryData: new Uint8Array(file.buffer),
          checksum: checksum,
          storageType: 'database',
          isProcessed: true,
          processingStatus: 'completed'
        }
      });

      return {
        success: true,
        fileId,
        size: file.size,
        checksum,
        metadata: {
          storageType: 'database',
          checksum,
          processedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        fileId,
        size: file.size,
        error: `Database storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async retrieve(fileId: string): Promise<FileRetrievalResult> {
    try {
      const fileRecord = await this.prisma.file.findUnique({
        where: { id: fileId },
        select: {
          binaryData: true,
          filename: true,
          originalName: true,
          mimeType: true,
          fileSize: true,
          encoding: true,
          checksum: true
        }
      });

      if (!fileRecord || !fileRecord.binaryData) {
        return {
          success: false,
          error: 'File not found or no binary data stored'
        };
      }

      // Verify checksum if available
      if (fileRecord.checksum) {
        const buffer = Buffer.from(fileRecord.binaryData);
        const calculatedChecksum = this.generateChecksum(buffer);
        if (calculatedChecksum !== fileRecord.checksum) {
          return {
            success: false,
            error: 'File integrity check failed - corrupted data'
          };
        }
      }

      return {
        success: true,
        buffer: Buffer.from(fileRecord.binaryData),
        metadata: {
          filename: fileRecord.filename,
          originalName: fileRecord.originalName,
          mimeType: fileRecord.mimeType,
          size: fileRecord.fileSize,
          encoding: fileRecord.encoding || undefined
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Database retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async delete(fileId: string): Promise<StorageResult> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
        select: { id: true, fileSize: true }
      });

      if (!file) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      await this.prisma.file.update({
        where: { id: fileId },
        data: {
          binaryData: null,
          checksum: null,
          processingStatus: 'deleted'
        }
      });

      return {
        success: true,
        fileId,
        size: file.fileSize
      };
    } catch (error) {
      console.error(`Failed to delete file ${fileId} from database:`, error);
      return {
        success: false,
        error: `Database deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async exists(fileId: string): Promise<boolean> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
        select: { binaryData: true }
      });
      return file?.binaryData !== null && file?.binaryData !== undefined;
    } catch (error) {
      console.error(`Failed to check file existence ${fileId}:`, error);
      return false;
    }
  }

  async getMetadata(fileId: string): Promise<Record<string, unknown> | null> {
    try {
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
        select: {
          fileSize: true,
          mimeType: true,
          filename: true,
          updatedAt: true,
          binaryData: true
        }
      });

      if (!file || !file.binaryData) {
        return null;
      }

      return {
        size: file.fileSize,
        mimeType: file.mimeType,
        filename: file.filename,
        lastModified: file.updatedAt
      };
    } catch (error) {
      console.error(`Failed to get metadata for file ${fileId}:`, error);
      return null;
    }
  }

  async getStats(): Promise<Record<string, unknown>> {
    try {
      const stats = await this.prisma.file.aggregate({
        where: {
          storageType: 'database',
          binaryData: { not: null },
          isDeleted: 0
        },
        _count: { id: true },
        _sum: { fileSize: true }
      });

      return {
        totalFiles: stats._count.id || 0,
        totalSize: stats._sum.fileSize || 0
      };
    } catch (error) {
      console.error('Failed to get database storage stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0
      };
    }
  }

  /**
   * Generate SHA-256 checksum for file integrity verification
   */
  private generateChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Clean up orphaned binary data (files marked as deleted but still have binary data)
   */
  async cleanupOrphanedData(): Promise<number> {
    try {
      const result = await this.prisma.file.updateMany({
        where: {
          isDeleted: 1,
          binaryData: { not: null }
        },
        data: {
          binaryData: null,
          checksum: null
        }
      });

      return result.count;
    } catch (error) {
      console.error('Failed to cleanup orphaned binary data:', error);
      return 0;
    }
  }

  /**
   * Get files with binary data for backup purposes
   */
  async getFilesWithBinaryData(skip = 0, take = 100): Promise<Array<{
    id: string;
    filename: string;
    fileSize: number;
    checksum: string | null;
  }>> {
    try {
      return await this.prisma.file.findMany({
        where: {
          storageType: 'database',
          binaryData: { not: null },
          isDeleted: 0
        },
        select: {
          id: true,
          filename: true,
          fileSize: true,
          checksum: true
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Failed to get files with binary data:', error);
      return [];
    }
  }
}
