import Anthropic from '@anthropic-ai/sdk';
import { LLMConfig, Message } from '@ai-video-editor/shared-types';
import { LLMProviderInterface, MCPTool, StreamChunk, ToolCall } from '../types';
import { mcpToolToAnthropicTool, parseToolCallResult } from '../tool-mapper';

export class AnthropicProvider implements LLMProviderInterface {
  private client: Anthropic;
  private model: string;

  constructor(config: LLMConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
    this.model = config.model;
  }

  async chat(messages: Message[], tools?: MCPTool[]): Promise<{ content: string; toolCalls?: ToolCall[] }> {
    const anthropicTools = tools?.map(mcpToolToAnthropicTool);

    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const chatMessages = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    const response = await this.client.messages.create({
      model: this.model,
      messages: chatMessages,
      system: systemMessage,
      tools: anthropicTools,
      max_tokens: 4096,
    } as any) as any;

    const content = response.content
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.type === 'text' ? c.text : '')
      .join('');

    const toolUseBlocks = response.content.filter((c: any) => c.type === 'tool_use');

    const toolCalls = toolUseBlocks.map((block: any) =>
      parseToolCallResult(block, 'anthropic')
    );

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    };
  }

  async *streamChat(messages: Message[], tools?: MCPTool[]): AsyncIterable<StreamChunk> {
    const anthropicTools = tools?.map(mcpToolToAnthropicTool);

    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const chatMessages = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    const stream = await this.client.messages.create({
      model: this.model,
      messages: chatMessages,
      system: systemMessage,
      tools: anthropicTools,
      max_tokens: 4096,
      stream: true,
    } as any) as any;

    let currentToolId: string | null = null;
    let currentToolName: string | null = null;
    let currentToolInput = '';

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_start' && chunk.content_block?.type === 'tool_use') {
        currentToolId = chunk.content_block.id;
        currentToolName = chunk.content_block.name;
        currentToolInput = '';
      } else if (chunk.type === 'content_block_delta' && chunk.delta.type === 'input_json_delta') {
        currentToolInput += chunk.delta.partial_json;
      } else if (chunk.type === 'content_block_stop') {
        if (currentToolId && currentToolName) {
          try {
            const args = JSON.parse(currentToolInput);
            yield {
              done: false,
              toolCall: {
                toolName: currentToolName,
                toolCallId: currentToolId,
                args
              }
            };
          } catch (e) {
            console.error('Failed to parse tool arguments:', e);
          }
          currentToolId = null;
          currentToolName = null;
          currentToolInput = '';
        }
      } else if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield { done: false, content: chunk.delta.text };
      }
    }

    yield { done: true };
  }
}
