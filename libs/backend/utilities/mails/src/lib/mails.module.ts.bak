import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClientModule } from '@db/prisma-client';
import { DbConfigModule } from '@be/db-config';
import { MailsController } from './mails.controller';
import { MailsService } from './mails.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    PrismaClientModule,
    DbConfigModule,
  ],
  controllers: [MailsController],
  providers: [MailsService],
  exports: [MailsService],
})
export class MailsModule {}
