import { ConfigParam, Prisma } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { Injectable } from '@nestjs/common';

// Helper function for type-safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Injectable()
export class ConfigParamsService {
  constructor(private readonly prisma: PrismaClientService) {}

  // Create a new config parameter
  async create(data: Prisma.ConfigParamCreateInput): Promise<ConfigParam> {
    try {
      return await this.prisma.configParam.create({
        data,
      });
    } catch (error) {
      throw new Error(`Failed to create config parameter: ${getErrorMessage(error)}`);
    }
  }

  // Find all config parameters with optional filtering and pagination
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ConfigParamWhereUniqueInput;
    where?: Prisma.ConfigParamWhereInput;
    orderBy?: Prisma.ConfigParamOrderByWithRelationInput;
    includeDeleted?: boolean;
  }): Promise<ConfigParam[]> {
    try {
      const { skip, take, cursor, where = {}, orderBy, includeDeleted = false } = params;

      // Add soft delete filter unless explicitly including deleted
      if (!includeDeleted) {
        where.isDeleted = 0;
      }

      return await this.prisma.configParam.findMany({
        skip,
        take,
        cursor,
        where,
        orderBy: orderBy || { createdAt: 'desc' },
      });
    } catch (error) {
      throw new Error(`Failed to fetch config parameters: ${getErrorMessage(error)}`);
    }
  }

  // Find a config parameter by ID
  async findOne(id: number, includeDeleted = false): Promise<ConfigParam | null> {
    try {
      const where: Prisma.ConfigParamWhereInput = { id };
      if (!includeDeleted) {
        where.isDeleted = 0;
      }

      return await this.prisma.configParam.findFirst({
        where,
      });
    } catch (error) {
      throw new Error(`Failed to fetch config parameter: ${getErrorMessage(error)}`);
    }
  }

  // Find a config parameter by name (unique field)
  async findByName(name: string, includeDeleted = false): Promise<ConfigParam | null> {
    try {
      const where: Prisma.ConfigParamWhereInput = { name };
      if (!includeDeleted) {
        where.isDeleted = 0;
      }

      return await this.prisma.configParam.findFirst({
        where,
      });
    } catch (error) {
      throw new Error(`Failed to fetch config parameter by name: ${getErrorMessage(error)}`);
    }
  }

  // Update a config parameter
  async update(id: number, data: Prisma.ConfigParamUpdateInput): Promise<ConfigParam> {
    try {
      // Check if parameter exists and is not deleted
      const existing = await this.findOne(id);
      if (!existing) {
        throw new Error('Config parameter not found or is deleted');
      }

      return await this.prisma.configParam.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(`Failed to update config parameter: ${getErrorMessage(error)}`);
    }
  }

  // Soft delete a config parameter
  async remove(id: number): Promise<ConfigParam> {
    try {
      const existing = await this.findOne(id);
      if (!existing) {
        throw new Error('Config parameter not found or already deleted');
      }

      return await this.prisma.configParam.update({
        where: { id },
        data: {
          isDeleted: 1,
          isDeletedDT: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(`Failed to delete config parameter: ${getErrorMessage(error)}`);
    }
  }

  // Hard delete a config parameter (permanent removal)
  async hardDelete(id: number): Promise<ConfigParam> {
    try {
      return await this.prisma.configParam.delete({
        where: { id },
      });
    } catch (error) {
      throw new Error(`Failed to permanently delete config parameter: ${getErrorMessage(error)}`);
    }
  }

  // Restore a soft deleted config parameter
  async restore(id: number): Promise<ConfigParam> {
    try {
      const existing = await this.findOne(id, true);
      if (!existing) {
        throw new Error('Config parameter not found');
      }

      if (existing.isDeleted === 0) {
        throw new Error('Config parameter is not deleted');
      }

      return await this.prisma.configParam.update({
        where: { id },
        data: {
          isDeleted: 0,
          isDeletedDT: null,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(`Failed to restore config parameter: ${getErrorMessage(error)}`);
    }
  }

  // Get parameter value by name (convenience method)
  async getValue(name: string): Promise<string | null> {
    try {
      const param = await this.findByName(name);
      return param?.value || null;
    } catch (error) {
      throw new Error(`Failed to get parameter value: ${getErrorMessage(error)}`);
    }
  }

  // Set parameter value by name (convenience method)
  async setValue(name: string, value: string, utility = ''): Promise<ConfigParam> {
    try {
      const existing = await this.findByName(name);

      if (existing) {
        return await this.update(existing.id, { value, utility });
      } else {
        return await this.create({ name, value, utility });
      }
    } catch (error) {
      throw new Error(`Failed to set parameter value: ${getErrorMessage(error)}`);
    }
  }

  // Find published config parameters
  async findPublished(): Promise<ConfigParam[]> {
    try {
      return await this.findAll({
        where: { published: true },
      });
    } catch (error) {
      throw new Error(`Failed to fetch published config parameters: ${getErrorMessage(error)}`);
    }
  }

  // Find public config parameters
  async findPublic(): Promise<ConfigParam[]> {
    try {
      return await this.findAll({
        where: { isPublic: true },
      });
    } catch (error) {
      throw new Error(`Failed to fetch public config parameters: ${getErrorMessage(error)}`);
    }
  }

  // Search config parameters by name or utility
  async search(query: string): Promise<ConfigParam[]> {
    try {
      return await this.findAll({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { utility: { contains: query, mode: 'insensitive' } },
          ],
        },
      });
    } catch (error) {
      throw new Error(`Failed to search config parameters: ${getErrorMessage(error)}`);
    }
  }

  // Get config parameters by utility
  async findByUtility(utility: string): Promise<ConfigParam[]> {
    try {
      return await this.findAll({
        where: { utility },
      });
    } catch (error) {
      throw new Error(`Failed to fetch config parameters by utility: ${getErrorMessage(error)}`);
    }
  }

  // Toggle published status
  async togglePublished(id: number): Promise<ConfigParam> {
    try {
      const existing = await this.findOne(id);
      if (!existing) {
        throw new Error('Config parameter not found');
      }

      return await this.update(id, {
        published: !existing.published,
      });
    } catch (error) {
      throw new Error(`Failed to toggle published status: ${getErrorMessage(error)}`);
    }
  }

  // Toggle public status
  async togglePublic(id: number): Promise<ConfigParam> {
    try {
      const existing = await this.findOne(id);
      if (!existing) {
        throw new Error('Config parameter not found');
      }

      return await this.update(id, {
        isPublic: !existing.isPublic,
      });
    } catch (error) {
      throw new Error(`Failed to toggle public status: ${getErrorMessage(error)}`);
    }
  }

  // Get config parameters statistics
  async getStats(): Promise<{
    total: number;
    published: number;
    public: number;
    deleted: number;
    utilities: { utility: string; count: number }[];
  }> {
    try {
      const [total, published, publicParams, deleted, utilitiesResult] = await Promise.all([
        this.prisma.configParam.count({ where: { isDeleted: 0 } }),
        this.prisma.configParam.count({ where: { isDeleted: 0, published: true } }),
        this.prisma.configParam.count({ where: { isDeleted: 0, isPublic: true } }),
        this.prisma.configParam.count({ where: { isDeleted: 1 } }),
        this.prisma.configParam.groupBy({
          by: ['utility'],
          where: { isDeleted: 0 },
          _count: { utility: true },
          orderBy: { _count: { utility: 'desc' } },
        }),
      ]);

      const utilities = utilitiesResult.map(item => ({
        utility: item.utility,
        count: item._count.utility,
      }));

      return {
        total,
        published,
        public: publicParams,
        deleted,
        utilities,
      };
    } catch (error) {
      throw new Error(`Failed to get config parameters statistics: ${getErrorMessage(error)}`);
    }
  }

  // Bulk update config parameters
  async bulkUpdate(updates: { id: number; data: Prisma.ConfigParamUpdateInput }[]): Promise<ConfigParam[]> {
    try {
      const results = await Promise.all(
        updates.map(({ id, data }) => this.update(id, data))
      );
      return results;
    } catch (error) {
      throw new Error(`Failed to bulk update config parameters: ${getErrorMessage(error)}`);
    }
  }

  // Get config parameters as key-value pairs
  async getAsKeyValuePairs(utility?: string): Promise<Record<string, string>> {
    try {
      const where: Prisma.ConfigParamWhereInput = {};
      if (utility) {
        where.utility = utility;
      }

      const params = await this.findAll({ where });

      return params.reduce((acc, param) => {
        acc[param.name] = param.value;
        return acc;
      }, {} as Record<string, string>);
    } catch (error) {
      throw new Error(`Failed to get config parameters as key-value pairs: ${getErrorMessage(error)}`);
    }
  }
}
