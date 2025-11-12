import { AppEmailDomain, Prisma } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

function hasErrorCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

export interface AppEmailDomainWithStats {
  id: number;
  domain: string;
  allowed: boolean;
  published: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppEmailDomainStatistics {
  total: number;
  allowed: number;
  blocked: number;
  published: number;
  public: number;
  deleted: number;
  byDomainExtension: Array<{
    extension: string;
    count: number;
    allowedCount: number;
    blockedCount: number;
  }>;
  recentActivity: Array<{
    date: string;
    added: number;
    modified: number;
  }>;
}

@Injectable()
export class AppEmailDomainsService {
  constructor(private readonly prisma: PrismaClientService) {}

  /**
   * Create a new app email domain
   */
  async create(createAppEmailDomainDto: Prisma.AppEmailDomainCreateInput): Promise<AppEmailDomain> {
    try {
      // Validate domain format
      if (!this.isValidDomain(createAppEmailDomainDto.domain)) {
        throw new BadRequestException('Invalid domain format');
      }

      return await this.prisma.appEmailDomain.create({
        data: createAppEmailDomainDto,
      });
    } catch (error) {
      if (hasErrorCode(error, 'P2002')) {
        throw new ConflictException('Domain already exists');
      }
      throw error;
    }
  }

  /**
   * Create multiple app email domains
   */
  async createMany(createAppEmailDomainsDto: Prisma.AppEmailDomainCreateInput[]): Promise<{ count: number }> {
    // Validate all domains
    for (const domain of createAppEmailDomainsDto) {
      if (!this.isValidDomain(domain.domain)) {
        throw new BadRequestException(`Invalid domain format: ${domain.domain}`);
      }
    }

    return await this.prisma.appEmailDomain.createMany({
      data: createAppEmailDomainsDto,
      skipDuplicates: true,
    });
  }

  /**
   * Find all app email domains with optional filtering and pagination
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.AppEmailDomainWhereUniqueInput;
    where?: Prisma.AppEmailDomainWhereInput;
    orderBy?: Prisma.AppEmailDomainOrderByWithRelationInput;
    includeDeleted?: boolean;
  } = {}): Promise<AppEmailDomain[]> {
    const { skip, take, cursor, where, orderBy, includeDeleted = false } = params;

    const whereClause: Prisma.AppEmailDomainWhereInput = {
      ...where,
      ...(includeDeleted ? {} : { isDeleted: 0 }),
    };

    return await this.prisma.appEmailDomain.findMany({
      skip,
      take,
      cursor,
      where: whereClause,
      orderBy: orderBy || { createdAt: 'desc' },
    });
  }

  /**
   * Find app email domains by domain pattern
   */
  async findByDomainPattern(pattern: string, includeDeleted = false): Promise<AppEmailDomain[]> {
    return await this.prisma.appEmailDomain.findMany({
      where: {
        domain: {
          contains: pattern,
          mode: 'insensitive',
        },
        ...(includeDeleted ? {} : { isDeleted: 0 }),
      },
      orderBy: { domain: 'asc' },
    });
  }

  /**
   * Find allowed domains only
   */
  async findAllowed(includeDeleted = false): Promise<AppEmailDomain[]> {
    return await this.prisma.appEmailDomain.findMany({
      where: {
        allowed: true,
        ...(includeDeleted ? {} : { isDeleted: 0 }),
      },
      orderBy: { domain: 'asc' },
    });
  }

  /**
   * Find blocked domains only
   */
  async findBlocked(includeDeleted = false): Promise<AppEmailDomain[]> {
    return await this.prisma.appEmailDomain.findMany({
      where: {
        allowed: false,
        ...(includeDeleted ? {} : { isDeleted: 0 }),
      },
      orderBy: { domain: 'asc' },
    });
  }

  /**
   * Find published domains
   */
  async findPublished(includeDeleted = false): Promise<AppEmailDomain[]> {
    return await this.prisma.appEmailDomain.findMany({
      where: {
        published: true,
        ...(includeDeleted ? {} : { isDeleted: 0 }),
      },
      orderBy: { domain: 'asc' },
    });
  }

  /**
   * Find public domains
   */
  async findPublic(): Promise<AppEmailDomain[]> {
    return await this.prisma.appEmailDomain.findMany({
      where: {
        isPublic: true,
        published: true,
        isDeleted: 0,
      },
      orderBy: { domain: 'asc' },
    });
  }

  /**
   * Get unique domain extensions
   */
  async getUniqueExtensions(): Promise<string[]> {
    const domains = await this.prisma.appEmailDomain.findMany({
      where: { isDeleted: 0 },
      select: { domain: true },
    });

    const extensions = new Set<string>();
    domains.forEach(({ domain }) => {
      const parts = domain.split('.');
      if (parts.length > 1) {
        extensions.add(parts[parts.length - 1]);
      }
    });

    return Array.from(extensions).sort();
  }

