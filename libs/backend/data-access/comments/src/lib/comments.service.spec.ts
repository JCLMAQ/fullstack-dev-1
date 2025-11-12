import { Test } from '@nestjs/testing';
import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  let service: CommentsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CommentsService],
    }).compile();

    service = module.get(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
