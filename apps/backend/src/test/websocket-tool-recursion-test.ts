import http from 'http';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketHandler } from '../websocket/handler.js';
import { ProjectManager } from '../project/state.js';
import { LLMOrchestrator } from '../llm/orchestrator.js';
import { LLMConfig, Message } from '@ai-video-editor/shared-types';
import { LLMProviderInterface, MCPTool, StreamChunk, ToolCall, ToolExecutor, LLMProviderOptions } from '../llm/types.js';

// Mock provider that returns tool calls on the first call, then text on the second
let streamChatCallCount = 0;

class MockToolProvider implements LLMProviderInterface {
    async getModels(): Promise<string[]> {
        return ['mock-model'];
    }

    async chat(messages: Message[]): Promise<{ content: string; toolCalls?: ToolCall[] }> {
        return { content: 'Mock chat response' };
    }

    async *streamChat(messages: Message[]): AsyncIterable<StreamChunk> {
        streamChatCallCount++;

        if (streamChatCallCount === 1) {
            // First call: return text + a tool call
            yield { done: false, content: 'Let me search for that. ' };
            yield {
                done: false,
                toolCall: {
                    toolName: 'search_images',
                    toolCallId: 'call-1',
                    args: { query: 'sunset' }
                }
            };
            yield { done: true };
        } else if (streamChatCallCount === 2) {
            // Second call (after tool result): return another tool call for multi-turn
            yield { done: false, content: 'Found images. Now downloading. ' };
            yield {
                done: false,
                toolCall: {
                    toolName: 'download_asset',
                    toolCallId: 'call-2',
                    args: { url: 'https://example.com/sunset.jpg' }
                }
            };
            yield { done: true };
        } else {
            // Third call: final text response
            yield { done: false, content: 'Done! The sunset image has been added.' };
            yield { done: true };
        }
    }
}

async function runTest() {
    console.log('=== WebSocket Multi-Turn Tool Recursion Test ===');

    const projectDir = './test-ws-tool-recursion';
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

    const orchestrator = new LLMOrchestrator(mockConfig);
    (orchestrator as any).provider = new MockToolProvider();

    const wsHandler = new WebSocketHandler(wss, projectManager, orchestrator);

    const port = 3097;
    await new Promise<void>(resolve => server.listen(port, resolve));
    console.log(`Test server on port ${port}`);

    try {
        const ws = new WebSocket(`ws://localhost:${port}`);
        await new Promise<void>((resolve, reject) => {
            ws.on('open', resolve);
            ws.on('error', reject);
        });

        streamChatCallCount = 0;

        const responses: any[] = [];
        const toolCalls: any[] = [];
        const toolResults: any[] = [];
        let doneCount = 0;

        const responsePromise = new Promise<void>((resolve) => {
            ws.on('message', (data) => {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'copilot.response') {
                    responses.push(msg.payload);
                    if (msg.payload.done) {
                        doneCount++;
                        setTimeout(() => resolve(), 500);
                    }
                } else if (msg.type === 'copilot.tool_call') {
                    toolCalls.push(msg.payload);
                } else if (msg.type === 'copilot.tool_result') {
                    toolResults.push(msg.payload);
                }
            });
        });

        ws.send(JSON.stringify({
            type: 'copilot.message',
            payload: { content: 'Add a sunset image', model: 'mock-model' }
        }));

        await responsePromise;

        // Verify: streamChat should be called 3 times (initial + 2 tool recursions)
        console.log(`streamChat called ${streamChatCallCount} time(s)`);
        if (streamChatCallCount !== 3) {
            throw new Error(`Expected streamChat to be called 3 times for multi-turn tool use, but was called ${streamChatCallCount} times`);
        }

        // Verify: exactly ONE done:true signal
        if (doneCount !== 1) {
            throw new Error(`Expected 1 done signal, got ${doneCount}`);
        }

        // Verify: 2 tool calls were made
        if (toolCalls.length !== 2) {
            throw new Error(`Expected 2 tool calls, got ${toolCalls.length}: ${JSON.stringify(toolCalls)}`);
        }
        if (toolCalls[0].tool !== 'search_images') {
            throw new Error(`Expected first tool call to be 'search_images', got '${toolCalls[0].tool}'`);
        }
        if (toolCalls[1].tool !== 'download_asset') {
            throw new Error(`Expected second tool call to be 'download_asset', got '${toolCalls[1].tool}'`);
        }

        // Verify: 2 tool results were returned
        if (toolResults.length !== 2) {
            throw new Error(`Expected 2 tool results, got ${toolResults.length}`);
        }

        // Verify: all content was received
        const contentResponses = responses.filter(r => r.content && r.content.length > 0 && !r.done);
        const fullContent = contentResponses.map(r => r.content).join('');
        if (!fullContent.includes('Let me search for that.')) {
            throw new Error(`Missing first turn content in: "${fullContent}"`);
        }
        if (!fullContent.includes('Done! The sunset image has been added.')) {
            throw new Error(`Missing final turn content in: "${fullContent}"`);
        }

        console.log('[PASS] Multi-turn tool recursion works correctly (3 LLM calls)');
        console.log('[PASS] Single done signal sent');
        console.log(`[PASS] 2 tool calls executed: ${toolCalls.map(t => t.tool).join(', ')}`);
        console.log(`[PASS] Full content received: "${fullContent}"`);

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

    console.log('=== All multi-turn tool recursion tests passed ===');
}

runTest().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
