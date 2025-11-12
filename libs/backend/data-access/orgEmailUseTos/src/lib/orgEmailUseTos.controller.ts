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
import { OrgEmailUseTosService } from './orgEmailUseTos.service';

@Controller('org-email-use-tos')
export class OrgEmailUseTosController {
  constructor(private readonly orgEmailUseTosService: OrgEmailUseTosService) {}

  /**
   * Create a new organization email use to
   */
  @Post()
  async create(@Body(ValidationPipe) createOrgEmailUseToDto: Prisma.OrgEmailUseToCreateInput) {
    return this.orgEmailUseTosService.create(createOrgEmailUseToDto);
  }

  /**
   * Create multiple organization email use tos
   */
  @Post('bulk')
  async createMany(@Body(ValidationPipe) createOrgEmailUseTosDto: { useTos: Prisma.OrgEmailUseToCreateInput[] }) {
    if (!createOrgEmailUseTosDto.useTos || createOrgEmailUseTosDto.useTos.length === 0) {
      throw new BadRequestException('At least one use to is required');
    }
    return this.orgEmailUseTosService.createMany(createOrgEmailUseTosDto.useTos);
  }

  /**
   * Get all organization email use tos with optional filtering
   */
  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('emailOrgId') emailOrgId?: string,
    @Query('useTo') useTo?: string,
    @Query('isActiv') isActiv?: string,
    @Query('published') published?: string,
    @Query('isPublic') isPublic?: string,
    @Query('includeDeleted') includeDeleted?: string,
    @Query('orderBy') orderBy?: string,
  ) {
    const params: {
      skip?: number;
      take?: number;
      includeDeleted?: boolean;
      where?: Prisma.OrgEmailUseToWhereInput;
      orderBy?: Prisma.OrgEmailUseToOrderByWithRelationInput;
    } = {};

    if (skip) params.skip = parseInt(skip);
    if (take) params.take = parseInt(take);
    if (includeDeleted) params.includeDeleted = includeDeleted === 'true';

    // Build where clause
    const where: Prisma.OrgEmailUseToWhereInput = {};
    if (emailOrgId) where.emailOrgId = parseInt(emailOrgId);
    if (useTo) {
      where.useTo = {
        contains: useTo,
        mode: 'insensitive',
      };
    }
    if (isActiv !== undefined) where.isActiv = isActiv === 'true';
    if (published !== undefined) where.published = published === 'true';
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';

    if (Object.keys(where).length > 0) params.where = where;

    // Build orderBy clause
    if (orderBy) {
      const [field, direction] = orderBy.split(':');
      params.orderBy = { [field]: direction || 'asc' };
    }

    return this.orgEmailUseTosService.findAll(params);
  }

  /**
   * Get organization email use tos by email organization ID
   */
  @Get('email-org/:emailOrgId')
  async findByEmailOrg(
    @Param('emailOrgId', ParseIntPipe) emailOrgId: number,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.orgEmailUseTosService.findByEmailOrg(
      emailOrgId,
      includeDeleted === 'true'
    );
  }

  /**
   * Get organization email use tos by organization ID
   */
  @Get('organization/:orgId')
  async findByOrganization(
    @Param('orgId') orgId: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.orgEmailUseTosService.findByOrganization(
      orgId,
      includeDeleted === 'true'
    );
  }

  /**
   * Search organization email use tos by use to pattern
   */
  @Get('search')
  async searchByUseTo(
    @Query('pattern') pattern: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    if (!pattern) {
      throw new BadRequestException('Search pattern is required');
    }
    return this.orgEmailUseTosService.findByUseToPattern(
      pattern,
      includeDeleted === 'true'
    );
  }

  /**
   * Get active organization email use tos
   */
  @Get('active')
  async findActive(@Query('includeDeleted') includeDeleted?: string) {
    return this.orgEmailUseTosService.findActive(includeDeleted === 'true');
  }

  /**
   * Get inactive organization email use tos
   */
  @Get('inactive')
  async findInactive(@Query('includeDeleted') includeDeleted?: string) {
    return this.orgEmailUseTosService.findInactive(includeDeleted === 'true');
  }

  /**
   * Get published use tos by email organization
   */
  @Get('email-org/:emailOrgId/published')
  async getPublishedByEmailOrg(@Param('emailOrgId', ParseIntPipe) emailOrgId: number) {
    return this.orgEmailUseTosService.getPublishedByEmailOrg(emailOrgId);
  }

  /**
   * Get all public use tos
   */
  @Get('public')
  async getPublicUseTos() {
    return this.orgEmailUseTosService.getPublicUseTos();
  }

  /**
   * Get unique use to values
   */
  @Get('unique-use-tos')
  async getUniqueUseTos() {
    return {
      useTos: await this.orgEmailUseTosService.getUniqueUseTos(),
    };
  }

  /**
   * Get organization email use to statistics
   */
  @Get('statistics')
  async getStatistics() {
    return this.orgEmailUseTosService.getStatistics();
  }

  /**
   * Get organization email use to count
   */
  @Get('count')
  async getCount(
    @Query('emailOrgId') emailOrgId?: string,
    @Query('useTo') useTo?: string,
    @Query('isActiv') isActiv?: string,
    @Query('published') published?: string,
    @Query('isPublic') isPublic?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const where: Prisma.OrgEmailUseToWhereInput = {};
    if (emailOrgId) where.emailOrgId = parseInt(emailOrgId);
    if (useTo) {
      where.useTo = {
        contains: useTo,
        mode: 'insensitive',
      };
    }
    if (isActiv !== undefined) where.isActiv = isActiv === 'true';
    if (published !== undefined) where.published = published === 'true';
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';

    return {
      count: await this.orgEmailUseTosService.count(where, includeDeleted === 'true'),
    };
  }

  /**
   * Get a single organization email use to by ID
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.orgEmailUseTosService.findOneOrThrow(id, includeDeleted === 'true');
  }

  /**
   * Update an organization email use to
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateOrgEmailUseToDto: Prisma.OrgEmailUseToUpdateInput,
  ) {
    return this.orgEmailUseTosService.update(id, updateOrgEmailUseToDto);
  }

  /**
   * Bulk update organization email use tos
   */
  @Patch('bulk/update')
  async bulkUpdate(
    @Body(ValidationPipe) bulkUpdateDto: {
      where: Prisma.OrgEmailUseToWhereInput;
      data: Prisma.OrgEmailUseToUpdateInput;
    },
  ) {
    return this.orgEmailUseTosService.bulkUpdate(bulkUpdateDto.where, bulkUpdateDto.data);
  }

  /**
   * Bulk activate organization email use tos
   */
  @Patch('bulk/activate')
  async bulkActivate(
    @Body(ValidationPipe) bulkActivateDto: { where: Prisma.OrgEmailUseToWhereInput },
  ) {
    return this.orgEmailUseTosService.bulkActivate(bulkActivateDto.where);
  }

  /**
   * Bulk deactivate organization email use tos
   */
  @Patch('bulk/deactivate')
  async bulkDeactivate(
    @Body(ValidationPipe) bulkDeactivateDto: { where: Prisma.OrgEmailUseToWhereInput },
  ) {
    return this.orgEmailUseTosService.bulkDeactivate(bulkDeactivateDto.where);
  }

  /**
   * Toggle published status
   */
  @Patch(':id/toggle-published')
  async togglePublished(@Param('id', ParseIntPipe) id: number) {
    return this.orgEmailUseTosService.togglePublished(id);
  }

  /**
   * Toggle public visibility
   */
  @Patch(':id/toggle-public')
  async togglePublic(@Param('id', ParseIntPipe) id: number) {
    return this.orgEmailUseTosService.togglePublic(id);
  }

  /**
   * Toggle active status
   */
  @Patch(':id/toggle-active')
  async toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.orgEmailUseTosService.toggleActive(id);
  }

  /**
   * Soft delete an organization email use to
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.orgEmailUseTosService.remove(id);
  }

  /**
   * Restore a soft-deleted organization email use to
   */
  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.orgEmailUseTosService.restore(id);
  }

  /**
   * Permanently delete an organization email use to
   */
  @Delete(':id/hard')
  async hardDelete(@Param('id', ParseIntPipe) id: number) {
    await this.orgEmailUseTosService.hardDelete(id);
    return { message: 'Organization email use to permanently deleted' };
  }

  /**
   * Bulk soft delete organization email use tos
   */
  @Delete('bulk')
  async bulkDelete(
    @Body(ValidationPipe) bulkDeleteDto: { where: Prisma.OrgEmailUseToWhereInput },
  ) {
    return this.orgEmailUseTosService.bulkDelete(bulkDeleteDto.where);
  }

  /**
   * Validate use to data
   */
  @Post('validate')
  async validateUseTo(
    @Body(ValidationPipe) validateDto: {
      useTo: string;
      emailOrgId: number;
    },
  ) {
    return this.orgEmailUseTosService.validateUseToData(
      validateDto.useTo,
      validateDto.emailOrgId
    );
  }
}
