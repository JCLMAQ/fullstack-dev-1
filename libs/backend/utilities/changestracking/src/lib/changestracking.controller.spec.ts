import { Test } from '@nestjs/testing';
import { ChangestrackingController } from './changestracking.controller';
import { ChangestrackingService } from './changestracking.service';

describe('ChangestrackingController', () => {
  let controller: ChangestrackingController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ChangestrackingService],
      controllers: [ChangestrackingController],
    }).compile();

    controller = module.get(ChangestrackingController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
