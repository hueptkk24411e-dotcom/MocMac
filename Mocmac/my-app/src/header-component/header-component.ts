import { Component, inject } from '@angular/core'; 
import { CartService } from '../app/cart.service';

@Component({
  selector: 'app-header-component',
  standalone: false,
  templateUrl: './header-component.html',
  styleUrl: './header-component.css',
})
export class HeaderComponent {
  cart = inject(CartService);
  left = ['Giới thiệu', 'Quà tặng theo nhu cầu', 'Quà tặng doanh nghiệp'];
  right = ['Thông báo', 'Hỗ trợ', 'Tiếng Việt', 'Đăng ký', 'Đăng nhập'];
  menu = ['Trang chủ', 'Sản phẩm', 'Đặc sản', 'Quà tặng', 'Vùng miền', 'Làng nghề', 'Liên hệ'];
}
