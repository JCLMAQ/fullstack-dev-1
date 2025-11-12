import { Test } from '@nestjs/testing';
import { ProfilesService } from './profiles.service';

describe('ProfilesService', () => {
  let service: ProfilesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ProfilesService],
    }).compile();

    service = module.get(ProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
