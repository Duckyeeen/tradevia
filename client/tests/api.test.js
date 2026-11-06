import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import api, {
  ApiError, getSuppliers, getSupplierById, createRequest, runMatching, createConnection, getConnections,
  getRequests, getHealth, getApiStatus, subscribeApiStatus, retryLiveApi,
} from '../src/services/api.js';
import { resetMockData } from '../src/services/mockAdapter.js';
import { matchSuppliers } from '../../server/src/services/matchingService.js';
import { MOCK_REQUESTS, MOCK_SUPPLIERS } from '../src/data/mockData.js';

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const realFetch = globalThis.fetch;

beforeEach(() => { globalThis.fetch = realFetch; resetMockData(); retryLiveApi(); });

test('live: trả dữ liệu JSON, gửi header + body POST đúng, query bỏ giá trị rỗng', async () => {
  let seen;
  globalThis.fetch = async (url, init) => { seen = { url, init }; return json(200, { requestId: 'r', results: [] }); };
  assert.deepEqual(await runMatching('request-001'), { requestId: 'r', results: [] });
  assert.equal(seen.url, '/api/matching');
  assert.equal(seen.init.method, 'POST');
  assert.equal(seen.init.headers['Content-Type'], 'application/json');
  assert.equal(seen.init.body, '{"requestId":"request-001"}');

  globalThis.fetch = async (url) => { seen = { url }; return json(200, []); };
  await getSuppliers({ tag: 'electronics', search: '  ' });
  assert.equal(seen.url, '/api/suppliers?tag=electronics');
  await getSuppliers('textile');
  assert.equal(seen.url, '/api/suppliers?tag=textile');
  await getSupplierById('a/b');
  assert.equal(seen.url, '/api/suppliers/a%2Fb');
  assert.equal(getApiStatus().source, 'live');
});

test('live: lỗi backend 4xx được giữ nguyên status/code/details và KHÔNG fallback', async () => {
  globalThis.fetch = async () => json(400, { error: { code: 'VALIDATION_ERROR', message: 'bad', details: [{ field: 'title', message: 'title is required' }] } });
  await assert.rejects(createRequest({}), (e) => e instanceof ApiError && e.status === 400 && e.code === 'VALIDATION_ERROR' && e.details[0].field === 'title' && e.userMessage === 'title is required');

  globalThis.fetch = async () => json(409, { error: { code: 'CONFLICT', message: 'dup' } });
  await assert.rejects(createConnection({}), (e) => e.status === 409 && e.code === 'CONFLICT');

  globalThis.fetch = async () => json(500, { error: { code: 'INTERNAL_ERROR', message: 'boom' } });
  await assert.rejects(getHealth(), (e) => e.status === 500 && e.code === 'INTERNAL_ERROR');
  assert.equal(getApiStatus().source, 'live'); // lỗi 500 có JSON chuẩn là lỗi thật, không phải "backend chết"
});

test('auto: backend không chạy (fetch reject) -> chuyển sang mock, thông báo subscriber', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  const events = [];
  const off = subscribeApiStatus((s) => events.push(s));
  const rows = await getSuppliers();
  assert.equal(rows.length, MOCK_SUPPLIERS.length);
  assert.deepEqual(getApiStatus(), { source: 'mock', reason: 'backend-unreachable' });
  assert.equal(events.length, 1);
  off();
  // đã ở mock: không gọi fetch nữa
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return json(200, []); };
  await getSuppliers();
  assert.equal(calls, 0);
  retryLiveApi();
  await getSuppliers();
  assert.equal(calls, 1);
});

test('auto: proxy lỗi (500 rỗng) hoặc trả index.html (200) -> BAD_RESPONSE -> fallback mock', async () => {
  globalThis.fetch = async () => new Response('', { status: 500 });
  assert.equal((await getRequests()).length, MOCK_REQUESTS.length);
  assert.equal(getApiStatus().source, 'mock');

  retryLiveApi();
  globalThis.fetch = async () => new Response('<!doctype html><html></html>', { status: 200 });
  assert.equal((await getRequests()).length, MOCK_REQUESTS.length);
  assert.equal(getApiStatus().source, 'mock');
});

test('caller huỷ request (AbortController) -> ABORTED, không fallback', async () => {
  globalThis.fetch = (url, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  });
  const ac = new AbortController();
  const p = getRequests({ signal: ac.signal });
  ac.abort();
  await assert.rejects(p, (e) => e.code === 'ABORTED' && e.status === 0);
  assert.equal(getApiStatus().source, 'live');
});

test('runMatching không gọi mạng khi thiếu requestId', async () => {
  globalThis.fetch = async () => { throw new Error('must not be called'); };
  await assert.rejects(runMatching(''), (e) => e.status === 400 && e.code === 'VALIDATION_ERROR');
  await assert.rejects(runMatching(undefined), (e) => e.code === 'VALIDATION_ERROR');
});

// ----- mock đóng vai backend đầy đủ -----
async function toMock() {
  globalThis.fetch = async () => { throw new TypeError('down'); };
  await getHealth();
}

