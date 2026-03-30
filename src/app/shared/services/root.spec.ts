import { TestBed } from '@angular/core/testing';

import { Root } from './root';

describe('Root', () => {
  let service: Root;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Root);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
