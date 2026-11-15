import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth.service';
import { CartItemType, CartLine, CartService } from '../../cart.service';
import { cartProduct } from '../../cart-product';
import { CustomerAddress, CustomerAddressService } from '../../customer-address.service';
import { CheckoutCoupon, PaymentService } from '../../payment.service';
import { ProductItem, ProductsService } from '../../products.service';
import { HttpClient } from '@angular/common/http';
import { GiftJson, GiftService } from '../gift-page/gift.service';

interface CheckoutItem {
  id: number;
  key: string;
  itemType: CartItemType;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  available: boolean;
  variantLabel: string;
  checkoutVariantId?: string;
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
  private readonly giftService = inject(GiftService);
  private readonly addressesService = inject(CustomerAddressService);
  private readonly paymentService = inject(PaymentService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly authenticated = this.auth.isAuthenticated;
  readonly gifts = signal<GiftJson[]>([]);
  readonly giftsLoading = signal(true);
  readonly giftsError = signal('');
  readonly giftLineCount = computed(() => this.cart.lines().filter(line => line.itemType === 'gift').length);
  readonly items = computed(() => {
    const products = new Map<number, ProductItem>(
      this.catalog.products().map(product => [product.id, product])
    );
    const gifts = new Map(this.gifts().map(gift => [gift.id, gift]));
    return this.cart.lines().flatMap(line => {
      if (line.itemType === 'gift') {
        const gift = gifts.get(line.productId);
        return [gift ? checkoutGiftItem(gift, line) : unavailableCheckoutGift(line)];
      }
      const product = products.get(line.productId);
      return product
        ? [{
            ...cartProduct(product, line),
            id: product.id,
            itemType: 'product' as const,
            name: product.name,
            quantity: line.quantity,
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
  readonly customerProvince = signal<number | null>(null);
  readonly customerDistrict = signal<number | null>(null);
  readonly provinces = signal<{ code: number; name: string; division_type: string }[]>([]);
  readonly districts = signal<{ code: number; name: string; division_type: string; province_code: number }[]>([]);
  readonly orderNote = signal('');
  readonly availableCoupons = signal<CheckoutCoupon[]>([]);
  readonly couponsLoading = signal(false);
  readonly paymentMethod = signal<'cod' | 'vnpay'>('cod');
  readonly paying = signal(false);
  readonly error = signal('');
  readonly status = signal<'success' | 'fail' | 'error' | null>(null);
  private couponRequestId = 0;
  private couponReloaded = false;

  constructor() {
    this.giftService.getGifts().subscribe({
      next: gifts => {
        this.gifts.set(gifts);
        this.giftsLoading.set(false);
      },
      error: () => {
        this.giftsError.set('Không thể tải thông tin quà tặng trong giỏ. Vui lòng thử lại.');
        this.giftsLoading.set(false);
      },
    });

    const paymentStatus = this.route.snapshot.queryParamMap.get('status');
    if (paymentStatus === 'success' || paymentStatus === 'fail' || paymentStatus === 'error') {
      this.status.set(paymentStatus);
      if (paymentStatus === 'success') this.cart.clear();
    }

    if (this.authenticated()) {
      this.loadAddresses();
      this.loadCoupons();
      this.loadProvinces();
    }

    // Reload available coupons whenever cart subtotal changes
    effect(() => {
      this.subtotal();
      if (this.authenticated() && this.couponReloaded) {
        this.loadCoupons();
      }
      this.couponReloaded = true;
    });
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

  loadProvinces(): void {
    this.http.get<{ code: number; name: string; division_type: string }[]>(
      '/api/provinces'
    ).subscribe({
      next: provinces => {
        provinces.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
        this.provinces.set(provinces);
      },
      error: () => this.provinces.set([]),
    });
  }

  onProvinceChange(): void {
    const code = this.customerProvince();
    if (!code) {
      this.districts.set([]);
      this.customerDistrict.set(null);
      return;
    }
    this.http.get<{ code: number; name: string; division_type: string; province_code: number }[]>(
      `/api/districts?province=${code}`
    ).subscribe({
      next: districts => {
        districts.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
        this.districts.set(districts);
        this.customerDistrict.set(null);
      },
      error: () => this.districts.set([]),
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
    this.customerProvince.set(address.province ?? null);
    this.customerDistrict.set(address.district ?? null);
    this.addingAddress.set(false);
    this.error.set('');
  }

  addAddress(): void {
    if (this.addresses().length >= 10) return;
    this.customerName.set(this.auth.user()?.name ?? '');
    this.customerPhone.set('');
    this.customerAddress.set('');
    this.customerProvince.set(null);
    this.customerDistrict.set(null);
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
    const province = this.customerProvince();
    const district = this.customerDistrict();
    if (!name || !phone || !address || !province || !district) {
      this.error.set('Vui lòng nhập đầy đủ họ tên, số điện thoại, tỉnh/thành phố, quận/huyện và địa chỉ chi tiết.');
      return;
    }
    if (this.addresses().length >= 10 && !this.selectedAddressId()) {
      this.error.set('Bạn đã lưu tối đa 10 địa chỉ.');
      return;
    }

    const provinceName = this.provinces().find(p => p.code === province)?.name || '';
    const districtName = this.districts().find(d => d.code === district)?.name || '';
    const parts = [address];
    if (districtName) parts.push(districtName);
    if (provinceName) parts.push(provinceName);
    const fullAddress = parts.join(', ');

    const addresses: CustomerAddress[] = this.addresses()
      .filter(item => item._id !== this.selectedAddressId())
      .map(item => ({ ...item, isDefault: false }));
    addresses.push({
      ...(this.selectedAddressId() ? { _id: this.selectedAddressId()! } : {}),
      label: this.addresses().length ? 'Địa chỉ mới' : 'Nhà',
      name,
      phone,
      address: fullAddress,
      province,
      district,
      isDefault: true,
    });

    this.persistAddresses(addresses);
  }

  private persistAddresses(addresses: CustomerAddress[]): void {
    this.savingAddress.set(true);
    this.addressesService.saveMyAddresses(addresses).subscribe({
      next: response => {
        this.addresses.set(response.addresses);
        const saved = response.addresses.find(item => item.isDefault);
        if (saved) this.selectAddress(saved);
        else if (response.addresses.length) this.selectAddress(response.addresses[0]);
        this.savingAddress.set(false);
      },
      error: error => {
        this.error.set(error?.error?.message || 'Không thể cập nhật địa chỉ.');
        this.savingAddress.set(false);
      },
    });
  }

  deleteAddress(address: CustomerAddress): void {
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    const updated = this.addresses().filter(item => item._id !== address._id);

    if (updated.length === 0) {
      this.addresses.set([]);
      this.selectedAddressId.set(null);
      this.addingAddress.set(true);
      this.customerName.set(this.auth.user()?.name ?? '');
      this.customerPhone.set('');
      this.customerAddress.set('');
      this.customerProvince.set(null);
      this.customerDistrict.set(null);
      this.districts.set([]);
      this.error.set('');
      this.persistAddresses([]);
      return;
    }

    let hasDefault = updated.some(item => item.isDefault);
    const normalized = updated.map(item => ({ ...item, isDefault: hasDefault ? item.isDefault : false }));
    if (!hasDefault) normalized[0].isDefault = true;

    this.addresses.set(normalized);
    this.selectedAddressId.set(normalized.find(item => item.isDefault)!._id ?? null);
    this.persistAddresses(normalized);
  }

  goToLogin(): void {
    void this.router.navigate(['/dang-nhap'], {
      queryParams: { returnUrl: '/thanh-toan' },
    });
  }

  checkout(): void {
    if (this.items().some(item => !item.available)) {
      this.error.set('Có phiên bản tạm hết hàng. Vui lòng quay lại giỏ hàng và chọn lại.');
      return;
    }
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
      itemType: item.itemType,
      variantId: item.checkoutVariantId,
      variantLabel: item.variantLabel,
      name: item.variantLabel ? `${item.name} — ${item.variantLabel}` : item.name,
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

  editAddress(address: CustomerAddress): void {
    this.selectedAddressId.set(address._id ?? null);
    this.customerName.set(address.name);
    this.customerPhone.set(address.phone);
    this.customerAddress.set(this.cleanStoredAddress(address.address));
    this.customerProvince.set(address.province ?? null);
    this.customerDistrict.set(address.district ?? null);
    this.addingAddress.set(true);
    this.error.set('');
    // Load distritos cho tỉnh đã chọn (nếu có)
    if (address.province) {
      this.http.get<{ code: number; name: string; division_type: string; province_code: number }[]>(
        `/api/districts?province=${address.province}`
      ).subscribe({
        next: districts => {
          districts.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
          this.districts.set(districts);
        },
        error: () => this.districts.set([]),
      });
    }
  }

  cleanAddress(addr: string): string {
    return (addr || '')
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .join(', ');
  }

  cleanStoredAddress(addr: string): string {
    // Lấy phần địa chỉ chi tiết (trước các phần tỉnh/huyện nếu đã lưu đầy đủ)
    const parts = (addr || '').split(',').map(p => p.trim()).filter(p => p.length > 0);
    return parts.length >= 3 ? parts[0] : addr;
  }

  provinceName(code: number | null | undefined): string {
    return this.provinces().find(p => p.code === code)?.name || '';
  }

  districtName(code: number | null | undefined): string {
    return this.districts().find(d => d.code === code)?.name || '';
  }

  vnd(value: number): string {
    return value.toLocaleString('vi-VN') + 'đ';
  }
}

function checkoutGiftItem(gift: GiftJson, line: CartLine): CheckoutItem {
  return {
    id: gift.id,
    key: `${line.itemType}:${line.productId}`,
    itemType: 'gift',
    name: gift.name,
    price: gift.price,
    quantity: line.quantity,
    imageUrl: gift.images?.find(Boolean) ?? null,
    available: gift.inStock !== false,
    variantLabel: '',
  };
}

function unavailableCheckoutGift(line: CartLine): CheckoutItem {
  return {
    id: line.productId,
    key: `${line.itemType}:${line.productId}`,
    itemType: 'gift',
    name: 'Quà tặng không khả dụng',
    price: 0,
    quantity: line.quantity,
    imageUrl: null,
    available: false,
    variantLabel: '',
  };
}
