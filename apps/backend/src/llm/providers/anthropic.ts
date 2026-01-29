import Anthropic from '@anthropic-ai/sdk';
import { LLMConfig, Message } from '@ai-video-editor/shared-types';
import { LLMProviderInterface, MCPTool, StreamChunk, ToolCall, ToolExecutor, LLMProviderOptions } from '../types';
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

  async getModels(): Promise<string[]> {
    try {
      const list = await (this.client as any).models.list();
      return list.data.map((m: any) => m.id);
    } catch (error) {
      console.error('Failed to fetch Anthropic models:', error);
      return [];
    }
  }

  private formatMessages(messages: Message[]): any[] {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => {
        if (m.role === 'user') {
          const content: any[] = [];

          if (m.content) {
            content.push({ type: 'text', text: m.content });
          }

          if (m.toolResults) {
            m.toolResults.forEach(tr => {
              content.push({
                type: 'tool_result',
                tool_use_id: tr.toolCallId,
                content: typeof tr.result === 'string'
                  ? tr.result
                  : JSON.stringify(tr.result),
                is_error: tr.isError
              });
            });
          }

          if (content.length === 0) return { role: 'user', content: '' };
          if (content.length === 1 && content[0].type === 'text') {
             return { role: 'user', content: content[0].text };
          }

          return {
            role: 'user',
            content
          };
        } else {
          // Assistant
          const content: any[] = [];
          if (m.content) {
            content.push({ type: 'text', text: m.content });
          }
          if (m.toolCalls) {
            m.toolCalls.forEach(tc => {
              content.push({
                type: 'tool_use',
                id: tc.toolCallId,
                name: tc.toolName,
                input: tc.args
              });
            });
          }
          return {
            role: 'assistant',
            content: content.length === 1 && content[0].type === 'text'
              ? content[0].text
              : content
          };
        }
      });
  }

  async chat(messages: Message[], tools?: MCPTool[], executeTool?: ToolExecutor, options?: LLMProviderOptions): Promise<{ content: string; toolCalls?: ToolCall[] }> {
    const anthropicTools = tools?.map(mcpToolToAnthropicTool);
    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const chatMessages = this.formatMessages(messages);

    const response = await this.client.messages.create({
      model: options?.model || this.model,
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

  async *streamChat(messages: Message[], tools?: MCPTool[], executeTool?: ToolExecutor, options?: LLMProviderOptions): AsyncIterable<StreamChunk> {
    const anthropicTools = tools?.map(mcpToolToAnthropicTool);
    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const chatMessages = this.formatMessages(messages);

    const stream = await this.client.messages.create({
      model: options?.model || this.model,
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
