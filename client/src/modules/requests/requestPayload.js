function splitTextList(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function buildBuyerRequestPayload(formData, currentAccount) {
  return {
    buyerId: currentAccount?.id || 'buyer-001',
    title: formData.title,
    description: formData.description,
    industryTags: splitTextList(formData.industryTags),
    requiredServices: splitTextList(formData.requiredServices),
    desiredCapacity: formData.desiredCapacity,
    location: formData.location,
    complianceRequirements: formData.complianceRequirements
      ? [formData.complianceRequirements.trim()].filter(Boolean)
      : [],
    businessModel: formData.businessModel,
  };
}
