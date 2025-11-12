import { Image, Prisma } from '@db/prisma';
import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    ParseIntPipe,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
    ValidationPipe
} from '@nestjs/common';
import {
    ImageAnalyticsResult,
    ImageSearchOptions,
    ImagesService
} from './images.service';

// DTOs pour la validation
export class CreateImageDto {
  filename!: string;
  originalName!: string;
  mimeType!: string;
  fileSize!: number;
  width?: number;
  height?: number;
  storageType?: string;
  storagePath?: string;
  storageUrl?: string;
  bucketName?: string;
  thumbnailUrl?: string;
  variants?: Record<string, unknown>;
  tags?: string[];
  altText?: string;
  description?: string;
  sequence?: number;
  isPublic?: boolean;
  uploadedById!: string;
  associatedId?: string;
  associationType?: string;
  orgId?: string;
  postId?: string;
  storyId?: string;
  profileUserId?: string;
}

export class UpdateImageDto {
  filename?: string;
  originalName?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  storageType?: string;
  storagePath?: string;
  storageUrl?: string;
  bucketName?: string;
  thumbnailUrl?: string;
  variants?: unknown;
  tags?: string[];
  altText?: string;
  description?: string;
  sequence?: number;
  isPublic?: boolean;
  associatedId?: string;
  associationType?: string;
  orgId?: string;
  postId?: string;
  storyId?: string;
  profileUserId?: string;
}

export class BulkUpdateDto {
  ids!: string[];
  updates!: UpdateImageDto;
}

export class AssociateImagesDto {
  imageIds!: string[];
  targetId!: string;
}

export class TagManagementDto {
  imageIds!: string[];
  tags!: string[];
}

export class ImageMetadataDto {
  altText?: string;
  description?: string;
  tags?: string[];
}

export interface ImageUsageStats {
  usedInPosts: number;
  usedInStories: number;
  usedAsProfilePicture: number;
  totalUsage: number;
}

export interface DuplicateImageGroup {
  originalName: string;
  fileSize: number;
  images: Image[];
}

