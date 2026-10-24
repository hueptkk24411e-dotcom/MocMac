import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, tap } from 'rxjs';

// ============================================================
// 1. MODEL SẢN PHẨM
// ============================================================

export interface ProductItem {
  id: number;
  name: string;
  cat: string;
  type: string;
  region: string;
  province: string;
  village: string;

  description?: string;

  price: number;
  rate: number;
  reviews: number;
  ocop: number;

  heritage: 'Vàng' | 'Bạc' | null;

  seasons: number[];
  occasion: string[];

  inStock: boolean;
  preorder: boolean;

  icon: string;
  badges: string[];

  images?: string[];
}

// ============================================================
// 2. MODEL FILTER
// ============================================================

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

// ============================================================
// 3. ARRAY KEY
// ============================================================

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

// ============================================================
// 4. FILTER MẶC ĐỊNH
// ============================================================

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

// ============================================================
// 5. CHUẨN HÓA CHỮ
// ============================================================

export const norm = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

// ============================================================
// 6. LOGIC FILTER
// ============================================================

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
        return p.price >= 200000 &&
               p.price <= 500000;

      case '500-1000':
        return p.price > 500000 &&
               p.price <= 1000000;

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

  occ: (p, v) =>
    p.occasion.includes(v),

  status: (p, v) =>
    v === 'in'
      ? p.inStock
      : p.preorder,

  months: (p, v) => {
    const [a, b] = v.split('-').map(Number);

    return p.seasons.some(
      (m: number) => m >= a && m <= b
    );
  }
};

// ============================================================
// 7. LỌC SẢN PHẨM
// ============================================================

export function matchFilters(
  p: ProductItem,
  f: Filters,
  month: number = new Date().getMonth() + 1
): boolean {

  // Tìm kiếm theo tên, tỉnh, làng nghề, loại và vùng.
  if (f.q) {
    const q = norm(f.q);

    const text = norm(
      `${p.name} ${p.province} ${p.village} ${p.type} ${p.region}`
    );

    if (!text.includes(q)) {
      return false;
    }
  }

  // Tab danh mục.
  if (
    f.tab !== 'Tất cả' &&
    !PRED.cat(p, f.tab)
  ) {
    return false;
  }

  // Các filter dạng mảng.
  for (const k of ARRAY_KEYS) {
    if (
      f[k].length > 0 &&
      !f[k].some(
        (v: string) => PRED[k](p, v)
      )
    ) {
      return false;
    }
  }

  // Tỉnh thành.
  if (
    f.province &&
    p.province !== f.province
  ) {
    return false;
  }

  // Làng nghề.
  if (
    f.village &&
    p.village !== f.village
  ) {
    return false;
  }

  // Mùa hiện tại.
  if (
    f.now &&
    !p.seasons.includes(month)
  ) {
    return false;
  }

  // Số sao tối thiểu.
  if (
    f.rate > 0 &&
    p.rate < f.rate
  ) {
    return false;
  }

  return true;
}

// ============================================================
// 8. CHUYỂN FILTER THÀNH QUERY PARAMETERS
// ============================================================

export function toParams(
  f: Filters
): Record<string, string | number> {

  const d = defaultFilters();

  const o: Record<string, string | number> = {};

  for (const k of ARRAY_KEYS) {
    if (f[k].length > 0) {
      o[k] = f[k].join(',');
    }
  }

  const keys = [
    'q',
    'province',
    'village',
    'tab',
    'sort',
    'view'
  ] as const;

  for (const k of keys) {
    if (f[k] !== d[k]) {
      o[k] = f[k];
    }
  }

  if (f.now) {
    o['now'] = 1;
  }

  if (f.rate > 0) {
    o['rate'] = f.rate;
  }

  if (f.page > 1) {
    o['page'] = f.page;
  }

  return o;
}

// ============================================================
// 9. ĐỌC QUERY PARAMETERS
// ============================================================

export function fromParams(
  params: {
    get(key: string): string | null;
  }
): Filters {

  const f = defaultFilters();

  for (const k of ARRAY_KEYS) {
    f[k] =
      params.get(k)
        ?.split(',')
        .filter(Boolean) ?? [];
  }

  f.q = params.get('q') ?? '';

  f.province =
    params.get('province') ?? '';

  f.village =
    params.get('village') ?? '';

  f.tab =
    params.get('tab') ?? 'Tất cả';

  f.sort =
    params.get('sort') ?? 'popular';

  f.view =
    params.get('view') === 'list'
      ? 'list'
      : 'grid';

  f.now =
    params.get('now') === '1';

  f.rate =
    Number(params.get('rate')) || 0;

  f.page = Math.max(
    1,
    Number(params.get('page')) || 1
  );

  return f;
}

// ============================================================
// 10. PRODUCTS SERVICE
// ============================================================

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  private http = inject(HttpClient);

  /** True after the first catalog request finishes, including an error response. */
  readonly catalogLoaded = signal(false);

  // QUAN TRỌNG:
  // Khai báo kiểu trả về của map là ProductItem[].
  // Điều này giúp TypeScript không suy luận sai kiểu
  // và tránh lỗi products có thể là undefined.

  readonly products = toSignal(
    this.http
      .get<
        ProductItem[] | { products: ProductItem[] }
      >('/api/products')
      .pipe(
        map((data): ProductItem[] => {

          const rawProducts: ProductItem[] =
            Array.isArray(data)
              ? data
              : data.products ?? [];

          // Chuẩn hóa dữ liệu từng sản phẩm.
          const normalized: ProductItem[] =
            rawProducts.map(
              (p): ProductItem => ({
                ...p,

                // Occasion luôn là mảng.
                occasion: Array.isArray(p.occasion)
                  ? p.occasion
                  : [],

                // Seasons luôn là mảng.
                seasons: Array.isArray(p.seasons)
                  ? p.seasons
                  : [],

                // Badges luôn là mảng.
                badges: Array.isArray(p.badges)
                  ? p.badges
                  : [],

                // Ảnh không có thì dùng mảng rỗng.
                images: Array.isArray(p.images)
                  ? p.images
                  : []
              })
            );

          return normalized;
        }),
        tap(() => this.catalogLoaded.set(true)),
        catchError((error: unknown) => {
          console.error('Không thể tải danh sách sản phẩm:', error);
          this.catalogLoaded.set(true);
          return of([] as ProductItem[]);
        })
      ),
    {
      initialValue: [] as ProductItem[]
    }
  );
}