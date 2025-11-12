import { Test } from '@nestjs/testing';
import { DbConfigController } from './db-config.controller';
import { DbConfigService } from './db-config.service';

describe('DbConfigController', () => {
  let controller: DbConfigController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [DbConfigService],
      controllers: [DbConfigController],
    }).compile();

    controller = module.get(DbConfigController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
