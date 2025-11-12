import { Test } from '@nestjs/testing';
import { FilesService } from './files.service';

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [FilesService],
    }).compile();

    service = module.get(FilesService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
