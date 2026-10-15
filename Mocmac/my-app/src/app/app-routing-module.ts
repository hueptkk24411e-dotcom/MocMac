import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home-component/home-component';
import { PageComponent } from './pages/page-component/page-component';
import { GiftPageComponent } from './pages/gift-page/gift-page';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'san-pham', component: PageComponent },
  { path: 'tim-kiem', component: PageComponent },
  { path: 'login', redirectTo: 'dang-nhap' },
  { path: 'register', redirectTo: 'dang-ky' },
  { path: 'search', redirectTo: 'tim-kiem' },
  { path: 'vung-mien', component: PageComponent, data: { title: 'Vùng miền' } },
  { path: 'lang-nghe', component: PageComponent, data: { title: 'Làng nghề' } },
  { path: 'lien-he', component: PageComponent, data: { title: 'Liên hệ' } },
  { path: 'gioi-thieu', component: PageComponent, data: { title: 'Giới thiệu' } },
  { path: 'qua-tang-theo-nhu-cau', component: PageComponent, data: { title: 'Quà tặng theo nhu cầu' } },
  { path: 'qua-tang-doanh-nghiep', component: PageComponent, data: { title: 'Quà tặng doanh nghiệp' } },
  { path: 'thong-bao', component: PageComponent, data: { title: 'Thông báo' } },
  { path: 'ho-tro', component: PageComponent, data: { title: 'Hỗ trợ' } },
  { path: 'qua-tang', component: GiftPageComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}