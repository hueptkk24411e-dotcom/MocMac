import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';

registerLocaleData(localeVi);

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { authInterceptor } from './auth.interceptor';

import { AdminLayoutComponent } from './admin/admin-layout';
import { DangnhapComponent } from './dang-nhap/dang-nhap';

import { AdminDashboardComponent } from './admin/dashboard';
import { AdminOrdersComponent } from './admin/orders';
import { AdminProductsComponent } from './admin/products';
import { AdminGiftsComponent } from './admin/gifts';
import { AdminRegionsComponent } from './admin/regions';
import { AdminCouponsComponent } from './admin/coupons';
import { AdminUsersComponent } from './admin/users';
import { AdminContactsComponent } from './admin/contacts';
import { AdminNotificationsComponent } from './admin/notifications';
import { AdminReviewsComponent } from './admin/reviews';
import { AdminAuditComponent } from './admin/audit';
import { AdminRoleRequestsComponent } from './admin/admin-role-requests';
import { AdminRoutePermissionsComponent } from './admin/route-permissions';

import { PaginationComponent } from './admin/pagination';
import { ToastComponent } from './admin/toast';

@NgModule({
  declarations: [
    App,
    AdminLayoutComponent,
    AdminDashboardComponent,
    AdminOrdersComponent,
    AdminProductsComponent,
    AdminGiftsComponent,
    AdminRegionsComponent,
    AdminCouponsComponent,
    AdminUsersComponent,
    AdminContactsComponent,
    AdminNotificationsComponent,
    AdminReviewsComponent,
    AdminAuditComponent,
    AdminRoleRequestsComponent,
    AdminRoutePermissionsComponent,
    DangnhapComponent,
    ToastComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    RouterModule,
    PaginationComponent,
  ],
  providers: [provideHttpClient(withInterceptors([authInterceptor])), { provide: LOCALE_ID, useValue: 'vi' }],
  bootstrap: [App],
})
export class AppModule {}
