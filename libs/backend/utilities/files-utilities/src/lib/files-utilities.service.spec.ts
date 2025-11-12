import { Test } from '@nestjs/testing';
import { FilesUtilitiesService } from './files-utilities.service';

describe('FilesUtilitiesService', () => {
  let service: FilesUtilitiesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [FilesUtilitiesService],
    }).compile();

    service = module.get(FilesUtilitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
