import { PrismaClientModule } from '@db/prisma-client';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  controllers: [PostsController],
  providers: [
    PostsService
  ],
  exports: [PostsService],
  imports: [
    PrismaClientModule,
    ConfigModule
  ],
})
export class PostsModule {}
