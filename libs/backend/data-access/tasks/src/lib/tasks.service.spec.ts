import { Test } from '@nestjs/testing';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TasksService],
    }).compile();

    service = module.get(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
