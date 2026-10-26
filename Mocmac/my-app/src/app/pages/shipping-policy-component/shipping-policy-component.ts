import { Component } from '@angular/core';

@Component({
  selector: 'app-shipping-policy-component',
  standalone: false,
  styleUrl: './shipping-policy-component.css',
  templateUrl: './shipping-policy-component.html',
})
export class ShippingPolicyComponent {
  openFaq: number | null = 0;

  faqs = [
    {
      question: 'Mộc Mạc có giao hàng toàn quốc không?',
      answer:
        'Có. Mộc Mạc hỗ trợ giao hàng đến nhiều tỉnh thành trên toàn quốc tùy theo phạm vi phục vụ của đơn vị vận chuyển.'
    },
    {
      question: 'Thời gian giao hàng mất bao lâu?',
      answer:
        'Thời gian giao hàng phụ thuộc vào địa chỉ nhận hàng, nơi xuất phát của sản phẩm và loại sản phẩm. Một số sản phẩm thủ công hoặc đặc sản theo mùa có thể cần thêm thời gian chuẩn bị.'
    },
    {
      question: 'Tôi có thể theo dõi đơn hàng không?',
      answer:
        'Có. Sau khi đặt hàng thành công, bạn có thể sử dụng mã đơn hàng để theo dõi trạng thái xử lý và vận chuyển.'
    },
    {
      question: 'Phí vận chuyển được tính như thế nào?',
      answer:
        'Phí vận chuyển phụ thuộc vào địa chỉ giao hàng, trọng lượng đơn hàng và đơn vị vận chuyển. Chi phí dự kiến sẽ được hiển thị trước khi khách hàng xác nhận đơn.'
    },
    {
      question: 'Nếu giao hàng chậm thì tôi nên làm gì?',
      answer:
        'Bạn nên kiểm tra trạng thái đơn hàng trước. Nếu đơn hàng không cập nhật trong thời gian dài, hãy liên hệ Mộc Mạc để được hỗ trợ.'
    },
    {
      question: 'Tôi có thể thay đổi địa chỉ nhận hàng không?',
      answer:
        'Bạn có thể yêu cầu thay đổi địa chỉ nếu đơn hàng chưa được bàn giao cho đơn vị vận chuyển. Sau khi đơn đã được vận chuyển, việc thay đổi có thể không còn khả dụng.'
    }
  ];

  toggleFaq(index: number): void {
    this.openFaq = this.openFaq === index ? null : index;
  }
}