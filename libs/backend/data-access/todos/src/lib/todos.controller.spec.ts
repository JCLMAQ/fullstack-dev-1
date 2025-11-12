import { Test } from '@nestjs/testing';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';

describe('TodosController', () => {
  let controller: TodosController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TodosService],
      controllers: [TodosController],
    }).compile();

    controller = module.get(TodosController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
