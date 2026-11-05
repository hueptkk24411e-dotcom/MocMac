import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ChatWidget } from './chat-widget';

describe('Mộc Mạc chat widget', () => {
 let fixture:ComponentFixture<ChatWidget>;
 let widget:ChatWidget;
 let http:HttpTestingController;
 beforeEach(async () => {
  await TestBed.configureTestingModule({imports:[ChatWidget],providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([])]}).compileComponents();
  fixture=TestBed.createComponent(ChatWidget);widget=fixture.componentInstance;http=TestBed.inject(HttpTestingController);fixture.detectChanges();
 });
 afterEach(()=>{fixture.destroy();http.verify();});
 const open=()=>{widget.open();http.expectOne('/api/assistant/status').flush({ai:false});fixture.detectChanges();};
 it('opens a real dialog with help suggestions and correct backend status',()=>{
  open();expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();expect(fixture.nativeElement.textContent).toContain('Quà tặng dưới 300k');expect(widget.aiEnabled()).toBe(false);
 });
 it('sends chat once, renders real product links, and treats AI content as plain text',()=>{
  open();widget.send('đồ gốm dưới 500k');widget.send('duplicate');
  const req=http.expectOne('/api/assistant/chat');expect(req.request.body.message).toBe('đồ gốm dưới 500k');
  req.flush({reply:'<script>alert(1)</script>',mode:'catalog',products:[{id:1,name:'Bình gốm',price:200000,province:'Hà Nội',image:'',inStock:true}],links:[]});fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('a.chat-product').getAttribute('href')).toBe('/san-pham/1');
  expect(fixture.nativeElement.querySelector('.message-text script')).toBeNull();expect(widget.messages().length).toBe(2);expect(widget.busy()).toBe(false);
 });
 it('preserves recent context for a follow-up',()=>{
  widget.send('Tìm đồ gốm');http.expectOne('/api/assistant/chat').flush({reply:'Ngân sách của bạn?',mode:'ai',products:[],links:[]});
  widget.send('dưới 300k');const req=http.expectOne('/api/assistant/chat');expect(req.request.body.history.map((row:any)=>row.role)).toEqual(['user','assistant']);req.flush({reply:'Đã tìm.',mode:'ai',products:[],links:[]});
 });
 it('does not send a photo until consent is granted',()=>{
  widget.preview.set('data:image/png;base64,test');widget.sendImage();http.expectNone('/api/assistant/image-search');expect(widget.error()).toContain('đồng ý');
 });
 it('sends the approved photo and budget, then clears the upload preview',()=>{
  widget.preview.set('data:image/png;base64,test');widget.consent=true;widget.maxPrice=300000;widget.sendImage();
  const req=http.expectOne('/api/assistant/image-search');expect(req.request.body).toEqual({image:'data:image/png;base64,test',maxPrice:300000,consent:true});expect(widget.preview()).toBe('');
  req.flush({reply:'Tìm được sản phẩm tương tự.',mode:'image',method:'visual',products:[],links:[]});expect(widget.messages()[0].image).toBeTruthy();
 });
 it('rejects unsafe or oversized file types before reading or sending',()=>{
  widget.chooseImage({target:{files:[new File(['<svg/>'],'x.svg',{type:'image/svg+xml'})],value:'x'}} as unknown as Event);
  expect(widget.error()).toContain('JPEG');expect(widget.preview()).toBe('');http.expectNone('/api/assistant/image-search');
  widget.chooseImage({target:{files:[new File([new Uint8Array(5*1024*1024+1)],'large.png',{type:'image/png'})],value:'x'}} as unknown as Event);
  expect(widget.error()).toContain('5 MB');
 });
 it('shows a useful failure and retries without duplicating the user message',()=>{
  widget.send('gốm');http.expectOne('/api/assistant/chat').flush({message:'Thử lại sau một phút.'},{status:429,statusText:'Limited'});
  expect(widget.error()).toContain('một phút');widget.retry();http.expectOne('/api/assistant/chat').flush({reply:'ok',mode:'catalog',products:[],links:[]});expect(widget.messages().length).toBe(2);
 });
 it('reset cancels a pending request and clears chat and image state',()=>{
  widget.send('gốm');const req=http.expectOne('/api/assistant/chat');widget.clear();expect(req.cancelled).toBe(true);expect(widget.messages()).toEqual([]);expect(widget.busy()).toBe(false);
 });
 it('Enter sends and Shift+Enter keeps a newline',()=>{
  widget.text='quà dưới 300k';widget.handleEnter(new KeyboardEvent('keydown',{key:'Enter',shiftKey:true}));http.expectNone('/api/assistant/chat');
  widget.handleEnter(new KeyboardEvent('keydown',{key:'Enter'}));http.expectOne('/api/assistant/chat').flush({reply:'ok',mode:'catalog',products:[],links:[]});expect(widget.text).toBe('');
 });
});
