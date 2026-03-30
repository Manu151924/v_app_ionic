import { TestBed } from '@angular/core/testing';

import { DashboardRefresh } from './dashboard-refresh';

describe('DashboardRefresh', () => {
  let service: DashboardRefresh;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardRefresh);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
