import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { CartService } from '../cart.service';
import {
  ArrayKey, Filters, PRED, ProductItem, ProductsService, defaultFilters, fromParams, matchFilters, norm, toParams,
} from '../products.service';

interface Opt { v: string; l: string; n: number; icon?: string; }
const PAGE_SIZE = 12;
const ARR: ArrayKey[] = ['cat', 'type', 'region', 'price', 'ocop', 'heri', 'occ', 'status', 'months'];

@Component({
  selector: 'app-products-component',
  standalone: false,
  templateUrl: './products-component.html',
  styleUrl: './products-component.css',
})
export class ProductsComponent {
  private svc = inject(ProductsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  cart = inject(CartService);

  all = this.svc.products;
  applied = toSignal(this.route.queryParamMap.pipe(map(fromParams)), { initialValue: defaultFilters() });
  draft = signal<Filters>(defaultFilters());
  favs = signal<Set<number>>(new Set());
  showFilters = signal(false);
  brokenImg = signal<Set<string>>(new Set());
  private imgIdx = signal<Record<number, number>>({});
  readonly tabs = ['Tất cả', 'Đặc sản', 'Thủ công mỹ nghệ', 'Cà phê - Trà', 'Sản phẩm OCOP'];
  readonly month = new Date().getMonth() + 1;
  
  // ===== KHU VỰC KHÁM PHÁ NHANH =====
  readonly quickTags = [
    'Quà Tết',
    'Đặc sản vùng miền',
    'Đồ thủ công',
    'Quà biếu đối tác',
    'Quà cưới',
    'OCOP'
  ];

  // Nhiều sản phẩm gợi ý, xếp hạng theo lượt đánh giá và điểm đánh giá
  topProducts = computed(() =>
    [...this.all()]
      .sort((a, b) => (b.reviews * 2 + b.rate * 10) - (a.reviews * 2 + a.rate * 10))
      .slice(0, 3)
  );

  // Nhiều sản phẩm nổi bật có điểm đánh giá cao
  featuredProducts = computed(() =>
    [...this.all()]
      .sort((a, b) => b.rate - a.rate || b.reviews - a.reviews)
      .slice(0, 3)
  );

  // Danh sách nhiều sản phẩm bán chạy, không chỉ một sản phẩm
  bestSellers = computed(() =>
    [...this.all()].sort((a, b) => b.reviews - a.reviews).slice(0, 4)
  );

  // Danh sách nhiều sản phẩm có giá thấp
  bestPrices = computed(() =>
    [...this.all()].sort((a, b) => a.price - b.price).slice(0, 4)
  );

  // Các thẻ khám phá nhanh chuyển thành tiêu chí lọc thực tế.
  // Tránh tìm nguyên cụm chữ như "Đặc sản vùng miền" trong tên sản phẩm.
  quickSearch(tag: string) {
    const current = this.applied();
    const f = {
      ...defaultFilters(),
      sort: current.sort,
      view: current.view,
      page: 1,
    } as Filters;

    switch (tag) {
      case 'Quà Tết':
        f.occ = ['Quà Tết'];
        break;
      case 'Đặc sản vùng miền':
        f.cat = ['Đặc sản'];
        break;
      case 'Đồ thủ công':
        f.cat = ['Thủ công mỹ nghệ'];
        break;
      case 'Quà biếu đối tác':
        f.occ = ['Quà biếu đối tác'];
        break;
      case 'Quà cưới':
        f.occ = ['Quà cưới'];
        break;
      case 'OCOP':
        f.cat = ['Sản phẩm OCOP'];
        break;
      default:
        f.q = tag;
    }

    this.draft.set({ ...f });
    this.go(f);
  }


  constructor() {
    effect(() => { const a = this.applied(); untracked(() => this.draft.set({ ...a })); });
  }

  private count(k: ArrayKey, v: string) { return this.all().filter(p => PRED[k](p, v)).length; }
  private opts(k: ArrayKey, list: [string, string, string?][]): Opt[] {
    return list.map(([v, l, icon]) => ({ v, l, icon, n: this.count(k, v) }));
  }

  catOpts = computed(() => this.opts('cat', [['Đặc sản', 'Đặc sản', '🥭'], ['Thủ công mỹ nghệ', 'Thủ công mỹ nghệ', '🧺'], ['Cà phê - Trà', 'Cà phê - Trà', '☕'], ['Sản phẩm OCOP', 'Sản phẩm OCOP', '⭐']]));
  typeOpts = computed(() => this.opts('type', ['Gốm', 'Mây tre đan', 'Sơn mài', 'Thổ cẩm', 'Đặc sản khô', 'Trà', 'Cà phê', 'Khác'].map(x => [x, x] as [string, string])));
  regionOpts = computed(() => this.opts('region', ['Miền Bắc', 'Miền Trung', 'Tây Nguyên', 'Miền Nam'].map(x => [x, x] as [string, string])));
  priceOpts = computed(() => this.opts('price', [['lt200', 'Dưới 200.000đ'], ['200-500', '200.000đ - 500.000đ'], ['500-1000', '500.000đ - 1.000.000đ'], ['gt1000', 'Trên 1.000.000đ']]));
  ocopOpts = computed(() => this.opts('ocop', [['3', 'OCOP 3 sao'], ['4', 'OCOP 4 sao'], ['5', 'OCOP 5 sao']]));
  heriOpts = computed(() => this.opts('heri', [['Vàng', 'Di sản Vàng'], ['Bạc', 'Di sản Bạc']]));
  occOpts = computed(() => this.opts('occ', ['Quà Tết', 'Quà cưới', 'Quà tân gia', 'Quà biếu đối tác'].map(x => [x, x] as [string, string])));
  statusOpts = computed(() => this.opts('status', [['in', 'Còn hàng'], ['pre', 'Pre-order']]));
  monthOpts = computed(() => this.opts('months', [['1-3', 'Tháng 1-3'], ['4-6', 'Tháng 4-6'], ['7-9', 'Tháng 7-9'], ['10-12', 'Tháng 10-12']]));
  provinces = computed(() => [...new Set(this.all().map(p => p.province))].sort((a, b) => a.localeCompare(b, 'vi')));
  villages = computed(() => [...new Set(this.all().map(p => p.village).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')));

  // Danh sách khớp chính xác với từ khóa và toàn bộ bộ lọc đã chọn.
  filtered = computed(() => {
    const f = this.applied(), m = this.month;
    const list = this.all().filter(p => matchFilters(p, f, m));
    const sorters: Record<string, (a: ProductItem, b: ProductItem) => number> = {
      popular: (a, b) => b.reviews - a.reviews,
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      rating: (a, b) => b.rate - a.rate,
      newest: (a, b) => b.id - a.id,
    };
    return list.sort(sorters[f.sort] ?? sorters['popular']);
  });

  // Gợi ý liên quan xuất hiện SAU kết quả khớp chính xác.
  // Sản phẩm gợi ý không bị trùng với danh sách chính và được xếp theo độ liên quan.
  relatedProducts = computed<ProductItem[]>(() => {
    const f = this.applied();
    const primary = this.filtered();
    const all = this.all();
    const hasCriteria = Boolean(
      f.q || f.cat.length || f.type.length || f.region.length || f.province ||
      f.village || f.price.length || f.ocop.length || f.heri.length || f.occ.length ||
      f.status.length || f.months.length || f.now || f.rate || f.tab !== 'Tất cả'
    );

    if (!hasCriteria || all.length === 0) return [];

    const primaryIds = new Set(primary.map(p => p.id));
    const anchor = primary[0];
    const queryTerms = norm(f.q).split(/\s+/).filter(term => term.length > 1);

    const scoreProduct = (p: ProductItem): number => {
      let score = 0;
      const hasAny = (key: ArrayKey) => f[key].some(v => PRED[key](p, v));

      if (f.tab !== 'Tất cả' && PRED.cat(p, f.tab)) score += 5;
      if (hasAny('cat')) score += 5;
      if (hasAny('type')) score += 4;
      if (hasAny('region')) score += 3;
      if (f.province && p.province === f.province) score += 3;
      if (f.village && p.village === f.village) score += 4;
      if (hasAny('ocop')) score += 3;
      if (hasAny('heri')) score += 2;
      if (hasAny('occ')) score += 3;
      if (hasAny('price')) score += 1;
      if (hasAny('status')) score += 1;
      if (hasAny('months')) score += 1;
      if (f.now && p.seasons.includes(this.month)) score += 1;
      if (f.rate && p.rate >= f.rate) score += 1;

      const text = norm([
        p.name, p.cat, p.type, p.region, p.province, p.village,
        ...(p.occasion ?? []), ...(p.badges ?? []), p.heritage ?? ''
      ].join(' '));
      score += queryTerms.filter(term => text.includes(term)).length * 2;

      if (anchor) {
        if (p.cat === anchor.cat) score += 3;
        if (p.type === anchor.type) score += 3;
        if (p.village && p.village === anchor.village) score += 4;
        if (p.region === anchor.region) score += 2;
        if (p.province === anchor.province) score += 1;
        if (p.occasion.some(o => anchor.occasion.includes(o))) score += 2;
      }

      return score;
    };

    return all
      .filter(p => !primaryIds.has(p.id))
      .map(p => ({ product: p, score: scoreProduct(p) }))
      .filter(item => item.score >= 2)
      .sort((a, b) => b.score - a.score || b.product.reviews - a.product.reviews)
      .slice(0, 8)
      .map(item => item.product);
  });
  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  page = computed(() => Math.min(this.applied().page, this.totalPages()));
  paged = computed(() => this.filtered().slice((this.page() - 1) * PAGE_SIZE, this.page() * PAGE_SIZE));
  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  // ---- bộ lọc nháp (sidebar) ----
  has(k: ArrayKey, v: string) { return this.draft()[k].includes(v); }
  toggle(k: ArrayKey, v: string) {
    this.draft.update(d => ({ ...d, [k]: d[k].includes(v) ? d[k].filter(x => x !== v) : [...d[k], v] }));
  }
  setField<K extends 'province' | 'village' | 'q' | 'rate'>(k: K, v: Filters[K]) { this.draft.update(d => ({ ...d, [k]: v })); }
  toggleNow() { this.draft.update(d => ({ ...d, now: !d.now })); }

  // ---- đẩy lên URL ----
  private go(f: Filters) { this.router.navigate([], { relativeTo: this.route, queryParams: toParams(f) }); }
  apply() { this.go({ ...this.draft(), tab: this.applied().tab, sort: this.applied().sort, view: this.applied().view, page: 1 }); this.showFilters.set(false); }
  clear() { const a = this.applied(); this.go({ ...defaultFilters(), view: a.view, sort: a.sort }); }
  setTab(t: string) { this.go({ ...this.applied(), tab: t, page: 1 }); }
  setSort(s: string) { this.go({ ...this.applied(), sort: s, page: 1 }); }
  setView(v: 'grid' | 'list') { this.go({ ...this.applied(), view: v }); }
  setPage(n: number) { this.go({ ...this.applied(), page: n }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  search() { this.go({ ...this.applied(), q: this.draft().q.trim(), page: 1 }); }

  get activeCount() {
    const f = this.applied();
    return ARR.reduce((n, k) => n + f[k].length, 0) + (f.province ? 1 : 0) + (f.village ? 1 : 0) + (f.now ? 1 : 0) + (f.rate ? 1 : 0) + (f.q ? 1 : 0);
  }

  // ---- ảnh nhiều link ----
  imgs(p: ProductItem): string[] { return (p.images ?? []).filter(u => u && !this.brokenImg().has(u)); }
  idxOf(p: ProductItem) { const n = this.imgs(p).length; return n ? (this.imgIdx()[p.id] ?? 0) % n : 0; }
  cur(p: ProductItem) { return this.imgs(p)[this.idxOf(p)]; }
  step(p: ProductItem, d: number, e: Event) {
    e.stopPropagation();
    const n = this.imgs(p).length;
    this.imgIdx.update(m => ({ ...m, [p.id]: (this.idxOf(p) + d + n) % n }));
  }
  setImg(p: ProductItem, i: number, e: Event) { e.stopPropagation(); this.imgIdx.update(m => ({ ...m, [p.id]: i })); }
  imgError(url: string) { this.brokenImg.update(s => new Set(s).add(url)); }

  // ---- hiển thị ----
  fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ'; }
  stars(r: number) { const n = Math.round(r); return '★'.repeat(n) + '☆'.repeat(5 - n); }
  toggleFav(id: number) { this.favs.update(s => { const t = new Set(s); t.has(id) ? t.delete(id) : t.add(id); return t; }); }
  addToCart(e: Event) { e.stopPropagation(); this.cart.add(); }
}