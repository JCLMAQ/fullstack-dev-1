import { Image, Prisma } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { Injectable } from '@nestjs/common';

export interface ImageCreateData {
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
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
  uploadedById: string;
  associatedId?: string;
  associationType?: string;
  orgId?: string;
  postId?: string;
  storyId?: string;
  profileUserId?: string;
}

export interface ImageSearchOptions {
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
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface ImageBulkUpdateData {
  ids: string[];
  updates: Partial<Omit<Image, 'id' | 'numSeq' | 'createdAt' | 'updatedAt' | 'uploadedById'>>;
}

export interface ImageAnalyticsResult {
  totalImages: number;
  totalSize: number;
  averageSize: number;
  mimeTypeDistribution: Record<string, number>;
  storageTypeDistribution: Record<string, number>;
  uploaderDistribution: Record<string, number>;
  monthlyUploads: Array<{ month: string; count: number; totalSize: number }>;
}

interface GroupByStat {
  _count: Record<string, number>;
  [key: string]: unknown;
}

interface MonthlyStatResult {
  month: string;
  count: bigint;
  totalSize: bigint;
}

@Injectable()
export class ImagesService {
  constructor(private readonly prisma: PrismaClientService) {}

  // Core CRUD Operations
  async createImage(data: ImageCreateData): Promise<Image> {
    return await this.prisma.image.create({
      data: {
        filename: data.filename,
        originalName: data.originalName,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        width: data.width,
        height: data.height,
        storageType: data.storageType || 'local',
        storagePath: data.storagePath,
        storageUrl: data.storageUrl,
        bucketName: data.bucketName,
        thumbnailUrl: data.thumbnailUrl,
        variants: data.variants as Prisma.InputJsonValue,
        tags: data.tags || [],
        altText: data.altText,
        description: data.description,
        sequence: data.sequence || 0,
        isPublic: data.isPublic ?? true,
        uploadedBy: {
          connect: { id: data.uploadedById }
        },
        ...(data.associatedId && { associatedId: data.associatedId }),
        ...(data.associationType && { associationType: data.associationType }),
        ...(data.orgId && { org: { connect: { id: data.orgId } } }),
        ...(data.postId && { post: { connect: { id: data.postId } } }),
        ...(data.storyId && { story: { connect: { id: data.storyId } } }),
        ...(data.profileUserId && { profileUser: { connect: { id: data.profileUserId } } })
      }
    });
  }



  async findImageById(id: string): Promise<Image | null> {
    return this.prisma.image.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        org: {
          select: {
            id: true,
            name: true
          }
        },
        post: {
          select: {
            id: true,
            title: true
          }
        },
        story: {
          select: {
            id: true,
            caption: true
          }
        },
        profileUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  async findImages(
    options: ImageSearchOptions = {},
    pagination?: { skip?: number; take?: number; orderBy?: Prisma.ImageOrderByWithRelationInput }
  ): Promise<Image[]> {
    const where: Prisma.ImageWhereInput = {
      isDeleted: 0,
      ...(options.uploadedById && { uploadedById: options.uploadedById }),
      ...(options.associatedId && { associatedId: options.associatedId }),
      ...(options.associationType && { associationType: options.associationType }),
      ...(options.orgId && { orgId: options.orgId }),
      ...(options.postId && { postId: options.postId }),
      ...(options.storyId && { storyId: options.storyId }),
      ...(options.profileUserId && { profileUserId: options.profileUserId }),
      ...(options.mimeType && { mimeType: options.mimeType }),
      ...(options.isPublic !== undefined && { isPublic: options.isPublic }),
      ...(options.storageType && { storageType: options.storageType }),
      ...(options.tags && options.tags.length > 0 && {
        tags: {
          hasSome: options.tags
        }
      }),
      ...(options.createdAfter && {
        createdAt: {
          gte: options.createdAfter
        }
      }),
      ...(options.createdBefore && {
        createdAt: {
          lte: options.createdBefore
        }
      })
    };

    return this.prisma.image.findMany({
      where,
      skip: pagination?.skip,
      take: pagination?.take,
      orderBy: pagination?.orderBy || { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        org: {
          select: {
            id: true,
            name: true
          }
        },
        post: {
          select: {
            id: true,
            title: true
          }
        },
        story: {
          select: {
            id: true,
            caption: true
          }
        }
      }
    });
  }

  private cleanUpdateData(data: Partial<Omit<Image, 'id' | 'numSeq' | 'createdAt' | 'updatedAt' | 'uploadedById'>>) {
    const cleaned: Record<string, unknown> = { ...data };

    // Convert null values to undefined for Prisma compatibility
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === null) {
        cleaned[key] = undefined;
      }
    });

