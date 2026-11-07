import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const serverRoot = join(here, '..', '..');
const originalDataDir = process.env.TRADEVIA_DATA_DIR;
const testDataDir = await mkdtemp(join(tmpdir(), 'tradevia-api-'));
for (const filename of ['requests.json', 'suppliers.json', 'connections.json']) {
  await copyFile(join(serverRoot, 'data', filename), join(testDataDir, filename));
}
process.env.TRADEVIA_DATA_DIR = testDataDir;
const { app } = await import('../app.js');
let server;
let baseUrl;

test('API endpoints validate data and complete request-to-connection flow without touching seed data', async (t) => {
  t.after(async () => {
    if (server) await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
    if (originalDataDir === undefined) delete process.env.TRADEVIA_DATA_DIR;
    else process.env.TRADEVIA_DATA_DIR = originalDataDir;
    await rm(testDataDir, { recursive: true, force: true });
  });

  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, options) => {
    const response = await fetch(`${baseUrl}${path}`, options);
    return { response, body: await response.json() };
  };

  const health = await request('/api/health');
  assert.equal(health.response.status, 200);
  assert.deepEqual(health.body, { status: 'ok', service: 'tradevia-api' });

  const suppliers = await request('/api/suppliers');
  assert.equal(suppliers.response.status, 200);
  assert.equal(suppliers.body.length, 4);
  const supplier = await request('/api/suppliers/supplier-001');
  assert.equal(supplier.response.status, 200);
  assert.equal(supplier.body.companyName, 'Mekong Circuit Works');
  assert.equal((await request('/api/suppliers/not-found')).response.status, 404);

  const invalidRequest = await request('/api/requests', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Missing data' }),
  });
  assert.equal(invalidRequest.response.status, 400);
  assert.ok(invalidRequest.body.fields.includes('buyerId'));
  const invalidArrays = await request('/api/requests', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ buyerId: 'buyer-001', title: 'x', industryTags: [], requiredServices: 'assembly', desiredCapacity: 'huge', location: 'Vietnam', businessModel: 'B2B' }),
  });
  assert.equal(invalidArrays.response.status, 400);
  assert.ok(invalidArrays.body.fields.includes('industryTags'));
  assert.ok(invalidArrays.body.fields.includes('requiredServices'));
  assert.ok(invalidArrays.body.fields.includes('desiredCapacity'));
  const existingRequests = await request('/api/requests');
  assert.equal(existingRequests.response.status, 200);
  assert.equal(existingRequests.body[0].id, 'request-001');

  const created = await request('/api/requests', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ buyerId: ' buyer-002 ', title: '  IoT partner  ', industryTags: [' electronics '], requiredServices: [' assembly '], desiredCapacity: 'MEDIUM', complianceRequirements: [' ISO 9001 '], businessModel: 'b2b' }),
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.body.title, 'IoT partner');
  assert.equal(created.body.buyerId, 'buyer-002');
  assert.equal(created.body.desiredCapacity, 'medium');
  assert.equal(created.body.businessModel, 'B2B');
  assert.deepEqual(created.body.industryTags, ['electronics']);
  assert.equal(created.body.location, '');

  assert.equal((await request('/api/matching', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).response.status, 400);
  const matches = await request('/api/matching', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ requestId: created.body.id }),
  });
  assert.equal(matches.response.status, 200);
  assert.equal(matches.body.requestId, created.body.id);
  assert.equal(matches.body.results.length, 4);

  const noRequest = await request('/api/connections', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ requestId: 'missing', buyerId: 'buyer-001', supplierId: 'supplier-001' }),
  });
  assert.equal(noRequest.response.status, 404);
  const noSupplier = await request('/api/connections', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ requestId: 'request-001', buyerId: 'buyer-001', supplierId: 'missing' }),
  });
  assert.equal(noSupplier.response.status, 404);
  const missingConnectionFields = await request('/api/connections', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}),
  });
  assert.equal(missingConnectionFields.response.status, 400);
  const wrongOwner = await request('/api/connections', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ requestId: 'request-001', buyerId: 'buyer-002', supplierId: 'supplier-002' }),
  });
  assert.equal(wrongOwner.response.status, 400);

  const connection = await request('/api/connections', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ requestId: created.body.id, buyerId: created.body.buyerId, supplierId: matches.body.results[0].supplierId }),
  });
  assert.equal(connection.response.status, 201);
  assert.equal(connection.body.status, 'pending');
  const duplicate = await request('/api/connections', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ requestId: created.body.id, buyerId: created.body.buyerId, supplierId: matches.body.results[0].supplierId }),
  });
  assert.equal(duplicate.response.status, 409);
  const listed = await request(`/api/connections?buyerId=${created.body.buyerId}`);
  assert.ok(listed.body.some((item) => item.id === connection.body.id));

  const seedConnections = JSON.parse(await readFile(join(serverRoot, 'data', 'connections.json'), 'utf8'));
  assert.equal(seedConnections.some((item) => item.id === connection.body.id), false);
});
