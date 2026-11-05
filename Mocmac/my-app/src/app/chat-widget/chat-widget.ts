import { Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription, finalize, timeout } from 'rxjs';

interface ChatProduct { id:number; name:string; price:number; type:string; province:string; image:string; inStock:boolean; preorder:boolean; }
interface ChatResult { reply:string; products:ChatProduct[]; links:{label:string;path:string}[]; mode:string; degraded?:boolean; method?:string; }
interface ChatMessage { id:number; role:'user'|'assistant'; content:string; image?:string; result?:ChatResult; }
@Component({
  selector:'app-chat-widget', standalone:true, imports:[CommonModule,FormsModule,RouterLink],
  templateUrl:'./chat-widget.html', styleUrl:'./chat-widget.css'
})
export class ChatWidget implements OnDestroy {
  private http = inject(HttpClient);
  @ViewChild('feed') feed?:ElementRef<HTMLElement>;
  @ViewChild('messageInput') messageInput?:ElementRef<HTMLTextAreaElement>;
  @ViewChild('launcher') launcher?:ElementRef<HTMLButtonElement>;
  readonly opened = signal(false);
  readonly tab = signal<'chat'|'image'>('chat');
  readonly messages = signal<ChatMessage[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly aiEnabled = signal<boolean|null>(null);
  readonly preview = signal('');
  readonly imageName = signal('');
  readonly readingImage = signal(false);
  text = '';
  consent = false;
  maxPrice:number|null = null;
  private nextId = 0;
  private active?:Subscription;
  private statusRequest?:Subscription;
  private reader?:FileReader;
  private focusTimer?:ReturnType<typeof setTimeout>;
  private lastRequest?:{kind:'chat';text:string;history:{role:string;content:string}[]} | {kind:'image';image:string;maxPrice:number|null};
  readonly suggestions = ['Quà tặng dưới 300k','Tìm đồ gốm dưới 500k','Chính sách đổi trả','Phí giao hàng'];
  open():void {
    this.opened.set(true);
    this.checkStatus();
    this.focusTimer = setTimeout(() => { this.messageInput?.nativeElement.focus(); this.scroll(); });
  }
  close():void { this.opened.set(false); this.launcher?.nativeElement.focus(); }
  checkStatus():void {
    this.statusRequest?.unsubscribe();
    this.statusRequest = this.http.get<{ai:boolean}>('/api/assistant/status').pipe(timeout(10000)).subscribe({next:data => this.aiEnabled.set(data.ai),error:() => this.aiEnabled.set(false)});
  }
  changeTab(tab:'chat'|'image'):void { this.tab.set(tab); this.error.set(''); }
  private add(message:Omit<ChatMessage,'id'>):void { this.messages.update(rows => [...rows,{...message,id:++this.nextId}].slice(-30)); this.scroll(); }
  private scroll():void { queueMicrotask(() => { const element=this.feed?.nativeElement; if(element) element.scrollTop=element.scrollHeight; }); }
  send(value = this.text):void {
    const message=value.trim();
    if (this.busy() || this.readingImage() || !message) return;
    if (message.length > 1000) { this.error.set('Bạn nhập tối đa 1000 ký tự nhé.'); return; }
    const history=this.messages().filter(row => !row.image && row.result?.mode !== 'image').slice(-8).map(row => ({role:row.role,content:row.content.slice(0,1000)}));
    this.text='';
    this.add({role:'user',content:message});
    this.lastRequest={kind:'chat',text:message,history};
    this.execute();
  }
  sendImage():void {
    if (this.busy() || this.readingImage()) return;
    if (!this.preview()) {this.error.set('Bạn chọn một ảnh sản phẩm trước nhé.');return;}
    if (!this.consent) {this.error.set('Vui lòng đồng ý gửi ảnh cho AI trước khi tìm.');return;}
    if (this.maxPrice != null && (!Number.isFinite(this.maxPrice) || this.maxPrice < 0 || this.maxPrice > 1e9)) {this.error.set('Ngân sách không hợp lệ.');return;}
    this.add({role:'user',content:'Tìm sản phẩm tương tự ảnh này'+(this.maxPrice != null ? ' · tối đa '+this.format(this.maxPrice) : ''),image:this.preview()});
    this.lastRequest={kind:'image',image:this.preview(),maxPrice:this.maxPrice};
    this.tab.set('chat');
    this.execute();
    this.removeImage();
  }
  hasRetry():boolean {return Boolean(this.lastRequest);}
  retry():void {if (!this.busy() && this.lastRequest) this.execute();}
  private execute():void {
    const request=this.lastRequest;
    if (!request) return;
    this.busy.set(true);this.error.set('');
    const url=request.kind === 'chat' ? '/api/assistant/chat' : '/api/assistant/image-search';
    const body=request.kind === 'chat' ? {message:request.text,history:request.history} : {image:request.image,maxPrice:request.maxPrice,consent:true};
    this.active=this.http.post<ChatResult>(url,body).pipe(timeout(105000),finalize(() => {this.busy.set(false);this.scroll();})).subscribe({
      next:result => {this.add({role:'assistant',content:result.reply,result});this.lastRequest=undefined;},
      error:err => {this.error.set(typeof err?.error?.message === 'string' ? err.error.message : 'Chưa kết nối được trợ lý. Bạn thử lại hoặc mở trang liên hệ nhé.');}
    });
  }
  cancel():void {this.active?.unsubscribe();this.error.set('Đã dừng chờ phản hồi. Bạn có thể thử lại.');}
  clear():void {
    this.active?.unsubscribe();this.messages.set([]);this.error.set('');this.lastRequest=undefined;this.text='';this.removeImage();
  }
  chooseImage(event:Event):void {
    const input=event.target as HTMLInputElement;
    const file=input.files?.[0]; input.value='';
    if (!file) return;
    this.reader?.abort();this.preview.set('');this.imageName.set('');this.consent=false;this.error.set('');
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {this.error.set('Chỉ nhận ảnh JPEG, PNG hoặc WebP.');return;}
    if (file.size > 5*1024*1024) {this.error.set('Ảnh tối đa 5 MB. Bạn chọn ảnh nhỏ hơn nhé.');return;}
    this.readingImage.set(true);
    const reader=new FileReader();this.reader=reader;
    reader.onload=() => {this.preview.set(String(reader.result));this.imageName.set(file.name);this.readingImage.set(false);};
    reader.onerror=() => {this.error.set('Không thể đọc ảnh này.');this.readingImage.set(false);};
    reader.onabort=() => this.readingImage.set(false);
    reader.readAsDataURL(file);
  }
  removeImage():void {this.reader?.abort();this.preview.set('');this.imageName.set('');this.consent=false;this.readingImage.set(false);}
  format(value:number):string {return Number(value).toLocaleString('vi-VN')+'đ';}
  handleEnter(event:KeyboardEvent):void {
    if (event.key==='Enter' && !event.shiftKey && !event.isComposing) {event.preventDefault();this.send();}
  }
  ngOnDestroy():void {this.active?.unsubscribe();this.statusRequest?.unsubscribe();this.reader?.abort();clearTimeout(this.focusTimer);}
}
