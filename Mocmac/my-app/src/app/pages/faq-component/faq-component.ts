import { Component } from '@angular/core';

@Component({
  selector: 'app-faq-component',
  standalone: false,
  styleUrl: './faq-component.css',
  templateUrl: './faq-component.html',
})
export class FaqComponent {
  activeCategory = 'Tất cả';
  openIndex: number | null = 0;

  categories = [
    'Tất cả',
    'Đặt hàng',
    'Thanh toán',
    'Vận chuyển',
    'Đổi trả',
    'Tài khoản',
    'Voucher',
    'Nguồn gốc sản phẩm'
  ];

  faqs = [
    {
      category: 'Đặt hàng',
      question: 'Làm thế nào để đặt hàng trên Mộc Mạc?',
      answer:
        'Bạn có thể chọn sản phẩm, thêm vào giỏ hàng, kiểm tra lại số lượng và tiến hành thanh toán. Sau khi xác nhận, hệ thống sẽ tạo đơn hàng để xử lý.'
    },
    {
      category: 'Đặt hàng',
      question: 'Tôi có thể mua nhiều sản phẩm trong một đơn hàng không?',
      answer:
        'Có. Bạn có thể thêm nhiều sản phẩm vào giỏ hàng trước khi tiến hành thanh toán.'
    },
    {
      category: 'Đặt hàng',
      question: 'Tôi có thể hủy đơn hàng không?',
      answer:
        'Bạn có thể yêu cầu hủy đơn khi đơn hàng chưa được bàn giao cho đơn vị vận chuyển. Sau khi đơn đã được vận chuyển, việc hủy có thể không còn khả dụng.'
    },
    {
      category: 'Thanh toán',
      question: 'Mộc Mạc hỗ trợ những phương thức thanh toán nào?',
      answer:
        'Mộc Mạc hỗ trợ thanh toán khi nhận hàng COD và phương thức thanh toán trực tuyến được mô phỏng trên hệ thống.'
    },
    {
      category: 'Thanh toán',
      question: 'Thanh toán COD là gì?',
      answer:
        'COD là hình thức thanh toán khi nhận hàng. Bạn thanh toán cho đơn hàng khi sản phẩm được giao đến địa chỉ nhận.'
    },
    {
      category: 'Thanh toán',
      question: 'Nếu thanh toán trực tuyến không thành công thì sao?',
      answer:
        'Bạn nên kiểm tra lại thông tin thanh toán hoặc lựa chọn phương thức khác. Nếu đơn hàng chưa được xác nhận, hệ thống sẽ không ghi nhận thanh toán thành công.'
    },
    {
      category: 'Vận chuyển',
      question: 'Mộc Mạc có giao hàng toàn quốc không?',
      answer:
        'Có. Mộc Mạc hỗ trợ giao hàng đến nhiều tỉnh thành trên toàn quốc tùy theo phạm vi của đơn vị vận chuyển.'
    },
    {
      category: 'Vận chuyển',
      question: 'Thời gian giao hàng mất bao lâu?',
      answer:
        'Thời gian giao hàng phụ thuộc vào khu vực nhận hàng, nơi xuất phát của sản phẩm và loại sản phẩm. Một số sản phẩm thủ công hoặc theo mùa có thể cần thêm thời gian chuẩn bị.'
    },
    {
      category: 'Vận chuyển',
      question: 'Làm thế nào để theo dõi đơn hàng?',
      answer:
        'Sau khi đặt hàng thành công, bạn có thể sử dụng mã đơn hàng tại trang Theo dõi đơn hàng để kiểm tra trạng thái xử lý và vận chuyển.'
    },
    {
      category: 'Đổi trả',
      question: 'Những trường hợp nào được hỗ trợ đổi trả?',
      answer:
        'Mộc Mạc hỗ trợ đổi trả khi sản phẩm bị lỗi, hư hỏng trong quá trình vận chuyển, giao sai hoặc thiếu sản phẩm so với đơn hàng.'
    },
    {
      category: 'Đổi trả',
      question: 'Tôi cần chuẩn bị gì khi yêu cầu đổi trả?',
      answer:
        'Bạn nên chuẩn bị mã đơn hàng, hình ảnh sản phẩm, hình ảnh bao bì và mô tả rõ vấn đề gặp phải.'
    },
    {
      category: 'Tài khoản',
      question: 'Tôi có cần tài khoản để mua hàng không?',
      answer:
        'Khách hàng nên đăng ký tài khoản để thuận tiện quản lý đơn hàng, theo dõi giao hàng và lưu sản phẩm yêu thích.'
    },
    {
      category: 'Tài khoản',
      question: 'Tôi quên mật khẩu thì phải làm sao?',
      answer:
        'Bạn có thể sử dụng chức năng khôi phục mật khẩu trên trang đăng nhập nếu chức năng này được hỗ trợ trên hệ thống.'
    },
    {
      category: 'Voucher',
      question: 'Làm thế nào để sử dụng voucher?',
      answer:
        'Tại bước thanh toán, bạn có thể nhập hoặc lựa chọn voucher phù hợp. Hệ thống sẽ kiểm tra điều kiện và tự động tính lại tổng giá trị đơn hàng.'
    },
    {
      category: 'Voucher',
      question: 'Tại sao voucher của tôi không sử dụng được?',
      answer:
        'Voucher có thể đã hết hạn, chưa đạt giá trị đơn hàng tối thiểu, không áp dụng cho sản phẩm đã chọn hoặc đã hết lượt sử dụng.'
    },
    {
      category: 'Nguồn gốc sản phẩm',
      question: 'Heritage Score là gì?',
      answer:
        'Heritage Score giúp thể hiện mức độ gắn kết của sản phẩm với nguồn gốc địa phương, làng nghề, kỹ thuật truyền thống và giá trị văn hóa.'
    },
    {
      category: 'Nguồn gốc sản phẩm',
      question: 'Làm sao để biết nguồn gốc của sản phẩm?',
      answer:
        'Bạn có thể xem thông tin vùng miền, tỉnh thành, làng nghề và sử dụng mã QR truy xuất đối với những sản phẩm có hỗ trợ tính năng này.'
    },
    {
      category: 'Nguồn gốc sản phẩm',
      question: 'Sản phẩm OCOP là gì?',
      answer:
        'Sản phẩm OCOP là sản phẩm thuộc chương trình Mỗi xã một sản phẩm. Trên Mộc Mạc, các sản phẩm có thông tin OCOP sẽ hiển thị số sao tương ứng.'
    }
  ];

  filteredFaqs() {
    if (this.activeCategory === 'Tất cả') {
      return this.faqs;
    }

    return this.faqs.filter(
      faq => faq.category === this.activeCategory
    );
  }

  setCategory(category: string): void {
    this.activeCategory = category;
    this.openIndex = null;
  }

  toggleFaq(index: number): void {
    this.openIndex = this.openIndex === index ? null : index;
  }
}

