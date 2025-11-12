import { OrgDomain, Prisma } from '@db/prisma';
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
export class OrgDomainsService {
  constructor(private readonly prisma: PrismaClientService) {}

  /**
   * Creates a new organization domain
   */
  async create(data: Prisma.OrgDomainCreateInput): Promise<OrgDomain> {
    try {
      return await this.prisma.orgDomain.create({
        data,
        include: {
          org: true,
        },
      });
    } catch (error) {
      if (hasErrorCode(error) && error.code === 'P2002') {
        throw new ConflictException('Domain already exists for this organization');
      }
      throw new BadRequestException(`Failed to create organization domain: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Creates multiple organization domains in a transaction
   */
  async createMany(data: Prisma.OrgDomainCreateInput[]): Promise<OrgDomain[]> {
    try {
      const results = await this.prisma.$transaction(
        data.map(domainData =>
          this.prisma.orgDomain.create({
            data: domainData,
            include: {
              org: true,
            },
          })
        )
      );
      return results;
    } catch (error) {
      throw new BadRequestException(`Failed to create organization domains: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Finds all organization domains with optional filters
   */
  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.OrgDomainWhereUniqueInput;
    where?: Prisma.OrgDomainWhereInput;
    orderBy?: Prisma.OrgDomainOrderByWithRelationInput;
    includeDeleted?: boolean;
  }): Promise<OrgDomain[]> {
    const { skip, take, cursor, where, orderBy, includeDeleted = false } = params || {};

    const whereClause = includeDeleted
      ? where
      : { ...where, isDeleted: 0 };

    return this.prisma.orgDomain.findMany({
      skip,
      take,
      cursor,
      where: whereClause,
      orderBy,
      include: {
        org: true,
      },
    });
  }

  /**
   * Finds organization domains by organization ID
   */
  async findByOrganization(orgId: string, includeDeleted = false): Promise<OrgDomain[]> {
    const whereClause = includeDeleted
      ? { orgId }
      : { orgId, isDeleted: 0 };

    return this.prisma.orgDomain.findMany({
      where: whereClause,
      include: {
        org: true,
      },
      orderBy: { domainName: 'asc' },
    });
  }

  /**
   * Finds organization domains by domain name pattern (search)
   */
  async findByDomainPattern(pattern: string, includeDeleted = false): Promise<OrgDomain[]> {
    const whereClause = includeDeleted
      ? {
          domainName: {
            contains: pattern,
            mode: 'insensitive' as Prisma.QueryMode,
          },
        }
      : {
          domainName: {
            contains: pattern,
            mode: 'insensitive' as Prisma.QueryMode,
          },
          isDeleted: 0,
        };

    return this.prisma.orgDomain.findMany({
      where: whereClause,
      include: {
        org: true,
      },
      orderBy: { domainName: 'asc' },
    });
  }

  /**
   * Finds organization domains by extension
   */
  async findByExtension(extension: string, includeDeleted = false): Promise<OrgDomain[]> {
    const whereClause = includeDeleted
      ? { extension: extension.toLowerCase() }
      : { extension: extension.toLowerCase(), isDeleted: 0 };

    return this.prisma.orgDomain.findMany({
      where: whereClause,
      include: {
        org: true,
      },
      orderBy: { domainName: 'asc' },
    });
  }

  /**
   * Finds a unique organization domain by ID
   */
  async findOne(id: number, includeDeleted = false): Promise<OrgDomain | null> {
    const whereClause = includeDeleted
      ? { id }
      : { id, isDeleted: 0 };

    return this.prisma.orgDomain.findFirst({
      where: whereClause,
      include: {
        org: true,
      },
    });
  }

  /**
   * Finds a unique organization domain by ID or throws exception
   */
  async findOneOrThrow(id: number, includeDeleted = false): Promise<OrgDomain> {
    const orgDomain = await this.findOne(id, includeDeleted);
    if (!orgDomain) {
      throw new NotFoundException(`Organization domain with ID ${id} not found`);
    }
    return orgDomain;
  }

  /**
   * Finds organization domain by full domain (domainName + extension)
   */
  async findByFullDomain(fullDomain: string, includeDeleted = false): Promise<OrgDomain | null> {
    const parts = fullDomain.split('.');
    if (parts.length < 2) {
      throw new BadRequestException('Invalid domain format. Expected format: domain.extension');
    }

    const domainName = parts.slice(0, -1).join('.');
    const extension = parts[parts.length - 1];

    const whereClause = includeDeleted
      ? { domainName, extension }
      : { domainName, extension, isDeleted: 0 };

    return this.prisma.orgDomain.findFirst({
      where: whereClause,
      include: {
        org: true,
      },
    });
  }

  /**
   * Updates an organization domain
   */
  async update(id: number, data: Prisma.OrgDomainUpdateInput): Promise<OrgDomain> {
    try {
      await this.findOneOrThrow(id);

      return await this.prisma.orgDomain.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          org: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (hasErrorCode(error) && error.code === 'P2002') {
        throw new ConflictException('Domain already exists for this organization');
      }
      throw new BadRequestException(`Failed to update organization domain: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Soft deletes an organization domain
   */
  async remove(id: number): Promise<OrgDomain> {
    await this.findOneOrThrow(id);

    return this.prisma.orgDomain.update({
      where: { id },
      data: {
        isDeleted: 1,
        isDeletedDT: new Date(),
        updatedAt: new Date(),
      },
      include: {
        org: true,
      },
    });
  }

  /**
   * Restores a soft-deleted organization domain
   */
  async restore(id: number): Promise<OrgDomain> {
    const orgDomain = await this.findOne(id, true);
    if (!orgDomain) {
      throw new NotFoundException(`Organization domain with ID ${id} not found`);
    }

    if (orgDomain.isDeleted === 0) {
      throw new BadRequestException('Organization domain is not deleted');
    }

    return this.prisma.orgDomain.update({
      where: { id },
      data: {
        isDeleted: 0,
        isDeletedDT: null,
        updatedAt: new Date(),
      },
      include: {
        org: true,
      },
    });
  }

  /**
   * Permanently deletes an organization domain
   */
  async hardDelete(id: number): Promise<void> {
    await this.findOneOrThrow(id, true);

    await this.prisma.orgDomain.delete({
      where: { id },
    });
  }

  /**
   * Toggles the published status of an organization domain
   */
  async togglePublished(id: number): Promise<OrgDomain> {
    const orgDomain = await this.findOneOrThrow(id);

    return this.prisma.orgDomain.update({
      where: { id },
      data: {
        published: !orgDomain.published,
        updatedAt: new Date(),
      },
      include: {
        org: true,
      },
    });
  }

  /**
   * Toggles the public visibility of an organization domain
   */
  async togglePublic(id: number): Promise<OrgDomain> {
    const orgDomain = await this.findOneOrThrow(id);

    return this.prisma.orgDomain.update({
      where: { id },
      data: {
        isPublic: !orgDomain.isPublic,
        updatedAt: new Date(),
      },
      include: {
        org: true,
      },
    });
  }

  /**
   * Gets count of organization domains with optional filters
   */
  async count(where?: Prisma.OrgDomainWhereInput, includeDeleted = false): Promise<number> {
    const whereClause = includeDeleted
      ? where
      : { ...where, isDeleted: 0 };

    return this.prisma.orgDomain.count({
      where: whereClause,
    });
  }

  /**
   * Gets organization domain statistics
   */
  async getStatistics(): Promise<{
    total: number;
    published: number;
    deleted: number;
    public: number;
    private: number;
    byOrganization: Array<{ orgId: string; count: number; orgName?: string }>;
    byExtension: Array<{ extension: string; count: number }>;
    topDomains: Array<{ domainName: string; extension: string; count: number }>;
  }> {
    const [
      total,
      published,
      deleted,
      publicDomains,
      privateDomains,
      byOrganization,
      byExtension,
    ] = await Promise.all([
      this.prisma.orgDomain.count(),
      this.prisma.orgDomain.count({ where: { published: true, isDeleted: 0 } }),
      this.prisma.orgDomain.count({ where: { isDeleted: { gt: 0 } } }),
      this.prisma.orgDomain.count({ where: { isPublic: true, isDeleted: 0 } }),
      this.prisma.orgDomain.count({ where: { isPublic: false, isDeleted: 0 } }),
      this.prisma.orgDomain.groupBy({
        by: ['orgId'],
        _count: { id: true },
        where: { isDeleted: 0 },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.orgDomain.groupBy({
        by: ['extension'],
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

    // Get top domains (combination of domainName and extension)
    const topDomains = await this.prisma.orgDomain.groupBy({
      by: ['domainName', 'extension'],
      _count: { id: true },
      where: { isDeleted: 0 },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    return {
      total,
      published,
      deleted,
      public: publicDomains,
      private: privateDomains,
      byOrganization: byOrganization.map(item => ({
        orgId: item.orgId,
        count: item._count.id,
        orgName: orgMap.get(item.orgId),
      })),
      byExtension: byExtension.map(item => ({
        extension: item.extension,
        count: item._count.id,
      })),
      topDomains: topDomains.map(item => ({
        domainName: item.domainName,
        extension: item.extension,
        count: item._count.id,
      })),
    };
  }

  /**
   * Bulk update organization domains
   */
  async bulkUpdate(
    where: Prisma.OrgDomainWhereInput,
    data: Prisma.OrgDomainUpdateInput
  ): Promise<{ count: number }> {
    const result = await this.prisma.orgDomain.updateMany({
      where: { ...where, isDeleted: 0 },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return { count: result.count };
  }

  /**
   * Bulk soft delete organization domains
   */
  async bulkDelete(where: Prisma.OrgDomainWhereInput): Promise<{ count: number }> {
    const result = await this.prisma.orgDomain.updateMany({
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
   * Gets published organization domains for a specific organization
   */
  async getPublishedByOrganization(orgId: string): Promise<OrgDomain[]> {
    return this.prisma.orgDomain.findMany({
      where: {
        orgId,
        published: true,
        isDeleted: 0,
      },
      include: {
        org: true,
      },
      orderBy: { domainName: 'asc' },
    });
  }

  /**
   * Gets public organization domains
   */
  async getPublicDomains(): Promise<OrgDomain[]> {
    return this.prisma.orgDomain.findMany({
      where: {
        isPublic: true,
        published: true,
        isDeleted: 0,
      },
      include: {
        org: true,
      },
      orderBy: { domainName: 'asc' },
    });
  }

  /**
   * Gets all unique extensions used
   */
  async getUniqueExtensions(): Promise<string[]> {
    const result = await this.prisma.orgDomain.findMany({
      where: { isDeleted: 0 },
      select: { extension: true },
      distinct: ['extension'],
      orderBy: { extension: 'asc' },
    });

    return result.map(item => item.extension);
  }

  /**
   * Validates domain data format and organization existence
   */
  async validateDomainData(
    domainName: string,
    extension: string,
    orgId: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic domain name validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(domainName)) {
      errors.push('Invalid domain name format');
    }

    // Extension validation
    const extensionRegex = /^[a-zA-Z]{2,}$/;
    if (!extensionRegex.test(extension)) {
      errors.push('Invalid extension format (must be at least 2 letters)');
    }

    // Check if organization exists
    const orgExists = await this.prisma.organization.findFirst({
      where: { id: orgId, isDeleted: 0 },
    });

    if (!orgExists) {
      errors.push('Organization does not exist');
    }

    // Check for duplicate domain in the same organization
    const existingDomain = await this.prisma.orgDomain.findFirst({
      where: {
        domainName,
        extension,
        orgId,
        isDeleted: 0,
      },
    });

    if (existingDomain) {
      errors.push('Domain already exists for this organization');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Checks if a domain is available (not used by any organization)
   */
  async isDomainAvailable(domainName: string, extension: string): Promise<boolean> {
    const existing = await this.prisma.orgDomain.findFirst({
      where: {
        domainName,
        extension,
        isDeleted: 0,
      },
    });

    return !existing;
  }

  /**
   * Gets domain suggestions based on a base name
   */
  async getDomainSuggestions(baseName: string, extension: string, limit = 5): Promise<string[]> {
    const suggestions: string[] = [];

    // Try the base name first
    if (await this.isDomainAvailable(baseName, extension)) {
      suggestions.push(`${baseName}.${extension}`);
    }

    // Generate variations
    const variations = [
      `${baseName}app`,
      `${baseName}web`,
      `${baseName}online`,
      `my${baseName}`,
      `${baseName}hq`,
      `${baseName}pro`,
      `${baseName}tech`,
      `${baseName}hub`,
    ];

    for (const variation of variations) {
      if (suggestions.length >= limit) break;
      if (await this.isDomainAvailable(variation, extension)) {
        suggestions.push(`${variation}.${extension}`);
      }
    }

    // Add numbered variations if still not enough
    let counter = 1;
    while (suggestions.length < limit && counter <= 20) {
      const numberedName = `${baseName}${counter}`;
      if (await this.isDomainAvailable(numberedName, extension)) {
        suggestions.push(`${numberedName}.${extension}`);
      }
      counter++;
    }

    return suggestions;
  }
}
