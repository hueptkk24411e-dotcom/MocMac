import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { isCouponEligible } from './coupon.js';
import { fold, money, readBudget } from './assistantCatalog.js';

const reply = (text, action) => ({ text, actions: action ? [action] : [] });
const page = path => ({ type: 'navigate', path });
const orderStatus = {
  pending: 'chờ xác nhận', processing: 'đang xử lý', shipped: 'đang giao',
  delivered: 'đã giao', cancelled: 'đã hủy',
};
const paymentStatus = {
  pending: 'chờ thanh toán', paid: 'đã thanh toán', failed: 'thanh toán thất bại', refunded: 'đã hoàn tiền',
};

async function orderReply(code, en) {
  if (!code) return reply(
    en ? 'Send the order code shown in your confirmation. You can also view your orders below.'
      : 'Bạn gửi mã đơn trên trang xác nhận đặt hàng nhé. Bạn cũng có thể mở mục Đơn hàng của tôi bên dưới.',
    { type: 'my_orders' },
  );
  const order = await Order.findOne({ orderId: code }).select('orderId status paymentStatus').lean();
  if (!order) return reply(en ? `I could not find order ${code}. Check the code and try again.`
    : `Mình chưa tìm thấy đơn ${code}. Bạn kiểm tra lại mã đơn nhé.`);
  return reply(en ? `Order ${order.orderId} · ${order.status} · Payment: ${order.paymentStatus}.`
    : `Đơn ${order.orderId} · ${orderStatus[order.status] || 'chưa rõ trạng thái'} · ${paymentStatus[order.paymentStatus] || 'chưa rõ thanh toán'}.`);
}

async function couponReply(question, en) {
  const now = new Date();
  const code = question.match(/\b[a-z]{2,}\d[a-z0-9-]*\b/i)?.[0].toUpperCase()
    || question.match(/\b(?:mã|code|voucher|coupon)\s+([A-Z][A-Z0-9_-]{2,})\b/u)?.[1];
  const query = code ? { code } : { active: true, expiryDate: { $gte: now } };
  const rows = await Coupon.find(query)
    .select('code active expiryDate discountType discountValue scope firstOrderOnly minOrderValue maxDiscount usageLimit usedCount')
    .sort({ expiryDate: 1 }).limit(50).lean();
  const available = rows.filter(coupon => isCouponEligible(coupon, Infinity, now)).slice(0, 4);
  if (!available.length) {
    if (code) return reply(en ? `Coupon ${code} is unavailable or expired.` : `Mã ${code} hiện không dùng được hoặc đã hết hạn.`);
    return reply(en ? 'I could not find an active coupon with uses left.' : 'Hiện mình chưa tìm thấy mã giảm giá còn hiệu lực và còn lượt sử dụng.');
  }
  const total = code ? readBudget(question)?.max : undefined;
  const lines = available.map(coupon => {
    const amount = coupon.discountType === 'percent' && coupon.scope !== 'shipping' ? `${coupon.discountValue}%` : money(coupon.discountValue);
    const discount = coupon.scope === 'shipping'
      ? coupon.discountValue > 0 ? (en ? `shipping discount ${amount}` : `giảm phí vận chuyển ${amount}`)
        : (en ? 'free shipping' : 'miễn phí vận chuyển')
      : (en ? `save ${amount}` : `giảm ${amount}`);
    const conditions = [
      coupon.minOrderValue > 0 && (en ? `minimum ${money(coupon.minOrderValue)}` : `đơn từ ${money(coupon.minOrderValue)}`),
      coupon.firstOrderOnly && (en ? 'first order only' : 'đơn đầu tiên'),
      coupon.discountType === 'percent' && coupon.scope !== 'shipping' && coupon.maxDiscount > 0 &&
        (en ? `up to ${money(coupon.maxDiscount)} off` : `giảm tối đa ${money(coupon.maxDiscount)}`),
    ].filter(Boolean);
    const line = [coupon.code, discount, ...conditions].join(' · ');
    if (total !== undefined && total < coupon.minOrderValue) {
      return `${line}\n${en ? 'Your subtotal is below the minimum.' : 'Tạm tính bạn nhập chưa đạt mức tối thiểu.'}`;
    }
    return line;
  });
  return reply([
    en ? 'Available vouchers' : 'Mã còn hiệu lực',
    ...lines.map(line => `• ${line}`),
    en ? 'Checkout checks eligibility for your cart.' : 'Bạn có thể kiểm tra điều kiện áp dụng ở bước thanh toán.',
  ].join('\n'));
}

