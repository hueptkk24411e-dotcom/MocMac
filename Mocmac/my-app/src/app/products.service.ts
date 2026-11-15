import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, map, of, startWith, switchMap, tap } from 'rxjs';
import { ReviewSummary } from './reviews-service';

export interface RegionItem {
  name: string;
  slug: string;
  image: string;
  description: string;
  productCount: number;
}

export interface ProductVariant {
  id: string;
  label: string;
  attributes: { name: string; value: string; swatch?: string }[];
  price: number;
  available: boolean;
  image?: string;
  images?: string[];
}

export interface ProductItem {
  id: number;
  slug: string;
  name: string;
  cat: string;
  type: string;
  region: string;
  province: string;
  village: string;

  price: number;
  rate: number;
  reviews: number;
  ocop: number;

  heritage: 'Vàng' | 'Bạc' | null;

  seasons: number[];

  // MỘT SẢN PHẨM CÓ THỂ CÓ NHIỀU OCCASION
  occasion: string[];

  inStock: boolean;
  preorder: boolean;
  icon: string;
  badges: string[];

  images?: string[];
  variants?: ProductVariant[];
  referenceImages?: string[];
  description?: string;
  reviewStats?: ReviewSummary;
}

export interface Filters {
  q: string;
  cat: string[];
  type: string[];
  region: string[];
  province: string;
  village: string;
  price: string[];
  ocop: string[];
  heri: string[];
  occ: string[];
  status: string[];
  months: string[];

  now: boolean;
  rate: number;

  tab: string;
  sort: string;
  view: 'grid' | 'list';
  page: number;
}

export type ArrayKey =
  | 'cat'
  | 'type'
  | 'region'
  | 'price'
  | 'ocop'
  | 'heri'
  | 'occ'
  | 'status'
  | 'months';

export const ARRAY_KEYS: ArrayKey[] = [
  'cat',
  'type',
  'region',
  'price',
  'ocop',
  'heri',
  'occ',
  'status',
  'months'
];

export const defaultFilters = (): Filters => ({
  q: '',

  cat: [],
  type: [],
  region: [],

  province: '',
  village: '',

  price: [],
  ocop: [],
  heri: [],
  occ: [],
  status: [],
  months: [],

  now: false,
  rate: 0,

  tab: 'Tất cả',
  sort: 'popular',
  view: 'grid',
  page: 1
});

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');


export const PRED: Record<
  ArrayKey,
  (p: ProductItem, v: string) => boolean
> = {

  cat: (p, v) =>
    v === 'Sản phẩm OCOP'
      ? p.ocop > 0
      : p.cat === v,

  type: (p, v) =>
    p.type === v,

  region: (p, v) =>
    p.region === v,

  price: (p, v) => {
    switch (v) {
      case 'lt200':
        return p.price < 200000;

      case '200-500':
        return p.price >= 200000 && p.price <= 500000;

      case '500-1000':
        return p.price > 500000 && p.price <= 1000000;

      case 'gt1000':
        return p.price > 1000000;

      default:
        return false;
    }
  },

  ocop: (p, v) =>
    p.ocop === Number(v),

  heri: (p, v) =>
    p.heritage === v,

  // MỘT SẢN PHẨM CÓ THỂ CÓ NHIỀU OCCASION
  occ: (p, v) =>
    p.occasion.includes(v),

  status: (p, v) =>
    v === 'in'
      ? p.inStock
      : p.preorder,

  months: (p, v) => {
    const [a, b] = v.split('-').map(Number);

    return p.seasons.some(
      m => m >= a && m <= b
    );
  }
};


