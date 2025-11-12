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
import { UserFollowersService } from './userFollowers.service';

// Helper function for type-safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Controller('userFollowers')
export class UserFollowersController {
  constructor(private readonly userFollowersService: UserFollowersService) {}

  // POST /userFollowers - Create a new follow relationship
  @Post()
  async create(@Body() createUserFollowerDto: Prisma.UserFollowerCreateInput) {
    try {
      return await this.userFollowersService.create(createUserFollowerDto);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // POST /userFollowers/follow/:userId - Follow a user
  @Post('follow/:userId')
  async followUser(
    @Param('userId') userId: string,
    @Body('followerId') followerId: string,
  ) {
    if (!followerId) {
      throw new BadRequestException('Follower ID is required');
    }

    try {
      return await this.userFollowersService.followUser(userId, followerId);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // DELETE /userFollowers/unfollow/:userId - Unfollow a user
  @Delete('unfollow/:userId')
  async unfollowUser(
    @Param('userId') userId: string,
    @Body('followerId') followerId: string,
  ) {
    if (!followerId) {
      throw new BadRequestException('Follower ID is required');
    }

    try {
      return await this.userFollowersService.unfollowUser(userId, followerId);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes('not found')) {
        throw new NotFoundException(errorMessage);
      }
      throw new BadRequestException(errorMessage);
    }
  }

  // POST /userFollowers/toggle/:userId - Toggle follow for a user
  @Post('toggle/:userId')
  async toggleFollow(
    @Param('userId') userId: string,
    @Body('followerId') followerId: string,
  ) {
    if (!followerId) {
      throw new BadRequestException('Follower ID is required');
    }

    try {
      return await this.userFollowersService.toggleFollow(userId, followerId);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /userFollowers - Get all follow relationships with optional filtering
  @Get()
  async findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take?: number,
    @Query('userId') userId?: string,
    @Query('followerId') followerId?: string,
  ) {
    try {
      const where: Prisma.UserFollowerWhereInput = {};

      if (userId) {
        where.user_id = userId;
      }

      if (followerId) {
        where.follower_id = followerId;
      }

      return await this.userFollowersService.findAll({
        skip,
        take,
        where,
      });
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /userFollowers/:userId/:followerId - Get specific follow relationship
  @Get(':userId/:followerId')
  async findOne(
    @Param('userId') userId: string,
    @Param('followerId') followerId: string,
  ) {
    try {
      const followRelation = await this.userFollowersService.findOne(userId, followerId);
      if (!followRelation) {
        throw new NotFoundException('Follow relationship not found');
      }
      return followRelation;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /userFollowers/check/:userId/:followerId - Check if user follows another user
  @Get('check/:userId/:followerId')
  async isFollowing(
    @Param('userId') userId: string,
    @Param('followerId') followerId: string,
  ) {
    try {
      const isFollowing = await this.userFollowersService.isFollowing(userId, followerId);
      return { isFollowing };
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /userFollowers/followers/:userId - Get all followers of a user
  @Get('followers/:userId')
  async getFollowers(@Param('userId') userId: string) {
    try {
      return await this.userFollowersService.getFollowers(userId);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /userFollowers/following/:followerId - Get all users that a user is following
  @Get('following/:followerId')
  async getFollowing(@Param('followerId') followerId: string) {
    try {
      return await this.userFollowersService.getFollowing(followerId);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /userFollowers/followers/:userId/count - Count followers for a user
  @Get('followers/:userId/count')
  async countFollowers(@Param('userId') userId: string) {
    try {
      const count = await this.userFollowersService.countFollowers(userId);
      return { count };
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /userFollowers/following/:followerId/count - Count users that a user is following
  @Get('following/:followerId/count')
  async countFollowing(@Param('followerId') followerId: string) {
    try {
      const count = await this.userFollowersService.countFollowing(followerId);
      return { count };
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /userFollowers/mutual/:userId - Get mutual follows for a user
  @Get('mutual/:userId')
  async getMutualFollows(@Param('userId') userId: string) {
    try {
      return await this.userFollowersService.getMutualFollows(userId);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /userFollowers/analytics/most-followed - Get most followed users
  @Get('analytics/most-followed')
  async getMostFollowedUsers(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    try {
      return await this.userFollowersService.getMostFollowedUsers(limit);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /userFollowers/analytics/most-active - Get most active followers
  @Get('analytics/most-active')
  async getMostActiveFollowers(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    try {
      return await this.userFollowersService.getMostActiveFollowers(limit);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /userFollowers/analytics/recent - Get recent follows
  @Get('analytics/recent')
  async getRecentFollows(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    try {
      return await this.userFollowersService.getRecentFollows(limit);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // POST /userFollowers/users/bulk - Get follows for multiple users
  @Post('users/bulk')
  async getFollowsForUsers(@Body('userIds') userIds: string[]) {
    if (!userIds || !Array.isArray(userIds)) {
      throw new BadRequestException('User IDs array is required');
    }

    try {
      return await this.userFollowersService.getFollowsForUsers(userIds);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /userFollowers/analytics/date-range - Get follows by date range
  @Get('analytics/date-range')
  async getFollowsByDateRange(
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

      return await this.userFollowersService.getFollowsByDateRange(start, end);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /userFollowers/user/:userId/stats - Get comprehensive stats for a user
  @Get('user/:userId/stats')
  async getUserFollowStats(@Param('userId') userId: string) {
    try {
      return await this.userFollowersService.getUserFollowStats(userId);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /userFollowers/suggestions/:userId - Get suggested users to follow
  @Get('suggestions/:userId')
  async getSuggestedUsers(
    @Param('userId') userId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    try {
      return await this.userFollowersService.getSuggestedUsers(userId, limit);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }
}
