import { Component, inject } from '@angular/core';
import { CartService } from '../cart.service';
@Component({
  selector: 'app-headercomponent',
  standalone: false,
  styleUrl: './headercomponent.css',
  templateUrl: './headercomponent.html',
})
export class Headercomponent {
  cart = inject(CartService);
  left = ['Giới thiệu', 'Quà tặng theo nhu cầu', 'Quà tặng doanh nghiệp'];
  right = ['Thông báo', 'Hỗ trợ', 'Tiếng Việt', 'Đăng ký', 'Đăng nhập'];
  menu = ['Trang chủ', 'Sản phẩm', 'Đặc sản', 'Quà tặng', 'Vùng miền', 'Làng nghề', 'Liên hệ'];
}
