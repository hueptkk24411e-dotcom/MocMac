import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

export interface Product { name: string; place: string; price: string; cat: string; rate: number; reviews: number; icon: string; }
export interface Dataset {
  header: { left: string[]; right: string[]; menu: string[] };
  home: {
    features: { title: string; desc: string; icon: string }[];
    polaroids: { title: string; color: string }[];
    regions: { name: string; color: string }[];
    tabs: string[];
    products: Product[];
    commits: { title: string; desc: string; icon: string }[];
  };
  footer: { social: string[]; pays: string[]; cols: { title: string; links: string[] }[] };
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);
  dataset = toSignal(this.http.get<Dataset>('data/dataset.json'));
}
