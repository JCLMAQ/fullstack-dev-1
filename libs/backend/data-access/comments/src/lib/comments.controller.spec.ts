import { Test } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

describe('CommentsController', () => {
  let controller: CommentsController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CommentsService],
      controllers: [CommentsController],
    }).compile();

    controller = module.get(CommentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