export class SearchImagesDto {
  query?: string;
  uploadedById?: string;
  associatedId?: string;
  associationType?: string;
  orgId?: string;
  postId?: string;
  storyId?: string;
  profileUserId?: string;
  mimeType?: string;
  tags?: string[];
  isPublic?: boolean;
  storageType?: string;
  createdAfter?: string;
  createdBefore?: string;
  skip?: number;
  take?: number;
  orderBy?: string;
}

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  // Core CRUD Operations

  @Post()
  async createImage(
    @Body(ValidationPipe) createImageDto: CreateImageDto
  ): Promise<{ data: Image; message: string }> {
    try {
      const image = await this.imagesService.createImage(createImageDto);
      return {
        data: image,
        message: 'Image créée avec succès'
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la création de l'image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id')
  async getImageById(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ data: Image | null; message: string }> {
    try {
      const image = await this.imagesService.findImageById(id);
      if (!image) {
        throw new HttpException('Image non trouvée', HttpStatus.NOT_FOUND);
      }
      return {
        data: image,
        message: 'Image récupérée avec succès'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la récupération de l'image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  async getImages(
    @Query() searchParams: SearchImagesDto
  ): Promise<{ data: Image[]; total: number; message: string }> {
    try {
      const {
        query,
        skip = 0,
        take = 20,
        orderBy = 'createdAt',
        createdAfter,
        createdBefore,
        ...filters
      } = searchParams;

      const searchOptions: ImageSearchOptions = {
        ...filters,
        ...(createdAfter && { createdAfter: new Date(createdAfter) }),
        ...(createdBefore && { createdBefore: new Date(createdBefore) })
      };

      const pagination = {
        skip: Number(skip),
        take: Number(take),
        orderBy: { [orderBy]: 'desc' as const }
      };

      let images: Image[];

      if (query) {
        images = await this.imagesService.searchImages(query, searchOptions, pagination);
      } else {
        images = await this.imagesService.findImages(searchOptions, pagination);
      }

      return {
        data: images,
        total: images.length,
        message: 'Images récupérées avec succès'
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des images: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id')
  async updateImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateImageDto: UpdateImageDto
  ): Promise<{ data: Image; message: string }> {
    try {
      const updateData: Partial<Omit<Image, 'id' | 'numSeq' | 'createdAt' | 'updatedAt' | 'uploadedById'>> = {
        ...updateImageDto,
        variants: updateImageDto.variants as Prisma.JsonValue
      };
      const image = await this.imagesService.updateImage(id, updateData);
      return {
        data: image,
        message: 'Image mise à jour avec succès'
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la mise à jour de l'image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id')
  async deleteImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('soft', new DefaultValuePipe(true)) soft: boolean
  ): Promise<{ data: Image; message: string }> {
    try {
      const image = await this.imagesService.deleteImage(id, soft);
      return {
        data: image,
        message: soft ? 'Image supprimée temporairement' : 'Image supprimée définitivement'
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la suppression de l'image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Bulk Operations

  @Put('bulk/update')
  async bulkUpdateImages(
    @Body(ValidationPipe) bulkUpdateDto: BulkUpdateDto
  ): Promise<{ count: number; message: string }> {
    try {
      const bulkData = {
        ids: bulkUpdateDto.ids,
        updates: {
          ...bulkUpdateDto.updates,
          variants: bulkUpdateDto.updates.variants as Prisma.JsonValue
        }
      };
      const result = await this.imagesService.bulkUpdateImages(bulkData);
      return {
        count: result.count,
        message: `${result.count} images mises à jour avec succès`
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la mise à jour en lot: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete('bulk/delete')
  async bulkDeleteImages(
    @Body() body: { ids: string[]; soft?: boolean }
  ): Promise<{ count: number; message: string }> {
    try {
      const { ids, soft = true } = body;
      const result = await this.imagesService.bulkDeleteImages(ids, soft);
      return {
        count: result.count,
        message: `${result.count} images supprimées avec succès`
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la suppression en lot: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Association Management

  @Put('associate/post')
  async associateWithPost(
    @Body(ValidationPipe) associateDto: AssociateImagesDto
  ): Promise<{ count: number; message: string }> {
    try {
      const result = await this.imagesService.associateWithPost(
        associateDto.imageIds,
        associateDto.targetId
      );
      return {
        count: result.count,
        message: `${result.count} images associées au post avec succès`
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de l'association avec le post: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put('associate/user')
  async associateWithUser(
    @Body(ValidationPipe) body: AssociateImagesDto & { asProfile?: boolean }
  ): Promise<{ count: number; message: string }> {
    try {
      const { imageIds, targetId, asProfile = false } = body;
      const result = await this.imagesService.associateWithUser(imageIds, targetId, asProfile);
      return {
        count: result.count,
        message: `${result.count} images associées à l'utilisateur avec succès`
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de l'association avec l'utilisateur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put('associate/organization')
  async associateWithOrganization(
    @Body(ValidationPipe) associateDto: AssociateImagesDto
  ): Promise<{ count: number; message: string }> {
    try {
      const result = await this.imagesService.associateWithOrganization(
        associateDto.imageIds,
        associateDto.targetId
      );
      return {
        count: result.count,
        message: `${result.count} images associées à l'organisation avec succès`
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de l'association avec l'organisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put('associate/story')
  async associateWithStory(
    @Body(ValidationPipe) associateDto: AssociateImagesDto
  ): Promise<{ count: number; message: string }> {
    try {
      const result = await this.imagesService.associateWithStory(
        associateDto.imageIds,
        associateDto.targetId
      );
      return {
        count: result.count,
        message: `${result.count} images associées à l'histoire avec succès`
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de l'association avec l'histoire: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Tag Management

  @Put('tags/add')
  async addTags(
    @Body(ValidationPipe) tagDto: TagManagementDto
  ): Promise<{ count: number; message: string }> {
    try {
      const result = await this.imagesService.addTagsToImages(tagDto.imageIds, tagDto.tags);
      return {
        count: result.count,
        message: `Tags ajoutés à ${result.count} images`
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de l'ajout des tags: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put('tags/remove')
  async removeTags(
    @Body(ValidationPipe) tagDto: TagManagementDto
  ): Promise<{ count: number; message: string }> {
    try {
      const result = await this.imagesService.removeTagsFromImages(tagDto.imageIds, tagDto.tags);
      return {
        count: result.count,
        message: `Tags supprimés de ${result.count} images`
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la suppression des tags: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('tags/:tags')
  async getImagesByTags(
    @Param('tags') tagsParam: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
    @Query() filters: SearchImagesDto
  ): Promise<{ data: Image[]; message: string }> {
    try {
      const tags = tagsParam.split(',');
      const searchOptions: ImageSearchOptions = {
        uploadedById: filters.uploadedById,
        orgId: filters.orgId,
        isPublic: filters.isPublic
      };

      const images = await this.imagesService.getImagesByTags(tags, searchOptions, { skip, take });
      return {
        data: images,
        message: 'Images récupérées par tags avec succès'
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la recherche par tags: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Metadata Management

  @Put(':id/metadata')
  async updateMetadata(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) metadataDto: ImageMetadataDto
  ): Promise<{ data: Image; message: string }> {
    try {
      const image = await this.imagesService.updateImageMetadata(id, metadataDto);
      return {
        data: image,
        message: 'Métadonnées mises à jour avec succès'
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la mise à jour des métadonnées: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Analytics and Statistics

  @Get('analytics/statistics')
  async getAnalytics(
    @Query() filters: SearchImagesDto
  ): Promise<{ data: ImageAnalyticsResult; message: string }> {
    try {
      const searchOptions: ImageSearchOptions = {
        uploadedById: filters.uploadedById,
        orgId: filters.orgId,
        associationType: filters.associationType,
        ...(filters.createdAfter && { createdAfter: new Date(filters.createdAfter) }),
        ...(filters.createdBefore && { createdBefore: new Date(filters.createdBefore) })
      };

      const analytics = await this.imagesService.getImageAnalytics(searchOptions);
      return {
        data: analytics,
        message: 'Statistiques récupérées avec succès'
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des statistiques: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/usage')
  async getUsageStats(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ data: ImageUsageStats; message: string }> {
    try {
      const usage = await this.imagesService.getImageUsageStats(id);
      return {
        data: usage,
        message: 'Statistiques d\'utilisation récupérées avec succès'
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des statistiques d'utilisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Search Operations

  @Get('search/query')
  async searchImages(
    @Query('q') query: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
    @Query() filters: SearchImagesDto
  ): Promise<{ data: Image[]; message: string }> {
    try {
      if (!query) {
        throw new HttpException('Paramètre de recherche requis', HttpStatus.BAD_REQUEST);
      }

      const searchOptions: ImageSearchOptions = {
        uploadedById: filters.uploadedById,
        orgId: filters.orgId,
        mimeType: filters.mimeType,
        isPublic: filters.isPublic
      };

      const images = await this.imagesService.searchImages(query, searchOptions, { skip, take });
      return {
        data: images,
        message: 'Recherche effectuée avec succès'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la recherche: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Utility Operations

  @Get('utility/unused')
  async getUnusedImages(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number
  ): Promise<{ data: Image[]; message: string }> {
    try {
      const images = await this.imagesService.getUnusedImages(days);
      return {
        data: images,
        message: `Images non utilisées depuis ${days} jours récupérées`
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des images non utilisées: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('utility/duplicates')
  async getDuplicates(): Promise<{ data: DuplicateImageGroup[]; message: string }> {
    try {
      const duplicates = await this.imagesService.getDuplicateImages();
      return {
        data: duplicates,
        message: 'Images dupliquées récupérées avec succès'
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des doublons: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Recovery Operations

  @Get('deleted/list')
  async getDeletedImages(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number
  ): Promise<{ data: Image[]; message: string }> {
    try {
      const images = await this.imagesService.getDeletedImages({ skip, take });
      return {
        data: images,
        message: 'Images supprimées récupérées avec succès'
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des images supprimées: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('deleted/recover')
  async recoverImages(
    @Body() body: { ids: string[] }
  ): Promise<{ count: number; message: string }> {
    try {
      const result = await this.imagesService.recoverDeletedImages(body.ids);
      return {
        count: result.count,
        message: `${result.count} images récupérées avec succès`
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des images: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete('deleted/cleanup')
  async cleanupOldDeletedImages(
    @Query('days', new DefaultValuePipe(90), ParseIntPipe) days: number
  ): Promise<{ count: number; message: string }> {
    try {
      const result = await this.imagesService.permanentlyDeleteOldImages(days);
      return {
        count: result.count,
        message: `${result.count} images définitivement supprimées`
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors du nettoyage: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
