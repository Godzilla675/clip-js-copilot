import OpenAI from 'openai';
import { LLMConfig, Message } from '@ai-video-editor/shared-types';
import { LLMProviderInterface, MCPTool, StreamChunk, ToolCall } from '../types';
import { mcpToolToOpenAIFunction, parseToolCallResult } from '../tool-mapper';

export class OpenAIProvider implements LLMProviderInterface {
  private client: OpenAI;
  private model: string;

  constructor(config: LLMConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
    this.model = config.model;
  }

  async chat(messages: Message[], tools?: MCPTool[]): Promise<{ content: string; toolCalls?: ToolCall[] }> {
    const openaiTools = tools?.map(mcpToolToOpenAIFunction);

    const chatMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content
    }));

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: chatMessages,
      tools: openaiTools,
    });

    const message = response.choices[0].message;
    const content = message.content || '';

    const toolCalls = message.tool_calls?.map(call =>
      parseToolCallResult(call, 'openai')
    ) || [];

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    };
  }

  async *streamChat(messages: Message[], tools?: MCPTool[]): AsyncIterable<StreamChunk> {
    const openaiTools = tools?.map(mcpToolToOpenAIFunction);

    const chatMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content
    }));

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: chatMessages,
      tools: openaiTools,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield { done: false, content: delta.content };
      }
    }

    yield { done: true };
  }
}
