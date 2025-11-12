import { PrismaClientModule } from '@db/prisma-client';
import { Module } from '@nestjs/common';
import { AppEmailDomainsController } from './appEmailDomains.controller';
import { AppEmailDomainsService } from './appEmailDomains.service';

@Module({
  imports: [PrismaClientModule],
  controllers: [AppEmailDomainsController],
  providers: [AppEmailDomainsService],
  exports: [AppEmailDomainsService],
})
export class AppEmailDomainsModule {}
