import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_ACCOUNTS, INDUSTRY_TAGS, cloneAccount } from './demoAccounts.js';
import {
  getCurrentAccount,
  resetDemoAccounts,
  selectDemoAccount,
  subscribeCurrentAccount,
  updateCurrentAccount,
} from './accountStore.js';

test('demo accounts use distinct buyer IDs and a consistent account shape', () => {
  assert.equal(DEMO_ACCOUNTS.length, 2);
  assert.equal(new Set(DEMO_ACCOUNTS.map((account) => account.id)).size, 2);
  for (const account of DEMO_ACCOUNTS) {
    assert.ok(['business', 'personal'].includes(account.accountType));
    assert.equal(typeof account.displayName, 'string');
    assert.equal(typeof account.companyName, 'string');
    assert.ok(account.industryTags.every((tag) => INDUSTRY_TAGS.includes(tag)));
  }
});

test('Business demo keeps the seeded buyer ID and tags', () => {
  const business = DEMO_ACCOUNTS.find((account) => account.accountType === 'business');
  assert.equal(business.id, 'buyer-001');
  assert.deepEqual(business.industryTags, ['electronics', 'manufacturing']);
});

test('account selection and edits notify subscribers and remain per account', () => {
  resetDemoAccounts();
  let notifications = 0;
  const unsubscribe = subscribeCurrentAccount(() => { notifications += 1; });

  updateCurrentAccount({ companyName: 'Edited Buyer', industryTags: ['automation'] });
  assert.equal(getCurrentAccount().companyName, 'Edited Buyer');
  assert.deepEqual(getCurrentAccount().industryTags, ['automation']);

  assert.equal(selectDemoAccount('buyer-002'), true);
  assert.equal(getCurrentAccount().accountType, 'personal');
  assert.equal(getCurrentAccount().id, 'buyer-002');

  selectDemoAccount('buyer-001');
  assert.equal(getCurrentAccount().companyName, 'Edited Buyer');
  assert.equal(notifications, 3);
  unsubscribe();
  resetDemoAccounts();
});

test('invalid account IDs are rejected and account copies clone tags', () => {
  resetDemoAccounts();
  assert.equal(selectDemoAccount('buyer-missing'), false);
  const copy = cloneAccount(DEMO_ACCOUNTS[0]);
  copy.industryTags.push('logistics');
  assert.equal(DEMO_ACCOUNTS[0].industryTags.includes('logistics'), false);
});
