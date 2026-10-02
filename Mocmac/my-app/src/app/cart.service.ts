import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CartService {
  count = signal(0);
  add() { this.count.update(n => n + 1); }
}
