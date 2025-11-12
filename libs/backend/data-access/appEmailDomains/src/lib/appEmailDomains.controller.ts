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
import { AppEmailDomainsService } from './appEmailDomains.service';

@Controller('app-email-domains')
export class AppEmailDomainsController {
  constructor(private readonly appEmailDomainsService: AppEmailDomainsService) {}

  /**
   * Create a new app email domain
   */
  @Post()
  async create(@Body(ValidationPipe) createAppEmailDomainDto: Prisma.AppEmailDomainCreateInput) {
    return this.appEmailDomainsService.create(createAppEmailDomainDto);
  }

  /**
   * Create multiple app email domains
   */
  @Post('bulk')
  async createMany(@Body(ValidationPipe) createAppEmailDomainsDto: { domains: Prisma.AppEmailDomainCreateInput[] }) {
    if (!createAppEmailDomainsDto.domains || createAppEmailDomainsDto.domains.length === 0) {
      throw new BadRequestException('At least one domain is required');
    }
    return this.appEmailDomainsService.createMany(createAppEmailDomainsDto.domains);
  }

  /**
   * Get all app email domains with optional filtering
   */
  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('domain') domain?: string,
    @Query('allowed') allowed?: string,
    @Query('published') published?: string,
    @Query('isPublic') isPublic?: string,
    @Query('includeDeleted') includeDeleted?: string,
    @Query('orderBy') orderBy?: string,
  ) {
    const params: {
      skip?: number;
      take?: number;
      includeDeleted?: boolean;
      where?: Prisma.AppEmailDomainWhereInput;
      orderBy?: Prisma.AppEmailDomainOrderByWithRelationInput;
    } = {};

    if (skip) params.skip = parseInt(skip);
    if (take) params.take = parseInt(take);
    if (includeDeleted) params.includeDeleted = includeDeleted === 'true';

    // Build where clause
    const where: Prisma.AppEmailDomainWhereInput = {};
    if (domain) {
      where.domain = {
        contains: domain,
        mode: 'insensitive',
      };
    }
    if (allowed !== undefined) where.allowed = allowed === 'true';
    if (published !== undefined) where.published = published === 'true';
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';

    if (Object.keys(where).length > 0) params.where = where;

    // Build orderBy clause
    if (orderBy) {
      const [field, direction] = orderBy.split(':');
      params.orderBy = { [field]: direction || 'asc' };
    }

    return this.appEmailDomainsService.findAll(params);
  }

  /**
   * Search app email domains by domain pattern
   */
  @Get('search')
  async searchByDomain(
    @Query('pattern') pattern: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    if (!pattern) {
      throw new BadRequestException('Search pattern is required');
    }
    return this.appEmailDomainsService.findByDomainPattern(
      pattern,
      includeDeleted === 'true'
    );
  }

  /**
   * Get allowed domains only
   */
  @Get('allowed')
  async findAllowed(@Query('includeDeleted') includeDeleted?: string) {
    return this.appEmailDomainsService.findAllowed(includeDeleted === 'true');
  }

  /**
   * Get blocked domains only
   */
  @Get('blocked')
  async findBlocked(@Query('includeDeleted') includeDeleted?: string) {
    return this.appEmailDomainsService.findBlocked(includeDeleted === 'true');
  }

  /**
   * Get published domains
   */
  @Get('published')
  async findPublished(@Query('includeDeleted') includeDeleted?: string) {
    return this.appEmailDomainsService.findPublished(includeDeleted === 'true');
  }

  /**
   * Get all public domains
   */
  @Get('public')
  async findPublic() {
    return this.appEmailDomainsService.findPublic();
  }

  /**
   * Get unique domain extensions
   */
  @Get('extensions')
  async getUniqueExtensions() {
    return {
      extensions: await this.appEmailDomainsService.getUniqueExtensions(),
    };
  }

  /**
   * Check if domain is allowed
   */
  @Get('check/:domain')
  async checkDomain(@Param('domain') domain: string) {
    return {
      domain: domain,
      allowed: await this.appEmailDomainsService.isDomainAllowed(domain),
      exists: await this.appEmailDomainsService.domainExists(domain),
    };
  }

  /**
   * Get app email domain statistics
   */
  @Get('statistics')
  async getStatistics() {
    return this.appEmailDomainsService.getStatistics();
  }

  /**
   * Get app email domain count
   */
  @Get('count')
  async getCount(
    @Query('domain') domain?: string,
    @Query('allowed') allowed?: string,
    @Query('published') published?: string,
    @Query('isPublic') isPublic?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const where: Prisma.AppEmailDomainWhereInput = {};
    if (domain) {
      where.domain = {
        contains: domain,
        mode: 'insensitive',
      };
    }
    if (allowed !== undefined) where.allowed = allowed === 'true';
    if (published !== undefined) where.published = published === 'true';
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';

    return {
      count: await this.appEmailDomainsService.count(where, includeDeleted === 'true'),
    };
  }

  /**
   * Get domain suggestions
   */
  @Get('suggest/:domain')
  async suggestAlternatives(
    @Param('domain') domain: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 5;
    return {
      baseDomain: domain,
      suggestions: await this.appEmailDomainsService.suggestAlternatives(domain, limitNum),
    };
  }

  /**
   * Get a single app email domain by ID
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.appEmailDomainsService.findOneOrThrow(id, includeDeleted === 'true');
  }

  /**
   * Get app email domain by domain name
   */
  @Get('domain/:domain')
  async findByDomain(
    @Param('domain') domain: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const result = await this.appEmailDomainsService.findByDomain(domain, includeDeleted === 'true');
    if (!result) {
      throw new BadRequestException(`Domain ${domain} not found`);
    }
    return result;
  }

  /**
   * Update an app email domain
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateAppEmailDomainDto: Prisma.AppEmailDomainUpdateInput,
  ) {
    return this.appEmailDomainsService.update(id, updateAppEmailDomainDto);
  }

  /**
   * Bulk update app email domains
   */
  @Patch('bulk/update')
  async bulkUpdate(
    @Body(ValidationPipe) bulkUpdateDto: {
      where: Prisma.AppEmailDomainWhereInput;
      data: Prisma.AppEmailDomainUpdateInput;
    },
  ) {
    return this.appEmailDomainsService.bulkUpdate(bulkUpdateDto.where, bulkUpdateDto.data);
  }

  /**
   * Bulk allow domains
   */
  @Patch('bulk/allow')
  async bulkAllow(
    @Body(ValidationPipe) bulkAllowDto: { where: Prisma.AppEmailDomainWhereInput },
  ) {
    return this.appEmailDomainsService.bulkAllow(bulkAllowDto.where);
  }

  /**
   * Bulk block domains
   */
  @Patch('bulk/block')
  async bulkBlock(
    @Body(ValidationPipe) bulkBlockDto: { where: Prisma.AppEmailDomainWhereInput },
  ) {
    return this.appEmailDomainsService.bulkBlock(bulkBlockDto.where);
  }

  /**
   * Toggle allowed status
   */
  @Patch(':id/toggle-allowed')
  async toggleAllowed(@Param('id', ParseIntPipe) id: number) {
    return this.appEmailDomainsService.toggleAllowed(id);
  }

  /**
   * Toggle published status
   */
  @Patch(':id/toggle-published')
  async togglePublished(@Param('id', ParseIntPipe) id: number) {
    return this.appEmailDomainsService.togglePublished(id);
  }

  /**
   * Toggle public visibility
   */
  @Patch(':id/toggle-public')
  async togglePublic(@Param('id', ParseIntPipe) id: number) {
    return this.appEmailDomainsService.togglePublic(id);
  }

  /**
   * Soft delete an app email domain
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.appEmailDomainsService.remove(id);
  }

  /**
   * Restore a soft-deleted app email domain
   */
  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.appEmailDomainsService.restore(id);
  }

  /**
   * Permanently delete an app email domain
   */
  @Delete(':id/hard')
  async hardDelete(@Param('id', ParseIntPipe) id: number) {
    await this.appEmailDomainsService.hardDelete(id);
    return { message: 'App email domain permanently deleted' };
  }

  /**
   * Bulk soft delete app email domains
   */
  @Delete('bulk')
  async bulkDelete(
    @Body(ValidationPipe) bulkDeleteDto: { where: Prisma.AppEmailDomainWhereInput },
  ) {
    return this.appEmailDomainsService.bulkDelete(bulkDeleteDto.where);
  }

  /**
   * Validate domain data
   */
  @Post('validate')
  async validateDomain(
    @Body(ValidationPipe) validateDto: { domain: string },
  ) {
    return this.appEmailDomainsService.validateDomainData(validateDto.domain);
  }
}
