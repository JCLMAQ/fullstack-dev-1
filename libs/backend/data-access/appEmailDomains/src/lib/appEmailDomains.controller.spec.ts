import { Test } from '@nestjs/testing';
import { AppEmailDomainsController } from './appEmailDomains.controller';
import { AppEmailDomainsService } from './appEmailDomains.service';

describe('AppEmailDomainsController', () => {
  let controller: AppEmailDomainsController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AppEmailDomainsService],
      controllers: [AppEmailDomainsController],
    }).compile();

    controller = module.get(AppEmailDomainsController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
