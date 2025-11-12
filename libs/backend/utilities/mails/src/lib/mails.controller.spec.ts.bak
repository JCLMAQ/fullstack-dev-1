import { Test } from '@nestjs/testing';
import { MailsController } from './mails.controller';
import { MailsService } from './mails.service';

describe('MailsController', () => {
  let controller: MailsController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MailsService],
      controllers: [MailsController],
    }).compile();

    controller = module.get(MailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
