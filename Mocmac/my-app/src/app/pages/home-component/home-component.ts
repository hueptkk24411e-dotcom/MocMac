import { Component, computed, inject, signal } from '@angular/core';
import { CartService } from '../../cart.service';
import { DataService, Product } from '../../data.service';

@Component({
  selector: 'app-home-component',
  standalone: false,
  templateUrl: './home-component.html',
  styleUrl: './home-component.css',
})
export class HomeComponent {
  cart = inject(CartService);
  private ds = inject(DataService);
  products = computed<Product[]>(() => this.ds.dataset()?.home.products ?? []);
  tab = signal('Tất cả');
  shown = computed(() => this.tab() === 'Tất cả' ? this.products() : this.products().filter(p => p.cat === this.tab() || (this.tab() === 'Sản phẩm OCOP' && p.rate === 5)));
}