export async function answerShopQuestion(question, lang) {
  const en = lang === 'en';
  const q = fold(question).replace(/[^a-z0-9]+/g, ' ').trim();
  const code = q.match(/\bmoc\d{12}[a-z0-9]{0,4}\b/)?.[0].toUpperCase();
  if (code || /\b(tra cuu don|theo doi don|ma don|trang thai don|track (?:my |an )?order|order status|order code)\b/.test(q)) {
    return orderReply(code, en);
  }
  if (/\b(don hang cua toi|xem don hang|don cua minh|my orders)\b/.test(q)) {
    return reply(en ? 'You can sign in to view your orders here.' : 'Bạn đăng nhập để xem các đơn đã đặt nhé.', { type: 'my_orders' });
  }
  if (/\b(ma giam gia|ma uu dai|ma khuyen mai|khuyen mai nao|coupon|voucher|promo code|discount code)\b/.test(q)) {
    return couponReply(question, en);
  }
  if (/\b(doi tra|tra hang|hoan tien|return policy|return an item|refund)\b/.test(q)) {
    return reply(en ? 'Check the return conditions and steps in the store’s return policy.'
      : 'Bạn xem điều kiện, thời hạn và cách gửi yêu cầu trong chính sách đổi trả nhé.', page('/chinh-sach-doi-tra'));
  }
  if (/\b(phi ship|phi van chuyen|giao hang|van chuyen|shipping|delivery)\b/.test(q)) {
    return reply(en ? 'See the shipping policy for delivery estimates. Checkout shows the fee for your delivery address.'
      : 'Bạn xem thời gian giao dự kiến trong chính sách vận chuyển. Phí giao hàng theo địa chỉ sẽ hiện khi thanh toán.', page('/chinh-sach-van-chuyen'));
  }
  if (/\b(cod|vnpay|phuong thuc thanh toan|thanh toan the nao|payment|checkout)\b/.test(q)) {
    return reply(en ? 'Choose cash on delivery (COD) or VNPAY in test mode at checkout.'
      : 'Khi đặt hàng, bạn có thể chọn thanh toán lúc nhận hàng (COD) hoặc VNPAY ở chế độ thử nghiệm.', page('/ho-tro-thanh-toan'));
  }
  if (/\b(mo gio|xem gio|open (?:my |the )?cart)\b/.test(q) || /^(gio hang cua toi|my cart)$/.test(q)) {
    return reply(en ? 'You can review your cart here.' : 'Bạn xem các món đã thêm ở đây nhé.', { type: 'open_cart' });
  }
  if (/\b(cach (?:dat hang|mua hang|them .+ gio)|dat hang the nao|how (?:do i|to) (?:order|add))\b/.test(q)) {
    return reply(en ? 'Open a product, choose its options and quantity, then add it to your cart and go to checkout.'
      : 'Bạn mở sản phẩm, chọn quy cách và số lượng, thêm vào giỏ rồi sang bước thanh toán.', page('/huong-dan-mua-hang'));
  }
  if (/\b(lien he|nhan vien|quan tri vien|huy don|contact support|talk to someone|cancel (?:my |an )?order)\b/.test(q)) {
    return reply(en ? 'Use the Support tab to message our team or open the Contact page.'
      : 'Bạn có thể nhắn cho Mộc Mạc qua tab Hỗ trợ hoặc mở trang Liên hệ.', { type: 'contact_support' });
  }
  if (/\b(moc mac la (?:gi|cua hang gi)|moc mac ban (?:gi|nhung (?:gi|mat hang nao))|what (?:is|does) moc mac)\b/.test(q)) {
    return reply(en ? 'Moc Mac sells Vietnamese specialties, coffee, tea and handicrafts such as pottery and woven bamboo.'
      : 'Mộc Mạc bán đặc sản Việt Nam, cà phê, trà và đồ thủ công như gốm và mây tre đan.', page('/san-pham'));
  }
  if (/^(?:xin chao|chao|hi|hello)(?: (?:ban|shop|moc mac|there))?$/.test(q)) {
    return reply(en ? 'Hi! Tell me what you are shopping for and your budget.'
      : 'Chào bạn! Bạn đang tìm món gì? Cho mình biết nhu cầu và khoảng giá nhé.');
  }
  if (/^(?:cam on|thanks|thank you)(?: (?:ban|shop|nhe|nhieu|you))?$/.test(q)) {
    return reply(en ? 'You’re welcome!' : 'Rất vui được giúp bạn!');
  }
  return null;
}
