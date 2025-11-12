import { FilesService } from '@be/files';
import { File } from '@db/prisma';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StorageFile } from '../interfaces/storage.interfaces';
import { FileStorageService } from './file-storage.service';

// Interface temporaire locale - à remplacer par l'import depuis @be/files une fois que l'export fonctionne
interface FileUpdateDto {
  filename?: string;
  mimeType?: string;
  isPublicDownload?: boolean;
  processingStatus?: string;
  virusScanStatus?: string;
  tags?: string[];
  category?: string;
  description?: string;
  version?: string;
  ocrText?: string;
  downloadCount?: number;
  lastAccessedAt?: Date;
  expiresAt?: Date;
  storageType?: string;
  storagePath?: string;
  storageUrl?: string;
}

// Interface étendue pour inclure la méthode getFileStats
interface ExtendedFilesService extends FilesService {
  getFileStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    storageTypes: Record<string, number>;
    categories: Record<string, number>;
  }>;
}

export interface FileUploadDto {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  encoding?: string;

  // Métadonnées métier
  ownerId: string;
  uploaderId?: string;
  orgId?: string;
  postId?: string;
  storyId?: string;
  commentId?: string;
  profileUserId?: string;

  // Options de stockage
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  expiresAt?: Date;
}

@Injectable()
export class EnhancedFilesService {
  private readonly logger = new Logger(EnhancedFilesService.name);

  constructor(
    private readonly filesService: FilesService,
    private readonly fileStorageService: FileStorageService
  ) {}

  /**
   * Upload complet d'un fichier avec gestion du stockage dual
   */
  async uploadFile(uploadDto: FileUploadDto): Promise<File> {
    try {
      this.logger.debug(`Starting file upload: ${uploadDto.originalName}`);

      // 1. Validation du fichier
      this.validateFile(uploadDto);

      // 2. Génération d'un nom unique pour le fichier
      const fileExtension = this.extractFileExtension(uploadDto.originalName);
      const uniqueFilename = `${randomUUID()}${fileExtension}`;

      // 3. Préparation des données pour le stockage
      const storageFile: StorageFile = {
        buffer: uploadDto.buffer,
        originalName: uploadDto.originalName,
        mimeType: uploadDto.mimeType,
        size: uploadDto.size,
        encoding: uploadDto.encoding
      };

      // 4. Stockage physique du fichier
      const storageResult = await this.fileStorageService.store(storageFile, uniqueFilename);
      const storageType = storageResult.url ? 'database' : 'filesystem';

      this.logger.debug(`File stored with ${storageType} storage`);

      // 5. Création de l'enregistrement en base de données
      const fileRecord = await this.filesService.create({
        filename: uniqueFilename,
        originalName: uploadDto.originalName,
        mimeType: uploadDto.mimeType,
        fileSize: uploadDto.size,
        extension: fileExtension,
        encoding: uploadDto.encoding,
        storageType: storageType,
        storagePath: storageResult.path,
        storageUrl: storageResult.url,
        category: uploadDto.category,
        tags: uploadDto.tags,
        isPublicDownload: uploadDto.isPublic,
        expiresAt: uploadDto.expiresAt,
        ownerId: uploadDto.ownerId,
        uploadedById: uploadDto.uploaderId,
        orgId: uploadDto.orgId || uploadDto.ownerId, // orgId requis, utilise ownerId par défaut
        postId: uploadDto.postId,
        storyId: uploadDto.storyId,
        profileUserId: uploadDto.profileUserId,
      });

      this.logger.log(`File uploaded successfully: ${fileRecord.id}`);
      return fileRecord;

    } catch (error) {
      this.logger.error(`Upload failed for ${uploadDto.originalName}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to upload file: ${errorMessage}`);
    }
  }

