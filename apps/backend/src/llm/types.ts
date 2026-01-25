import { Message, ToolCall } from '@ai-video-editor/shared-types';

export { ToolCall };

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, any>;
    required?: string[];
    [key: string]: any;
  };
}

export interface StreamChunk {
  content?: string;
  toolCall?: ToolCall;
  done: boolean;
}

export interface LLMProviderInterface {
  chat(messages: Message[], tools?: MCPTool[]): Promise<{
    content: string;
    toolCalls?: ToolCall[];
  }>;

  streamChat(messages: Message[], tools?: MCPTool[]): AsyncIterable<StreamChunk>;
}
