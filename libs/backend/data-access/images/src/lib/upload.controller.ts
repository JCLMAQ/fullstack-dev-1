import { Image } from '@db/prisma';
import {
    BadRequestException,
    Body,
    Controller,
    HttpException,
    HttpStatus,
    Post,
    UploadedFile,
    UploadedFiles,
    UseInterceptors
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ImagesService } from './images.service';
// Configuration Multer
const multerConfig = {
  storage: diskStorage({
    destination: (req: unknown, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
      // Organisé par année/mois
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const uploadPath = join(process.cwd(), 'uploads', 'images', String(year), month);

      // Créer le répertoire s'il n'existe pas
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (req: unknown, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      // UUID + extension originale
      const uniqueSuffix = uuidv4();
      const extension = extname(file.originalname);
      cb(null, `${uniqueSuffix}${extension}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 10 // Maximum 10 fichiers simultanés
  },
  fileFilter: (req: unknown, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    // Types d'images autorisés
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException(`Type de fichier non autorisé: ${file.mimetype}`), false);
    }
  }
};

// DTO pour les métadonnées d'upload
export class UploadMetadataDto {
  uploadedById!: string;
  altText?: string;
  description?: string;
  tags?: string;
  isPublic?: string;
  associatedId?: string;
  associationType?: string;
  orgId?: string;
  postId?: string;
  storyId?: string;
  profileUserId?: string;
}

@Controller('upload')
export class UploadController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadSingleImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: UploadMetadataDto
  ): Promise<{ data: Image; message: string }> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    if (!metadata.uploadedById) {
      throw new BadRequestException('uploadedById est requis');
    }

    try {
      // Parse des tags si fournis comme string
      const tags = metadata.tags ? metadata.tags.split(',').map(tag => tag.trim()) : [];

      // Création de l'enregistrement image avec métadonnées
      const imageData = {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        storageType: 'local',
        storagePath: file.path,
        storageUrl: `/uploads/images/${file.filename}`, // URL pour accès public
        uploadedById: metadata.uploadedById,
        altText: metadata.altText,
        description: metadata.description,
        tags,
        isPublic: metadata.isPublic === 'true',
        associatedId: metadata.associatedId,
        associationType: metadata.associationType,
        orgId: metadata.orgId,
        postId: metadata.postId,
        storyId: metadata.storyId,
        profileUserId: metadata.profileUserId
      };

      const image = await this.imagesService.createImage(imageData);

      return {
        data: image,
        message: 'Image uploadée avec succès'
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de l'upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
  async uploadMultipleImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() metadata: UploadMetadataDto
  ): Promise<{ data: Image[]; count: number; message: string }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    if (!metadata.uploadedById) {
      throw new BadRequestException('uploadedById est requis');
    }

    try {
      const tags = metadata.tags ? metadata.tags.split(',').map(tag => tag.trim()) : [];
      const uploadedImages: Image[] = [];

      // Upload de chaque fichier
      for (const [index, file] of files.entries()) {
        const imageData = {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          storageType: 'local',
          storagePath: file.path,
          storageUrl: `/uploads/images/${file.filename}`,
          uploadedById: metadata.uploadedById,
          altText: metadata.altText,
          description: metadata.description,
          tags,
          isPublic: metadata.isPublic === 'true',
          sequence: index, // Ordre d'upload
          associatedId: metadata.associatedId,
          associationType: metadata.associationType,
          orgId: metadata.orgId,
          postId: metadata.postId,
          storyId: metadata.storyId,
          profileUserId: metadata.profileUserId
        };

        const image = await this.imagesService.createImage(imageData);
        uploadedImages.push(image);
      }

      return {
        data: uploadedImages,
        count: uploadedImages.length,
        message: `${uploadedImages.length} images uploadées avec succès`
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de l'upload multiple: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    ...multerConfig,
    limits: {
      fileSize: 2 * 1024 * 1024 // 2MB pour les avatars
    }
  }))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: Pick<UploadMetadataDto, 'uploadedById' | 'profileUserId'>
  ): Promise<{ data: Image; message: string }> {
    if (!file) {
      throw new BadRequestException('Aucun fichier avatar fourni');
    }

    if (!metadata.uploadedById || !metadata.profileUserId) {
      throw new BadRequestException('uploadedById et profileUserId sont requis');
    }

    try {
      const imageData = {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        storageType: 'local',
        storagePath: file.path,
        storageUrl: `/uploads/images/${file.filename}`,
        uploadedById: metadata.uploadedById,
        profileUserId: metadata.profileUserId,
        associatedId: metadata.profileUserId,
        associationType: 'user_profile',
        altText: 'Photo de profil',
        isPublic: true,
        tags: ['avatar', 'profile']
      };

      const image = await this.imagesService.createImage(imageData);

      return {
        data: image,
        message: 'Avatar uploadé avec succès'
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de l'upload d'avatar: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
