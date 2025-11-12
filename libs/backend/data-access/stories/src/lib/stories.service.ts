import { Prisma, Story } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { Injectable } from '@nestjs/common';

// Helper function for type-safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Injectable()
export class StoriesService {
  constructor(private readonly prisma: PrismaClientService) {}

  // Create a new story
  async create(data: Prisma.StoryCreateInput): Promise<Story> {
    try {
      return await this.prisma.story.create({
        data,
        include: {
          user: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to create story: ${getErrorMessage(error)}`);
    }
  }

  // Find all stories with optional filtering and pagination
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.StoryWhereUniqueInput;
    where?: Prisma.StoryWhereInput;
    orderBy?: Prisma.StoryOrderByWithRelationInput;
  }): Promise<Story[]> {
    try {
      const { skip, take, cursor, where, orderBy } = params;
      return await this.prisma.story.findMany({
        skip,
        take,
        cursor,
        where: {
          ...where,
          isDeleted: 0, // Always exclude deleted stories by default
        },
        orderBy: orderBy || { numSeq: 'desc' },
        include: {
          user: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch stories: ${getErrorMessage(error)}`);
    }
  }

  // Find a single story by ID
  async findOne(id: string): Promise<Story> {
    try {
      const story = await this.prisma.story.findFirst({
        where: {
          id,
          isDeleted: 0,
        },
        include: {
          user: true,
        },
      });

      if (!story) {
        throw new Error(`Story with ID ${id} not found`);
      }

      return story;
    } catch (error) {
      throw new Error(`Failed to fetch story: ${getErrorMessage(error)}`);
    }
  }

  // Update a story
  async update(id: string, data: Prisma.StoryUpdateInput): Promise<Story> {
    try {
      // Check if story exists and is not deleted
      await this.findOne(id);

      return await this.prisma.story.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          user: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to update story: ${getErrorMessage(error)}`);
    }
  }

  // Soft delete a story
  async remove(id: string): Promise<Story> {
    try {
      // Check if story exists and is not already deleted
      await this.findOne(id);

      return await this.prisma.story.update({
        where: { id },
        data: {
          isDeleted: 1,
          isDeletedDT: new Date(),
          updatedAt: new Date(),
        },
        include: {
          user: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to delete story: ${getErrorMessage(error)}`);
    }
  }

  // Find stories by user ID
  async findByUser(userId: string): Promise<Story[]> {
    try {
      return await this.findAll({
        where: { user_id: userId },
        orderBy: { numSeq: 'desc' },
      });
    } catch (error) {
      throw new Error(`Failed to fetch stories for user: ${getErrorMessage(error)}`);
    }
  }

  // Find stories by publication status
  async findByPublished(published: boolean): Promise<Story[]> {
    try {
      return await this.findAll({
        where: { published },
      });
    } catch (error) {
      throw new Error(`Failed to fetch stories by published status: ${getErrorMessage(error)}`);
    }
  }

  // Find public stories
  async findPublicStories(): Promise<Story[]> {
    try {
      return await this.findAll({
        where: {
          isPublic: true,
          published: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch public stories: ${getErrorMessage(error)}`);
    }
  }

  // Search stories by caption content
  async searchStories(searchTerm: string): Promise<Story[]> {
    try {
      return await this.findAll({
        where: {
          caption: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to search stories: ${getErrorMessage(error)}`);
    }
  }

  // Get stories ordered by creation date
  async findStoriesByCreationDate(ascending = false): Promise<Story[]> {
    try {
      return await this.findAll({
        orderBy: {
          createdAt: ascending ? 'asc' : 'desc',
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch stories by creation date: ${getErrorMessage(error)}`);
    }
  }

  // Get stories with sequence range
  async findStoriesBySequenceRange(minSeq: number, maxSeq: number): Promise<Story[]> {
    try {
      return await this.findAll({
        where: {
          numSeq: {
            gte: minSeq,
            lte: maxSeq,
          },
        },
        orderBy: { numSeq: 'asc' },
      });
    } catch (error) {
      throw new Error(`Failed to fetch stories by sequence range: ${getErrorMessage(error)}`);
    }
  }

  // Update story publication status
  async updatePublicationStatus(id: string, published: boolean): Promise<Story> {
    try {
      return await this.update(id, {
        published,
      });
    } catch (error) {
      throw new Error(`Failed to update story publication status: ${getErrorMessage(error)}`);
    }
  }

  // Update story visibility
  async updateVisibility(id: string, isPublic: boolean): Promise<Story> {
    try {
      return await this.update(id, {
        isPublic,
      });
    } catch (error) {
      throw new Error(`Failed to update story visibility: ${getErrorMessage(error)}`);
    }
  }

  // Get recent stories (last N stories)
  async findRecentStories(limit = 10): Promise<Story[]> {
    try {
      return await this.findAll({
        take: limit,
        orderBy: { createdAt: 'desc' },
        where: {
          published: true,
          isPublic: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch recent stories: ${getErrorMessage(error)}`);
    }
  }

  // Get stories count by user
  async getStoriesCountByUser(userId: string): Promise<number> {
    try {
      return await this.prisma.story.count({
        where: {
          user_id: userId,
          isDeleted: 0,
        },
      });
    } catch (error) {
      throw new Error(`Failed to count stories for user: ${getErrorMessage(error)}`);
    }
  }

  // Update story caption
  async updateCaption(id: string, caption: string): Promise<Story> {
    try {
      return await this.update(id, {
        caption,
      });
    } catch (error) {
      throw new Error(`Failed to update story caption: ${getErrorMessage(error)}`);
    }
  }

  // Get stories by date range
  async findStoriesByDateRange(startDate: Date, endDate: Date): Promise<Story[]> {
    try {
      return await this.findAll({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new Error(`Failed to fetch stories by date range: ${getErrorMessage(error)}`);
    }
  }
}
