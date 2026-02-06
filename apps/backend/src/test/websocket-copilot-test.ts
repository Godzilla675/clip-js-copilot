import http from 'http';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketHandler } from '../websocket/handler.js';
import { ProjectManager } from '../project/state.js';
import { LLMOrchestrator } from '../llm/orchestrator.js';
import { LLMConfig, Message } from '@ai-video-editor/shared-types';
import { LLMProviderInterface, MCPTool, StreamChunk, ToolCall, ToolExecutor, LLMProviderOptions } from '../llm/types.js';

// Track how many times streamChat is called to detect duplicate LLM calls
let streamChatCallCount = 0;

class MockProvider implements LLMProviderInterface {
    async getModels(): Promise<string[]> {
        return ['mock-model'];
    }

    async chat(messages: Message[]): Promise<{ content: string; toolCalls?: ToolCall[] }> {
        return { content: 'Mock chat response' };
    }

    async *streamChat(messages: Message[]): AsyncIterable<StreamChunk> {
        streamChatCallCount++;
        yield { done: false, content: 'Hello from mock' };
        yield { done: true };
    }
}

async function runTest() {
    console.log('=== WebSocket Copilot Duplicate Response Test ===');

    const projectDir = './test-ws-projects';
    const fs = await import('fs');
    if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true, force: true });
    }

    const app = express();
    const server = http.createServer(app);
    const wss = new WebSocketServer({ server });
    const projectManager = new ProjectManager(projectDir);

    const mockConfig: LLMConfig = {
        provider: 'copilot',
        apiKey: '',
        model: 'mock-model'
    };

    // Create orchestrator with mock provider
    const orchestrator = new LLMOrchestrator(mockConfig);
    // Override the provider with our mock
    (orchestrator as any).provider = new MockProvider();

    const wsHandler = new WebSocketHandler(wss, projectManager, orchestrator);

    const port = 3099;
    await new Promise<void>(resolve => server.listen(port, resolve));
    console.log(`Test server on port ${port}`);

    try {
        // Connect WebSocket
        const ws = new WebSocket(`ws://localhost:${port}`);
        await new Promise<void>((resolve, reject) => {
            ws.on('open', resolve);
            ws.on('error', reject);
        });

        // Reset counter
        streamChatCallCount = 0;

        // Collect all responses
        const responses: any[] = [];
        let doneCount = 0;

        const responsePromise = new Promise<void>((resolve) => {
            ws.on('message', (data) => {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'copilot.response') {
                    responses.push(msg.payload);
                    if (msg.payload.done) {
                        doneCount++;
                        // Give a short delay to catch any duplicate responses
                        setTimeout(() => resolve(), 500);
                    }
                }
            });
        });

        // Send a copilot message
        ws.send(JSON.stringify({
            type: 'copilot.message',
            payload: { content: 'Hello', model: 'mock-model' }
        }));

        await responsePromise;

        // Verify: streamChat should be called exactly ONCE (no duplicate from runAgentLoop)
        console.log(`streamChat called ${streamChatCallCount} time(s)`);
        if (streamChatCallCount !== 1) {
            throw new Error(`Expected streamChat to be called 1 time, but was called ${streamChatCallCount} times (duplicate response bug)`);
        }

        // Verify: exactly ONE done:true signal
        if (doneCount !== 1) {
            throw new Error(`Expected 1 done signal, got ${doneCount}`);
        }

        // Verify: content responses contain expected text
        const contentResponses = responses.filter(r => r.content && r.content.length > 0 && !r.done);
        if (contentResponses.length === 0) {
            throw new Error('No content responses received');
        }

        const fullContent = contentResponses.map(r => r.content).join('');
        if (!fullContent.includes('Hello from mock')) {
            throw new Error(`Unexpected content: "${fullContent}"`);
        }

        console.log('[PASS] No duplicate LLM calls - single response received');
        console.log('[PASS] Single done signal sent');
        console.log(`[PASS] Content received: "${fullContent}"`);

        ws.close();
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    } finally {
        server.close();
        const fs = await import('fs');
        if (fs.existsSync(projectDir)) {
            fs.rmSync(projectDir, { recursive: true, force: true });
        }
    }

    console.log('=== All WebSocket copilot tests passed ===');
}

runTest().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
