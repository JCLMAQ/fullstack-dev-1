import { Test } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
  let controller: FilesController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [FilesService],
      controllers: [FilesController],
    }).compile();

    controller = module.get(FilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
