import { TestBed } from '@angular/core/testing';

import { ChangepwdService } from './changepwd.service';

describe('ChangepwdService', () => {
  let service: ChangepwdService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChangepwdService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
