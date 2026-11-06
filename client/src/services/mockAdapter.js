// Backend giả chạy trong bộ nhớ trình duyệt, mô phỏng đúng 8 endpoint + mã lỗi của server thật.
// Matching dùng CHÍNH matchingService của backend => điểm mock luôn khớp điểm thật.
// Lưu ý: dữ liệu mock mất khi tải lại trang (cố ý, để demo luôn bắt đầu sạch).
import { matchSuppliers } from '../../../server/src/services/matchingService.js';
import { normalizeText } from '../../../server/src/utils/normalize.js';
import { ApiError } from './ApiError.js';
import { MOCK_SUPPLIERS, MOCK_REQUESTS, MOCK_CONNECTIONS } from '../data/mockData.js';

const CAPACITIES = ['small', 'medium', 'large'];
const BUSINESS_MODELS = ['B2B', 'B2C', 'B2B2C'];

const clone = (v) => structuredClone(v);
const freshDb = () => ({
  suppliers: clone(MOCK_SUPPLIERS),
  requests: clone(MOCK_REQUESTS),
  connections: clone(MOCK_CONNECTIONS),
});

let db = freshDb();
let latencyMs = typeof window === 'undefined' ? 0 : 150;

export function resetMockData() { db = freshDb(); }
export function setMockLatency(ms) { latencyMs = Math.max(0, Number(ms) || 0); }

const delay = () => (latencyMs ? new Promise((r) => setTimeout(r, latencyMs)) : Promise.resolve());
const isText = (v) => typeof v === 'string' && v.trim() !== '';
const isTextList = (v) => Array.isArray(v) && v.length > 0 && v.every(isText);

const notFound = (message) => new ApiError({ status: 404, code: 'NOT_FOUND', message });
const invalid = (details) =>
  new ApiError({ status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed', details });

function nextId(prefix, rows) {
  const max = rows.reduce((m, r) => {
    const n = Number(String(r.id).split('-').pop());
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

// ---------- handlers ----------
function listSuppliers(query) {
  let rows = db.suppliers;
  if (isText(query.tag)) {
    const tag = normalizeText(query.tag);
    rows = rows.filter((s) => (s.industryTags ?? []).some((t) => normalizeText(t) === tag));
  }
  if (isText(query.search)) {
    const q = normalizeText(query.search);
    rows = rows.filter((s) =>
      [s.companyName, s.description, ...(s.services ?? []), ...(s.industryTags ?? [])]
        .some((text) => normalizeText(text).includes(q)));
  }
  return clone(rows);
}

function getSupplier(id) {
  const found = db.suppliers.find((s) => s.id === id);
  if (!found) throw notFound('Supplier not found');
  return clone(found);
}

function createRequest(body = {}) {
  const details = [];
  if (!isText(body.buyerId)) details.push({ field: 'buyerId', message: 'buyerId is required' });
  if (!isText(body.title)) details.push({ field: 'title', message: 'title is required' });
  if (!isTextList(body.industryTags)) details.push({ field: 'industryTags', message: 'industryTags must be a non-empty array' });
  if (!isTextList(body.requiredServices)) details.push({ field: 'requiredServices', message: 'requiredServices must be a non-empty array' });
  if (!CAPACITIES.includes(normalizeText(body.desiredCapacity))) details.push({ field: 'desiredCapacity', message: 'desiredCapacity must be small, medium or large' });
  if (!BUSINESS_MODELS.includes(String(body.businessModel ?? '').toUpperCase().replace(/[^A-Z0-9]/g, ''))) details.push({ field: 'businessModel', message: 'businessModel must be B2B, B2C or B2B2C' });
  if (body.complianceRequirements != null && !Array.isArray(body.complianceRequirements)) details.push({ field: 'complianceRequirements', message: 'complianceRequirements must be an array' });
  if (details.length) throw invalid(details);

  const record = {
    id: nextId('request', db.requests),
    buyerId: body.buyerId.trim(),
    title: body.title.trim(),
    description: isText(body.description) ? body.description.trim() : '',
    industryTags: body.industryTags.map((t) => t.trim()),
    requiredServices: body.requiredServices.map((t) => t.trim()),
    desiredCapacity: normalizeText(body.desiredCapacity),
    location: isText(body.location) ? body.location.trim() : '',
    complianceRequirements: (body.complianceRequirements ?? []).filter(isText).map((t) => t.trim()),
    businessModel: String(body.businessModel).toUpperCase().replace(/[^A-Z0-9]/g, ''),
  };
  db.requests.push(record);
  return clone(record);
}

function runMatching(body = {}) {
  if (!isText(body.requestId)) throw invalid([{ field: 'requestId', message: 'requestId is required' }]);
  const request = db.requests.find((r) => r.id === body.requestId);
  if (!request) throw notFound('Request not found');
  return { requestId: request.id, results: matchSuppliers(request, db.suppliers) };
}

function listConnections(query) {
  let rows = db.connections;
  if (isText(query.buyerId)) rows = rows.filter((c) => c.buyerId === query.buyerId);
  if (isText(query.supplierId)) rows = rows.filter((c) => c.supplierId === query.supplierId);
  return clone(rows);
}

function createConnection(body = {}) {
  const details = [];
  for (const field of ['requestId', 'buyerId', 'supplierId']) {
    if (!isText(body[field])) details.push({ field, message: `${field} is required` });
  }
  if (details.length) throw invalid(details);

  const request = db.requests.find((r) => r.id === body.requestId);
  if (!request) throw notFound('Request not found');
  if (!db.suppliers.some((s) => s.id === body.supplierId)) throw notFound('Supplier not found');
  if (request.buyerId !== body.buyerId) throw invalid([{ field: 'buyerId', message: 'buyerId does not match the request owner' }]);
  if (db.connections.some((c) => c.requestId === body.requestId && c.supplierId === body.supplierId)) {
    throw new ApiError({ status: 409, code: 'CONFLICT', message: 'Connection already exists for this request and supplier' });
  }

  const record = {
    id: nextId('connection', db.connections),
    requestId: body.requestId,
    buyerId: body.buyerId,
    supplierId: body.supplierId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  db.connections.push(record);
  return clone(record);
}

// ---------- router ----------
export async function handleMock(method, path, { query = {}, body } = {}) {
  await delay();
  const m = method.toUpperCase();
  const detail = path.match(/^\/api\/suppliers\/([^/]+)$/);

  if (m === 'GET' && path === '/api/health') return { status: 'ok', mode: 'mock' };
  if (m === 'GET' && path === '/api/suppliers') return listSuppliers(query);
  if (m === 'GET' && detail) return getSupplier(decodeURIComponent(detail[1]));
  if (m === 'GET' && path === '/api/requests') return clone([...db.requests].reverse()); // mới nhất trước
  if (m === 'POST' && path === '/api/requests') return createRequest(body);
  if (m === 'POST' && path === '/api/matching') return runMatching(body);
  if (m === 'GET' && path === '/api/connections') return listConnections(query);
  if (m === 'POST' && path === '/api/connections') return createConnection(body);

  throw notFound(`Route not found: ${m} ${path}`);
}

