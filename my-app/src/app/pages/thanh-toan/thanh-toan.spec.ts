import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../auth.service';
import { CartService } from '../../cart.service';
import { CustomerAddress, CustomerAddressService } from '../../customer-address.service';
import { CheckoutCoupon, PaymentService } from '../../payment.service';
import { ProductItem, ProductsService } from '../../products.service';
import { ThanhToanComponent } from './thanh-toan';

describe('ThanhToanComponent', () => {
  let fixture: ComponentFixture<ThanhToanComponent>;
  let component: ThanhToanComponent;

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
          useValue: { products: signal([product]) },
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
