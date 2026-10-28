import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CraftVillageComponent } from './craft-village-component';

describe('CraftVillageComponent', () => {
  let component: CraftVillageComponent;
  let fixture: ComponentFixture<CraftVillageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CraftVillageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CraftVillageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
