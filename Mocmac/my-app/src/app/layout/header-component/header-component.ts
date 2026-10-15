import { Component, inject } from '@angular/core';
import { CartService } from '../../cart.service';

@Component({
  selector: 'app-header-component',
  standalone: false,
  templateUrl: './header-component.html',
  styleUrl: './header-component.css',
})
export class HeaderComponent {
  cartService = inject(CartService);

  isFilterOpen: boolean = false;
  filterRegion: string = 'all';
  filterPriceRange: string = 'all';

  onFilterClick(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }
}