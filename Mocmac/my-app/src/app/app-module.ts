import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
<<<<<<< HEAD
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';

=======
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
>>>>>>> 7112b17f39e8145216d815e6c257ffbbe0409f8c
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

// 1. Import đúng layout components
import { HeaderComponent } from './layout/header-component/header-component';
import { FooterComponent } from './layout/footer-component/footer-component';

// 2. Import các trang
import { HomeComponent } from './pages/home-component/home-component';
import { PageComponent } from './pages/page-component/page-component';
<<<<<<< HEAD
import { GiftPageComponent } from './pages/gift-page/gift-page';
=======
import { FooterComponent } from './layout/footer-component/footer-component';
import { ProductsComponent } from './products-component/products-component';
import { DangnhapComponent } from './dangnhap/dangnhap';
import { GiohangComponent } from './giohang/giohang';
>>>>>>> 7112b17f39e8145216d815e6c257ffbbe0409f8c

@NgModule({
  declarations: [
    App,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    PageComponent,
<<<<<<< HEAD
    GiftPageComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [App]
=======
    ProductsComponent,
    DangnhapComponent,
  ],
  imports: [BrowserModule, ReactiveFormsModule, AppRoutingModule, GiohangComponent],
  providers: [provideBrowserGlobalErrorListeners(), provideHttpClient()],
  bootstrap: [App],
>>>>>>> 7112b17f39e8145216d815e6c257ffbbe0409f8c
})
export class AppModule { }