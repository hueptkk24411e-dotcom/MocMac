import { computed, Injectable, signal } from '@angular/core';

export type CartItemType = 'product' | 'gift';

export interface CartLine {
  productId: number;
  quantity: number;
  variantId?: string;
  itemType?: CartItemType;
}

export const cartLineKey = (line: CartLine): string =>
  `${line.itemType || 'product'}:${line.productId}:${line.variantId || ''}`;

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly lines = signal<CartLine[]>(this.readLines());
  readonly notification = signal('');
  readonly count = computed(() =>
    this.lines().reduce((total, line) => total + line.quantity, 0)
  );
  private notificationTimeout?: ReturnType<typeof setTimeout>;

  private readLines(): CartLine[] {
    try {
      const stored = localStorage.getItem('mocmac-cart');
      const lines: unknown = stored ? JSON.parse(stored) : [];
      return Array.isArray(lines)
        ? lines.filter(
            (line): line is CartLine =>
              Number.isInteger(line?.productId) &&
              Number.isInteger(line?.quantity) &&
              line.quantity > 0 &&
              (line.variantId === undefined || (typeof line.variantId === 'string' && /^[a-z0-9-]{1,80}$/.test(line.variantId))) &&
              (line.itemType === undefined || line.itemType === 'product' || line.itemType === 'gift')
          )
        : [];
    } catch {
      return [];
    }
  }

  private updateLines(update: (lines: CartLine[]) => CartLine[]): void {
    this.lines.update(update);
    try { localStorage.setItem('mocmac-cart', JSON.stringify(this.lines())); } catch { /* The current cart remains usable when storage is blocked. */ }
  }

  add(
    productId: number,
    productName: string,
    variantId?: string,
    quantity = 1,
    itemType: CartItemType = 'product',
  ): void {
    if (!Number.isSafeInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity < 1) return;
    const key = cartLineKey({ productId, variantId, quantity, itemType });
    this.updateLines(lines => {
      const existing = lines.find(line => cartLineKey(line) === key);
      return existing
        ? lines.map(line =>
            cartLineKey(line) === key
              ? { ...line, quantity: Math.min(99, line.quantity + quantity) }
              : line
          )
        : [...lines, {
            productId,
            quantity: Math.min(99, quantity),
            ...(variantId ? { variantId } : {}),
            ...(itemType === 'gift' ? { itemType } : {}),
          }];
    });

    this.notification.set(`Đã thêm "${productName}" vào giỏ hàng.`);
    clearTimeout(this.notificationTimeout);
    this.notificationTimeout = setTimeout(() => this.notification.set(''), 3000);
  }

  increase(productId: number, variantId?: string, itemType: CartItemType = 'product'): void {
    this.updateLines(lines =>
      lines.map(line =>
        cartLineKey(line) === cartLineKey({ productId, variantId, quantity: 1, itemType })
          ? { ...line, quantity: Math.min(99, line.quantity + 1) }
          : line
      )
    );
  }

  decrease(productId: number, variantId?: string, itemType: CartItemType = 'product'): void {
    this.updateLines(lines =>
      lines.map(line =>
        cartLineKey(line) === cartLineKey({ productId, variantId, quantity: 1, itemType }) && line.quantity > 1
          ? { ...line, quantity: line.quantity - 1 }
          : line
      )
    );
  }

  remove(productId: number, variantId?: string, itemType: CartItemType = 'product'): void {
    this.updateLines(lines => lines.filter(line => cartLineKey(line) !== cartLineKey({ productId, variantId, quantity: 1, itemType })));
  }

  clear(): void {
    this.lines.set([]);
    try { localStorage.removeItem('mocmac-cart'); } catch { /* Storage may be unavailable in private or restricted contexts. */ }
  }
}
