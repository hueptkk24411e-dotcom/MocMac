import { Component, inject, signal, AfterViewChecked, ViewChild, ElementRef, effect } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AgentAction, AgentMessage, ChatMessage, ChatService } from '../chat.service';
import { CartService } from '../cart.service';
import { ProductsService } from '../products.service';
import { ToastService } from '../admin/toast.service';
import { I18nService } from '../i18n.service';

@Component({
  selector: 'app-chat-popup',
  standalone: false,
  template: `
    <div class="ai-float">
      @if (!open()) {
        <button type="button" class="ai-fab" (click)="open.set(true); onOpen()" [attr.aria-label]="'agent.title' | t" aria-haspopup="dialog">
          <i class="fa-regular fa-comment-dots" aria-hidden="true"></i>
          <span class="ai-fab-tip" aria-hidden="true">{{ 'agent.tip' | t }}</span>
        </button>
      }

      @if (open()) {
        <div class="ai-window" role="dialog" [attr.aria-label]="'agent.title' | t">
          <header class="ai-head">
            <div class="ai-brand">
              <div class="ai-avatar"><i class="fa-regular fa-comment-dots" aria-hidden="true"></i></div>
              <strong>{{ 'agent.title' | t }}</strong>
            </div>
            <div class="ai-head-actions">
              <div class="ai-tabs">
                <button type="button" [class.active]="mode()==='ai'" [attr.aria-pressed]="mode()==='ai'" (click)="mode.set('ai')">{{ 'agent.tab' | t }}</button>
                <button type="button" [class.active]="mode()==='admin'" [attr.aria-pressed]="mode()==='admin'" (click)="mode.set('admin'); chatService.connect()">{{ 'agent.supportTab' | t }}</button>
              </div>
              <button type="button" class="ai-close" (click)="open.set(false)" [attr.aria-label]="'agent.close' | t"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
            </div>
          </header>

          <ul #messagesList class="ai-body" aria-live="polite" aria-relevant="additions text">
            @if (mode()==='ai') {
              @if (!aiMessages().length) {
                <li class="ai-welcome">
                  <p>{{ 'agent.hello' | t }}</p>
                </li>
                <li class="ai-suggests">
                  @for (s of suggestions(); track s) {
                    <button type="button" (click)="askSuggestion(s)">{{ s }}</button>
                  }
                </li>
              }
              @for (m of aiMessages(); track $index) {
                <li class="msg" [class.user]="m.from==='user'" [class.ai]="m.from==='ai'">
                  @if (m.from==='ai') { <span class="msg-ava"><i class="fa-regular fa-comment-dots" aria-hidden="true"></i></span> }
                  <div class="bubble">
                    @if (m.pending) {
                      <div class="typing" [attr.aria-label]="'agent.loading' | t"><span></span><span></span><span></span></div>
                    } @else {
                      <div class="text">{{ m.text }}</div>
                    }
                    @if (m.actions?.length) {
                      <div class="agent-actions">
                        @for (a of m.actions; track $index) {
                          <button type="button" class="agent-action" (click)="runAction(a)" [disabled]="a.type === 'add_to_cart' && addingToCart()">{{ actionLabel(a) }}</button>
                        }
                      </div>
                    }
                    @if (!m.pending) { <div class="meta">{{ m.at | date:'HH:mm' }}</div> }
                  </div>
                </li>
              }
            } @else {
              @for (m of messages(); track m._id || $index) {
                <li class="msg" [class.user]="isMine(m)" [class.ai]="!isMine(m)">
                  @if (!isMine(m)) { <span class="msg-ava"><i class="fa-solid fa-headset"></i></span> }
                  <div class="bubble">
                    <div class="text">{{ m.message }}</div>
                    <div class="meta">{{ m.createdAt | date:'HH:mm' }}</div>
                  </div>
                </li>
              } @empty {
                <li class="ai-welcome"><p>Nhắn tin để được quản trị viên hỗ trợ trực tiếp.</p></li>
              }
            }
          </ul>

          <form class="ai-input" (ngSubmit)="$event.preventDefault(); send()">
            <input
              type="text"
              [attr.placeholder]="(mode()==='ai' ? 'agent.placeholder' : 'agent.supportPlaceholder') | t"
              [attr.aria-label]="(mode()==='ai' ? 'agent.placeholder' : 'agent.supportPlaceholder') | t"
              [value]="msgText()" (input)="msgText.set($any($event.target).value)" maxlength="1000" autocomplete="off"
            />
            <button type="submit" [disabled]="!msgText().trim() || (mode()==='admin' ? !connected() : aiLoading())" [attr.aria-label]="'agent.send' | t">
              <i class="fa-solid fa-paper-plane" aria-hidden="true"></i>
            </button>
          </form>
        </div>
      }
    </div>
  `,
  styleUrls: ['./chat-popup.css'],
})
export class ChatPopupComponent implements AfterViewChecked {
  @ViewChild('messagesList') messagesList?: ElementRef<HTMLUListElement>;

  public chatService = inject(ChatService);
  private cart = inject(CartService);
  private catalog = inject(ProductsService);
  private router = inject(Router);
  private toast = inject(ToastService);
  readonly i18n = inject(I18nService);

