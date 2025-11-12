import { Prisma } from '@db/prisma';
import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    ValidationPipe,
} from '@nestjs/common';
import { OrgDomainsService } from './orgDomains.service';

@Controller('org-domains')
export class OrgDomainsController {
  constructor(private readonly orgDomainsService: OrgDomainsService) {}

  /**
   * Create a new organization domain
   */
  @Post()
  async create(@Body(ValidationPipe) createOrgDomainDto: Prisma.OrgDomainCreateInput) {
    return this.orgDomainsService.create(createOrgDomainDto);
  }

  /**
   * Create multiple organization domains
   */
  @Post('bulk')
  async createMany(@Body(ValidationPipe) createOrgDomainsDto: { domains: Prisma.OrgDomainCreateInput[] }) {
    if (!createOrgDomainsDto.domains || createOrgDomainsDto.domains.length === 0) {
      throw new BadRequestException('At least one domain is required');
    }
    return this.orgDomainsService.createMany(createOrgDomainsDto.domains);
  }

  /**
   * Get all organization domains with optional filtering
   */
  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('orgId') orgId?: string,
    @Query('domainName') domainName?: string,
    @Query('extension') extension?: string,
    @Query('published') published?: string,
    @Query('isPublic') isPublic?: string,
    @Query('includeDeleted') includeDeleted?: string,
    @Query('orderBy') orderBy?: string,
  ) {
    const params: {
      skip?: number;
      take?: number;
      includeDeleted?: boolean;
      where?: Prisma.OrgDomainWhereInput;
      orderBy?: Prisma.OrgDomainOrderByWithRelationInput;
    } = {};

    if (skip) params.skip = parseInt(skip);
    if (take) params.take = parseInt(take);
    if (includeDeleted) params.includeDeleted = includeDeleted === 'true';

    // Build where clause
    const where: Prisma.OrgDomainWhereInput = {};
    if (orgId) where.orgId = orgId;
    if (domainName) {
      where.domainName = {
        contains: domainName,
        mode: 'insensitive',
      };
    }
    if (extension) where.extension = extension.toLowerCase();
    if (published !== undefined) where.published = published === 'true';
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';

    if (Object.keys(where).length > 0) params.where = where;

    // Build orderBy clause
    if (orderBy) {
      const [field, direction] = orderBy.split(':');
      params.orderBy = { [field]: direction || 'asc' };
    }

    return this.orgDomainsService.findAll(params);
  }

  /**
   * Get organization domains by organization ID
   */
  @Get('organization/:orgId')
  async findByOrganization(
    @Param('orgId') orgId: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.orgDomainsService.findByOrganization(
      orgId,
      includeDeleted === 'true'
    );
  }

  /**
   * Search organization domains by domain name pattern
   */
  @Get('search')
  async searchByDomain(
    @Query('pattern') pattern: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    if (!pattern) {
      throw new BadRequestException('Search pattern is required');
    }
    return this.orgDomainsService.findByDomainPattern(
      pattern,
      includeDeleted === 'true'
    );
  }

  /**
   * Get domains by extension
   */
  @Get('extension/:extension')
  async findByExtension(
    @Param('extension') extension: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.orgDomainsService.findByExtension(
      extension,
      includeDeleted === 'true'
    );
  }

  /**
   * Get domain by full domain name (domainName.extension)
   */
  @Get('full/:fullDomain')
  async findByFullDomain(
    @Param('fullDomain') fullDomain: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const domain = await this.orgDomainsService.findByFullDomain(
      fullDomain,
      includeDeleted === 'true'
    );
    if (!domain) {
      throw new BadRequestException(`Domain ${fullDomain} not found`);
    }
    return domain;
  }

  /**
   * Get published domains by organization
   */
  @Get('organization/:orgId/published')
  async getPublishedByOrganization(@Param('orgId') orgId: string) {
    return this.orgDomainsService.getPublishedByOrganization(orgId);
  }

  /**
   * Get all public domains
   */
  @Get('public')
  async getPublicDomains() {
    return this.orgDomainsService.getPublicDomains();
  }

  /**
   * Get unique extensions
   */
  @Get('extensions')
  async getUniqueExtensions() {
    return {
      extensions: await this.orgDomainsService.getUniqueExtensions(),
    };
  }

  /**
   * Get organization domain statistics
   */
  @Get('statistics')
  async getStatistics() {
    return this.orgDomainsService.getStatistics();
  }

  /**
   * Get organization domain count
   */
  @Get('count')
  async getCount(
    @Query('orgId') orgId?: string,
    @Query('extension') extension?: string,
    @Query('published') published?: string,
    @Query('isPublic') isPublic?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const where: Prisma.OrgDomainWhereInput = {};
    if (orgId) where.orgId = orgId;
    if (extension) where.extension = extension.toLowerCase();
    if (published !== undefined) where.published = published === 'true';
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';

    return {
      count: await this.orgDomainsService.count(where, includeDeleted === 'true'),
    };
  }

  /**
   * Check if domain is available
   */
  @Get('available/:domainName/:extension')
  async isDomainAvailable(
    @Param('domainName') domainName: string,
    @Param('extension') extension: string,
  ) {
    return {
      available: await this.orgDomainsService.isDomainAvailable(domainName, extension),
      domain: `${domainName}.${extension}`,
    };
  }

  /**
   * Get domain suggestions
   */
  @Get('suggestions/:baseName/:extension')
  async getDomainSuggestions(
    @Param('baseName') baseName: string,
    @Param('extension') extension: string,
    @Query('limit') limit?: string,
  ) {
    const suggestionLimit = limit ? parseInt(limit) : 5;
    return {
      suggestions: await this.orgDomainsService.getDomainSuggestions(
        baseName,
        extension,
        suggestionLimit
      ),
    };
  }

  /**
   * Get a single organization domain by ID
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.orgDomainsService.findOneOrThrow(id, includeDeleted === 'true');
  }

  /**
   * Update an organization domain
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateOrgDomainDto: Prisma.OrgDomainUpdateInput,
  ) {
    return this.orgDomainsService.update(id, updateOrgDomainDto);
  }

  /**
   * Bulk update organization domains
   */
  @Patch('bulk/update')
  async bulkUpdate(
    @Body(ValidationPipe) bulkUpdateDto: {
      where: Prisma.OrgDomainWhereInput;
      data: Prisma.OrgDomainUpdateInput;
    },
  ) {
    return this.orgDomainsService.bulkUpdate(bulkUpdateDto.where, bulkUpdateDto.data);
  }

  /**
   * Toggle published status
   */
  @Patch(':id/toggle-published')
  async togglePublished(@Param('id', ParseIntPipe) id: number) {
    return this.orgDomainsService.togglePublished(id);
  }

  /**
   * Toggle public visibility
   */
  @Patch(':id/toggle-public')
  async togglePublic(@Param('id', ParseIntPipe) id: number) {
    return this.orgDomainsService.togglePublic(id);
  }

  /**
   * Soft delete an organization domain
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.orgDomainsService.remove(id);
  }

  /**
   * Restore a soft-deleted organization domain
   */
  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.orgDomainsService.restore(id);
  }

  /**
   * Permanently delete an organization domain
   */
  @Delete(':id/hard')
  async hardDelete(@Param('id', ParseIntPipe) id: number) {
    await this.orgDomainsService.hardDelete(id);
    return { message: 'Organization domain permanently deleted' };
  }

  /**
   * Bulk soft delete organization domains
   */
  @Delete('bulk')
  async bulkDelete(
    @Body(ValidationPipe) bulkDeleteDto: { where: Prisma.OrgDomainWhereInput },
  ) {
    return this.orgDomainsService.bulkDelete(bulkDeleteDto.where);
  }

  /**
   * Validate domain data
   */
  @Post('validate')
  async validateDomain(
    @Body(ValidationPipe) validateDto: {
      domainName: string;
      extension: string;
      orgId: string;
    },
  ) {
    return this.orgDomainsService.validateDomainData(
      validateDto.domainName,
      validateDto.extension,
      validateDto.orgId
    );
  }
}
