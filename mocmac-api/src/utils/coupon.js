export function calculateCouponDiscount(coupon, orderTotal, shipping = 0) {
  const discountBase = coupon.scope === 'shipping'
    ? Math.max(0, Number(shipping) || 0)
    : Math.max(0, Number(orderTotal) || 0);
  const discount =
    coupon.scope === 'shipping'
      ? coupon.discountValue > 0
        ? coupon.discountValue
        : discountBase
      : coupon.discountType === 'percent'
        ? Math.round((discountBase * coupon.discountValue) / 100)
        : coupon.discountValue;
  const cappedDiscount =
    coupon.scope !== 'shipping' && coupon.discountType === 'percent' && coupon.maxDiscount > 0
      ? Math.min(discount, coupon.maxDiscount)
      : discount;

  return Math.min(cappedDiscount, discountBase);
}

export function isCouponEligible(coupon, orderTotal, now = new Date()) {
  return Boolean(
    coupon.active &&
      new Date(coupon.expiryDate) >= now &&
      (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
      Number(orderTotal) >= Number(coupon.minOrderValue || 0)
  );
}
