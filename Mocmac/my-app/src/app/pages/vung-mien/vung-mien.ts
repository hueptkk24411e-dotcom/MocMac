import { Component, computed, inject } from '@angular/core';
import { ProductsService } from '../../products.service';

@Component({
  selector: 'app-vung-mien',
  standalone: false,
  templateUrl: './vung-mien.html',
  styleUrl: './vung-mien.css',
})
export class VungmienComponent {
  private svc = inject(ProductsService);

  readonly regions = this.svc.regions;
  readonly products = this.svc.products;

  readonly productsByRegion = computed(() => {
    const list = this.products();
    const result = new Map<string, { name: string; count: number }>();
    for (const p of list) {
      const r = p.region || 'Khác';
      if (!result.has(r)) result.set(r, { name: r, count: 0 });
      result.get(r)!.count++;
    }
    return Array.from(result.values()).sort((a, b) => b.count - a.count);
  });
}