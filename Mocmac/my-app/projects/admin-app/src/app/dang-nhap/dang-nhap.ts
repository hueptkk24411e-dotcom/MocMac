import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { ToastService } from '../admin/toast.service';

@Component({
  selector: 'app-dangnhap',
  standalone: false,
  templateUrl: './dang-nhap.html',
  styleUrl: './dang-nhap.css',
})
export class DangnhapComponent {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  identifier = '';
  password = '';
  remember = false;
  loading = false;
  error = '';
  t(vi: string, en: string): string { return vi; }

  async login(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const res: any = await firstValueFrom(
        this.http.post<{ token: string; user: any }>('/api/auth/login', {
          identifier: this.identifier,
          password: this.password,
        }),
      );
      this.auth.saveSession(res, this.remember);
      await this.router.navigate(['/']);
    } catch {
      this.error = 'Sai tài khoản hoặc mật khẩu.';
      this.toast.error('Sai tài khoản hoặc mật khẩu');
    } finally {
      this.loading = false;
    }
  }

  goHome(): void {
    void this.router.navigate(['/']);
  }
}
