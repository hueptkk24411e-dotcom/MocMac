interface OriginSource {
  label: string;
  url: string;
}

interface OriginPhoto {
  src: string;
  alt: string;
  author: string;
  source: string;
  license: string;
  licenseUrl?: string;
}

interface OriginStep {
  label: string;
  title: string;
  description: string;
  photo: OriginPhoto;
}

interface OriginStory {
  cover: OriginPhoto;
  region: {
    title: string;
    description: string;
    source: OriginSource;
  };
  tabLabel: string;
  heading: string;
  steps: readonly OriginStep[];
  reference: OriginSource;
}

const coffeeCherries: OriginPhoto = {
  src: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Vietnam_coffee_beans_VOA.jpg',
  alt: 'Quả cà phê đang chín trên cành tại Buôn Ma Thuột',
  author: 'Daniel Schearf / VOA',
  source: 'https://commons.wikimedia.org/wiki/File:Vietnam_coffee_beans_VOA.jpg',
  license: 'Phạm vi công cộng tại Hoa Kỳ',
};

const teaHill: OriginPhoto = {
  src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Tea_hill_in_Thai_Nguyen.jpg/960px-Tea_hill_in_Thai_Nguyen.jpg?utm_campaign=index&utm_content=thumbnail&utm_source=commons.wikimedia.org',
  alt: 'Những luống chè trên đồi tại Thái Nguyên',
  author: 'Bacthai20',
  source: 'https://commons.wikimedia.org/wiki/File:Tea_hill_in_Thai_Nguyen.jpg',
  license: 'CC0 1.0',
  licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
};

