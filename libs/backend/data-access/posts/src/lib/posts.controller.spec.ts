import { Test } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

describe('PostsController', () => {
  let controller: PostsController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PostsService],
      controllers: [PostsController],
    }).compile();

    controller = module.get(PostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
