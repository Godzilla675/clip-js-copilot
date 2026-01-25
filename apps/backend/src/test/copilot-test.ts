import WebSocket from 'ws';
import { randomUUID } from 'crypto';

const WS_URL = 'ws://localhost:3001';

interface TestScenario {
    name: string;
    messages: string[];
    expectedTools?: string[];
}

const scenarios: TestScenario[] = [
    {
        name: 'Basic Chat',
        messages: ['Hello, are you there?'],
    },
    {
        name: 'Asset Search',
        messages: ['Find me a video of a cat.'],
        expectedTools: ['search_videos']
    },
    {
        name: 'Code Runner',
        messages: ['Run an ffmpeg command to check version.'],
        expectedTools: ['run_ffmpeg_command']
    },
    // We can't easily test add_clip without a valid assetId, but we can try to trigger the intent.
    // If the previous search failed, this might not work as expected in a real flow.
    // So we'll keep it simple for now.
];

async function runTest() {
    console.log('Starting Copilot Test...');

    // Allow server to start up
    await new Promise(resolve => setTimeout(resolve, 2000));

    const ws = new WebSocket(WS_URL);

    await new Promise<void>((resolve, reject) => {
        ws.on('open', () => {
            console.log('Connected to WebSocket');
            resolve();
        });
        ws.on('error', (err) => {
            console.error('WebSocket error:', err);
            reject(err);
        });
    });

    const projectId = randomUUID(); // Simulate a project

    for (const scenario of scenarios) {
        console.log(`\n--- Running Scenario: ${scenario.name} ---`);

        for (const content of scenario.messages) {
            console.log(`User: ${content}`);
            ws.send(JSON.stringify({
                type: 'copilot.message',
                payload: {
                    content,
                    projectId
                }
            }));

            // Wait for response sequence
            // We expect: copilot.tool_call (optional), copilot.tool_result (optional), copilot.response
            await waitForResponse(ws);
        }
    }

    ws.close();
    console.log('\nTest Complete.');
}

async function waitForResponse(ws: WebSocket) {
    return new Promise<void>((resolve) => {
        const handler = (data: any) => {
            const message = JSON.parse(data.toString());

            if (message.type === 'copilot.response') {
                process.stdout.write(message.payload.content || '');
                if (message.payload.done) {
                    process.stdout.write('\n');
                    ws.off('message', handler);
                    resolve();
                }
            } else if (message.type === 'copilot.tool_call') {
                console.log(`\n[Tool Call] ${message.payload.tool} args: ${JSON.stringify(message.payload.args)}`);
            } else if (message.type === 'copilot.tool_result') {
                console.log(`\n[Tool Result] ${message.payload.tool} result: ${JSON.stringify(message.payload.result).substring(0, 200)}...`);
            }
        };

        ws.on('message', handler);
    });
}

runTest().catch(console.error);
