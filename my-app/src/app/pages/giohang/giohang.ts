import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../cart.service';
import { ProductItem, ProductsService } from '../../products.service';

interface CartDisplayItem {
  id: number;
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

function toCartDisplayItem(product: ProductItem, quantity: number): CartDisplayItem {
  return {
    id: product.id,
    name: product.name,
    origin: [product.village, product.province, product.region].filter(Boolean).join(' · '),
    description: [product.type, product.cat].filter(Boolean).join(' · '),
    price: product.price,
    quantity,
    imageUrl: product.images?.find(Boolean) ?? null,
    badge: product.badges[0] ?? (product.ocop ? `OCOP ${product.ocop} sao` : product.cat),
    badgeTone: product.heritage === 'Vàng' ? 'brown' : 'green',
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
  private readonly router = inject(Router);

  readonly freeShippingThreshold = FREE_SHIPPING_THRESHOLD;
  readonly items = computed(() => {
    const productsById = new Map(this.catalog.products().map(product => [product.id, product]));
    return this.cart.lines().flatMap(line => {
      const product = productsById.get(line.productId);
      return product ? [toCartDisplayItem(product, line.quantity)] : [];
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

  increase(id: number): void {
    this.cart.increase(id);
  }

  decrease(id: number): void {
    this.cart.decrease(id);
  }

  remove(id: number): void {
    this.cart.remove(id);
  }

  clearAll(): void {
    this.cart.clear();
  }

  goToCheckout(): void {
    void this.router.navigate(['/thanh-toan']);
  }

  vnd(value: number): string {
    return value.toLocaleString('vi-VN') + 'đ';
  }
}
