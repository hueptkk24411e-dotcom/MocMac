import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HoTroComponent } from './ho-tro-component';

describe('HoTroComponent', () => {
  let component: HoTroComponent;
  let fixture: ComponentFixture<HoTroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HoTroComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HoTroComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