export function matchFilters(
  p: ProductItem,
  f: Filters,
  month = new Date().getMonth() + 1
): boolean {

  // SEARCH
  if (f.q) {
    const q = norm(f.q);

    const text = norm(
      `${p.name} ${p.province} ${p.village} ${p.type} ${p.region} ${p.cat} ${p.slug}`
    );

    if (!text.includes(q)) {
      return false;
    }
  }

  // TAB
  if (
    f.tab !== 'Tất cả' &&
    !PRED.cat(p, f.tab)
  ) {
    return false;
  }

  // CÁC FILTER
  for (const k of ARRAY_KEYS) {

    if (
      f[k].length &&
      !f[k].some(v => PRED[k](p, v))
    ) {
      return false;
    }
  }

  // TỈNH
  if (
    f.province &&
    p.province !== f.province
  ) {
    return false;
  }

  // LÀNG NGHỀ
  if (
    f.village &&
    p.village !== f.village
  ) {
    return false;
  }

  // MÙA HIỆN TẠI
  if (
    f.now &&
    !p.seasons.includes(month)
  ) {
    return false;
  }

  // ĐÁNH GIÁ
  if (
    f.rate &&
    p.rate < f.rate
  ) {
    return false;
  }

  return true;
}


export function toParams(
  f: Filters
): Record<string, string | number> {

  const d = defaultFilters();

  const o: Record<string, string | number> = {};

  for (const k of ARRAY_KEYS) {
    if (f[k].length) {
      o[k] = f[k].join(',');
    }
  }

  for (
    const k of [
      'q',
      'province',
      'village',
      'tab',
      'sort',
      'view'
    ] as const
  ) {
    if (f[k] !== d[k]) {
      o[k] = f[k];
    }
  }

  if (f.now) {
    o['now'] = 1;
  }

  if (f.rate) {
    o['rate'] = f.rate;
  }

  if (f.page > 1) {
    o['page'] = f.page;
  }

  return o;
}


export function fromParams(
  p: {
    get(k: string): string | null;
  }
): Filters {

  const f = defaultFilters();

  for (const k of ARRAY_KEYS) {
    f[k] =
      p.get(k)
        ?.split(',')
        .filter(Boolean) ?? [];
  }

  f.q =
    p.get('q') ?? '';

  f.province =
    p.get('province') ?? '';

  f.village =
    p.get('village') ?? '';

  f.tab =
    p.get('tab') ?? 'Tất cả';

  f.sort =
    p.get('sort') ?? 'popular';

  f.view =
    p.get('view') === 'list'
      ? 'list'
      : 'grid';

  f.now =
    p.get('now') === '1';

  f.rate =
    Number(p.get('rate')) || 0;

  f.page =
    Math.max(
      1,
      Number(p.get('page')) || 1
    );

  return f;
}


@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly reload = new Subject<void>();
  readonly loading = signal(true);
  readonly error = signal('');

  private normalize(product: ProductItem): ProductItem {
    return {
      ...product,
      rate: Number(product.reviewStats?.average) || 0,
      reviews: Number(product.reviewStats?.count) || 0,
      occasion: Array.isArray(product.occasion) ? product.occasion : product.occasion ? [product.occasion] : [],
      seasons: Array.isArray(product.seasons) ? product.seasons : [],
      badges: Array.isArray(product.badges) ? product.badges : [],
      images: Array.isArray(product.images) ? product.images : [],
      variants: Array.isArray(product.variants) ? product.variants : [],
    };
  }

  readonly products = toSignal(this.reload.pipe(
    startWith(undefined),
    switchMap(() => {
      this.loading.set(true);
      this.error.set('');
      return this.http.get<ProductItem[] | { products: ProductItem[] }>('/api/products?limit=100').pipe(
        map((data): ProductItem[] => (Array.isArray(data) ? data : data.products ?? []).map((p) => this.normalize(p))),
        tap(() => this.loading.set(false)),
        catchError(() => {
          this.loading.set(false);
          this.error.set('Chưa tải được sản phẩm. Vui lòng thử lại.');
          return of([] as ProductItem[]);
        }),
      );
    }),
  ), { initialValue: [] as ProductItem[] });

  refresh(): void {
    this.reload.next();
  }

  getProductBySlug(slug: string): Observable<ProductItem> {
    return this.http.get<ProductItem>('/api/products/' + encodeURIComponent(slug))
      .pipe(map((product) => this.normalize(product)));
  }

  readonly regions = toSignal(
    this.http.get<RegionItem[] | { regions: RegionItem[] }>('/api/regions').pipe(
      map((data) => Array.isArray(data) ? data : data.regions ?? []),
      catchError(() => of([] as RegionItem[])),
    ), { initialValue: [] as RegionItem[] },
  );
}
