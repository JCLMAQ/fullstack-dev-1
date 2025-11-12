import { Test } from '@nestjs/testing';
import { OrgEmailsController } from './orgEmails.controller';
import { OrgEmailsService } from './orgEmails.service';

describe('OrgEmailsController', () => {
  let controller: OrgEmailsController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [OrgEmailsService],
      controllers: [OrgEmailsController],
    }).compile();

    controller = module.get(OrgEmailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
