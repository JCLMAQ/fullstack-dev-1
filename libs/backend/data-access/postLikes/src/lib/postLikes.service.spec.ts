import { Test } from '@nestjs/testing';
import { PostLikesService } from './postLikes.service';

describe('PostLikesService', () => {
  let service: PostLikesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PostLikesService],
    }).compile();

    service = module.get(PostLikesService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
