export type LLMProvider = 'anthropic' | 'openai' | 'gemini' | 'custom';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface ToolCall {
  toolName: string;
  toolCallId: string;
  args: any;
}

export interface MessageToolResult {
  toolCallId: string;
  toolName: string;
  result: any;
  isError?: boolean;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: MessageToolResult[];
}
