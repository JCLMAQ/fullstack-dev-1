import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    FileTypeValidator,
    Get,
    Logger,
    MaxFileSizeValidator,
    Param,
    ParseFilePipe,
    Post,
    Response,
    UploadedFile,
    UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EnhancedFilesService, type FileUploadDto } from '../services/enhanced-files-simple.service';
import { FileStorageService } from '../services/file-storage.service';

// Interface temporaire pour les fichiers uploadés
interface UploadedFileType {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
  encoding?: string;
}

@Controller('dual-storage')
export class DualStorageController {
  private readonly logger = new Logger(DualStorageController.name);

  constructor(
    private readonly enhancedFilesService: EnhancedFilesService,
    private readonly fileStorageService: FileStorageService
  ) {}

  /**
   * Upload d'un fichier avec stockage automatique selon FILES_STORAGE_DB
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB max
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|gif|pdf|doc|docx|txt|csv|xlsx)$/
          }),
        ],
      }),
    ) file: UploadedFileType,
    @Body() uploadData: {
      ownerId: string;
      uploaderId?: string;
      orgId?: string;
      postId?: string;
      category?: string;
      tags?: string;
      isPublic?: string;
    }
  ) {
    try {
      const uploadDto: FileUploadDto = {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        encoding: file.encoding,
        ownerId: uploadData.ownerId,
        uploaderId: uploadData.uploaderId,
        orgId: uploadData.orgId,
        postId: uploadData.postId,
        category: uploadData.category,
        tags: uploadData.tags ? uploadData.tags.split(',').map(t => t.trim()) : [],
        isPublic: uploadData.isPublic === 'true'
      };

      const result = await this.enhancedFilesService.uploadFile(uploadDto);

      return {
        success: true,
        file: {
          id: result.id,
          filename: result.filename,
          originalName: result.originalName,
          mimeType: result.mimeType,
          size: result.fileSize,
          storageType: this.fileStorageService.getProviderType(),
          url: result.storageUrl
        }
      };
    } catch (error) {
      this.logger.error('Upload failed:', error);
      throw error;
    }
  }

  /**
   * Téléchargement d'un fichier
   */
  @Get('download/:fileId')
  async downloadFile(
    @Param('fileId') fileId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Response() res: any
  ) {
    try {
      const { file, content } = await this.enhancedFilesService.getFile(fileId);

      if (!content) {
        throw new BadRequestException('File content not available');
      }

      res.set({
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.originalName}"`,
        'Content-Length': file.fileSize.toString()
      });

      res.send(content);
    } catch (error) {
      this.logger.error(`Download failed for file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Suppression d'un fichier
   */
  @Delete(':fileId')
  async deleteFile(@Param('fileId') fileId: string) {
    try {
      await this.enhancedFilesService.deleteFile(fileId);

      return {
        success: true,
        message: 'File deleted successfully'
      };
    } catch (error) {
      this.logger.error(`Deletion failed for file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Vérification de l'existence d'un fichier
   */
  @Get('exists/:fileId')
  async fileExists(@Param('fileId') fileId: string) {
    try {
      const exists = await this.fileStorageService.exists(fileId);

      return {
        exists,
        fileId
      };
    } catch (error) {
      this.logger.error(`Existence check failed for file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Statistiques de stockage
   */
  @Get('stats')
  async getStorageStats() {
    try {
      const stats = await this.fileStorageService.getStats();

      return {
        success: true,
        stats
      };
    } catch (error) {
      this.logger.error('Stats retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Information sur le type de stockage actuel
   */
  @Get('storage-info')
  async getStorageInfo() {
    try {
      const storageType = this.fileStorageService.getProviderType();
      const stats = await this.fileStorageService.getStats();

      return {
        success: true,
        storageType,
        configuration: {
          useDatabase: storageType === 'database',
          environmentVariable: process.env['FILES_STORAGE_DB']
        },
        stats
      };
    } catch (error) {
      this.logger.error('Storage info retrieval failed:', error);
      throw error;
    }
  }



  /**
   * Sauvegarde des fichiers (si supporté)
   */
  @Post('backup')
  async backupFiles(@Body() backupData?: { destinationPath?: string }) {
    try {
      const result = await this.fileStorageService.backup(backupData?.destinationPath);

      return {
        success: result.success,
        message: result.success ? 'Backup completed' : `Backup failed: ${result.error}`
      };
    } catch (error) {
      this.logger.error('Backup failed:', error);
      throw error;
    }
  }
}
