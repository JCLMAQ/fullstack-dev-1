import { Test } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CategoriesService],
      controllers: [CategoriesController],
    }).compile();

    controller = module.get(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
