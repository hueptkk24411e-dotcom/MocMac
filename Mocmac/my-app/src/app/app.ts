import { Component, computed, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from './cart.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { ChatService } from './chat.service';
import { AutoTranslateService } from './auto-translate.service';

@Component({
  selector: 'app-root',
  standalone: false,
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  readonly showStoreLayout = computed(() => {
    const url = this.router.lastSuccessfulNavigation()?.finalUrl ?? this.router.parseUrl(this.router.url);
    const segments = url.root.children['primary']?.segments.map(segment => segment.path) ?? [];
    const [page, slug] = segments;
    const origin = page === 'san-pham' && !!slug && url.queryParamMap.get('nguon-goc') === '1';
    return !origin && page !== 'dang-nhap' && !page?.startsWith('admin');
  });
  readonly cart = inject(CartService);
  protected readonly title = signal('my-app');
  private auth = inject(AuthService);
  private notif = inject(NotificationService);
  private chatService = inject(ChatService);
  private autoT = inject(AutoTranslateService);
  constructor() { this.autoT.init(); }

  private _socketEffect = effect(() => {
    const user = this.auth.user();
    const token = localStorage.getItem('mocmac-auth-token') ?? sessionStorage.getItem('mocmac-auth-token');
    if (user && token) {
      this.notif.connect();
      this.chatService.connect();
    } else {
      this.notif.disconnect();
    }
  });

  logout(): void {
    this.notif.disconnect();
    this.chatService.disconnect();
    this.auth.logout();
  }
}
