import { Component, computed, inject } from '@angular/core';
import { CartService } from '../cart.service';
import { DataService } from '../data.service';

@Component({
  selector: 'app-header-component',
  standalone: false,
  templateUrl: './header-component.html',
  styleUrl: './header-component.css',
})
export class HeaderComponent {
  cart = inject(CartService);
  private ds = inject(DataService);
  left = computed(() => this.ds.dataset()?.header.left ?? []);
  right = computed(() => this.ds.dataset()?.header.right ?? []);
  menu = computed(() => this.ds.dataset()?.header.menu ?? []);
}
