import { Test } from '@nestjs/testing';
import { TodosService } from './todos.service';

describe('TodosService', () => {
  let service: TodosService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TodosService],
    }).compile();

    service = module.get(TodosService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
