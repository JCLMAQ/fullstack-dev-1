import { Test } from '@nestjs/testing';
import { OrgEmailUseTosController } from './orgEmailUseTos.controller';
import { OrgEmailUseTosService } from './orgEmailUseTos.service';

describe('OrgEmailUseTosController', () => {
  let controller: OrgEmailUseTosController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [OrgEmailUseTosService],
      controllers: [OrgEmailUseTosController],
    }).compile();

    controller = module.get(OrgEmailUseTosController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
