import { PrismaClientModule } from '@db/prisma-client';
import { Module } from '@nestjs/common';
import { UserFollowersController } from './userFollowers.controller';
import { UserFollowersService } from './userFollowers.service';

@Module({
  imports: [PrismaClientModule],
  controllers: [UserFollowersController],
  providers: [UserFollowersService],
  exports: [UserFollowersService],
})
export class UserFollowersModule {}
