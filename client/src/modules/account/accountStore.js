import { useSyncExternalStore } from 'react';
import { DEMO_ACCOUNTS, cloneAccount } from './demoAccounts.js';

let accounts = DEMO_ACCOUNTS.map(cloneAccount);
let currentAccountId = 'buyer-001';
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getCurrentAccount() {
  return accounts.find((account) => account.id === currentAccountId) ?? null;
}

export function subscribeCurrentAccount(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function selectDemoAccount(accountId) {
  if (!accounts.some((account) => account.id === accountId)) return false;
  if (currentAccountId === accountId) return true;
  currentAccountId = accountId;
  notify();
  return true;
}

export function updateCurrentAccount(updates) {
  const account = getCurrentAccount();
  if (!account) return null;

  const updatedAccount = {
    ...account,
    ...updates,
    id: account.id,
    accountType: account.accountType,
    industryTags: updates.industryTags ? [...updates.industryTags] : [...account.industryTags],
  };
  accounts = accounts.map((item) => item.id === account.id ? updatedAccount : item);
  notify();
  return updatedAccount;
}

export function resetDemoAccounts() {
  accounts = DEMO_ACCOUNTS.map(cloneAccount);
  currentAccountId = 'buyer-001';
  notify();
}

export function useCurrentAccount() {
  return useSyncExternalStore(subscribeCurrentAccount, getCurrentAccount, getCurrentAccount);
}
