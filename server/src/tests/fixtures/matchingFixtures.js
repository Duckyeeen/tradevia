// Đáp án TÍNH TAY (không sinh từ code). Điểm = round-half-up(Σ weight×breakdown / 100).
// weight: tags 25, services 25, capacity 20, location 10, compliance 10, businessModel 10.

export const REQUEST_FULL = {
  id: 'request-001', buyerId: 'buyer-001',
  industryTags: ['electronics', 'manufacturing'],
  requiredServices: ['contract manufacturing', 'sourcing'],
  desiredCapacity: 'medium', location: 'Vietnam',
  complianceRequirements: ['ISO 9001'], businessModel: 'B2B',
};

// Request thiếu location, không yêu cầu chứng chỉ
export const REQUEST_PARTIAL = {
  id: 'request-002', buyerId: 'buyer-001',
  industryTags: ['electronics'], requiredServices: ['sourcing'],
  desiredCapacity: 'small', complianceRequirements: [], businessModel: 'B2B',
};

const base = { businessModel: 'B2B' };

export const SUPPLIERS = [
  { ...base, id: 'supplier-001', // khớp gần hoàn hảo
    industryTags: ['Manufacturing', 'Electronics'],
    services: ['Contract Manufacturing', 'Sourcing', 'Packaging'],
    capacity: 'medium', location: 'Da Nang', certifications: ['ISO 9001:2015'] },
  { id: 'supplier-002', businessModel: 'B2C', // khớp một phần
    industryTags: ['electronics'], services: ['sourcing'],
    capacity: 'large', location: 'Hà Nội', certifications: ['ISO 14001'] },
  { id: 'supplier-003', businessModel: 'B2C', // lệch hẳn
    industryTags: ['textile'], services: ['dyeing'],
    capacity: 'large', location: 'Bangkok', certifications: [] },
  { ...base, id: 'supplier-004', // thiếu dữ liệu
    industryTags: ['electronics', 'manufacturing'],
    services: ['contract manufacturing', 'sourcing'],
    capacity: undefined, location: '', certifications: null },
  // Nhóm đồng điểm 45: 006 (tags 0), 007 và 008 (tags 100, giống hệt nhau)
  { id: 'supplier-006', businessModel: 'B2C', industryTags: ['textile'],
    services: ['contract manufacturing', 'sourcing'], capacity: 'medium', location: 'Bangkok', certifications: [] },
  { id: 'supplier-008', businessModel: 'B2C', industryTags: ['electronics', 'manufacturing'],
    services: ['unrelated'], capacity: 'medium', location: 'Bangkok', certifications: [] },
  { id: 'supplier-007', businessModel: 'B2C', industryTags: ['electronics', 'manufacturing'],
    services: ['unrelated'], capacity: 'medium', location: 'Bangkok', certifications: [] },
];

// Với REQUEST_FULL
export const EXPECTED_FULL = {
  'supplier-001': { score: 98, // 2500+2500+2000+750+1000+1000 = 9750
    breakdown: { industryTags: 100, services: 100, capacity: 100, location: 75, compliance: 100, businessModel: 100 }, missingData: [] },
  'supplier-002': { score: 43, // 1250+1250+1000+750+0+0 = 4250
    breakdown: { industryTags: 50, services: 50, capacity: 50, location: 75, compliance: 0, businessModel: 0 }, missingData: [] },
  'supplier-003': { score: 10, // 0+0+1000+0+0+0 = 1000
    breakdown: { industryTags: 0, services: 0, capacity: 50, location: 0, compliance: 0, businessModel: 0 }, missingData: [] },
  'supplier-004': { score: 60, // 2500+2500+0+0+0+1000 = 6000
    breakdown: { industryTags: 100, services: 100, capacity: 0, location: 0, compliance: 0, businessModel: 100 },
    missingData: ['supplier.capacity', 'supplier.location', 'supplier.certifications'] },
  'supplier-006': { score: 45, // 0+2500+2000 = 4500
    breakdown: { industryTags: 0, services: 100, capacity: 100, location: 0, compliance: 0, businessModel: 0 }, missingData: [] },
  'supplier-007': { score: 45, // 2500+0+2000 = 4500
    breakdown: { industryTags: 100, services: 0, capacity: 100, location: 0, compliance: 0, businessModel: 0 }, missingData: [] },
  'supplier-008': { score: 45,
    breakdown: { industryTags: 100, services: 0, capacity: 100, location: 0, compliance: 0, businessModel: 0 }, missingData: [] },
};

// Thứ tự kỳ vọng: 98, 60, rồi nhóm 45 (tags 100: 007 < 008 theo id; tags 0: 006), 43, 10
export const EXPECTED_ORDER_FULL = [
  'supplier-001', 'supplier-004', 'supplier-007', 'supplier-008', 'supplier-006', 'supplier-002', 'supplier-003',
];

// Với REQUEST_PARTIAL
export const EXPECTED_PARTIAL = {
  'supplier-001': { score: 80, // 2500+2500+1000(capacity medium vs small=50)+0+1000+1000 = 8000
    breakdown: { industryTags: 100, services: 100, capacity: 50, location: 0, compliance: 100, businessModel: 100 },
    missingData: ['request.location'] },
  'supplier-004': { score: 70, // 2500+2500+0+0+1000+1000 = 7000 (certifications null KHÔNG phải missing vì không yêu cầu)
    breakdown: { industryTags: 100, services: 100, capacity: 0, location: 0, compliance: 100, businessModel: 100 },
    missingData: ['supplier.capacity', 'request.location', 'supplier.location'] },
};

