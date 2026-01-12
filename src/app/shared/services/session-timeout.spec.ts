import { TestBed } from '@angular/core/testing';

import { SessionTimeout } from './session-timeout';

describe('SessionTimeout', () => {
  let service: SessionTimeout;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionTimeout);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
