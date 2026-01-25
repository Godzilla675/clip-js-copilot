import { GoogleGenAI } from '@google/genai';
import { LLMConfig, Message } from '@ai-video-editor/shared-types';
import { LLMProviderInterface, MCPTool, StreamChunk, ToolCall } from '../types';
import { mcpToolToGeminiTool, parseToolCallResult } from '../tool-mapper';

export class GeminiProvider implements LLMProviderInterface {
  private client: GoogleGenAI;
  private model: string;

  constructor(config: LLMConfig) {
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model;
  }

  async chat(messages: Message[], tools?: MCPTool[]): Promise<{ content: string; toolCalls?: ToolCall[] }> {
    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const contents = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const geminiTools = tools?.map(mcpToolToGeminiTool);

    const config: any = {
        tools: geminiTools ? [{ functionDeclarations: geminiTools }] : undefined,
    };
    if (systemMessage) {
        config.systemInstruction = systemMessage;
    }

    const response = await this.client.models.generateContent({
      model: this.model,
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

  async *streamChat(messages: Message[], tools?: MCPTool[]): AsyncIterable<StreamChunk> {
    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const contents = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const geminiTools = tools?.map(mcpToolToGeminiTool);

    const config: any = {
        tools: geminiTools ? [{ functionDeclarations: geminiTools }] : undefined,
    };
    if (systemMessage) {
        config.systemInstruction = systemMessage;
    }

    const stream = await this.client.models.generateContentStream({
      model: this.model,
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