  /**
   * Check if domain is allowed
   */
  async isDomainAllowed(domain: string): Promise<boolean> {
    const result = await this.prisma.appEmailDomain.findFirst({
      where: {
        domain: domain.toLowerCase(),
        isDeleted: 0,
      },
      select: { allowed: true },
    });

    return result?.allowed ?? false;
  }

  /**
   * Check if domain exists
   */
  async domainExists(domain: string): Promise<boolean> {
    const count = await this.prisma.appEmailDomain.count({
      where: {
        domain: domain.toLowerCase(),
        isDeleted: 0,
      },
    });

    return count > 0;
  }

  /**
   * Get app email domain statistics
   */
  async getStatistics(): Promise<AppEmailDomainStatistics> {
    const [
      total,
      allowed,
      blocked,
      published,
      publicCount,
      deleted,
      domains,
    ] = await Promise.all([
      this.prisma.appEmailDomain.count({ where: { isDeleted: 0 } }),
      this.prisma.appEmailDomain.count({ where: { allowed: true, isDeleted: 0 } }),
      this.prisma.appEmailDomain.count({ where: { allowed: false, isDeleted: 0 } }),
      this.prisma.appEmailDomain.count({ where: { published: true, isDeleted: 0 } }),
      this.prisma.appEmailDomain.count({ where: { isPublic: true, isDeleted: 0 } }),
      this.prisma.appEmailDomain.count({ where: { isDeleted: { gt: 0 } } }),
      this.prisma.appEmailDomain.findMany({
        where: { isDeleted: 0 },
        select: { domain: true, allowed: true, createdAt: true, updatedAt: true },
      }),
    ]);

    // Group by domain extension
    const extensionStats = new Map<string, { count: number; allowedCount: number; blockedCount: number }>();

    domains.forEach(({ domain, allowed }) => {
      const parts = domain.split('.');
      const extension = parts.length > 1 ? parts[parts.length - 1] : 'unknown';

      const current = extensionStats.get(extension) || { count: 0, allowedCount: 0, blockedCount: 0 };
      current.count++;
      if (allowed) {
        current.allowedCount++;
      } else {
        current.blockedCount++;
      }
      extensionStats.set(extension, current);
    });

    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = new Map<string, { added: number; modified: number }>();

    domains.forEach(({ createdAt, updatedAt }) => {
      const createdDate = createdAt.toISOString().split('T')[0];
      const updatedDate = updatedAt.toISOString().split('T')[0];

      if (createdAt >= sevenDaysAgo) {
        const current = recentActivity.get(createdDate) || { added: 0, modified: 0 };
        current.added++;
        recentActivity.set(createdDate, current);
      }

      if (updatedAt >= sevenDaysAgo && createdDate !== updatedDate) {
        const current = recentActivity.get(updatedDate) || { added: 0, modified: 0 };
        current.modified++;
        recentActivity.set(updatedDate, current);
      }
    });

    return {
      total,
      allowed,
      blocked,
      published,
      public: publicCount,
      deleted,
      byDomainExtension: Array.from(extensionStats.entries()).map(([extension, stats]) => ({
        extension,
        ...stats,
      })),
      recentActivity: Array.from(recentActivity.entries()).map(([date, stats]) => ({
        date,
        ...stats,
      })),
    };
  }

  /**
   * Count app email domains with optional filtering
   */
  async count(where?: Prisma.AppEmailDomainWhereInput, includeDeleted = false): Promise<number> {
    const whereClause: Prisma.AppEmailDomainWhereInput = {
      ...where,
      ...(includeDeleted ? {} : { isDeleted: 0 }),
    };

    return await this.prisma.appEmailDomain.count({
      where: whereClause,
    });
  }

