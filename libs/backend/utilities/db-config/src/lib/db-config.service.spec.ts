import { Test } from '@nestjs/testing';
import { DbConfigService } from './db-config.service';

describe('DbConfigService', () => {
  let service: DbConfigService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [DbConfigService],
    }).compile();

    service = module.get(DbConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
