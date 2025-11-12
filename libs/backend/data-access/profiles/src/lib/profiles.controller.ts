import { Prisma, Profile } from '@db/prisma';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';

// Helper function for type-safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  // Create a new profile
  @Post()
  async create(@Body() createProfileDto: Prisma.ProfileCreateInput): Promise<Profile> {
    try {
      return await this.profilesService.create(createProfileDto);
    } catch (error) {
      throw new HttpException(
        `Failed to create profile: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get all profiles with optional filters
  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('published') published?: string,
    @Query('isPublic') isPublic?: string,
  ): Promise<Profile[]> {
    try {
      const where: Prisma.ProfileWhereInput = {};

      if (published !== undefined) where.published = published === 'true';
      if (isPublic !== undefined) where.isPublic = isPublic === 'true';

      return await this.profilesService.findAll({
        skip: skip ? parseInt(skip, 10) : undefined,
        take: take ? parseInt(take, 10) : undefined,
        where,
      });
    } catch (error) {
      throw new HttpException(
        `Failed to fetch profiles: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get profile by ID
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Profile> {
    try {
      return await this.profilesService.findOne(id);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch profile: ${getErrorMessage(error)}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  // Update profile
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProfileDto: Prisma.ProfileUpdateInput,
  ): Promise<Profile> {
    try {
      return await this.profilesService.update(id, updateProfileDto);
    } catch (error) {
      throw new HttpException(
        `Failed to update profile: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Delete profile (soft delete)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Profile> {
    try {
      return await this.profilesService.remove(id);
    } catch (error) {
      throw new HttpException(
        `Failed to delete profile: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get profiles by publication status
  @Get('published/:status')
  async findByPublished(@Param('status') status: string): Promise<Profile[]> {
    try {
      const published = status === 'true';
      return await this.profilesService.findByPublished(published);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch profiles by published status: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get public profiles
  @Get('visibility/public')
  async findPublicProfiles(): Promise<Profile[]> {
    try {
      return await this.profilesService.findPublicProfiles();
    } catch (error) {
      throw new HttpException(
        `Failed to fetch public profiles: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Search profiles by bio content
  @Get('search/query')
  async searchProfiles(@Query('q') searchTerm: string): Promise<Profile[]> {
    try {
      if (!searchTerm) {
        throw new HttpException('Search query is required', HttpStatus.BAD_REQUEST);
      }
      return await this.profilesService.searchProfiles(searchTerm);
    } catch (error) {
      throw new HttpException(
        `Failed to search profiles: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Update profile order
  @Patch(':id/order')
  async updateProfileOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body('orderProfile') newOrder: number,
  ): Promise<Profile> {
    try {
      if (typeof newOrder !== 'number') {
        throw new HttpException('Order must be a number', HttpStatus.BAD_REQUEST);
      }
      return await this.profilesService.updateProfileOrder(id, newOrder);
    } catch (error) {
      throw new HttpException(
        `Failed to update profile order: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get profiles ordered by creation date
  @Get('sort/creation-date')
  async findProfilesByCreationDate(@Query('ascending') ascending?: string): Promise<Profile[]> {
    try {
      const isAscending = ascending !== 'false'; // Default to true
      return await this.profilesService.findProfilesByCreationDate(isAscending);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch profiles by creation date: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get profiles with users count
  @Get('analytics/users-count')
  async findProfilesWithUsersCount(): Promise<(Profile & { _count: { Users: number } })[]> {
    try {
      return await this.profilesService.findProfilesWithUsersCount();
    } catch (error) {
      throw new HttpException(
        `Failed to fetch profiles with users count: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Update profile publication status
  @Patch(':id/publication')
  async updatePublicationStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('published') published: boolean,
  ): Promise<Profile> {
    try {
      if (typeof published !== 'boolean') {
        throw new HttpException('Published status must be a boolean', HttpStatus.BAD_REQUEST);
      }
      return await this.profilesService.updatePublicationStatus(id, published);
    } catch (error) {
      throw new HttpException(
        `Failed to update profile publication status: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Update profile visibility
  @Patch(':id/visibility')
  async updateVisibility(
    @Param('id', ParseIntPipe) id: number,
    @Body('isPublic') isPublic: boolean,
  ): Promise<Profile> {
    try {
      if (typeof isPublic !== 'boolean') {
        throw new HttpException('Visibility status must be a boolean', HttpStatus.BAD_REQUEST);
      }
      return await this.profilesService.updateVisibility(id, isPublic);
    } catch (error) {
      throw new HttpException(
        `Failed to update profile visibility: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get profiles by order range
  @Get('order/range')
  async findProfilesByOrderRange(
    @Query('min') min: string,
    @Query('max') max: string,
  ): Promise<Profile[]> {
    try {
      const minOrder = parseInt(min, 10);
      const maxOrder = parseInt(max, 10);

      if (isNaN(minOrder) || isNaN(maxOrder)) {
        throw new HttpException('Min and max order values must be numbers', HttpStatus.BAD_REQUEST);
      }

      if (minOrder > maxOrder) {
        throw new HttpException('Min order cannot be greater than max order', HttpStatus.BAD_REQUEST);
      }

      return await this.profilesService.findProfilesByOrderRange(minOrder, maxOrder);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch profiles by order range: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
