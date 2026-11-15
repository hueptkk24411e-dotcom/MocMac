import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { ProductItem, ProductVariant, ProductsService } from '../../products.service';
import { CartService } from '../../cart.service';
import { ReviewsService, ProductReviewItem } from '../../reviews-service';
import { AuthService } from '../../auth.service';
import { I18nService } from '../../i18n.service';
import { ContentTranslateService } from '../../content-translate.service';
import { PRODUCT_ORIGIN_STORIES } from './product-origin-stories';

type DetailTab = 'description' | 'information' | 'reviews';

@Component({
  selector: 'app-product-detail-component',
  standalone: false,
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);
  private readonly reviewsService = inject(ReviewsService);
  private readonly http = inject(HttpClient);
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);
  private readonly ct = inject(ContentTranslateService);

  readonly allProducts = this.productsService.products;
  readonly shareMessage = signal('');
  readonly translatedDesc = signal('');
  readonly translating = signal(false);

  // The route is /san-pham/:slug. The product is fetched from the backend by
  // slug because the shared catalog signal only holds the first page of
  // products (the backend paginates /api/products). The MongoDB review API
  // still uses the numeric Product.id stored in each review's productId.
  readonly productSlug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug') ?? '')),
    { initialValue: '' },
  );

  readonly product = signal<ProductItem | null>(null);
  readonly productLoading = signal(false);
  readonly productError = signal<string | null>(null);
  readonly showOrigin = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('nguon-goc') === '1')),
    { initialValue: false },
  );
  readonly originQr = computed(() => {
    const product = this.product();
    if (!product || !PRODUCT_ORIGIN_STORIES[product.id]) return null;
    const route = this.router.createUrlTree(['/san-pham', product.slug], {
      queryParams: { 'nguon-goc': '1' },
    });
    const target = new URL(this.router.serializeUrl(route).replace(/^\//, ''), document.baseURI);
    return {
      src: '/api/qr/url/product-origin?url=' + encodeURIComponent(target.href),
      filename: `qr-${product.slug}.png`,
      target: target.href,
    };
  });

  readonly productImages = computed<string[]>(() => {
    const images = this.product()?.images;
    return Array.isArray(images)
      ? images.filter(
          (image): image is string => typeof image === 'string' && image.trim().length > 0,
        )
      : [];
  });

  readonly selectedImageIndex = signal(0);
  readonly imageBroken = signal(false);
  readonly selectedImage = computed(() => this.productImages()[this.selectedImageIndex()] ?? '');
  readonly selectedOptions = signal<Record<string, string>>({});
  readonly variants = computed(() => this.product()?.variants ?? []);
  readonly optionGroups = computed(() => {
    const groups = new Map<string, Map<string, { value: string; swatch?: string }>>();
    for (const variant of this.variants()) for (const attribute of variant.attributes) {
      if (!groups.has(attribute.name)) groups.set(attribute.name, new Map());
      groups.get(attribute.name)!.set(attribute.value, { value: attribute.value, swatch: attribute.swatch });
    }
    return [...groups].map(([name, values]) => ({ name, values: [...values.values()] }));
  });
  readonly selectedVariant = computed(() => this.variants().find(variant =>
    variant.attributes.every(attribute => this.selectedOptions()[attribute.name] === attribute.value)) ?? null);
  readonly unitPrice = computed(() => this.selectedVariant()?.price ?? this.product()?.price ?? 0);
  readonly canPurchase = computed(() => {
    const product = this.product();
    return !!product && (product.inStock || product.preorder) && (!this.variants().length || !!this.selectedVariant()?.available);
  });
  readonly gallerySlides = computed(() => {
    const variantImage = this.selectedVariant()?.image;
    const variantImages = this.selectedVariant()?.images;
    const images = [...new Set([variantImage, ...(variantImages?.length ? variantImages : this.productImages())].filter((image): image is string => !!image))];
    const references = new Set(this.product()?.referenceImages);
    const slides = images.map((src, index) => ({
      id: `photo-${index}`,
      src,
      label: references.has(src) || src.includes('/catalog-reference/')
        ? 'Ảnh tham khảo'
        : index ? 'Ảnh bổ sung' : 'Tổng thể',
      zoom: 1,
      position: '50% 50%',
    }));
    if (images[0]) {
      slides.push({ id: 'detail-front', src: images[0], label: 'Cận cảnh sản phẩm', zoom: 1.6, position: '50% 45%' });
      slides.push({ id: 'detail-surface', src: images[0], label: 'Chi tiết bề mặt', zoom: 2.2, position: '60% 55%' });
    }
    return slides;
  });
  readonly selectedSlide = computed(() => this.gallerySlides()[this.selectedImageIndex()] ?? this.gallerySlides()[0]);
  readonly quantity = signal(1);
  readonly activeTab = signal<DetailTab>('description');
  readonly cartMessage = this.cartService.notification;

  readonly relatedProducts = computed<ProductItem[]>(() => {
    const current = this.product();
    if (!current) return [];

    const products = (this.allProducts() ?? []).filter((item) => item.id !== current.id);

    return products
      .map((product: ProductItem) => {
        let score = 0;
        if (product.cat === current.cat) score += 4;
        if (product.type === current.type) score += 3;
        if (product.region === current.region) score += 2;
        if (product.province === current.province) score += 1;
        if (product.village && product.village === current.village) score += 3;
        if (
          (product.occasion ?? []).some((occasion) => (current.occasion ?? []).includes(occasion))
        )
          score += 2;
        return { product, score };
      })
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.product.rate - a.product.rate ||
          b.product.reviews - a.product.reviews,
      )
      .slice(0, 4)
      .map((item) => item.product);
  });

  relatedRating(product: ProductItem): number { return product.reviewStats?.average ?? 0; }
  relatedReviewCount(product: ProductItem): number { return product.reviewStats?.count ?? 0; }

  // Aliases used by the supplied product-detail HTML.
  relatedReviewRatingOf(product: ProductItem): number {
    return this.relatedRating(product);
  }

  relatedReviewCountOf(product: ProductItem): number {
    return this.relatedReviewCount(product);
  }

  // Review data is loaded from MongoDB through the backend API.
  reviewName = '';
  reviewContent = '';
  reviewRating = 5;
  readonly reviews = signal<ProductReviewItem[]>([]);
  readonly reviewMessage = signal('');
  readonly reviewLoading = signal(false);
  readonly reviewSubmitting = signal(false);
  readonly canReview = signal(false);

  readonly reviewStats = signal({ average: 0, count: 0, ratedCount: 0 });
  readonly reviewError = signal('');
  readonly reviewPage = signal(1);
  readonly reviewPages = signal(0);
  readonly reviewRatedCount = computed(() => this.reviewStats().ratedCount);
  readonly reviewAverage = computed(() => this.reviewStats().average);
  readonly reviewCount = computed(() => this.reviewStats().count);

  constructor() {
    effect(() => {
      this.loadProduct(this.productSlug());
    });

    effect(() => {
      const p = this.product();
      const lang = this.i18n.lang();
      const showOrigin = this.showOrigin();
      const raw = String((p as any)?.description || (p as any)?.story || '').trim();
      if (!p || !raw || lang === 'vi' || showOrigin) { this.translatedDesc.set(raw); this.translating.set(false); return; }
      this.translating.set(true);
      this.ct.t$(raw).subscribe(v => { this.translatedDesc.set(v || raw); this.translating.set(false); });
    });

    effect(() => {
      const showOrigin = this.showOrigin();
      const productId = this.product()?.id;
      if (productId && !showOrigin) {
        untracked(() => {
          this.loadReviews(productId);
          this.checkCanReview(productId);
        });
      }
    });
  }

  displayDescription(p: any): string {
    if (this.i18n.lang() === 'en' && this.translatedDesc()) return this.translatedDesc();
    const raw = String(p?.description || p?.story || '').trim();
    if (raw) return raw;
    return this.i18n.lang() === 'en'
      ? 'Product description is being updated. Please see product details or contact us for more information.'
      : 'Thông tin mô tả đang được cập nhật. Bạn có thể xem xuất xứ, loại sản phẩm ở mục Thông tin chi tiết hoặc liên hệ Mộc Mạc để được tư vấn.';
  }

  descriptionParagraphs(p: ProductItem): string[] {
    return this.displayDescription(p).split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  }

  private resetDetailState(): void {
    this.reviews.set([]);
    this.reviewStats.set({ average: 0, count: 0, ratedCount: 0 });
    this.reviewError.set('');
    this.reviewPage.set(1);
    this.reviewPages.set(0);
    this.canReview.set(false);
    this.reviewMessage.set('');
    this.productError.set(null);
    this.reviewLoading.set(false);
    this.reviewSubmitting.set(false);
    this.reviewName = '';
    this.reviewContent = '';
    this.reviewRating = 5;
    this.selectedImageIndex.set(0);
    this.imageBroken.set(false);
    this.quantity.set(1);
    this.selectedOptions.set({});
    this.activeTab.set('description');
  }

  private loadProduct(slug: string): void {
    this.resetDetailState();

    if (!slug) {
      this.product.set(null);
      this.productLoading.set(false);
      return;
    }

    // Try slug-based API lookup first (handles numeric slugs like "12341").
    this.product.set(null);
    this.productLoading.set(true);
    this.productsService.getProductBySlug(slug).subscribe({
      next: (product) => {
        if (this.productSlug() !== slug) return;
        this.product.set(product);
        this.setInitialVariant(product);
        this.reviewStats.set(product.reviewStats ?? { average: 0, count: 0, ratedCount: 0 });
        window.scrollTo({ top: 0 });
        this.productLoading.set(false);
      },
      error: () => {
        if (this.productSlug() !== slug) return;
        // Fallback: legacy numeric-id URLs (/san-pham/1).
        const maybeId = Number(slug);
        if (Number.isSafeInteger(maybeId) && maybeId > 0) {
          const byId = untracked(
            () => (this.allProducts() ?? []).find((item) => Number(item.id) === maybeId) ?? null,
          );
          this.product.set(byId);
          if (byId) this.setInitialVariant(byId);
          this.productLoading.set(false);
          return;
        }
        this.product.set(null);
        this.productLoading.set(false);
      },
    });
  }

  private loadReviews(productId: number, page = 1): void {
    this.reviewLoading.set(true);
    this.reviewError.set('');
    this.reviewsService.getPageForProduct(productId, page).subscribe({
      next: (result) => {
        if (this.product()?.id !== productId) return;
        this.reviews.set(result.reviews);
        this.reviewStats.set({ average: result.average, count: result.total, ratedCount: result.ratedCount });
        this.reviewPage.set(result.page);
        this.reviewPages.set(result.totalPages);
        this.reviewLoading.set(false);
      },
      error: () => {
        if (this.product()?.id !== productId) return;
        this.reviewLoading.set(false);
        this.reviewError.set('Chưa tải được đánh giá. Vui lòng thử lại.');
      },
    });
  }

  loadReviewPage(page = this.reviewPage()): void {
    const productId = this.product()?.id;
    if (productId && page >= 1 && (!this.reviewPages() || page <= this.reviewPages())) this.loadReviews(productId, page);
  }

  formatReviewDate(value: string): string {
    const date = new Date(value);
    return value && Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
      : '';
  }

  private checkCanReview(productId: number): void {
    if (!this.auth.isAuthenticated()) return;
    this.http.get<{ delivered: boolean }>('/api/orders/can-review/' + productId).subscribe({
      next: (res: any) => {
        this.canReview.set(!!res?.delivered);
      },
      error: () => {
        this.canReview.set(false);
      },
    });
  }

  stars(rate: number): string {
    const count = Math.max(0, Math.min(5, Math.round(Number(rate) || 0)));
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  }

  fmt(price: number): string {
    return (Number(price) || 0).toLocaleString('vi-VN') + 'đ';
  }

  selectImage(index: number): void {
    const max = this.gallerySlides().length - 1;
    if (max < 0) return;
    this.selectedImageIndex.set(Math.min(max, Math.max(0, index)));
    this.imageBroken.set(false);
  }

  previousImage(): void {
    const count = this.gallerySlides().length;
    if (count > 1) this.selectImage((this.selectedImageIndex() - 1 + count) % count);
  }

  nextImage(): void {
    const count = this.gallerySlides().length;
    if (count > 1) this.selectImage((this.selectedImageIndex() + 1) % count);
  }

  onImageError(): void {
    this.imageBroken.set(true);
  }

  decreaseQuantity(): void {
    this.quantity.update((value) => Math.max(1, value - 1));
  }

  increaseQuantity(): void {
    this.quantity.update((value) => Math.min(99, value + 1));
  }

  private setInitialVariant(product: ProductItem): void {
    const variant = product.variants?.find(item => item.available) ?? product.variants?.[0];
    this.setVariant(variant);
  }

  private setVariant(variant?: ProductVariant): void {
    this.selectedOptions.set(Object.fromEntries((variant?.attributes ?? []).map(attribute => [attribute.name, attribute.value])));
    this.selectImage(0);
  }

  chooseOption(name: string, value: string): void {
    const selections = { ...this.selectedOptions(), [name]: value };
    const candidates = this.variants().filter(variant => variant.attributes.some(attribute => attribute.name === name && attribute.value === value));
    const exact = candidates.find(variant => variant.attributes.every(attribute => selections[attribute.name] === attribute.value));
    this.setVariant(exact ?? candidates.find(variant => variant.available) ?? candidates[0]);
  }

  optionAvailable(name: string, value: string): boolean {
    return this.variants().some(variant => variant.available && variant.attributes.some(attribute => attribute.name === name && attribute.value === value));
  }

  addToCart(): void {
    const product = this.product();
    if (!product || !this.canPurchase()) return;
    this.cartService.add(product.id, product.name, this.selectedVariant()?.id, this.quantity());
  }

  /** Keep the chosen version and quantity when continuing to the cart. */
  buyNow(): void {
    const product = this.product();
    if (!product || !this.canPurchase()) return;
    this.cartService.add(product.id, product.name, this.selectedVariant()?.id, this.quantity());
    void this.router.navigate(['/gio-hang']);
  }

  shareFacebook(): void {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank',
      'noopener,noreferrer,width=700,height=550',
    );
  }

  shareZalo(): void {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://zalo.me/share?url=${url}`,
      '_blank',
      'noopener,noreferrer,width=700,height=600',
    );
  }

  copyProductLink(): void {
    const url = window.location.href;
    if (!navigator.clipboard?.writeText) {
      this.shareMessage.set('Hãy sao chép liên kết trên thanh địa chỉ trình duyệt.');
      return;
    }
    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.shareMessage.set('Đã sao chép liên kết sản phẩm.');
      })
      .catch(() => {
        this.shareMessage.set('Không thể sao chép tự động. Hãy sao chép URL trên thanh địa chỉ.');
      });
  }

  goBack(): void {
    this.router.navigate(['/san-pham']);
  }

  // Match the current route /san-pham/:slug and the related-products HTML.
  openProduct(item: ProductItem): void {
    const slug = item?.slug;
    if (!slug) return;
    this.router.navigate(['/san-pham', slug]).then((navigated) => {
      if (navigated) window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  showReviews(): void {
    this.setTab('reviews');
    setTimeout(() => {
      document
        .getElementById('product-details-tabs')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  setTab(tab: DetailTab): void {
    this.activeTab.set(tab);
  }

  scrollToReviewForm(): void {
    document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  submitReview(): void {
    const product = this.product();
    const userName = this.auth.user()?.name || 'Khách hàng';
    const content = this.reviewContent.trim();
    const rating = Number(this.reviewRating);

    if (!product) {
      this.reviewMessage.set('Không tìm thấy sản phẩm.');
      return;
    }
    if (!userName || !content) {
      this.reviewMessage.set('Vui lòng nhập tên và nội dung đánh giá.');
      return;
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      this.reviewMessage.set('Số sao phải từ 1 đến 5.');
      return;
    }
    if (userName.length > 80 || content.length > 1500) {
      this.reviewMessage.set('Tên tối đa 80 ký tự, nội dung tối đa 1500 ký tự.');
      return;
    }

    this.reviewSubmitting.set(true);
    this.reviewMessage.set('Đang gửi đánh giá...');

    this.reviewsService.createForProduct(product.id, { userName, rating, content }).subscribe({
      next: () => {
        if (this.product()?.id !== product.id) return;
        this.loadReviews(product.id, 1);
        this.productsService.refresh();
        this.reviewName = '';
        this.reviewContent = '';
        this.reviewRating = 5;
        this.reviewSubmitting.set(false);
        this.reviewMessage.set('Đánh giá đã được lưu thành công.');
      },
      error: (error: unknown) => {
        console.error('Không thể lưu review:', error);
        this.reviewSubmitting.set(false);
        let message = 'Không thể gửi đánh giá. Vui lòng thử lại.';
        if (typeof error === 'object' && error !== null && 'error' in error) {
          const response = (error as { error?: { message?: unknown } }).error;
          if (typeof response?.message === 'string') message = response.message;
        }
        this.reviewMessage.set(message);
      },
    });
  }
}
