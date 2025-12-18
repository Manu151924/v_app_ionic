import { TestBed } from '@angular/core/testing';

import { Crashlytics } from './crashlytics';

describe('Crashlytics', () => {
  let service: Crashlytics;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Crashlytics);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
