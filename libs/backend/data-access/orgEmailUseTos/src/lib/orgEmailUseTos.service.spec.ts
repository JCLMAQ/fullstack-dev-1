import { Test } from '@nestjs/testing';
import { OrgEmailUseTosService } from './orgEmailUseTos.service';

describe('OrgEmailUseTosService', () => {
  let service: OrgEmailUseTosService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [OrgEmailUseTosService],
    }).compile();

    service = module.get(OrgEmailUseTosService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
