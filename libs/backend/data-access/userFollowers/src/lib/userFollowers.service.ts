import { Prisma, UserFollower } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { Injectable } from '@nestjs/common';

// Helper function for type-safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Injectable()
export class UserFollowersService {
  constructor(private readonly prisma: PrismaClientService) {}

  // Create a new user follow relationship
  async create(data: Prisma.UserFollowerCreateInput): Promise<UserFollower> {
    try {
      return await this.prisma.userFollower.create({
        data,
        include: {
          user: true,
          follower: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to create user follow relationship: ${getErrorMessage(error)}`);
    }
  }

  // Follow a user (simplified method)
  async followUser(userId: string, followerId: string): Promise<UserFollower> {
    try {
      if (userId === followerId) {
        throw new Error('Users cannot follow themselves');
      }

      return await this.create({
        user: { connect: { id: userId } },
        follower: { connect: { id: followerId } },
      });
    } catch (error) {
      throw new Error(`Failed to follow user: ${getErrorMessage(error)}`);
    }
  }

  // Unfollow a user (remove follow relationship)
  async unfollowUser(userId: string, followerId: string): Promise<UserFollower> {
    try {
      const existingFollow = await this.findOne(userId, followerId);
      if (!existingFollow) {
        throw new Error('Follow relationship not found');
      }

      return await this.prisma.userFollower.delete({
        where: {
          user_id_follower_id: {
            user_id: userId,
            follower_id: followerId,
          },
        },
        include: {
          user: true,
          follower: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to unfollow user: ${getErrorMessage(error)}`);
    }
  }

  // Find all user follow relationships with optional filtering and pagination
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserFollowerWhereUniqueInput;
    where?: Prisma.UserFollowerWhereInput;
    orderBy?: Prisma.UserFollowerOrderByWithRelationInput;
  }): Promise<UserFollower[]> {
    try {
      const { skip, take, cursor, where, orderBy } = params;
      return await this.prisma.userFollower.findMany({
        skip,
        take,
        cursor,
        where,
        orderBy: orderBy || { createdAt: 'desc' },
        include: {
          user: true,
          follower: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch user follow relationships: ${getErrorMessage(error)}`);
    }
  }

  // Find a specific follow relationship by user and follower IDs
  async findOne(userId: string, followerId: string): Promise<UserFollower | null> {
    try {
      return await this.prisma.userFollower.findUnique({
        where: {
          user_id_follower_id: {
            user_id: userId,
            follower_id: followerId,
          },
        },
        include: {
          user: true,
          follower: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch follow relationship: ${getErrorMessage(error)}`);
    }
  }

  // Check if a user follows another user
  async isFollowing(userId: string, followerId: string): Promise<boolean> {
    try {
      const followRelation = await this.findOne(userId, followerId);
      return followRelation !== null;
    } catch (error) {
      throw new Error(`Failed to check follow relationship: ${getErrorMessage(error)}`);
    }
  }

  // Get all followers of a specific user
  async getFollowers(userId: string): Promise<UserFollower[]> {
    try {
      return await this.findAll({
        where: { user_id: userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new Error(`Failed to fetch followers: ${getErrorMessage(error)}`);
    }
  }

  // Get all users that a specific user is following
  async getFollowing(followerId: string): Promise<UserFollower[]> {
    try {
      return await this.findAll({
        where: { follower_id: followerId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new Error(`Failed to fetch following users: ${getErrorMessage(error)}`);
    }
  }

  // Count followers for a specific user
  async countFollowers(userId: string): Promise<number> {
    try {
      return await this.prisma.userFollower.count({
        where: { user_id: userId },
      });
    } catch (error) {
      throw new Error(`Failed to count followers: ${getErrorMessage(error)}`);
    }
  }

  // Count users that a specific user is following
  async countFollowing(followerId: string): Promise<number> {
    try {
      return await this.prisma.userFollower.count({
        where: { follower_id: followerId },
      });
    } catch (error) {
      throw new Error(`Failed to count following users: ${getErrorMessage(error)}`);
    }
  }

  // Get mutual follows (users who follow each other)
  async getMutualFollows(userId: string): Promise<UserFollower[]> {
    try {
      // Get users that this user follows
      const following = await this.getFollowing(userId);
      const followingIds = following.map(f => f.user_id);

      // Get followers who are also being followed by this user
      return await this.findAll({
        where: {
          user_id: userId,
          follower_id: { in: followingIds },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new Error(`Failed to fetch mutual follows: ${getErrorMessage(error)}`);
    }
  }

  // Get users with most followers
  async getMostFollowedUsers(limit = 10): Promise<{ user_id: string; _count: number }[]> {
    try {
      const result = await this.prisma.userFollower.groupBy({
        by: ['user_id'],
        _count: {
          user_id: true,
        },
        orderBy: {
          _count: {
            user_id: 'desc',
          },
        },
        take: limit,
      });

      return result.map(item => ({
        user_id: item.user_id,
        _count: item._count.user_id,
      }));
    } catch (error) {
      throw new Error(`Failed to get most followed users: ${getErrorMessage(error)}`);
    }
  }

  // Get users who follow the most users
  async getMostActiveFollowers(limit = 10): Promise<{ follower_id: string; _count: number }[]> {
    try {
      const result = await this.prisma.userFollower.groupBy({
        by: ['follower_id'],
        _count: {
          follower_id: true,
        },
        orderBy: {
          _count: {
            follower_id: 'desc',
          },
        },
        take: limit,
      });

      return result.map(item => ({
        follower_id: item.follower_id,
        _count: item._count.follower_id,
      }));
    } catch (error) {
      throw new Error(`Failed to get most active followers: ${getErrorMessage(error)}`);
    }
  }

  // Get recent follow relationships (latest follows across all users)
  async getRecentFollows(limit = 20): Promise<UserFollower[]> {
    try {
      return await this.findAll({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new Error(`Failed to get recent follows: ${getErrorMessage(error)}`);
    }
  }

  // Get follow relationships for multiple users
  async getFollowsForUsers(userIds: string[]): Promise<UserFollower[]> {
    try {
      return await this.findAll({
        where: {
          user_id: {
            in: userIds,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new Error(`Failed to fetch follows for users: ${getErrorMessage(error)}`);
    }
  }

  // Get follow relationships by date range
  async getFollowsByDateRange(startDate: Date, endDate: Date): Promise<UserFollower[]> {
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
      throw new Error(`Failed to fetch follows by date range: ${getErrorMessage(error)}`);
    }
  }

  // Toggle follow (follow if not following, unfollow if following)
  async toggleFollow(userId: string, followerId: string): Promise<{ action: 'followed' | 'unfollowed'; follow?: UserFollower }> {
    try {
      if (userId === followerId) {
        throw new Error('Users cannot follow themselves');
      }

      const existingFollow = await this.findOne(userId, followerId);

      if (existingFollow) {
        await this.unfollowUser(userId, followerId);
        return { action: 'unfollowed' };
      } else {
        const newFollow = await this.followUser(userId, followerId);
        return { action: 'followed', follow: newFollow };
      }
    } catch (error) {
      throw new Error(`Failed to toggle follow: ${getErrorMessage(error)}`);
    }
  }

  // Get user follow statistics
  async getUserFollowStats(userId: string): Promise<{
    followersCount: number;
    followingCount: number;
    mutualFollowsCount: number;
    recentFollowers: UserFollower[];
    recentFollowing: UserFollower[];
  }> {
    try {
      const [followersCount, followingCount, mutualFollows, recentFollowers, recentFollowing] = await Promise.all([
        this.countFollowers(userId),
        this.countFollowing(userId),
        this.getMutualFollows(userId),
        this.findAll({
          where: { user_id: userId },
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
        this.findAll({
          where: { follower_id: userId },
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return {
        followersCount,
        followingCount,
        mutualFollowsCount: mutualFollows.length,
        recentFollowers,
        recentFollowing,
      };
    } catch (error) {
      throw new Error(`Failed to get user follow stats: ${getErrorMessage(error)}`);
    }
  }

  // Get suggested users to follow (users followed by users you follow, but not followed by you)
  async getSuggestedUsers(userId: string, limit = 10): Promise<string[]> {
    try {
      // Get users that this user follows
      const following = await this.getFollowing(userId);
      const followingIds = following.map(f => f.user_id);

      if (followingIds.length === 0) {
        return [];
      }

      // Get users followed by users that this user follows
      const suggestedFollows = await this.findAll({
        where: {
          follower_id: { in: followingIds },
          user_id: { not: userId }, // Exclude self
        },
      });

      // Get already following users to exclude them
      const alreadyFollowing = following.map(f => f.user_id);

      // Filter out users already followed and get unique suggestions
      const suggestions = suggestedFollows
        .map(f => f.user_id)
        .filter(id => !alreadyFollowing.includes(id))
        .filter((id, index, array) => array.indexOf(id) === index) // Remove duplicates
        .slice(0, limit);

      return suggestions;
    } catch (error) {
      throw new Error(`Failed to get suggested users: ${getErrorMessage(error)}`);
    }
  }
}
