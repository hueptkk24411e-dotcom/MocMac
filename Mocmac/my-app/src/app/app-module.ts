import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import localeEn from '@angular/common/locales/en';

registerLocaleData(localeVi);
registerLocaleData(localeEn);

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

// Layout components
import { HeaderComponent } from './layout/header-component/header-component';
import { FooterComponent } from './layout/footer-component/footer-component';

// Pages
import { HomeComponent } from './pages/home-component/home-component';
import { PageComponent } from './pages/page-component/page-component';
import { ProductsComponent } from './pages/products-component/products-component';
import { ProductDetailComponent } from './pages/product-detail/product-detail';
import { ProductOriginComponent } from './pages/product-detail/product-origin';
import { GiftPageComponent } from './pages/gift-page/gift-page';
import { GiftDetailComponent } from './pages/gift-detail/gift-detail';
import { DangnhapComponent } from './pages/dangnhap/dangnhap';
import { Lienhe } from './pages/lienhe/lienhe';
import { VungmienComponent } from './pages/vung-mien/vung-mien';
import { GiohangComponent } from './pages/giohang/giohang';
import { ThongbaoComponent } from './pages/thong-bao/thong-bao';
import { DonHangComponent } from './pages/don-hang/don-hang';
import { AboutComponent } from './pages/about/about';
import { GiftBusinessComponent } from './pages/gift-business/gift-business';
import { GiftNeedsComponent } from './pages/gift-needs/gift-needs';
import { SupportComponent } from './pages/support/support';
import { AccountSettingsComponent } from './pages/account-settings/account-settings';
import { MeomeoGuideComponent } from './components/meomeo-guide/meomeo-guide';

import { PaginationComponent } from './admin/pagination';
import { ToastComponent } from './admin/toast';
import { NotificationPopupComponent } from './pages/notification-popup/notification-popup';
import { ChatPopupComponent } from './chat-popup/chat-popup';
import { TranslatePipe } from './translate.pipe';

@NgModule({
  declarations: [
    App,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    PageComponent,
    GiftPageComponent,
    GiftDetailComponent,
    ProductsComponent,
    ProductDetailComponent,
    VungmienComponent,
    DangnhapComponent,
    Lienhe,
    ToastComponent,
    NotificationPopupComponent,
    ChatPopupComponent,
    TranslatePipe,
    AboutComponent,
    GiftBusinessComponent,
    GiftNeedsComponent,
    SupportComponent,
    AccountSettingsComponent,
    MeomeoGuideComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    RouterModule,
    ProductOriginComponent,
    PaginationComponent,
    GiohangComponent,
    ThongbaoComponent,
    DonHangComponent,
    PaginationComponent,
  ],
  providers: [provideHttpClient(withInterceptors([authInterceptor])), { provide: LOCALE_ID, useValue: 'vi' }],
  bootstrap: [App],
})
export class AppModule {}
