import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { ProductDetailComponent } from './product-detail';
import { AppModule } from '../../app-module';
import { ProductItem, ProductsService } from '../../products.service';
import { AuthService } from '../../auth.service';
import { CartService } from '../../cart.service';
import { I18nService } from '../../i18n.service';
import { ReviewsService } from '../../reviews-service';

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;
  let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const mockProduct: ProductItem = {
    id: 1,
    slug: 'test-product',
    name: 'Sản phẩm thử nghiệm',
    cat: 'Đặc sản',
    type: 'Gốm',
    region: 'Miền Bắc',
    province: 'Hà Nội',
    village: 'Bát Tràng',
    price: 100000,
    rate: 4.5,
    reviews: 10,
    ocop: 4,
    heritage: 'Vàng',
    seasons: [1, 2],
    occasion: [],
    inStock: true,
    preorder: false,
    icon: '🏺',
    badges: [],
    images: ['https://example.com/1.png'],
    description: 'Mô tả thử nghiệm',
  };

  beforeEach(async () => {
    queryParams = new BehaviorSubject(convertToParamMap({}));
    await TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ slug: 'test-product' })),
            queryParamMap: queryParams,
          },
        },
        {
          provide: ProductsService,
          useValue: {
            products: signal<ProductItem[]>([mockProduct]),
            getProductBySlug: () => of(mockProduct),
          },
        },
        { provide: AuthService, useValue: { isAuthenticated: signal(false), user: signal(null) } },
        { provide: CartService, useValue: { notification: signal(''), add: () => {} } },
        { provide: I18nService, useValue: { lang: signal('vi') } },
        {
          provide: ReviewsService,
          useValue: {
            getPageForProduct: () => of({ reviews: [], total: 0, average: 0, ratedCount: 0, page: 1, totalPages: 0 }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('fetches the product by slug from the backend', async () => {
    await fixture.whenStable();
    expect(component.product()).toEqual(mockProduct);
    expect(component.productLoading()).toBe(false);
  });

  it('opens the origin story from the existing QR URL and keeps the product page accessible', async () => {
    const page: HTMLElement = fixture.nativeElement;
    const link = page.querySelector<HTMLAnchorElement>('.origin-qr a[download]');
    const preview = page.querySelector<HTMLAnchorElement>('.origin-preview');
    const encoded = link && new URL(link.href).searchParams.get('url');
    expect(encoded && new URL(encoded).pathname).toBe('/san-pham/test-product');
    expect(encoded && new URL(encoded).searchParams.get('nguon-goc')).toBe('1');
    expect(link?.download).toBe('qr-test-product.png');
    expect(preview?.href).toBe(encoded);
    expect(preview?.target).toBe('_blank');

    queryParams.next(convertToParamMap({ 'nguon-goc': '1' }));
    await fixture.whenStable();
    const origin = page.querySelector('app-product-origin');
    expect(origin?.textContent).toContain('Hà Nội');
    expect(origin?.textContent).toContain('Bát Tràng');
    expect(origin?.textContent).toContain('Thu hái quả chín');
    const roast = origin?.querySelector<HTMLButtonElement>('.process-steps button:nth-child(3)');
    roast?.click();
    await fixture.whenStable();
    expect(origin?.querySelector('.step-copy h3')?.textContent).toBe('Rang và làm nguội');
    expect(page.querySelector('.origin-qr')).toBeNull();
    expect(page.querySelector('.purchase-panel')).toBeNull();
  });
});
