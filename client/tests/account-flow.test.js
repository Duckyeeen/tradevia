import test, { beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { createConnection, createRequest, getConnections, getHealth, runMatching } from '../src/services/api.js';
import { resetMockData } from '../src/services/mockAdapter.js';
import { getCurrentAccount, resetDemoAccounts, selectDemoAccount } from '../src/modules/account/accountStore.js';
import { filterSuppliersByAccountTags } from '../src/modules/feed/feedFilters.js';
import { MOCK_SUPPLIERS } from '../src/data/mockData.js';
import { buildBuyerRequestPayload } from '../src/modules/requests/requestPayload.js';

const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = async () => { throw new TypeError('mock backend unavailable'); };
  resetMockData();
  resetDemoAccounts();
});

after(() => { globalThis.fetch = originalFetch; });

test('account-tag feed filter matches any selected tag and handles an empty selection', () => {
  const personalMatches = filterSuppliersByAccountTags(MOCK_SUPPLIERS, ['textile', 'logistics']);
  assert.deepEqual(personalMatches.map((supplier) => supplier.id), ['supplier-003', 'supplier-006']);
  assert.deepEqual(filterSuppliersByAccountTags(MOCK_SUPPLIERS, []), MOCK_SUPPLIERS);
});

test('selected Personal account flows through request, matching, and buyer-filtered connections', async () => {
  await getHealth(); // Put API adapter in mock mode without touching server seed files.
  assert.equal(selectDemoAccount('buyer-002'), true);
  const account = getCurrentAccount();

  const payload = buildBuyerRequestPayload({
    title: 'Tìm đối tác logistics và dệt may',
    description: 'Buyer request for the Personal demo account.',
    industryTags: account.industryTags.join(', '),
    requiredServices: 'sourcing',
    desiredCapacity: 'medium',
    location: 'Vietnam',
    complianceRequirements: '',
    businessModel: 'B2B',
  }, account);
  const request = await createRequest(payload);

  assert.equal(request.buyerId, account.id);
  assert.deepEqual(request.industryTags, account.industryTags);

  const matching = await runMatching(request.id);
  assert.equal(matching.requestId, request.id);
  assert.ok(matching.results.length > 0);

  const connection = await createConnection({
    requestId: request.id,
    buyerId: account.id,
    supplierId: matching.results[0].supplierId,
  });
  assert.equal(connection.buyerId, 'buyer-002');
  assert.equal(connection.status, 'pending');
  assert.deepEqual(await getConnections({ buyerId: 'buyer-002' }), [connection]);
  assert.deepEqual(await getConnections({ buyerId: 'buyer-001' }), []);
});
