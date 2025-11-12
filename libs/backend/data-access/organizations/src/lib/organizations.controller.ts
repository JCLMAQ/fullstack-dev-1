import * as Prisma from '@db/prisma';
import { Organization, User } from '@db/prisma';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Post,
    Put,
    Query
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';

// Type pour une organisation avec ses membres
type OrganizationWithMembers = Organization & {
  Members: User[];
};

@Controller('organizations')
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  /**
   * Récupère toutes les organisations avec pagination et filtres optionnels
   */
  @Get()
  async getOrganizations(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('orderBy') orderBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('published') published?: string,
    @Query('isPublic') isPublic?: string,
    @Query('mainOrgId') mainOrgId?: string,
    @Query('includeMembers') includeMembers?: string,
    @Query('includePosts') includePosts?: string,
    @Query('includeGroups') includeGroups?: string
  ): Promise<Organization[]> {
    try {
      const params: {
        skip?: number;
        take?: number;
        where?: Prisma.OrganizationWhereInput;
        orderBy?: Prisma.OrganizationOrderByWithRelationInput;
        include?: Prisma.OrganizationInclude;
      } = {};

      // Pagination
      if (skip) params.skip = parseInt(skip);
      if (take) params.take = parseInt(take);

      // Construction des filtres
      const whereConditions: Prisma.OrganizationWhereInput = {};

      // Filtrage par recherche textuelle
      if (search) {
        whereConditions.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { emailITAdmin: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Filtrage par statut de publication
      if (published !== undefined) {
        whereConditions.published = published === 'true';
      }

      // Filtrage par visibilité publique
      if (isPublic !== undefined) {
        whereConditions.isPublic = isPublic === 'true';
      }

      // Filtrage par organisation parent
      if (mainOrgId) {
        whereConditions.mainOrgId = mainOrgId;
      }

      // Exclure les organisations supprimées par défaut
      whereConditions.isDeleted = 0;

      params.where = whereConditions;

      // Inclusions optionnelles
      const include: Prisma.OrganizationInclude = {};
      if (includeMembers === 'true') include.Members = true;
      if (includePosts === 'true') include.Posts = true;
      if (includeGroups === 'true') include.Groups = true;
      if (Object.keys(include).length > 0) params.include = include;

      // Tri
      if (orderBy) {
        const order = sortOrder || 'asc';
        switch (orderBy) {
          case 'name':
            params.orderBy = { name: order };
            break;
          case 'createdAt':
            params.orderBy = { createdAt: order };
            break;
          case 'updatedAt':
            params.orderBy = { updatedAt: order };
            break;
          case 'numSeq':
            params.orderBy = { numSeq: order };
            break;
          default:
            params.orderBy = { name: 'asc' };
        }
      } else {
        params.orderBy = { name: 'asc' };
      }

      return await this.organizationsService.organizations(params);
    } catch {
      throw new HttpException(
        'Erreur lors de la récupération des organisations',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère une organisation par son ID
   */
  @Get(':id')
  async getOrganization(
    @Param('id') id: string,
    @Query('includeMembers') includeMembers?: string,
    @Query('includePosts') includePosts?: string,
    @Query('includeGroups') includeGroups?: string,
    @Query('includeFiles') includeFiles?: string,
    @Query('includeTasks') includeTasks?: string,
    @Query('includeTodos') includeTodos?: string,
    @Query('includeOrgEmails') includeOrgEmails?: string,
    @Query('includeOrgDomains') includeOrgDomains?: string,
    @Query('includeSubOrganizations') includeSubOrganizations?: string,
    @Query('includeMainOrganization') includeMainOrganization?: string
  ): Promise<Organization> {
    try {
      const includeOptions = {
        members: includeMembers === 'true',
        posts: includePosts === 'true',
        groups: includeGroups === 'true',
        files: includeFiles === 'true',
        tasks: includeTasks === 'true',
        todos: includeTodos === 'true',
        orgEmails: includeOrgEmails === 'true',
        orgDomains: includeOrgDomains === 'true',
        subOrganizations: includeSubOrganizations === 'true',
        mainOrganization: includeMainOrganization === 'true'
      };

      const organization = await this.organizationsService.getOrganizationWithRelations(
        { id },
        includeOptions
      );

      if (!organization) {
        throw new HttpException(
          'Organisation non trouvée',
          HttpStatus.NOT_FOUND
        );
      }

      return organization;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la récupération de l\'organisation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère une organisation par son nom
   */
  @Get('name/:name')
  async getOrganizationByName(@Param('name') name: string): Promise<Organization> {
    try {
      const organization = await this.organizationsService.organization({ name });

      if (!organization) {
        throw new HttpException(
          'Organisation non trouvée',
          HttpStatus.NOT_FOUND
        );
      }

      return organization;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la récupération de l\'organisation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère les organisations racines (sans parent)
   */
  @Get('root/all')
  async getRootOrganizations(): Promise<Organization[]> {
    try {
      return await this.organizationsService.getRootOrganizations();
    } catch {
      throw new HttpException(
        'Erreur lors de la récupération des organisations racines',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère les sous-organisations d'une organisation parent
   */
  @Get(':id/sub-organizations')
  async getSubOrganizations(@Param('id') id: string): Promise<Organization[]> {
    try {
      // Vérifier que l'organisation parent existe
      const parentOrg = await this.organizationsService.organization({ id });
      if (!parentOrg) {
        throw new HttpException(
          'Organisation parent non trouvée',
          HttpStatus.NOT_FOUND
        );
      }

      return await this.organizationsService.getSubOrganizations(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la récupération des sous-organisations',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère les membres d'une organisation
   */
  @Get(':id/members')
  async getOrganizationMembers(@Param('id') id: string) {
    try {
      const organization = await this.organizationsService.getOrganizationWithRelations(
        { id },
        { members: true }
      );

      if (!organization) {
        throw new HttpException(
          'Organisation non trouvée',
          HttpStatus.NOT_FOUND
        );
      }

      return (organization as OrganizationWithMembers).Members || [];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la récupération des membres de l\'organisation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère les posts d'une organisation
   */
  @Get(':id/posts')
  async getOrganizationPosts(
    @Param('id') id: string
  ) {
    try {
      const organization = await this.organizationsService.organization({ id });
      if (!organization) {
        throw new HttpException(
          'Organisation non trouvée',
          HttpStatus.NOT_FOUND
        );
      }

      // Note: Cette fonctionnalité nécessiterait une intégration avec le service posts
      // ou une modification pour utiliser le service posts avec filtrage par orgId
      throw new HttpException(
        'Fonctionnalité non implémentée - nécessite l\'intégration avec le service posts',
        HttpStatus.NOT_IMPLEMENTED
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la récupération des posts de l\'organisation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Crée une nouvelle organisation
   */
  @Post()
  async createOrganization(@Body() organizationData: Prisma.OrganizationCreateInput): Promise<Organization> {
    try {
      // Validation de base
      if (!organizationData.name || organizationData.name.trim() === '') {
        throw new HttpException(
          'Le nom de l\'organisation est requis',
          HttpStatus.BAD_REQUEST
        );
      }

      if (!organizationData.emailITAdmin) {
        throw new HttpException(
          'L\'email de l\'administrateur IT est requis',
          HttpStatus.BAD_REQUEST
        );
      }

      // Vérifier si l'organisation existe déjà
      const existingOrg = await this.organizationsService.organization({
        name: organizationData.name
      });
      if (existingOrg) {
        throw new HttpException(
          'Une organisation avec ce nom existe déjà',
          HttpStatus.CONFLICT
        );
      }

      return await this.organizationsService.createOrganization(organizationData);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la création de l\'organisation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Met à jour une organisation
   */
  @Put(':id')
  async updateOrganization(
    @Param('id') id: string,
    @Body() organizationData: Prisma.OrganizationUpdateInput
  ): Promise<Organization> {
    try {
      // Vérifier que l'organisation existe
      const existingOrg = await this.organizationsService.organization({ id });
      if (!existingOrg) {
        throw new HttpException(
          'Organisation non trouvée',
          HttpStatus.NOT_FOUND
        );
      }

      // Si le nom est modifié, vérifier qu'il n'existe pas déjà
      if (organizationData.name && organizationData.name !== existingOrg.name) {
        const orgWithName = await this.organizationsService.organization({
          name: organizationData.name as string
        });
        if (orgWithName) {
          throw new HttpException(
            'Une organisation avec ce nom existe déjà',
            HttpStatus.CONFLICT
          );
        }
      }

      return await this.organizationsService.updateOrganization({
        where: { id },
        data: organizationData
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la mise à jour de l\'organisation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Supprime une organisation (suppression logique)
   */
  @Delete(':id')
  async deleteOrganization(@Param('id') id: string): Promise<Organization> {
    try {
      // Vérifier que l'organisation existe
      const existingOrg = await this.organizationsService.organization({ id });
      if (!existingOrg) {
        throw new HttpException(
          'Organisation non trouvée',
          HttpStatus.NOT_FOUND
        );
      }

      // Vérifier s'il y a des sous-organisations
      const subOrgs = await this.organizationsService.getSubOrganizations(id);
      if (subOrgs.length > 0) {
        throw new HttpException(
          'Impossible de supprimer une organisation qui a des sous-organisations',
          HttpStatus.BAD_REQUEST
        );
      }

      // Suppression logique
      return await this.organizationsService.updateOrganization({
        where: { id },
        data: {
          isDeleted: 1,
          isDeletedDT: new Date()
        }
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la suppression de l\'organisation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Supprime définitivement une organisation (suppression physique)
   */
  @Delete(':id/permanent')
  async permanentlyDeleteOrganization(@Param('id') id: string): Promise<Organization> {
    try {
      // Vérifier que l'organisation existe
      const existingOrg = await this.organizationsService.organization({ id });
      if (!existingOrg) {
        throw new HttpException(
          'Organisation non trouvée',
          HttpStatus.NOT_FOUND
        );
      }

      // Vérifier s'il y a des sous-organisations
      const subOrgs = await this.organizationsService.getSubOrganizations(id);
      if (subOrgs.length > 0) {
        throw new HttpException(
          'Impossible de supprimer définitivement une organisation qui a des sous-organisations',
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.organizationsService.deleteOrganization({ id });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la suppression définitive de l\'organisation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Publie une organisation
   */
  @Put(':id/publish')
  async publishOrganization(@Param('id') id: string): Promise<Organization> {
    try {
      const existingOrg = await this.organizationsService.organization({ id });
      if (!existingOrg) {
        throw new HttpException(
          'Organisation non trouvée',
          HttpStatus.NOT_FOUND
        );
      }

      return await this.organizationsService.updateOrganization({
        where: { id },
        data: { published: true }
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la publication de l\'organisation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Dépublie une organisation
   */
  @Put(':id/unpublish')
  async unpublishOrganization(@Param('id') id: string): Promise<Organization> {
    try {
      const existingOrg = await this.organizationsService.organization({ id });
      if (!existingOrg) {
        throw new HttpException(
          'Organisation non trouvée',
          HttpStatus.NOT_FOUND
        );
      }

      return await this.organizationsService.updateOrganization({
        where: { id },
        data: { published: false }
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la dépublication de l\'organisation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
