import { Controller, Get, Param } from '@nestjs/common';
import { DbConfigService } from './db-config.service';

@Controller('db-config')
export class DbConfigController {
  constructor(private readonly dbConfigService: DbConfigService) {}

  @Get(':name')
  async getConfig(@Param('name') name: string): Promise<string> {
    return this.dbConfigService.searchConfigParam(name);
  }

  @Get('env-first/:name')
  async getConfigEnvFirst(@Param('name') name: string): Promise<string | undefined> {
    return this.dbConfigService.searchConfigParamEnvFirst(name);
  }
}
