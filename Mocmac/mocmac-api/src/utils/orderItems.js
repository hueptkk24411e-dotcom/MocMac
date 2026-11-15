import { Product } from '../models/Product.js';

function invalid(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

export function priceOrderItems(requested, products) {
  if (!Array.isArray(requested) || !requested.length || requested.length > 100) invalid('Danh sách sản phẩm không hợp lệ.');
  const catalog = new Map(products.map(product => [product.id, product]));
  const items = requested.map(line => {
    const product = catalog.get(Number(line?.productId));
    if (!product) invalid('Sản phẩm không còn trong danh mục.');
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) invalid('Số lượng phải từ 1 đến 99.');
    if (product.inStock === false && !product.preorder) invalid(`${product.name} tạm hết hàng.`);
    const variants = product.variants ?? [];
    const variant = line.variantId ? variants.find(item => item.id === line.variantId) : null;
    if (variants.length && !variant) invalid(`Vui lòng chọn lại phiên bản cho ${product.name}.`);
    if (line.variantId && !variant) invalid('Phiên bản sản phẩm không còn tồn tại.');
    if (variant?.available === false) invalid('Phiên bản đã chọn tạm hết hàng.');
    const price = variant?.price ?? product.price;
    if (!Number.isFinite(price) || price < 0) invalid('Giá sản phẩm chưa hợp lệ.');
    const attributes = (variant?.attributes ?? []).map(({ name, value }) => ({ name, value }));
    return {
      productId: product.id, name: product.name, quantity: line.quantity, price,
      variantId: variant?.id ?? '', variantLabel: variant?.label ?? '', attributes,
    };
  });
  return { items, subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0) };
}

export async function resolveOrderItems(requested) {
  if (!Array.isArray(requested) || !requested.length) invalid('Đơn hàng phải có ít nhất một sản phẩm.');
  const ids = requested.map(line => Number(line?.productId));
  if (ids.some(id => !Number.isSafeInteger(id) || id <= 0)) invalid('Mã sản phẩm không hợp lệ.');
  const products = await Product.find({ id: { $in: ids } }).lean();
  return priceOrderItems(requested, products);
}
