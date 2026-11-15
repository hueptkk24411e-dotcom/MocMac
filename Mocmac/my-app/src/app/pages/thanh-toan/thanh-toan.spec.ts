import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../auth.service';
import { CartService } from '../../cart.service';
import { CustomerAddress, CustomerAddressService } from '../../customer-address.service';
import { CheckoutCoupon, PaymentService } from '../../payment.service';
import { ProductItem, ProductsService } from '../../products.service';
import { GiftJson, GiftService } from '../gift-page/gift.service';
import { ThanhToanComponent } from './thanh-toan';
import { vi } from 'vitest';

describe('ThanhToanComponent', () => {
  let fixture: ComponentFixture<ThanhToanComponent>;
  let component: ThanhToanComponent;
  const catalogProducts = signal<ProductItem[]>([]);

  const product: ProductItem = {
    id: 8,
    slug: 'test',
    name: 'Test product',
    cat: 'Test',
    type: 'Test',
    region: 'Test',
    province: 'Test',
    village: '',
    price: 100000,
    rate: 5,
    reviews: 0,
    ocop: 0,
    heritage: null,
    seasons: [],
    occasion: [],
    inStock: true,
    preorder: false,
    icon: '',
    badges: [],
    images: [],
  };
  const gift: GiftJson = {
    id: 8,
    name: 'Set quà',
    price: 150000,
    inStock: true,
    images: ['https://example.com/gift.jpg'],
  };
  const address: CustomerAddress = {
    _id: 'address-1',
    label: 'Nhà',
    name: 'Test customer',
    phone: '0900000000',
    address: 'Test address',
    isDefault: true,
  };
  const coupons: CheckoutCoupon[] = [
    {
      _id: 'new20',
      code: 'NEW20',
      description: 'Giảm 20% đơn đầu',
      discountType: 'percent',
      discountValue: 20,
      scope: 'order',
      firstOrderOnly: true,
      minOrderValue: 0,
      maxDiscount: 0,
      expiryDate: '2027-11-10',
      eligible: true,
      unavailableReason: '',
      discountAmount: 20000,
    },
    {
      _id: 'freeship',
      code: 'FREESHIP',
      description: 'Miễn phí vận chuyển',
      discountType: 'fixed',
      discountValue: 30000,
      scope: 'shipping',
      firstOrderOnly: false,
      minOrderValue: 0,
      maxDiscount: 0,
      expiryDate: '2027-11-10',
      eligible: true,
      unavailableReason: '',
      discountAmount: 30000,
    },
  ];

  beforeEach(async () => {
    catalogProducts.set([product]);
    await TestBed.configureTestingModule({
      imports: [ThanhToanComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => true, user: () => ({ name: 'Test customer' }) },
        },
        {
          provide: ProductsService,
          useValue: { products: catalogProducts },
        },
        {
          provide: GiftService,
          useValue: { getGifts: () => of([gift]) },
        },
        {
          provide: CustomerAddressService,
          useValue: {
            getMyAddresses: () =>
              of({
                success: true,
                profile: { name: 'Test customer', phone: address.phone },
                addresses: [address],
              }),
            saveMyAddresses: (addresses: CustomerAddress[]) =>
              of({
                success: true,
                profile: { name: 'Test customer', phone: address.phone },
                addresses: addresses.map((item, index) => ({
                  ...item,
                  _id: item._id ?? `saved-${index}`,
                })),
              }),
          },
        },
        {
          provide: PaymentService,
          useValue: {
            getAvailableCoupons: () => of({ success: true, coupons }),
            checkout: () =>
              of({ success: true, message: 'ok', order: {}, payment: {} }),
          },
        },
      ],
    }).compileComponents();

    const cart = TestBed.inject(CartService);
    cart.clear();
    cart.add(product.id, product.name);
    fixture = TestBed.createComponent(ThanhToanComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => TestBed.inject(CartService).clear());

  it('sends both selected versions and their prices to checkout separately', () => {
    catalogProducts.set([{ ...product, variants: [
      { id: 'xanh', label: 'Xanh', price: 100000, available: true, attributes: [{ name: 'Màu sắc', value: 'Xanh' }] },
      { id: 'hong', label: 'Hồng', price: 120000, available: true, attributes: [{ name: 'Màu sắc', value: 'Hồng' }] },
    ] }]);
    const cart = TestBed.inject(CartService);
    cart.clear();
    cart.add(product.id, product.name, 'xanh', 2);
    cart.add(product.id, product.name, 'hong', 1);
    const checkout = vi.spyOn(TestBed.inject(PaymentService), 'checkout');
    component.checkout();
    expect(checkout).toHaveBeenCalledOnce();
    expect(checkout.mock.calls[0][0]).toMatchObject({ subtotal: 320000, items: [
      { productId: 8, variantId: 'xanh', variantLabel: 'Xanh', quantity: 2, price: 100000 },
      { productId: 8, variantId: 'hong', variantLabel: 'Hồng', quantity: 1, price: 120000 },
    ] });
  });

  it('checks out a gift separately from a product with the same id', () => {
    const cart = TestBed.inject(CartService);
    cart.clear();
    cart.add(gift.id, gift.name, undefined, 2, 'gift');
    const checkout = vi.spyOn(TestBed.inject(PaymentService), 'checkout');

    expect(component.subtotal()).toBe(300000);
    component.checkout();

    expect(checkout.mock.calls[0][0].items).toEqual([
      {
        productId: gift.id,
        itemType: 'gift',
        variantId: undefined,
        variantLabel: '',
        name: gift.name,
        price: gift.price,
        quantity: 2,
      },
    ]);
  });

  it('includes shipping as a separate line in the checkout total', () => {
    expect(component.subtotal()).toBe(100000);
    expect(component.shipping()).toBe(30000);
    expect(component.total()).toBe(130000);
  });

  it('applies either the first-order discount or the shipping voucher', () => {
    component.selectCoupon(coupons[0]);
    expect(component.orderDiscount()).toBe(20000);
    expect(component.shippingDiscount()).toBe(0);
    expect(component.total()).toBe(110000);

    component.selectCoupon(coupons[1]);
    expect(component.orderDiscount()).toBe(0);
    expect(component.shippingDiscount()).toBe(30000);
    expect(component.total()).toBe(100000);
  });

  it('loads the saved address for the checkout', () => {
    expect(component.selectedAddressId()).toBe(address._id);
    expect(component.customerAddress()).toBe(address.address);
  });

  it('adds a new address without replacing the existing saved address', () => {
    component.addAddress();
    component.customerName.set('Another customer');
    component.customerPhone.set('0911111111');
    component.customerAddress.set('Another test address');

    component.saveAddress();

    expect(component.addresses()).toHaveLength(2);
    expect(component.addresses().find(item => item.address === address.address)).toBeTruthy();
    expect(component.addresses().find(item => item.isDefault)?.address).toBe('Another test address');
  });
});
