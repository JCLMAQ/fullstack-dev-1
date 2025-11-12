import { Test } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [OrganizationsService],
    }).compile();

    service = module.get(OrganizationsService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
