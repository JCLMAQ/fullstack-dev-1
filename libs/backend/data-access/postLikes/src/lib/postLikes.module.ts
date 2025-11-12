import { PrismaClientModule } from '@db/prisma-client';
import { Module } from '@nestjs/common';
import { PostLikesController } from './postLikes.controller';
import { PostLikesService } from './postLikes.service';

@Module({
  imports: [PrismaClientModule],
  controllers: [PostLikesController],
  providers: [PostLikesService],
  exports: [PostLikesService],
})
export class PostLikesModule {}
