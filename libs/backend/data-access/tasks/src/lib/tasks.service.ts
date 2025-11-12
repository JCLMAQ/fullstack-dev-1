import { Prisma, Task, TaskState } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

// Helper function for type-safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaClientService) {}

  // Create a new task
  async create(data: Prisma.TaskCreateInput): Promise<Task> {
    try {
      return await this.prisma.task.create({
        data,
        include: {
          owner: true,
          org: true,
          groups: true,
          mainTask: true,
          SubTasks: true,
          Users: {
            include: {
              user: true,
            },
          },
          todo: true,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to create task: ${getErrorMessage(error)}`);
    }
  }

  // Find all tasks with optional filters
  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.TaskWhereInput;
    orderBy?: { [key: string]: 'asc' | 'desc' };
    include?: Prisma.TaskInclude;
  }): Promise<Task[]> {
    const { skip, take, where, orderBy, include } = params || {};

    try {
      return await this.prisma.task.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { orderTask: 'asc' },
        include: include || {
          owner: true,
          org: true,
          groups: true,
          mainTask: true,
          Users: {
            include: {
              user: true,
            },
          },
          _count: {
            select: {
              SubTasks: true,
              Users: true,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch tasks: ${getErrorMessage(error)}`);
    }
  }

  // Find task by ID
  async findOne(id: string): Promise<Task> {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id },
        include: {
          owner: true,
          org: true,
          groups: true,
          mainTask: true,
          SubTasks: true,
          Users: {
            include: {
              user: true,
            },
          },
          todo: true,
        },
      });

      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch task: ${getErrorMessage(error)}`);
    }
  }

  // Update task
  async update(id: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    try {
      const existingTask = await this.prisma.task.findUnique({
        where: { id },
      });

      if (!existingTask) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      return await this.prisma.task.update({
        where: { id },
        data,
        include: {
          owner: true,
          org: true,
          groups: true,
          mainTask: true,
          SubTasks: true,
          Users: {
            include: {
              user: true,
            },
          },
          todo: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update task: ${getErrorMessage(error)}`);
    }
  }

  // Delete task (soft delete)
  async remove(id: string): Promise<Task> {
    try {
      const existingTask = await this.prisma.task.findUnique({
        where: { id },
      });

      if (!existingTask) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      return await this.prisma.task.update({
        where: { id },
        data: {
          isDeleted: 1,
          isDeletedDT: new Date(),
          published: false,
        },
        include: {
          owner: true,
          org: true,
          groups: true,
          mainTask: true,
          SubTasks: true,
          Users: {
            include: {
              user: true,
            },
          },
          todo: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete task: ${getErrorMessage(error)}`);
    }
  }

  // Find tasks by owner
  async findByOwner(ownerId: string): Promise<Task[]> {
    try {
      return await this.prisma.task.findMany({
        where: {
          ownerId,
          isDeleted: 0,
        },
        orderBy: { orderTask: 'asc' },
        include: {
          owner: true,
          org: true,
          groups: true,
          mainTask: true,
          Users: {
            include: {
              user: true,
            },
          },
          _count: {
            select: {
              SubTasks: true,
              Users: true,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch tasks for owner: ${getErrorMessage(error)}`);
    }
  }

  // Find tasks by organization
  async findByOrganization(orgId: string): Promise<Task[]> {
    try {
      return await this.prisma.task.findMany({
        where: {
          orgId,
          isDeleted: 0,
        },
        orderBy: { orderTask: 'asc' },
        include: {
          owner: true,
          org: true,
          groups: true,
          mainTask: true,
          Users: {
            include: {
              user: true,
            },
          },
          _count: {
            select: {
              SubTasks: true,
              Users: true,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch tasks for organization: ${getErrorMessage(error)}`);
    }
  }

  // Find tasks by state
  async findByState(taskState: TaskState): Promise<Task[]> {
    try {
      return await this.prisma.task.findMany({
        where: {
          taskState,
          isDeleted: 0,
        },
        orderBy: { orderTask: 'asc' },
        include: {
          owner: true,
          org: true,
          groups: true,
          mainTask: true,
          Users: {
            include: {
              user: true,
            },
          },
          _count: {
            select: {
              SubTasks: true,
              Users: true,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch tasks by state: ${getErrorMessage(error)}`);
    }
  }

  // Update task state
  async updateState(id: string, newState: TaskState): Promise<Task> {
    try {
      const existingTask = await this.prisma.task.findUnique({
        where: { id },
      });

      if (!existingTask) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      return await this.prisma.task.update({
        where: { id },
        data: { taskState: newState },
        include: {
          owner: true,
          org: true,
          groups: true,
          mainTask: true,
          SubTasks: true,
          Users: {
            include: {
              user: true,
            },
          },
          todo: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update task state: ${getErrorMessage(error)}`);
    }
  }

  // Find sub-tasks for a main task
  async findSubTasks(mainTaskId: string): Promise<Task[]> {
    try {
      return await this.prisma.task.findMany({
        where: {
          mainTaskId,
          isDeleted: 0,
        },
        orderBy: { orderTask: 'asc' },
        include: {
          owner: true,
          org: true,
          groups: true,
          Users: {
            include: {
              user: true,
            },
          },
          _count: {
            select: {
              SubTasks: true,
              Users: true,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to fetch sub-tasks: ${getErrorMessage(error)}`);
    }
  }

  // Assign user to task
  async assignUserToTask(taskId: string, userId: string, comment = ''): Promise<Task> {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
        include: { Users: true },
      });

      if (!task) {
        throw new NotFoundException(`Task with ID ${taskId} not found`);
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if user is already assigned to the task
      const isUserAssigned = task.Users.some((userTaskLink: { userId: string }) => userTaskLink.userId === userId);
      if (isUserAssigned) {
        throw new BadRequestException(`User is already assigned to this task`);
      }

      // Create user-task link
      await this.prisma.userTaskLink.create({
        data: {
          userId,
          taskId,
          comment,
        },
      });

      return await this.findOne(taskId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to assign user to task: ${getErrorMessage(error)}`);
    }
  }

  // Remove user from task
  async removeUserFromTask(taskId: string, userId: string): Promise<Task> {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
        include: { Users: true },
      });

      if (!task) {
        throw new NotFoundException(`Task with ID ${taskId} not found`);
      }

      // Check if user is assigned to the task
      const isUserAssigned = task.Users.some((userTaskLink: { userId: string }) => userTaskLink.userId === userId);
      if (!isUserAssigned) {
        throw new BadRequestException(`User is not assigned to this task`);
      }

      // Remove user-task link
      await this.prisma.userTaskLink.delete({
        where: {
          userId_taskId: {
            userId,
            taskId,
          },
        },
      });

      return await this.findOne(taskId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to remove user from task: ${getErrorMessage(error)}`);
    }
  }

  // Find tasks assigned to user
  async findTasksForUser(userId: string): Promise<Task[]> {
    try {
      const userTaskLinks = await this.prisma.userTaskLink.findMany({
        where: { userId },
        include: {
          task: {
            include: {
              owner: true,
              org: true,
              groups: true,
              mainTask: true,
              Users: {
                include: {
                  user: true,
                },
              },
              _count: {
                select: {
                  SubTasks: true,
                  Users: true,
                },
              },
            },
          },
        },
      });

      return userTaskLinks
        .map(link => link.task)
        .filter(task => task.isDeleted === 0);
    } catch (error) {
      throw new BadRequestException(`Failed to fetch tasks for user: ${getErrorMessage(error)}`);
    }
  }

  // Search tasks by title or content
  async searchTasks(searchTerm: string): Promise<Task[]> {
    try {
      return await this.prisma.task.findMany({
        where: {
          AND: [
            { isDeleted: 0 },
            { published: true },
            {
              OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { content: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          ],
        },
        orderBy: { orderTask: 'asc' },
        include: {
          owner: true,
          org: true,
          groups: true,
          mainTask: true,
          Users: {
            include: {
              user: true,
            },
          },
          _count: {
            select: {
              SubTasks: true,
              Users: true,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to search tasks: ${getErrorMessage(error)}`);
    }
  }

  // Update task order
  async updateTaskOrder(id: string, newOrder: number): Promise<Task> {
    try {
      const existingTask = await this.prisma.task.findUnique({
        where: { id },
      });

      if (!existingTask) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      return await this.prisma.task.update({
        where: { id },
        data: { orderTask: newOrder },
        include: {
          owner: true,
          org: true,
          groups: true,
          mainTask: true,
          SubTasks: true,
          Users: {
            include: {
              user: true,
            },
          },
          todo: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update task order: ${getErrorMessage(error)}`);
    }
  }
}
