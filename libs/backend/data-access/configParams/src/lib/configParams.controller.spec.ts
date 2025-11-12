import { Test } from '@nestjs/testing';
import { ConfigParamsController } from './configParams.controller';
import { ConfigParamsService } from './configParams.service';

describe('ConfigParamsController', () => {
  let controller: ConfigParamsController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ConfigParamsService],
      controllers: [ConfigParamsController],
    }).compile();

    controller = module.get(ConfigParamsController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
