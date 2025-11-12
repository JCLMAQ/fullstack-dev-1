import { Group, Prisma } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

// Helper function for type-safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaClientService) {}

  // Create a new group
  async create(data: Prisma.GroupCreateInput): Promise<Group> {
    try {
      return await this.prisma.group.create({
        data,
        include: {
          org: true,
          Users: true,
          Tasks: true,
          Todos: true,
          Posts: true,
          Files: true,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to create group: ${getErrorMessage(error)}`);
    }
  }

  // Find all groups with optional filters
  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.GroupWhereInput;
    orderBy?: { [key: string]: 'asc' | 'desc' };
    include?: Prisma.GroupInclude;
  }): Promise<Group[]> {
    const { skip, take, where, orderBy, include } = params || {};

    try {
      return await this.prisma.group.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { orderGroup: 'asc' },
        include: include || {
          org: true,
          Users: true,
          _count: {
            select: {
              Users: true,
              Tasks: true,
              Todos: true,
              Posts: true,
              Files: true,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch groups: ${getErrorMessage(error)}`);
    }
  }

  // Find group by ID
  async findOne(id: number): Promise<Group> {
    try {
      const group = await this.prisma.group.findUnique({
        where: { id },
        include: {
          org: true,
          Users: true,
          Tasks: true,
          Todos: true,
          Posts: true,
          Files: true,
        },
      });

      if (!group) {
        throw new NotFoundException(`Group with ID ${id} not found`);
      }

      return group;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch group: ${getErrorMessage(error)}`);
    }
  }

  // Update group
  async update(id: number, data: Prisma.GroupUpdateInput): Promise<Group> {
    try {
      const existingGroup = await this.prisma.group.findUnique({
        where: { id },
      });

      if (!existingGroup) {
        throw new NotFoundException(`Group with ID ${id} not found`);
      }

      return await this.prisma.group.update({
        where: { id },
        data,
        include: {
          org: true,
          Users: true,
          Tasks: true,
          Todos: true,
          Posts: true,
          Files: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update group: ${getErrorMessage(error)}`);
    }
  }

  // Delete group (soft delete)
  async remove(id: number): Promise<Group> {
    try {
      const existingGroup = await this.prisma.group.findUnique({
        where: { id },
      });

      if (!existingGroup) {
        throw new NotFoundException(`Group with ID ${id} not found`);
      }

      return await this.prisma.group.update({
        where: { id },
        data: {
          isDeleted: 1,
          isDeletedDT: new Date(),
          published: false,
        },
        include: {
          org: true,
          Users: true,
          Tasks: true,
          Todos: true,
          Posts: true,
          Files: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete group: ${getErrorMessage(error)}`);
    }
  }

  // Find groups by organization
  async findByOrganization(orgId: string): Promise<Group[]> {
    try {
      return await this.prisma.group.findMany({
        where: {
          orgId,
          isDeleted: 0,
        },
        orderBy: { orderGroup: 'asc' },
        include: {
          org: true,
          Users: true,
          _count: {
            select: {
              Users: true,
              Tasks: true,
              Todos: true,
              Posts: true,
              Files: true,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch groups for organization: ${getErrorMessage(error)}`);
    }
  }

  // Find public groups
  async findPublicGroups(): Promise<Group[]> {
    try {
      return await this.prisma.group.findMany({
        where: {
          isPublic: true,
          published: true,
          isDeleted: 0,
        },
        orderBy: { orderGroup: 'asc' },
        include: {
          org: true,
          _count: {
            select: {
              Users: true,
              Tasks: true,
              Todos: true,
              Posts: true,
              Files: true,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch public groups: ${getErrorMessage(error)}`);
    }
  }

  // Add user to group
  async addUserToGroup(groupId: number, userId: string): Promise<Group> {
    try {
      const group = await this.prisma.group.findUnique({
        where: { id: groupId },
        include: { Users: true },
      });

      if (!group) {
        throw new NotFoundException(`Group with ID ${groupId} not found`);
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if user is already in the group
      const isUserInGroup = group.Users.some((u: { id: string }) => u.id === userId);
      if (isUserInGroup) {
        throw new BadRequestException(`User is already a member of this group`);
      }

      return await this.prisma.group.update({
        where: { id: groupId },
        data: {
          Users: {
            connect: { id: userId },
          },
        },
        include: {
          org: true,
          Users: true,
          Tasks: true,
          Todos: true,
          Posts: true,
          Files: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to add user to group: ${getErrorMessage(error)}`);
    }
  }

  // Remove user from group
  async removeUserFromGroup(groupId: number, userId: string): Promise<Group> {
    try {
      const group = await this.prisma.group.findUnique({
        where: { id: groupId },
        include: { Users: true },
      });

      if (!group) {
        throw new NotFoundException(`Group with ID ${groupId} not found`);
      }

      // Check if user is in the group
      const isUserInGroup = group.Users.some((u: { id: string }) => u.id === userId);
      if (!isUserInGroup) {
        throw new BadRequestException(`User is not a member of this group`);
      }

      return await this.prisma.group.update({
        where: { id: groupId },
        data: {
          Users: {
            disconnect: { id: userId },
          },
        },
        include: {
          org: true,
          Users: true,
          Tasks: true,
          Todos: true,
          Posts: true,
          Files: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to remove user from group: ${getErrorMessage(error)}`);
    }
  }

  // Search groups by name or description
  async searchGroups(searchTerm: string): Promise<Group[]> {
    try {
      return await this.prisma.group.findMany({
        where: {
          AND: [
            { isDeleted: 0 },
            { published: true },
            {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          ],
        },
        orderBy: { orderGroup: 'asc' },
        include: {
          org: true,
          _count: {
            select: {
              Users: true,
              Tasks: true,
              Todos: true,
              Posts: true,
              Files: true,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to search groups: ${getErrorMessage(error)}`);
    }
  }

  // Update group order
  async updateGroupOrder(id: number, newOrder: number): Promise<Group> {
    try {
      const existingGroup = await this.prisma.group.findUnique({
        where: { id },
      });

      if (!existingGroup) {
        throw new NotFoundException(`Group with ID ${id} not found`);
      }

      return await this.prisma.group.update({
        where: { id },
        data: { orderGroup: newOrder },
        include: {
          org: true,
          Users: true,
          Tasks: true,
          Todos: true,
          Posts: true,
          Files: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update group order: ${getErrorMessage(error)}`);
    }
  }
}
