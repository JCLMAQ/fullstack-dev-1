import { PrismaClientModule } from '@db/prisma-client';
import { Module } from '@nestjs/common';
import { MailsSimpleController } from './mails-simple.controller';
import { MailsSimpleService } from './mails-simple.service';

@Module({
  imports: [PrismaClientModule],
  controllers: [MailsSimpleController],
  providers: [MailsSimpleService],
  exports: [MailsSimpleService],
})
export class MailsSimpleModule {}
