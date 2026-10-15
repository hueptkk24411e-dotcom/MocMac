import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { HeaderComponent } from './layout/header-component/header-component';
import { HomeComponent } from './pages/home-component/home-component';
import { PageComponent } from './pages/page-component/page-component';
import { FooterComponent } from './layout/footer-component/footer-component';
import { ProductsComponent } from './products-component/products-component';
import { DangnhapComponent } from './dangnhap/dangnhap';
import { GiohangComponent } from './giohang/giohang';

@NgModule({
  declarations: [
    App,
    HeaderComponent,
    HomeComponent,
    FooterComponent,
    PageComponent,
    ProductsComponent,
    DangnhapComponent,
  ],
  imports: [BrowserModule, ReactiveFormsModule, AppRoutingModule, GiohangComponent],
  providers: [provideBrowserGlobalErrorListeners(), provideHttpClient()],
  bootstrap: [App],
})
export class AppModule {}