    return cleaned;
  }

  async updateImage(
    id: string,
    data: Partial<Omit<Image, 'id' | 'numSeq' | 'createdAt' | 'updatedAt' | 'uploadedById'>>
  ): Promise<Image> {
    try {
      const cleanedData = this.cleanUpdateData(data);
      return await this.prisma.image.update({
        where: { id },
        data: {
          ...cleanedData,
          updatedAt: new Date()
        }
      });
    } catch {
      throw new Error(`Image with ID ${id} not found`);
    }
  }

  async deleteImage(id: string, softDelete = true): Promise<Image> {
    if (softDelete) {
      return this.updateImage(id, {
        isDeleted: 1,
        isDeletedDT: new Date()
      });
    } else {
      try {
        return await this.prisma.image.delete({
          where: { id }
        });
      } catch {
        throw new Error(`Image with ID ${id} not found`);
      }
    }
  }

  // Bulk Operations
  async bulkUpdateImages(data: ImageBulkUpdateData): Promise<{ count: number }> {
    const cleanedUpdates = this.cleanUpdateData(data.updates);
    const result = await this.prisma.image.updateMany({
      where: {
        id: { in: data.ids },
        isDeleted: 0
      },
      data: {
        ...cleanedUpdates,
        updatedAt: new Date()
      }
    });

    return { count: result.count };
  }

  async bulkDeleteImages(ids: string[], softDelete = true): Promise<{ count: number }> {
    if (softDelete) {
      const result = await this.prisma.image.updateMany({
        where: {
          id: { in: ids },
          isDeleted: 0
        },
        data: {
          isDeleted: 1,
          isDeletedDT: new Date(),
          updatedAt: new Date()
        }
      });

      return { count: result.count };
    } else {
      const result = await this.prisma.image.deleteMany({
        where: {
          id: { in: ids }
        }
      });

      return { count: result.count };
    }
  }

  // Association Management
  async associateWithPost(imageIds: string[], postId: string): Promise<{ count: number }> {
    const result = await this.prisma.image.updateMany({
      where: {
        id: { in: imageIds },
        isDeleted: 0
      },
      data: {
        postId,
        associatedId: postId,
        associationType: 'post',
        updatedAt: new Date()
      }
    });

    return { count: result.count };
  }

  async associateWithUser(imageIds: string[], userId: string, asProfile = false): Promise<{ count: number }> {
    const updateData = asProfile
      ? {
          profileUserId: userId,
          associatedId: userId,
          associationType: 'user_profile'
        }
      : {
          associatedId: userId,
          associationType: 'user'
        };

    const result = await this.prisma.image.updateMany({
      where: {
        id: { in: imageIds },
        isDeleted: 0
      },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return { count: result.count };
  }

  async associateWithOrganization(imageIds: string[], orgId: string): Promise<{ count: number }> {
    const result = await this.prisma.image.updateMany({
      where: {
        id: { in: imageIds },
        isDeleted: 0
      },
      data: {
        orgId,
        associatedId: orgId,
        associationType: 'organization',
        updatedAt: new Date()
      }
    });

    return { count: result.count };
  }

  async associateWithStory(imageIds: string[], storyId: string): Promise<{ count: number }> {
    const result = await this.prisma.image.updateMany({
      where: {
        id: { in: imageIds },
        isDeleted: 0
      },
      data: {
        storyId,
        associatedId: storyId,
        associationType: 'story',
        updatedAt: new Date()
      }
    });

    return { count: result.count };
  }

  // Tagging and Metadata Management
  async addTagsToImages(imageIds: string[], newTags: string[]): Promise<{ count: number }> {
    let updatedCount = 0;

    for (const imageId of imageIds) {
      const image = await this.prisma.image.findUnique({
        where: { id: imageId },
        select: { tags: true }
      });

      if (image) {
        const existingTags = Array.isArray(image.tags) ? image.tags : [];
        const uniqueTags = [...new Set([...existingTags, ...newTags])];

        await this.prisma.image.update({
          where: { id: imageId },
          data: {
            tags: uniqueTags,
            updatedAt: new Date()
          }
        });

        updatedCount++;
      }
    }

    return { count: updatedCount };
  }

  async removeTagsFromImages(imageIds: string[], tagsToRemove: string[]): Promise<{ count: number }> {
    let updatedCount = 0;

    for (const imageId of imageIds) {
      const image = await this.prisma.image.findUnique({
        where: { id: imageId },
        select: { tags: true }
      });

      if (image) {
        const existingTags = Array.isArray(image.tags) ? image.tags : [];
        const filteredTags = existingTags.filter((tag: string) => !tagsToRemove.includes(tag));

        await this.prisma.image.update({
          where: { id: imageId },
          data: {
            tags: filteredTags,
            updatedAt: new Date()
          }
        });

        updatedCount++;
      }
    }

    return { count: updatedCount };
  }

  async updateImageMetadata(
    imageId: string,
    metadata: {
      altText?: string;
      description?: string;
      tags?: string[];
    }
  ): Promise<Image> {
    return this.updateImage(imageId, metadata);
  }

  // Analytics and Statistics
  async getImageAnalytics(filters?: ImageSearchOptions): Promise<ImageAnalyticsResult> {
    const where: Prisma.ImageWhereInput = {
      isDeleted: 0,
      ...(filters?.uploadedById && { uploadedById: filters.uploadedById }),
      ...(filters?.orgId && { orgId: filters.orgId }),
      ...(filters?.associationType && { associationType: filters.associationType }),
      ...(filters?.createdAfter && { createdAt: { gte: filters.createdAfter } }),
      ...(filters?.createdBefore && { createdAt: { lte: filters.createdBefore } })
    };

    // Total counts and sizes
    const totalStats = await this.prisma.image.aggregate({
      where,
      _count: { id: true },
      _sum: { fileSize: true },
      _avg: { fileSize: true }
    });

    // MIME type distribution
    const mimeTypeStats = await this.prisma.image.groupBy({
      by: ['mimeType'],
      where,
      _count: { mimeType: true }
    });

    // Storage type distribution
    const storageTypeStats = await this.prisma.image.groupBy({
      by: ['storageType'],
      where,
      _count: { storageType: true }
    });

    // Uploader distribution
    const uploaderStats = await this.prisma.image.groupBy({
      by: ['uploadedById'],
      where,
      _count: { uploadedById: true }
    });

    // Monthly uploads
    const monthlyStats = await this.prisma.$queryRaw<Array<{
      month: string;
      count: bigint;
      totalSize: bigint;
    }>>`
      SELECT
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        COUNT(*) as count,
        SUM("fileSize") as "totalSize"
      FROM "Image"
      WHERE "isDeleted" = 0
      ${filters?.createdAfter ? Prisma.sql`AND "createdAt" >= ${filters.createdAfter}` : Prisma.empty}
      ${filters?.createdBefore ? Prisma.sql`AND "createdAt" <= ${filters.createdBefore}` : Prisma.empty}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `;

    return {
      totalImages: totalStats._count.id,
      totalSize: totalStats._sum.fileSize || 0,
      averageSize: totalStats._avg.fileSize || 0,
      mimeTypeDistribution: mimeTypeStats.reduce((acc: Record<string, number>, stat: GroupByStat) => {
        acc[stat['mimeType'] as string] = stat._count['mimeType'];
        return acc;
      }, {} as Record<string, number>),
      storageTypeDistribution: storageTypeStats.reduce((acc: Record<string, number>, stat: GroupByStat) => {
        acc[stat['storageType'] as string] = stat._count['storageType'];
        return acc;
      }, {} as Record<string, number>),
      uploaderDistribution: uploaderStats.reduce((acc: Record<string, number>, stat: GroupByStat) => {
        acc[stat['uploadedById'] as string] = stat._count['uploadedById'];
        return acc;
      }, {} as Record<string, number>),
      monthlyUploads: monthlyStats.map((stat: MonthlyStatResult) => ({
        month: stat.month,
        count: Number(stat.count),
        totalSize: Number(stat.totalSize)
      }))
    };
  }

  // Search and Filtering
  async searchImages(
    query: string,
    options: ImageSearchOptions = {},
    pagination?: { skip?: number; take?: number }
  ): Promise<Image[]> {
    const where: Prisma.ImageWhereInput = {
      isDeleted: 0,
      OR: [
        { originalName: { contains: query, mode: 'insensitive' } },
        { filename: { contains: query, mode: 'insensitive' } },
        { altText: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query] } }
      ],
      ...(options.uploadedById && { uploadedById: options.uploadedById }),
      ...(options.orgId && { orgId: options.orgId }),
      ...(options.mimeType && { mimeType: options.mimeType }),
      ...(options.isPublic !== undefined && { isPublic: options.isPublic })
    };

    return this.prisma.image.findMany({
      where,
      skip: pagination?.skip,
      take: pagination?.take,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        org: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  async getImagesByTags(
    tags: string[],
    options: ImageSearchOptions = {},
    pagination?: { skip?: number; take?: number }
  ): Promise<Image[]> {
    const where: Prisma.ImageWhereInput = {
      isDeleted: 0,
      tags: {
        hasSome: tags
      },
      ...(options.uploadedById && { uploadedById: options.uploadedById }),
      ...(options.orgId && { orgId: options.orgId }),
      ...(options.isPublic !== undefined && { isPublic: options.isPublic })
    };

    return this.prisma.image.findMany({
      where,
      skip: pagination?.skip,
      take: pagination?.take,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  // Utility Methods
  async getUnusedImages(daysOld = 30): Promise<Image[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return this.prisma.image.findMany({
      where: {
        isDeleted: 0,
        createdAt: { lt: cutoffDate },
        AND: [
          { postId: null },
          { storyId: null },
          { profileUserId: null },
          { associatedId: null }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getDuplicateImages(): Promise<Array<{ originalName: string; fileSize: number; images: Image[] }>> {
    const duplicates = await this.prisma.image.groupBy({
      by: ['originalName', 'fileSize'],
      where: { isDeleted: 0 },
      _count: { id: true },
      having: {
        id: { _count: { gt: 1 } }
      }
    });

    const result = [];
    for (const duplicate of duplicates) {
      const images = await this.prisma.image.findMany({
        where: {
          originalName: duplicate.originalName,
          fileSize: duplicate.fileSize,
          isDeleted: 0
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      result.push({
        originalName: duplicate.originalName,
        fileSize: duplicate.fileSize,
        images
      });
    }

    return result;
  }

  async getImageUsageStats(imageId: string): Promise<{
    usedInPosts: number;
    usedInStories: number;
    usedAsProfilePicture: number;
    totalUsage: number;
  }> {
    const image = await this.prisma.image.findUnique({
      where: { id: imageId },
      select: {
        postId: true,
        storyId: true,
        profileUserId: true
      }
    });

    if (!image) {
      throw new Error(`Image with ID ${imageId} not found`);
    }

    return {
      usedInPosts: image.postId ? 1 : 0,
      usedInStories: image.storyId ? 1 : 0,
      usedAsProfilePicture: image.profileUserId ? 1 : 0,
      totalUsage: [image.postId, image.storyId, image.profileUserId].filter(Boolean).length
    };
  }

  // Recovery Operations
  async recoverDeletedImages(ids: string[]): Promise<{ count: number }> {
    const result = await this.prisma.image.updateMany({
      where: {
        id: { in: ids },
        isDeleted: 1
      },
      data: {
        isDeleted: 0,
        isDeletedDT: null,
        updatedAt: new Date()
      }
    });

    return { count: result.count };
  }

  async getDeletedImages(pagination?: { skip?: number; take?: number }): Promise<Image[]> {
    return this.prisma.image.findMany({
      where: { isDeleted: 1 },
      skip: pagination?.skip,
      take: pagination?.take,
      orderBy: { isDeletedDT: 'desc' },
      include: {
        uploadedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  async permanentlyDeleteOldImages(daysOld = 90): Promise<{ count: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.image.deleteMany({
      where: {
        isDeleted: 1,
        isDeletedDT: { lt: cutoffDate }
      }
    });

    return { count: result.count };
  }
}
