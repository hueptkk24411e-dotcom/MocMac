export const normalize = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const money = value => {
  const text = normalize(value).replace(/\s/g, '');
  const match = text.match(/^(\d+(?:[.,]\d+)*)\s*(trieu|tr|nghin|ngan|k|d|dong)?$/);
  if (!match) return null;
  const unit = match[2] || '';
  const raw = match[1];
  const number = Number(/^(?:\d{1,3})(?:[.,]\d{3})+$/.test(raw) ? raw.replace(/[.,]/g, '') : raw.replace(',', '.'));
  return Math.round(number * (/^(trieu|tr)$/.test(unit) ? 1e6 : /^(nghin|ngan|k)$/.test(unit) ? 1000 : 1));
};
export function constraints(message) {
  const text = normalize(message);
  const amount = '(\\d+(?:[.,]\\d+)*\\s*(?:trieu|tr|nghin|ngan|k|dong|d)?)';
  const range = text.match(new RegExp('(?:tu\\s+)?' + amount + '\\s*(?:den|toi|[-–])\\s*' + amount));
  let min = null, max = null;
  if (range) {
    const suffix = range[2].match(/(trieu|tr|nghin|ngan|k|dong|d)\s*$/)?.[1] || '';
    min = money(range[1] + (/\d\s*$/.test(range[1]) ? suffix : ''));
    max = money(range[2]);
  } else {
    const below = text.match(new RegExp('(?:duoi|toi da|khong qua|ngan sach|tam|khoang)\\s*' + amount));
    const above = text.match(new RegExp('(?:tren|it nhat|toi thieu)\\s*' + amount));
    if (below) max = money(below[1]);
    if (above) min = money(above[1]);
  }
  return { min: Number.isFinite(min) ? min : null, max: Number.isFinite(max) ? max : null };
}
const aliases = [
  ['may tre dan', ['may tre', 'gio tre', 'ro may', 'tui may', 'tui coi', 'tui tre']],
  ['gom', ['gom', 'bat trang', 'am tra', 'binh hoa', 'ly su', 'chen su']],
  ['ca phe', ['ca phe', 'cafe', 'coffee']], ['tra', ['tra', 'tea']],
  ['tho cam', ['tho cam', 'khan det']], ['son mai', ['son mai']],
  ['dac san kho', ['dac san', 'do an', 'banh', 'mut', 'chuoi say']]
];
const contains = (text, term) => new RegExp('(?:^|[^a-z0-9])' + term + '(?:$|[^a-z0-9])').test(text);
export function rankProducts(products, query, limit = 4, budget = constraints(query), requireMatch = false) {
  const text = normalize(query);
  const requestedTypes = aliases.filter(([, terms]) => terms.some(term => contains(text, term))).map(([type]) => type);
  const occasion = ['qua tet', 'qua cuoi', 'qua tan gia', 'qua bieu doi tac'].filter(term => contains(text, term));
  const regions = ['mien bac', 'mien trung', 'tay nguyen', 'mien nam'].filter(term => contains(text, term));
  const stop = new Set('toi muon can tim mua mot san pham qua tang duoi tren khoang tam cho voi giup ngan sach trieu nghin ngan dong'.split(' '));
  const terms = [...new Set(text.split(/[^a-z0-9]+/).filter(t => t.length > 1 && !stop.has(t) && !/^\d+$/.test(t)))];
  return products.filter(p => (p.inStock || p.preorder) && Number.isFinite(Number(p.price)) && (budget.min == null || p.price >= budget.min) && (budget.max == null || p.price <= budget.max))
    .map(p => {
      const type = normalize(p.type);
      const haystack = normalize([p.name, p.type, p.cat, p.province, p.village, ...(Array.isArray(p.occasion) ? p.occasion : [p.occasion])].join(' '));
      const typeMatch = !requestedTypes.length || requestedTypes.includes(type);
      const regionMatch = !regions.length || regions.includes(normalize(p.region));
      const occasions = normalize(Array.isArray(p.occasion) ? p.occasion.join(' ') : p.occasion);
      const occasionMatch = !occasion.length || occasion.some(t => occasions.includes(t));
      const score = terms.reduce((n,t) => n + (contains(haystack,t) ? 1 : 0), 0) + (requestedTypes.includes(type) ? 10 : 0) + (occasion.length && occasionMatch ? 5 : 0);
      return { product:p, score, typeMatch, regionMatch, occasionMatch };
    }).filter(row => row.typeMatch && row.regionMatch && row.occasionMatch && (!requireMatch || row.score > 0))
    .sort((a,b) => b.score - a.score || Number(b.product.inStock) - Number(a.product.inStock) || a.product.price - b.product.price)
    .slice(0,limit).map(row => row.product);
}
export const publicProduct = p => ({ id:Number(p.id), name:String(p.name), price:Number(p.price), type:p.type || '', province:p.province || '', image:Array.isArray(p.images) ? p.images.find(u => typeof u === 'string' && /^https?:\/\//.test(u) || typeof u === 'string' && u.startsWith('/data/')) || '' : '', inStock:Boolean(p.inStock), preorder:Boolean(p.preorder) });
export const supportLinks = [
  { label:'Vận chuyển', path:'/chinh-sach-van-chuyen' },
  { label:'Đổi trả', path:'/chinh-sach-doi-tra' },
  { label:'Thanh toán', path:'/ho-tro-thanh-toan' },
  { label:'Liên hệ CSKH', path:'/lien-he' }
];
export function faqAnswer(message) {
  const text = normalize(message);
  if (/(don hang|ma don|tra cuu|huy don|hoan tien)/.test(text)) return 'Mình chưa có kết nối tra cứu hoặc chỉnh sửa đơn hàng. Bạn vui lòng liên hệ CSKH kèm mã đơn để được kiểm tra; không gửi mật khẩu hay thông tin thanh toán trong chat.';
  if (/(doi tra|doi hang|tra hang|hu hong|bi loi)/.test(text)) return 'Cửa hàng tiếp nhận hỗ trợ khi sản phẩm bị hư hỏng, lỗi, giao sai hoặc thiếu hàng. Bạn giữ lại hình ảnh sản phẩm, bao bì và liên hệ CSKH để xác nhận điều kiện xử lý. Xem chi tiết tại Chính sách đổi trả bên dưới.';
  if (/(giao hang|van chuyen|phi ship|ship|bao lau|mien phi)/.test(text)) return 'Mộc Mạc giao hàng toàn quốc. Thời gian giao phụ thuộc khu vực; chi phí được hiển thị ở giỏ hàng trước khi đặt. Với sản phẩm đặt trước, bạn nên liên hệ cửa hàng để xác nhận thời gian chuẩn bị.';
  if (/(thanh toan|cod|chuyen khoan)/.test(text)) return 'Bạn có thể xem lựa chọn thanh toán khi nhận hàng (COD) trong hướng dẫn thanh toán. Thanh toán trực tuyến ở dự án hiện tại là mô phỏng, chưa phải cổng thanh toán thật. Liên hệ CSKH nếu cần xác nhận cách thanh toán.';
  if (/(nhan vien|nguoi that|hotline|lien he|tu van vien)/.test(text)) return 'Bạn chọn “Liên hệ CSKH” để mở trang liên hệ của cửa hàng. Chat này trả lời tự động, chưa chuyển cuộc trò chuyện trực tiếp sang nhân viên.';
  if (/^(chao|xin chao|hello|hi|cam on)[!.\s]*$/.test(text)) return 'Chào bạn! Mình có thể giải đáp về giao hàng, đổi trả hoặc tìm sản phẩm theo loại, dịp tặng và ngân sách. Bạn đang cần món gì?';
  return null;
}
export function validateImage(data) {
  if (typeof data !== 'string') throw Object.assign(new Error('Vui lòng chọn ảnh JPEG, PNG hoặc WebP.'), { status:400 });
  const match = data.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match || match[2].length % 4 !== 0) throw Object.assign(new Error('Định dạng ảnh không hợp lệ. Chỉ nhận JPEG, PNG, WebP.'), { status:400 });
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 5 * 1024 * 1024) throw Object.assign(new Error('Ảnh phải nhỏ hơn hoặc bằng 5 MB.'), { status:413 });
  const valid = match[1] === 'jpeg' ? bytes.length > 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : match[1] === 'png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : bytes.length >= 12 && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP';
  if (!valid) throw Object.assign(new Error('Nội dung tệp không khớp định dạng ảnh.'), { status:400 });
  return data;
}
