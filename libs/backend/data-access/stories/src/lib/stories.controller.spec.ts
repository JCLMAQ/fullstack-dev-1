import { Test } from '@nestjs/testing';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';

describe('StoriesController', () => {
  let controller: StoriesController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [StoriesService],
      controllers: [StoriesController],
    }).compile();

    controller = module.get(StoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
