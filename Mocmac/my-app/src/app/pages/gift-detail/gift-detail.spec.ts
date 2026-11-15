import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, Router, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { CartService } from '../../cart.service';
import { GiftDetailComponent } from './gift-detail';

describe('GiftDetailComponent', () => {
  let fixture: ComponentFixture<GiftDetailComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GiftDetailComponent],
      imports: [RouterModule.forRoot([])],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '1' })) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GiftDetailComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.inject(CartService).clear();
  });

  it('loads the selected gift and its gallery from the gifts API', () => {
    fixture.detectChanges();

    httpMock.expectOne('/api/gifts').flush([]);
    httpMock.expectOne('/api/gifts/1').flush({
      id: 1,
      name: 'Set Quà Lộc 3',
      description: 'Bộ quà tặng',
      cat: 'Quà tặng',
      type: 'Set quà',
      price: 899000,
      images: ['https://example.com/gift.jpg'],
      inStock: true,
    });

    fixture.detectChanges();
    expect(fixture.componentInstance.gift()?.name).toBe('Set Quà Lộc 3');
    expect(fixture.componentInstance.selectedImage()).toBe('https://example.com/gift.jpg');
    expect(fixture.nativeElement.textContent).toContain('Set Quà Lộc 3');
    expect(fixture.nativeElement.textContent).toContain('Chọn số lượng và đặt hàng');
    expect(fixture.nativeElement.textContent).toContain('Thêm vào giỏ');
    expect(fixture.nativeElement.textContent).toContain('Mua ngay');

    fixture.componentInstance.increaseQuantity();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1.798.000đ');
    fixture.componentInstance.addToCart();
    expect(TestBed.inject(CartService).lines()).toEqual([
      { productId: 1, quantity: 2, itemType: 'gift' },
    ]);

    const cart = TestBed.inject(CartService);
    cart.clear();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.buyNow();
    expect(cart.lines()).toEqual([{ productId: 1, quantity: 2, itemType: 'gift' }]);
    expect(navigate).toHaveBeenCalledWith(['/gio-hang']);
  });
});
