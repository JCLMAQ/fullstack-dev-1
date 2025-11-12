import { Prisma, TodoState } from '@db/prisma';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Patch,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { TodosService } from './todos.service';

// Helper pour récupérer le message d'erreur
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

@Controller('todos')
export class TodosController {
  constructor(private todosService: TodosService) {}

  /**
   * Récupère tous les todos avec pagination et filtres
   */
  @Get()
  async getAllTodos(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('published') published?: string,
    @Query('search') search?: string,
    @Query('state') state?: string,
    @Query('orgId') orgId?: string,
    @Query('ownerId') ownerId?: string
  ) {
    try {
      const params: {
        skip?: number;
        take?: number;
        where?: Prisma.TodoWhereInput;
        orderBy?: Prisma.TodoOrderByWithRelationInput;
        include?: Prisma.TodoInclude;
      } = {
        include: {
          owner: true,
          org: true,
          mainTodo: true,
          Users: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          orderTodo: 'asc',
        },
      };

      if (skip) params.skip = parseInt(skip);
      if (take) params.take = parseInt(take);

      // Construction des filtres
      const where: Prisma.TodoWhereInput = {
        isDeleted: 0,
      };

      if (published !== undefined) {
        where.published = published === 'true';
      }

      if (state) {
        where.todoState = state as TodoState;
      }

      if (orgId) {
        where.orgId = orgId;
      }

      if (ownerId) {
        where.ownerId = ownerId;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ];
      }

      params.where = where;

      const todos = await this.todosService.findAll(params);
      const total = await this.todosService.count(where);

      return {
        data: todos,
        total,
        skip: parseInt(skip || '0'),
        take: parseInt(take || '10'),
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des todos: ${getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère un todo par son ID
   */
  @Get(':id')
  async getTodoById(@Param('id') id: string) {
    try {
      const todo = await this.todosService.findOneWithRelations(
        { id },
        {
          owner: true,
          org: true,
          mainTodo: true,
          SubTodos: {
            include: {
              owner: true,
              Users: {
                include: {
                  user: true,
                },
              },
            },
          },
          Users: {
            include: {
              user: true,
            },
          },
          groups: true,
          Tasks: {
            include: {
              owner: true,
            },
          },
        }
      );

      if (!todo) {
        throw new HttpException('Todo non trouvé', HttpStatus.NOT_FOUND);
      }

      return todo;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la récupération du todo: ${getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Crée un nouveau todo
   */
  @Post()
  async createTodo(@Body() createTodoDto: Prisma.TodoCreateInput) {
    try {
      const todo = await this.todosService.create(createTodoDto);
      return todo;
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la création du todo: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Met à jour un todo
   */
  @Put(':id')
  async updateTodo(
    @Param('id') id: string,
    @Body() updateTodoDto: Prisma.TodoUpdateInput
  ) {
    try {
      const existingTodo = await this.todosService.findOne({ id });
      if (!existingTodo) {
        throw new HttpException('Todo non trouvé', HttpStatus.NOT_FOUND);
      }

      const todo = await this.todosService.update({
        where: { id },
        data: updateTodoDto,
      });
      return todo;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la mise à jour du todo: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Suppression logique d'un todo
   */
  @Delete(':id')
  async removeTodo(@Param('id') id: string) {
    try {
      const existingTodo = await this.todosService.findOne({ id });
      if (!existingTodo) {
        throw new HttpException('Todo non trouvé', HttpStatus.NOT_FOUND);
      }

      const todo = await this.todosService.remove({ id });
      return {
        message: 'Todo supprimé avec succès',
        todo,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la suppression du todo: ${getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère les sous-todos d'un todo principal
   */
  @Get(':id/subtodos')
  async getSubTodos(@Param('id') id: string) {
    try {
      const mainTodo = await this.todosService.findOne({ id });
      if (!mainTodo) {
        throw new HttpException('Todo principal non trouvé', HttpStatus.NOT_FOUND);
      }

      const subTodos = await this.todosService.findSubTodos(id);
      return subTodos;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la récupération des sous-todos: ${getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère les todos par état
   */
  @Get('state/:state')
  async getTodosByState(
    @Param('state') state: string,
    @Query('orgId') orgId?: string
  ) {
    try {
      if (!Object.values(TodoState).includes(state as TodoState)) {
        throw new HttpException('État invalide', HttpStatus.BAD_REQUEST);
      }

      const todos = await this.todosService.findByState(state as TodoState, orgId);
      return todos;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la récupération des todos par état: ${getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère les todos assignés à un utilisateur
   */
  @Get('user/:userId')
  async getTodosByUser(@Param('userId') userId: string) {
    try {
      const todos = await this.todosService.findByUser(userId);
      return todos;
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des todos de l'utilisateur: ${getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Récupère les todos d'une organisation
   */
  @Get('organization/:orgId')
  async getTodosByOrganization(@Param('orgId') orgId: string) {
    try {
      const todos = await this.todosService.findByOrganization(orgId);
      return todos;
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des todos de l'organisation: ${getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Change l'état d'un todo
   */
  @Patch(':id/state')
  async changeTodoState(
    @Param('id') id: string,
    @Body() stateDto: { state: TodoState }
  ) {
    try {
      const existingTodo = await this.todosService.findOne({ id });
      if (!existingTodo) {
        throw new HttpException('Todo non trouvé', HttpStatus.NOT_FOUND);
      }

      if (!Object.values(TodoState).includes(stateDto.state)) {
        throw new HttpException('État invalide', HttpStatus.BAD_REQUEST);
      }

      const todo = await this.todosService.changeState(id, stateDto.state);
      return todo;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors du changement d'état: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Assigne un utilisateur à un todo
   */
  @Post(':id/assign/:userId')
  async assignUserToTodo(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() assignDto?: { comment?: string }
  ) {
    try {
      const existingTodo = await this.todosService.findOne({ id });
      if (!existingTodo) {
        throw new HttpException('Todo non trouvé', HttpStatus.NOT_FOUND);
      }

      const assignment = await this.todosService.assignUser(
        id,
        userId,
        assignDto?.comment
      );
      return {
        message: 'Utilisateur assigné avec succès',
        assignment,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de l'assignation: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Désassigne un utilisateur d'un todo
   */
  @Delete(':id/assign/:userId')
  async unassignUserFromTodo(
    @Param('id') id: string,
    @Param('userId') userId: string
  ) {
    try {
      const existingTodo = await this.todosService.findOne({ id });
      if (!existingTodo) {
        throw new HttpException('Todo non trouvé', HttpStatus.NOT_FOUND);
      }

      await this.todosService.unassignUser(id, userId);
      return {
        message: 'Utilisateur désassigné avec succès',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la désassignation: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
