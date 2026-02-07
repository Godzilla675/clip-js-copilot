import express from 'express';
import http from 'http';
import { createCopilotRouter } from '../routes/copilot.js';
import { LLMOrchestrator } from '../llm/orchestrator.js';
import { ProjectManager } from '../project/state.js';
import { LLMConfig, Message } from '@ai-video-editor/shared-types';
import { LLMProviderInterface, MCPTool, StreamChunk, ToolCall, ToolExecutor, LLMProviderOptions } from '../llm/types.js';
import fs from 'fs';

class MockProvider implements LLMProviderInterface {
    async getModels(): Promise<string[]> {
        return ['mock-model-a', 'mock-model-b'];
    }

    async chat(messages: Message[]): Promise<{ content: string; toolCalls?: ToolCall[] }> {
        const userMsg = messages.find(m => m.role === 'user');
        return { content: `Mock response to: ${userMsg?.content || 'unknown'}` };
    }

    async *streamChat(messages: Message[]): AsyncIterable<StreamChunk> {
        yield { done: false, content: 'streamed' };
        yield { done: true };
    }
}

async function runTest() {
    console.log('=== REST API Copilot Chat Test ===');

    const projectDir = './test-rest-projects';
    if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true, force: true });
    }

    const mockConfig: LLMConfig = {
        provider: 'copilot',
        apiKey: '',
        model: 'mock-model'
    };

    const orchestrator = new LLMOrchestrator(mockConfig);
    (orchestrator as any).provider = new MockProvider();

    const projectManager = new ProjectManager(projectDir);

    const app = express();
    app.use(express.json());
    app.use('/api/copilot', createCopilotRouter(orchestrator, projectManager));

    const server = http.createServer(app);
    const port = 3098;
    await new Promise<void>(resolve => server.listen(port, resolve));
    console.log(`Test server on port ${port}`);

    try {
        // Test 1: GET /models
        console.log('--- Test 1: GET /api/copilot/models ---');
        const modelsRes = await fetch(`http://localhost:${port}/api/copilot/models`);
        if (!modelsRes.ok) throw new Error(`Models endpoint failed: ${modelsRes.statusText}`);
        const models = await modelsRes.json();
        if (!Array.isArray(models) || models.length !== 2) {
            throw new Error(`Expected 2 models, got: ${JSON.stringify(models)}`);
        }
        console.log('[PASS] GET /models returns correct models:', models);

        // Test 2: POST /chat returns a response with content
        console.log('--- Test 2: POST /api/copilot/chat ---');
        const chatRes = await fetch(`http://localhost:${port}/api/copilot/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: 'Hello AI' })
        });
        if (!chatRes.ok) throw new Error(`Chat endpoint failed: ${chatRes.statusText}`);
        const chatData = await chatRes.json();

        if (!chatData.content) {
            throw new Error(`Chat response missing content field: ${JSON.stringify(chatData)}`);
        }
        if (!chatData.content.includes('Hello AI')) {
            throw new Error(`Unexpected chat response: ${chatData.content}`);
        }
        console.log('[PASS] POST /chat returns response with content:', chatData.content);

        // Test 3: POST /chat with model parameter
        console.log('--- Test 3: POST /api/copilot/chat with model ---');
        const chatRes2 = await fetch(`http://localhost:${port}/api/copilot/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: 'Test with model', model: 'mock-model-b' })
        });
        if (!chatRes2.ok) throw new Error(`Chat endpoint failed: ${chatRes2.statusText}`);
        const chatData2 = await chatRes2.json();
        if (!chatData2.content) {
            throw new Error(`Chat response missing content: ${JSON.stringify(chatData2)}`);
        }
        console.log('[PASS] POST /chat with model parameter works:', chatData2.content);

        console.log('=== All REST API copilot tests passed ===');
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