export const PRODUCT_ORIGIN_STORIES: Readonly<Partial<Record<number, OriginStory>>> = {
  1: {
    cover: coffeeCherries,
    region: {
      title: 'Vùng cà phê Buôn Ma Thuột',
      description: 'Buôn Ma Thuột và các vùng lân cận ở Đắk Lắk có nhiều vùng trồng cà phê trên đất đỏ bazan. Cà phê vối (Robusta) là dòng cà phê gắn với vùng này.',
      source: {
        label: 'Tìm hiểu vùng cà phê · Cổng thông tin Đắk Lắk',
        url: 'https://vpubnd.daklak.gov.vn/quan-ly-va-phat-trien-chi-dan-dia-ly-ca-phe-buon-ma-thuot-can-mot-chien-luoc-dai-hoi-ky-1-9060.html',
      },
    },
    tabLabel: 'Cách chế biến',
    heading: 'Từ quả chín đến hạt rang',
    steps: [
      {
        label: 'Thu hái',
        title: 'Thu hái quả chín',
        description: 'Quả được phân loại theo độ chín sau khi hái. Lá, cành và quả hỏng được loại ra để chuẩn bị cho khâu sơ chế.',
        photo: coffeeCherries,
      },
      {
        label: 'Sơ chế',
        title: 'Sơ chế và làm khô',
        description: 'Với sơ chế khô, quả được phơi hoặc sấy nguyên vỏ rồi mới tách vỏ khô để lấy nhân. Với sơ chế ướt, người làm tách vỏ quả trước, làm sạch lớp nhầy rồi làm khô hạt.',
        photo: {
          src: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Vietnam_-_Drying_coffee_beans.jpg',
          alt: 'Cà phê được trải thành lớp để phơi nắng gần Đà Lạt',
          author: 'P. Hughes',
          source: 'https://commons.wikimedia.org/wiki/File:Vietnam_-_Drying_coffee_beans.jpg',
          license: 'CC BY 4.0',
          licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        },
      },
      {
        label: 'Rang',
        title: 'Rang và làm nguội',
        description: 'Trong máy rang, hạt cà phê chuyển dần sang màu nâu và dậy mùi. Khi đạt mức rang mong muốn, người rang đảo hạt trong khay để làm nguội.',
        photo: {
          src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Beans_Dropping_from_a_Coffee_Roaster.JPG/960px-Beans_Dropping_from_a_Coffee_Roaster.JPG?utm_campaign=index&utm_content=thumbnail&utm_source=commons.wikimedia.org',
          alt: 'Hạt cà phê rang rơi từ máy rang xuống khay làm nguội',
          author: 'Jkafader',
          source: 'https://commons.wikimedia.org/wiki/File:Beans_Dropping_from_a_Coffee_Roaster.JPG',
          license: 'CC BY-SA 3.0',
          licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
        },
      },
      {
        label: 'Thành phẩm',
        title: 'Hạt rang hoặc cà phê xay',
        description: 'Hạt rang có thể đóng gói nguyên hạt hoặc xay theo cỡ phù hợp với phin. Sau khi mở gói, đậy kín và đặt cà phê ở nơi khô, tránh ánh nắng.',
        photo: {
          src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/RoastedCoffeeBeans.JPG/960px-RoastedCoffeeBeans.JPG?utm_campaign=index&utm_content=thumbnail&utm_source=commons.wikimedia.org',
          alt: 'Cận cảnh hạt cà phê đã rang',
          author: 'GOELE',
          source: 'https://commons.wikimedia.org/wiki/File:RoastedCoffeeBeans.JPG',
          license: 'Phạm vi công cộng',
        },
      },
    ],
    reference: {
      label: 'Sơ chế cà phê · International Coffee Organization',
      url: 'https://www.ico.org/documents/ed-2074p-ota.pdf',
    },
  },
  2: {
    cover: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Vietnam_-_coffee_plantation.jpg/960px-Vietnam_-_coffee_plantation.jpg?utm_campaign=index&utm_content=thumbnail&utm_source=commons.wikimedia.org',
      alt: 'Vườn cà phê trên sườn đồi gần Đà Lạt',
      author: 'P. Hughes',
      source: 'https://commons.wikimedia.org/wiki/File:Vietnam_-_coffee_plantation.jpg',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    },
    region: {
      title: 'Vùng cà phê Đà Lạt',
      description: 'Cầu Đất là một vùng trồng cà phê ở Đà Lạt, Lâm Đồng. Đất bazan và khí hậu mát của cao nguyên phù hợp với cà phê chè (Arabica).',
      source: {
        label: 'Tìm hiểu vùng cà phê · Sở Khoa học và Công nghệ Lâm Đồng',
        url: 'https://lamdong.gov.vn/sites/skhcn/anphamkhcn/bantinkhcndoanhnghiep/Shared%20Documents/B%E1%BA%A3n%20tin%20KHCN%20va%20DN%20so%205.2024%20web.pdf',
      },
    },
    tabLabel: 'Cách pha',
    heading: 'Pha cà phê bằng phin',
    steps: [
      {
        label: 'Chuẩn bị',
        title: 'Cho cà phê vào phin',
        description: 'Tráng phin và ly bằng nước nóng. Với phin nhỏ, thử khoảng 4 muỗng cà phê bột, lắc nhẹ cho mặt bột phẳng rồi đặt nắp gài lên.',
        photo: {
          src: 'https://www.hungryhuy.com/wp-content/uploads/scooping-coffee.jpg',
          alt: 'Dùng thìa cho cà phê xay vào phin kim loại',
          author: 'HungryHuy',
          source: 'https://www.hungryhuy.com/vietnamese-coffee-recipe-cafe-sua-da-recipe/',
          license: 'CC BY 2.0',
          licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
        },
      },
      {
        label: 'Rót nước',
        title: 'Ủ bột và châm nước',
        description: 'Rót một ít nước nóng cho bột ướt đều và nở ra. Châm tiếp nước đến gần miệng phin, đậy nắp rồi để cà phê chảy từ từ.',
        photo: {
          src: 'https://www.hungryhuy.com/wp-content/uploads/vietnamese-coffee-recipe.jpg',
          alt: 'Ấm rót nước nóng vào phin cà phê',
          author: 'HungryHuy',
          source: 'https://www.hungryhuy.com/vietnamese-coffee-recipe-cafe-sua-da-recipe/',
          license: 'CC BY 2.0',
          licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
        },
      },
      {
        label: 'Thưởng thức',
        title: 'Chờ cà phê nhỏ giọt',
        description: 'Cà phê thường mất khoảng 3–5 phút để chảy hết qua phin nhỏ. Nhấc phin ra, uống nóng hoặc thêm sữa đặc và đá.',
        photo: {
          src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fc/Vietnamese_Coffee_in_Da_Lat.jpg/960px-Vietnamese_Coffee_in_Da_Lat.jpg?utm_campaign=index&utm_content=thumbnail&utm_source=commons.wikimedia.org',
          alt: 'Hai phin cà phê được phục vụ trong cốc tại Đà Lạt',
          author: 'Frank Fox',
          source: 'https://commons.wikimedia.org/wiki/File:Vietnamese_Coffee_in_Da_Lat.jpg',
          license: 'CC BY-SA 4.0',
          licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        },
      },
    ],
    reference: {
      label: 'Hướng dẫn pha phin · HungryHuy',
      url: 'https://www.hungryhuy.com/vietnamese-coffee-recipe-cafe-sua-da-recipe/',
    },
  },
  3: {
    cover: teaHill,
    region: {
      title: 'Vùng chè Thái Nguyên',
      description: 'Tân Cương, La Bằng và Trại Cài là những vùng chè ở Thái Nguyên. Vị trà có thể khác nhau theo giống chè, vùng trồng và cách chế biến.',
      source: {
        label: 'Tìm hiểu các vùng chè · Cổng thông tin Thái Nguyên',
        url: 'https://ankhanh.thainguyen.gov.vn/di-tich-lich-su-va-du-lich/2027a210c1c715b4d843f3afe4f36014-302780',
      },
    },
    tabLabel: 'Cách chế biến',
    heading: 'Từ búp chè đến trà khô',
    steps: [
      {
        label: 'Hái búp',
        title: 'Chọn búp và lá non',
        description: 'Tùy loại trà, người hái chọn một búp non kèm một hoặc hai lá non liền kề. Búp tươi được lựa để loại lá già và phần dập trước khi sao.',
        photo: teaHill,
      },
      {
        label: 'Chế biến',
        title: 'Sao, vò và làm khô',
        description: 'Người làm chè dùng nhiệt để hạn chế oxy hóa, rồi vò lá cho cánh trà xoăn. Sau đó, chè được làm khô để giảm ẩm và dễ bảo quản.',
        photo: {
          src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a3/Drying_jakseol_green_tea_leaves.jpg/330px-Drying_jakseol_green_tea_leaves.jpg?utm_campaign=index&utm_content=thumbnail&utm_source=commons.wikimedia.org',
          alt: 'Lá trà xanh được trải mỏng trên khay trong quá trình làm khô',
          author: '예향',
          source: 'https://commons.wikimedia.org/wiki/File:Drying_jakseol_green_tea_leaves.jpg',
          license: 'CC BY 2.0 KR',
          licenseUrl: 'https://creativecommons.org/licenses/by/2.0/kr/',
        },
      },
      {
        label: 'Đóng gói',
        title: 'Đóng gói và bảo quản',
        description: 'Trà khô được để nguội rồi đóng kín để hạn chế hút ẩm và ám mùi. Sau khi mở gói, dùng muỗng khô lấy trà rồi đóng kín lại.',
        photo: {
          src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/Vietnamese_green_tea.jpg/960px-Vietnamese_green_tea.jpg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail',
          alt: 'Cánh trà móc câu Thái Nguyên đã làm khô',
          author: 'Binh Giang',
          source: 'https://commons.wikimedia.org/wiki/File:Vietnamese_green_tea.jpg',
          license: 'Phạm vi công cộng',
        },
      },
    ],
    reference: {
      label: 'Nghề làm chè · Cổng thông tin tỉnh Thái Nguyên',
      url: 'https://thainguyen.gov.vn/e-magazine/nguon-goc-lich-su-va-qua-trinh-phat-trien-cua-cay-che-thai-nguyen-301246',
    },
  },
};
