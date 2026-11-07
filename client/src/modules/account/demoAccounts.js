export const INDUSTRY_TAGS = [
  'electronics',
  'manufacturing',
  'logistics',
  'textile',
  'sustainability',
  'automation',
];

export const DEMO_ACCOUNTS = [
  {
    id: 'buyer-001',
    accountType: 'business',
    displayName: 'Minh Nguyen',
    companyName: 'TRADEVIA Demo Buyer',
    industryTags: ['electronics', 'manufacturing'],
  },
  {
    id: 'buyer-002',
    accountType: 'personal',
    displayName: 'Linh Tran',
    companyName: '',
    industryTags: ['textile', 'logistics'],
  },
];

export function cloneAccount(account) {
  return { ...account, industryTags: [...account.industryTags] };
}
