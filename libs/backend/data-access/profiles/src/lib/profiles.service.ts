import { Prisma, Profile } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { Injectable } from '@nestjs/common';

// Helper function for type-safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaClientService) {}

  // Create a new profile
  async create(data: Prisma.ProfileCreateInput): Promise<Profile> {
    try {
      return await this.prisma.profile.create({
        data,
        include: {
          Users: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to create profile: ${getErrorMessage(error)}`);
    }
  }

  // Find all profiles with optional filtering and pagination
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ProfileWhereUniqueInput;
    where?: Prisma.ProfileWhereInput;
    orderBy?: Prisma.ProfileOrderByWithRelationInput;
  }): Promise<Profile[]> {
    try {
      const { skip, take, cursor, where, orderBy } = params;
      return await this.prisma.profile.findMany({
        skip,
        take,
        cursor,
        where: {
          ...where,
          isDeleted: 0, // Always exclude deleted profiles by default
        },
        orderBy: orderBy || { orderProfile: 'asc' },
        include: {
          Users: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch profiles: ${getErrorMessage(error)}`);
    }
  }

  // Find a single profile by ID
  async findOne(id: number): Promise<Profile> {
    try {
      const profile = await this.prisma.profile.findFirst({
        where: {
          id,
          isDeleted: 0,
        },
        include: {
          Users: true,
        },
      });

      if (!profile) {
        throw new Error(`Profile with ID ${id} not found`);
      }

      return profile;
    } catch (error) {
      throw new Error(`Failed to fetch profile: ${getErrorMessage(error)}`);
    }
  }

  // Update a profile
  async update(id: number, data: Prisma.ProfileUpdateInput): Promise<Profile> {
    try {
      // Check if profile exists and is not deleted
      await this.findOne(id);

      return await this.prisma.profile.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          Users: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to update profile: ${getErrorMessage(error)}`);
    }
  }

  // Soft delete a profile
  async remove(id: number): Promise<Profile> {
    try {
      // Check if profile exists and is not already deleted
      await this.findOne(id);

      return await this.prisma.profile.update({
        where: { id },
        data: {
          isDeleted: 1,
          isDeletedDT: new Date(),
          updatedAt: new Date(),
        },
        include: {
          Users: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to delete profile: ${getErrorMessage(error)}`);
    }
  }

  // Find profiles by publication status
  async findByPublished(published: boolean): Promise<Profile[]> {
    try {
      return await this.findAll({
        where: { published },
      });
    } catch (error) {
      throw new Error(`Failed to fetch profiles by published status: ${getErrorMessage(error)}`);
    }
  }

  // Find public profiles
  async findPublicProfiles(): Promise<Profile[]> {
    try {
      return await this.findAll({
        where: {
          isPublic: true,
          published: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch public profiles: ${getErrorMessage(error)}`);
    }
  }

  // Search profiles by bio content
  async searchProfiles(searchTerm: string): Promise<Profile[]> {
    try {
      return await this.findAll({
        where: {
          bio: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to search profiles: ${getErrorMessage(error)}`);
    }
  }

  // Update profile order
  async updateProfileOrder(id: number, newOrder: number): Promise<Profile> {
    try {
      return await this.update(id, {
        orderProfile: newOrder,
      });
    } catch (error) {
      throw new Error(`Failed to update profile order: ${getErrorMessage(error)}`);
    }
  }

  // Get profiles ordered by creation date
  async findProfilesByCreationDate(ascending = true): Promise<Profile[]> {
    try {
      return await this.findAll({
        orderBy: {
          createdAt: ascending ? 'asc' : 'desc',
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch profiles by creation date: ${getErrorMessage(error)}`);
    }
  }

  // Get profiles with users count
  async findProfilesWithUsersCount(): Promise<(Profile & { _count: { Users: number } })[]> {
    try {
      return await this.prisma.profile.findMany({
        where: {
          isDeleted: 0,
        },
        include: {
          Users: true,
          _count: {
            select: {
              Users: true,
            },
          },
        },
        orderBy: { orderProfile: 'asc' },
      });
    } catch (error) {
      throw new Error(`Failed to fetch profiles with users count: ${getErrorMessage(error)}`);
    }
  }

  // Update profile publication status
  async updatePublicationStatus(id: number, published: boolean): Promise<Profile> {
    try {
      return await this.update(id, {
        published,
      });
    } catch (error) {
      throw new Error(`Failed to update profile publication status: ${getErrorMessage(error)}`);
    }
  }

  // Update profile visibility
  async updateVisibility(id: number, isPublic: boolean): Promise<Profile> {
    try {
      return await this.update(id, {
        isPublic,
      });
    } catch (error) {
      throw new Error(`Failed to update profile visibility: ${getErrorMessage(error)}`);
    }
  }

  // Get profiles by order range
  async findProfilesByOrderRange(minOrder: number, maxOrder: number): Promise<Profile[]> {
    try {
      return await this.findAll({
        where: {
          orderProfile: {
            gte: minOrder,
            lte: maxOrder,
          },
        },
        orderBy: { orderProfile: 'asc' },
      });
    } catch (error) {
      throw new Error(`Failed to fetch profiles by order range: ${getErrorMessage(error)}`);
    }
  }
}
