import * as Prisma from '@db/prisma';
import { Comment } from '@db/prisma';
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
import { CommentsService } from './comments.service';

@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  /**
   * Récupère tous les commentaires avec pagination et filtres optionnels
   */
  @Get()
  async getComments(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('orderBy') orderBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('published') published?: string,
    @Query('isPublic') isPublic?: string,
    @Query('postId') postId?: string,
    @Query('authorId') authorId?: string
  ): Promise<Comment[]> {
    try {
      const params: {
        skip?: number;
        take?: number;
        where?: Prisma.CommentWhereInput;
        orderBy?: Prisma.CommentOrderByWithRelationInput;
      } = {};

      // Pagination
      if (skip) params.skip = parseInt(skip);
      if (take) params.take = parseInt(take);

      // Construction des filtres
      const whereConditions: Prisma.CommentWhereInput = {};

      // Filtrage par recherche textuelle
      if (search) {
        whereConditions.content = { contains: search, mode: 'insensitive' };
      }

      // Filtrage par statut de publication
      if (published !== undefined) {
        whereConditions.published = published === 'true';
      }

      // Filtrage par visibilité publique
      if (isPublic !== undefined) {
        whereConditions.isPublic = isPublic === 'true';
      }

      // Filtrage par post
      if (postId) {
        whereConditions.postId = postId;
      }

      // Filtrage par auteur
      if (authorId) {
        whereConditions.authorId = authorId;
      }

      // Exclure les commentaires supprimés par défaut
      whereConditions.isDeleted = 0;

      params.where = whereConditions;

      // Tri
      if (orderBy) {
        const order = sortOrder || 'desc';
        switch (orderBy) {
          case 'createdAt':
            params.orderBy = { createdAt: order };
            break;
          case 'updatedAt':
            params.orderBy = { updatedAt: order };
            break;
          case 'orderComment':
            params.orderBy = { orderComment: order };
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

      return await this.commentsService.comments(params);
    } catch {
      throw new HttpException(
        'Erreur lors de la récupération des commentaires',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère un commentaire par son ID
   */
  @Get(':id')
  async getComment(@Param('id') id: string): Promise<Comment> {
    try {
      const comment = await this.commentsService.comment({ id });

      if (!comment) {
        throw new HttpException(
          'Commentaire non trouvé',
          HttpStatus.NOT_FOUND
        );
      }

      return comment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la récupération du commentaire',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère les commentaires d'un post spécifique
   */
  @Get('post/:postId')
  async getCommentsByPost(
    @Param('postId') postId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('published') published?: string,
    @Query('orderBy') orderBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc'
  ): Promise<Comment[]> {
    try {
      const params: {
        skip?: number;
        take?: number;
        where?: Prisma.CommentWhereInput;
        orderBy?: Prisma.CommentOrderByWithRelationInput;
      } = {};

      if (skip) params.skip = parseInt(skip);
      if (take) params.take = parseInt(take);

      const whereConditions: Prisma.CommentWhereInput = {
        postId: postId,
        isDeleted: 0
      };

      if (published !== undefined) {
        whereConditions.published = published === 'true';
      }

      params.where = whereConditions;

      // Tri spécifique pour les commentaires d'un post
      if (orderBy) {
        const order = sortOrder || 'asc';
        switch (orderBy) {
          case 'createdAt':
            params.orderBy = { createdAt: order };
            break;
          case 'orderComment':
            params.orderBy = { orderComment: order };
            break;
          default:
            params.orderBy = { orderComment: 'asc' };
        }
      } else {
        params.orderBy = { orderComment: 'asc' };
      }

      return await this.commentsService.comments(params);
    } catch {
      throw new HttpException(
        'Erreur lors de la récupération des commentaires du post',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère les commentaires d'un auteur spécifique
   */
  @Get('author/:authorId')
  async getCommentsByAuthor(
    @Param('authorId') authorId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('published') published?: string
  ): Promise<Comment[]> {
    try {
      const params: {
        skip?: number;
        take?: number;
        where?: Prisma.CommentWhereInput;
        orderBy?: Prisma.CommentOrderByWithRelationInput;
      } = {};

      if (skip) params.skip = parseInt(skip);
      if (take) params.take = parseInt(take);

      const whereConditions: Prisma.CommentWhereInput = {
        authorId: authorId,
        isDeleted: 0
      };

      if (published !== undefined) {
        whereConditions.published = published === 'true';
      }

      params.where = whereConditions;
      params.orderBy = { createdAt: 'desc' };

      return await this.commentsService.comments(params);
    } catch {
      throw new HttpException(
        'Erreur lors de la récupération des commentaires de l\'auteur',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Crée un nouveau commentaire
   */
  @Post()
  async createComment(@Body() commentData: Prisma.CommentCreateInput): Promise<Comment> {
    try {
      // Validation de base
      if (!commentData.content || commentData.content.trim() === '') {
        throw new HttpException(
          'Le contenu du commentaire est requis',
          HttpStatus.BAD_REQUEST
        );
      }

      if (!commentData.post || !commentData.author) {
        throw new HttpException(
          'Le post et l\'auteur sont requis',
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.commentsService.createComment(commentData);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la création du commentaire',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Met à jour un commentaire
   */
  @Put(':id')
  async updateComment(
    @Param('id') id: string,
    @Body() commentData: Prisma.CommentUpdateInput
  ): Promise<Comment> {
    try {
      // Vérifier que le commentaire existe
      const existingComment = await this.commentsService.comment({ id });
      if (!existingComment) {
        throw new HttpException(
          'Commentaire non trouvé',
          HttpStatus.NOT_FOUND
        );
      }

      // Validation du contenu si fourni
      if (commentData.content && typeof commentData.content === 'string' && commentData.content.trim() === '') {
        throw new HttpException(
          'Le contenu du commentaire ne peut pas être vide',
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.commentsService.updateComment({
        where: { id },
        data: commentData
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la mise à jour du commentaire',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Supprime un commentaire (suppression logique)
   */
  @Delete(':id')
  async deleteComment(@Param('id') id: string): Promise<Comment> {
    try {
      // Vérifier que le commentaire existe
      const existingComment = await this.commentsService.comment({ id });
      if (!existingComment) {
        throw new HttpException(
          'Commentaire non trouvé',
          HttpStatus.NOT_FOUND
        );
      }

      // Suppression logique
      return await this.commentsService.updateComment({
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
        'Erreur lors de la suppression du commentaire',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Supprime définitivement un commentaire (suppression physique)
   */
  @Delete(':id/permanent')
  async permanentlyDeleteComment(@Param('id') id: string): Promise<Comment> {
    try {
      // Vérifier que le commentaire existe
      const existingComment = await this.commentsService.comment({ id });
      if (!existingComment) {
        throw new HttpException(
          'Commentaire non trouvé',
          HttpStatus.NOT_FOUND
        );
      }

      return await this.commentsService.deleteComment({ id });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la suppression définitive du commentaire',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Publie un commentaire
   */
  @Put(':id/publish')
  async publishComment(@Param('id') id: string): Promise<Comment> {
    try {
      const existingComment = await this.commentsService.comment({ id });
      if (!existingComment) {
        throw new HttpException(
          'Commentaire non trouvé',
          HttpStatus.NOT_FOUND
        );
      }

      return await this.commentsService.updateComment({
        where: { id },
        data: { published: true }
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la publication du commentaire',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Dépublie un commentaire
   */
  @Put(':id/unpublish')
  async unpublishComment(@Param('id') id: string): Promise<Comment> {
    try {
      const existingComment = await this.commentsService.comment({ id });
      if (!existingComment) {
        throw new HttpException(
          'Commentaire non trouvé',
          HttpStatus.NOT_FOUND
        );
      }

      return await this.commentsService.updateComment({
        where: { id },
        data: { published: false }
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la dépublication du commentaire',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Met à jour l'ordre d'affichage d'un commentaire
   */
  @Put(':id/order')
  async updateCommentOrder(
    @Param('id') id: string,
    @Body('orderComment') orderComment: number
  ): Promise<Comment> {
    try {
      const existingComment = await this.commentsService.comment({ id });
      if (!existingComment) {
        throw new HttpException(
          'Commentaire non trouvé',
          HttpStatus.NOT_FOUND
        );
      }

      if (typeof orderComment !== 'number' || orderComment < 0) {
        throw new HttpException(
          'L\'ordre doit être un nombre positif',
          HttpStatus.BAD_REQUEST
        );
      }

      return await this.commentsService.updateComment({
        where: { id },
        data: { orderComment }
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la mise à jour de l\'ordre du commentaire',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
