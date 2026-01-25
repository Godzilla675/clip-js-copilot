import { v4 as uuidv4 } from 'uuid';
import { MCPTool, ToolCall } from './types';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';

export function mcpToolToAnthropicTool(mcpTool: MCPTool): any {
  return {
    name: mcpTool.name,
    description: mcpTool.description || '',
    input_schema: mcpTool.inputSchema as any, // Anthropic SDK expects explicit JSONSchema types, we can cast
  };
}

export function mcpToolToOpenAIFunction(mcpTool: MCPTool): ChatCompletionTool {
  return {
    type: 'function',
    function: {
      name: mcpTool.name,
      description: mcpTool.description,
      parameters: mcpTool.inputSchema,
    },
  };
}

export function mcpToolToGeminiTool(mcpTool: MCPTool): any {
  return {
    name: mcpTool.name,
    description: mcpTool.description || '',
    parameters: mcpTool.inputSchema,
  };
}

export function parseToolCallResult(result: any, provider: 'anthropic' | 'openai' | 'gemini' | 'custom'): ToolCall {
  if (provider === 'anthropic') {
    // Anthropic tool use block
    return {
      toolName: result.name,
      args: result.input,
      toolCallId: result.id
    };
  } else if (provider === 'openai' || provider === 'custom') {
    // OpenAI tool call object
    return {
      toolName: result.function.name,
      args: typeof result.function.arguments === 'string'
            ? JSON.parse(result.function.arguments)
            : result.function.arguments,
      toolCallId: result.id
    };
  } else if (provider === 'gemini') {
    return {
      toolName: result.name,
      args: result.args,
      toolCallId: uuidv4()
    };
  }
  throw new Error(`Unknown provider: ${provider}`);
}