test('mock: suppliers filter tag/search (không phân biệt dấu/hoa thường), detail 404', async () => {
  await toMock();
  assert.deepEqual((await getSuppliers('Electronics')).map((s) => s.id), ['supplier-001', 'supplier-002', 'supplier-004', 'supplier-005']);
  assert.deepEqual((await getSuppliers({ search: 'HÀ NỘI' })).length, 0); // location không nằm trong search
  assert.deepEqual((await getSuppliers({ search: 'dyeing' })).map((s) => s.id), ['supplier-003']);
  assert.equal((await getSupplierById('supplier-001')).companyName, 'Da Nang Precision Electronics');
  await assert.rejects(getSupplierById('nope'), (e) => e.status === 404 && e.code === 'NOT_FOUND');
});

test('mock: createRequest validate + sinh id + hiện trong danh sách (mới nhất trước)', async () => {
  await toMock();
  await assert.rejects(createRequest({ title: 'x' }), (e) => e.status === 400 && e.details.length >= 5);
  await assert.rejects(createRequest({ buyerId: 'b', title: 't', industryTags: ['a'], requiredServices: ['s'], desiredCapacity: 'huge', businessModel: 'B2B' }), (e) => e.details[0].field === 'desiredCapacity');
  const created = await createRequest({ buyerId: 'buyer-009', title: ' New ', industryTags: ['textile'], requiredServices: ['dyeing'], desiredCapacity: 'Large', businessModel: 'b2b', location: 'Bangkok' });
  assert.equal(created.id, 'request-003');
  assert.equal(created.title, 'New');
  assert.equal(created.desiredCapacity, 'large');
  assert.equal(created.businessModel, 'B2B');
  assert.equal((await getRequests())[0].id, 'request-003');
});

test('mock: matching dùng đúng matchingService của backend, đúng shape, 404/400', async () => {
  await toMock();
  const res = await runMatching('request-001');
  assert.deepEqual(res, { requestId: 'request-001', results: matchSuppliers(MOCK_REQUESTS[0], MOCK_SUPPLIERS) });
  assert.ok(res.results.every((r, i, a) => i === 0 || a[i - 1].score >= r.score));
  assert.equal(res.results[0].supplierId, 'supplier-001');
  assert.ok(res.results.find((r) => r.supplierId === 'supplier-004').missingData.includes('supplier.capacity'));
  await assert.rejects(runMatching('request-999'), (e) => e.status === 404);
  const created = await createRequest({ buyerId: 'buyer-001', title: 'T', industryTags: ['logistics'], requiredServices: ['freight forwarding'], desiredCapacity: 'medium', businessModel: 'B2B' });
  assert.equal((await runMatching(created.id)).requestId, created.id); // request mới tạo cũng match được
});

test('mock: connections tạo / lọc / 404 / sai buyer / 409 trùng', async () => {
  await toMock();
  const body = { requestId: 'request-001', buyerId: 'buyer-001', supplierId: 'supplier-001' };
  const c = await createConnection(body);
  assert.equal(c.id, 'connection-001');
  assert.equal(c.status, 'pending');
  assert.ok(!Number.isNaN(Date.parse(c.createdAt)));
  await assert.rejects(createConnection(body), (e) => e.status === 409 && e.code === 'CONFLICT');
  await assert.rejects(createConnection({ ...body, supplierId: 'supplier-999' }), (e) => e.status === 404);
  await assert.rejects(createConnection({ ...body, requestId: 'request-999' }), (e) => e.status === 404);
  await assert.rejects(createConnection({ ...body, buyerId: 'buyer-777', supplierId: 'supplier-002' }), (e) => e.status === 400 && e.details[0].field === 'buyerId');
  await assert.rejects(createConnection({}), (e) => e.status === 400 && e.details.length === 3);
  assert.equal((await getConnections({ buyerId: 'buyer-001' })).length, 1);
  assert.equal((await getConnections({ supplierId: 'supplier-002' })).length, 0);
});

test('mock: kết quả trả về là bản sao, sửa không ảnh hưởng dữ liệu gốc', async () => {
  await toMock();
  (await getSuppliers())[0].companyName = 'HACKED';
  assert.equal((await getSupplierById('supplier-001')).companyName, 'Da Nang Precision Electronics');
});

test('default export gồm đủ 8 hàm API', () => {
  for (const k of ['getHealth', 'getSuppliers', 'getSupplierById', 'getRequests', 'createRequest', 'runMatching', 'getConnections', 'createConnection']) {
    assert.equal(typeof api[k], 'function', k);
  }
});

test('4xx không có JSON (vd Express 404 HTML) giữ HTTP_404 và KHÔNG fallback', async () => {
  globalThis.fetch = async () => new Response('<html>Cannot GET /api/x</html>', { status: 404 });
  await assert.rejects(getRequests(), (e) => e.status === 404 && e.code === 'HTTP_404');
  assert.equal(getApiStatus().source, 'live');
});