  /**
   * Find one app email domain by ID
   */
  async findOne(id: number, includeDeleted = false): Promise<AppEmailDomain | null> {
    return await this.prisma.appEmailDomain.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { isDeleted: 0 }),
      },
    });
  }

  /**
   * Find one app email domain by ID or throw
   */
  async findOneOrThrow(id: number, includeDeleted = false): Promise<AppEmailDomain> {
    const appEmailDomain = await this.findOne(id, includeDeleted);
    if (!appEmailDomain) {
      throw new NotFoundException(`App email domain with ID ${id} not found`);
    }
    return appEmailDomain;
  }

  /**
   * Find app email domain by domain
   */
  async findByDomain(domain: string, includeDeleted = false): Promise<AppEmailDomain | null> {
    return await this.prisma.appEmailDomain.findFirst({
      where: {
        domain: domain.toLowerCase(),
        ...(includeDeleted ? {} : { isDeleted: 0 }),
      },
    });
  }

  /**
   * Update an app email domain
   */
  async update(id: number, updateAppEmailDomainDto: Prisma.AppEmailDomainUpdateInput): Promise<AppEmailDomain> {
    // Check if domain exists
    await this.findOneOrThrow(id);

    // Validate domain format if domain is being updated
    if (updateAppEmailDomainDto.domain && typeof updateAppEmailDomainDto.domain === 'string') {
      if (!this.isValidDomain(updateAppEmailDomainDto.domain)) {
        throw new BadRequestException('Invalid domain format');
      }
    }

    try {
      return await this.prisma.appEmailDomain.update({
        where: { id },
        data: {
          ...updateAppEmailDomainDto,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      if (hasErrorCode(error, 'P2002')) {
        throw new ConflictException('Domain already exists');
      }
      throw error;
    }
  }

  /**
   * Bulk update app email domains
   */
  async bulkUpdate(
    where: Prisma.AppEmailDomainWhereInput,
    data: Prisma.AppEmailDomainUpdateInput
  ): Promise<{ count: number }> {
    return await this.prisma.appEmailDomain.updateMany({
      where: {
        ...where,
        isDeleted: 0,
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Bulk allow domains
   */
  async bulkAllow(where: Prisma.AppEmailDomainWhereInput): Promise<{ count: number }> {
    return await this.bulkUpdate(where, { allowed: true });
  }

  /**
   * Bulk block domains
   */
  async bulkBlock(where: Prisma.AppEmailDomainWhereInput): Promise<{ count: number }> {
    return await this.bulkUpdate(where, { allowed: false });
  }

  /**
   * Toggle allowed status
   */
  async toggleAllowed(id: number): Promise<AppEmailDomain> {
    const domain = await this.findOneOrThrow(id);
    return await this.update(id, { allowed: !domain.allowed });
  }

  /**
   * Toggle published status
   */
  async togglePublished(id: number): Promise<AppEmailDomain> {
    const domain = await this.findOneOrThrow(id);
    return await this.update(id, { published: !domain.published });
  }

  /**
   * Toggle public visibility
   */
  async togglePublic(id: number): Promise<AppEmailDomain> {
    const domain = await this.findOneOrThrow(id);
    return await this.update(id, { isPublic: !domain.isPublic });
  }

  /**
   * Soft delete an app email domain
   */
  async remove(id: number): Promise<AppEmailDomain> {
    await this.findOneOrThrow(id);

    return await this.prisma.appEmailDomain.update({
      where: { id },
      data: {
        isDeleted: Date.now(),
        isDeletedDT: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Restore a soft-deleted app email domain
   */
  async restore(id: number): Promise<AppEmailDomain> {
    const domain = await this.findOne(id, true);
    if (!domain) {
      throw new NotFoundException(`App email domain with ID ${id} not found`);
    }

    if (domain.isDeleted === 0) {
      throw new BadRequestException('App email domain is not deleted');
    }

    return await this.prisma.appEmailDomain.update({
      where: { id },
      data: {
        isDeleted: 0,
        isDeletedDT: null,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Permanently delete an app email domain
   */
  async hardDelete(id: number): Promise<void> {
    await this.findOneOrThrow(id, true);

    await this.prisma.appEmailDomain.delete({
      where: { id },
    });
  }

  /**
   * Bulk soft delete app email domains
   */
  async bulkDelete(where: Prisma.AppEmailDomainWhereInput): Promise<{ count: number }> {
    const now = Date.now();
    return await this.prisma.appEmailDomain.updateMany({
      where: {
        ...where,
        isDeleted: 0,
      },
      data: {
        isDeleted: now,
        isDeletedDT: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Validate domain format
   */
  private isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain) && domain.length <= 253;
  }

  /**
   * Validate domain data
   */
  async validateDomainData(domain: string): Promise<{
    isValid: boolean;
    exists: boolean;
    isAllowed?: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let isValid = true;

    // Check domain format
    if (!this.isValidDomain(domain)) {
      errors.push('Invalid domain format');
      isValid = false;
    }

    // Check if domain exists
    const exists = await this.domainExists(domain);
    const isAllowed = exists ? await this.isDomainAllowed(domain) : undefined;

    return {
      isValid,
      exists,
      isAllowed,
      errors,
    };
  }

  /**
   * Suggest domain alternatives
   */
  async suggestAlternatives(baseDomain: string, limit = 5): Promise<string[]> {
    const suggestions: string[] = [];
    const parts = baseDomain.split('.');

    if (parts.length < 2) return suggestions;

    const [name, ...extensions] = parts;
    const commonExtensions = ['com', 'org', 'net', 'edu', 'gov', 'mil', 'int'];

    // Try different extensions
    for (const ext of commonExtensions) {
      if (suggestions.length >= limit) break;

      const suggestion = `${name}.${ext}`;
      if (suggestion !== baseDomain && !(await this.domainExists(suggestion))) {
        suggestions.push(suggestion);
      }
    }

    // Try with numbers
    for (let i = 1; i <= 3 && suggestions.length < limit; i++) {
      const suggestion = `${name}${i}.${extensions.join('.')}`;
      if (!(await this.domainExists(suggestion))) {
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }
}
