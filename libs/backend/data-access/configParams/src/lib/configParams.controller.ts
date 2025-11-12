import { Prisma } from '@db/prisma';
import {
    BadRequestException,
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    NotFoundException,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ConfigParamsService } from './configParams.service';

// Helper function for type-safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Controller('configParams')
export class ConfigParamsController {
  constructor(private readonly configParamsService: ConfigParamsService) {}

  // POST /configParams - Create a new config parameter
  @Post()
  async create(@Body() createConfigParamDto: Prisma.ConfigParamCreateInput) {
    try {
      return await this.configParamsService.create(createConfigParamDto);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /configParams - Get all config parameters with optional filtering
  @Get()
  async findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take?: number,
    @Query('published') published?: string,
    @Query('isPublic') isPublic?: string,
    @Query('utility') utility?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    try {
      const where: Prisma.ConfigParamWhereInput = {};

      if (published !== undefined) {
        where.published = published === 'true';
      }

      if (isPublic !== undefined) {
        where.isPublic = isPublic === 'true';
      }

      if (utility) {
        where.utility = utility;
      }

      return await this.configParamsService.findAll({
        skip,
        take,
        where,
        includeDeleted: includeDeleted === 'true',
      });
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /configParams/published - Get published config parameters
  @Get('published')
  async findPublished() {
    try {
      return await this.configParamsService.findPublished();
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /configParams/public - Get public config parameters
  @Get('public')
  async findPublic() {
    try {
      return await this.configParamsService.findPublic();
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /configParams/search - Search config parameters
  @Get('search')
  async search(@Query('q') query: string) {
    if (!query) {
      throw new BadRequestException('Query parameter is required');
    }

    try {
      return await this.configParamsService.search(query);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /configParams/utility/:utility - Get config parameters by utility
  @Get('utility/:utility')
  async findByUtility(@Param('utility') utility: string) {
    try {
      return await this.configParamsService.findByUtility(utility);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /configParams/stats - Get config parameters statistics
  @Get('stats')
  async getStats() {
    try {
      return await this.configParamsService.getStats();
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /configParams/key-value-pairs - Get parameters as key-value pairs
  @Get('key-value-pairs')
  async getAsKeyValuePairs(@Query('utility') utility?: string) {
    try {
      return await this.configParamsService.getAsKeyValuePairs(utility);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /configParams/name/:name - Get config parameter by name
  @Get('name/:name')
  async findByName(
    @Param('name') name: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    try {
      const configParam = await this.configParamsService.findByName(
        name,
        includeDeleted === 'true'
      );
      if (!configParam) {
        throw new NotFoundException('Config parameter not found');
      }
      return configParam;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /configParams/value/:name - Get parameter value by name
  @Get('value/:name')
  async getValue(@Param('name') name: string) {
    try {
      const value = await this.configParamsService.getValue(name);
      if (value === null) {
        throw new NotFoundException('Config parameter not found');
      }
      return { name, value };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // POST /configParams/set-value - Set parameter value by name
  @Post('set-value')
  async setValue(@Body() body: { name: string; value: string; utility?: string }) {
    if (!body.name || body.value === undefined) {
      throw new BadRequestException('Name and value are required');
    }

    try {
      return await this.configParamsService.setValue(
        body.name,
        body.value,
        body.utility || ''
      );
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // GET /configParams/:id - Get config parameter by ID
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    try {
      const configParam = await this.configParamsService.findOne(
        id,
        includeDeleted === 'true'
      );
      if (!configParam) {
        throw new NotFoundException('Config parameter not found');
      }
      return configParam;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // PATCH /configParams/:id - Update config parameter
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConfigParamDto: Prisma.ConfigParamUpdateInput,
  ) {
    try {
      return await this.configParamsService.update(id, updateConfigParamDto);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes('not found')) {
        throw new NotFoundException(errorMessage);
      }
      throw new BadRequestException(errorMessage);
    }
  }

  // DELETE /configParams/:id - Soft delete config parameter
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.configParamsService.remove(id);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes('not found')) {
        throw new NotFoundException(errorMessage);
      }
      throw new BadRequestException(errorMessage);
    }
  }

  // DELETE /configParams/:id/hard - Hard delete config parameter
  @Delete(':id/hard')
  async hardDelete(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.configParamsService.hardDelete(id);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }

  // POST /configParams/:id/restore - Restore soft deleted config parameter
  @Post(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.configParamsService.restore(id);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes('not found')) {
        throw new NotFoundException(errorMessage);
      }
      throw new BadRequestException(errorMessage);
    }
  }

  // PATCH /configParams/:id/toggle-published - Toggle published status
  @Patch(':id/toggle-published')
  async togglePublished(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.configParamsService.togglePublished(id);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes('not found')) {
        throw new NotFoundException(errorMessage);
      }
      throw new BadRequestException(errorMessage);
    }
  }

  // PATCH /configParams/:id/toggle-public - Toggle public status
  @Patch(':id/toggle-public')
  async togglePublic(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.configParamsService.togglePublic(id);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes('not found')) {
        throw new NotFoundException(errorMessage);
      }
      throw new BadRequestException(errorMessage);
    }
  }

  // POST /configParams/bulk-update - Bulk update config parameters
  @Post('bulk-update')
  async bulkUpdate(@Body() body: { updates: { id: number; data: Prisma.ConfigParamUpdateInput }[] }) {
    if (!body.updates || !Array.isArray(body.updates)) {
      throw new BadRequestException('Updates array is required');
    }

    try {
      return await this.configParamsService.bulkUpdate(body.updates);
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }
}
