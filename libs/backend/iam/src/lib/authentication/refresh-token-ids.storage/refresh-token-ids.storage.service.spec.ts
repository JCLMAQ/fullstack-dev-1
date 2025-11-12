import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenIdsStorageService } from './refresh-token-ids.storage.service';

describe('RefreshTokenIdsStorageService', () => {
  let service: RefreshTokenIdsStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RefreshTokenIdsStorageService],
    }).compile();

    service = module.get<RefreshTokenIdsStorageService>(RefreshTokenIdsStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
