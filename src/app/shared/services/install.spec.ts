import { TestBed } from '@angular/core/testing';

import { Install } from './install';

describe('Install', () => {
  let service: Install;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Install);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
