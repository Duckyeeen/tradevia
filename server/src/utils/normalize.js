// Chuẩn hóa chuỗi cho so khớp tất định: chữ thường, bỏ dấu, gộp khoảng trắng.
const INVISIBLE_RE = /[\u200b\u200c\u200d\ufeff]/g;
const DIACRITIC_RE = /[\u0300-\u036f]/g;

export function normalizeText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(INVISIBLE_RE, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITIC_RE, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

// "ISO 9001:2015", "iso-9001", "ISO9001" -> "iso9001"
export function normalizeCertification(value) {
  return normalizeText(value)
    .replace(/:\s*\d{4}/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// "B2B", "b2b", "B2B2C" -> "b2b", "b2b2c"
export function normalizeBusinessModel(value) {
  return normalizeText(value).replace(/[^a-z0-9]/g, '');
}

// Trả về Set đã chuẩn hóa (có thể rỗng), hoặc null nếu giá trị KHÔNG được cung cấp
// (null / undefined / chuỗi rỗng / kiểu không hợp lệ).
export function toNormalizedSet(value, normalizer = normalizeText) {
  let list;
  if (Array.isArray(value)) list = value;
  else if (typeof value === 'string' && normalizeText(value) !== '') list = [value];
  else return null;

  const set = new Set();
  for (const item of list) {
    const normalized = normalizer(item);
    if (normalized !== '') set.add(normalized);
  }
  return set;
}

