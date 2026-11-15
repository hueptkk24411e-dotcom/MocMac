import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, input, linkedSignal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import type { ProductItem } from '../../products.service';
import { PRODUCT_ORIGIN_STORIES } from './product-origin-stories';

@Component({
  selector: 'app-product-origin',
  imports: [NgTemplateOutlet, RouterLink],
  templateUrl: './product-origin.html',
  styleUrl: './product-origin.css',
})
export class ProductOriginComponent {
  private readonly title = inject(Title);
  readonly product = input.required<ProductItem | null>();
  readonly loading = input(false);
  readonly optionGroups = input<readonly { name: string; values: readonly { value: string }[] }[]>([]);
  readonly story = computed(() => {
    const product = this.product();
    return product ? PRODUCT_ORIGIN_STORIES[product.id] : undefined;
  });
  readonly stepIndex = linkedSignal({ source: this.story, computation: () => 0 });
  readonly activeStep = computed(() => this.story()?.steps[this.stepIndex()]);

  constructor() {
    effect(onCleanup => {
      const product = this.product();
      const previousTitle = this.title.getTitle();
      this.title.setTitle(product ? `${product.name} · Nguồn gốc | Mộc Mạc` : 'Truy xuất nguồn gốc | Mộc Mạc');
      onCleanup(() => this.title.setTitle(previousTitle));
    });
  }
}
