import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const projectDir = process.env.PROJECT_DIR || path.join(process.cwd(), 'projects');
const allowedDirs = (process.env.ALLOWED_DIRS || '').split(',').map(d => d.trim()).filter(Boolean);

// Ensure project dir is in allowed dirs
if (!allowedDirs.includes(projectDir)) {
    allowedDirs.push(projectDir);
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  projectDir,
  allowedDirs,
  llm: {
    provider: (process.env.LLM_PROVIDER || 'anthropic') as 'anthropic' | 'openai' | 'gemini' | 'custom',
    model: process.env.LLM_MODEL || 'claude-3-5-sonnet-20241022',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    baseUrl: process.env.LLM_BASE_URL
  }
};
