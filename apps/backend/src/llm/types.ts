import { Message } from '@ai-video-editor/shared-types';

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

export interface ToolCall {
  toolName: string;
  args: any;
  toolCallId?: string;
}

export interface StreamChunk {
  content?: string;
  toolCall?: Partial<ToolCall>;
  done: boolean;
}

export interface LLMProviderInterface {
  chat(messages: Message[], tools?: MCPTool[]): Promise<{
    content: string;
    toolCalls?: ToolCall[];
  }>;

  streamChat(messages: Message[], tools?: MCPTool[]): AsyncIterable<StreamChunk>;
}
