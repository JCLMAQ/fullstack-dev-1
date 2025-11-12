import { Group, Prisma } from '@db/prisma';
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
import { GroupsService } from './groups.service';

// Helper function for type-safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // Create a new group
  @Post()
  async create(@Body() createGroupDto: Prisma.GroupCreateInput): Promise<Group> {
    try {
      return await this.groupsService.create(createGroupDto);
    } catch (error) {
      throw new HttpException(
        `Failed to create group: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get all groups with optional filters
  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('orgId') orgId?: string,
    @Query('isPublic') isPublic?: string,
    @Query('published') published?: string,
  ): Promise<Group[]> {
    try {
      const where: Prisma.GroupWhereInput = {};

      if (orgId) where.orgId = orgId;
      if (isPublic !== undefined) where.isPublic = isPublic === 'true';
      if (published !== undefined) where.published = published === 'true';

      // Always exclude deleted items by default
      where.isDeleted = 0;

      return await this.groupsService.findAll({
        skip: skip ? parseInt(skip, 10) : undefined,
        take: take ? parseInt(take, 10) : undefined,
        where,
      });
    } catch (error) {
      throw new HttpException(
        `Failed to fetch groups: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get group by ID
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Group> {
    try {
      return await this.groupsService.findOne(id);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch group: ${getErrorMessage(error)}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  // Update group
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGroupDto: Prisma.GroupUpdateInput,
  ): Promise<Group> {
    try {
      return await this.groupsService.update(id, updateGroupDto);
    } catch (error) {
      throw new HttpException(
        `Failed to update group: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Delete group (soft delete)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Group> {
    try {
      return await this.groupsService.remove(id);
    } catch (error) {
      throw new HttpException(
        `Failed to delete group: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get groups by organization
  @Get('organization/:orgId')
  async findByOrganization(@Param('orgId') orgId: string): Promise<Group[]> {
    try {
      return await this.groupsService.findByOrganization(orgId);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch groups for organization: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get public groups
  @Get('public/list')
  async findPublicGroups(): Promise<Group[]> {
    try {
      return await this.groupsService.findPublicGroups();
    } catch (error) {
      throw new HttpException(
        `Failed to fetch public groups: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Add user to group
  @Post(':id/users/:userId')
  async addUserToGroup(
    @Param('id', ParseIntPipe) groupId: number,
    @Param('userId') userId: string,
  ): Promise<Group> {
    try {
      return await this.groupsService.addUserToGroup(groupId, userId);
    } catch (error) {
      throw new HttpException(
        `Failed to add user to group: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Remove user from group
  @Delete(':id/users/:userId')
  async removeUserFromGroup(
    @Param('id', ParseIntPipe) groupId: number,
    @Param('userId') userId: string,
  ): Promise<Group> {
    try {
      return await this.groupsService.removeUserFromGroup(groupId, userId);
    } catch (error) {
      throw new HttpException(
        `Failed to remove user from group: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Search groups
  @Get('search/query')
  async searchGroups(@Query('q') searchTerm: string): Promise<Group[]> {
    try {
      if (!searchTerm) {
        throw new HttpException('Search query is required', HttpStatus.BAD_REQUEST);
      }
      return await this.groupsService.searchGroups(searchTerm);
    } catch (error) {
      throw new HttpException(
        `Failed to search groups: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Update group order
  @Patch(':id/order')
  async updateGroupOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body('orderGroup') newOrder: number,
  ): Promise<Group> {
    try {
      if (typeof newOrder !== 'number') {
        throw new HttpException('Order must be a number', HttpStatus.BAD_REQUEST);
      }
      return await this.groupsService.updateGroupOrder(id, newOrder);
    } catch (error) {
      throw new HttpException(
        `Failed to update group order: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
