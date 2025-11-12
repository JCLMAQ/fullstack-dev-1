import { PrismaClientModule } from '@db/prisma-client';
import { Module } from '@nestjs/common';
import { OrgDomainsController } from './orgDomains.controller';
import { OrgDomainsService } from './orgDomains.service';

@Module({
  imports: [PrismaClientModule],
  controllers: [OrgDomainsController],
  providers: [OrgDomainsService],
  exports: [OrgDomainsService],
})
export class OrgDomainsModule {}
