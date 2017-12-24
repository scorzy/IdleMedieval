import { TestBed, inject } from '@angular/core/testing';

import { ServService } from './serv.service';

describe('ServService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServService]
    });
  });

  it('should be created', inject([ServService], (service: ServService) => {
    expect(service).toBeTruthy();
  }));
});
