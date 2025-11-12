import { Test } from '@nestjs/testing';
import { PhonesService } from './phones.service';

describe('PhonesService', () => {
  let service: PhonesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PhonesService],
    }).compile();

    service = module.get(PhonesService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
