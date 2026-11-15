import { Injectable, inject, signal, computed } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { I18nService } from './i18n.service';

export interface ChatMessage {
  _id: string;
  from: string;
  to: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AgentAction =
  | { type: 'open_product'; slug: string; name?: string; label?: string }
  | { type: 'add_to_cart'; productId: number; slug?: string; name?: string; quantity: number }
  | { type: 'navigate'; path: string }
  | { type: 'open_cart' | 'contact_support' | 'my_orders' };

export interface AgentMessage {
  from: 'user' | 'ai';
  text: string;
  at: string;
  pending?: boolean;
  actions?: AgentAction[];
}

interface AgentReply {
  answer: string;
  actions?: AgentAction[];
  context?: unknown;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private i18n = inject(I18nService);

  private _socket: Socket | null = null;
  readonly currentUserId = signal<string | null>(null);

  readonly messages = signal<ChatMessage[]>([]);
  readonly connected = signal(false);
  readonly conversations = signal<any[]>([]);
  readonly conversationsLoaded = signal(false);
  readonly messageReceived = signal<ChatMessage | null>(null);
  readonly unreadCount = computed(() => {
    const me = this.currentUserId();
    return this.messages().filter((m) => !m.read && m.from !== me).length;
  });

  connect(): void {
    if (this._socket && this._socket.connected) return;

    const token = localStorage.getItem('mocmac-auth-token') ?? sessionStorage.getItem('mocmac-auth-token');
    const user = this.auth.user();

    let query: Record<string, string> = {};
    if (token) {
      query = {};
    } else {
      let guestId = localStorage.getItem('mocmac-guest-id');
      if (!guestId) {
        guestId = crypto.randomUUID();
        localStorage.setItem('mocmac-guest-id', guestId);
      }
      query = { guestId };
    }

    this._socket = io('http://localhost:3000', {
      auth: token ? { token } : {},
      query,
      transports: ['websocket', 'polling'],
    });

    this._socket.on('connect', () => {
      this.connected.set(true);
      this.currentUserId.set(user ? String(user.id) : (query['guestId'] ?? this._socket!.id));
    });

    this._socket.on('chat:message', (data: ChatMessage) => {
      this.messages.update((m) => [...m, data]);
      this.messageReceived.set(data);
    });

    this._socket.on('chat:mark-read', (data: { from: string }) => {
      this.messages.update((m) =>
        m.map((x) => (x.from === data.from ? { ...x, read: true } : x)),
      );
    });

    this._socket.on('disconnect', () => {
      this.connected.set(false);
    });
  }

  disconnect(): void {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
    this.connected.set(false);
  }

  sendMessage(to: string, message: string): void {
    if (!this._socket || !this._socket.connected) return;
    this._socket.emit('chat:send', { to, message });
  }

  markRead(from: string): void {
    if (!this._socket || !this._socket.connected) return;
    this._socket.emit('chat:mark-read', { from });
    this.messages.update((m) =>
      m.map((x) => (x.from === from && !x.read ? { ...x, read: true } : x)),
    );
  }

  clearMessages(): void {
    this.messages.set([]);
  }

  loadHistory(otherUserId: string): void {
    this.http.get(`${this.apiBase}/api/chat/${otherUserId}`).subscribe((r: any) => {
      const msgs: ChatMessage[] = Array.isArray(r) ? r : (r.messages || []);
      this.messages.set(msgs);
    });
  }

  readonly aiMessages = signal<AgentMessage[]>([]);
  readonly aiLoading = signal(false);
  private agentContext: unknown;
  private apiBase = 'http://localhost:3000';

  askAi(message: string): void {
    const text = message.trim();
    if (!text || this.aiLoading()) return;
    const at = new Date().toISOString();
    this.aiLoading.set(true);
    this.aiMessages.update(messages => [
      ...messages, { from: 'user', text, at }, { from: 'ai', text: '', at, pending: true },
    ]);
    this.http.post<AgentReply>('/api/ai/chat', {
      message: text, lang: this.i18n.lang(), context: this.agentContext,
    }).subscribe({
      next: reply => {
        if (reply.context !== undefined) this.agentContext = reply.context;
        this.finishAiReply(reply.answer || this.i18n.t('agent.error'), reply.actions);
      },
      error: error => this.finishAiReply(error?.error?.answer || this.i18n.t('agent.error')),
    });
  }

  private finishAiReply(text: string, actions?: AgentAction[]): void {
    this.aiMessages.update(messages => [
      ...messages.slice(0, -1), { from: 'ai', text, at: new Date().toISOString(), actions },
    ]);
    this.aiLoading.set(false);
  }

  loadConversations(): void {
    this.http.get(`${this.apiBase}/api/chat/conversations`).subscribe({
      next: (r: any) => {
        this.conversations.set(Array.isArray(r) ? r : (r.conversations || []));
        this.conversationsLoaded.set(true);
      },
      error: () => this.conversationsLoaded.set(true),
    });
  }
}
