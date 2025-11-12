import { File } from '@db/prisma';
import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Post,
    Put,
    Query,
    ValidationPipe,
} from '@nestjs/common';
import { FileCreateDto, FileSearchOptions, FilesService, FileUpdateDto } from './files.service';

// DTOs for validation
export class CreateFileDto implements FileCreateDto {
  filename!: string;
  originalName!: string;
  mimeType!: string;
  fileSize!: number;
  extension?: string;
  encoding?: string;
  storageType?: string;
  storagePath?: string;
  storageUrl?: string;
  bucketName?: string;
  storageName?: string;
  category?: string;
  tags?: string[];
  description?: string;
  version?: string;
  isPublicDownload?: boolean;
  expiresAt?: Date;

  // Relations
  ownerId!: string;
  uploadedById?: string;
  orgId!: string;
  postId?: string;
  storyId?: string;
  profileUserId?: string;
}

export class UpdateFileDto implements FileUpdateDto {
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
}

export class FileSearchDto implements FileSearchOptions {
  filename?: string;
  mimeType?: string;
  category?: string;
  tags?: string[];
  storageType?: string;
  processingStatus?: string;
  virusScanStatus?: string;
  ownerId?: string;
  orgId?: string;
  isPublicDownload?: boolean;
  minSize?: number;
  maxSize?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  // Create operations
  @Post()
  async create(@Body(ValidationPipe) createFileDto: CreateFileDto): Promise<File> {
    return await this.filesService.create(createFileDto);
  }

  @Post('bulk')
  async createBulk(@Body(ValidationPipe) createFilesDto: CreateFileDto[]): Promise<File[]> {
    return await this.filesService.createBulk(createFilesDto);
  }

  // Read operations
  @Get()
  async findAll(@Query() searchDto: FileSearchDto): Promise<File[]> {
    return await this.filesService.findAll(searchDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<File> {
    const file = await this.filesService.findById(id);
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }
    return file;
  }

  @Get('owner/:ownerId')
  async findByOwner(@Param('ownerId') ownerId: string): Promise<File[]> {
    return await this.filesService.findByOwner(ownerId);
  }

  @Get('organization/:orgId')
  async findByOrganization(@Param('orgId') orgId: string): Promise<File[]> {
    return await this.filesService.findByOrganization(orgId);
  }

  @Get('storage/:storageType')
  async findByStorageType(@Param('storageType') storageType: string): Promise<File[]> {
    return await this.filesService.findByStorageType(storageType);
  }

  // Update operations
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateFileDto: UpdateFileDto,
  ): Promise<File> {
    return await this.filesService.update(id, updateFileDto);
  }

  @Put(':id/processing-status/:status')
  async updateProcessingStatus(
    @Param('id') id: string,
    @Param('status') status: string,
  ): Promise<File> {
    return await this.filesService.updateProcessingStatus(id, status);
  }

  @Put(':id/virus-scan-status/:status')
  async updateVirusScanStatus(
    @Param('id') id: string,
    @Param('status') status: string,
  ): Promise<File> {
    return await this.filesService.updateVirusScanStatus(id, status);
  }

  @Put(':id/download-count')
  async incrementDownloadCount(@Param('id') id: string): Promise<File> {
    return await this.filesService.incrementDownloadCount(id);
  }

  // Delete operations
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.filesService.remove(id);
  }
}
