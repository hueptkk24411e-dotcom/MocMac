import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home-component/home-component';
import { PageComponent } from './pages/page-component/page-component';
import { ProductsComponent } from './pages/products-component/products-component';
import { GiftPageComponent } from './pages/gift-page/gift-page';
import { DangnhapComponent } from './pages/dangnhap/dangnhap';
import { Lienhe } from './pages/lienhe/lienhe';
import { ProductDetailComponent } from './product-detail-component/product-detail-component';
import { GiohangComponent } from './pages/giohang/giohang';
import { ShippingPolicyComponent } from './pages/shipping-policy-component/shipping-policy-component';
import { ReturnPolicyComponent } from './pages/return-policy-component/return-policy-component';
import { PurchasingSupportComponent } from './pages/purchasing-support-component/purchasing-support-component';
import { PaymentSupportComponent } from './pages/payment-support-component/payment-support-component';
import { FaqComponent } from './pages/faq-component/faq-component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  // Đặt route chi tiết trước route danh sách để URL /san-pham/:id
  // luôn được nhận đúng bởi ProductDetailComponent.
  {
    path: 'san-pham/:id',
    component: ProductDetailComponent,
    data: { title: 'Chi tiết sản phẩm | Mộc Mạc' }
  },
  {
    path: 'san-pham',
    pathMatch: 'full',
    component: ProductsComponent,
    data: { title: 'Sản phẩm | Mộc Mạc' }
  },
  {
    path: 'giohang',
    component: GiohangComponent,
    data: { title: 'Giỏ hàng | Mộc Mạc' }
  },
  {
    path: 'qua-tang',
    component: GiftPageComponent,
    data: { title: 'Quà tặng | Mộc Mạc' }
  },
  {
    path: 'dang-nhap',
    component: DangnhapComponent,
    data: { title: 'Đăng nhập | Mộc Mạc' }
  },
  { path: 'vung-mien', component: PageComponent, data: { title: 'Vùng miền' } },
  { path: 'lang-nghe', component: PageComponent, data: { title: 'Làng nghề' } },
  { path: 'lien-he', component:Lienhe, data: { title: 'Liên hệ' } },
  { path: 'gioi-thieu', component: PageComponent, data: { title: 'Giới thiệu' } },
  { path: 'qua-tang-theo-nhu-cau', component: PageComponent, data: { title: 'Quà tặng theo nhu cầu' } },
  { path: 'qua-tang-doanh-nghiep', component: PageComponent, data: { title: 'Quà tặng doanh nghiệp' } },
  { path: 'thong-bao', component: PageComponent, data: { title: 'Thông báo' } },
  { path: 'ho-tro', component: PageComponent, data: { title: 'Hỗ trợ' } },
  { path: 'dang-ky', component: DangnhapComponent, data: { title: 'Đăng ký' } },
  { path: 'products/:id', component: ProductDetailComponent },
    { path: 'faq', component: FaqComponent, data: { title: 'Câu hỏi thường gặp' } },

{ 
  path: 'ho-tro-thanh-toan',
  component: PaymentSupportComponent,
  data: { title: 'Hỗ trợ thanh toán' }
},

{
  path: 'huong-dan-mua-hang',
  component: PurchasingSupportComponent,
  data: { title: 'Hướng dẫn mua hàng' }
},

{
  path: 'chinh-sach-doi-tra',
  component: ReturnPolicyComponent,
  data: { title: 'Chính sách đổi trả' }
},

{
  path: 'chinh-sach-van-chuyen',
  component: ShippingPolicyComponent,
  data: { title: 'Chính sách vận chuyển' }
},
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }