import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface GiftJson {
  id: number;
  name: string;
  description?: string;
  cat?: string;
  type?: string;
  region?: string;
  province?: string;
  price: number;
  rate?: number;
  reviews?: number;
  inStock?: boolean;
  icon?: string;
  images?: string[];
  source?: string;
  link?: string;
}

@Injectable({ providedIn: 'root' })
export class GiftService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/gifts';

  getGifts(): Observable<GiftJson[]> {
    return this.http.get<GiftJson[]>(this.endpoint);
  }

  getGift(id: number): Observable<GiftJson> {
    return this.http.get<GiftJson>(`${this.endpoint}/${id}`);
  }
}
