import { Test } from '@nestjs/testing';
import { PostLikesController } from './postLikes.controller';
import { PostLikesService } from './postLikes.service';

describe('PostLikesController', () => {
  let controller: PostLikesController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PostLikesService],
      controllers: [PostLikesController],
    }).compile();

    controller = module.get(PostLikesController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
