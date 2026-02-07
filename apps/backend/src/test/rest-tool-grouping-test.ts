import express from 'express';
import http from 'http';
import { createCopilotRouter } from '../routes/copilot.js';
import { LLMOrchestrator } from '../llm/orchestrator.js';
import { ProjectManager } from '../project/state.js';
import { LLMConfig, Message } from '@ai-video-editor/shared-types';
import { LLMProviderInterface, MCPTool, StreamChunk, ToolCall, ToolExecutor, LLMProviderOptions } from '../llm/types.js';
import fs from 'fs';

// Track messages passed to chat() to verify tool result grouping
let chatCallCount = 0;
const chatMessageHistory: Message[][] = [];

class MockToolProvider implements LLMProviderInterface {
    async getModels(): Promise<string[]> {
        return ['mock-model'];
    }

    async chat(messages: Message[]): Promise<{ content: string; toolCalls?: ToolCall[] }> {
        chatCallCount++;
        chatMessageHistory.push([...messages]);

        if (chatCallCount === 1) {
            // First call: return two parallel tool calls
            return {
                content: 'I will search for both.',
                toolCalls: [
                    { toolName: 'search_images', toolCallId: 'call-1', args: { query: 'sunset' } },
                    { toolName: 'search_images', toolCallId: 'call-2', args: { query: 'beach' } }
                ]
            };
        } else {
            // Second call: final response
            return { content: 'Found both images!' };
        }
    }

    async *streamChat(messages: Message[]): AsyncIterable<StreamChunk> {
        yield { done: false, content: 'streamed' };
        yield { done: true };
    }
}

async function runTest() {
    console.log('=== REST API Tool Result Grouping Test ===');

    const projectDir = './test-rest-tool-grouping';
    if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true, force: true });
    }

    const mockConfig: LLMConfig = {
        provider: 'copilot',
        apiKey: '',
        model: 'mock-model'
    };

    const orchestrator = new LLMOrchestrator(mockConfig);
    (orchestrator as any).provider = new MockToolProvider();

    const projectManager = new ProjectManager(projectDir);

    const app = express();
    app.use(express.json());
    app.use('/api/copilot', createCopilotRouter(orchestrator, projectManager));

    const server = http.createServer(app);
    const port = 3096;
    await new Promise<void>(resolve => server.listen(port, resolve));
    console.log(`Test server on port ${port}`);

    try {
        chatCallCount = 0;
        chatMessageHistory.length = 0;

        // Test: POST /chat triggers parallel tool calls and groups results
        console.log('--- Test: POST /api/copilot/chat with parallel tool calls ---');
        const chatRes = await fetch(`http://localhost:${port}/api/copilot/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: 'Find sunset and beach images' })
        });

        if (!chatRes.ok) throw new Error(`Chat endpoint failed: ${chatRes.statusText}`);
        const chatData = await chatRes.json();

        // Verify the final response
        if (chatData.content !== 'Found both images!') {
            throw new Error(`Unexpected response: ${chatData.content}`);
        }
        console.log('[PASS] Final response received:', chatData.content);

        // Verify chat was called twice (initial + after tool results)
        if (chatCallCount !== 2) {
            throw new Error(`Expected 2 chat calls, got ${chatCallCount}`);
        }
        console.log('[PASS] Chat called correct number of times:', chatCallCount);

        // Verify the second call has tool results grouped in a SINGLE user message
        const secondCallMessages = chatMessageHistory[1];
        const toolResultMessages = secondCallMessages.filter(
            m => m.role === 'user' && m.toolResults && m.toolResults.length > 0
        );

        if (toolResultMessages.length !== 1) {
            throw new Error(`Expected 1 grouped tool result message, got ${toolResultMessages.length} separate messages`);
        }
        console.log('[PASS] Tool results grouped into single message');

        // Verify the grouped message has both tool results
        const groupedResults = toolResultMessages[0].toolResults!;
        if (groupedResults.length !== 2) {
            throw new Error(`Expected 2 tool results in grouped message, got ${groupedResults.length}`);
        }

        if (groupedResults[0].toolCallId !== 'call-1' || groupedResults[1].toolCallId !== 'call-2') {
            throw new Error(`Tool result IDs don't match: ${JSON.stringify(groupedResults)}`);
        }
        console.log('[PASS] Grouped message contains both tool results with correct IDs');

        console.log('=== All REST API tool grouping tests passed ===');
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    } finally {
        server.close();
        if (fs.existsSync(projectDir)) {
            fs.rmSync(projectDir, { recursive: true, force: true });
        }
    }
}

runTest().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