  readonly open = signal(false);
  readonly msgText = signal('');
  readonly mode = signal<'ai'|'admin'>('ai');
  readonly addingToCart = signal(false);
  readonly suggestions = () => this.i18n.lang() === 'en'
    ? ['Gift for my mother under 300k', 'Find pottery from Bát Tràng', 'Any active vouchers?', 'Track my order']
    : ['Quà cho mẹ dưới 300k', 'Tìm gốm Bát Tràng', 'Có voucher nào không?', 'Tra cứu đơn hàng'];

  readonly messages = this.chatService.messages;
  readonly aiMessages = this.chatService.aiMessages;
  readonly aiLoading = this.chatService.aiLoading;
  readonly connected = this.chatService.connected;

  actionLabel(action: AgentAction): string {
    const en = this.i18n.lang() === 'en';
    switch (action.type) {
      case 'open_product': return action.label || `${en ? 'View' : 'Xem'} ${action.name || (en ? 'product' : 'sản phẩm')}`;
      case 'add_to_cart': return en ? `Add ${action.quantity || 1} to cart` : `Thêm ${action.quantity || 1} vào giỏ`;
      case 'open_cart': return en ? 'View cart' : 'Xem giỏ hàng';
      case 'contact_support': return en ? 'Contact us' : 'Liên hệ hỗ trợ';
      case 'my_orders': return en ? 'My orders' : 'Đơn hàng của tôi';
      case 'navigate':
        if (action.path === '/chinh-sach-doi-tra') return en ? 'Return policy' : 'Chính sách đổi trả';
        if (action.path === '/chinh-sach-van-chuyen') return en ? 'Shipping policy' : 'Chính sách vận chuyển';
        if (action.path === '/ho-tro-thanh-toan') return en ? 'Payment methods' : 'Phương thức thanh toán';
        if (action.path === '/huong-dan-mua-hang') return en ? 'Shopping guide' : 'Hướng dẫn mua hàng';
        if (action.path === '/san-pham') return en ? 'View catalog' : 'Xem danh mục';
        return en ? 'Open page' : 'Mở trang';
    }
  }

  askSuggestion(text: string): void {
    if (this.aiLoading()) return;
    this.msgText.set(text);
    this.send();
  }

  runAction(action: AgentAction): void {
    switch (action.type) {
      case 'add_to_cart': this.addFromChat(action); break;
      case 'open_product': this.router.navigate(['/san-pham', action.slug]); break;
      case 'open_cart': this.router.navigate(['/gio-hang']); break;
      case 'contact_support': this.router.navigate(['/lien-he']); break;
      case 'my_orders': this.router.navigate(['/don-hang']); break;
      case 'navigate': this.router.navigateByUrl(action.path); break;
    }
  }

  private addFromChat(action: Extract<AgentAction, { type: 'add_to_cart' }>): void {
    if (this.addingToCart()) return;
    const en = this.i18n.lang() === 'en';
    const unavailable = en ? 'This item is unavailable.' : 'Sản phẩm hiện không đặt được.';
    const slug = action.slug || this.catalog.products().find(item => item.id === action.productId)?.slug;
    if (!slug) { this.toast.info(unavailable); return; }
    this.addingToCart.set(true);
    this.catalog.getProductBySlug(slug).pipe(finalize(() => this.addingToCart.set(false))).subscribe({
      next: product => {
        if (product.id !== action.productId || (!product.inStock && !product.preorder)) {
          this.toast.info(unavailable);
        } else if (product.variants?.length) {
          this.router.navigate(['/san-pham', product.slug]);
          this.toast.info(en ? 'Choose an option before adding to your cart.' : 'Chọn màu hoặc quy cách trước khi thêm vào giỏ.');
        } else {
          const quantity = Math.min(99, Math.max(1, Math.trunc(Number(action.quantity) || 1)));
          this.cart.add(product.id, product.name, undefined, quantity);
        }
      },
      error: () => this.toast.error(unavailable),
    });
  }

  private _notifyEffect = effect(() => {
    const msg = this.chatService.messageReceived();
    if (msg && !this.open() && msg.to !== 'admin') {
      this.toast.info('Tin nhắn mới từ quản trị viên');
    }
  });

  isMine(m: ChatMessage): boolean {
    return m.from === this.chatService.currentUserId();
  }

  onOpen(): void {
    if (this.mode() === 'admin') {
      this.chatService.connect();
      this.chatService.markRead('admin');
    }
  }

  send(): void {
    const text = this.msgText().trim();
    if (!text) return;
    if (this.mode() === 'ai') {
      if (this.aiLoading()) return;
      this.chatService.askAi(text);
      this.msgText.set('');
      return;
    }
    if (!this.chatService.connected()) return;
    this.chatService.sendMessage('admin', text);
    this.msgText.set('');
  }

  private visibleList?: HTMLUListElement;
  private lastMessage?: AgentMessage | ChatMessage;

  ngAfterViewChecked(): void {
    const list = this.messagesList?.nativeElement;
    const latest = (this.mode() === 'ai' ? this.aiMessages() : this.messages()).at(-1);
    if (list && (this.visibleList !== list || this.lastMessage !== latest)) {
      list.scrollTop = list.scrollHeight;
    }
    this.visibleList = list;
    this.lastMessage = latest;
  }
}
