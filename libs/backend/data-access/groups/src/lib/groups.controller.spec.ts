import { Test } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

describe('GroupsController', () => {
  let controller: GroupsController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [GroupsService],
      controllers: [GroupsController],
    }).compile();

    controller = module.get(GroupsController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
