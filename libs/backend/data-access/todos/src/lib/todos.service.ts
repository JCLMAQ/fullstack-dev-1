import { Prisma, Todo, TodoState } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaClientService) {}

  /**
   * Récupère tous les todos avec pagination et filtres
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.TodoWhereUniqueInput;
    where?: Prisma.TodoWhereInput;
    orderBy?: Prisma.TodoOrderByWithRelationInput;
    include?: Prisma.TodoInclude;
  } = {}) {
    const { skip, take, cursor, where, orderBy, include } = params;
    return this.prisma.todo.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include,
    });
  }

  /**
   * Récupère un todo par ID
   */
  async findOne(
    todoWhereUniqueInput: Prisma.TodoWhereUniqueInput,
    include?: Prisma.TodoInclude
  ): Promise<Todo | null> {
    return this.prisma.todo.findUnique({
      where: todoWhereUniqueInput,
      include,
    });
  }

  /**
   * Récupère un todo avec ses relations
   */
  async findOneWithRelations(
    where: Prisma.TodoWhereUniqueInput,
    include: Prisma.TodoInclude
  ) {
    return this.prisma.todo.findUnique({
      where,
      include,
    });
  }

  /**
   * Crée un nouveau todo
   */
  async create(data: Prisma.TodoCreateInput): Promise<Todo> {
    return this.prisma.todo.create({
      data,
      include: {
        owner: true,
        org: true,
        mainTodo: true,
      },
    });
  }

  /**
   * Met à jour un todo
   */
  async update(params: {
    where: Prisma.TodoWhereUniqueInput;
    data: Prisma.TodoUpdateInput;
    include?: Prisma.TodoInclude;
  }): Promise<Todo> {
    const { where, data, include } = params;
    return this.prisma.todo.update({
      data,
      where,
      include: include || {
        owner: true,
        org: true,
        mainTodo: true,
        SubTodos: true,
      },
    });
  }

  /**
   * Suppression logique d'un todo
   */
  async remove(where: Prisma.TodoWhereUniqueInput): Promise<Todo> {
    return this.prisma.todo.update({
      where,
      data: {
        isDeleted: 1,
        isDeletedDT: new Date(),
      },
    });
  }

  /**
   * Suppression définitive d'un todo
   */
  async delete(where: Prisma.TodoWhereUniqueInput): Promise<Todo> {
    return this.prisma.todo.delete({
      where,
    });
  }

  /**
   * Récupère les sous-todos d'un todo principal
   */
  async findSubTodos(mainTodoId: string) {
    return this.prisma.todo.findMany({
      where: {
        mainTodoId,
        isDeleted: 0,
      },
      include: {
        owner: true,
        Users: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        orderTodo: 'asc',
      },
    });
  }

  /**
   * Récupère les todos par état
   */
  async findByState(state: TodoState, orgId?: string) {
    const where: Prisma.TodoWhereInput = {
      todoState: state,
      isDeleted: 0,
    };

    if (orgId) {
      where.orgId = orgId;
    }

    return this.prisma.todo.findMany({
      where,
      include: {
        owner: true,
        org: true,
        Users: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        orderTodo: 'asc',
      },
    });
  }

  /**
   * Récupère les todos assignés à un utilisateur
   */
  async findByUser(userId: string) {
    return this.prisma.todo.findMany({
      where: {
        Users: {
          some: {
            userId,
            isAssigned: true,
          },
        },
        isDeleted: 0,
      },
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
    });
  }

  /**
   * Récupère les todos d'une organisation
   */
  async findByOrganization(orgId: string) {
    return this.prisma.todo.findMany({
      where: {
        orgId,
        isDeleted: 0,
      },
      include: {
        owner: true,
        Users: {
          include: {
            user: true,
          },
        },
        SubTodos: {
          include: {
            owner: true,
          },
        },
      },
      orderBy: {
        orderTodo: 'asc',
      },
    });
  }

  /**
   * Change l'état d'un todo
   */
  async changeState(todoId: string, newState: TodoState): Promise<Todo> {
    return this.prisma.todo.update({
      where: { id: todoId },
      data: { todoState: newState },
      include: {
        owner: true,
        org: true,
        Users: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  /**
   * Assigne un utilisateur à un todo
   */
  async assignUser(todoId: string, userId: string, comment?: string) {
    return this.prisma.userTodoLink.create({
      data: {
        todoId,
        userId,
        isAssigned: true,
        isAuthor: false,
        comment: comment || '',
      },
      include: {
        user: true,
        todo: true,
      },
    });
  }

  /**
   * Désassigne un utilisateur d'un todo
   */
  async unassignUser(todoId: string, userId: string) {
    return this.prisma.userTodoLink.delete({
      where: {
        userId_todoId: {
          userId,
          todoId,
        },
      },
    });
  }

  /**
   * Compte le nombre de todos par filtre
   */
  async count(where?: Prisma.TodoWhereInput): Promise<number> {
    return this.prisma.todo.count({ where });
  }
}
