import { OrgEmail, Prisma } from '@db/prisma';
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
export class OrgEmailsService {
  constructor(private readonly prisma: PrismaClientService) {}

  /**
   * Creates a new organization email
   */
  async create(data: Prisma.OrgEmailCreateInput): Promise<OrgEmail> {
    try {
      return await this.prisma.orgEmail.create({
        data,
        include: {
          org: true,
          OrgEmailUseTos: true,
        },
      });
    } catch (error) {
      if (hasErrorCode(error) && error.code === 'P2002') {
        throw new ConflictException('Email already exists for this organization');
      }
      throw new BadRequestException(`Failed to create organization email: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Creates multiple organization emails in a transaction
   */
  async createMany(data: Prisma.OrgEmailCreateInput[]): Promise<OrgEmail[]> {
    try {
      const results = await this.prisma.$transaction(
        data.map(emailData =>
          this.prisma.orgEmail.create({
            data: emailData,
            include: {
              org: true,
              OrgEmailUseTos: true,
            },
          })
        )
      );
      return results;
    } catch (error) {
      throw new BadRequestException(`Failed to create organization emails: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Finds all organization emails with optional filters
   */
  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.OrgEmailWhereUniqueInput;
    where?: Prisma.OrgEmailWhereInput;
    orderBy?: Prisma.OrgEmailOrderByWithRelationInput;
    includeDeleted?: boolean;
  }): Promise<OrgEmail[]> {
    const { skip, take, cursor, where, orderBy, includeDeleted = false } = params || {};

    const whereClause = includeDeleted
      ? where
      : { ...where, isDeleted: 0 };

    return this.prisma.orgEmail.findMany({
      skip,
      take,
      cursor,
      where: whereClause,
      orderBy,
      include: {
        org: true,
        OrgEmailUseTos: true,
      },
    });
  }

  /**
   * Finds organization emails by organization ID
   */
  async findByOrganization(orgId: string, includeDeleted = false): Promise<OrgEmail[]> {
    const whereClause = includeDeleted
      ? { orgId }
      : { orgId, isDeleted: 0 };

    return this.prisma.orgEmail.findMany({
      where: whereClause,
      include: {
        org: true,
        OrgEmailUseTos: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Finds organization emails by email pattern (search)
   */
  async findByEmailPattern(pattern: string, includeDeleted = false): Promise<OrgEmail[]> {
    const whereClause = includeDeleted
      ? {
          email: {
            contains: pattern,
            mode: 'insensitive' as Prisma.QueryMode,
          },
        }
      : {
          email: {
            contains: pattern,
            mode: 'insensitive' as Prisma.QueryMode,
          },
          isDeleted: 0,
        };

    return this.prisma.orgEmail.findMany({
      where: whereClause,
      include: {
        org: true,
        OrgEmailUseTos: true,
      },
      orderBy: { email: 'asc' },
    });
  }

  /**
   * Finds a unique organization email by ID
   */
  async findOne(id: number, includeDeleted = false): Promise<OrgEmail | null> {
    const whereClause = includeDeleted
      ? { id }
      : { id, isDeleted: 0 };

    return this.prisma.orgEmail.findFirst({
      where: whereClause,
      include: {
        org: true,
        OrgEmailUseTos: true,
      },
    });
  }

  /**
   * Finds a unique organization email by ID or throws exception
   */
  async findOneOrThrow(id: number, includeDeleted = false): Promise<OrgEmail> {
    const orgEmail = await this.findOne(id, includeDeleted);
    if (!orgEmail) {
      throw new NotFoundException(`Organization email with ID ${id} not found`);
    }
    return orgEmail;
  }

  /**
   * Updates an organization email
   */
  async update(id: number, data: Prisma.OrgEmailUpdateInput): Promise<OrgEmail> {
    try {
      await this.findOneOrThrow(id);

      return await this.prisma.orgEmail.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          org: true,
          OrgEmailUseTos: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (hasErrorCode(error) && error.code === 'P2002') {
        throw new ConflictException('Email already exists for this organization');
      }
      throw new BadRequestException(`Failed to update organization email: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Soft deletes an organization email
   */
  async remove(id: number): Promise<OrgEmail> {
    await this.findOneOrThrow(id);

    return this.prisma.orgEmail.update({
      where: { id },
      data: {
        isDeleted: 1,
        isDeletedDT: new Date(),
        updatedAt: new Date(),
      },
      include: {
        org: true,
        OrgEmailUseTos: true,
      },
    });
  }

  /**
   * Restores a soft-deleted organization email
   */
  async restore(id: number): Promise<OrgEmail> {
    const orgEmail = await this.findOne(id, true);
    if (!orgEmail) {
      throw new NotFoundException(`Organization email with ID ${id} not found`);
    }

    if (orgEmail.isDeleted === 0) {
      throw new BadRequestException('Organization email is not deleted');
    }

    return this.prisma.orgEmail.update({
      where: { id },
      data: {
        isDeleted: 0,
        isDeletedDT: null,
        updatedAt: new Date(),
      },
      include: {
        org: true,
        OrgEmailUseTos: true,
      },
    });
  }

  /**
   * Permanently deletes an organization email
   */
  async hardDelete(id: number): Promise<void> {
    await this.findOneOrThrow(id, true);

    await this.prisma.orgEmail.delete({
      where: { id },
    });
  }

  /**
   * Toggles the published status of an organization email
   */
  async togglePublished(id: number): Promise<OrgEmail> {
    const orgEmail = await this.findOneOrThrow(id);

    return this.prisma.orgEmail.update({
      where: { id },
      data: {
        published: !orgEmail.published,
        updatedAt: new Date(),
      },
      include: {
        org: true,
        OrgEmailUseTos: true,
      },
    });
  }

  /**
   * Toggles the public visibility of an organization email
   */
  async togglePublic(id: number): Promise<OrgEmail> {
    const orgEmail = await this.findOneOrThrow(id);

    return this.prisma.orgEmail.update({
      where: { id },
      data: {
        isPublic: !orgEmail.isPublic,
        updatedAt: new Date(),
      },
      include: {
        org: true,
        OrgEmailUseTos: true,
      },
    });
  }

  /**
   * Gets count of organization emails with optional filters
   */
  async count(where?: Prisma.OrgEmailWhereInput, includeDeleted = false): Promise<number> {
    const whereClause = includeDeleted
      ? where
      : { ...where, isDeleted: 0 };

    return this.prisma.orgEmail.count({
      where: whereClause,
    });
  }

  /**
   * Gets organization email statistics
   */
  async getStatistics(): Promise<{
    total: number;
    published: number;
    deleted: number;
    public: number;
    private: number;
    byOrganization: Array<{ orgId: string; count: number; orgName?: string }>;
  }> {
    const [
      total,
      published,
      deleted,
      publicEmails,
      privateEmails,
      byOrganization,
    ] = await Promise.all([
      this.prisma.orgEmail.count(),
      this.prisma.orgEmail.count({ where: { published: true, isDeleted: 0 } }),
      this.prisma.orgEmail.count({ where: { isDeleted: { gt: 0 } } }),
      this.prisma.orgEmail.count({ where: { isPublic: true, isDeleted: 0 } }),
      this.prisma.orgEmail.count({ where: { isPublic: false, isDeleted: 0 } }),
      this.prisma.orgEmail.groupBy({
        by: ['orgId'],
        _count: { id: true },
        where: { isDeleted: 0 },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    // Get organization names for the statistics
    const orgIds = byOrganization.map(item => item.orgId);
    const organizations = await this.prisma.organization.findMany({
      where: { id: { in: orgIds } },
      select: { id: true, name: true },
    });

    const orgMap = new Map(organizations.map(org => [org.id, org.name]));

    return {
      total,
      published,
      deleted,
      public: publicEmails,
      private: privateEmails,
      byOrganization: byOrganization.map(item => ({
        orgId: item.orgId,
        count: item._count.id,
        orgName: orgMap.get(item.orgId),
      })),
    };
  }

  /**
   * Bulk update organization emails
   */
  async bulkUpdate(
    where: Prisma.OrgEmailWhereInput,
    data: Prisma.OrgEmailUpdateInput
  ): Promise<{ count: number }> {
    const result = await this.prisma.orgEmail.updateMany({
      where: { ...where, isDeleted: 0 },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return { count: result.count };
  }

  /**
   * Bulk soft delete organization emails
   */
  async bulkDelete(where: Prisma.OrgEmailWhereInput): Promise<{ count: number }> {
    const result = await this.prisma.orgEmail.updateMany({
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
   * Gets published organization emails for a specific organization
   */
  async getPublishedByOrganization(orgId: string): Promise<OrgEmail[]> {
    return this.prisma.orgEmail.findMany({
      where: {
        orgId,
        published: true,
        isDeleted: 0,
      },
      include: {
        org: true,
        OrgEmailUseTos: true,
      },
      orderBy: { email: 'asc' },
    });
  }

  /**
   * Gets public organization emails
   */
  async getPublicEmails(): Promise<OrgEmail[]> {
    return this.prisma.orgEmail.findMany({
      where: {
        isPublic: true,
        published: true,
        isDeleted: 0,
      },
      include: {
        org: true,
        OrgEmailUseTos: true,
      },
      orderBy: { email: 'asc' },
    });
  }

  /**
   * Validates email format and organization existence
   */
  async validateEmailData(email: string, orgId: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }

    // Check if organization exists
    const orgExists = await this.prisma.organization.findFirst({
      where: { id: orgId, isDeleted: 0 },
    });

    if (!orgExists) {
      errors.push('Organization does not exist');
    }

    // Check for duplicate email in the same organization
    const existingEmail = await this.prisma.orgEmail.findFirst({
      where: {
        email,
        orgId,
        isDeleted: 0,
      },
    });

    if (existingEmail) {
      errors.push('Email already exists for this organization');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
