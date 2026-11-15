import { getRequestInfo, logAction } from '../utils/auditLog.js';
import { Gift } from '../models/Gift.js';

function normalizeGift(input, id, existing = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'Dữ liệu quà tặng không hợp lệ.' };
  }

  const value = (key, fallback = '') => input[key] === undefined ? existing[key] ?? fallback : input[key];
  const text = (key, label, maxLength, fallback = '') => {
    const raw = value(key, fallback);
    if (typeof raw !== 'string' || raw.trim().length > maxLength) {
      return { error: `${label} không hợp lệ.` };
    }
    return { value: raw.trim() };
  };

  const name = text('name', 'Tên quà tặng', 160);
  if (name.error || !name.value) return { error: name.error || 'Vui lòng nhập tên quà tặng.' };
  const description = text('description', 'Mô tả', 5000);
  const cat = text('cat', 'Danh mục', 120);
  const type = text('type', 'Loại quà', 120);
  const region = text('region', 'Vùng miền', 120);
  const province = text('province', 'Tỉnh thành', 120);
  const source = text('source', 'Nguồn', 200);
  const link = text('link', 'Liên kết', 2048);
  const icon = text('icon', 'Biểu tượng', 40);
  for (const field of [description, cat, type, region, province, source, link, icon]) {
    if (field.error) return field;
  }

  const rawPrice = value('price', NaN);
  if (rawPrice === '' || rawPrice === null) return { error: 'Vui lòng nhập giá quà tặng.' };
  const price = Number(rawPrice);
  if (!Number.isFinite(price) || price < 0) return { error: 'Giá quà tặng không hợp lệ.' };

  const rate = Number(value('rate', 0));
  if (!Number.isFinite(rate) || rate < 0 || rate > 5) return { error: 'Điểm đánh giá phải từ 0 đến 5.' };

  const reviews = Number(value('reviews', 0));
  if (!Number.isSafeInteger(reviews) || reviews < 0) return { error: 'Số lượt đánh giá không hợp lệ.' };

  const inStock = value('inStock', true);
  if (typeof inStock !== 'boolean') return { error: 'Tình trạng hàng không hợp lệ.' };

  const images = value('images', []);
  if (!Array.isArray(images) || images.length > 30 || images.some(image =>
    typeof image !== 'string' ||
    image.trim().length > 2048 ||
    !(/^https?:\/\//i.test(image.trim()) || /^\/uploads\//i.test(image.trim()))
  )) {
    return { error: 'Danh sách ảnh không hợp lệ.' };
  }

  if (link.value && !/^https?:\/\//i.test(link.value)) {
    return { error: 'Liên kết phải bắt đầu bằng http:// hoặc https://.' };
  }

  return {
    value: {
      id,
      name: name.value,
      description: description.value,
      cat: cat.value,
      type: type.value,
      region: region.value,
      province: province.value,
      price,
      rate,
      reviews,
      inStock,
      icon: icon.value,
      images: images.map(image => image.trim()),
      source: source.value,
      link: link.value,
    },
  };
}

function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isDuplicateId(error) {
  return error?.code === 11000;
}

export async function getAllGifts(_req, res) {
  const gifts = await Gift.find().sort({ id: 1 }).lean();
  res.json(gifts);
}

export async function getGiftById(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ message: 'Mã quà tặng không hợp lệ.' });

  const gift = await Gift.findOne({ id }).lean();
  if (!gift) return res.status(404).json({ message: 'Không tìm thấy quà tặng.' });
  res.json(gift);
}

export async function createGift(req, res) {
  const normalized = normalizeGift(req.body, 1);
  if (normalized.error) return res.status(400).json({ message: normalized.error });

  const lastGift = await Gift.findOne().sort({ id: -1 }).select({ id: 1 }).lean();
  normalized.value.id = (lastGift?.id ?? 0) + 1;

  let gift;
  try {
    gift = await Gift.create(normalized.value);
  } catch (error) {
    if (isDuplicateId(error)) return res.status(409).json({ message: 'Mã quà tặng đã tồn tại. Vui lòng thử lại.' });
    throw error;
  }

  const { user, ip } = getRequestInfo(req);
  await logAction({ action: 'gift.create', resourceType: 'Gift', resourceId: gift.id, user, ip, details: { name: gift.name } });
  res.status(201).json({ gift });
}

export async function updateGift(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ message: 'Mã quà tặng không hợp lệ.' });

  const existing = await Gift.findOne({ id }).lean();
  if (!existing) return res.status(404).json({ message: 'Không tìm thấy quà tặng.' });

  const normalized = normalizeGift(req.body, id, existing);
  if (normalized.error) return res.status(400).json({ message: normalized.error });

  let gift;
  try {
    gift = await Gift.findOneAndUpdate({ id }, normalized.value, { new: true, runValidators: true }).lean();
  } catch (error) {
    if (isDuplicateId(error)) return res.status(409).json({ message: 'Mã quà tặng đã tồn tại.' });
    throw error;
  }
  if (!gift) return res.status(404).json({ message: 'Không tìm thấy quà tặng.' });

  const { user, ip } = getRequestInfo(req);
  await logAction({ action: 'gift.update', resourceType: 'Gift', resourceId: id, user, ip, details: { name: gift.name } });
  res.json({ gift });
}

export async function deleteGift(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ message: 'Mã quà tặng không hợp lệ.' });

  const gift = await Gift.findOneAndDelete({ id }).lean();
  if (!gift) return res.status(404).json({ message: 'Không tìm thấy quà tặng.' });

  const { user, ip } = getRequestInfo(req);
  await logAction({ action: 'gift.delete', resourceType: 'Gift', resourceId: id, user, ip, details: { name: gift.name } });
  res.json({ message: 'Đã xóa quà tặng.' });
}
