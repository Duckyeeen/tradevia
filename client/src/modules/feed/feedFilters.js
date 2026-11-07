export function filterSuppliersByAccountTags(suppliers, accountTags) {
  const tags = new Set(accountTags.map((tag) => tag.trim().toLowerCase()).filter(Boolean));
  if (tags.size === 0) return suppliers;

  return suppliers.filter((supplier) =>
    (supplier.industryTags ?? []).some((tag) => tags.has(tag.trim().toLowerCase()))
  );
}
