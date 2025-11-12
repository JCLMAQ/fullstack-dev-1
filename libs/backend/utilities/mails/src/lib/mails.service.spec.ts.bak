import { Test } from '@nestjs/testing';
import { MailsService } from './mails.service';

describe('MailsService', () => {
  let service: MailsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MailsService],
    }).compile();

    service = module.get(MailsService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
