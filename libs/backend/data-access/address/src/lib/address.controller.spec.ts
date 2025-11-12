import { Test } from '@nestjs/testing';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';

describe('AddressController', () => {
  let controller: AddressController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AddressService],
      controllers: [AddressController],
    }).compile();

    controller = module.get(AddressController);
  });

  it('should be defined', () => {
    expect(controller).toBeTruthy();
  });
});
