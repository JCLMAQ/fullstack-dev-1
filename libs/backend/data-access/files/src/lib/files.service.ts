import { File, Prisma } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

export interface FileCreateDto {
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
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
  ownerId: string;
  uploadedById?: string;
  orgId: string;
  postId?: string;
  storyId?: string;
  profileUserId?: string;
}

export interface FileUpdateDto {
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

export interface FileSearchOptions {
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

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaClientService) {}

  async create(data: FileCreateDto): Promise<File> {
    try {
      return await this.prisma.file.create({
        data: {
          filename: data.filename,
          originalName: data.originalName,
          mimeType: data.mimeType,
          fileSize: data.fileSize,
          extension: data.extension,
          encoding: data.encoding,
          storageType: data.storageType || 'local',
          storagePath: data.storagePath,
          storageUrl: data.storageUrl,
          bucketName: data.bucketName,
          storageName: data.storageName,
          category: data.category,
          tags: data.tags || [],
          description: data.description,
          version: data.version || '1.0',
          isPublicDownload: data.isPublicDownload ?? false,
          downloadCount: 0,
          expiresAt: data.expiresAt,

          // Relations
          owner: { connect: { id: data.ownerId } },
          ...(data.uploadedById && { uploadedBy: { connect: { id: data.uploadedById } } }),
          org: { connect: { id: data.orgId } },
          ...(data.postId && { post: { connect: { id: data.postId } } }),
          ...(data.storyId && { story: { connect: { id: data.storyId } } }),
          ...(data.profileUserId && { profileUser: { connect: { id: data.profileUserId } } }),
        },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
          uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          org: { select: { id: true, name: true } },
          post: { select: { id: true, title: true } },
          story: { select: { id: true, caption: true } },
          profileUser: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createBulk(files: FileCreateDto[]): Promise<File[]> {
    const results: File[] = [];
    for (const fileData of files) {
      const result = await this.create(fileData);
      results.push(result);
    }
    return results;
  }

  async findById(id: string): Promise<File | null> {
    return await this.prisma.file.findUnique({
      where: { id, isDeleted: 0 },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        org: { select: { id: true, name: true } },
        post: { select: { id: true, title: true } },
        story: { select: { id: true, caption: true } },
        profileUser: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findAll(options: FileSearchOptions = {}): Promise<File[]> {
    const where: Prisma.FileWhereInput = {
      isDeleted: 0,
      ...(options.filename && { filename: { contains: options.filename, mode: 'insensitive' } }),
      ...(options.mimeType && { mimeType: options.mimeType }),
      ...(options.category && { category: options.category }),
      ...(options.tags && options.tags.length > 0 && { tags: { hasSome: options.tags } }),
      ...(options.storageType && { storageType: options.storageType }),
      ...(options.processingStatus && { processingStatus: options.processingStatus }),
      ...(options.virusScanStatus && { virusScanStatus: options.virusScanStatus }),
      ...(options.ownerId && { ownerId: options.ownerId }),
      ...(options.orgId && { orgId: options.orgId }),
      ...(options.isPublicDownload !== undefined && { isPublicDownload: options.isPublicDownload }),
      ...(options.minSize && { fileSize: { gte: options.minSize } }),
      ...(options.maxSize && { fileSize: { lte: options.maxSize } }),
      ...(options.createdAfter && { createdAt: { gte: options.createdAfter } }),
      ...(options.createdBefore && { createdAt: { lte: options.createdBefore } }),
    };

    return await this.prisma.file.findMany({
      where,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        org: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: FileUpdateDto): Promise<File> {
    const existingFile = await this.findById(id);
    if (!existingFile) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    const updateData: Prisma.FileUpdateInput = {};
    if (data.filename !== undefined) updateData.filename = data.filename;
    if (data.mimeType !== undefined) updateData.mimeType = data.mimeType;
    if (data.isPublicDownload !== undefined) updateData.isPublicDownload = data.isPublicDownload;
    if (data.processingStatus !== undefined) updateData.processingStatus = data.processingStatus;
    if (data.virusScanStatus !== undefined) updateData.virusScanStatus = data.virusScanStatus;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.version !== undefined) updateData.version = data.version;
    if (data.ocrText !== undefined) updateData.ocrText = data.ocrText;
    if (data.downloadCount !== undefined) updateData.downloadCount = data.downloadCount;
    if (data.lastAccessedAt !== undefined) updateData.lastAccessedAt = data.lastAccessedAt;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;
    if (data.storageType !== undefined) updateData.storageType = data.storageType;
    if (data.storagePath !== undefined) updateData.storagePath = data.storagePath;
    if (data.storageUrl !== undefined) updateData.storageUrl = data.storageUrl;

    return await this.prisma.file.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        org: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string): Promise<void> {
    const existingFile = await this.findById(id);
    if (!existingFile) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    await this.prisma.file.update({
      where: { id },
      data: { isDeleted: 1, isDeletedDT: new Date() },
    });
  }

  async findByOwner(ownerId: string): Promise<File[]> {
    return await this.prisma.file.findMany({
      where: { ownerId, isDeleted: 0 },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        org: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByOrganization(orgId: string): Promise<File[]> {
    return await this.prisma.file.findMany({
      where: { orgId, isDeleted: 0 },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        org: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStorageType(storageType: string): Promise<File[]> {
    return await this.prisma.file.findMany({
      where: { storageType, isDeleted: 0 },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        org: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateProcessingStatus(id: string, status: string): Promise<File> {
    return await this.update(id, { processingStatus: status });
  }

  async updateVirusScanStatus(id: string, status: string): Promise<File> {
    return await this.update(id, { virusScanStatus: status });
  }

  async incrementDownloadCount(id: string): Promise<File> {
    const file = await this.findById(id);
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    return await this.update(id, {
      downloadCount: file.downloadCount + 1,
      lastAccessedAt: new Date()
    });
  }

  async getFileStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    storageTypes: Record<string, number>;
    categories: Record<string, number>;
  }> {
    const files = await this.prisma.file.findMany({
      where: { isDeleted: 0 },
      select: {
        fileSize: true,
        storageType: true,
        category: true,
      },
    });

    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0);

    const storageTypes: Record<string, number> = {};
    const categories: Record<string, number> = {};

    files.forEach(file => {
      const storageType = file.storageType || 'unknown';
      const category = file.category || 'uncategorized';

      storageTypes[storageType] = (storageTypes[storageType] || 0) + 1;
      categories[category] = (categories[category] || 0) + 1;
    });

    return {
      totalFiles,
      totalSize,
      storageTypes,
      categories,
    };
  }
}
