import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClientModule } from '@db/prisma-client';
import { DbConfigController } from './db-config.controller';
import { DbConfigService } from './db-config.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    PrismaClientModule,
  ],
  controllers: [DbConfigController],
  providers: [DbConfigService],
  exports: [DbConfigService],
})
export class DbConfigModule {}
