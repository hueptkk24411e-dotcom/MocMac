import { Component } from '@angular/core';

@Component({
  selector: 'app-purchasing-support-component',
  standalone: false,
  styleUrl: './purchasing-support-component.css',
  templateUrl: './purchasing-support-component.html',
})
export class PurchasingSupportComponent {

  steps = [
    {
      number: '01',
      icon: 'fa-solid fa-magnifying-glass',
      title: 'Tìm kiếm sản phẩm',
      description:
        'Khám phá sản phẩm theo danh mục, vùng miền, tỉnh thành, làng nghề hoặc sử dụng bộ lọc phù hợp với nhu cầu.'
    },
    {
      number: '02',
      icon: 'fa-solid fa-box-open',
      title: 'Xem thông tin sản phẩm',
      description:
        'Kiểm tra giá, nguồn gốc, Heritage Score, chứng nhận OCOP, đánh giá và các thông tin liên quan.'
    },
    {
      number: '03',
      icon: 'fa-solid fa-cart-shopping',
      title: 'Thêm vào giỏ hàng',
      description:
        'Chọn sản phẩm mong muốn và thêm vào giỏ. Bạn có thể điều chỉnh số lượng hoặc xóa sản phẩm trước khi thanh toán.'
    },
    {
      number: '04',
      icon: 'fa-solid fa-location-dot',
      title: 'Nhập thông tin nhận hàng',
      description:
        'Điền đầy đủ họ tên, số điện thoại, địa chỉ nhận hàng và ghi chú nếu cần.'
    },
    {
      number: '05',
      icon: 'fa-solid fa-ticket',
      title: 'Áp dụng voucher',
      description:
        'Nhập mã giảm giá hoặc lựa chọn voucher phù hợp. Hệ thống sẽ tự động kiểm tra điều kiện áp dụng.'
    },
    {
      number: '06',
      icon: 'fa-solid fa-credit-card',
      title: 'Chọn phương thức thanh toán',
      description:
        'Lựa chọn thanh toán khi nhận hàng COD hoặc phương thức thanh toán trực tuyến được hỗ trợ trên hệ thống.'
    },
    {
      number: '07',
      icon: 'fa-solid fa-circle-check',
      title: 'Xác nhận đơn hàng',
      description:
        'Kiểm tra lại toàn bộ thông tin và xác nhận đặt hàng. Hệ thống sẽ tạo mã đơn hàng để bạn theo dõi.'
    },
    {
      number: '08',
      icon: 'fa-solid fa-truck-fast',
      title: 'Theo dõi và nhận hàng',
      description:
        'Theo dõi trạng thái đơn hàng từ lúc xác nhận đến khi sản phẩm được giao đến tay bạn.'
    }
  ];
}
