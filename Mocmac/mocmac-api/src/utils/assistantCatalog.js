export const catalogFields = 'id slug name price cat type region province village description occasion ocop inStock preorder variants';

export function fold(value) {
  return String(value ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');
}

const words = value => fold(value).replace(/[^a-z0-9]+/g, ' ').trim();
const has = (text, phrase) => Boolean(phrase) && ` ${text} `.includes(` ${phrase} `);
export const money = value => `${Number(value).toLocaleString('vi-VN')}đ`;

const amount = String.raw`(\d{1,3}(?:[., ]\d{3})+|\d+(?:[.,]\d+)?)\s*(trieu|million|tr|nghin|ngan|thousand|k|vnd|dong|d)?`;

function valueOfAmount(digits, unit) {
  const multiplier = /^(trieu|tr|million)$/.test(unit) ? 1_000_000
    : /^(nghin|ngan|thousand|k)$/.test(unit) ? 1_000 : 1;
  const grouped = /^\d{1,3}(?:[., ]\d{3})+$/.test(digits);
  const number = grouped ? Number(digits.replace(/[., ]/g, '')) : Number(digits.replace(',', '.'));
  return Math.round(number * multiplier);
}

export function readBudget(text) {
  const normalized = fold(text).replace(/\b(\d+)\s*tr\s*(\d{1,3})\b/g, (_, millions, fraction) =>
    `${Number(millions) + Number(`0.${fraction}`)} trieu`);
  const range = normalized.match(new RegExp(String.raw`\b${amount}\s*(?:-|–|den|toi|to)\s*${amount}(?![a-z0-9])`));
  if (range) {
    const [, first, firstUnit, second, secondUnit] = range;
    const low = valueOfAmount(first, firstUnit || (Number(first) < 1000 ? secondUnit : ''));
    const high = valueOfAmount(second, secondUnit || (Number(second) < 1000 ? firstUnit : ''));
    if ([low, high].every(value => Number.isSafeInteger(value) && value >= 1000)) {
      return { min: Math.min(low, high), max: Math.max(low, high) };
    }
  }
  const single = new RegExp(String.raw`\b(?:(duoi|tren|hon|tu|it nhat|toi da|khong qua|tam|khoang|ngan sach|gia|under|below|over|above|up to|at most|at least|around|budget)\s*)?${amount}(?![a-z0-9]|[.,]\d)`, 'g');
  for (const [, marker, digits, unit] of normalized.matchAll(single)) {
    const value = valueOfAmount(digits, unit);
    if (!Number.isSafeInteger(value) || value < 1000 || (!unit && !marker && !/[., ]/.test(digits))) continue;
    if (/^(tren|hon|over|above)$/.test(marker)) return { min: value, above: true };
    if (/^(tu|it nhat|at least)$/.test(marker)) return { min: value };
    return { max: value, below: /^(duoi|under|below)$/.test(marker) };
  }
  return null;
}

const typeAliases = {
  tea: 'tra', coffee: 'ca phe', pottery: 'gom', ceramics: 'gom', handicrafts: 'thu cong my nghe',
  specialties: 'dac san', 'dried fruit': 'trai cay say', 'lacquerware': 'son mai',
  'do thu cong': 'thu cong my nghe', 'do gom': 'gom', 'may tre': 'may tre dan',
  'trai cay kho': 'trai cay say',
};

const regionAliases = {
  'mien bac': ['mien bac', 'dong bac', 'tay bac', 'dong bang song hong'],
  'mien trung': ['mien trung', 'bac trung bo', 'duyen hai nam trung bo', 'nam trung bo'],
  'mien nam': ['mien nam', 'dong nam bo', 'dong bang song cuu long', 'tay nam bo'],
  'northern vietnam': ['mien bac', 'dong bac', 'tay bac', 'dong bang song hong'],
  'central vietnam': ['mien trung', 'bac trung bo', 'duyen hai nam trung bo', 'nam trung bo'],
  'southern vietnam': ['mien nam', 'dong nam bo', 'dong bang song cuu long', 'tay nam bo'],
};

const occasions = {
  tet: 'qua tet', 'lunar new year': 'qua tet', cuoi: 'qua cuoi', wedding: 'qua cuoi',
  'tan gia': 'qua tan gia', housewarming: 'qua tan gia', 'doi tac': 'qua bieu doi tac',
  'business gift': 'qua bieu doi tac', 'sinh nhat': 'sinh nhat', birthday: 'sinh nhat',
};
const recipients = {
  family: /\b(?:cho|bieu|tang|for) (?:my )?(?:ba me|bo me|me|bo|ong ba|ong|ba|cha|mom|mother|dad|father|parents)\b/,
  teachers: /\b(?:cho|bieu|tang|for) (?:my )?(?:thay co|co giao|thay giao|teacher)\b/,
};
const giftWords = /(?<!khong )\bqua\b(?! \d)|\b(bieu|tang|gift|present)\b/;
const searchWords = /\b(tim|goi y|tu van|chon|mua|xem|san pham|co ban|con hang|nen lay|nen chon|recommend|suggest|find|looking for|show|buy|in stock|product)\b/;
const stop = new Set(('tim goi y tu van chon mua xem giup cho minh toi can muon co khong nhung nao voi cua ban va ' +
  'mot vai may loai mau san pham bao nhieu gia tien tat ca shop oi voi nhe de uong mon lay dang con hang dat truoc ' +
  'nen bang la thich thu thi roi so huu giao ngay thoi da gi vung mien noi bat ' +
  'doi sang chuyen chi uu tien re hon them khac nua mot cai duoi tren tu den tam khoang ngan sach toi da ' +
  'khong qua it nhat vnd dong nghin ngan trieu tr d k million thousand ' +
  'find looking for recommend suggest show buy get me do you have any what which with and or a an the ' +
  'some one is are how much price under below over above up to at most least around budget instead ' +
  'other more only cheaper than in stock product products').split(' '));

function longestMatch(text, options) {
  return [...new Set(options.filter(Boolean))]
    .filter(option => has(text, option))
    .sort((a, b) => b.length - a.length)[0] || '';
}

function namedProducts(text, catalog) {
  const exact = catalog.filter(product => has(text, words(product.name)) || has(text, words(product.slug)));
  const aliases = new Map();
  for (const product of catalog) {
    const name = words(product.name);
    const province = words(product.province);
    const shortened = name.replace(/ (dac san|rang moc|truyen thong|thu cong)$/, '');
    const local = province && name.endsWith(` ${province}`) ? name.slice(0, -(province.length + 1)) : '';
    for (const alias of new Set([shortened, local])) {
      if (alias !== name && alias.includes(' ') && has(text, alias)) {
        const matches = aliases.get(alias) || [];
        aliases.set(alias, [...matches, product]);
      }
    }
  }
  const matching = [...aliases.values()].filter(matches => matches.length === 1).map(matches => matches[0]);
  return [...new Set([...exact, ...matching])];
}

function readContext(input) {
  const previous = input?.criteria;
  const ids = (value, limit) => Array.isArray(value)
    ? value.filter(id => Number.isSafeInteger(id) && id > 0).slice(0, limit) : [];
  const clean = value => typeof value === 'string' ? words(value).slice(0, 100) : '';
  const price = value => Number.isSafeInteger(value) && value >= 0 ? value : undefined;
  return {
    criteria: {
      kind: clean(previous?.kind), origin: clean(previous?.origin),
      occasion: clean(previous?.occasion), recipient: clean(previous?.recipient),
      gift: previous?.gift === true, stockOnly: previous?.stockOnly === true,
      ocop: price(previous?.ocop),
      budget: previous?.budget ? {
        min: price(previous.budget.min), max: price(previous.budget.max),
        above: previous.budget.above === true, below: previous.budget.below === true,
      } : null,
      terms: Array.isArray(previous?.terms) ? previous.terms.slice(0, 8).map(clean).filter(Boolean) : [],
    },
    itemIds: ids(input?.itemIds, 3),
    seenIds: ids(input?.seenIds, 24),
  };
}

function pricesFor(product, budget, terms = []) {
  const variants = product.variants ?? [];
  const options = variants.length ? variants.filter(option => option.available !== false) : [{ price: product.price }];
  const variantWords = words(variants.map(option => option.label).join(' '));
  const qualifiers = terms.filter(term => has(variantWords, term) && !has(words(product.name), term));
  return options.filter(option => {
    const price = option.price;
    return Number.isFinite(price) && price >= 0 &&
      (budget?.min === undefined || (budget.above ? price > budget.min : price >= budget.min)) &&
      (budget?.max === undefined || (budget.below ? price < budget.max : price <= budget.max)) &&
      qualifiers.every(term => has(words(option.label), term));
  }).sort((a, b) => a.price - b.price);
}

function statusOf(product, en) {
  if (product.inStock !== false) return en ? 'In stock' : 'Có sẵn';
  if (product.preorder) return en ? 'Preorder' : 'Nhận đặt trước';
  return en ? 'Out of stock' : 'Hết hàng';
}

function priceLabel(options, en) {
  if (!options.length) return en ? 'No available option' : 'Chưa có lựa chọn khả dụng';
  const first = options[0].price;
  const last = options.at(-1).price;
  return first === last ? money(first) : `${money(first)}–${money(last)}`;
}

function budgetLabel(budget, en) {
  if (budget?.min !== undefined && budget.max !== undefined) return `${money(budget.min)}–${money(budget.max)}`;
  if (budget?.max !== undefined) return `${budget.below ? (en ? 'under' : 'dưới') : (en ? 'up to' : 'tối đa')} ${money(budget.max)}`;
  if (budget?.min !== undefined) return `${budget.above ? (en ? 'over' : 'trên') : (en ? 'from' : 'từ')} ${money(budget.min)}`;
  return '';
}

function itemLine({ product, options }, en) {
  const location = product.province || product.region || product.village;
  const parts = [product.name, priceLabel(options, en), location, statusOf(product, en)];
  if (options.length === 1 && options[0].label) parts.push(options[0].label);
  if (product.ocop > 0) parts.push(`OCOP ${product.ocop} ${en ? 'stars' : 'sao'}`);
  return parts.filter(Boolean).join(' · ');
}

function openProduct(product, label) {
  return { type: 'open_product', slug: product.slug, name: product.name, ...(label ? { label } : {}) };
}

function giftScore(product, criteria) {
  const tagged = (Array.isArray(product.occasion) ? product.occasion : [product.occasion])
    .some(value => criteria.occasion && has(words(value), criteria.occasion));
  const features = words(`${product.type} ${product.name}`);
  const home = /\b(gom|am chen|am tra|khay|tranh|den long)\b/.test(features);
  const food = /\b(tra|ca phe|banh|hat dieu|dac san)\b/.test(features);
  const personal = /\b(khan|tui|lua)\b/.test(features);
  const teaOrCoffee = /\b(tra|ca phe)\b/.test(features);
  const fit = /tan gia|cuoi/.test(criteria.occasion) ? Number(home) * 4
    : ['family', 'teachers'].includes(criteria.recipient) ? Number(teaOrCoffee || personal) * 4 + Number(home || food)
      : Number(food || home) * 3;
  return Number(tagged) * 6 + fit;
}

export function adviseFromCatalog(question, catalog, context, lang = 'vi') {
  const en = lang === 'en';
  const text = words(question);
  const previous = readContext(context);
  const indexed = new Map(catalog.map(product => [product.id, product]));
  const recent = previous.itemIds.map(id => indexed.get(id)).filter(Boolean);
  const mentions = namedProducts(text, catalog);
  const orderWords = { nhat: 1, hai: 2, ba: 3, first: 1, second: 2, third: 3 };
  const ordinal = text.match(/\b(?:thu|mau|so|item|option|number) (nhat|hai|ba|\d+)\b|\b(first|second|third)(?: one)?\b/);
  const ordinalIndex = ordinal ? (orderWords[ordinal[1] || ordinal[2]] || Number(ordinal[1])) - 1 : null;
  const selected = ordinal ? indexed.get(previous.itemIds[ordinalIndex]) : recent.length === 1 ? recent[0] : null;
  const more = /\b((?:mau|loai|mon|san pham) (?:nao )?khac|goi y them|them lua chon|con gi khac|other options|more options|something else|show me more)\b/.test(text);
  const comparison = /\b(so sanh|compare|khac nhau)\b/.test(text);
  const add = /\b(them|cho|add|put)\b.*\b(gio|cart|basket)\b/.test(text) &&
    !/\b(dung|khong|cach|the nao|how|do not|don t)\b.*\b(them|add|cho|put)\b/.test(text);
  let budget = readBudget(question);
  const kind = longestMatch(text, [...catalog.flatMap(product => [words(product.cat), words(product.type)]), ...Object.keys(typeAliases)].filter(type => type !== 'khac'));
  const origin = longestMatch(text, [...catalog.flatMap(product => [words(product.region), words(product.province), words(product.village)]), ...Object.keys(regionAliases)]);
  const reference = ordinal || /\b(cai do|cai day|mau do|mau nay|loai do|loai nay|mon do|mon nay|san pham do|san pham nay|that one|this one|it)\b/.test(text) ||
    (!kind && !origin && !more && recent.length > 0 && /\b(co mau|con mau|mau gi|mau nao|quy cach|kich thuoc|con hang khong|which colors|what size)\b/.test(text));
  const occasion = longestMatch(text, Object.keys(occasions));
  const recipient = Object.keys(recipients).find(key => recipients[key].test(text));
  const gift = giftWords.test(text) || Boolean(occasion || recipient);
  const stockOnly = /\b(co san|san hang|in stock|giao ngay)\b/.test(text);
  const ocop = text.match(/\bocop(?:\s+([3-5]))?\b/);
  const cheaper = /\b(re nhat|re hon|gia thap|cheapest|cheaper)\b/.test(text);
  if (!budget && /\b(re hon|cheaper)\b/.test(text) && recent.length) {
    const lowest = Math.min(...recent.flatMap(product => pricesFor(product, previous.criteria.budget).map(option => option.price)));
    if (Number.isFinite(lowest)) budget = { max: lowest, below: true };
  }
  const refinement = Boolean(more || reference || comparison || cheaper ||
    /^(con|doi|chuyen|chi|uu tien|vay|them|tang|giam|duoi|tam|khoang|ngan sach|toi da|tren|tu|how about|instead|only|under|budget|up to|around)\b/.test(text));
  const base = refinement ? previous.criteria : readContext(null).criteria;
  const intent = mentions.length || kind || origin || gift || ocop || budget || reference || comparison ||
    add || more || cheaper || searchWords.test(text);
  if (!intent) return null;

  let query = text;
  for (const part of [mentions.length === 1 && words(mentions[0].name), kind, origin, occasion].filter(Boolean)) {
    query = ` ${query} `.replace(` ${part} `, ' ').trim();
  }
  const terms = [...new Set(query.split(' ').filter(word => word.length >= 2 && !stop.has(word) &&
    !/^\d+(k|tr\d{0,3}|d|vnd)?$/.test(word) && !['ocop', 'sao', 'stars'].includes(word)))].slice(0, 8);
  const criteria = {
    ...base,
    kind: kind ? typeAliases[kind] || kind : base.kind,
    origin: origin || base.origin,
    occasion: occasion ? occasions[occasion] : base.occasion,
    recipient: recipient || base.recipient,
    gift: gift || base.gift,
    stockOnly: stockOnly || base.stockOnly,
    budget: budget || base.budget,
    ocop: ocop ? Number(ocop[1] || 1) : base.ocop,
    terms: !gift && !more && !cheaper && !add && !comparison && !reference && terms.length ? terms : kind && !reference ? [] : base.terms,
  };
  const answer = (text, actions = [], items = recent, seen = previous.seenIds) => ({
    text, actions, context: { criteria, itemIds: items.map(product => product.id), seenIds: seen },
  });
  const choices = (items = recent) => items.map(product => openProduct(product));
  const pickQuestion = en ? 'Which product do you mean? Send its name or the number from the last list.'
    : 'Bạn muốn chọn sản phẩm nào? Gửi tên hoặc số thứ tự trong danh sách mình vừa gợi ý nhé.';

  if (comparison) {
    const pair = text.match(/\b(?:mau|so|item|option) (\d) (?:va|voi|and|vs) (?:(?:mau|so|item|option) )?(\d)\b/);
    const requested = pair?.slice(1).map(number => indexed.get(previous.itemIds[Number(number) - 1])).filter(Boolean);
    const items = mentions.length >= 2 ? mentions.slice(0, 3) : requested || recent;
    if (items.length < 2) return answer(en ? 'Send the names of two products to compare.' : 'Bạn gửi tên hai sản phẩm muốn so sánh nhé.');
    const comparedBudget = mentions.length >= 2 ? budget : criteria.budget;
    const lines = items.map(product => itemLine({ product, options: pricesFor(product, comparedBudget) }, en));
    return answer(lines.map((line, index) => `${index + 1}. ${line}`).join('\n'), choices(items), items);
  }

  const direct = mentions.filter(product => !mentions.some(other => other !== product &&
    words(other.name) !== words(product.name) && has(words(other.name), words(product.name))));
  const target = direct.length === 1 ? direct[0] : reference && !direct.length ? selected : null;
  if ((reference || add) && !target) return answer(pickQuestion, choices());
  if (target && !more) {
    const options = pricesFor(target, criteria.budget, terms);
    const available = target.inStock !== false || (target.preorder && !criteria.stockOnly);
    if (add && available && options.length) {
      if (target.variants?.length) {
        const text = en ? `Choose an available option for ${target.name} on its product page before adding it.`
          : `Bạn chọn màu hoặc quy cách của ${target.name} trên trang sản phẩm rồi thêm vào giỏ nhé.`;
        return answer(`${text}\n${itemLine({ product: target, options }, en)}`, [openProduct(target, en ? 'Choose option' : 'Chọn quy cách')], [target]);
      }
      const quantity = Math.min(99, Math.max(1, Number(text.match(/\b(?:them|cho|add|put) (\d+)\b/)?.[1]) || 1));
      return answer(
        en ? `Add ${quantity} × ${target.name}? Confirm below.` : `Thêm ${quantity} × ${target.name}? Bấm nút bên dưới để xác nhận.`,
        [{ type: 'add_to_cart', productId: target.id, slug: target.slug, name: target.name, quantity }], [target],
      );
    }
    if (!options.length && criteria.budget) {
      const range = budgetLabel(criteria.budget, en);
      return answer(en ? `${target.name} has no available option ${range}.`
        : `${target.name} hiện chưa có lựa chọn khả dụng ${range}.`, choices([target]), [target]);
    }
    const lines = [itemLine({ product: target, options }, en)];
    if (options.length && target.variants?.length) {
      lines.push(...options.slice(0, 4).map(option => `• ${option.label} · ${money(option.price)}`));
    }
    const description = String(target.description || '').split('\n').find(line => line.trim());
    if (!add && description) lines.push(description.slice(0, 420));
    return answer(lines.join('\n'), choices([target]), [target]);
  }

  const budgetText = budgetLabel(criteria.budget, en);
  if (!criteria.kind && !criteria.origin && !criteria.gift && !criteria.ocop && !criteria.terms.length && !budgetText && !cheaper && !more) {
    return answer(en ? 'What are you looking for, and what is your budget?' : 'Bạn đang tìm món gì hoặc muốn tặng ai? Cho mình biết khoảng giá để chọn sát hơn nhé.');
  }

  const seen = more ? previous.seenIds : [];
  const origins = regionAliases[criteria.origin] || [criteria.origin];
  const matches = catalog.filter(product => {
    if (seen.includes(product.id) || (product.inStock === false && (criteria.stockOnly || !product.preorder))) return false;
    if (criteria.kind && ![words(product.type), words(product.cat)].includes(criteria.kind)) return false;
    if (criteria.origin && ![product.region, product.province, product.village].some(value => origins.includes(words(value)))) return false;
    if (criteria.ocop && Number(product.ocop || 0) < criteria.ocop) return false;
    const searchable = words([product.name, product.type, product.cat, product.region, product.province, product.village,
      product.description, ...(product.variants || []).map(option => option.label)].join(' '));
    return criteria.terms.every(term => has(searchable, term));
  }).map(product => ({ product, options: pricesFor(product, criteria.budget, criteria.terms) }))
    .filter(item => item.options.length > 0)
    .sort((a, b) => (cheaper ? a.options[0].price - b.options[0].price : 0) ||
      (criteria.gift ? giftScore(b.product, criteria) - giftScore(a.product, criteria) : 0) ||
      Number(a.product.inStock === false) - Number(b.product.inStock === false) ||
      a.options[0].price - b.options[0].price)
    .slice(0, 3);

  if (!matches.length) {
    const detail = budgetText ? ` (${budgetText})` : '';
    const message = more
      ? (en ? 'Those are all the current matches. Want to change the category or budget?' : 'Mình đã gửi hết các mẫu phù hợp. Bạn muốn đổi loại sản phẩm hoặc khoảng giá không?')
      : (en ? `I found no available matches${detail}. Which requirement can we adjust?` : `Mình chưa tìm được món có thể đặt theo yêu cầu${detail}. Bạn muốn đổi điều kiện nào?`);
    return answer(message, [], recent, seen);
  }
  const items = matches.map(item => item.product);
  const heading = en ? `I found these options${budgetText ? ` ${budgetText}` : ''}.`
    : `Mình gợi ý ${items.length} món${budgetText ? ` ${budgetText}` : ''}.`;
  const lines = matches.map((item, index) => `${index + 1}. ${itemLine(item, en)}`);
  return answer([heading, ...lines].join('\n'), choices(items), items, [...seen, ...items.map(item => item.id)].slice(-24));
}
