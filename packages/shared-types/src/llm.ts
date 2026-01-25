export type LLMProvider = 'anthropic' | 'openai' | 'gemini' | 'custom';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
