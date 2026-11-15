import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GiftJson, GiftService } from './gift.service';

export interface OccasionTab {
  id: string;
  name: string;
}

export interface CollectionItem {
  id: number;
  name: string;
  imageUrl: string;
  tag?: string;
}

export interface CategoryTab {
  id: string;
  name: string;
}

export interface SubCategoryItem {
  id: string;
  name: string;
  iconText: string;
}

export interface ProductItem {
  id: number;
  name: string;
  category: string;
  subCategory: string;
  line: string; // dòng set quà: Lộc / Phúc / An / Yên (tách từ tên)
  imageUrl: string;
  images: string[];
  description: string;
  rating: number;
  reviewsCount: number;
  origin: string;
  region: string;
  price: number;
  icon?: string;
  inStock?: boolean;
  link?: string;
}

// ---- Bộ lọc ----
export interface FilterState {
  keyword: string;
  lines: string[];
  priceRanges: string[];
  provinces: string[];
  regions: string[];
  statuses: string[]; // 'in' | 'out'
  minRating4: boolean;
}

type ListField = 'lines' | 'priceRanges' | 'provinces' | 'regions' | 'statuses';

export interface FilterOption {
  value: string;
  count: number;
}

interface PriceRange {
  id: string;
  label: string;
  min: number; // tính cả min
  max: number; // không tính max
}

const PRICE_RANGES: PriceRange[] = [
  { id: 'lt300', label: 'Dưới 300.000đ', min: 0, max: 300000 },
  { id: '300-600', label: '300.000đ – 600.000đ', min: 300000, max: 600000 },
  { id: '600-900', label: '600.000đ – 900.000đ', min: 600000, max: 900000 },
  { id: 'gt900', label: 'Trên 900.000đ', min: 900000, max: Number.POSITIVE_INFINITY }
];

const emptyFilter = (): FilterState => ({
  keyword: '',
  lines: [],
  priceRanges: [],
  provinces: [],
  regions: [],
  statuses: [],
  minRating4: false
});

const cloneFilter = (f: FilterState): FilterState => ({
  ...f,
  lines: [...f.lines],
  priceRanges: [...f.priceRanges],
  provinces: [...f.provinces],
  regions: [...f.regions],
  statuses: [...f.statuses]
});

// Bỏ dấu + chữ thường để tìm "loc" ra "Lộc"
const normalize = (s: string): string =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

const SAVED_KEY = 'gift_saved_ids';

// Ảnh trang trí lấy từ Pinterest. Để '' thì dùng ảnh sản phẩm trong gift.json
const MEDIA = {
  hero: '',
  banner: 'https://i.pinimg.com/736x/98/f2/b6/98f2b65ecb3af808ae156e4e8083341b.jpg',
  story: '',
  collections: ['', '', '']
};

@Component({
  selector: 'app-gift-page',
  standalone: false,
  templateUrl: './gift-page.html',
  styleUrls: ['./gift-page.css', './gift-filter.css']
})
export class GiftPageComponent implements OnInit {
  isLoading = true;
  loadError = '';

  heroData = {
    badge: 'Hơn 55 năm kiến tạo',
    title: 'GIẢI PHÁP QUÀ TẶNG ',
    subtitle: 'Mỗi set quà từ Mộc Mạc là sự kết tinh giữa tay nghề thủ công tinh xảo của nghệ nhân làng nghề và hơi thở bản địa nguyên bản. Không chỉ tôn vinh gu thẩm mỹ tinh tế cùng vị thế của người trao tặng, từng tặng phẩm mây tre mộc mạc còn là cầu nối gắn kết bền chặt, thay bạn gửi trao lời chúc an khang và sự trân quý dài lâu.',
    imageUrl: ''
  };

  // Các ảnh trang trí (hero, banner, câu chuyện)
  heroImage = '';
  bannerImage = '';
  storyImage = '';

  occasions: OccasionTab[] = [
    { id: 'doi-tac', name: 'Quà đối tác' },
    { id: 'tet', name: 'Quà Tết' },
    { id: 'suc-khoe', name: 'Quà tặng sức khoẻ' },
    { id: 'luu-niem', name: 'Quà lưu niệm' },
    { id: 'tri-an', name: 'Quà tri ân' }
  ];
  selectedOccasion: string = 'doi-tac';

