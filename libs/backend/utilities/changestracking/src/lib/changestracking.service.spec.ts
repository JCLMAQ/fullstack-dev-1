import { Test } from '@nestjs/testing';
import { ChangestrackingService } from './changestracking.service';

describe('ChangestrackingService', () => {
  let service: ChangestrackingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ChangestrackingService],
    }).compile();

    service = module.get(ChangestrackingService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
