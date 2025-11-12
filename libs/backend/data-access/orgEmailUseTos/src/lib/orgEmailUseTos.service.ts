import { OrgEmailUseTo, Prisma } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function hasErrorCode(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

@Injectable()
export class OrgEmailUseTosService {
  constructor(private readonly prisma: PrismaClientService) {}

  /**
   * Creates a new organization email use to
   */
  async create(data: Prisma.OrgEmailUseToCreateInput): Promise<OrgEmailUseTo> {
    try {
      return await this.prisma.orgEmailUseTo.create({
        data,
        include: {
          emailOrg: {
            include: {
              org: true,
            },
          },
        },
      });
    } catch (error) {
      if (hasErrorCode(error) && error.code === 'P2002') {
        throw new ConflictException('Use to configuration already exists for this email');
      }
      throw new BadRequestException(`Failed to create organization email use to: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Creates multiple organization email use tos in a transaction
   */
  async createMany(data: Prisma.OrgEmailUseToCreateInput[]): Promise<OrgEmailUseTo[]> {
    try {
      const results = await this.prisma.$transaction(
        data.map(useToData =>
          this.prisma.orgEmailUseTo.create({
            data: useToData,
            include: {
              emailOrg: {
                include: {
                  org: true,
                },
              },
            },
          })
        )
      );
      return results;
    } catch (error) {
      throw new BadRequestException(`Failed to create organization email use tos: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Finds all organization email use tos with optional filters
   */
  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.OrgEmailUseToWhereUniqueInput;
    where?: Prisma.OrgEmailUseToWhereInput;
    orderBy?: Prisma.OrgEmailUseToOrderByWithRelationInput;
    includeDeleted?: boolean;
  }): Promise<OrgEmailUseTo[]> {
    const { skip, take, cursor, where, orderBy, includeDeleted = false } = params || {};

    const whereClause = includeDeleted
      ? where
      : { ...where, isDeleted: 0 };

    return this.prisma.orgEmailUseTo.findMany({
      skip,
      take,
      cursor,
      where: whereClause,
      orderBy,
      include: {
        emailOrg: {
          include: {
            org: true,
          },
        },
      },
    });
  }

  /**
   * Finds organization email use tos by email organization ID
   */
  async findByEmailOrg(emailOrgId: number, includeDeleted = false): Promise<OrgEmailUseTo[]> {
    const whereClause = includeDeleted
      ? { emailOrgId }
      : { emailOrgId, isDeleted: 0 };

    return this.prisma.orgEmailUseTo.findMany({
      where: whereClause,
      include: {
        emailOrg: {
          include: {
            org: true,
          },
        },
      },
      orderBy: { useTo: 'asc' },
    });
  }

  /**
   * Finds organization email use tos by use to pattern (search)
   */
  async findByUseToPattern(pattern: string, includeDeleted = false): Promise<OrgEmailUseTo[]> {
    const whereClause = includeDeleted
      ? {
          useTo: {
            contains: pattern,
            mode: 'insensitive' as Prisma.QueryMode,
          },
        }
      : {
          useTo: {
            contains: pattern,
            mode: 'insensitive' as Prisma.QueryMode,
          },
          isDeleted: 0,
        };

    return this.prisma.orgEmailUseTo.findMany({
      where: whereClause,
      include: {
        emailOrg: {
          include: {
            org: true,
          },
        },
      },
      orderBy: { useTo: 'asc' },
    });
  }

  /**
   * Finds active organization email use tos
   */
  async findActive(includeDeleted = false): Promise<OrgEmailUseTo[]> {
    const whereClause = includeDeleted
      ? { isActiv: true }
      : { isActiv: true, isDeleted: 0 };

    return this.prisma.orgEmailUseTo.findMany({
      where: whereClause,
      include: {
        emailOrg: {
          include: {
            org: true,
          },
        },
      },
      orderBy: { useTo: 'asc' },
    });
  }

  /**
   * Finds inactive organization email use tos
   */
  async findInactive(includeDeleted = false): Promise<OrgEmailUseTo[]> {
    const whereClause = includeDeleted
      ? { isActiv: false }
      : { isActiv: false, isDeleted: 0 };

    return this.prisma.orgEmailUseTo.findMany({
      where: whereClause,
      include: {
        emailOrg: {
          include: {
            org: true,
          },
        },
      },
      orderBy: { useTo: 'asc' },
    });
  }

  /**
   * Finds organization email use tos by organization ID (through email)
   */
  async findByOrganization(orgId: string, includeDeleted = false): Promise<OrgEmailUseTo[]> {
    const whereClause = includeDeleted
      ? {
          emailOrg: {
            orgId,
          },
        }
      : {
          emailOrg: {
            orgId,
          },
          isDeleted: 0,
        };

    return this.prisma.orgEmailUseTo.findMany({
      where: whereClause,
      include: {
        emailOrg: {
          include: {
            org: true,
          },
        },
      },
      orderBy: { useTo: 'asc' },
    });
  }

  /**
   * Finds a unique organization email use to by ID
   */
  async findOne(id: number, includeDeleted = false): Promise<OrgEmailUseTo | null> {
    const whereClause = includeDeleted
      ? { id }
      : { id, isDeleted: 0 };

    return this.prisma.orgEmailUseTo.findFirst({
      where: whereClause,
      include: {
        emailOrg: {
          include: {
            org: true,
          },
        },
      },
    });
  }

  /**
   * Finds a unique organization email use to by ID or throws exception
   */
  async findOneOrThrow(id: number, includeDeleted = false): Promise<OrgEmailUseTo> {
    const orgEmailUseTo = await this.findOne(id, includeDeleted);
    if (!orgEmailUseTo) {
      throw new NotFoundException(`Organization email use to with ID ${id} not found`);
    }
    return orgEmailUseTo;
  }

  /**
   * Updates an organization email use to
   */
  async update(id: number, data: Prisma.OrgEmailUseToUpdateInput): Promise<OrgEmailUseTo> {
    try {
      await this.findOneOrThrow(id);

      return await this.prisma.orgEmailUseTo.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          emailOrg: {
            include: {
              org: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (hasErrorCode(error) && error.code === 'P2002') {
        throw new ConflictException('Use to configuration already exists for this email');
      }
      throw new BadRequestException(`Failed to update organization email use to: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Soft deletes an organization email use to
   */
  async remove(id: number): Promise<OrgEmailUseTo> {
    await this.findOneOrThrow(id);

    return this.prisma.orgEmailUseTo.update({
      where: { id },
      data: {
        isDeleted: 1,
        isDeletedDT: new Date(),
        updatedAt: new Date(),
      },
      include: {
        emailOrg: {
          include: {
            org: true,
          },
        },
      },
    });
  }

  /**
   * Restores a soft-deleted organization email use to
   */
  async restore(id: number): Promise<OrgEmailUseTo> {
    const orgEmailUseTo = await this.findOne(id, true);
    if (!orgEmailUseTo) {
      throw new NotFoundException(`Organization email use to with ID ${id} not found`);
    }

    if (orgEmailUseTo.isDeleted === 0) {
      throw new BadRequestException('Organization email use to is not deleted');
    }

    return this.prisma.orgEmailUseTo.update({
      where: { id },
      data: {
        isDeleted: 0,
        isDeletedDT: null,
        updatedAt: new Date(),
      },
      include: {
        emailOrg: {
          include: {
            org: true,
          },
        },
      },
    });
  }

  /**
   * Permanently deletes an organization email use to
   */
  async hardDelete(id: number): Promise<void> {
    await this.findOneOrThrow(id, true);

    await this.prisma.orgEmailUseTo.delete({
      where: { id },
    });
  }

  /**
   * Toggles the published status of an organization email use to
   */
  async togglePublished(id: number): Promise<OrgEmailUseTo> {
    const orgEmailUseTo = await this.findOneOrThrow(id);

    return this.prisma.orgEmailUseTo.update({
      where: { id },
      data: {
        published: !orgEmailUseTo.published,
        updatedAt: new Date(),
      },
      include: {
        emailOrg: {
          include: {
            org: true,
          },
        },
      },
    });
  }

  /**
   * Toggles the public visibility of an organization email use to
   */
  async togglePublic(id: number): Promise<OrgEmailUseTo> {
    const orgEmailUseTo = await this.findOneOrThrow(id);

    return this.prisma.orgEmailUseTo.update({
      where: { id },
      data: {
        isPublic: !orgEmailUseTo.isPublic,
        updatedAt: new Date(),
      },
      include: {
        emailOrg: {
          include: {
            org: true,
          },
        },
      },
    });
  }

  /**
   * Toggles the active status of an organization email use to
   */
  async toggleActive(id: number): Promise<OrgEmailUseTo> {
    const orgEmailUseTo = await this.findOneOrThrow(id);

    return this.prisma.orgEmailUseTo.update({
      where: { id },
      data: {
        isActiv: !orgEmailUseTo.isActiv,
        updatedAt: new Date(),
      },
      include: {
        emailOrg: {
          include: {
            org: true,
          },
        },
      },
    });
  }

  /**
   * Gets count of organization email use tos with optional filters
   */
  async count(where?: Prisma.OrgEmailUseToWhereInput, includeDeleted = false): Promise<number> {
    const whereClause = includeDeleted
      ? where
      : { ...where, isDeleted: 0 };

    return this.prisma.orgEmailUseTo.count({
      where: whereClause,
    });
  }

  /**
   * Gets organization email use to statistics
   */
  async getStatistics(): Promise<{
    total: number;
    published: number;
    deleted: number;
    public: number;
    private: number;
    active: number;
    inactive: number;
    byEmailOrg: Array<{ emailOrgId: number; count: number; email?: string }>;
    byUseTo: Array<{ useTo: string; count: number }>;
    byOrganization: Array<{ orgId: string; count: number; orgName?: string }>;
  }> {
    const [
      total,
      published,
      deleted,
      publicUseTos,
      privateUseTos,
      active,
      inactive,
      byEmailOrg,
      byUseTo,
    ] = await Promise.all([
      this.prisma.orgEmailUseTo.count(),
      this.prisma.orgEmailUseTo.count({ where: { published: true, isDeleted: 0 } }),
      this.prisma.orgEmailUseTo.count({ where: { isDeleted: { gt: 0 } } }),
      this.prisma.orgEmailUseTo.count({ where: { isPublic: true, isDeleted: 0 } }),
      this.prisma.orgEmailUseTo.count({ where: { isPublic: false, isDeleted: 0 } }),
      this.prisma.orgEmailUseTo.count({ where: { isActiv: true, isDeleted: 0 } }),
      this.prisma.orgEmailUseTo.count({ where: { isActiv: false, isDeleted: 0 } }),
      this.prisma.orgEmailUseTo.groupBy({
        by: ['emailOrgId'],
        _count: { id: true },
        where: { isDeleted: 0 },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.orgEmailUseTo.groupBy({
        by: ['useTo'],
        _count: { id: true },
        where: { isDeleted: 0 },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    // Get email information for the statistics
    const emailOrgIds = byEmailOrg.map(item => item.emailOrgId);
    const emailOrgs = await this.prisma.orgEmail.findMany({
      where: { id: { in: emailOrgIds } },
      include: {
        org: {
          select: { id: true, name: true }
        }
      },
    });

    const emailOrgMap = new Map(emailOrgs.map(email => [email.id, email]));

    // Group by organization
    const orgGrouping = new Map<string, number>();
    emailOrgs.forEach(email => {
      const currentCount = orgGrouping.get(email.orgId) || 0;
      const useToCount = byEmailOrg.find(item => item.emailOrgId === email.id)?._count.id || 0;
      orgGrouping.set(email.orgId, currentCount + useToCount);
    });

    const byOrganization = Array.from(orgGrouping.entries()).map(([orgId, count]) => {
      const org = emailOrgs.find(email => email.orgId === orgId)?.org;
      return {
        orgId,
        count,
        orgName: org?.name,
      };
    }).sort((a, b) => b.count - a.count);

    return {
      total,
      published,
      deleted,
      public: publicUseTos,
      private: privateUseTos,
      active,
      inactive,
      byEmailOrg: byEmailOrg.map(item => ({
        emailOrgId: item.emailOrgId,
        count: item._count.id,
        email: emailOrgMap.get(item.emailOrgId)?.email,
      })),
      byUseTo: byUseTo.map(item => ({
        useTo: item.useTo,
        count: item._count.id,
      })),
      byOrganization,
    };
  }

  /**
   * Bulk update organization email use tos
   */
  async bulkUpdate(
    where: Prisma.OrgEmailUseToWhereInput,
    data: Prisma.OrgEmailUseToUpdateInput
  ): Promise<{ count: number }> {
    const result = await this.prisma.orgEmailUseTo.updateMany({
      where: { ...where, isDeleted: 0 },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return { count: result.count };
  }

  /**
   * Bulk soft delete organization email use tos
   */
  async bulkDelete(where: Prisma.OrgEmailUseToWhereInput): Promise<{ count: number }> {
    const result = await this.prisma.orgEmailUseTo.updateMany({
      where: { ...where, isDeleted: 0 },
      data: {
        isDeleted: 1,
        isDeletedDT: new Date(),
        updatedAt: new Date(),
      },
    });

    return { count: result.count };
  }

  /**
   * Bulk activate organization email use tos
   */
  async bulkActivate(where: Prisma.OrgEmailUseToWhereInput): Promise<{ count: number }> {
    const result = await this.prisma.orgEmailUseTo.updateMany({
      where: { ...where, isDeleted: 0 },
      data: {
        isActiv: true,
        updatedAt: new Date(),
      },
    });

    return { count: result.count };
  }

  /**
   * Bulk deactivate organization email use tos
   */
  async bulkDeactivate(where: Prisma.OrgEmailUseToWhereInput): Promise<{ count: number }> {
    const result = await this.prisma.orgEmailUseTo.updateMany({
      where: { ...where, isDeleted: 0 },
      data: {
        isActiv: false,
        updatedAt: new Date(),
      },
    });

    return { count: result.count };
  }

  /**
   * Gets published organization email use tos for a specific email
   */
  async getPublishedByEmailOrg(emailOrgId: number): Promise<OrgEmailUseTo[]> {
    return this.prisma.orgEmailUseTo.findMany({
      where: {
        emailOrgId,
        published: true,
        isDeleted: 0,
      },
      include: {
        emailOrg: {
          include: {
            org: true,
          },
        },
      },
      orderBy: { useTo: 'asc' },
    });
  }

  /**
   * Gets public organization email use tos
   */
  async getPublicUseTos(): Promise<OrgEmailUseTo[]> {
    return this.prisma.orgEmailUseTo.findMany({
      where: {
        isPublic: true,
        published: true,
        isDeleted: 0,
      },
      include: {
        emailOrg: {
          include: {
            org: true,
          },
        },
      },
      orderBy: { useTo: 'asc' },
    });
  }

  /**
   * Gets all unique use to values
   */
  async getUniqueUseTos(): Promise<string[]> {
    const result = await this.prisma.orgEmailUseTo.findMany({
      where: { isDeleted: 0 },
      select: { useTo: true },
      distinct: ['useTo'],
      orderBy: { useTo: 'asc' },
    });

    return result.map(item => item.useTo);
  }

  /**
   * Validates use to data and email organization existence
   */
  async validateUseToData(
    useTo: string,
    emailOrgId: number
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic use to validation
    if (!useTo || useTo.trim().length === 0) {
      errors.push('Use to cannot be empty');
    }

    if (useTo && useTo.length > 100) {
      errors.push('Use to must be less than 100 characters');
    }

    // Check if email organization exists
    const emailOrgExists = await this.prisma.orgEmail.findFirst({
      where: { id: emailOrgId, isDeleted: 0 },
    });

    if (!emailOrgExists) {
      errors.push('Email organization does not exist');
    }

    // Check for duplicate use to for the same email organization
    const existingUseTo = await this.prisma.orgEmailUseTo.findFirst({
      where: {
        useTo: useTo.trim(),
        emailOrgId,
        isDeleted: 0,
      },
    });

    if (existingUseTo) {
      errors.push('Use to already exists for this email organization');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
