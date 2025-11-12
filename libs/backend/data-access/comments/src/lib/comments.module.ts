import { PrismaClientModule } from '@db/prisma-client';
import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
  imports: [PrismaClientModule],
})
export class CommentsModule {}
