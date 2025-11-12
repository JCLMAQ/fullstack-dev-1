import { Test } from '@nestjs/testing';
import { PrismaClientService } from './prisma-client.service';

describe('PrismaClientService', () => {
  let service: PrismaClientService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PrismaClientService],
    }).compile();

    service = module.get(PrismaClientService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
