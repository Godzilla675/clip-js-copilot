import { LLMConfig, Message } from '@ai-video-editor/shared-types';
import { LLMProviderInterface, MCPTool, StreamChunk, ToolCall, ToolExecutor, LLMProviderOptions } from './types';
import { AnthropicProvider } from './providers/anthropic';
import { OpenAIProvider } from './providers/openai';
import { CustomProvider } from './providers/custom';
import { GeminiProvider } from './providers/gemini';
import { CopilotProvider } from './providers/copilot';

export class LLMOrchestrator {
  private provider: LLMProviderInterface;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.provider = this.createProvider(config);
  }

  private createProvider(config: LLMConfig): LLMProviderInterface {
    switch (config.provider) {
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'openai':
        return new OpenAIProvider(config);
      case 'gemini':
        return new GeminiProvider(config);
      case 'custom':
        return new CustomProvider(config);
      case 'copilot':
        return new CopilotProvider(config);
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }

  setProvider(config: LLMConfig): void {
    this.config = config;
    this.provider = this.createProvider(config);
  }

  async getModels(): Promise<string[]> {
    return this.provider.getModels();
  }

  async chat(messages: Message[], tools?: MCPTool[], executeTool?: ToolExecutor, options?: LLMProviderOptions): Promise<{
    content: string
    toolCalls?: ToolCall[]
  }> {
    return this.provider.chat(messages, tools, executeTool, options);
  }

  async *streamChat(messages: Message[], tools?: MCPTool[], executeTool?: ToolExecutor, options?: LLMProviderOptions): AsyncIterable<StreamChunk> {
    yield* this.provider.streamChat(messages, tools, executeTool, options);
  }
}
