import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentSupportComponent } from './payment-support-component';

describe('PaymentSupportComponent', () => {
  let component: PaymentSupportComponent;
  let fixture: ComponentFixture<PaymentSupportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaymentSupportComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentSupportComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
