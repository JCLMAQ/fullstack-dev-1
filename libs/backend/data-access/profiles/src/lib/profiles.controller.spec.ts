import { Test } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

describe('ProfilesController', () => {
  let controller: ProfilesController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ProfilesService],
      controllers: [ProfilesController],
    }).compile();

    controller = module.get(ProfilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
