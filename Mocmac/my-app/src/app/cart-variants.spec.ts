import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CartService } from './cart.service';
import { cartProduct } from './cart-product';
import { ProductItem } from './products.service';

describe('cart variants', () => {
  beforeEach(() => {
    const stored = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => stored.set(key, value),
      removeItem: (key: string) => stored.delete(key),
      clear: () => stored.clear(),
    });
    vi.useFakeTimers();
  });
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('keeps two versions separate and changes only the chosen line', () => {
    const cart = new CartService();
    cart.add(8, 'Bộ ấm trà', 'xanh', 2);
    cart.add(8, 'Bộ ấm trà', 'trang', 1);
    cart.add(8, 'Bộ ấm trà', 'xanh', 1);
    cart.decrease(8, 'xanh');
    cart.increase(8, 'trang');
    expect(cart.lines()).toEqual([{ productId: 8, variantId: 'xanh', quantity: 2 }, { productId: 8, variantId: 'trang', quantity: 2 }]);
    const restored = new CartService();
    expect(restored.lines()).toEqual(cart.lines());
    restored.remove(8, 'xanh');
    expect(restored.lines()).toEqual([{ productId: 8, variantId: 'trang', quantity: 2 }]);
  });

  it('retains old carts and prevents quantities above 99', () => {
    localStorage.setItem('mocmac-cart', JSON.stringify([{ productId: 1, quantity: 2 }]));
    const cart = new CartService();
    cart.add(1, 'Cà phê');
    expect(cart.lines()[0].quantity).toBe(3);
    cart.add(1, 'Cà phê', undefined, 1000);
    cart.increase(1);
    expect(cart.lines()[0].quantity).toBe(99);
    cart.remove(1);
    expect(cart.lines()).toEqual([]);
  });

  it('keeps gifts separate from products with the same numeric id', () => {
    const cart = new CartService();
    cart.add(8, 'Bộ ấm trà');
    cart.add(8, 'Set quà', undefined, 2, 'gift');
    cart.increase(8, undefined, 'gift');
    expect(cart.lines()).toEqual([
      { productId: 8, quantity: 1 },
      { productId: 8, quantity: 3, itemType: 'gift' },
    ]);

    cart.remove(8, undefined, 'gift');
    expect(cart.lines()).toEqual([{ productId: 8, quantity: 1 }]);
  });

  it('uses catalog variant prices and marks removed versions unavailable', () => {
    const product = { id: 8, price: 724000, inStock: true, variants: [{ id: 'xanh', label: 'Men xanh', price: 724000, available: true, attributes: [] }, { id: 'trang', label: 'Men trắng', price: 740000, available: true, attributes: [] }] } as unknown as ProductItem;
    expect(cartProduct(product, { productId: 8, quantity: 1, variantId: 'trang' })).toMatchObject({ price: 740000, variantLabel: 'Men trắng', available: true });
    expect(cartProduct(product, { productId: 8, quantity: 1, variantId: 'removed' }).available).toBe(false);
    expect(cartProduct(product, { productId: 8, quantity: 1 }).checkoutVariantId).toBe('xanh');
  });

  it('still supports buying when local storage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined);
    const cart = new CartService();
    cart.add(8, 'Bộ ấm trà', 'xanh');
    expect(cart.count()).toBe(1);
    cart.clear();
    expect(cart.count()).toBe(0);
  });
});
