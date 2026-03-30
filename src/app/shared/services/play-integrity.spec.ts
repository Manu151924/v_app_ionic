import { TestBed } from '@angular/core/testing';

import { PlayIntegrity } from './play-integrity';

describe('PlayIntegrity', () => {
  let service: PlayIntegrity;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlayIntegrity);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