  /**
   * Récupération d'un fichier par son ID
   */
  async getFile(fileId: string): Promise<{ file: File; content?: Buffer }> {
    try {
      // Récupération des métadonnées depuis la base de données
      const file = await this.filesService.findById(fileId);
      if (!file) {
        throw new NotFoundException(`File with ID ${fileId} not found`);
      }

      // Extraction de l'ID de stockage depuis les métadonnées
      const storageFileId = this.extractStorageFileId(file);

      // Récupération du contenu depuis le stockage
      const retrievalResult = await this.fileStorageService.retrieve(storageFileId);

      if (!retrievalResult.success) {
        this.logger.warn(`File content not found for ${fileId}: ${retrievalResult.error}`);
        return { file }; // Retourne seulement les métadonnées
      }

      return {
        file,
        content: retrievalResult.buffer
      };

    } catch (error) {
      this.logger.error(`Failed to get file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Suppression d'un fichier (métadonnées et contenu)
   */
  async deleteFile(fileId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Récupération du fichier
      const file = await this.filesService.findById(fileId);
      if (!file) {
        throw new NotFoundException(`File with ID ${fileId} not found`);
      }

      // Extraction de l'ID de stockage
      const storageFileId = this.extractStorageFileId(file);

      // Suppression en base de données (suppression physique)
      await this.filesService.remove(fileId);

      // Suppression physique du fichier
      const deletionResult = await this.fileStorageService.delete(storageFileId);

      if (!deletionResult.success) {
        this.logger.warn(`Failed to delete file content for ${fileId}: ${deletionResult.error}`);
      }

      this.logger.log(`File deleted successfully: ${fileId}`);
      return {
        success: true,
        message: `File ${file.filename} deleted successfully`
      };

    } catch (error) {
      this.logger.error(`Failed to delete file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Validation des données de fichier
   */
  private validateFile(uploadDto: FileUploadDto): void {
    if (!uploadDto.buffer || uploadDto.buffer.length === 0) {
      throw new BadRequestException('File buffer cannot be empty');
    }

    if (!uploadDto.originalName || uploadDto.originalName.trim() === '') {
      throw new BadRequestException('Original filename cannot be empty');
    }

    if (!uploadDto.mimeType || uploadDto.mimeType.trim() === '') {
      throw new BadRequestException('MIME type cannot be empty');
    }

    if (!uploadDto.ownerId || uploadDto.ownerId.trim() === '') {
      throw new BadRequestException('Owner ID is required');
    }

    // Validation de la taille (limite configurable)
    const maxSize = 50 * 1024 * 1024; // 50MB par défaut
    if (uploadDto.size > maxSize) {
      throw new BadRequestException(`File size exceeds maximum allowed size of ${maxSize} bytes`);
    }
  }

  /**
   * Extraction de l'extension de fichier
   */
  private extractFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
  }

  /**
   * Téléchargement d'un fichier avec son contenu
   */
  async downloadFile(fileId: string): Promise<{
    filename: string;
    size: number;
    mimeType: string;
    buffer: Buffer
  }> {
    try {
      const result = await this.getFile(fileId);

      if (!result.content) {
        throw new NotFoundException(`File content not found for ${fileId}`);
      }

      return {
        filename: result.file.originalName,
        size: result.file.fileSize,
        mimeType: result.file.mimeType,
        buffer: result.content
      };
    } catch (error) {
      this.logger.error(`Failed to download file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Vérifie si un fichier existe
   */
  async fileExists(fileId: string): Promise<boolean> {
    try {
      // Vérification en base de données
      const file = await this.filesService.findById(fileId);
      if (!file) {
        return false;
      }

      // Vérification dans le stockage physique
      const storageFileId = this.extractStorageFileId(file);
      return await this.fileStorageService.exists(storageFileId);
    } catch (error) {
      this.logger.error(`Error checking file existence ${fileId}:`, error);
      return false;
    }
  }

  /**
   * Récupère les statistiques de stockage
   */
  async getStorageStats(): Promise<{
    combined: {
      storageType: string;
      totalFiles: number;
      totalSize: number;
    };
    storage: Record<string, unknown>;
  }> {
    try {
      // Statistiques depuis la base de données
      const dbStats = await (this.filesService as ExtendedFilesService).getFileStats();

      // Statistiques depuis le stockage physique
      const storageStats = await this.fileStorageService.getStats();

      return {
        combined: {
          storageType: this.fileStorageService.getProviderType(),
          totalFiles: dbStats.totalFiles,
          totalSize: dbStats.totalSize,
        },
        storage: storageStats
      };
    } catch (error) {
      this.logger.error('Error getting storage stats:', error);
      return {
        combined: {
          storageType: this.fileStorageService.getProviderType(),
          totalFiles: 0,
          totalSize: 0,
        },
        storage: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Migre un fichier d'un type de stockage vers un autre
   */
  async migrateFileStorage(fileId: string, targetStorage: 'database' | 'filesystem'): Promise<void> {
    try {
      this.logger.debug(`Starting migration of file ${fileId} to ${targetStorage}`);

      // 1. Récupération du fichier actuel
      const file = await this.filesService.findById(fileId);
      if (!file) {
        throw new NotFoundException(`File with ID ${fileId} not found`);
      }

      // 2. Vérification si migration nécessaire
      if (file.storageType === targetStorage) {
        this.logger.warn(`File ${fileId} is already stored in ${targetStorage}`);
        return;
      }

      // 3. Récupération du contenu actuel
      const currentResult = await this.getFile(fileId);
      if (!currentResult.content) {
        throw new Error(`Unable to retrieve content for file ${fileId}`);
      }

      // 4. Sauvegarde temporaire de la configuration actuelle
      const currentProviderType = this.fileStorageService.getProviderType();

      // 5. Basculement vers le stockage cible
      this.fileStorageService.switchProvider(targetStorage === 'database');

      try {
        // 6. Stockage dans le nouveau système
        const storageFile: StorageFile = {
          buffer: currentResult.content,
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: file.fileSize,
          encoding: file.encoding || undefined
        };

        const newStorageFileId = this.extractStorageFileId(file);
        const newStorageResult = await this.fileStorageService.store(storageFile, newStorageFileId);

        if (!newStorageResult.success) {
          throw new Error(`Failed to store file in ${targetStorage}: ${newStorageResult.error}`);
        }

        // 7. Mise à jour des métadonnées en base
        const updateData: FileUpdateDto = {
          storageType: targetStorage,
          storagePath: newStorageResult.path,
          storageUrl: newStorageResult.url,
        };
        await this.filesService.update(fileId, updateData);

        // 8. Suppression de l'ancien stockage
        this.fileStorageService.switchProvider(currentProviderType === 'database');
        const oldStorageFileId = this.extractStorageFileId(file);
        const deleteResult = await this.fileStorageService.delete(oldStorageFileId);

        if (!deleteResult.success) {
          this.logger.warn(`Failed to delete old file content for ${fileId}: ${deleteResult.error}`);
        }

        this.logger.log(`Successfully migrated file ${fileId} from ${file.storageType} to ${targetStorage}`);

      } finally {
        // 9. Restauration de la configuration originale
        this.fileStorageService.switchProvider(currentProviderType === 'database');
      }

    } catch (error) {
      this.logger.error(`Migration failed for file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Extraction de l'ID de stockage depuis les métadonnées du fichier
   */
  private extractStorageFileId(file: File): string {
    // Pour le stockage filesystem: utilise le nom du fichier
    // Pour le stockage database: utilise l'ID du fichier
    return file.storageType === 'database' ? file.id : file.filename;
  }
}
