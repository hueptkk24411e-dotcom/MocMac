import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GiftPageComponent } from './gift-page';

describe('GiftPage', () => {
  let component: GiftPageComponent;
  let fixture: ComponentFixture<GiftPageComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GiftPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(GiftPageComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load gifts from the gifts API', () => {
    fixture.detectChanges(); // chạy ngOnInit -> gửi request

    const req = httpMock.expectOne('/api/gifts');
    req.flush([
      {
        id: 1,
        name: 'Set Quà Lộc 3',
        cat: 'Quà tặng',
        type: 'Set quà',
        region: '',
        province: '',
        price: 899000,
        rate: 0,
        reviews: 0,
        inStock: true,
        icon: '🎁',
        images: ['https://example.com/loc-3.jpg'],
        source: 'tre-viet.com',
        link: 'https://tre-viet.com/set-qua-loc-3'
      }
    ]);

expect(component.isLoading).toBe(false);
    expect(component.products.length).toBe(1);
    expect(component.products[0].imageUrl).toBe('https://example.com/loc-3.jpg');
    expect(component.heroImage).toBe('https://example.com/loc-3.jpg');
  });

  it('should show an error when the gifts API cannot be loaded', () => {
    fixture.detectChanges();

    httpMock.expectOne('/api/gifts').flush('Not found', { status: 404, statusText: 'Not Found' });

expect(component.isLoading).toBe(false);
    expect(component.loadError).not.toBe('');
    expect(component.products.length).toBe(0);
  });
});