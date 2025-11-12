import * as Prisma from '@db/prisma';
import { Post as PostModel } from '@db/prisma';
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
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  /**
   * Récupère tous les posts avec pagination et filtres optionnels
   */
  @Get()
  async getPosts(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('orderBy') orderBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('published') published?: string,
    @Query('isPublic') isPublic?: string,
    @Query('ownerId') ownerId?: string,
    @Query('orgId') orgId?: string
  ): Promise<PostModel[]> {
    try {
      const params: {
        skip?: number;
        take?: number;
        where?: Prisma.PostWhereInput;
        orderBy?: Prisma.PostOrderByWithRelationInput;
      } = {};

      // Pagination
      if (skip) params.skip = parseInt(skip);
      if (take) params.take = parseInt(take);

      // Construction des filtres
      const whereConditions: Prisma.PostWhereInput = {};

      // Filtrage par recherche textuelle
      if (search) {
        whereConditions.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
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

      // Filtrage par propriétaire
      if (ownerId) {
        whereConditions.ownerId = ownerId;
      }

      // Filtrage par organisation
      if (orgId) {
        whereConditions.orgId = orgId;
      }

      // Exclure les posts supprimés par défaut
      whereConditions.isDeleted = 0;

      params.where = whereConditions;

      // Tri
      if (orderBy) {
        const order = sortOrder || 'desc';
        switch (orderBy) {
          case 'title':
            params.orderBy = { title: order };
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
            params.orderBy = { createdAt: 'desc' };
        }
      } else {
        params.orderBy = { createdAt: 'desc' };
      }

      return await this.postsService.posts(params);
    } catch {
      throw new HttpException(
        'Erreur lors de la récupération des posts',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère un post par son ID
   */
  @Get(':id')
  async getPost(@Param('id') id: string): Promise<PostModel> {
    try {
      const post = await this.postsService.post({ id });

      if (!post) {
        throw new HttpException(
          'Post non trouvé',
          HttpStatus.NOT_FOUND
        );
      }

      return post;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la récupération du post',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère les posts d'un utilisateur spécifique
   */
  @Get('user/:userId')
  async getPostsByUser(
    @Param('userId') userId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('published') published?: string
  ): Promise<PostModel[]> {
    try {
      const params: {
        skip?: number;
        take?: number;
        where?: Prisma.PostWhereInput;
        orderBy?: Prisma.PostOrderByWithRelationInput;
      } = {};

      if (skip) params.skip = parseInt(skip);
      if (take) params.take = parseInt(take);

      const whereConditions: Prisma.PostWhereInput = {
        ownerId: userId,
        isDeleted: 0
      };

      if (published !== undefined) {
        whereConditions.published = published === 'true';
      }

      params.where = whereConditions;
      params.orderBy = { createdAt: 'desc' };

      return await this.postsService.posts(params);
    } catch {
      throw new HttpException(
        'Erreur lors de la récupération des posts de l\'utilisateur',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère les posts d'une organisation spécifique
   */
  @Get('organization/:orgId')
  async getPostsByOrganization(
    @Param('orgId') orgId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('published') published?: string
  ): Promise<PostModel[]> {
    try {
      const params: {
        skip?: number;
        take?: number;
        where?: Prisma.PostWhereInput;
        orderBy?: Prisma.PostOrderByWithRelationInput;
      } = {};

      if (skip) params.skip = parseInt(skip);
      if (take) params.take = parseInt(take);

      const whereConditions: Prisma.PostWhereInput = {
        orgId: orgId,
        isDeleted: 0
      };

      if (published !== undefined) {
        whereConditions.published = published === 'true';
      }

      params.where = whereConditions;
      params.orderBy = { createdAt: 'desc' };

      return await this.postsService.posts(params);
    } catch {
      throw new HttpException(
        'Erreur lors de la récupération des posts de l\'organisation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Crée un nouveau post
   */
  @Post()
  async createPost(@Body() postData: Prisma.PostCreateInput): Promise<PostModel> {
    try {
      // Validation de base
      if (!postData.title) {
        throw new HttpException(
          'Le titre est requis',
          HttpStatus.BAD_REQUEST
        );
      }

      if (!postData.owner || !postData.org) {
        throw new HttpException(
          'Le propriétaire et l\'organisation sont requis',
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.postsService.createPost(postData);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la création du post',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Met à jour un post
   */
  @Put(':id')
  async updatePost(
    @Param('id') id: string,
    @Body() postData: Prisma.PostUpdateInput
  ): Promise<PostModel> {
    try {
      // Vérifier que le post existe
      const existingPost = await this.postsService.post({ id });
      if (!existingPost) {
        throw new HttpException(
          'Post non trouvé',
          HttpStatus.NOT_FOUND
        );
      }

      return await this.postsService.updatePost({
        where: { id },
        data: postData
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la mise à jour du post',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Supprime un post (suppression logique)
   */
  @Delete(':id')
  async deletePost(@Param('id') id: string): Promise<PostModel> {
    try {
      // Vérifier que le post existe
      const existingPost = await this.postsService.post({ id });
      if (!existingPost) {
        throw new HttpException(
          'Post non trouvé',
          HttpStatus.NOT_FOUND
        );
      }

      // Suppression logique
      return await this.postsService.updatePost({
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
        'Erreur lors de la suppression du post',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Supprime définitivement un post (suppression physique)
   */
  @Delete(':id/permanent')
  async permanentlyDeletePost(@Param('id') id: string): Promise<PostModel> {
    try {
      // Vérifier que le post existe
      const existingPost = await this.postsService.post({ id });
      if (!existingPost) {
        throw new HttpException(
          'Post non trouvé',
          HttpStatus.NOT_FOUND
        );
      }

      return await this.postsService.deletePost({ id });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la suppression définitive du post',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Publie un post
   */
  @Put(':id/publish')
  async publishPost(@Param('id') id: string): Promise<PostModel> {
    try {
      const existingPost = await this.postsService.post({ id });
      if (!existingPost) {
        throw new HttpException(
          'Post non trouvé',
          HttpStatus.NOT_FOUND
        );
      }

      return await this.postsService.updatePost({
        where: { id },
        data: { published: true }
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la publication du post',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Dépublie un post
   */
  @Put(':id/unpublish')
  async unpublishPost(@Param('id') id: string): Promise<PostModel> {
    try {
      const existingPost = await this.postsService.post({ id });
      if (!existingPost) {
        throw new HttpException(
          'Post non trouvé',
          HttpStatus.NOT_FOUND
        );
      }

      return await this.postsService.updatePost({
        where: { id },
        data: { published: false }
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la dépublication du post',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère les commentaires d'un post
   */
  @Get(':id/comments')
  async getPostComments(@Param('id') id: string) {
    try {
      const post = await this.postsService.post({ id });
      if (!post) {
        throw new HttpException(
          'Post non trouvé',
          HttpStatus.NOT_FOUND
        );
      }

      // Note: Cette fonctionnalité nécessiterait une intégration avec le service comments
      // ou une modification du service posts pour inclure les relations comments
      throw new HttpException(
        'Fonctionnalité non implémentée - nécessite l\'intégration avec le service comments',
        HttpStatus.NOT_IMPLEMENTED
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la récupération des commentaires du post',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère les likes d'un post
   */
  @Get(':id/likes')
  async getPostLikes(@Param('id') id: string) {
    try {
      const post = await this.postsService.post({ id });
      if (!post) {
        throw new HttpException(
          'Post non trouvé',
          HttpStatus.NOT_FOUND
        );
      }

      // Note: Cette fonctionnalité nécessiterait une modification du service
      // pour inclure les relations PostLike
      throw new HttpException(
        'Fonctionnalité non implémentée - nécessite l\'extension du service pour inclure les likes',
        HttpStatus.NOT_IMPLEMENTED
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la récupération des likes du post',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
