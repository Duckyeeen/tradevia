// Dữ liệu mock cho frontend (khi backend chưa sẵn sàng / tắt). Cùng shape với server/data/*.json.
// Thiết kế để kết quả matching với request-001 chênh lệch rõ ràng.
export const MOCK_SUPPLIERS = [
  { id: 'supplier-001', companyName: 'Da Nang Precision Electronics', industryTags: ['manufacturing', 'electronics'],
    services: ['contract manufacturing', 'sourcing', 'packaging'], businessModel: 'B2B', capacity: 'medium',
    location: 'Da Nang', certifications: ['ISO 9001:2015'],
    description: 'Contract manufacturer of PCBs and consumer electronics for export markets.' },
  { id: 'supplier-002', companyName: 'Hanoi Component Trading', industryTags: ['electronics'],
    services: ['sourcing'], businessModel: 'B2C', capacity: 'large', location: 'Hanoi', certifications: ['ISO 14001'],
    description: 'Electronic component distributor with a large retail network.' },
  { id: 'supplier-003', companyName: 'Bangkok Textile House', industryTags: ['textile'],
    services: ['dyeing'], businessModel: 'B2C', capacity: 'large', location: 'Bangkok', certifications: [],
    description: 'Fabric dyeing and finishing for apparel brands.' },
  { id: 'supplier-004', companyName: 'Hue Tech Assembly', industryTags: ['electronics', 'manufacturing'],
    services: ['contract manufacturing', 'sourcing'], businessModel: 'B2B',
    description: 'New supplier: capacity, location and certifications not yet provided.' },
  { id: 'supplier-005', companyName: 'Saigon Smart Manufacturing', industryTags: ['manufacturing', 'electronics', 'automation'],
    services: ['contract manufacturing', 'quality inspection'], businessModel: 'B2B', capacity: 'large',
    location: 'Ho Chi Minh City', certifications: ['ISO 9001', 'ISO 14001'],
    description: 'Large-scale EMS provider with automated production lines.' },
  { id: 'supplier-006', companyName: 'Haiphong Logistics Partners', industryTags: ['logistics'],
    services: ['sourcing', 'freight forwarding'], businessModel: 'B2B', capacity: 'medium',
    location: 'Hai Phong', certifications: ['ISO 9001'],
    description: 'Sourcing and freight services for manufacturers in northern Vietnam.' },
];

export const MOCK_REQUESTS = [
  { id: 'request-001', buyerId: 'buyer-001', title: 'Find an electronics manufacturer',
    description: 'Looking for a qualified manufacturing partner for a new IoT device.',
    industryTags: ['electronics', 'manufacturing'], requiredServices: ['contract manufacturing', 'sourcing'],
    desiredCapacity: 'medium', location: 'Vietnam', complianceRequirements: ['ISO 9001'], businessModel: 'B2B' },
  { id: 'request-002', buyerId: 'buyer-001', title: 'Sourcing partner for components',
    description: 'Need help sourcing electronic components in small batches.',
    industryTags: ['electronics'], requiredServices: ['sourcing'],
    desiredCapacity: 'small', location: '', complianceRequirements: [], businessModel: 'B2B' },
];

export const MOCK_CONNECTIONS = [];

