import assert from 'node:assert/strict';
import test from 'node:test';
import { adviseFromCatalog, readBudget } from '../src/utils/assistantCatalog.js';

const catalog = [
  {
    id: 1, slug: 'tra-thai-nguyen', name: 'Trà Thái Nguyên đặc sản', type: 'Trà', price: 150_000,
    region: 'Đông Bắc', province: 'Thái Nguyên', inStock: true, ocop: 5,
    variants: [
      { label: '50g', price: 80_000, available: false },
      { label: '100g', price: 150_000, available: true },
      { label: '200g', price: 280_000, available: true },
    ],
  },
  { id: 2, slug: 'tra-shan-tuyet', name: 'Trà shan tuyết Hà Giang', type: 'Trà', price: 304_000, region: 'Đông Bắc', province: 'Hà Giang', inStock: true },
  { id: 3, slug: 'tra-sen', name: 'Trà sen Tây Hồ', type: 'Trà', price: 680_000, region: 'Đồng bằng sông Hồng', inStock: true },
  { id: 4, slug: 'dia-gom', name: 'Đĩa gốm Bát Tràng', type: 'Gốm', price: 220_000, region: 'Đồng bằng sông Hồng', inStock: true },
  { id: 5, slug: 'chau-gom', name: 'Chậu gốm Bàu Trúc', type: 'Gốm', price: 210_000, region: 'Duyên hải Nam Trung Bộ', inStock: true },
  { id: 6, slug: 'bat-gom', name: 'Bát gốm Bát Tràng', type: 'Gốm', price: 100_000, region: 'Đồng bằng sông Hồng', inStock: false },
  { id: 7, slug: 'banh-dau-xanh', name: 'Bánh đậu xanh Hải Dương', type: 'Bánh kẹo', price: 65_000, region: 'Đồng bằng sông Hồng', inStock: true },
  { id: 8, slug: 'tra-tay-bac', name: 'Trà Tây Bắc', type: 'Trà', price: 199_000, region: 'Tây Bắc', inStock: false, preorder: true },
];
const ask = (question, previous) => adviseFromCatalog(question, catalog, previous?.context);
const slugs = result => result.actions.map(action => action.slug);

test('reads Vietnamese currency, punctuation and shorthand ranges', () => {
  assert.deepEqual(readBudget('Trà dưới 300.000đ.'), { max: 300_000, below: true });
  assert.deepEqual(readBudget('Từ 200 đến 300k'), { min: 200_000, max: 300_000 });
  assert.deepEqual(readBudget('Tầm 1,5 triệu'), { max: 1_500_000, below: false });
  assert.deepEqual(readBudget('Ngân sách 1tr2'), { max: 1_200_000, below: false });
  assert.equal(readBudget('Chọn 2 gói loại 100g'), null);
});

test('applies the budget to orderable variants and enforces a strict upper bound', () => {
  const result = ask('Trà dưới 280k');
  assert.deepEqual(slugs(result), ['tra-thai-nguyen', 'tra-tay-bac']);
  assert.match(result.text, /100g/);
  assert.doesNotMatch(result.text, /\b80\.000đ|200g|\b304\.000đ/);
  assert.match(result.text, /Nhận đặt trước/);
  assert.deepEqual(slugs(ask('Trà dưới 100k')), []);
});

test('remembers a gift budget when switching product type and asking for another option', () => {
  const gift = ask('Quà cho mẹ dưới 300k');
  const tea = ask('Đổi sang trà', gift);
  assert.deepEqual(slugs(tea), ['tra-thai-nguyen', 'tra-tay-bac']);
  assert.equal(tea.context.criteria.budget.max, 300_000);
  const more = ask('Còn mẫu khác không?', tea);
  assert.deepEqual(slugs(more), []);
  assert.match(more.text, /hết các mẫu phù hợp/);
});

test('resolves regional and availability constraints without offering unrelated items', () => {
  assert.deepEqual(slugs(ask('Tìm gốm miền Bắc 90k đến 250k')), ['dia-gom']);
  assert.deepEqual(slugs(ask('Trà có sẵn dưới 220k')), ['tra-thai-nguyen']);
  assert.deepEqual(slugs(ask('Tìm điện thoại dưới 300k')), []);
});

test('requires a named item or an unambiguous recent reference before offering cart action', () => {
  const tea = ask('Trà dưới 300k');
  const ambiguous = ask('Thêm 2 cái đó vào giỏ', tea);
  assert.doesNotMatch(ambiguous.actions.map(action => action.type).join(' '), /add_to_cart/);
  const details = ask('Cái thứ nhất có quy cách gì?', tea);
  assert.match(details.text, /100g/);
  assert.doesNotMatch(details.text, /50g/);
  const variant = ask('Thêm 2 cái đó vào giỏ', details);
  assert.deepEqual(variant.actions.map(action => action.type), ['open_product']);
  const confirm = ask('Thêm 2 hộp bánh đậu xanh vào giỏ');
  assert.deepEqual(confirm.actions.map(action => [action.type, action.productId, action.quantity]), [['add_to_cart', 7, 2]]);
  assert.deepEqual(ask('Thêm bát gốm Bát Tràng vào giỏ').actions.map(action => action.type), ['open_product']);
});

test('compares only requested recent products by their numbers', () => {
  const tea = ask('Tìm trà');
  const compare = ask('So sánh mẫu 1 và 3', tea);
  assert.deepEqual(slugs(compare), [tea.actions[0].slug, tea.actions[2].slug]);
});
