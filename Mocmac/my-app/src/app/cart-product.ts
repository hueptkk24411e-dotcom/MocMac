import { CartLine, cartLineKey } from './cart.service';
import { ProductItem } from './products.service';

export function cartProduct(product: ProductItem, line: CartLine) {
  const variants = product.variants ?? [];
  const variant = line.variantId
    ? variants.find(item => item.id === line.variantId)
    : variants.find(item => item.available) ?? variants[0];
  return {
    key: cartLineKey(line),
    variantId: line.variantId,
    checkoutVariantId: variant?.id,
    variantLabel: variant?.label ?? (line.variantId ? 'Phiên bản không còn bán' : ''),
    price: variant?.price ?? product.price,
    imageUrl: variant?.image || product.images?.find(Boolean) || null,
    available: (product.inStock || product.preorder) && (!variants.length && !line.variantId || !!variant?.available),
  };
}
