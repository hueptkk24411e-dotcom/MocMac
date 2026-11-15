import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-admin-reviews',
  standalone: false,
  template: `
    <div class="list-page">
      <header class="list-header">
        <h2>Đánh giá sản phẩm ({{ reviews().length }})</h2>
        <div class="admin-filters">
          <div class="filter-group">
            <input
              class="filter-input"
              placeholder="Tìm sản phẩm/người dùng..."
              [(ngModel)]="searchTerm"
              (input)="onFilterChange()"
              style="width: 200px"
            />
          </div>
          <div class="filter-group">
            <select class="filter-select" [(ngModel)]="ratingFilter" (change)="onFilterChange()" style="width: 100px">
              <option value="">Tất cả sao</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>
          </div>
          <div class="filter-group">
            <select class="filter-select" [(ngModel)]="statusFilter" (change)="onFilterChange()" style="width: 140px">
              <option value="">Tất cả trạng thái</option>
              <option value="visible">Hiển thị</option>
              <option value="hidden">Ẩn</option>
            </select>
          </div>
          <button
            type="button"
            class="filter-reset"
            (click)="resetFilters()"
            [disabled]="!searchTerm && !ratingFilter && !statusFilter"
          >
            Xóa bộ lọc
          </button>
        </div>
        <button type="button" class="btn-add" (click)="exportReviews()">
          <i class="fa-solid fa-download"></i> Xuất CSV
        </button>
      </header>

      <div class="stats-grid">
        <div class="stat-card stat--moss">
          <span class="stat-value">{{ stats().total }}</span>
          <span class="stat-label">Tổng đánh giá</span>
        </div>
        <div class="stat-card stat--clay">
          <span class="stat-value">{{ stats().avg | number:'1.1-1' }}</span>
          <span class="stat-label">Điểm trung bình</span>
        </div>
        <div class="stat-card stat--earth">
          <span class="stat-value">{{ stats().hidden }}</span>
          <span class="stat-label">Đã ẩn</span>
        </div>
        <div class="stat-card stat--sage">
          <span class="stat-value">{{ stats().visible }}</span>
          <span class="stat-label">Hiển thị</span>
        </div>
      </div>

      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Người dùng</th>
              <th>Điểm</th>
              <th>Nội dung</th>
              <th>Phản hồi</th>
              <th>Trạng thái</th>
              <th>Ngày</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            @for (r of reviews(); track r._id) {
              <tr>
                <td>{{ r.product?.name || '—' }}</td>
                <td>{{ r.user?.name || r.user?.email || '—' }}</td>
                <td>
                  <span class="rating-stars" [ngClass]="'stars-' + r.rating">
                    {{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}
                  </span>
                  <small>({{ r.rating }}/5)</small>
                </td>
                <td>{{ r.comment?.slice(0, 60) || '—' }}</td>
                <td>
                  @if (r.reply) {
                    <div class="reply-preview">
                      <span class="reply-label">Đã phản hồi:</span>
                      <span class="reply-text">{{ r.reply?.slice(0, 80) }}{{ r.reply?.length > 80 ? '...' : '' }}</span>
                      <small class="reply-date">{{ r.replyAt | date:'short' }}</small>
                    </div>
                  } @else {
                    <span class="no-reply">Chưa phản hồi</span>
                  }
                </td>
                <td>
                  <span class="status-badge" [ngClass]="r.status === 'visible' ? 'status-visible' : 'status-hidden'">
                    {{ r.status === 'visible' ? 'Hiện' : 'Ẩn' }}
                  </span>
                  <button type="button" class="btn-small btn-toggle" (click)="toggleStatus(r)">
                    {{ r.status === 'visible' ? 'Ẩn' : 'Hiện' }}
                  </button>
                </td>
                <td>{{ r.createdAt | date:'short' }}</td>
                <td>
                  <button type="button" class="btn-small btn-reply" (click)="openReplyModal(r)">
                    <i class="fa-solid fa-reply"></i> {{ r.reply ? 'Sửa phản hồi' : 'Phản hồi' }}
                  </button>
                  <button type="button" class="btn-small btn-delete" (click)="deleteReview(r._id)">Xóa</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8">Chưa có đánh giá nào.</td></tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination
        [currentPage]="page()"
        [totalPages]="totalPages()"
        (pageChange)="page.set($event); loadReviews()"
      ></app-pagination>
    </div>

    <!-- Reply Modal -->
    @if (replyModal()) {
      <div class="modal-overlay" (click)="closeReplyModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <h3>{{ replyData()?._id ? 'Sửa phản hồi' : 'Phản hồi đánh giá' }}</h3>
          <div class="review-info">
            <p><strong>Sản phẩm:</strong> {{ replyData()?.product?.name }}</p>
            <p><strong>Khách hàng:</strong> {{ replyData()?.user?.name || replyData()?.user?.email }}</p>
            <p><strong>Đánh giá:</strong> <span class="rating-stars" [ngClass]="'stars-' + replyData()?.rating">{{ '★'.repeat(replyData()?.rating) }}{{ '☆'.repeat(5 - replyData()?.rating) }}</span></p>
            <p><strong>Nội dung:</strong> {{ replyData()?.comment }}</p>
            @if (replyData()?.reply) {
              <p><strong>Phản hồi hiện tại:</strong> {{ replyData()?.reply }}</p>
              <p><small>Ngày phản hồi: {{ replyData()?.replyAt | date:'short' }}</small></p>
            }
          </div>
          <div class="form-group">
            <label>Nội dung phản hồi</label>
            <textarea class="form-input" [(ngModel)]="replyForm.content" rows="4" placeholder="Nhập nội dung phản hồi..."></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-save" (click)="submitReply()">Gửi phản hồi</button>
            <button type="button" class="btn-cancel" (click)="closeReplyModal()">Hủy</button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrls: ['./admin-list.css'],
})
export class AdminReviewsComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  readonly reviews = signal<any[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  searchTerm = '';
  ratingFilter = '';
  statusFilter = '';

  // Reply modal
  readonly replyModal = signal(false);
  readonly replyData = signal<any>(null);
  replyForm = { content: '' };

  readonly stats = computed(() => {
    const r = this.reviews();
    const visible = r.filter((x: any) => x.status === 'visible');
    const avg = visible.length > 0
      ? visible.reduce((s: number, x: any) => s + x.rating, 0) / visible.length
      : 0;
    return {
      total: r.length,
      avg: Number(avg.toFixed(1)),
      visible: visible.length,
      hidden: r.filter((x: any) => x.status === 'hidden').length,
    };
  });

  constructor() {
    this.loadReviews();
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadReviews();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.ratingFilter = '';
    this.statusFilter = '';
    this.page.set(1);
    this.loadReviews();
  }

  loadReviews(): void {
    const params = new URLSearchParams({
      page: String(this.page()),
      limit: '20',
    });
    if (this.searchTerm) params.set('q', this.searchTerm);
    if (this.ratingFilter) params.set('rating', this.ratingFilter);
    if (this.statusFilter) params.set('status', this.statusFilter);

    this.http.get('/api/reviews?' + params.toString()).subscribe((r: any) => {
      const items = Array.isArray(r) ? r : (r.reviews || []);
      this.reviews.set(items);
       this.totalPages.set(r.totalPages || 1);
    });
  }

  updateStatus(id: string, event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    this.http.patch('/api/reviews/' + id + '/status', { status }).subscribe({
      next: () => { this.toast.success('Cập nhật trạng thái đánh giá'); this.loadReviews(); },
      error: () => this.toast.error('Không thể cập nhật trạng thái'),
    });
  }

  toggleStatus(r: any): void {
    const newStatus = r.status === 'visible' ? 'hidden' : 'visible';
    this.http.patch('/api/reviews/' + r._id + '/status', { status: newStatus }).subscribe({
      next: () => { this.toast.success('Cập nhật trạng thái'); this.loadReviews(); },
      error: () => this.toast.error('Không thể cập nhật'),
    });
  }

  deleteReview(id: string): void {
    if (confirm('Xóa đánh giá này?')) {
      this.http.delete('/api/reviews/' + id).subscribe({
        next: () => { this.toast.success('Xóa đánh giá thành công'); this.loadReviews(); },
        error: () => this.toast.error('Không thể xóa đánh giá'),
      });
    }
  }

  openReplyModal(review: any): void {
    this.replyData.set(review);
    this.replyForm.content = review.reply || '';
    this.replyModal.set(true);
  }

  closeReplyModal(): void {
    this.replyModal.set(false);
    this.replyData.set(null);
    this.replyForm.content = '';
  }

  submitReply(): void {
    if (!this.replyForm.content.trim()) {
      this.toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }

    const review = this.replyData();
    if (!review) return;

    this.http.patch('/api/reviews/' + review._id + '/reply', { reply: this.replyForm.content }).subscribe({
      next: () => {
        this.toast.success('Phản hồi thành công');
        this.loadReviews();
        this.closeReplyModal();
      },
      error: () => this.toast.error('Không thể gửi phản hồi'),
    });
  }

  exportReviews(): void {
    const params = new URLSearchParams();
    if (this.searchTerm) params.set('q', this.searchTerm);
    if (this.ratingFilter) params.set('rating', this.ratingFilter);
    if (this.statusFilter) params.set('status', this.statusFilter);

    this.http.get('/api/reviews/export?' + params.toString(), { responseType: 'blob' }).subscribe({
      next: (blob: any) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `danh-gia-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.toast.success('Xuất file CSV thành công');
      },
      error: () => this.toast.error('Không thể xuất file CSV'),
    });
  }
}
