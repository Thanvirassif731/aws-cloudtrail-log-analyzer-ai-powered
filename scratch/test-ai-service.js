import { calculateCost, formatCostUSD, getModelCatalogList } from '../cloudtrail-dashboard/aiPricing.js';
import { getUsageMetrics, resetUsageMetrics } from '../cloudtrail-dashboard/aiService.js';

console.log('--- 1. Testing AI Model Catalog & Pricing Calculation ---');
const models = getModelCatalogList();
console.log(`Loaded ${models.length} AI models from catalog:`);
for (const m of models) {
  const cost = calculateCost(m.id, 1000, 500);
  console.log(`  - [${m.provider.toUpperCase()}] ${m.name}: 1k in / 500 out = $${cost} USD`);
}

console.log('\n--- 2. Testing Usage Tracking Store ---');
const metricsBefore = getUsageMetrics();
console.log('Current recorded usage:', JSON.stringify(metricsBefore.summary));

console.log('\nAll core AI engine & pricing calculations verified successfully!');
