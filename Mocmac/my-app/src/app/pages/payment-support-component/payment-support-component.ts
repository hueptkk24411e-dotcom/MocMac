import { Component } from '@angular/core';

@Component({
  selector: 'app-payment-support-component',
  standalone: false,
  styleUrl: './payment-support-component.css',
  templateUrl: './payment-support-component.html',
})
export class PaymentSupportComponent {
   openFaq: number | null = 0;

  faqs = [
    {
      question: 'Mộc Mạc hỗ trợ những phương thức thanh toán nào?',
      answer:
        'Mộc Mạc hỗ trợ thanh toán khi nhận hàng (COD) và phương thức thanh toán trực tuyến mô phỏng trên hệ thống.'
    },
    {
      question: 'Thanh toán COD là gì?',
      answer:
        'COD là hình thức thanh toán khi nhận hàng. Bạn chỉ cần thanh toán cho đơn hàng khi sản phẩm được giao đến.'
    },
    {
      question: 'Thanh toán trực tuyến trên Mộc Mạc hoạt động như thế nào?',
      answer:
        'Tại bước thanh toán, bạn có thể lựa chọn hình thức thanh toán trực tuyến. Trong phiên bản hiện tại của hệ thống, chức năng này được mô phỏng để minh họa quy trình thanh toán.'
    },
    {
      question: 'Tôi có thể sử dụng voucher khi thanh toán không?',
      answer:
        'Có. Bạn có thể nhập hoặc lựa chọn voucher phù hợp tại bước thanh toán. Hệ thống sẽ kiểm tra điều kiện áp dụng và tự động tính lại tổng đơn hàng.'
    },
    {
      question: 'Tại sao voucher của tôi không sử dụng được?',
      answer:
        'Voucher có thể không hợp lệ do chưa đạt giá trị đơn hàng tối thiểu, không áp dụng cho sản phẩm đã chọn, đã hết hạn hoặc đã hết lượt sử dụng.'
    },
    {
      question: 'Nếu thanh toán trực tuyến không thành công thì sao?',
      answer:
        'Bạn nên kiểm tra lại thông tin thanh toán hoặc lựa chọn một phương thức khác. Nếu đơn hàng chưa được xác nhận, hệ thống sẽ không ghi nhận thanh toán thành công.'
    }
  ];

  toggleFaq(index: number): void {
    this.openFaq = this.openFaq === index ? null : index;
  }
}