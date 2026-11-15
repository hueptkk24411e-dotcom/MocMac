import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ToastService } from './toast.service';

interface Gift {
  id: number;
  name: string;
  description: string;
  cat: string;
  type: string;
  region: string;
  province: string;
  price: number;
  rate: number;
  reviews: number;
  inStock: boolean;
  icon: string;
  images: string[];
  source: string;
  link: string;
}

interface GiftForm {
  name: string;
  description: string;
  cat: string;
  type: string;
  region: string;
  province: string;
  price: number;
  inStock: boolean;
  icon: string;
  imagesText: string;
  source: string;
  link: string;
}

const emptyForm = (): GiftForm => ({
  name: '',
  description: '',
  cat: 'Quà tặng',
  type: '',
  region: '',
  province: '',
  price: 0,
  inStock: true,
  icon: '🎁',
  imagesText: '',
  source: '',
  link: '',
});

@Component({
  selector: 'app-admin-gifts',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Quà tặng ({{ visibleGifts().length }})</h2>
        <div class="admin-filters">
          <input
            class="filter-input"
            placeholder="Tìm tên quà tặng..."
            [value]="search()"
            (input)="search.set($any($event.target).value)"
          />
          <button type="button" class="filter-reset" (click)="search.set('')" [disabled]="!search()">Xóa bộ lọc</button>
        </div>
        <button type="button" class="btn-add" (click)="startCreate()">Thêm</button>
      </header>

      <div class="stats-grid">
        <div class="stat-card stat--moss"><span class="stat-value">{{ stats().total }}</span><span class="stat-label">Tổng quà</span></div>
        <div class="stat-card stat--earth"><span class="stat-value">{{ stats().inStock }}</span><span class="stat-label">Còn hàng</span></div>
        <div class="stat-card stat--clay"><span class="stat-value">{{ stats().outOfStock }}</span><span class="stat-label">Hết hàng</span></div>
        <div class="stat-card stat--sage"><span class="stat-value">{{ stats().avgPrice | number }}</span><span class="stat-label">Giá trung bình</span></div>
      </div>

      @if (showForm()) {
        <section class="form-card">
          <h3>{{ editingId() === null ? 'Thêm' : 'Sửa' }} quà tặng</h3>
          <div class="form-grid">
            <input class="form-input" placeholder="Tên quà tặng" [(ngModel)]="form.name" />
            <input class="form-input" placeholder="Giá" type="number" min="0" [(ngModel)]="form.price" />
            <input class="form-input" placeholder="Dòng quà / loại" [(ngModel)]="form.type" />
            <input class="form-input" placeholder="Danh mục" [(ngModel)]="form.cat" />
            <input class="form-input" placeholder="Tỉnh thành" [(ngModel)]="form.province" />
            <input class="form-input" placeholder="Vùng miền" [(ngModel)]="form.region" />
            <input class="form-input" placeholder="Nguồn sản phẩm" [(ngModel)]="form.source" />
            <input class="form-input" type="url" placeholder="Liên kết sản phẩm (https://...)" [(ngModel)]="form.link" />
            <textarea class="form-input" rows="3" placeholder="Mô tả quà tặng" [(ngModel)]="form.description"></textarea>
            <textarea class="form-input" rows="3" placeholder="Mỗi dòng là một URL ảnh (https://...)" [(ngModel)]="form.imagesText"></textarea>
            <label class="form-checkbox"><input type="checkbox" [(ngModel)]="form.inStock" /> Còn hàng</label>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-save" (click)="saveGift()" [disabled]="saving()">Lưu</button>
            <button type="button" class="btn-cancel" (click)="cancelForm()" [disabled]="saving()">Hủy</button>
          </div>
        </section>
      }

      @if (loading()) {
        <div class="table-wrap p-4">Đang tải quà tặng...</div>
      } @else {
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>#</th><th>Tên quà</th><th>Ảnh</th><th>Giá</th><th>Dòng quà</th><th>Tình trạng</th><th>Thao tác</th></tr></thead>
            <tbody>
              @for (gift of visibleGifts(); track gift.id) {
                <tr>
                  <td>{{ gift.id }}</td>
                  <td>{{ gift.name }}</td>
                  <td>@if (gift.images.length) { <img [src]="gift.images[0]" [alt]="gift.name" class="thumb-img" /> }</td>
                  <td>{{ gift.price | number }}đ</td>
                  <td>{{ gift.type || gift.cat }}</td>
                  <td>{{ gift.inStock ? 'Còn hàng' : 'Hết hàng' }}</td>
                  <td>
                    <button type="button" class="btn-small" (click)="editGift(gift)">Sửa</button>
                    <button type="button" class="btn-small btn-delete" (click)="deleteGift(gift)">Xóa</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7">{{ search() ? 'Không tìm thấy quà tặng phù hợp.' : 'Chưa có quà tặng nào.' }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styleUrls: ['./admin-list.css'],
})
export class AdminGiftsComponent {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  readonly gifts = signal<Gift[]>([]);
  readonly search = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly visibleGifts = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('vi');
    return this.gifts().filter(gift => !query || gift.name.toLocaleLowerCase('vi').includes(query));
  });
  readonly stats = computed(() => {
    const gifts = this.gifts();
    return {
      total: gifts.length,
      inStock: gifts.filter(gift => gift.inStock).length,
      outOfStock: gifts.filter(gift => !gift.inStock).length,
      avgPrice: gifts.length ? Math.round(gifts.reduce((sum, gift) => sum + gift.price, 0) / gifts.length) : 0,
    };
  });

  form = emptyForm();

  constructor() {
    this.loadGifts();
  }

  loadGifts(): void {
    this.loading.set(true);
    this.http.get<Gift[]>('/api/gifts').subscribe({
      next: gifts => {
        this.gifts.set(gifts);
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.toast.error(this.errorMessage(error, 'Không thể tải danh sách quà tặng.'));
      },
    });
  }

  startCreate(): void {
    this.editingId.set(null);
    this.form = emptyForm();
    this.showForm.set(true);
  }

  editGift(gift: Gift): void {
    this.editingId.set(gift.id);
    this.form = {
      name: gift.name,
      description: gift.description || '',
      cat: gift.cat || '',
      type: gift.type || '',
      region: gift.region || '',
      province: gift.province || '',
      price: gift.price,
      inStock: gift.inStock,
      icon: gift.icon || '',
      imagesText: gift.images.join('\n'),
      source: gift.source || '',
      link: gift.link || '',
    };
    this.showForm.set(true);
  }

  saveGift(): void {
    const payload = {
      ...this.form,
      images: this.form.imagesText.split(/\r?\n/).map(image => image.trim()).filter(Boolean),
    };
    const id = this.editingId();
    this.saving.set(true);
    const request = id === null
      ? this.http.post<{ gift: Gift }>('/api/gifts', payload)
      : this.http.put<{ gift: Gift }>(`/api/gifts/${id}`, payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.toast.success(id === null ? 'Đã thêm quà tặng.' : 'Đã cập nhật quà tặng.');
        this.loadGifts();
      },
      error: error => {
        this.saving.set(false);
        this.toast.error(this.errorMessage(error, 'Không thể lưu quà tặng.'));
      },
    });
  }

  deleteGift(gift: Gift): void {
    if (!confirm(`Xóa quà tặng "${gift.name}"?`)) return;
    this.http.delete(`/api/gifts/${gift.id}`).subscribe({
      next: () => {
        this.toast.success('Đã xóa quà tặng.');
        this.loadGifts();
      },
      error: error => this.toast.error(this.errorMessage(error, 'Không thể xóa quà tặng.')),
    });
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
      ? error.error.message
      : fallback;
  }
}
