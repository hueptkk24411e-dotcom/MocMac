import { Coupon } from '../models/Coupon.js';
import { logAction, getRequestInfo } from '../utils/auditLog.js';
import { calculateCouponDiscount, isCouponEligible } from '../utils/coupon.js';
import { Order } from '../models/Order.js';

export const getAvailableCoupons = async (req, res) => {
  try {
    const orderTotal = Math.max(0, Number(req.query.orderTotal) || 0);
    const shipping = Math.max(0, Number(req.query.shipping) || 0);
    const now = new Date();
    const coupons = await Coupon.find({
      active: true,
      expiryDate: { $gte: now },
      $or: [
        { usageLimit: { $lte: 0 } },
        { usageLimit: { $exists: false } },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
      ],
    })
      .sort({ expiryDate: 1, createdAt: -1 })
      .limit(50)
      .select('+redeemedBy')
      .lean();
    const hasPreviousOrder = Boolean(await Order.exists({ user: req.user.id }));

    return res.json({
      success: true,
      coupons: coupons.map((coupon) => {
        const alreadyRedeemed = coupon.redeemedBy?.some(
          (userId) => String(userId) === String(req.user.id)
        );
        const eligible =
          isCouponEligible(coupon, orderTotal, now) &&
          (!coupon.firstOrderOnly || (!hasPreviousOrder && !alreadyRedeemed)) &&
          (coupon.scope !== 'shipping' || shipping > 0);
        let unavailableReason = '';
        if (coupon.firstOrderOnly && (hasPreviousOrder || alreadyRedeemed)) {
          unavailableReason = 'Chỉ áp dụng cho khách hàng đặt đơn đầu tiên.';
        } else if (coupon.scope === 'shipping' && shipping <= 0) {
          unavailableReason = 'Đơn hàng đã được miễn phí vận chuyển.';
        } else if (orderTotal < Number(coupon.minOrderValue || 0)) {
          unavailableReason = `Đơn tối thiểu ${Number(coupon.minOrderValue).toLocaleString('vi-VN')}đ.`;
        } else if (!coupon.active || new Date(coupon.expiryDate) < now) {
          unavailableReason = 'Voucher đã hết hạn hoặc hết hiệu lực.';
        } else if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
          unavailableReason = 'Voucher đã hết lượt sử dụng.';
        }
        return {
          _id: coupon._id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          scope: coupon.scope ?? 'order',
          firstOrderOnly: coupon.firstOrderOnly ?? false,
          minOrderValue: coupon.minOrderValue,
          maxDiscount: coupon.maxDiscount,
          expiryDate: coupon.expiryDate,
          eligible,
          unavailableReason,
          discountAmount: eligible
            ? calculateCouponDiscount(coupon, orderTotal, shipping)
            : 0,
        };
      }),
    });
  } catch (error) {
    console.error('❌ Lỗi lấy voucher khả dụng:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy danh sách ưu đãi.' });
  }
};

export const getAllCoupons = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.q) {
      filter.code = new RegExp(String(req.query.q), 'i');
    }

    if (req.query.active !== undefined) {
      filter.active = req.query.active === 'true';
    }

    const sort = {};
    const sortBy = String(req.query.sortBy || 'createdAt');
    const sortDir = req.query.sortDir === 'asc' ? 1 : -1;
    sort[sortBy] = sortDir;

    const [coupons, total] = await Promise.all([
      Coupon.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Coupon.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      coupons,
    });
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách mã giảm giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy danh sách.', error: error.message });
  }
};

export const getCouponByCode = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase() }).lean();
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại.' });
    }
    if (!coupon.active) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết/hết hiệu lực.' });
    }
    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn.' });
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng.' });
    }
    return res.json({ success: true, coupon });
  } catch (error) {
    console.error('❌ Lỗi tìm kiếm mã giảm giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể tìm kiếm.', error: error.message });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { orderTotal } = req.query;
    const code = req.params?.code ?? req.query?.code;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá.' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() }).lean();
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại.' });
    }
    if (!coupon.active) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá không còn kích hoạt.' });
    }
    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn.' });
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng.' });
    }
    if (!isCouponEligible(coupon, Number(orderTotal || 0))) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu ${coupon.minOrderValue.toLocaleString('vi-VN')}đ để áp dụng mã này.`,
      });
    }

    const discountAmount = calculateCouponDiscount(coupon, Number(orderTotal || 0));

    return res.json({
      success: true,
      message: 'Mã giảm giá hợp lệ.',
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
    });
  } catch (error) {
    console.error('❌ Lỗi xác thực mã giảm giá:', error);
    const { user, ip } = getRequestInfo(req);
    await logAction({
      action: 'coupon.validate_error',
      resourceType: 'Coupon',
      user,
      ip,
      details: { code: req.params?.code ?? req.query?.code, error: error.message },
      status: 'failed',
    });
    return res.status(500).json({ success: false, message: 'Không thể xác thực.', error: error.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      usageLimit,
      expiryDate,
      scope,
      firstOrderOnly,
    } = req.body ?? {};
    if (!code || !discountValue) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã và giá trị giảm.' });
    }

    const coupon = await Coupon.create({
      code: String(code).toUpperCase(),
      description: description ?? '',
      discountType: discountType ?? 'percent',
      discountValue,
      scope: scope ?? 'order',
      firstOrderOnly: firstOrderOnly === true,
      minOrderValue: minOrderValue ?? 0,
      maxDiscount: maxDiscount ?? 0,
      usageLimit: usageLimit ?? 0,
      expiryDate,
    });

    const { user, ip } = getRequestInfo(req);
    await logAction({
      action: 'coupon.create',
      resourceType: 'Coupon',
      resourceId: coupon._id,
      user,
      ip,
      details: { code: coupon.code, discountType, discountValue, expiryDate },
    });

    return res.status(201).json({ success: true, message: 'Tạo mã giảm giá thành công.', coupon });
  } catch (error) {
    console.error('❌ Lỗi tạo mã giảm giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể tạo mã.', error: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      usageLimit,
      expiryDate,
      active,
      scope,
      firstOrderOnly,
    } = req.body ?? {};
    const updated = await Coupon.findByIdAndUpdate(
      req.params.id,
      {
        code,
        description,
        discountType,
        discountValue,
        minOrderValue,
        maxDiscount,
        usageLimit,
        expiryDate,
        active,
        scope,
        firstOrderOnly,
      },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá.' });
    }

    const { user, ip } = getRequestInfo(req);
    await logAction({
      action: 'coupon.update',
      resourceType: 'Coupon',
      resourceId: updated._id,
      user,
      ip,
      details: { code: updated.code },
    });

    return res.json({ success: true, message: 'Cập nhật mã giảm giá thành công.', coupon: updated });
  } catch (error) {
    console.error('❌ Lỗi cập nhật mã giảm giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể cập nhật.', error: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const deleted = await Coupon.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá.' });
    }

    const { user, ip } = getRequestInfo(req);
    await logAction({
      action: 'coupon.delete',
      resourceType: 'Coupon',
      resourceId: deleted._id,
      user,
      ip,
      details: { code: deleted.code },
    });

    return res.json({ success: true, message: 'Xóa mã giảm giá thành công.' });
  } catch (error) {
    console.error('❌ Lỗi xóa mã giảm giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể xóa.', error: error.message });
  }
};
