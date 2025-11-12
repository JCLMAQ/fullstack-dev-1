import { Test } from '@nestjs/testing';
import { OrgDomainsController } from './orgDomains.controller';
import { OrgDomainsService } from './orgDomains.service';

describe('OrgDomainsController', () => {
  let controller: OrgDomainsController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [OrgDomainsService],
      controllers: [OrgDomainsController],
    }).compile();

    controller = module.get(OrgDomainsController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