  // 3 bộ sưu tập nổi bật: được dựng từ gift.json sau khi tải xong
  featuredCollections: CollectionItem[] = [];

  categories: CategoryTab[] = [
    { id: 'bo-tra', name: 'Bộ trà' },
    { id: 'bo-ban-an', name: 'Bộ bàn ăn' },
    { id: 'trang-tri', name: 'Trang trí & Nghệ thuật' },
    { id: 'noi-su', name: 'Nồi sứ & Dưỡng sinh' }
  ];
  selectedCategory: string = 'bo-tra';

  subCategories: SubCategoryItem[] = [
    { id: 'jasmine', name: 'Jasmine', iconText: 'Icon' },
    { id: 'daisy', name: 'Daisy', iconText: 'Icon' },
    { id: 'camellia', name: 'Camellia', iconText: 'Icon' },
    { id: 'mau-don-ifp', name: 'Mẫu Đơn IFP', iconText: 'Icon' },
    { id: 'mau-don', name: 'Mẫu Đơn', iconText: 'Icon' },
    { id: 'anh-vu-ifp', name: 'Anh Vũ IFP', iconText: 'Icon' },
    { id: 'anna-ifp', name: 'Anna IFP', iconText: 'Icon' }
  ];
  selectedSubCategory: string = 'jasmine';

  // Danh sách sản phẩm: được nạp từ gift.json
  products: ProductItem[] = [];

  // --- BỘ LỌC ---
  readonly priceRanges = PRICE_RANGES;
  readonly sortOptions = [
    { value: 'popular', label: 'Phổ biến nhất' },
    { value: 'price-asc', label: 'Giá thấp → cao' },
    { value: 'price-desc', label: 'Giá cao → thấp' },
    { value: 'rating', label: 'Đánh giá cao' }
  ];
  sortBy = 'popular';

  draft: FilterState = emptyFilter();   // đang chỉnh trong khung bộ lọc
  applied: FilterState = emptyFilter(); // đã bấm "Áp dụng" / "Tìm"

  // Nhóm nào đang mở trong khung bộ lọc
  openGroups: Record<string, boolean> = {
    line: true,
    price: true,
    status: false,
    province: false,
    region: false,
    rating: false
  };

  // Các lựa chọn + số lượng, tính 1 lần sau khi đọc json
  lineOptions: FilterOption[] = [];
  provinceOptions: FilterOption[] = [];
  regionOptions: FilterOption[] = [];
  priceCounts: Record<string, number> = {};
  statusCounts = { inStock: 0, outStock: 0 };
  hasRatings = false;
  ratingCount = 0;

  // Sản phẩm đã lưu (tim)
  savedIds = new Set<number>();
  showSavedOnly = false;

  projectStory = {
    partner: 'GỬI GẮM TẤM LÒNG QUA TỪNG MÓN QUÀ TRUYỀN THỐNG',
    title: ' KHI MÓN QUÀ MỘC MẠC CHỞ NẶNG NÉT ĐẸP QUÊ HƯƠNG',
    description: 'Mỗi món quà tại Mộc Mạc không chỉ đơn thuần là một tặng phẩm trao tay, mà là sự chắt chiu tinh hoa thổ nhưỡng và tay nghề tài hoa của những nghệ nhân khắp mọi miền đất nước. Từ nét mộc mạc của mây tre đan lát, vẻ đẹp tao nhã của gốm men cổ truyền cho đến hương vị đượm đà của những thức trà cổ thụ hay hạt cà phê đất đỏ cao nguyên, tất cả đều chứa đựng nhịp thở của thời gian và tình yêu thuần khiết dành cho sản vật Việt Nam. Đó là nơi giá trị văn hóa bản địa được gìn giữ vẹn nguyên, đậm đà mà lắng đọng, vượt lên trên những quy chuẩn công nghiệp vô hồn.   Dù là bộ ấm chén gốm mộc nung lửa thủ công, gói trà sen Tây Hồ ướp hương sương sớm, hay chiếc giỏ mây tre nâng niu đặc sản quê hương, mỗi sự kết hợp đều chở che lời chúc bình an và lòng trân quý chân thành nhất. Trao đi một thức quà từ Mộc Mạc chính là gửi gắm một phong vị an yên trọn vẹn, để người nhận cảm nhận được hơi ấm quê nhà, phong vị đất trời và sự gắn kết bền chặt qua từng tinh túy truyền thống trao tay.  ',
    imageUrl: ''
  };

