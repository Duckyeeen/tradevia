import { normalizeText } from '../utils/normalize.js';

// Trọng số nguyên, tổng = 100. Thứ tự key cũng là thứ tự hiển thị breakdown/missingData.
export const WEIGHTS = Object.freeze({
  industryTags: 25,
  services: 25,
  capacity: 20,
  location: 10,
  compliance: 10,
  businessModel: 10,
});
export const CRITERIA = Object.freeze(Object.keys(WEIGHTS));

export const CAPACITY_LEVELS = Object.freeze({ small: 1, medium: 2, large: 3 });
// Điểm theo độ lệch cấp: 0 cấp, 1 cấp, 2 cấp
export const CAPACITY_SCORES = Object.freeze([100, 50, 0]);

export const BUSINESS_MODELS = Object.freeze(['b2b', 'b2c', 'b2b2c']);

export const LOCATION_SCORES = Object.freeze({ sameCity: 100, sameCountry: 75, different: 0 });

// Bảng tra địa lý (bổ sung thêm khi cần). Alias được chuẩn hóa khi nạp.
const COUNTRIES = {
  vietnam: ['vietnam', 'viet nam', 'vn'],
  thailand: ['thailand'],
  china: ['china'],
  japan: ['japan'],
  'south korea': ['south korea', 'korea'],
  singapore: ['singapore'],
  malaysia: ['malaysia'],
  indonesia: ['indonesia'],
  india: ['india'],
  usa: ['usa', 'us', 'united states'],
};

const CITIES = {
  'da-nang': { country: 'vietnam', aliases: ['da nang', 'danang'] },
  hanoi: { country: 'vietnam', aliases: ['hanoi', 'ha noi'] },
  'ho-chi-minh': { country: 'vietnam', aliases: ['ho chi minh city', 'ho chi minh', 'hcmc', 'tp hcm', 'saigon', 'sai gon'] },
  'hai-phong': { country: 'vietnam', aliases: ['hai phong', 'haiphong'] },
  'can-tho': { country: 'vietnam', aliases: ['can tho', 'cantho'] },
  'binh-duong': { country: 'vietnam', aliases: ['binh duong'] },
  'dong-nai': { country: 'vietnam', aliases: ['dong nai'] },
  hue: { country: 'vietnam', aliases: ['hue'] },
  'nha-trang': { country: 'vietnam', aliases: ['nha trang'] },
  bangkok: { country: 'thailand', aliases: ['bangkok'] },
  shenzhen: { country: 'china', aliases: ['shenzhen'] },
  shanghai: { country: 'china', aliases: ['shanghai'] },
  tokyo: { country: 'japan', aliases: ['tokyo'] },
  osaka: { country: 'japan', aliases: ['osaka'] },
  seoul: { country: 'south korea', aliases: ['seoul'] },
};

// alias đã chuẩn hóa -> { city: string|null, country: string }
export const PLACE_LOOKUP = (() => {
  const map = new Map();
  for (const [country, aliases] of Object.entries(COUNTRIES)) {
    for (const alias of aliases) map.set(normalizeText(alias), { city: null, country });
  }
  for (const [city, { country, aliases }] of Object.entries(CITIES)) {
    for (const alias of aliases) map.set(normalizeText(alias), { city, country });
  }
  return map;
})();

// Từ mô tả địa chỉ không mang thông tin định vị khi tách phần chưa nhận diện.
export const LOCATION_STOPWORDS = Object.freeze(new Set([
  'city', 'province', 'district', 'tp', 'tinh', 'thanh', 'pho',
]));

// Dùng để dò cụm alias dài nhất trước (ví dụ "south korea" trước "korea").
export const PLACE_MAX_TOKENS = Math.max(
  ...[...PLACE_LOOKUP.keys()].map((alias) => alias.split(' ').length),
);

