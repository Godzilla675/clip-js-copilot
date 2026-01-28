import { GoogleGenAI } from '@google/genai';
import { LLMConfig, Message } from '@ai-video-editor/shared-types';
import { LLMProviderInterface, MCPTool, StreamChunk, ToolCall, ToolExecutor, LLMProviderOptions } from '../types';
import { mcpToolToGeminiTool, parseToolCallResult } from '../tool-mapper';

export class GeminiProvider implements LLMProviderInterface {
  private client: GoogleGenAI;
  private model: string;

  constructor(config: LLMConfig) {
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model;
  }

  async getModels(): Promise<string[]> {
      try {
          const list = await this.client.models.list();
          const models: string[] = [];
          // @ts-ignore - Pager is async iterable
          for await (const m of list) {
              if (m.name) {
                  models.push(m.name.replace(/^models\//, ''));
              }
          }
          return models;
      } catch (error) {
          console.error('Failed to fetch Gemini models:', error);
          return [];
      }
  }

  private mapMessagesToContent(messages: Message[]): any[] {
    const contents: any[] = [];

    // We filter out system messages from the contents array as they go into config
    const chatMessages = messages.filter(m => m.role !== 'system');

    let i = 0;
    while (i < chatMessages.length) {
        const m = chatMessages[i];

        if (m.role === 'assistant') {
            const parts: any[] = [];
            if (m.content) {
                parts.push({ text: m.content });
            }
            if (m.toolCalls && m.toolCalls.length > 0) {
                m.toolCalls.forEach(tc => {
                    parts.push({
                        functionCall: {
                            name: tc.toolName,
                            args: tc.args
                        }
                    });
                });
            }

            // If empty parts (e.g. empty content and no tool calls), Gemini might reject.
            if (parts.length === 0) {
                 parts.push({ text: '' });
            }

            contents.push({
                role: 'model',
                parts
            });
            i++;
        } else if (m.role === 'user') {
            // Check if this user message is a tool result
            if (m.toolResults && m.toolResults.length > 0) {
                // Collect consecutive tool result messages
                const parts: any[] = [];

                // Process current message
                m.toolResults.forEach(tr => {
                    parts.push({
                        functionResponse: {
                            name: tr.toolName,
                            response: { result: tr.result }
                        }
                    });
                });

                // Look ahead for more tool result messages
                let j = i + 1;
                while (j < chatMessages.length && chatMessages[j].role === 'user' && chatMessages[j].toolResults && chatMessages[j].toolResults!.length > 0) {
                     chatMessages[j].toolResults!.forEach(tr => {
                        parts.push({
                            functionResponse: {
                                name: tr.toolName,
                                response: { result: tr.result }
                            }
                        });
                    });
                    j++;
                }

                contents.push({
                    role: 'user',
                    parts
                });

                i = j; // Skip processed messages
            } else {
                // Standard user text message
                contents.push({
                    role: 'user',
                    parts: [{ text: m.content }]
                });
                i++;
            }
        } else {
            // Should not happen for 'user' | 'assistant' (system filtered out)
            i++;
        }
    }

    return contents;
  }

  async chat(messages: Message[], tools?: MCPTool[], executeTool?: ToolExecutor, options?: LLMProviderOptions): Promise<{ content: string; toolCalls?: ToolCall[] }> {
    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const contents = this.mapMessagesToContent(messages);

    const geminiTools = tools?.map(mcpToolToGeminiTool);

    const config: any = {
        tools: geminiTools ? [{ functionDeclarations: geminiTools }] : undefined,
    };
    if (systemMessage) {
        config.systemInstruction = systemMessage;
    }

    const response = await this.client.models.generateContent({
      model: options?.model || this.model,
      contents,
      config
    });

    const content = response.text ? response.text : '';

    const toolCallsRaw = response.functionCalls;
    const toolCalls = toolCallsRaw?.map((call: any) => parseToolCallResult(call, 'gemini'));

    return {
      content,
      toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined
    };
  }

  async *streamChat(messages: Message[], tools?: MCPTool[], executeTool?: ToolExecutor, options?: LLMProviderOptions): AsyncIterable<StreamChunk> {
    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const contents = this.mapMessagesToContent(messages);

    const geminiTools = tools?.map(mcpToolToGeminiTool);

    const config: any = {
        tools: geminiTools ? [{ functionDeclarations: geminiTools }] : undefined,
    };
    if (systemMessage) {
        config.systemInstruction = systemMessage;
    }

    const stream = await this.client.models.generateContentStream({
      model: options?.model || this.model,
      contents,
      config
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        yield { done: false, content: text };
      }

      const fCalls = chunk.functionCalls;
      if (fCalls && fCalls.length > 0) {
        for (const call of fCalls) {
          yield {
            done: false,
            toolCall: parseToolCallResult(call, 'gemini')
          };
        }
      }
    }

    yield { done: true };
  }
}
