// Matching rule-based, tất định. Hàm thuần: không I/O, không random, không thời gian, không sửa input.
import {
  WEIGHTS, CRITERIA, CAPACITY_LEVELS, CAPACITY_SCORES, BUSINESS_MODELS, LOCATION_SCORES, PLACE_LOOKUP,
  LOCATION_STOPWORDS, PLACE_MAX_TOKENS,
} from './matchingConfig.js';
import {
  normalizeText, normalizeCertification, normalizeBusinessModel, toNormalizedSet,
} from '../utils/normalize.js';

// ---------- Từng tiêu chí: trả về { score: số nguyên 0-100, missing: string[] } ----------

function coverage(requestValue, supplierValue, requestKey, supplierKey, normalizer) {
  const required = toNormalizedSet(requestValue, normalizer);
  const offered = toNormalizedSet(supplierValue, normalizer);
  const missing = [];
  if (!required || required.size === 0) missing.push(requestKey);
  if (!offered || offered.size === 0) missing.push(supplierKey);
  if (missing.length > 0) return { score: 0, missing };

  let hits = 0;
  for (const item of required) if (offered.has(item)) hits += 1;
  return { score: Math.round((hits / required.size) * 100), missing };
}

export function scoreTags(request, supplier) {
  return coverage(request.industryTags, supplier.industryTags, 'request.industryTags', 'supplier.industryTags');
}

export function scoreServices(request, supplier) {
  return coverage(request.requiredServices, supplier.services, 'request.requiredServices', 'supplier.services');
}

function capacityLevel(value) {
  const key = normalizeText(value);
  return Object.hasOwn(CAPACITY_LEVELS, key) ? CAPACITY_LEVELS[key] : null;
}

export function scoreCapacity(request, supplier) {
  const wanted = capacityLevel(request.desiredCapacity);
  const offered = capacityLevel(supplier.capacity);
  const missing = [];
  if (wanted === null) missing.push('request.desiredCapacity');
  if (offered === null) missing.push('supplier.capacity');
  if (missing.length > 0) return { score: 0, missing };
  return { score: CAPACITY_SCORES[Math.abs(wanted - offered)], missing };
}

// Phân tích địa chỉ tự do thành địa danh/quốc gia đã nhận diện.
// Chỉ nhận alias theo ranh giới token để tránh khớp nhầm chuỗi con như "us" trong "austin".
export function resolvePlace(value) {
  const key = normalizeText(value);
  const tokens = key.split(/[^a-z0-9]+/).filter(Boolean);
  const used = new Array(tokens.length).fill(false);
  const cities = [];
  const countries = [];

  for (let size = Math.min(PLACE_MAX_TOKENS, tokens.length); size >= 1; size -= 1) {
    for (let start = 0; start + size <= tokens.length; start += 1) {
      let overlaps = false;
      for (let index = start; index < start + size; index += 1) {
        if (used[index]) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) continue;

      const place = PLACE_LOOKUP.get(tokens.slice(start, start + size).join(' '));
      if (!place) continue;

      for (let index = start; index < start + size; index += 1) used[index] = true;
      (place.city ? cities : countries).push(place);
    }
  }

  const leftover = tokens
    .filter((token, index) => !used[index] && !LOCATION_STOPWORDS.has(token))
    .join(' ');
  const countrySet = new Set([...countries, ...cities].map(({ country }) => country));
  const citySet = new Set(cities.map(({ city }) => city));
  const ambiguous = countrySet.size > 1 || citySet.size > 1;

  return {
    key,
    ambiguous,
    country: ambiguous || countrySet.size === 0 ? null : [...countrySet][0],
    cityKey: ambiguous ? null : (cities[0]?.city ?? (leftover || null)),
  };
}

