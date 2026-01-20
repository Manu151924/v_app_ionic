import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PrivacyAndPolicyModalComponent } from './privacy-and-policy-modal.component';

describe('PrivacyAndPolicyModalComponent', () => {
  let component: PrivacyAndPolicyModalComponent;
  let fixture: ComponentFixture<PrivacyAndPolicyModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PrivacyAndPolicyModalComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyAndPolicyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
