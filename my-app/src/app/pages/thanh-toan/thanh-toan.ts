import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth.service';
import { CartService } from '../../cart.service';
import { CustomerAddress, CustomerAddressService } from '../../customer-address.service';
import { CheckoutCoupon, PaymentService } from '../../payment.service';
import { ProductItem, ProductsService } from '../../products.service';

interface CheckoutItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
}

const FREE_SHIPPING_THRESHOLD = 500000;
const SHIPPING_FEE = 30000;

@Component({
  selector: 'app-thanh-toan',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './thanh-toan.html',
  styleUrl: './thanh-toan.scss',
})
export class ThanhToanComponent {
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly catalog = inject(ProductsService);
  private readonly addressesService = inject(CustomerAddressService);
  private readonly paymentService = inject(PaymentService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly authenticated = this.auth.isAuthenticated;
  readonly items = computed(() => {
    const products = new Map<number, ProductItem>(
      this.catalog.products().map(product => [product.id, product])
    );
    return this.cart.lines().flatMap(line => {
      const product = products.get(line.productId);
      return product
        ? [{
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: line.quantity,
            imageUrl: product.images?.find(Boolean) ?? null,
          }]
        : [];
    });
  });
  readonly subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  readonly shipping = computed(() => {
    const subtotal = this.subtotal();
    return subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  });
  readonly selectedCoupon = signal<CheckoutCoupon | null>(null);
  readonly orderDiscount = computed(() =>
    this.selectedCoupon()?.scope === 'order' ? this.selectedCoupon()?.discountAmount ?? 0 : 0
  );
  readonly shippingDiscount = computed(() =>
    this.selectedCoupon()?.scope === 'shipping' ? this.selectedCoupon()?.discountAmount ?? 0 : 0
  );
  readonly total = computed(() =>
    Math.max(0, this.subtotal() - this.orderDiscount() + this.shipping() - this.shippingDiscount())
  );
  readonly addresses = signal<CustomerAddress[]>([]);
  readonly selectedAddressId = signal<string | null>(null);
  readonly addressesLoading = signal(false);
  readonly addingAddress = signal(false);
  readonly savingAddress = signal(false);
  readonly customerName = signal('');
  readonly customerPhone = signal('');
  readonly customerAddress = signal('');
  readonly orderNote = signal('');
  readonly availableCoupons = signal<CheckoutCoupon[]>([]);
  readonly couponsLoading = signal(false);
  readonly paymentMethod = signal<'cod' | 'vnpay'>('cod');
  readonly paying = signal(false);
  readonly error = signal('');
  readonly status = signal<'success' | 'fail' | 'error' | null>(null);
  private couponRequestId = 0;

  constructor() {
    const paymentStatus = this.route.snapshot.queryParamMap.get('status');
    if (paymentStatus === 'success' || paymentStatus === 'fail' || paymentStatus === 'error') {
      this.status.set(paymentStatus);
      if (paymentStatus === 'success') this.cart.clear();
    }

    if (this.authenticated()) {
      this.loadAddresses();
      this.loadCoupons();
    }
  }

  loadAddresses(): void {
    this.addressesLoading.set(true);
    this.addressesService.getMyAddresses().subscribe({
      next: response => {
        this.addresses.set(response.addresses ?? []);
        const selected =
          response.addresses?.find(address => address.isDefault) ?? response.addresses?.[0];
        if (selected) {
          this.selectAddress(selected);
        } else {
          this.customerName.set(response.profile?.name ?? this.auth.user()?.name ?? '');
          this.addingAddress.set(true);
        }
        this.addressesLoading.set(false);
      },
      error: error => {
        this.error.set(error?.error?.message || 'Không thể tải sổ địa chỉ.');
        this.addressesLoading.set(false);
      },
    });
  }

  loadCoupons(): void {
    const requestId = ++this.couponRequestId;
    this.couponsLoading.set(true);
    this.paymentService.getAvailableCoupons(this.subtotal(), this.shipping()).subscribe({
      next: response => {
        if (requestId !== this.couponRequestId) return;
        this.availableCoupons.set(response.coupons);
        const selected = response.coupons.find(
          coupon => coupon.code === this.selectedCoupon()?.code && coupon.eligible
        );
        this.selectedCoupon.set(selected ?? null);
        this.couponsLoading.set(false);
      },
      error: error => {
        if (requestId !== this.couponRequestId) return;
        this.availableCoupons.set([]);
        this.selectedCoupon.set(null);
        this.error.set(error?.error?.message || 'Không thể tải voucher. Vui lòng thử lại.');
        this.couponsLoading.set(false);
      },
    });
  }

  selectCoupon(coupon: CheckoutCoupon): void {
    if (!coupon.eligible) return;
    this.selectedCoupon.update(current => current?.code === coupon.code ? null : coupon);
    this.error.set('');
  }

  selectAddress(address: CustomerAddress): void {
    this.selectedAddressId.set(address._id ?? null);
    this.customerName.set(address.name);
    this.customerPhone.set(address.phone);
    this.customerAddress.set(address.address);
    this.addingAddress.set(false);
    this.error.set('');
  }

  addAddress(): void {
    if (this.addresses().length >= 10) return;
    this.customerName.set(this.auth.user()?.name ?? '');
    this.customerPhone.set('');
    this.customerAddress.set('');
    this.selectedAddressId.set(null);
    this.addingAddress.set(true);
  }

  cancelAddAddress(): void {
    const selected =
      this.addresses().find(address => address._id === this.selectedAddressId()) ??
      this.addresses().find(address => address.isDefault) ??
      this.addresses()[0];
    if (selected) this.selectAddress(selected);
    else this.addingAddress.set(false);
  }

  saveAddress(): void {
    const name = this.customerName().trim();
    const phone = this.customerPhone().trim();
    const address = this.customerAddress().trim();
    if (!name || !phone || !address) {
      this.error.set('Vui lòng nhập họ tên, số điện thoại và địa chỉ nhận hàng.');
      return;
    }
    if (this.addresses().length >= 10 && !this.selectedAddressId()) {
      this.error.set('Bạn đã lưu tối đa 10 địa chỉ.');
      return;
    }

    const addresses: CustomerAddress[] = this.addresses()
      .filter(item => item._id !== this.selectedAddressId())
      .map(item => ({ ...item, isDefault: false }));
    addresses.push({
      ...(this.selectedAddressId() ? { _id: this.selectedAddressId()! } : {}),
      label: this.addresses().length ? 'Địa chỉ mới' : 'Nhà',
      name,
      phone,
      address,
      isDefault: true,
    });

    this.savingAddress.set(true);
    this.addressesService.saveMyAddresses(addresses).subscribe({
      next: response => {
        this.addresses.set(response.addresses);
        const saved = response.addresses.find(item => item.isDefault);
        if (saved) this.selectAddress(saved);
        this.savingAddress.set(false);
      },
      error: error => {
        this.error.set(error?.error?.message || 'Không thể lưu địa chỉ nhận hàng.');
        this.savingAddress.set(false);
      },
    });
  }

  goToLogin(): void {
    void this.router.navigate(['/dang-nhap'], {
      queryParams: { returnUrl: '/thanh-toan' },
    });
  }

  checkout(): void {
    if (!this.authenticated()) {
      this.goToLogin();
      return;
    }
    if (!this.items().length) {
      this.error.set('Giỏ hàng đang trống.');
      return;
    }
    const selectedAddress = this.addresses().find(
      address => address._id === this.selectedAddressId()
    );
    if (!selectedAddress || this.addingAddress()) {
      this.error.set('Vui lòng lưu và chọn địa chỉ nhận hàng.');
      return;
    }

    this.paying.set(true);
    this.error.set('');
    const selectedCoupon = this.selectedCoupon();
    const items = this.items().map(item => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));
    const customerInfo = {
      name: selectedAddress.name,
      phone: selectedAddress.phone,
      address: selectedAddress.address,
    };
    const savedAddresses = this.addresses().map(address => ({
      ...address,
      isDefault: address._id === selectedAddress._id,
    }));

    this.addressesService.saveMyAddresses(savedAddresses).subscribe({
      next: () => {
        this.paymentService.checkout({
          items,
          subtotal: this.subtotal(),
          discount: this.orderDiscount(),
          shipping: this.shipping(),
          total: this.total(),
          paymentMethod: this.paymentMethod(),
          couponCode: selectedCoupon?.code ?? '',
          customerInfo,
          note: this.orderNote().trim(),
        }).subscribe({
          next: response => {
            if (response.payUrl) {
              window.location.assign(response.payUrl);
              return;
            }
            this.cart.clear();
            this.status.set('success');
            this.paying.set(false);
          },
          error: error => {
            this.error.set(error?.error?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
            this.paying.set(false);
            this.loadCoupons();
          },
        });
      },
      error: error => {
        this.error.set(error?.error?.message || 'Không thể lưu địa chỉ nhận hàng.');
        this.paying.set(false);
      },
    });
  }

  vnd(value: number): string {
    return value.toLocaleString('vi-VN') + 'đ';
  }
}
