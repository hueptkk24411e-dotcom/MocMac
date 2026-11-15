import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { CartService } from '../../cart.service';
import { GiftJson, GiftService } from '../gift-page/gift.service';

type DetailTab = 'description' | 'information' | 'reviews';

@Component({
  selector: 'app-gift-detail',
  standalone: false,
  templateUrl: './gift-detail.html',
  styleUrl: '../product-detail/product-detail.css',
})
export class GiftDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly giftService = inject(GiftService);
  private readonly cartService = inject(CartService);

  readonly gift = signal<GiftJson | null>(null);
  readonly gifts = signal<GiftJson[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly activeTab = signal<DetailTab>('description');
  readonly selectedImageIndex = signal(0);
  readonly imageBroken = signal(false);
  readonly quantity = signal(1);
  readonly cartMessage = this.cartService.notification;
  readonly canPurchase = computed(() => !!this.gift() && this.gift()?.inStock !== false);
  readonly giftImages = computed(() => (this.gift()?.images ?? []).filter(Boolean));
  readonly selectedImage = computed(() => this.giftImages()[this.selectedImageIndex()] ?? '');
  readonly relatedGifts = computed(() => this.gifts().filter(item => item.id !== this.gift()?.id).slice(0, 4));

  constructor() {
    this.giftService.getGifts().subscribe({
      next: gifts => this.gifts.set(gifts),
      error: () => this.gifts.set([]),
    });

    this.route.paramMap.pipe(
      map(params => Number(params.get('id'))),
      distinctUntilChanged(),
      tap(() => {
        this.loading.set(true);
        this.error.set('');
        this.gift.set(null);
        this.selectedImageIndex.set(0);
        this.imageBroken.set(false);
        this.quantity.set(1);
      }),
      switchMap(id => {
        if (!Number.isSafeInteger(id) || id < 1) {
          this.error.set('Không tìm thấy quà tặng.');
          return of(null);
        }
        return this.giftService.getGift(id).pipe(catchError(() => {
          this.error.set('Không tải được thông tin quà tặng.');
          return of(null);
        }));
      }),
      takeUntilDestroyed(),
    ).subscribe(gift => {
      this.gift.set(gift);
      this.loading.set(false);
    });
  }

  fmt(price: number): string {
    return (Number(price) || 0).toLocaleString('vi-VN') + 'đ';
  }

  decreaseQuantity(): void {
    this.quantity.update(value => Math.max(1, value - 1));
  }

  increaseQuantity(): void {
    this.quantity.update(value => Math.min(99, value + 1));
  }

  addToCart(): void {
    const gift = this.gift();
    if (!gift || !this.canPurchase()) return;
    this.cartService.add(gift.id, gift.name, undefined, this.quantity(), 'gift');
  }

  buyNow(): void {
    const gift = this.gift();
    if (!gift || !this.canPurchase()) return;
    this.addToCart();
    void this.router.navigate(['/gio-hang']);
  }

  stars(rate: number): string {
    const count = Math.max(0, Math.min(5, Math.round(Number(rate) || 0)));
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  }

  selectImage(index: number): void {
    const last = this.giftImages().length - 1;
    if (last < 0) return;
    this.selectedImageIndex.set(Math.min(last, Math.max(0, index)));
    this.imageBroken.set(false);
  }

  previousImage(): void {
    const count = this.giftImages().length;
    if (count > 1) this.selectImage((this.selectedImageIndex() - 1 + count) % count);
  }

  nextImage(): void {
    const count = this.giftImages().length;
    if (count > 1) this.selectImage((this.selectedImageIndex() + 1) % count);
  }

  setTab(tab: DetailTab): void {
    this.activeTab.set(tab);
  }

  goBack(): void {
    void this.router.navigate(['/qua-tang']);
  }

  contact(): void {
    void this.router.navigate(['/lien-he']);
  }
}
