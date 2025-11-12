import { Test } from '@nestjs/testing';
import { UserFollowersController } from './userFollowers.controller';
import { UserFollowersService } from './userFollowers.service';

describe('UserFollowersController', () => {
  let controller: UserFollowersController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserFollowersService],
      controllers: [UserFollowersController],
    }).compile();

    controller = module.get(UserFollowersController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
