import { Component, computed, inject } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-footer-component',
  standalone: false,
  templateUrl: './footer-component.html',
  styleUrl: './footer-component.css',
})
export class FooterComponent {
  private ds = inject(DataService);
  social = computed(() => this.ds.dataset()?.footer.social ?? []);
  pays = computed(() => this.ds.dataset()?.footer.pays ?? []);
  cols = computed(() => this.ds.dataset()?.footer.cols ?? []);
}
