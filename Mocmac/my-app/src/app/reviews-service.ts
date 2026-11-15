import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface ProductReviewItem {
  id: string;
  name: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
  ratedCount: number;
}

export interface ProductReviewPage {
  reviews: ProductReviewItem[];
  total: number;
  average: number;
  ratedCount: number;
  page: number;
  totalPages: number;
}

export interface CreateReviewData {
  userName?: string;
  rating: number;
  content: string;
}

interface ApiReview {
  _id?: string;
  id?: string;
  user?: { name?: string } | string | null;
  userName?: string;
  name?: string;
  rating?: number;
  comment?: string;
  content?: string;
  createdAt?: string;
}

interface ReviewResponse {
  success?: boolean;
  reviews?: ApiReview[];
  total?: number;
  avgRating?: number;
  ratedCount?: number;
  page?: number;
  totalPages?: number;
}

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private readonly http = inject(HttpClient);

  getPageForProduct(productId: number, page = 1): Observable<ProductReviewPage> {
    return this.http.get<ReviewResponse>(`/api/reviews/product/${productId}`, {
      params: { page, limit: 10 },
    }).pipe(map((response) => {
      if (response.success === false) throw new Error('Không thể tải đánh giá.');
      return {
        reviews: (response.reviews ?? []).map((row) => this.toProductReviewItem(row)),
        total: Number(response.total) || 0,
        average: Number(response.avgRating) || 0,
        ratedCount: Number(response.ratedCount) || 0,
        page: Number(response.page) || page,
        totalPages: Number(response.totalPages) || 0,
      };
    }));
  }

  getForProduct(productId: number): Observable<ProductReviewItem[]> {
    return this.getPageForProduct(productId).pipe(map((result) => result.reviews));
  }

  createForProduct(productId: number, data: CreateReviewData): Observable<ProductReviewItem> {
    return this.http.post<{ review: ApiReview }>('/api/reviews', {
      productId, rating: data.rating, comment: data.content,
    }).pipe(map((response) => this.toProductReviewItem(response.review)));
  }

  private toProductReviewItem(row: ApiReview): ProductReviewItem {
    const accountName = typeof row.user === 'object' && row.user ? row.user.name : '';
    return {
      id: String(row._id ?? row.id ?? ''),
      name: String(accountName || row.userName || row.name || 'Khách hàng'),
      rating: Number(row.rating) || 0,
      content: String(row.content || row.comment || ''),
      createdAt: String(row.createdAt ?? ''),
    };
  }
}
