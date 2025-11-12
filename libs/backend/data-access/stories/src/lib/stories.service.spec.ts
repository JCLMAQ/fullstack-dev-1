import { Test } from '@nestjs/testing';
import { StoriesService } from './stories.service';

describe('StoriesService', () => {
  let service: StoriesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [StoriesService],
    }).compile();

    service = module.get(StoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
