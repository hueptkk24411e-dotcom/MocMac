import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PurchasingSupportComponent } from './purchasing-support-component';

describe('PurchasingSupportComponent', () => {
  let component: PurchasingSupportComponent;
  let fixture: ComponentFixture<PurchasingSupportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PurchasingSupportComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PurchasingSupportComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
