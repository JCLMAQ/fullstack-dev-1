import { PrismaClientModule } from '@db/prisma-client';
import { Module } from '@nestjs/common';
import { OrgEmailsController } from './orgEmails.controller';
import { OrgEmailsService } from './orgEmails.service';

@Module({
  imports: [PrismaClientModule],
  controllers: [OrgEmailsController],
  providers: [OrgEmailsService],
  exports: [OrgEmailsService],
})
export class OrgEmailsModule {}
