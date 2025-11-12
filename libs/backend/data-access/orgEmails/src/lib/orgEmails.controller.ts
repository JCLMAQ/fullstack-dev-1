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
import { OrgEmailsService } from './orgEmails.service';

@Controller('org-emails')
export class OrgEmailsController {
  constructor(private readonly orgEmailsService: OrgEmailsService) {}

  /**
   * Create a new organization email
   */
  @Post()
  async create(@Body(ValidationPipe) createOrgEmailDto: Prisma.OrgEmailCreateInput) {
    return this.orgEmailsService.create(createOrgEmailDto);
  }

  /**
   * Create multiple organization emails
   */
  @Post('bulk')
  async createMany(@Body(ValidationPipe) createOrgEmailsDto: { emails: Prisma.OrgEmailCreateInput[] }) {
    if (!createOrgEmailsDto.emails || createOrgEmailsDto.emails.length === 0) {
      throw new BadRequestException('At least one email is required');
    }
    return this.orgEmailsService.createMany(createOrgEmailsDto.emails);
  }

  /**
   * Get all organization emails with optional filtering
   */
  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('orgId') orgId?: string,
    @Query('email') email?: string,
    @Query('published') published?: string,
    @Query('isPublic') isPublic?: string,
    @Query('includeDeleted') includeDeleted?: string,
    @Query('orderBy') orderBy?: string,
  ) {
    const params: {
      skip?: number;
      take?: number;
      includeDeleted?: boolean;
      where?: Prisma.OrgEmailWhereInput;
      orderBy?: Prisma.OrgEmailOrderByWithRelationInput;
    } = {};

    if (skip) params.skip = parseInt(skip);
    if (take) params.take = parseInt(take);
    if (includeDeleted) params.includeDeleted = includeDeleted === 'true';

    // Build where clause
    const where: Prisma.OrgEmailWhereInput = {};
    if (orgId) where.orgId = orgId;
    if (email) {
      where.email = {
        contains: email,
        mode: 'insensitive',
      };
    }
    if (published !== undefined) where.published = published === 'true';
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';

    if (Object.keys(where).length > 0) params.where = where;

    // Build orderBy clause
    if (orderBy) {
      const [field, direction] = orderBy.split(':');
      params.orderBy = { [field]: direction || 'asc' };
    }

    return this.orgEmailsService.findAll(params);
  }

  /**
   * Get organization emails by organization ID
   */
  @Get('organization/:orgId')
  async findByOrganization(
    @Param('orgId') orgId: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.orgEmailsService.findByOrganization(
      orgId,
      includeDeleted === 'true'
    );
  }

  /**
   * Search organization emails by email pattern
   */
  @Get('search')
  async searchByEmail(
    @Query('pattern') pattern: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    if (!pattern) {
      throw new BadRequestException('Search pattern is required');
    }
    return this.orgEmailsService.findByEmailPattern(
      pattern,
      includeDeleted === 'true'
    );
  }

  /**
   * Get published emails by organization
   */
  @Get('organization/:orgId/published')
  async getPublishedByOrganization(@Param('orgId') orgId: string) {
    return this.orgEmailsService.getPublishedByOrganization(orgId);
  }

  /**
   * Get all public emails
   */
  @Get('public')
  async getPublicEmails() {
    return this.orgEmailsService.getPublicEmails();
  }

  /**
   * Get organization email statistics
   */
  @Get('statistics')
  async getStatistics() {
    return this.orgEmailsService.getStatistics();
  }

  /**
   * Get organization email count
   */
  @Get('count')
  async getCount(
    @Query('orgId') orgId?: string,
    @Query('published') published?: string,
    @Query('isPublic') isPublic?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const where: Prisma.OrgEmailWhereInput = {};
    if (orgId) where.orgId = orgId;
    if (published !== undefined) where.published = published === 'true';
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';

    return {
      count: await this.orgEmailsService.count(where, includeDeleted === 'true'),
    };
  }

  /**
   * Get a single organization email by ID
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.orgEmailsService.findOneOrThrow(id, includeDeleted === 'true');
  }

  /**
   * Update an organization email
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateOrgEmailDto: Prisma.OrgEmailUpdateInput,
  ) {
    return this.orgEmailsService.update(id, updateOrgEmailDto);
  }

  /**
   * Bulk update organization emails
   */
  @Patch('bulk/update')
  async bulkUpdate(
    @Body(ValidationPipe) bulkUpdateDto: {
      where: Prisma.OrgEmailWhereInput;
      data: Prisma.OrgEmailUpdateInput;
    },
  ) {
    return this.orgEmailsService.bulkUpdate(bulkUpdateDto.where, bulkUpdateDto.data);
  }

  /**
   * Toggle published status
   */
  @Patch(':id/toggle-published')
  async togglePublished(@Param('id', ParseIntPipe) id: number) {
    return this.orgEmailsService.togglePublished(id);
  }

  /**
   * Toggle public visibility
   */
  @Patch(':id/toggle-public')
  async togglePublic(@Param('id', ParseIntPipe) id: number) {
    return this.orgEmailsService.togglePublic(id);
  }

  /**
   * Soft delete an organization email
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.orgEmailsService.remove(id);
  }

  /**
   * Restore a soft-deleted organization email
   */
  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.orgEmailsService.restore(id);
  }

  /**
   * Permanently delete an organization email
   */
  @Delete(':id/hard')
  async hardDelete(@Param('id', ParseIntPipe) id: number) {
    await this.orgEmailsService.hardDelete(id);
    return { message: 'Organization email permanently deleted' };
  }

  /**
   * Bulk soft delete organization emails
   */
  @Delete('bulk')
  async bulkDelete(
    @Body(ValidationPipe) bulkDeleteDto: { where: Prisma.OrgEmailWhereInput },
  ) {
    return this.orgEmailsService.bulkDelete(bulkDeleteDto.where);
  }

  /**
   * Validate email data
   */
  @Post('validate')
  async validateEmail(
    @Body(ValidationPipe) validateDto: { email: string; orgId: string },
  ) {
    return this.orgEmailsService.validateEmailData(validateDto.email, validateDto.orgId);
  }
}
