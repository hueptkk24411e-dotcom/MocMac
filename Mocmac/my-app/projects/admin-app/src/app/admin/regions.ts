import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-admin-regions',
  standalone: false,
  styleUrls: ['./admin-list.css'],
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Vùng miền ({{ regions().length }})</h2>
        <button type="button" class="btn-add" (click)="exportRegions()">
          <i class="fa-solid fa-download"></i> Xuất CSV
        </button>
      </header>
      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Sản phẩm</th>
              <th>Mô tả</th>
            </tr>
          </thead>
          <tbody>
            @for (r of regions(); track r._id || r.slug) {
              <tr>
                <td>{{ r.name }}</td>
                <td>{{ r.productCount || 0 }}</td>
                <td>{{ r.description }}</td>
              </tr>
            } @empty {
              <tr><td colspan="3">Chưa có vùng miền nào.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminRegionsComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  readonly regions = signal<any[]>([]);

  constructor() {
    this.http.get('/api/regions').subscribe((r: any) =>
      this.regions.set(Array.isArray(r) ? r : (r.regions || []))
    );
  }

  exportRegions(): void {
    this.http.get('/api/regions/export', {
      responseType: 'blob',
    }).subscribe({
      next: (blob: any) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vung-mien-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.toast.success('Xuất file CSV thành công');
      },
      error: () => this.toast.error('Không thể xuất file CSV'),
    });
  }
}
