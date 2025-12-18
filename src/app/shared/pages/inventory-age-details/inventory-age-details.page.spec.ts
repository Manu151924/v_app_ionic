import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryAgeDetailsPage } from './inventory-age-details.page';

describe('InventoryAgeDetailsPage', () => {
  let component: InventoryAgeDetailsPage;
  let fixture: ComponentFixture<InventoryAgeDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryAgeDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
