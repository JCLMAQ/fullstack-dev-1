import { Test } from '@nestjs/testing';
import { AddressService } from './address.service';

describe('AddressService', () => {
  let service: AddressService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AddressService],
    }).compile();

    service = module.get(AddressService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
