import { Test } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [OrganizationsService],
      controllers: [OrganizationsController],
    }).compile();

    controller = module.get(OrganizationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
