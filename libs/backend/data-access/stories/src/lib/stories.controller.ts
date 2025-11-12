import { Prisma, Story } from '@db/prisma';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { StoriesService } from './stories.service';

// Helper function for type-safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  // Create a new story
  @Post()
  async create(@Body() createStoryDto: Prisma.StoryCreateInput): Promise<Story> {
    try {
      return await this.storiesService.create(createStoryDto);
    } catch (error) {
      throw new HttpException(
        `Failed to create story: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get all stories with optional filters
  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('userId') userId?: string,
    @Query('published') published?: string,
    @Query('isPublic') isPublic?: string,
  ): Promise<Story[]> {
    try {
      const where: Prisma.StoryWhereInput = {};

      if (userId) where.user_id = userId;
      if (published !== undefined) where.published = published === 'true';
      if (isPublic !== undefined) where.isPublic = isPublic === 'true';

      return await this.storiesService.findAll({
        skip: skip ? parseInt(skip, 10) : undefined,
        take: take ? parseInt(take, 10) : undefined,
        where,
      });
    } catch (error) {
      throw new HttpException(
        `Failed to fetch stories: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get story by ID
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Story> {
    try {
      return await this.storiesService.findOne(id);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch story: ${getErrorMessage(error)}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  // Update story
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStoryDto: Prisma.StoryUpdateInput,
  ): Promise<Story> {
    try {
      return await this.storiesService.update(id, updateStoryDto);
    } catch (error) {
      throw new HttpException(
        `Failed to update story: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Delete story (soft delete)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Story> {
    try {
      return await this.storiesService.remove(id);
    } catch (error) {
      throw new HttpException(
        `Failed to delete story: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get stories by user ID
  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string): Promise<Story[]> {
    try {
      return await this.storiesService.findByUser(userId);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch stories for user: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get stories by publication status
  @Get('published/:status')
  async findByPublished(@Param('status') status: string): Promise<Story[]> {
    try {
      const published = status === 'true';
      return await this.storiesService.findByPublished(published);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch stories by published status: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get public stories
  @Get('visibility/public')
  async findPublicStories(): Promise<Story[]> {
    try {
      return await this.storiesService.findPublicStories();
    } catch (error) {
      throw new HttpException(
        `Failed to fetch public stories: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Search stories by caption content
  @Get('search/query')
  async searchStories(@Query('q') searchTerm: string): Promise<Story[]> {
    try {
      if (!searchTerm) {
        throw new HttpException('Search query is required', HttpStatus.BAD_REQUEST);
      }
      return await this.storiesService.searchStories(searchTerm);
    } catch (error) {
      throw new HttpException(
        `Failed to search stories: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get stories ordered by creation date
  @Get('sort/creation-date')
  async findStoriesByCreationDate(@Query('ascending') ascending?: string): Promise<Story[]> {
    try {
      const isAscending = ascending === 'true';
      return await this.storiesService.findStoriesByCreationDate(isAscending);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch stories by creation date: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get stories with sequence range
  @Get('sequence/range')
  async findStoriesBySequenceRange(
    @Query('min') min: string,
    @Query('max') max: string,
  ): Promise<Story[]> {
    try {
      const minSeq = parseInt(min, 10);
      const maxSeq = parseInt(max, 10);

      if (isNaN(minSeq) || isNaN(maxSeq)) {
        throw new HttpException('Min and max sequence values must be numbers', HttpStatus.BAD_REQUEST);
      }

      if (minSeq > maxSeq) {
        throw new HttpException('Min sequence cannot be greater than max sequence', HttpStatus.BAD_REQUEST);
      }

      return await this.storiesService.findStoriesBySequenceRange(minSeq, maxSeq);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch stories by sequence range: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Update story publication status
  @Patch(':id/publication')
  async updatePublicationStatus(
    @Param('id') id: string,
    @Body('published') published: boolean,
  ): Promise<Story> {
    try {
      if (typeof published !== 'boolean') {
        throw new HttpException('Published status must be a boolean', HttpStatus.BAD_REQUEST);
      }
      return await this.storiesService.updatePublicationStatus(id, published);
    } catch (error) {
      throw new HttpException(
        `Failed to update story publication status: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Update story visibility
  @Patch(':id/visibility')
  async updateVisibility(
    @Param('id') id: string,
    @Body('isPublic') isPublic: boolean,
  ): Promise<Story> {
    try {
      if (typeof isPublic !== 'boolean') {
        throw new HttpException('Visibility status must be a boolean', HttpStatus.BAD_REQUEST);
      }
      return await this.storiesService.updateVisibility(id, isPublic);
    } catch (error) {
      throw new HttpException(
        `Failed to update story visibility: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get recent stories
  @Get('feed/recent')
  async findRecentStories(@Query('limit') limit?: string): Promise<Story[]> {
    try {
      const storyLimit = limit ? parseInt(limit, 10) : 10;
      if (isNaN(storyLimit) || storyLimit <= 0) {
        throw new HttpException('Limit must be a positive number', HttpStatus.BAD_REQUEST);
      }
      return await this.storiesService.findRecentStories(storyLimit);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch recent stories: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get stories count by user
  @Get('user/:userId/count')
  async getStoriesCountByUser(@Param('userId') userId: string): Promise<{ count: number }> {
    try {
      const count = await this.storiesService.getStoriesCountByUser(userId);
      return { count };
    } catch (error) {
      throw new HttpException(
        `Failed to count stories for user: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Update story caption
  @Patch(':id/caption')
  async updateCaption(
    @Param('id') id: string,
    @Body('caption') caption: string,
  ): Promise<Story> {
    try {
      if (!caption || typeof caption !== 'string') {
        throw new HttpException('Caption is required and must be a string', HttpStatus.BAD_REQUEST);
      }
      return await this.storiesService.updateCaption(id, caption);
    } catch (error) {
      throw new HttpException(
        `Failed to update story caption: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get stories by date range
  @Get('date/range')
  async findStoriesByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Story[]> {
    try {
      if (!startDate || !endDate) {
        throw new HttpException('Start date and end date are required', HttpStatus.BAD_REQUEST);
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new HttpException('Invalid date format', HttpStatus.BAD_REQUEST);
      }

      if (start > end) {
        throw new HttpException('Start date cannot be after end date', HttpStatus.BAD_REQUEST);
      }

      return await this.storiesService.findStoriesByDateRange(start, end);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch stories by date range: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
