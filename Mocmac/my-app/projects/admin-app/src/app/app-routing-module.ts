import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminLayoutComponent } from './admin/admin-layout';
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
import { adminGuard } from './admin/auth.guard';
import { DangnhapComponent } from './dang-nhap/dang-nhap';

const routes: Routes = [
  { path: 'dang-nhap', component: DangnhapComponent },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'orders', component: AdminOrdersComponent },
      { path: 'products', component: AdminProductsComponent },
      { path: 'gifts', component: AdminGiftsComponent },
      { path: 'regions', component: AdminRegionsComponent },
      { path: 'coupons', component: AdminCouponsComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'role-requests', component: AdminRoleRequestsComponent },
      { path: 'route-permissions', component: AdminRoutePermissionsComponent },
      { path: 'contacts', component: AdminContactsComponent },
      { path: 'notifications', component: AdminNotificationsComponent },
      { path: 'reviews', component: AdminReviewsComponent },
      { path: 'audit', component: AdminAuditComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
