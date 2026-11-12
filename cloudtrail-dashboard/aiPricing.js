// AI Model Catalog & Pricing Calculator
// Rates are based on official standard per 1,000,000 (1M) tokens

export const MODEL_CATALOG = {
  // Google Gemini API
  'gemini-3.8-flash': {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'gemini',
    description: 'Fast, state-of-the-art multimodal reasoning for deep log diagnostics',
    inputRatePer1M: 0.075,
    outputRatePer1M: 0.30,
    contextWindow: '1M tokens',
    speed: 'Ultra-Fast',
    badge: 'Recommended',
    recommended: true
  },
  'gemini-3.5-flash-lite': {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    provider: 'gemini',
    description: 'Ultra cost-efficient model for high-frequency lightweight analyses',
    inputRatePer1M: 0.0375,
    outputRatePer1M: 0.15,
    contextWindow: '1M tokens',
    speed: 'Fastest',
    badge: 'Lowest Cost',
    recommended: false
  },

  // AWS Bedrock API
  'us.anthropic.claude-3-5-sonnet-20241022-v2:0': {
    id: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    name: 'Claude 3.5 Sonnet v2 (US)',
    provider: 'bedrock',
    description: 'AWS Bedrock Cross-Region inference profile for Claude 3.5 Sonnet v2',
    inputRatePer1M: 3.00,
    outputRatePer1M: 15.00,
    contextWindow: '200K tokens',
    speed: 'High Reasoning',
    badge: 'Recommended',
    recommended: true
  },
  'anthropic.claude-3-5-sonnet-20241022-v2:0': {
    id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    name: 'Claude 3.5 Sonnet v2',
    provider: 'bedrock',
    description: 'Direct regional model ID for Claude 3.5 Sonnet v2',
    inputRatePer1M: 3.00,
    outputRatePer1M: 15.00,
    contextWindow: '200K tokens',
    speed: 'High Reasoning',
    badge: 'Enterprise',
    recommended: false
  },
  'amazon.nova-micro-v1:0': {
    id: 'amazon.nova-micro-v1:0',
    name: 'Amazon Nova Micro',
    provider: 'bedrock',
    description: 'AWS-native lightweight model with ultra-low latency and budget pricing',
    inputRatePer1M: 0.035,
    outputRatePer1M: 0.14,
    contextWindow: '128K tokens',
    speed: 'Ultra-Fast',
    badge: 'AWS Budget',
    recommended: false
  },
  'amazon.titan-text-express-v1': {
    id: 'amazon.titan-text-express-v1',
    name: 'Amazon Titan Express',
    provider: 'bedrock',
    description: 'Standard general-purpose text generation on AWS Bedrock',
    inputRatePer1M: 0.20,
    outputRatePer1M: 0.60,
    contextWindow: '8K tokens',
    speed: 'Fast',
    badge: 'AWS Native',
    recommended: false
  }
};

/**
 * Calculates exact cost in USD for a given model and token count
 * @param {string} modelId
 * @param {number} inputTokens
 * @param {number} outputTokens
 * @returns {number} Cost in USD
 */
export function calculateCost(modelId, inputTokens = 0, outputTokens = 0) {
  const model = MODEL_CATALOG[modelId] || MODEL_CATALOG['gemini-3.8-flash'];
  const inputCost = (inputTokens / 1_000_000) * model.inputRatePer1M;
  const outputCost = (outputTokens / 1_000_000) * model.outputRatePer1M;
  return Number((inputCost + outputCost).toFixed(7));
}

/**
 * Returns formatted USD string (e.g., "$0.00012" or "$0.00")
 * @param {number} amount
 * @returns {string}
 */
export function formatCostUSD(amount = 0) {
  if (!amount || amount === 0) return '$0.000000';
  if (amount < 0.00001) return `$${amount.toFixed(7)}`;
  if (amount < 0.01) return `$${amount.toFixed(5)}`;
  return `$${amount.toFixed(4)}`;
}

/**
 * Returns full catalog list
 */
export function getModelCatalogList() {
  return Object.values(MODEL_CATALOG);
}

/**
 * Returns single model metadata
 */
export function getModelMetadata(modelId) {
  return MODEL_CATALOG[modelId] || MODEL_CATALOG['gemini-3.8-flash'];
}
