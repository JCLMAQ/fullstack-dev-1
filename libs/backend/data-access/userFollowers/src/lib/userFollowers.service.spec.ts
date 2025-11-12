import { Test } from '@nestjs/testing';
import { UserFollowersService } from './userFollowers.service';

describe('UserFollowersService', () => {
  let service: UserFollowersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserFollowersService],
    }).compile();

    service = module.get(UserFollowersService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
