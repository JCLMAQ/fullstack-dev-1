import { Prisma, Task, TaskState } from '@db/prisma';
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
    Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';

// Helper function for type-safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // Create a new task
  @Post()
  async create(@Body() createTaskDto: Prisma.TaskCreateInput): Promise<Task> {
    try {
      return await this.tasksService.create(createTaskDto);
    } catch (error) {
      throw new HttpException(
        `Failed to create task: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get all tasks with optional filters
  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('ownerId') ownerId?: string,
    @Query('orgId') orgId?: string,
    @Query('state') state?: string,
    @Query('isPublic') isPublic?: string,
    @Query('published') published?: string,
  ): Promise<Task[]> {
    try {
      const where: Prisma.TaskWhereInput = {};

      if (ownerId) where.ownerId = ownerId;
      if (orgId) where.orgId = orgId;
      if (state && Object.values(TaskState).includes(state as TaskState)) {
        where.taskState = state as TaskState;
      }
      if (isPublic !== undefined) where.isPublic = isPublic === 'true';
      if (published !== undefined) where.published = published === 'true';

      // Always exclude deleted items by default
      where.isDeleted = 0;

      return await this.tasksService.findAll({
        skip: skip ? parseInt(skip, 10) : undefined,
        take: take ? parseInt(take, 10) : undefined,
        where,
      });
    } catch (error) {
      throw new HttpException(
        `Failed to fetch tasks: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get task by ID
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Task> {
    try {
      return await this.tasksService.findOne(id);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch task: ${getErrorMessage(error)}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  // Update task
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: Prisma.TaskUpdateInput,
  ): Promise<Task> {
    try {
      return await this.tasksService.update(id, updateTaskDto);
    } catch (error) {
      throw new HttpException(
        `Failed to update task: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Delete task (soft delete)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Task> {
    try {
      return await this.tasksService.remove(id);
    } catch (error) {
      throw new HttpException(
        `Failed to delete task: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get tasks by owner
  @Get('owner/:ownerId')
  async findByOwner(@Param('ownerId') ownerId: string): Promise<Task[]> {
    try {
      return await this.tasksService.findByOwner(ownerId);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch tasks for owner: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get tasks by organization
  @Get('organization/:orgId')
  async findByOrganization(@Param('orgId') orgId: string): Promise<Task[]> {
    try {
      return await this.tasksService.findByOrganization(orgId);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch tasks for organization: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get tasks by state
  @Get('state/:state')
  async findByState(@Param('state') state: string): Promise<Task[]> {
    try {
      if (!Object.values(TaskState).includes(state as TaskState)) {
        throw new HttpException('Invalid task state', HttpStatus.BAD_REQUEST);
      }
      return await this.tasksService.findByState(state as TaskState);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch tasks by state: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Update task state
  @Patch(':id/state')
  async updateState(
    @Param('id') id: string,
    @Body('state') newState: TaskState,
  ): Promise<Task> {
    try {
      if (!Object.values(TaskState).includes(newState)) {
        throw new HttpException('Invalid task state', HttpStatus.BAD_REQUEST);
      }
      return await this.tasksService.updateState(id, newState);
    } catch (error) {
      throw new HttpException(
        `Failed to update task state: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get sub-tasks for a main task
  @Get(':id/subtasks')
  async findSubTasks(@Param('id') mainTaskId: string): Promise<Task[]> {
    try {
      return await this.tasksService.findSubTasks(mainTaskId);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch sub-tasks: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Assign user to task
  @Post(':id/users/:userId')
  async assignUserToTask(
    @Param('id') taskId: string,
    @Param('userId') userId: string,
    @Body('comment') comment?: string,
  ): Promise<Task> {
    try {
      return await this.tasksService.assignUserToTask(taskId, userId, comment || '');
    } catch (error) {
      throw new HttpException(
        `Failed to assign user to task: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Remove user from task
  @Delete(':id/users/:userId')
  async removeUserFromTask(
    @Param('id') taskId: string,
    @Param('userId') userId: string,
  ): Promise<Task> {
    try {
      return await this.tasksService.removeUserFromTask(taskId, userId);
    } catch (error) {
      throw new HttpException(
        `Failed to remove user from task: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Get tasks assigned to user
  @Get('user/:userId/assigned')
  async findTasksForUser(@Param('userId') userId: string): Promise<Task[]> {
    try {
      return await this.tasksService.findTasksForUser(userId);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch tasks for user: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Search tasks
  @Get('search/query')
  async searchTasks(@Query('q') searchTerm: string): Promise<Task[]> {
    try {
      if (!searchTerm) {
        throw new HttpException('Search query is required', HttpStatus.BAD_REQUEST);
      }
      return await this.tasksService.searchTasks(searchTerm);
    } catch (error) {
      throw new HttpException(
        `Failed to search tasks: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Update task order
  @Patch(':id/order')
  async updateTaskOrder(
    @Param('id') id: string,
    @Body('orderTask') newOrder: number,
  ): Promise<Task> {
    try {
      if (typeof newOrder !== 'number') {
        throw new HttpException('Order must be a number', HttpStatus.BAD_REQUEST);
      }
      return await this.tasksService.updateTaskOrder(id, newOrder);
    } catch (error) {
      throw new HttpException(
        `Failed to update task order: ${getErrorMessage(error)}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
