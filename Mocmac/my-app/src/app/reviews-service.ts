import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface ProductReviewItem {
  id?: string;
  productId?: number;
  name: string;
  rating?: number;
  content: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface CreateProductReview {
  userName: string;
  rating: number;
  content: string;
}

interface ApiReview {
  _id?: string;
  id?: string;
  productId?: number | string;
  productName?: string;
  userName?: string;
  username?: string;
  name?: string;
  rating?: number | string | null;
  content?: string;
  createdAt?: string | Date | null;
  isDemo?: boolean;
}

interface ReviewsEnvelope {
  success?: boolean;
  total?: number;
  reviews?: ApiReview[];
}

type ReviewsResponse = ApiReview[] | ReviewsEnvelope;
type CreateReviewResponse = ApiReview | { success?: boolean; message?: string; review?: ApiReview };

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:3000/api/products';

  getForProduct(productId: number): Observable<ProductReviewItem[]> {
    return this.http
      .get<ReviewsResponse>(`${this.apiBase}/${productId}/reviews`)
      .pipe(
        map((response): ProductReviewItem[] => {
          const rows: ApiReview[] = Array.isArray(response)
            ? response
            : response.reviews ?? [];
          return rows.map((row): ProductReviewItem => this.toUiReview(row));
        })
      );
  }

  createForProduct(
    productId: number,
    payload: CreateProductReview
  ): Observable<ProductReviewItem> {
    return this.http
      .post<CreateReviewResponse>(`${this.apiBase}/${productId}/reviews`, payload)
      .pipe(
        map((response): ProductReviewItem => {
          const row: ApiReview =
            'review' in response && response.review
              ? response.review
              : response as ApiReview;
          return this.toUiReview(row);
        })
      );
  }

  private toUiReview(row: ApiReview): ProductReviewItem {
    const date = row.createdAt ? new Date(row.createdAt) : null;
    const createdAt =
      date && !Number.isNaN(date.getTime())
        ? new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }).format(date)
        : '';

    const rawRating = row.rating === undefined || row.rating === null || row.rating === ''
      ? undefined
      : Number(row.rating);
    const rating = rawRating !== undefined && Number.isFinite(rawRating) && rawRating >= 1 && rawRating <= 5
      ? rawRating
      : undefined;

    return {
      id: String(row._id ?? row.id ?? ''),
      productId: Number(row.productId ?? 0),
      name: String(row.userName ?? row.name ?? row.username ?? 'Khách hàng'),
      rating,
      content: String(row.content ?? ''),
      createdAt,
      isDemo: Boolean(row.isDemo)
    };
  }
}
