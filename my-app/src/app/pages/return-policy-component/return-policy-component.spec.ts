import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReturnPolicyComponent } from './return-policy-component';

describe('ReturnPolicyComponent', () => {
  let component: ReturnPolicyComponent;
  let fixture: ComponentFixture<ReturnPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReturnPolicyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReturnPolicyComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
