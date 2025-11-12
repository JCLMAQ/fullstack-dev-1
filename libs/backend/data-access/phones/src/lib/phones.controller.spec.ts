import { Test } from '@nestjs/testing';
import { PhonesController } from './phones.controller';
import { PhonesService } from './phones.service';

describe('PhonesController', () => {
  let controller: PhonesController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PhonesService],
      controllers: [PhonesController],
    }).compile();

    controller = module.get(PhonesController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
