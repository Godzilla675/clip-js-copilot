import OpenAI from 'openai';
import { LLMConfig, Message } from '@ai-video-editor/shared-types';
import { LLMProviderInterface, MCPTool, StreamChunk, ToolCall, ToolExecutor } from '../types';
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

  async chat(messages: Message[], tools?: MCPTool[], executeTool?: ToolExecutor): Promise<{ content: string; toolCalls?: ToolCall[] }> {
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

  async *streamChat(messages: Message[], tools?: MCPTool[], executeTool?: ToolExecutor): AsyncIterable<StreamChunk> {
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

    const toolCallsMap = new Map<number, { id?: string; name?: string; args: string }>();

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield { done: false, content: delta.content };
      }

      if (delta?.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          const index = toolCall.index;
          if (!toolCallsMap.has(index)) {
             toolCallsMap.set(index, { args: '' });
          }
          const current = toolCallsMap.get(index)!;

          if (toolCall.id) current.id = toolCall.id;
          if (toolCall.function?.name) current.name = toolCall.function.name;
          if (toolCall.function?.arguments) current.args += toolCall.function.arguments;
        }
      }

      if (chunk.choices[0]?.finish_reason === 'tool_calls' || chunk.choices[0]?.finish_reason === 'stop') {
        for (const [_, toolCall] of toolCallsMap) {
            if (toolCall.id && toolCall.name) {
                try {
                     const args = JSON.parse(toolCall.args);
                     yield {
                        done: false,
                        toolCall: {
                            toolName: toolCall.name,
                            toolCallId: toolCall.id,
                            args
                        }
                     };
                } catch (e) {
                    console.error('Failed to parse OpenAI tool args:', e);
                }
            }
        }
        toolCallsMap.clear();
      }
    }

    // Yield any remaining tool calls if finish_reason wasn't caught
    for (const [_, toolCall] of toolCallsMap) {
        if (toolCall.id && toolCall.name) {
            try {
                 const args = JSON.parse(toolCall.args);
                 yield {
                    done: false,
                    toolCall: {
                        toolName: toolCall.name,
                        toolCallId: toolCall.id,
                        args
                    }
                 };
            } catch (e) {
                 // Ignore incomplete JSON
            }
        }
    }

    yield { done: true };
  }
}
