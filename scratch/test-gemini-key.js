import { testAIConnection } from '../cloudtrail-dashboard/aiService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(__dirname, '..', 'cloudtrail-dashboard', 'config.json');

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const key = config.ai?.geminiApiKey;

console.log('Testing key stored in config.json:', key ? `${key.substring(0, 8)}...` : 'NONE');

try {
  const result = await testAIConnection({
    provider: 'gemini',
    apiKey: key,
    modelId: config.ai?.geminiModel || 'gemini-3.5-flash-lite'
  });
  console.log('Test Connection SUCCESS:', JSON.stringify(result));
} catch (err) {
  console.log('Test Connection FAILED:', err.message);
}
