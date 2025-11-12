import { Test } from '@nestjs/testing';
import { OrgEmailsService } from './orgEmails.service';

describe('OrgEmailsService', () => {
  let service: OrgEmailsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [OrgEmailsService],
    }).compile();

    service = module.get(OrgEmailsService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
