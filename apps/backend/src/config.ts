import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const projectDir = process.env.PROJECT_DIR || path.join(process.cwd(), 'projects');
const allowedDirs = (process.env.ALLOWED_DIRS || '').split(',').map(d => d.trim()).filter(Boolean);

// Ensure project dir is in allowed dirs
if (!allowedDirs.includes(projectDir)) {
    allowedDirs.push(projectDir);
}

const llmProvider = (process.env.LLM_PROVIDER || 'anthropic') as 'anthropic' | 'openai' | 'gemini' | 'custom' | 'copilot';

// Validate that the required API key is set for the selected provider
function validateConfig() {
  const provider = llmProvider;
  if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
    console.warn('Warning: LLM_PROVIDER is "anthropic" but ANTHROPIC_API_KEY is not set.');
  } else if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    console.warn('Warning: LLM_PROVIDER is "openai" but OPENAI_API_KEY is not set.');
  } else if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
    console.warn('Warning: LLM_PROVIDER is "gemini" but GEMINI_API_KEY is not set.');
  } else if (provider === 'custom' && !process.env.LLM_BASE_URL) {
    console.warn('Warning: LLM_PROVIDER is "custom" but LLM_BASE_URL is not set.');
  }
}

validateConfig();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  projectDir,
  allowedDirs,
  llm: {
    provider: llmProvider,
    model: process.env.LLM_MODEL || 'claude-3-5-sonnet-20241022',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    baseUrl: process.env.LLM_BASE_URL
  }
};
