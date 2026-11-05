import { computed, effect, Injectable, signal } from '@angular/core';

export interface CartLine {
  productId: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly lines = signal<CartLine[]>(this.readLines());
  readonly notification = signal('');
  readonly count = computed(() =>
    this.lines().reduce((total, line) => total + line.quantity, 0)
  );
  private notificationTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      try { localStorage.setItem('mocmac-cart', JSON.stringify(this.lines())); } catch { /* Storage may be unavailable. */ }
    });
  }

  private readLines(): CartLine[] {
    try {
      const value: unknown = JSON.parse(localStorage.getItem('mocmac-cart') || '[]');
      if (!Array.isArray(value)) return [];
      const lines = new Map<number, number>();
      for (const item of value) {
        if (Number.isSafeInteger(item?.productId) && item.productId > 0 && Number.isSafeInteger(item?.quantity) && item.quantity > 0) {
          lines.set(item.productId, Math.min(99, (lines.get(item.productId) || 0) + item.quantity));
        }
      }
      return [...lines].map(([productId, quantity]) => ({ productId, quantity }));
    } catch { return []; }
  }

  add(productId: number, productName: string, quantity = 1): void {
    if (!Number.isSafeInteger(productId) || productId <= 0 || !Number.isSafeInteger(quantity) || quantity <= 0) return;
    quantity = Math.min(99, quantity);
    this.lines.update(lines => {
      const existing = lines.find(line => line.productId === productId);
      return existing
        ? lines.map(line =>
            line.productId === productId
              ? { ...line, quantity: Math.min(99, line.quantity + quantity) }
              : line
          )
        : [...lines, { productId, quantity }];
    });

    this.notification.set(`Đã thêm "${productName}" vào giỏ hàng.`);
    clearTimeout(this.notificationTimeout);
    this.notificationTimeout = setTimeout(() => this.notification.set(''), 3000);
  }

  increase(productId: number): void {
    this.lines.update(lines =>
      lines.map(line =>
        line.productId === productId
          ? { ...line, quantity: Math.min(99, line.quantity + 1) }
          : line
      )
    );
  }

  decrease(productId: number): void {
    this.lines.update(lines =>
      lines.map(line =>
        line.productId === productId && line.quantity > 1
          ? { ...line, quantity: line.quantity - 1 }
          : line
      )
    );
  }

  remove(productId: number): void {
    this.lines.update(lines => lines.filter(line => line.productId !== productId));
  }

  clear(): void {
    this.lines.set([]);
  }
}
