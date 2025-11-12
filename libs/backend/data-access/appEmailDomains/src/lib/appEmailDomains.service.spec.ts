import { Test } from '@nestjs/testing';
import { AppEmailDomainsService } from './appEmailDomains.service';

describe('AppEmailDomainsService', () => {
  let service: AppEmailDomainsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AppEmailDomainsService],
    }).compile();

    service = module.get(AppEmailDomainsService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
