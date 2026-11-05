import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { convertToParamMap } from '@angular/router';
import { ProductsService, defaultFilters, fromParams, matchFilters, ProductItem } from './products.service';
import { CartService } from './cart.service';
import { ReviewsService } from './reviews-service';

describe('Product flow regressions', () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      clear: () => storage.clear(), removeItem: (key: string) => storage.delete(key)
    } });
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('normalizes string occasions so gift filters match', () => {
    const service = TestBed.inject(ProductsService);
    TestBed.inject(HttpTestingController).expectOne('/api/products').flush([{ id: '1', name: 'Trà', price: '120000', occasion: 'Quà Tết' }]);
    const product = service.products()[0];
    expect(product.id).toBe(1);
    expect(product.price).toBe(120000);
    expect(matchFilters(product, { ...defaultFilters(), occ: ['Quà Tết'] })).toBe(true);
    expect(service.catalogLoaded()).toBe(true);
  });

  it('finishes loading even when the catalog request fails', () => {
    const service = TestBed.inject(ProductsService);
    TestBed.inject(HttpTestingController).expectOne('/api/products').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(service.catalogLoaded()).toBe(true);
    expect(service.catalogError()).toBe(true);
    expect(service.products()).toEqual([]);
  });

  it('rejects fractional and infinite page numbers', () => {
    for (const page of ['1.5', 'Infinity', '-3', 'abc']) {
      expect(fromParams(convertToParamMap({ page })).page).toBe(1);
    }
  });

  it('stores selected quantities and restores the cart after reload', () => {
    const cart = TestBed.inject(CartService);
    cart.add(1, 'Trà', 3);
    TestBed.tick();
    expect(JSON.parse(localStorage.getItem('mocmac-cart')!)).toEqual([{ productId: 1, quantity: 3 }]);
    expect(TestBed.runInInjectionContext(() => new CartService()).count()).toBe(3);
  });

  it('caps quantities and ignores invalid product IDs', () => {
    const cart = TestBed.inject(CartService);
    cart.add(1, 'Trà', 99);
    cart.increase(1);
    cart.add(-2, 'Invalid');
    expect(cart.lines()).toEqual([{ productId: 1, quantity: 99 }]);
  });

  it('uses the same origin for review requests and keeps missing ratings unrated', () => {
    const reviews = TestBed.inject(ReviewsService);
    let rating: number | undefined = 5;
    reviews.getForProduct(1).subscribe(rows => rating = rows[0].rating);
    TestBed.inject(HttpTestingController).expectOne('/api/products/1/reviews').flush({ reviews: [{ id: 'a', rating: null, userName: 'Khách' }] });
    expect(rating).toBeUndefined();
  });
});

