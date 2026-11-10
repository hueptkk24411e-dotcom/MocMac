import { computed, Injectable, signal } from '@angular/core';

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

  private readLines(): CartLine[] {
    try {
      const stored = localStorage.getItem('mocmac-cart');
      const lines: unknown = stored ? JSON.parse(stored) : [];
      return Array.isArray(lines)
        ? lines.filter(
            (line): line is CartLine =>
              Number.isInteger(line?.productId) &&
              Number.isInteger(line?.quantity) &&
              line.quantity > 0
          )
        : [];
    } catch {
      return [];
    }
  }

  private updateLines(update: (lines: CartLine[]) => CartLine[]): void {
    this.lines.update(update);
    localStorage.setItem('mocmac-cart', JSON.stringify(this.lines()));
  }

  add(productId: number, productName: string): void {
    this.updateLines(lines => {
      const existing = lines.find(line => line.productId === productId);
      return existing
        ? lines.map(line =>
            line.productId === productId
              ? { ...line, quantity: line.quantity + 1 }
              : line
          )
        : [...lines, { productId, quantity: 1 }];
    });

    this.notification.set(`Đã thêm "${productName}" vào giỏ hàng.`);
    clearTimeout(this.notificationTimeout);
    this.notificationTimeout = setTimeout(() => this.notification.set(''), 3000);
  }

  increase(productId: number): void {
    this.updateLines(lines =>
      lines.map(line =>
        line.productId === productId
          ? { ...line, quantity: line.quantity + 1 }
          : line
      )
    );
  }

  decrease(productId: number): void {
    this.updateLines(lines =>
      lines.map(line =>
        line.productId === productId && line.quantity > 1
          ? { ...line, quantity: line.quantity - 1 }
          : line
      )
    );
  }

  remove(productId: number): void {
    this.updateLines(lines => lines.filter(line => line.productId !== productId));
  }

  clear(): void {
    this.lines.set([]);
    localStorage.removeItem('mocmac-cart');
  }
}
