import { Test } from '@nestjs/testing';
import { FilesUtilitiesController } from './files-utilities.controller';
import { FilesUtilitiesService } from './files-utilities.service';

describe('FilesUtilitiesController', () => {
  let controller: FilesUtilitiesController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [FilesUtilitiesService],
      controllers: [FilesUtilitiesController],
    }).compile();

    controller = module.get(FilesUtilitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