  constructor(
    private readonly giftService: GiftService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSaved();
    this.loadGifts();
  }

  // ====== ĐỌC DỮ LIỆU QUÀ TẶNG ======
  private loadGifts(): void {
    this.isLoading = true;
    this.loadError = '';

    this.giftService.getGifts().subscribe({
      next: (data) => {
        this.products = (data ?? []).map(g => this.toProduct(g));
        this.buildImages();
        this.buildFilterOptions();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Không đọc được dữ liệu quà tặng', err);
        this.loadError = 'Không tải được dữ liệu quà tặng. Vui lòng thử lại sau.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Đổi 1 phần tử gift.json thành ProductItem mà giao diện đang dùng
  private toProduct(g: GiftJson): ProductItem {
    return {
      id: g.id,
      name: g.name,
      category: g.cat ?? '',
      subCategory: g.type ?? '',
      line: this.lineOf(g),
      imageUrl: g.images?.[0] ?? '',
      images: g.images ?? [],
      description: g.description ?? '',
      rating: g.rate ?? 0,
      reviewsCount: g.reviews ?? 0,
      origin: g.province ?? '',
      region: g.region ?? '',
      price: g.price,
      icon: g.icon,
      inStock: g.inStock,
      link: g.link
    };
  }

  // "Set Quà Lộc 3" -> "Lộc", "Set quà An 5" -> "An"
  private lineOf(g: GiftJson): string {
    const m = (g.name ?? '').normalize('NFC').match(/^set\s+qu[àa]\s+(\S+)/i);
    return m ? m[1] : (g.type ?? 'Khác');
  }

  // Lấy ảnh cho hero / banner / câu chuyện / bộ sưu tập
  private buildImages(): void {
    const n = this.products.length;
    if (!n) {
      return;
    }
    const pick = (i: number) => this.products[i % n];

    this.heroImage = MEDIA.hero || pick(9).imageUrl;
    this.bannerImage = MEDIA.banner || pick(0).imageUrl;
    this.storyImage = MEDIA.story || pick(4).imageUrl;

    this.featuredCollections = [1, 2, 3].map((idx, k) => {
      const p = pick(idx);
      return {
        id: k + 1,
        name: p.name.split(' - ')[0].toUpperCase(),
        imageUrl: MEDIA.collections[k] || p.imageUrl,
        tag: p.subCategory
      };
    });
  }

  // ====== BỘ LỌC ======

  // Tính danh sách lựa chọn + số lượng từ dữ liệu
  private buildFilterOptions(): void {
    const countBy = (getter: (p: ProductItem) => string): FilterOption[] => {
      const map = new Map<string, number>();
      this.products.forEach(p => {
        const v = getter(p);
        if (v) {
          map.set(v, (map.get(v) ?? 0) + 1);
        }
      });
      return Array.from(map, ([value, count]) => ({ value, count }));
    };

    this.lineOptions = countBy(p => p.line);
    this.provinceOptions = countBy(p => p.origin);
    this.regionOptions = countBy(p => p.region);

    this.priceCounts = {};
    this.priceRanges.forEach(r => {
      this.priceCounts[r.id] = this.products.filter(p => this.inRange(p.price, r.id)).length;
    });

    this.statusCounts = {
      inStock: this.products.filter(p => p.inStock !== false).length,
      outStock: this.products.filter(p => p.inStock === false).length
    };

    this.ratingCount = this.products.filter(p => p.rating >= 4).length;
    this.hasRatings = this.products.some(p => p.rating > 0);
  }

  private inRange(price: number, rangeId: string): boolean {
    const r = this.priceRanges.find(x => x.id === rangeId);
    return !!r && price >= r.min && price < r.max;
  }

  toggleGroup(key: string): void {
    this.openGroups[key] = !this.openGroups[key];
  }

  isChecked(field: ListField, value: string): boolean {
    return this.draft[field].includes(value);
  }

  toggleDraft(field: ListField, value: string): void {
    const list = this.draft[field];
    const i = list.indexOf(value);
    if (i >= 0) {
      list.splice(i, 1);
    } else {
      list.push(value);
    }
  }

  setKeyword(value: string): void {
    this.draft.keyword = value;
  }

  setMinRating(checked: boolean): void {
    this.draft.minRating4 = checked;
  }

  setSort(value: string): void {
    this.sortBy = value;
  }

  // Nút "Áp dụng" và nút "Tìm"
  applyFilters(): void {
    this.applied = cloneFilter(this.draft);
  }

  // Nút "Đặt lại"
  resetFilter(): void {
    this.draft = emptyFilter();
    this.applied = emptyFilter();
    this.showSavedOnly = false;
    this.sortBy = 'popular';
  }

  // Các nút lọc nhanh phía trên lưới sản phẩm (Tất cả / Set Lộc / ...)
  selectLine(line: string | null): void {
    const lines = line ? [line] : [];
    this.draft.lines = [...lines];
    this.applied = { ...this.applied, lines: [...lines] };
  }

  isLineActive(line: string): boolean {
    return this.applied.lines.length === 1 && this.applied.lines[0] === line;
  }

  // Danh sách sản phẩm sau khi lọc + sắp xếp
  get filteredProducts(): ProductItem[] {
    const f = this.applied;
    const kw = normalize(f.keyword.trim());

    const list = this.products.filter(p => {
      if (this.showSavedOnly && !this.savedIds.has(p.id)) {
        return false;
      }
      if (kw && !normalize(`${p.name} ${p.line} ${p.origin} ${p.region}`).includes(kw)) {
        return false;
      }
      if (f.lines.length && !f.lines.includes(p.line)) {
        return false;
      }
      if (f.priceRanges.length && !f.priceRanges.some(id => this.inRange(p.price, id))) {
        return false;
      }
      if (f.provinces.length && !f.provinces.includes(p.origin)) {
        return false;
      }
      if (f.regions.length && !f.regions.includes(p.region)) {
        return false;
      }
      if (f.statuses.length && !f.statuses.includes(p.inStock === false ? 'out' : 'in')) {
        return false;
      }
      if (f.minRating4 && p.rating < 4) {
        return false;
      }
      return true;
    });

    return this.sortList(list);
  }

  private sortList(list: ProductItem[]): ProductItem[] {
    const arr = [...list];
    switch (this.sortBy) {
      case 'price-asc':
        return arr.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return arr.sort((a, b) => b.price - a.price);
      case 'rating':
        return arr.sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
      default:
        return arr.sort((a, b) => b.reviewsCount - a.reviewsCount);
    }
  }

  // ====== SẢN PHẨM ĐÃ LƯU ======
  get savedCount(): number {
    return this.products.filter(p => this.savedIds.has(p.id)).length;
  }

  isSaved(id: number): boolean {
    return this.savedIds.has(id);
  }

  toggleSave(id: number): void {
    if (this.savedIds.has(id)) {
      this.savedIds.delete(id);
    } else {
      this.savedIds.add(id);
    }
    this.persistSaved();
  }

  toggleSavedOnly(): void {
    this.showSavedOnly = !this.showSavedOnly;
  }

  private loadSaved(): void {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) {
        this.savedIds = new Set<number>(JSON.parse(raw));
      }
    } catch {
      // bỏ qua nếu trình duyệt chặn localStorage
    }
  }

  private persistSaved(): void {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(Array.from(this.savedIds)));
    } catch {
      // bỏ qua
    }
  }

  // ====== CHI TIẾT QUÀ TẶNG ======
  openDetail(p: ProductItem): void {
    void this.router.navigate(['/qua-tang', p.id]).then(navigated => {
      if (navigated) window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ====== KHÁC ======
  setOccasion(id: string): void {
    this.selectedOccasion = id;
  }

  setCategory(id: string): void {
    this.selectedCategory = id;
  }

  setSubCategory(id: string): void {
    this.selectedSubCategory = id;
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + 'đ';
  }

  // Chuỗi sao theo điểm đánh giá, ví dụ 4.5 -> ★★★★★ (làm tròn)
  starsText(rating: number): string {
    const full = Math.max(0, Math.min(5, Math.round(rating)));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  // Ghép "Tỉnh · Vùng" và bỏ phần nào đang trống
  locationText(item: ProductItem): string {
    return [item.origin, item.region].filter(Boolean).join(' · ');
  }
}