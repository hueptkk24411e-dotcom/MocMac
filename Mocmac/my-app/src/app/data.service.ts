import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

export interface Product { name: string; place: string; price: string; cat: string; rate: number; reviews: number; icon: string; }
export interface Dataset {
  home: { products: Product[] };
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);
  dataset = toSignal(this.http.get<Dataset>('data/dataset.json'));
}
