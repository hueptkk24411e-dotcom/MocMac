import { Component } from '@angular/core';

@Component({
  selector: 'app-return-policy-component',
  standalone: false,
  styleUrl: './return-policy-component.css',
  templateUrl: './return-policy-component.html',
})
export class ReturnPolicyComponent {
   openFaq: number | null = 0;

  faqs = [
    {
      question: 'Những trường hợp nào được hỗ trợ đổi trả?',
      answer:
        'Mộc Mạc hỗ trợ đổi trả khi sản phẩm bị lỗi, hư hỏng trong quá trình vận chuyển, giao sai sản phẩm hoặc thiếu sản phẩm so với đơn hàng.'
    },
    {
      question: 'Tôi cần cung cấp thông tin gì khi yêu cầu đổi trả?',
      answer:
        'Bạn nên cung cấp mã đơn hàng, hình ảnh sản phẩm, bao bì và mô tả vấn đề gặp phải để Mộc Mạc có thể kiểm tra nhanh hơn.'
    },
    {
      question: 'Sản phẩm đã sử dụng có được đổi trả không?',
      answer:
        'Thông thường sản phẩm đã qua sử dụng hoặc không còn nguyên trạng sẽ không thuộc phạm vi đổi trả, trừ trường hợp lỗi được xác định từ sản phẩm.'
    },
    {
      question: 'Sản phẩm thực phẩm có được đổi trả không?',
      answer:
        'Đối với thực phẩm và đặc sản, Mộc Mạc hỗ trợ khi sản phẩm bị hư hỏng, hết hạn, sai sản phẩm hoặc không đảm bảo tình trạng khi giao nhận.'
    },
    {
      question: 'Tôi có phải trả phí vận chuyển khi đổi trả không?',
      answer:
        'Nếu lỗi thuộc về sản phẩm, người bán hoặc quá trình giao nhận, chi phí đổi trả sẽ được xử lý theo chính sách hỗ trợ của Mộc Mạc.'
    },
    {
      question: 'Tôi có thể đổi sang sản phẩm khác không?',
      answer:
        'Tùy từng trường hợp, khách hàng có thể được hỗ trợ đổi sản phẩm tương đương hoặc xử lý theo phương án phù hợp với đơn hàng.'
    }
  ];

  toggleFaq(index: number): void {
    this.openFaq = this.openFaq === index ? null : index;
  }
}
