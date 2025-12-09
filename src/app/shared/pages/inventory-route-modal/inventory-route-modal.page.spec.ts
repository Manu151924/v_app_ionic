import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryRouteModalPage } from './inventory-route-modal.page';

describe('InventoryRouteModalPage', () => {
  let component: InventoryRouteModalPage;
  let fixture: ComponentFixture<InventoryRouteModalPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryRouteModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