// So khớp đối xứng: cùng thành phố 100, cùng nước khác/không rõ thành phố 75,
// khác nước hoặc địa chỉ mâu thuẫn 0. Địa danh lạ chỉ khớp 100 khi giống hệt.
export function compareLocations(requestLocation, supplierLocation) {
  const requestPlace = resolvePlace(requestLocation);
  const supplierPlace = resolvePlace(supplierLocation);

  if (requestPlace.ambiguous || supplierPlace.ambiguous) return LOCATION_SCORES.different;
  if (requestPlace.key === supplierPlace.key) return LOCATION_SCORES.sameCity;

  if (
    requestPlace.cityKey
    && requestPlace.cityKey === supplierPlace.cityKey
    && (!requestPlace.country || !supplierPlace.country || requestPlace.country === supplierPlace.country)
  ) {
    return LOCATION_SCORES.sameCity;
  }

  if (requestPlace.country && requestPlace.country === supplierPlace.country) {
    return !requestPlace.cityKey && !supplierPlace.cityKey
      ? LOCATION_SCORES.sameCity
      : LOCATION_SCORES.sameCountry;
  }

  return LOCATION_SCORES.different;
}

export function scoreLocation(request, supplier) {
  const missing = [];
  if (normalizeText(request.location) === '') missing.push('request.location');
  if (normalizeText(supplier.location) === '') missing.push('supplier.location');
  if (missing.length > 0) return { score: 0, missing };

  return { score: compareLocations(request.location, supplier.location), missing };
}

export function scoreCompliance(request, supplier) {
  const required = toNormalizedSet(request.complianceRequirements, normalizeCertification);
  if (!required || required.size === 0) return { score: 100, missing: [] }; // không yêu cầu => không cần dữ liệu supplier

  const held = toNormalizedSet(supplier.certifications, normalizeCertification);
  if (held === null) return { score: 0, missing: ['supplier.certifications'] }; // chưa khai báo
  if (held.size === 0) return { score: 0, missing: [] }; // khai báo rõ là không có chứng chỉ

  let hits = 0;
  for (const item of required) if (held.has(item)) hits += 1;
  return { score: Math.round((hits / required.size) * 100), missing: [] };
}

function validBusinessModel(value) {
  const key = normalizeBusinessModel(value);
  return BUSINESS_MODELS.includes(key) ? key : null;
}

export function scoreBusinessModel(request, supplier) {
  const wanted = validBusinessModel(request.businessModel);
  const offered = validBusinessModel(supplier.businessModel);
  const missing = [];
  if (wanted === null) missing.push('request.businessModel');
  if (offered === null) missing.push('supplier.businessModel');
  if (missing.length > 0) return { score: 0, missing };
  return { score: wanted === offered ? 100 : 0, missing };
}

const SCORERS = Object.freeze({
  industryTags: scoreTags,
  services: scoreServices,
  capacity: scoreCapacity,
  location: scoreLocation,
  compliance: scoreCompliance,
  businessModel: scoreBusinessModel,
});

// ---------- Tổng hợp ----------

// Tính bằng số nguyên để tránh sai số dấu phẩy động: round-half-up(Σ weight×breakdown / 100)
export function computeTotal(breakdown) {
  let sum = 0;
  for (const key of CRITERIA) sum += WEIGHTS[key] * breakdown[key];
  return Math.floor((sum + 50) / 100);
}

export function evaluateSupplier(request, supplier) {
  const breakdown = {};
  const missingData = [];
  for (const key of CRITERIA) {
    const { score, missing } = SCORERS[key](request, supplier);
    breakdown[key] = score;
    missingData.push(...missing);
  }
  return { supplierId: supplier.id, score: computeTotal(breakdown), breakdown, missingData };
}

// score giảm dần -> điểm industryTags giảm dần -> supplierId tăng dần
export function compareResults(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  if (b.breakdown.industryTags !== a.breakdown.industryTags) return b.breakdown.industryTags - a.breakdown.industryTags;
  if (a.supplierId < b.supplierId) return -1;
  if (a.supplierId > b.supplierId) return 1;
  return 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Supplier không có id hợp lệ bị bỏ qua (không thể trả về kết quả định danh được).
export function matchSuppliers(request, suppliers) {
  if (!isPlainObject(request)) throw new TypeError('request must be an object');
  if (!Array.isArray(suppliers)) throw new TypeError('suppliers must be an array');

  return suppliers
    .filter((s) => isPlainObject(s) && typeof s.id === 'string' && s.id.trim() !== '')
    .map((s) => evaluateSupplier(request, s))
    .sort(compareResults);
}

