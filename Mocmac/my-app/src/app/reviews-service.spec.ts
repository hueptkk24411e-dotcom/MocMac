import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReviewsService } from './reviews-service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReviewsService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('shows userName/content from imported MongoDB records and preserves their date', () => {
    service.getPageForProduct(2).subscribe((page) => {
      expect(page.total).toBe(2);
      expect(page.average).toBe(4.5);
      expect(page.reviews[0]).toEqual({ id: 'stored-id', name: 'Lê Thu Hà', rating: 5, content: 'Đóng gói cẩn thận, sản phẩm nhận được rất ổn.', createdAt: '2026-10-18T09:15:00Z' });
    });
    http.expectOne('/api/reviews/product/2?page=1&limit=10').flush({ total: 2, avgRating: 4.5, ratedCount: 2, page: 1, totalPages: 1, reviews: [{ _id: 'stored-id', productId: 2, userName: 'Lê Thu Hà', rating: 5, content: 'Đóng gói cẩn thận, sản phẩm nhận được rất ổn.', createdAt: '2026-10-18T09:15:00Z', isDemo: true }] });
  });

  it('also supports account-based reviews without inventing a missing date', () => {
    service.getForProduct(2).subscribe((rows) => {
      expect(rows[0].name).toBe('Người dùng');
      expect(rows[0].content).toBe('Nội dung đã lưu');
      expect(rows[0].createdAt).toBe('');
    });
    http.expectOne('/api/reviews/product/2?page=1&limit=10').flush({ reviews: [{ _id: 'account-review', user: { name: 'Người dùng' }, rating: 4, comment: 'Nội dung đã lưu' }], total: 1, avgRating: 4, ratedCount: 1 });
  });

  it('propagates a failed request instead of returning a fabricated empty list', () => {
    let failed = false;
    service.getForProduct(2).subscribe({ error: () => failed = true });
    http.expectOne('/api/reviews/product/2?page=1&limit=10').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(failed).toBe(true);
  });
});
