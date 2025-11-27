import { TestBed } from '@angular/core/testing';

import { AppStorage } from './app-storage';

describe('AppStorage', () => {
  let service: AppStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
