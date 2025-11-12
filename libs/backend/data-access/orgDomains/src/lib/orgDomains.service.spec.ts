import { Test } from '@nestjs/testing';
import { OrgDomainsService } from './orgDomains.service';

describe('OrgDomainsService', () => {
  let service: OrgDomainsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [OrgDomainsService],
    }).compile();

    service = module.get(OrgDomainsService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
