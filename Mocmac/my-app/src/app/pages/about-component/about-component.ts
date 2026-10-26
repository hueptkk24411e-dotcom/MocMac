import { Component } from '@angular/core';

@Component({
  selector: 'app-about-component',
  standalone: false,
  styleUrl: './about-component.css',
  templateUrl: './about-component.html',
})
export class AboutComponent {

  missions = [
    {
      icon: '🌿',
      title: 'Tôn vinh giá trị Việt',
      description:
        'Giới thiệu những sản phẩm mang đậm bản sắc vùng miền và giá trị văn hóa truyền thống.'
    },
    {
      icon: '🤝',
      title: 'Kết nối làng nghề',
      description:
        'Tạo cầu nối giữa người tiêu dùng với nghệ nhân, người sản xuất và các làng nghề địa phương.'
    },
    {
      icon: '📍',
      title: 'Minh bạch nguồn gốc',
      description:
        'Giúp khách hàng hiểu rõ hơn về nơi sản xuất, nguồn gốc và hành trình của từng sản phẩm.'
    },
    {
      icon: '✨',
      title: 'Lan tỏa bản sắc',
      description:
        'Đưa những sản phẩm truyền thống Việt Nam đến gần hơn với người tiêu dùng trong thời đại số.'
    }
  ];

  features = [
    {
      title: 'Khám phá theo vùng miền',
      description:
        'Tìm kiếm sản phẩm theo miền Bắc, Trung, Nam, tỉnh thành và các làng nghề nổi tiếng trên khắp Việt Nam.',
      image: 'assets/images/about/region.jpg'
    },
    {
      title: 'Heritage Score',
      description:
        'Hệ thống đánh giá mức độ gắn kết của sản phẩm với nguồn gốc, kỹ thuật truyền thống, làng nghề và giá trị văn hóa.',
      image: 'assets/images/about/heritage.jpg'
    },
    {
      title: 'QR truy xuất nguồn gốc',
      description:
        'Thông qua mã QR, khách hàng có thể khám phá thông tin về nguồn gốc, nơi sản xuất và hành trình tạo nên sản phẩm.',
      image: 'assets/images/about/qr.jpg'
    },
    {
      title: 'Quà tặng mang bản sắc Việt',
      description:
        'Gợi ý những món quà phù hợp theo dịp, nhu cầu và vùng miền như Tết, cưới hỏi, tân gia hay quà tặng đối tác.',
      image: 'assets/images/about/gift.jpg'
    }
  ];

  values = [
    {
      icon: '✓',
      title: 'Chân thật',
      description:
        'Tôn trọng nguồn gốc, câu chuyện và giá trị thực của từng sản phẩm.'
    },
    {
      icon: '❖',
      title: 'Bản sắc',
      description:
        'Ưu tiên những sản phẩm mang đặc trưng văn hóa và vùng miền Việt Nam.'
    },
    {
      icon: '∞',
      title: 'Kết nối',
      description:
        'Kết nối người tiêu dùng, người sản xuất, nghệ nhân và làng nghề.'
    },
    {
      icon: '♻',
      title: 'Bền vững',
      description:
        'Góp phần duy trì nghề truyền thống và hỗ trợ phát triển kinh tế địa phương.'
    }
  ];

  journey = [
    {
      title: 'Vùng nguyên liệu',
      description:
        'Nguồn nguyên liệu đặc trưng được lựa chọn từ từng địa phương.'
    },
    {
      title: 'Người nghệ nhân',
      description:
        'Sản phẩm được tạo nên từ kinh nghiệm và kỹ thuật truyền thống.'
    },
    {
      title: 'Hoàn thiện sản phẩm',
      description:
        'Sản phẩm được kiểm tra, hoàn thiện và chuẩn bị trước khi phân phối.'
    },
    {
      title: 'Đến tay khách hàng',
      description:
        'Giá trị văn hóa được kết nối với người tiêu dùng thông qua Mộc Mạc.'
    }
  ];

}
