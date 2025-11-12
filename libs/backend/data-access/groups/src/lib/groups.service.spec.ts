import { Test } from '@nestjs/testing';
import { GroupsService } from './groups.service';

describe('GroupsService', () => {
  let service: GroupsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [GroupsService],
    }).compile();

    service = module.get(GroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
