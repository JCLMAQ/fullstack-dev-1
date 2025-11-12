import { Test } from '@nestjs/testing';
import { TimeUtilService } from './time-util.service';

describe('TimeUtilService', () => {
  let service: TimeUtilService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TimeUtilService],
    }).compile();

    service = module.get(TimeUtilService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
