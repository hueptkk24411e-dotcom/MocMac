import { Component, computed, inject, signal } from '@angular/core';
import { CartService } from '../cart.service';

@Component({
  selector: 'app-homepagecomponent',
  standalone: false,
  styleUrl: './homepagecomponent.css',
  templateUrl: './homepagecomponent.html',
})
export class Homepagecomponent {
  cart = inject(CartService);
  features = [['Sản phẩm chính gốc', 'Gắn với vùng miền, làng nghề cụ thể', '🌿'], ['Heritage Score minh bạch', 'Đánh giá nguồn gốc & giá trị văn hoá', '🛡️'], ['Truy xuất QR dễ dàng', 'Xem nguồn gốc, câu chuyện sản phẩm', '▦'], ['Giao hàng toàn quốc', 'Hỗ trợ đổi trả linh hoạt', '🚚']];
  polaroids = [['Con người', '#9bbf9a'], ['Làng nghề', '#c9a27b'], ['Vùng miền', '#b9774f'], ['Giá trị bền vững', '#d9b48f']];
  regions = [['Tây Bắc', '#7CA982'], ['Đông Bắc', '#9bb7a5'], ['Đồng bằng sông Hồng', '#c9a27b'], ['Bắc Trung Bộ', '#d9b48f'], ['Duyên hải Nam Trung Bộ', '#8fb5c4'], ['Tây Nguyên', '#6f9a70'], ['Đông Nam Bộ', '#b9774f'], ['Tây Nam Bộ', '#a8c18a']];
  tabs = ['Tất cả', 'Đặc sản', 'Thủ công mỹ nghệ', 'Cà phê - Trà', 'Sản phẩm OCOP'];
  tab = signal('Tất cả');
  products: Product[] = [
    { name: 'Cà phê Buôn Ma Thuột', place: 'Đắk Lắk', price: '120.000đ', cat: 'Cà phê - Trà', rate: 5, reviews: 128, icon: '☕' },
    { name: 'Túi mây tre đan Phú Vinh', place: 'Hà Nội', price: '250.000đ', cat: 'Thủ công mỹ nghệ', rate: 5, reviews: 86, icon: '👜' },
    { name: 'Bộ ấm trà Bát Tràng', place: 'Hà Nội', price: '690.000đ', cat: 'Thủ công mỹ nghệ', rate: 5, reviews: 64, icon: '🍵' },
    { name: 'Mật ong Tây Bắc', place: 'Sơn La', price: '180.000đ', cat: 'Đặc sản', rate: 5, reviews: 92, icon: '🍯' },
    { name: 'Bát sơn mài truyền thống', place: 'Hà Nội', price: '320.000đ', cat: 'Thủ công mỹ nghệ', rate: 5, reviews: 45, icon: '🥣' },
    { name: 'Trà Thái Nguyên', place: 'Thái Nguyên', price: '150.000đ', cat: 'Cà phê - Trà', rate: 5, reviews: 73, icon: '🍃' },
  ];
  shown = computed(() => this.tab() === 'Tất cả' ? this.products : this.products.filter(p => p.cat === this.tab() || (this.tab() === 'Sản phẩm OCOP' && p.rate === 5)));
  commits = [['Ủng hộ', 'làng nghề truyền thống', '🤝'], ['Thúc đẩy', 'phát triển bền vững', '🌱'], ['Đồng hành', 'cùng người dân địa phương', '👥']];
}
