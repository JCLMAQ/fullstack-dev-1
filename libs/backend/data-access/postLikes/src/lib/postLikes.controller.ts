import { Prisma } from '@db/prisma';
import {
    BadRequestException,
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
    Query,
} from '@nestjs/common';
import { PostLikesService } from './postLikes.service';

// Helper function for type-safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Controller('postLikes')
export class PostLikesController {
  constructor(private readonly postLikesService: PostLikesService) {}

  // POST /postLikes - Create a new post like
  @Post()
  async create(@Body() createPostLikeDto: Prisma.PostLikeCreateInput) {
    try {
      return await this.postLikesService.create(createPostLikeDto);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // POST /postLikes/like/:postId - Like a post
  @Post('like/:postId')
  async likePost(
    @Param('postId') postId: string,
    @Body('userId') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    try {
      return await this.postLikesService.likePost(userId, postId);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // DELETE /postLikes/unlike/:postId - Unlike a post
  @Delete('unlike/:postId')
  async unlikePost(
    @Param('postId') postId: string,
    @Body('userId') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    try {
      return await this.postLikesService.unlikePost(userId, postId);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes('not found')) {
        throw new NotFoundException(errorMessage);
      }
      throw new BadRequestException(errorMessage);
    }
  }

  // POST /postLikes/toggle/:postId - Toggle like for a post
  @Post('toggle/:postId')
  async toggleLike(
    @Param('postId') postId: string,
    @Body('userId') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    try {
      return await this.postLikesService.toggleLike(userId, postId);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /postLikes - Get all post likes with optional filtering
  @Get()
  async findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take?: number,
    @Query('userId') userId?: string,
    @Query('postId') postId?: string,
  ) {
    try {
      const where: Prisma.PostLikeWhereInput = {};

      if (userId) {
        where.user_id = userId;
      }

      if (postId) {
        where.post_id = postId;
      }

      return await this.postLikesService.findAll({
        skip,
        take,
        where,
      });
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /postLikes/:userId/:postId - Get specific post like
  @Get(':userId/:postId')
  async findOne(
    @Param('userId') userId: string,
    @Param('postId') postId: string,
  ) {
    try {
      const postLike = await this.postLikesService.findOne(userId, postId);
      if (!postLike) {
        throw new NotFoundException('Post like not found');
      }
      return postLike;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /postLikes/check/:userId/:postId - Check if user has liked a post
  @Get('check/:userId/:postId')
  async hasUserLikedPost(
    @Param('userId') userId: string,
    @Param('postId') postId: string,
  ) {
    try {
      const hasLiked = await this.postLikesService.hasUserLikedPost(userId, postId);
      return { hasLiked };
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /postLikes/post/:postId - Get all likes for a specific post
  @Get('post/:postId')
  async findLikesByPost(@Param('postId') postId: string) {
    try {
      return await this.postLikesService.findLikesByPost(postId);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /postLikes/user/:userId - Get all likes by a specific user
  @Get('user/:userId')
  async findLikesByUser(@Param('userId') userId: string) {
    try {
      return await this.postLikesService.findLikesByUser(userId);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /postLikes/post/:postId/count - Count likes for a specific post
  @Get('post/:postId/count')
  async countLikesForPost(@Param('postId') postId: string) {
    try {
      const count = await this.postLikesService.countLikesForPost(postId);
      return { count };
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /postLikes/user/:userId/count - Count likes by a specific user
  @Get('user/:userId/count')
  async countLikesByUser(@Param('userId') userId: string) {
    try {
      const count = await this.postLikesService.countLikesByUser(userId);
      return { count };
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /postLikes/analytics/most-liked-posts - Get most liked posts
  @Get('analytics/most-liked-posts')
  async getMostLikedPosts(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    try {
      return await this.postLikesService.getMostLikedPosts(limit);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /postLikes/analytics/most-active-users - Get most active users
  @Get('analytics/most-active-users')
  async getMostActiveUsers(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    try {
      return await this.postLikesService.getMostActiveUsers(limit);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /postLikes/analytics/recent - Get recent likes
  @Get('analytics/recent')
  async getRecentLikes(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    try {
      return await this.postLikesService.getRecentLikes(limit);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // POST /postLikes/posts/bulk - Get likes for multiple posts
  @Post('posts/bulk')
  async findLikesForPosts(@Body('postIds') postIds: string[]) {
    if (!postIds || !Array.isArray(postIds)) {
      throw new BadRequestException('Post IDs array is required');
    }

    try {
      return await this.postLikesService.findLikesForPosts(postIds);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /postLikes/analytics/date-range - Get likes by date range
  @Get('analytics/date-range')
  async findLikesByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      return await this.postLikesService.findLikesByDateRange(start, end);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /postLikes/post/:postId/stats - Get comprehensive stats for a post
  @Get('post/:postId/stats')
  async getPostLikeStats(@Param('postId') postId: string) {
    try {
      return await this.postLikesService.getPostLikeStats(postId);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }
}
