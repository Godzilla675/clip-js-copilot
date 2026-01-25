import { CopilotProvider } from '../llm/providers/copilot.js';
import { LLMConfig, Message } from '@ai-video-editor/shared-types';

// Mock CopilotClient and Session
class MockCopilotSession {
    constructor(public options: any) {}

    async sendAndWait(options: any) {
        console.log('[MockSession] sendAndWait called with prompt:', options.prompt);

        // Check if we have tools and simulate a tool call
        if (this.options.tools && this.options.tools.length > 0) {
            const tool = this.options.tools.find((t: any) => t.name === 'test_tool');
            if (tool) {
                 console.log('[MockSession] Executing test_tool handler...');
                 const result = await tool.handler({ arg: 'mock_value' });
                 console.log('[MockSession] Tool handler result:', result);
            }
        }

        return {
            type: 'assistant.message',
            data: { content: 'Mock response content' }
        };
    }

    async destroy() {
        console.log('[MockSession] destroy called');
    }

    on(handler: any) {
        // No-op for now unless we test streaming
        return () => {};
    }
}

class MockCopilotClient {
    async createSession(options: any) {
        console.log('[MockClient] createSession called with model:', options.model);
        if (options.systemMessage) {
            console.log('[MockClient] System message:', options.systemMessage.content);
        }
        return new MockCopilotSession(options);
    }
}

async function runTest() {
    console.log('Starting CopilotProvider test...');

    const config: LLMConfig = {
        provider: 'copilot',
        model: 'gpt-4-test',
        apiKey: 'dummy',
    };

    const mockClient = new MockCopilotClient() as any;
    const provider = new CopilotProvider(config, mockClient);

    const messages: Message[] = [
        { role: 'system', content: 'You are a test bot.' },
        { role: 'user', content: 'Hello' }
    ];

    const tools = [{
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: { type: 'object' }
    }] as any;

    const executeTool = async (name: string, args: any) => {
        console.log(`[ToolExecutor] Called tool: ${name} with args:`, args);
        return { success: true };
    };

    console.log('--- Testing chat() ---');
    const response = await provider.chat(messages, tools, executeTool);
    console.log('Chat response:', response);

    if (response.content !== 'Mock response content') {
        throw new Error('Unexpected response content');
    }

    console.log('--- Testing streamChat() ---');
    const stream = provider.streamChat(messages, tools, executeTool);
    for await (const chunk of stream) {
        console.log('Stream chunk:', chunk);
    }

    console.log('Test completed successfully.');
}

runTest().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
