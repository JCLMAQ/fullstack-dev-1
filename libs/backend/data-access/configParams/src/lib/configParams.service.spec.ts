import { Test } from '@nestjs/testing';
import { ConfigParamsService } from './configParams.service';

describe('ConfigParamsService', () => {
  let service: ConfigParamsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ConfigParamsService],
    }).compile();

    service = module.get(ConfigParamsService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
