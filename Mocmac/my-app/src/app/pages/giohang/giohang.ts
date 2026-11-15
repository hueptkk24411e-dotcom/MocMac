import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartItemType, CartLine, CartService, cartLineKey } from '../../cart.service';
import { cartProduct } from '../../cart-product';
import { ProductItem, ProductsService } from '../../products.service';
import { GiftJson, GiftService } from '../gift-page/gift.service';

interface CartDisplayItem {
  id: number;
  key: string;
  itemType: CartItemType;
  variantId?: string;
  variantLabel: string;
  available: boolean;
  name: string;
  origin: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  badge: string;
  badgeTone: 'brown' | 'green';
}

const FREE_SHIPPING_THRESHOLD = 500000;
const SHIPPING_FEE = 30000;

function toCartDisplayItem(product: ProductItem, line: CartLine): CartDisplayItem {
  return {
    ...cartProduct(product, line),
    id: product.id,
    itemType: 'product',
    name: product.name,
    origin: [product.village, product.province, product.region].filter(Boolean).join(' · '),
    description: [product.type, product.cat].filter(Boolean).join(' · '),
    quantity: line.quantity,
    badge: product.badges[0] ?? (product.ocop ? `OCOP ${product.ocop} sao` : product.cat),
    badgeTone: product.heritage === 'Vàng' ? 'brown' : 'green',
  };
}

function toCartGiftDisplayItem(gift: GiftJson, line: CartLine): CartDisplayItem {
  return {
    id: gift.id,
    key: cartLineKey(line),
    itemType: 'gift',
    variantLabel: '',
    available: gift.inStock !== false,
    name: gift.name,
    origin: [gift.province, gift.region].filter(Boolean).join(' · '),
    description: [gift.type, gift.cat].filter(Boolean).join(' · '),
    price: gift.price,
    quantity: line.quantity,
    imageUrl: gift.images?.find(Boolean) ?? null,
    badge: gift.type || gift.cat || 'Quà tặng',
    badgeTone: 'green',
  };
}

function unavailableGiftDisplayItem(line: CartLine, loadFailed: boolean): CartDisplayItem {
  return {
    id: line.productId,
    key: cartLineKey(line),
    itemType: 'gift',
    variantLabel: '',
    available: false,
    name: loadFailed ? 'Không tải được thông tin quà tặng' : 'Quà tặng không còn khả dụng',
    origin: '',
    description: '',
    price: 0,
    quantity: line.quantity,
    imageUrl: null,
    badge: 'Quà tặng',
    badgeTone: 'green',
  };
}

@Component({
  selector: 'app-giohang',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './giohang.html',
  styleUrl: './giohang.scss',
})
export class GiohangComponent {
  private readonly catalog = inject(ProductsService);
  private readonly cart = inject(CartService);
  private readonly giftService = inject(GiftService);
  private readonly router = inject(Router);

  readonly freeShippingThreshold = FREE_SHIPPING_THRESHOLD;
  readonly gifts = signal<GiftJson[]>([]);
  readonly giftsLoading = signal(true);
  readonly giftsError = signal('');
  readonly giftLineCount = computed(() => this.cart.lines().filter(line => line.itemType === 'gift').length);
  readonly items = computed(() => {
    const productsById = new Map(this.catalog.products().map(product => [product.id, product]));
    const giftsById = new Map(this.gifts().map(gift => [gift.id, gift]));
    return this.cart.lines().flatMap(line => {
      if (line.itemType === 'gift') {
        const gift = giftsById.get(line.productId);
        return [gift ? toCartGiftDisplayItem(gift, line) : unavailableGiftDisplayItem(line, !!this.giftsError())];
      }
      const product = productsById.get(line.productId);
      return product ? [toCartDisplayItem(product, line)] : [];
    });
  });
  readonly totalQuantity = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );
  readonly subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  readonly shipping = computed(() => {
    const subtotal = this.subtotal();
    return subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  });
  readonly total = computed(() => this.subtotal() + this.shipping());
  readonly isFreeShipping = computed(() => this.subtotal() > 0 && this.shipping() === 0);
  readonly remainingForFreeShipping = computed(() =>
    Math.max(FREE_SHIPPING_THRESHOLD - this.subtotal(), 0)
  );
  readonly shippingProgress = computed(() =>
    Math.min((this.subtotal() / FREE_SHIPPING_THRESHOLD) * 100, 100)
  );
  readonly isEmpty = computed(() => this.items().length === 0);
  readonly hasUnavailable = computed(() => this.items().some(item => !item.available));

  constructor() {
    this.giftService.getGifts().subscribe({
      next: gifts => {
        this.gifts.set(gifts);
        this.giftsLoading.set(false);
      },
      error: () => {
        this.giftsError.set('Không thể tải thông tin quà tặng trong giỏ. Vui lòng thử lại.');
        this.giftsLoading.set(false);
      },
    });
  }

  increase(id: number, variantId?: string, itemType: CartItemType = 'product'): void {
    this.cart.increase(id, variantId, itemType);
  }

  decrease(id: number, variantId?: string, itemType: CartItemType = 'product'): void {
    this.cart.decrease(id, variantId, itemType);
  }

  remove(id: number, variantId?: string, itemType: CartItemType = 'product'): void {
    this.cart.remove(id, variantId, itemType);
  }

  clearAll(): void {
    this.cart.clear();
  }

  goToCheckout(): void {
    if (this.hasUnavailable()) return;
    void this.router.navigate(['/thanh-toan']);
  }

  vnd(value: number): string {
    return value.toLocaleString('vi-VN') + 'đ';
  }
}
